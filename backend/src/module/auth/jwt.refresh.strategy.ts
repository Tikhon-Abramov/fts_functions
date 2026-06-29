import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { FastifyRequest } from 'fastify';
import { RefreshTokenPayload } from './types';
import { UserPayload } from '@common/interfaces/user-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          return request.cookies?.Refresh || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: FastifyRequest, payload: RefreshTokenPayload): Promise<UserPayload> {
    const refreshToken = request.cookies?.Refresh;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.verifyRefreshToken(payload.sub, refreshToken);

    return user;
  }
}
