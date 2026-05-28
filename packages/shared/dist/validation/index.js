"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// validation/index.ts
var validation_exports = {};
__export(validation_exports, {
  CRR_REGEX: () => CRR_REGEX,
  LOGIN_REGEX: () => LOGIN_REGEX,
  LOTUS_REGEX_2: () => LOTUS_REGEX_2,
  LOTUS_REGEX_3: () => LOTUS_REGEX_3,
  MAX_DATE: () => MAX_DATE,
  MIN_DATE: () => MIN_DATE,
  NAME_REGEX: () => NAME_REGEX,
  PASSWORD_REGEX: () => PASSWORD_REGEX,
  PHONE_REGEX: () => PHONE_REGEX,
  TIN_REGEX: () => TIN_REGEX,
  TITLE_MAX_LENGTH: () => TITLE_MAX_LENGTH
});
module.exports = __toCommonJS(validation_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CRR_REGEX,
  LOGIN_REGEX,
  LOTUS_REGEX_2,
  LOTUS_REGEX_3,
  MAX_DATE,
  MIN_DATE,
  NAME_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX,
  TIN_REGEX,
  TITLE_MAX_LENGTH
});
