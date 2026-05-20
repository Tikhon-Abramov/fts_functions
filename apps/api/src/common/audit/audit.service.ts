import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../module/prisma/prisma.service';

/**
 * Перечень аудит-событий, которые сервис умеет писать.
 *
 * `auth.*` события — события аутентификации (старая поверхность сервиса,
 * перенесена сюда без изменений). `admin.*` события — события админ-панели
 * (CRUD на справочниках Type / User), которые добавились вместе с CRUD-эндпоинтами
 * в `ConstantController`.
 *
 * Любое новое событие сначала регистрируется здесь, затем наружу выставляется
 * именованный record-метод на `AuditService`. Свободный текст в журнал не пишем —
 * чтобы grep по `event = 'admin.type_create'` всегда находил все callsite-ы.
 */
export type AuditEvent =
  | 'auth.register'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.email_verified'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_completed'
  | 'admin.type_create'
  | 'admin.type_update'
  | 'admin.type_delete'
  | 'admin.user_create'
  | 'admin.user_update'
  | 'admin.user_delete';

type AuditContext = {
  userId?: number | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
};

type AdminMutationContext = {
  /** ID того, кто инициировал мутацию (admin, обычно из `request.user.sub`). */
  actorUserId: number | null | undefined;
  /** ID затронутой строки в целевой таблице. */
  entityId: number;
  /** Произвольный JSON-снимок: `before`/`after` для UPDATE, полная строка для CREATE/DELETE. */
  changes: Record<string, unknown>;
};

/**
 * Лёгкий аудит auth- и admin-событий.
 *
 * Любой fail в записи аудита не должен валить бизнес-операцию — отсюда
 * try/catch + logger.warn. AuditLog — append-only журнал, потеря одной записи
 * не критична.
 *
 * Раньше сервис жил в `module/auth/internal/`. После добавления админ-CRUD
 * (Type / User) перенесён в `common/audit/`, чтобы `ConstantModule` мог его
 * импортировать без пересечения границ модулей.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async write(event: AuditEvent, ctx: AuditContext): Promise<void> {
    try {
      const data: Parameters<typeof this.prisma.auditLog.create>[0]['data'] = {
        event,
        userId: ctx.userId ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      };
      if (ctx.metadata) {
        (data as { metadata?: object }).metadata = ctx.metadata;
      }
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.warn(`Failed to record audit event ${event}: ${String(err)}`);
    }
  }

  // ── auth.* (без изменений после переноса) ─────────────────────────────────

  recordRegister(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    return this.write('auth.register', { userId, ipAddress, userAgent });
  }

  recordLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    return this.write('auth.login', { userId, ipAddress, userAgent });
  }

  recordLogout(userId: number): Promise<void> {
    return this.write('auth.logout', { userId });
  }

  recordEmailVerified(userId: number): Promise<void> {
    return this.write('auth.email_verified', { userId });
  }

  recordPasswordResetRequested(userId: number | null, email: string): Promise<void> {
    return this.write('auth.password_reset_requested', { userId, metadata: { email } });
  }

  recordPasswordResetCompleted(userId: number): Promise<void> {
    return this.write('auth.password_reset_completed', { userId });
  }

  // ── admin.* (CRUD на справочниках) ────────────────────────────────────────
  // Сигнатура единая: (entityId, changes JSON, actorUserId). entityId и
  // changes пишутся в metadata — отдельных колонок под них в AuditLog нет
  // (см. `apps/api/db/schema.prisma` model AuditLog).

  recordTypeCreate({ actorUserId, entityId, changes }: AdminMutationContext): Promise<void> {
    return this.write('admin.type_create', {
      userId: actorUserId,
      metadata: { entityType: 'Type', entityId, changes },
    });
  }

  recordTypeUpdate({ actorUserId, entityId, changes }: AdminMutationContext): Promise<void> {
    return this.write('admin.type_update', {
      userId: actorUserId,
      metadata: { entityType: 'Type', entityId, changes },
    });
  }

  recordTypeDelete({ actorUserId, entityId, changes }: AdminMutationContext): Promise<void> {
    return this.write('admin.type_delete', {
      userId: actorUserId,
      metadata: { entityType: 'Type', entityId, changes },
    });
  }

  recordUserCreate({ actorUserId, entityId, changes }: AdminMutationContext): Promise<void> {
    return this.write('admin.user_create', {
      userId: actorUserId,
      metadata: { entityType: 'User', entityId, changes },
    });
  }

  recordUserUpdate({ actorUserId, entityId, changes }: AdminMutationContext): Promise<void> {
    return this.write('admin.user_update', {
      userId: actorUserId,
      metadata: { entityType: 'User', entityId, changes },
    });
  }

  recordUserDelete({ actorUserId, entityId, changes }: AdminMutationContext): Promise<void> {
    return this.write('admin.user_delete', {
      userId: actorUserId,
      metadata: { entityType: 'User', entityId, changes },
    });
  }
}
