export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;
export const LOGIN_REGEX = /^[a-zA-Z0-9_-]+$/;
export const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s]+$/;
export const PHONE_REGEX = /^[\d\s]+$/;
export const SAMOWARE_REGEX = /^\d{4}-\d{2}-\d{3}$/;
export const LOTUS_REGEX_2 = /^[^\/]+\/[^\/]+\/[^\/]+$/;
export const LOTUS_REGEX_3 = /^[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/;

export const INTERNAL_EMAIL_DOMAIN = "eups.tax.nalog.ru"

export const MESSAGES = {
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
  UNEXPECTED_ERROR: 'Непредвиденная ошибка',
  NOT_FOUND: 'Ресурс не найден',
  FORBIDDEN: 'Недостаточно прав для выполнения операции',
  INVALID_INPUT: 'Неверный ввод данных',
  AUTH_FAILED: 'Ошибка авторизации',
  VALIDATION_FAILED: 'Ошибка валидации данных',
  SERVER_ERROR: 'Внутренняя ошибка сервера',
  BAD_REQUEST: 'Некорректный запрос',
  CONFLICT: 'Конфликт с существующими данными',

  REGISTRATION_SUCCESS: 'Пользователь успешно зарегистрирован',
  LOGIN_SUCCESS: 'Успешный вход',
  LOGOUT_SUCCESS: 'Выход выполнен успешно',
  DATA_FETCHED: 'Данные успешно получены',
  ACTION_SUCCESS: 'Операция выполнена успешно',
  RESOURCE_FOUND: 'Ресурс успешно найден',
  UPDATED_SUCCESSFULLY: 'Данные успешно обновлены',

  FILE_UPLOAD_ERROR: 'Ошибка при загрузке файла. Проверьте формат и содержимое.',
};

export const MIN_DATE = new Date("1900-01-01T00:00:00.000Z");
export const MAX_DATE = new Date("9999-12-31T23:59:59.999Z");

export const MAX_FILE_SIZE = 10 * 1024 * 1024;



export type SortDirection = 'asc' | 'desc';
export type Application = 'AND' | 'OR'
