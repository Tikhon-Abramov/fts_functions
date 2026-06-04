import type { I18N } from "./keys";

type LeafValues<T> = T extends string
  ? T
  : T extends object
    ? { [K in keyof T]: LeafValues<T[K]> }[keyof T]
    : never;

export type I18nKey = LeafValues<typeof I18N>;

export type I18nDictionary = Record<I18nKey, string>;
