export const TIN_REGEX = /^\d{10}$|^\d{12}$/; // 10 или 12 цифр
export const CRR_REGEX = /^\d{9}$/; // 9 цифр
export const TITLE_MAX_LENGTH = 100;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;
export const LOGIN_REGEX = /^[a-zA-Z0-9_-]+$/;
export const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s]+$/;
export const PHONE_REGEX = /^[\d\s]+$/;
export const LOTUS_REGEX_2 = /^[^\/]+\/[^\/]+\/[^\/]+$/;
export const LOTUS_REGEX_3 = /^[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/;

export const AppMode = {
  DEVELOPMENT: 'DEVELOPMENT',
  PRODUCTION: 'PRODUCTION',
} as const;

export type AppMode = (typeof AppMode)[keyof typeof AppMode];

export const LogLevel = {
  DEBUG: 'DEBUG',
  ERROR: 'ERROR',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export const HistoryEntityType = {
  FTS_FUNCTION: 'FTS_FUNCTION',
  FTS_FUNCTION_DETAIL: {
    common: 'FTS_FUNCTION_DETAIL',
    relations: 'FTS_FUNCTION_DETAILS_RELATION',
    order: 'FTS_FUNCTION_DETAILS_ORDER',
  },
  FEEDBACK: {
    common: 'FEEDBACK',
    accept: 'FEEDBACKS_ACCEPT',
    order: 'FEEDBACKS_ORDER',
  },
  ACTION: {
    common: 'ACTION',
    generalInfo: 'ACTIONS_GENERAL_INFO',
    feedback: 'ACTIONS_FEEDBACK',
    order: 'ACTIONS_ORDER',
  },
} as const;

export const MESSAGES = {
  MAINTENANCE_ACTIVE: 'Сервис временно недоступен по техническим причинам',
  MAINTENANCE_SCHEDULED: 'Запланированы технические работы',

  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
  UNEXPECTED_ERROR: 'Непредвиденная ошибка',
  NOT_FOUND: 'Ресурс не найден',
  FORBIDDEN: 'Недостаточно прав для выполнения операции',
  INVALID_INPUT: 'Неверный ввод данных',
  AUTH_FAILED: 'Авторизация недействительна. Пожалуйста, войдите снова',
  VALIDATION_FAILED: 'Ошибка валидации данных',
  SERVER_ERROR: 'Внутренняя ошибка сервера',
  BAD_REQUEST: 'Некорректный запрос',
  CONFLICT: 'Конфликт с существующими данными',

  REGISTRATION_SUCCESS: 'Пользователь успешно зарегистрирован',
  LOGIN_SUCCESS: 'Успешный вход',
  LOGOUT_SUCCESS: 'Выход выполнен успешно',
  DATA_FETCHED: 'Данные успешно получены',
  ACTION_SUCCESS: 'Операция выполнена успешно',
  UPDATED_SUCCESSFULLY: 'Данные успешно обновлены',

  EMAIL_CONFIRMATION_SENT: 'Письмо для подтверждения email отправлено',
  EMAIL_CONFIRMED_SUCCESS: 'Email успешно подтверждён',
  EMAIL_CONFIRMATION_REQUIRED: 'Требуется подтверждение email',
  EMAIL_ALREADY_CONFIRMED: 'Email уже подтверждён',
  EMAIL_CONFIRMATION_EXPIRED: 'Срок действия ссылки подтверждения истёк',
  INVALID_CONFIRMATION_TOKEN: 'Недействительный токен подтверждения email',

  PASSWORD_RESET_LINK_SENT: 'Ссылка для сброса пароля отправлена',
  PASSWORD_RESET_SUCCESS: 'Пароль успешно сброшен',
  PASSWORD_RESET_REQUIRED: 'Требуется сброс пароля',
  PASSWORD_RESET_EXPIRED: 'Срок действия ссылки для сброса пароля истёк',
  INVALID_RESET_TOKEN: 'Недействительный токен сброса пароля',
  PASSWORD_RESET_INVALID_EMAIL: 'Пользователь с указанным email не найден',
  PASSWORD_RESET_EMAIL_SENT: 'Письмо с инструкциями по сбросу пароля отправлено',

  FILE_UPLOAD_URL_GENERATED: 'URL для загрузки файла успешно создан',
  FILE_METADATA_SAVED: 'Метаданные файла успешно сохранены',
  FILE_DOWNLOAD_URL_GENERATED: 'URL для скачивания файла успешно создан',
  FILE_INFO_RETRIEVED: 'Информация о файле успешно получена',
  FILES_LIST_RETRIEVED: 'Список файлов успешно получен',
  FILE_DELETED: 'Файл успешно удален',
  IMPORT_IN_PROGRESS: 'Сервер занят обработкой другого файла',
  IMPORT_SERVICE_BUSY: 'Сервер временно недоступен для обработки файлов',

  RESOURCE_CREATED: 'Ресурс успешно создан',
  RESOURCE_FOUND: 'Ресурс успешно найден',
  RESOURCE_UPDATED: 'Ресурс успешно обновлен',
  RESOURCE_DELETED: 'Ресурс успешно удален',
};

export const MIN_DATE = new Date("1900-01-01T00:00:00.000Z");
export const MAX_DATE = new Date("9999-12-31T23:59:59.999Z");
