import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { UserPayload } from '@common/interfaces/user-payload.interface';
import { MESSAGES } from '@common/constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'username', passReqToCallback: true });
  }

  async validate(
    request: FastifyRequest,
    username: string,
    password: string
  ): Promise<UserPayload> {
    const metadata = {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };

    const { user, external, errors } = await this.authService.verifyUser(username, password, metadata);

    if (errors.length > 0 || !user) {
      throw new UnauthorizedException(
        errors.length > 0 ? errors : [MESSAGES.AUTH_FAILED],
      );
    }

    // Внешняя сессия — прокидываем токены другого сервиса в request,
    // чтобы AuthService.login сохранил внешний refresh-токен.
    if (external) {
      (request as FastifyRequest & {
        externalAuth?: { accessToken: string; refreshToken: string };
      }).externalAuth = external;
    }
    
    return user;
  }
}
