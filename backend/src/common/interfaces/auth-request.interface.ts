import { FastifyRequest } from 'fastify';
import { AccessTokenPayload, RefreshTokenPayload } from 'src/module/auth/types';
import { UserPayload } from './user-payload.interface';

export interface AccessTokenRequest extends FastifyRequest {
  accessTokenPayload: AccessTokenPayload;
}

export interface RefreshTokenRequest extends FastifyRequest {
  refreshTokenPayload: RefreshTokenPayload;
}

export interface UserPayloadRequest extends FastifyRequest {
  user: UserPayload;
  externalAuth?: { accessToken: string; refreshToken: string };
}
