import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

import { AppMode } from '@common/constants';

/**
 * Серверные настройки Node-процесса: host/port слушателя, режим, секреты JWT,
 * ttl, throttler. Источник — переменные окружения. Все значения проходят
 * валидацию `class-validator` при загрузке `RootConfig` (см. `root-config.ts`).
 */
export class NodeConfig {
  @IsString() @MinLength(1) readonly appName!: string;

  @IsOptional() @IsString() readonly host: string = '0.0.0.0';
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) readonly httpPort: number = 3000;

  @IsOptional() @IsIn(Object.values(AppMode)) readonly mode: AppMode = AppMode.DEVELOPMENT;

  get isProduction(): boolean {
    return this.mode === AppMode.PRODUCTION;
  }

  get isDev(): boolean {
    return !this.isProduction;
  }

  get url(): string {
    return `http://${this.host}:${this.httpPort}`;
  }

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) readonly throttleTtl: number = 60_000;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) readonly throttleLimit: number = 100;

  @IsString() @MinLength(32) readonly cookieSecret!: string;

  @IsString() @MinLength(32) readonly jwtAccessTokenSecret!: string;
  @Type(() => Number) @IsNumber() @Min(1) readonly jwtAccessTokenExpirationMs!: number;

  @IsString() @MinLength(32) readonly jwtRefreshTokenSecret!: string;
  @Type(() => Number) @IsNumber() @Min(1) readonly jwtRefreshTokenExpirationMs!: number;

  @IsString() @MinLength(32) readonly jwtVerificationTokenSecret!: string;
  @Type(() => Number) @IsNumber() @Min(1) readonly jwtVerificationTokenExpirationMs!: number;

  @IsString() @MinLength(32) readonly jwtPasswordResetTokenSecret!: string;
  @Type(() => Number) @IsNumber() @Min(1) readonly jwtPasswordResetTokenExpirationMs!: number;

  @IsOptional()
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      : ['*'],
  )
  @IsArray()
  @IsString({ each: true })
  readonly allowedOrigins: string[] = ['*'];

  // ---------- MinIO / S3-compatible object storage ----------
  // Все 4 поля опциональны: если они пустые, StorageModule не падает,
  // а просто пишет warning при старте — dev-окружение продолжает работать
  // без MinIO, а аватар-функционал просто не выдаёт presigned URL.
  @IsOptional() @IsString() readonly minioEndpoint: string = 'http://127.0.0.1:9000';
  @IsOptional() @IsString() readonly minioBucket: string = 'registry-avatars';
  @IsOptional() @IsString() readonly minioAccessKey: string = 'minioadmin';
  @IsOptional() @IsString() readonly minioSecretKey: string = 'minioadmin';

  // ---------- Audit-log rotation (cron) ----------
  // Поток: nightly cron вычитывает старые `audit_log`-строки, кладёт их JSONL'ом
  // в отдельный bucket и удаляет из БД. См. `common/audit/audit-rotation.service.ts`.
  // Ноль или отрицательный retention → ротация выключена (например, в dev/тестах).
  @IsOptional() @IsString() readonly auditLogBucket: string = 'registry-audit-logs';
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) readonly auditLogRetentionDays: number = 14;
  @IsOptional() @IsString() readonly auditLogCron: string = '0 2 * * *';
}
