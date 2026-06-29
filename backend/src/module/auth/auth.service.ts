import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload, RefreshTokenCreationResult, RefreshTokenPayload, TokenMetadata, Tokens } from './types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v7 as uuidv7 } from 'uuid';
import { UserPayload } from '@common/interfaces/user-payload.interface';
import { TokenStatus } from '@common/enums/token-status.enum';
import { Category, Prisma } from 'src/generated/prisma/client';
import { ExternalAuthService } from './external-auth.service';
import { UserPayloadRequest } from '@common/interfaces/auth-request.interface';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly USER_SELECT: Prisma.UserSelect = {
    id: true,
    ftsInteractionUsersId: true,
    role: true,
    ftsPositionRole: true,
    ftsFunctionRole: true,
    ftsBranchType: true,
    fullName: true,
    shortName: true,
    description: true,
    isDeleted: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private externalAuth: ExternalAuthService,
  ) { }

  private createTokenHash(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }




  async verifyUser(
    login: string,
    password: string,
    metadata?: TokenMetadata,
  ): Promise<{
    user?: UserPayload;
    external?: { accessToken: string; refreshToken: string };
    errors: string[];
  }> {
    const errors: string[] = [];

    const authData = await this.prisma.user.findFirst({
      where: { login },
      select: { 
        ...this.USER_SELECT,
        passwordHash: true,
      },
    });

    if (!authData || !authData.passwordHash) {
      const ext = await this.externalAuth.login(login, password, metadata);
      
      const user = await this.prisma.user.findUnique({
        where: { ftsInteractionUsersId: ext.externalUserId },
        select: this.USER_SELECT,
      });

      if (!user) {
        errors.push('Пользователь не зарегистрирован');
        return { errors };
      }

      return {
        user,
        external: { accessToken: ext.accessToken, refreshToken: ext.refreshToken },
        errors,
      };
    }

    const { passwordHash, ...user } = authData;

    try {
      const passwordMatch = await argon2.verify(
        passwordHash!,
        password
      );

      if (!passwordMatch) {
        errors.push('Неверные логин, Samoware (почта) или пароль');
        return { errors };
      }
    } catch (error) {
      errors.push('Ошибка при проверке пользователя');
      return { errors };
    }

    return {
      user,
      errors,
    };
  }








































  async login(
    user: UserPayload,
    request: FastifyRequest,
    reply: FastifyReply,
    isRefresh: boolean = false
  ): Promise<{ tokens?: Tokens; errors: string[] }> {
    const errors: string[] = [];

    let refreshTokenCreationResult: RefreshTokenCreationResult;

    const metadata = {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };

    if (isRefresh) {
      const currentRefreshToken = request.cookies?.Refresh;
      if (!currentRefreshToken) {
        errors.push('Refresh token не найден для ротации');
        return { errors };
      }
      refreshTokenCreationResult = await this.rotateToken(currentRefreshToken, metadata);
      this.logger.log(`Токен ротирован для пользователя ${user.id}`);
    } else {
      // refreshTokenCreationResult = await this.createFirstToken(user.id, metadata);

      const externalRefreshToken =
        (request as UserPayloadRequest).externalAuth?.refreshToken;

      refreshTokenCreationResult = await this.createFirstToken(
        user.id,
        metadata,
        externalRefreshToken,
      );

      this.logger.log(`Создана новая пара токенов для пользователя ${user.id}`);
    }

    const accessTokenExpirationMs = this.configService.get<number>(
      'JWT_ACCESS_TOKEN_EXPIRATION_MS',
      15 * 60 * 1000
    );

    const now = Date.now();
    const nowInSeconds = Math.floor(now / 1000);

    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      iat: nowInSeconds,
      nbf: nowInSeconds,
      role: user.role,
      ftsBranchType: user.ftsBranchType,
      isDeleted: user.isDeleted,
    };

    const accessToken = this.jwtService.sign(
      accessTokenPayload,
      {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: `${accessTokenExpirationMs}ms`,
      }
    );

    if (!isRefresh) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    const expiresAccessToken = new Date(now + accessTokenExpirationMs);
    const expiresRefreshToken = new Date(
      now + this.configService.get<number>(
        'JWT_REFRESH_TOKEN_EXPIRATION_MS',
        7 * 24 * 60 * 60 * 1000
      )
    );

    reply.setCookie('Authentication', accessToken, {
      httpOnly: true,
      secure: false,
      path: '/',
      sameSite: 'strict',
      expires: expiresAccessToken,
    });

    reply.setCookie('Refresh', refreshTokenCreationResult.refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/',
      sameSite: 'strict',
      expires: expiresRefreshToken,
    });

    return {
      tokens: {
        accessToken,
        refreshToken: refreshTokenCreationResult.refreshToken,
      },
      errors,
    };
  }


  async createFirstToken(
    userId: number,
    metadata?: TokenMetadata,
    externalRefreshToken?: string,
  ): Promise<RefreshTokenCreationResult> {
    const familyId = uuidv7();
    const refreshTokenId = uuidv7();

    const refreshTokenExpirationMs = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRATION_MS',
      7 * 24 * 60 * 60 * 1000
    );

    const now = Date.now();
    const nowInSeconds = Math.floor(now / 1000);

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      iat: nowInSeconds,
      nbf: nowInSeconds,
      jti: refreshTokenId
    };

    const refreshToken = this.jwtService.sign(
      refreshTokenPayload,
      {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${refreshTokenExpirationMs}ms`,
      }
    );

    const tokenHash = this.createTokenHash(refreshToken);

    const activeStatus = await this.prisma.type.findFirst({
      where: {
        code: TokenStatus.TOKEN_ACTIVE,
        category: Category.token_status
      },
      select: { id: true }
    });

    if (!activeStatus) {
      throw new Error('Статус токена "TOKEN_ACTIVE" не найден в базе данных');
    }

    const expiresAt = new Date(now + refreshTokenExpirationMs);

    await this.prisma.refreshToken.create({
      data: {
        jti: refreshTokenId,
        tokenHash,
        familyId,
        userId,
        statusTypeId: activeStatus.id,
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        rotationCount: 0,
        externalRefreshToken: externalRefreshToken ?? null,
      },
    });

    return { refreshToken };
  }

  async rotateToken(
    currentRefreshToken: string,
    metadata?: TokenMetadata
  ): Promise<RefreshTokenCreationResult> {
  const currentTokenHash = this.createTokenHash(currentRefreshToken);

  // 1. Определяем тип сессии ДО транзакции
  const existing = await this.prisma.refreshToken.findFirst({
    where: { tokenHash: currentTokenHash },
    select: { externalRefreshToken: true },
  });

  // 2. Пользователя нет в текущей БД -> ротация через API другого сервиса.
  //    Успешный ответ внешнего сервиса = валидация внешнего токена.
  let newExternalRefreshToken: string | null = null;
  if (existing?.externalRefreshToken) {
    const ext = await this.externalAuth.refresh(
      existing.externalRefreshToken,
      metadata,
    );
    newExternalRefreshToken = ext.refreshToken;
  }

    const statuses = await this.prisma.type.findMany({
      where: {
        code: { in: [TokenStatus.TOKEN_ACTIVE, TokenStatus.TOKEN_REVOKED] },
        category: Category.token_status
      },
      select: { id: true, code: true }
    });

    const activeStatusId = statuses.find(s => s.code === TokenStatus.TOKEN_ACTIVE)?.id;
    const revokedStatusId = statuses.find(s => s.code === TokenStatus.TOKEN_REVOKED)?.id;

    if (!activeStatusId || !revokedStatusId) {
      throw new Error('Token statuses not found');
    }

    const transaction = await this.prisma.$transaction(async (prisma) => {
      const currentTokenRecord = await prisma.refreshToken.findFirst({
        where: {
          tokenHash: currentTokenHash,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: true,
        },
      });

      if (!currentTokenRecord) {
        throw new UnauthorizedException('Недействительный или просроченный refresh токен');
      }

      if (currentTokenRecord.statusTypeId !== activeStatusId) {
        throw new UnauthorizedException('Токен не активен');
      }

      if (currentTokenRecord.usedAt) {
        await this.revokeTokenFamily(currentTokenRecord.familyId);
        throw new UnauthorizedException('Обнаружено повторное использование токена');
      }

      const updated = await prisma.refreshToken.updateMany({
        where: {
          id: currentTokenRecord.id,
          usedAt: null,
        },
        data: {
          statusTypeId: revokedStatusId,
          usedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        await this.revokeTokenFamily(currentTokenRecord.familyId);
        throw new UnauthorizedException('Токен уже использован');
      }

      const newTokenJti = uuidv7();

      const refreshTokenExpirationMs = this.configService.get<number>(
        'JWT_REFRESH_TOKEN_EXPIRATION_MS',
        7 * 24 * 60 * 60 * 1000
      );

      const now = Date.now();
      const nowInSeconds = Math.floor(now / 1000);

      const refreshTokenPayload: RefreshTokenPayload = {
        sub: currentTokenRecord.userId,
        iat: nowInSeconds,
        nbf: nowInSeconds,
        jti: newTokenJti
      };

      const newRefreshToken = this.jwtService.sign(
        refreshTokenPayload,
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: `${refreshTokenExpirationMs}ms`,
        }
      );

      const newTokenHash = this.createTokenHash(newRefreshToken);
      const expiresAt = new Date(now + refreshTokenExpirationMs);

      await prisma.refreshToken.create({
        data: {
          jti: newTokenJti,
          tokenHash: newTokenHash,
          familyId: currentTokenRecord.familyId,
          parentTokenHash: currentTokenRecord.tokenHash,
          userId: currentTokenRecord.userId,
          statusTypeId: activeStatusId,
          expiresAt,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          rotationCount: currentTokenRecord.rotationCount + 1,
          externalRefreshToken: newExternalRefreshToken,
        },
      });

      return {
        refreshToken: newRefreshToken,
        familyId: currentTokenRecord.familyId,
        userId: currentTokenRecord.userId
      };
    });

    return { refreshToken: transaction.refreshToken };
  }

  async verifyRefreshToken(userId: number, refreshToken: string): Promise<UserPayload> {
    const tokenHash = this.createTokenHash(refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        statusType: true,
        user: {
          select: this.USER_SELECT,
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Токен не найден или истек');
    }

    if (tokenRecord.statusType.code !== TokenStatus.TOKEN_ACTIVE) {
      throw new UnauthorizedException(`Токен ${tokenRecord.statusType.name.toLowerCase()}`);
    }

    return tokenRecord.user;
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    const revokedStatus = await this.prisma.type.findFirst({
      where: { code: TokenStatus.TOKEN_REVOKED, category: Category.token_status },
      select: { id: true }
    });

    if (!revokedStatus) {
      throw new Error('Token status "TOKEN_REVOKED" not found');
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        statusType: { code: TokenStatus.TOKEN_ACTIVE }
      },
      data: {
        statusTypeId: revokedStatus.id,
      },
    });
  }

  async revokeToken(token: string): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    const tokenHash = this.createTokenHash(token);

    const revokedStatus = await this.prisma.type.findFirst({
      where: { code: TokenStatus.TOKEN_REVOKED, category: Category.token_status },
      select: { id: true }
    });

    if (!revokedStatus) {
      errors.push('Статус "TOKEN_REVOKED" не найден');
      return { errors };
    }

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: {
        statusTypeId: revokedStatus.id,
      },
    });

    return {
      errors
    };
  }

  async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    const refreshToken = request.cookies?.Refresh;

    if (refreshToken) {
      await this.revokeToken(refreshToken);
    }

    reply.clearCookie('Authentication', { path: '/' });
    reply.clearCookie('Refresh', { path: '/' });

    return {
      errors
    };
  }

  async cleanupExpiredTokens(): Promise<{ deleted: number }> {
    try {
      const now = new Date();

      let totalDeleted = 0;
      const BATCH_SIZE = 1000;
      const PAUSE_MS = 100;

      this.logger.log(`Starting cleanup of expired tokens (expiresAt < ${now.toISOString()})`);

      while (true) {
        const startTime = Date.now();

        const result = await this.prisma.refreshToken.deleteMany({
          where: {
            expiresAt: { lt: now }
          },
          limit: BATCH_SIZE,
        });

        const batchDeleted = result.count;
        totalDeleted += batchDeleted;

        const duration = Date.now() - startTime;

        if (batchDeleted === 0) {
          this.logger.debug(`No more expired tokens to delete, total deleted: ${totalDeleted}`);
          break;
        }

        this.logger.debug(`Deleted batch: ${batchDeleted} expired tokens in ${duration}ms, total: ${totalDeleted}`);

        if (batchDeleted === BATCH_SIZE) {
          await this.sleep(PAUSE_MS);
        }
      }

      this.logger.log(`Cleaned up ${totalDeleted} expired refresh_token entries`);
      return { deleted: totalDeleted };
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
      return { deleted: 0 };
    }
  }


  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async dailyCleanup() {
    this.logger.log('='.repeat(50));
    this.logger.log('Starting daily cleanup of expired tokens');
    this.logger.log('='.repeat(50));

    try {
      await this.cleanupExpiredTokens();
    } catch (error) {
      this.logger.error('Daily token cleanup job failed:', error);
    }
  }
}
