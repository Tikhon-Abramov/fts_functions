/**
 * Общие регулярные выражения для валидации, используемые и на бэкенде,
 * и на фронтенде (например, в react-hook-form).
 */
export const TIN_REGEX = /^\d{10}$|^\d{12}$/; // 10 или 12 цифр
export const CRR_REGEX = /^\d{9}$/; // 9 цифр
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;
export const LOGIN_REGEX = /^[a-zA-Z0-9_-]+$/;
export const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s]+$/;
export const PHONE_REGEX = /^[\d\s]+$/;
export const LOTUS_REGEX_2 = /^[^\/]+\/[^\/]+\/[^\/]+$/;
export const LOTUS_REGEX_3 = /^[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/;
