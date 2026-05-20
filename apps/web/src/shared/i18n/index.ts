import type { I18nDictionary } from "./types";

import { initReactI18next, useTranslation } from "react-i18next";
import i18n from "i18next";

import { I18N } from "./keys";
import { ru as ruDict } from "./ru";

/**
 * Strongly-typed dictionary: the `I18nDictionary` type forces `ru.ts` to
 * cover every key in the `I18N` tree — a missing key fails `tsc --noEmit`.
 */
const dictionary: I18nDictionary = ruDict;

/**
 * i18next init for the registry client. Single-language (ru) for now; the
 * typed `I18N` keys + flat dictionary lay groundwork for adding locales.
 */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      ru: { translation: dictionary },
    },
    lng: "ru",
    fallbackLng: "ru",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export { I18N, i18n, useTranslation };
export type { I18nDictionary, I18nKey } from "./types";
export default i18n;
