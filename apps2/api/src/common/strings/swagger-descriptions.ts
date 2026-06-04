/**
 * Текстовые описания ответов / тегов / заголовков для генерации Swagger
 * (OpenAPI). Никакой рантайм-логики — только литералы, подставляемые в
 * декораторы контроллеров и в `DocumentBuilder` (см. `main.ts`).
 */
export const SWAGGER_DESCRIPTION = {
  // Тексты ответов CRUD-эндпоинтов.
  RESOURCE_FOUND: 'Ресурс успешно найден',
  RESOURCE_CREATED: 'Ресурс успешно создан',
  RESOURCE_UPDATED: 'Ресурс успешно обновлен',
  RESOURCE_DELETED: 'Ресурс успешно удален',

  // Заголовок API + теги в `DocumentBuilder`.
  API_TITLE: 'Реестр функций ФНС API',
  TAG_CONSTANT: 'Справочные данные',
  INTERNAL_SERVER_ERROR: 'Внутренняя ошибка сервера',
} as const;

export type SwaggerDescription = (typeof SWAGGER_DESCRIPTION)[keyof typeof SWAGGER_DESCRIPTION];
