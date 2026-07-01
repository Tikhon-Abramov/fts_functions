import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { TokenMetadata } from './types';

export interface ExternalAuthResult {
  /** id пользователя в другом сервисе == ftsInteractionUsersId в текущей БД */
  externalUserId: number;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class ExternalAuthService {
  private readonly logger = new Logger(ExternalAuthService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.getOrThrow<string>('FTS_INTERACTION_AUTH_URL');
  }

  /** Авторизация по логину/паролю в другом сервисе */
  async login(
    username: string,
    password: string,
    metadata?: TokenMetadata,
  ): Promise<ExternalAuthResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/login`,
          { username, password },
          { headers: this.forwardHeaders(metadata) },
        ),
      );

      return {
        externalUserId: data.user.id,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } catch (e) {
      this.handleError(e, 'login');
    }
  }

  /** Ротация токена через API другого сервиса.
   *  Его JwtRefreshStrategy читает токен из cookie `Refresh`, поэтому отдаём его в Cookie. */
  async refresh(
    externalRefreshToken: string,
    metadata?: TokenMetadata,
  ): Promise<ExternalAuthResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/token`,
          {},
          {
            headers: {
              ...this.forwardHeaders(metadata),
              Cookie: `Refresh=${externalRefreshToken}`,
            },
          },
        ),
      );
      return {
        externalUserId: data.user.id,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } catch (e) {
      this.handleError(e, 'refresh');
    }
  }

  private forwardHeaders(metadata?: TokenMetadata): Record<string, string> {
    const headers: Record<string, string> = {};
    if (metadata?.ipAddress) headers['X-Forwarded-For'] = metadata.ipAddress;
    if (metadata?.userAgent) headers['User-Agent'] = metadata.userAgent;
    return headers;
  }

  private handleError(e: unknown, op: string): never {
    const err = e as AxiosError;
    this.logger.warn(
      `Внешняя авторизация (${op}) не удалась: ${err.response?.status}, ${err.message}`,
    );

    throw new UnauthorizedException(err.message);
  }
}