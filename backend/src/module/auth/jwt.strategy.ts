import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from './types';
import { FastifyRequest } from 'fastify';
import { UserPayload } from '@common/interfaces/user-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          const token = request.cookies?.Authentication ||
            request.headers?.authorization?.replace('Bearer ', '');

          return token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET') as string,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
        role: payload.role,
        ftsBranchType: payload.ftsBranchType,
        isDeleted: payload.isDeleted,
      },
      select: {
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
      }
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isDeleted) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
