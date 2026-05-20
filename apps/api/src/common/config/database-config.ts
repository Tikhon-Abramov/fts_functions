import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

/**
 * Координаты соединения с БД (MariaDB/MySQL). Префикс ENV — `DATABASE_*`.
 * `url` собирается лениво из остальных полей: одна точка истины — отдельные
 * координаты, итоговая строка — производная.
 */
export class DatabaseConfig {
  @IsString() @MinLength(1) readonly name!: string;
  @IsString() @MinLength(1) readonly user!: string;
  @IsString() readonly password!: string;
  @IsString() @MinLength(1) readonly host!: string;
  @Type(() => Number) @IsNumber() @Min(1) readonly port!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly connectionLimit: number = 100;

  @IsOptional()
  @IsString()
  @Matches(/^mysql:\/\/.+:.*@.+:\d+\/.+$/, {
    message: 'DATABASE_URL должен соответствовать формату engine://username:password@host:port/db',
  })
  readonly explicitUrl?: string;

  get url(): string {
    if (this.explicitUrl) return this.explicitUrl;
    const user = encodeURIComponent(this.user);
    const password = encodeURIComponent(this.password);
    return `mysql://${user}:${password}@${this.host}:${this.port}/${this.name}?connection_limit=${this.connectionLimit}`;
  }
}
