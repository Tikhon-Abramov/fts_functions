/**
 * Общие регулярные выражения для валидации, используемые и на бэкенде,
 * и на фронтенде (например, в react-hook-form).
 */
declare const TIN_REGEX: RegExp;
declare const CRR_REGEX: RegExp;
declare const PASSWORD_REGEX: RegExp;
declare const LOGIN_REGEX: RegExp;
declare const NAME_REGEX: RegExp;
declare const PHONE_REGEX: RegExp;
declare const LOTUS_REGEX_2: RegExp;
declare const LOTUS_REGEX_3: RegExp;

/**
 * Общие лимиты, используемые и на бэкенде, и на фронтенде.
 */
declare const TITLE_MAX_LENGTH = 100;
declare const MIN_DATE: Date;
declare const MAX_DATE: Date;

export { CRR_REGEX, LOGIN_REGEX, LOTUS_REGEX_2, LOTUS_REGEX_3, MAX_DATE, MIN_DATE, NAME_REGEX, PASSWORD_REGEX, PHONE_REGEX, TIN_REGEX, TITLE_MAX_LENGTH };
