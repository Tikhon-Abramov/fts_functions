/**
 * Текстовые сообщения для типизированных HttpException-ов и для
 * Prisma-error-маперов. Каждый ключ — один смысл; код ошибки несёт смысл
 * машинно (через `ErrorCode`), а текст — для логов и для бэкап-формата
 * сообщения, если фронт почему-то не сможет резолвнуть `ErrorCode → I18N`.
 */
export const ERROR_MESSAGE = {
  // Ресурсы.
  RESOURCE_NOT_FOUND: 'Ресурс не найден.',
  USER_NOT_FOUND: 'Пользователь не найден.',
  TYPE_NOT_FOUND: 'Справочное значение не найдено.',
  FTS_FUNCTION_NOT_FOUND: 'Функция ФНС не найдена.',
  FTS_FUNCTION_DETAIL_NOT_FOUND: 'Детализация функции ФНС не найдена.',
  FTS_FUNCTION_DTI_LINK_NOT_FOUND: 'Связь функции ФНС с ДТИ не найдена.',
  FTS_FUNCTION_TREE_EDGE_NOT_FOUND: 'Связь в дереве функций не найдена.',

  // Constraints / domain rules.
  DUPLICATE_TREE_EDGE: 'Такая связь уже существует.',
  TREE_SELF_LOOP: 'Нельзя связать детализацию саму с собой.',
  FUNCTION_NAME_DUPLICATE: 'Функция с таким названием уже существует.',
  FOREIGN_KEY_CONSTRAINT: 'Ссылочная целостность нарушена.',
  UNIQUE_CONSTRAINT: 'Такая запись уже существует.',
  INVALID_CURSOR: 'Некорректный курсор пагинации.',
  VALIDATION_FAILED: 'Validation failed',

  // Шаблоны (заполняются в exception-конструкторах).
  USER_ROLE_MISMATCH: (slot: string): string =>
    `Пользователь в роли «${slot}» не соответствует необходимой ветви ФНС или должности.`,
  TYPE_CATEGORY_MISMATCH: (column: string, category: string): string =>
    `Значение поля ${column} не соответствует требуемой категории справочника (${category}).`,

  // Внутренние сообщения парсинга.
  EXPECTED_BOOLEAN: 'Ожидался тип - булево значение (true/false)',

  // Auth
  INVALID_CREDENTIALS: 'Неверный email/логин или пароль.',
  EMAIL_ALREADY_REGISTERED: 'Пользователь с таким email уже зарегистрирован.',
  EMAIL_NOT_VERIFIED: 'Email не подтверждён. Проверьте почту и перейдите по ссылке из письма.',
  EMAIL_VERIFICATION_REQUIRED: 'Требуется подтверждение email.',
  INVALID_TOKEN: 'Токен недействителен.',
  TOKEN_EXPIRED: 'Срок действия токена истёк.',
} as const;
