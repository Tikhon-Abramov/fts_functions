// validation/regexes.ts
var TIN_REGEX = /^\d{10}$|^\d{12}$/;
var CRR_REGEX = /^\d{9}$/;
var PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;
var LOGIN_REGEX = /^[a-zA-Z0-9_-]+$/;
var NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s]+$/;
var PHONE_REGEX = /^[\d\s]+$/;
var LOTUS_REGEX_2 = /^[^\/]+\/[^\/]+\/[^\/]+$/;
var LOTUS_REGEX_3 = /^[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/;

// validation/limits.ts
var TITLE_MAX_LENGTH = 100;
var MIN_DATE = /* @__PURE__ */ new Date("1900-01-01T00:00:00.000Z");
var MAX_DATE = /* @__PURE__ */ new Date("9999-12-31T23:59:59.999Z");

export {
  TIN_REGEX,
  CRR_REGEX,
  PASSWORD_REGEX,
  LOGIN_REGEX,
  NAME_REGEX,
  PHONE_REGEX,
  LOTUS_REGEX_2,
  LOTUS_REGEX_3,
  TITLE_MAX_LENGTH,
  MIN_DATE,
  MAX_DATE
};
