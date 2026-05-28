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

// colors/index.ts
var colors_exports = {};
__export(colors_exports, {
  COLOR_PRESETS: () => COLOR_PRESETS
});
module.exports = __toCommonJS(colors_exports);

// colors/presets.ts
var COLOR_PRESETS = [
  "#34d399",
  "#fb7185",
  "#ef4444",
  "#fbbf24",
  "#60a5fa",
  "#a78bfa",
  "#818cf8",
  "#2dd4bf",
  "#7dd3fc",
  "#38bdf8",
  "#94a3b8"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COLOR_PRESETS
});
