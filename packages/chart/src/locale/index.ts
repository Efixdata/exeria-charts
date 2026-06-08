import enUS from "./en-US";
import plPL from "./pl-PL";
import plPLIndicators from "./pl-PL-indicators";
import deDE from "./de-DE";
import deDEIndicators from "./de-DE-indicators";
import frFR from "./fr-FR";
import frFRIndicators from "./fr-FR-indicators";
import esES from "./es-ES";
import esESIndicators from "./es-ES-indicators";
import ptBR from "./pt-BR";
import ptBRIndicators from "./pt-BR-indicators";
import itIT from "./it-IT";
import itITIndicators from "./it-IT-indicators";
import trTR from "./tr-TR";
import trTRIndicators from "./tr-TR-indicators";
import idID from "./id-ID";
import idIDIndicators from "./id-ID-indicators";
import koKR from "./ko-KR";
import koKRIndicators from "./ko-KR-indicators";
import zhCN from "./zh-CN";
import zhCNIndicators from "./zh-CN-indicators";
import jaJP from "./ja-JP";
import jaJPIndicators from "./ja-JP-indicators";
import viVN from "./vi-VN";
import viVNIndicators from "./vi-VN-indicators";
import thTH from "./th-TH";
import thTHIndicators from "./th-TH-indicators";
import ruRU from "./ru-RU";
import ruRUIndicators from "./ru-RU-indicators";
import {
  DEFAULT_LOCALE_ID,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isSupportedLocaleId,
  normalizeLocaleId,
  type LocaleId,
} from "./registry";

export {
  DEFAULT_LOCALE_ID,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isSupportedLocaleId,
  normalizeLocaleId,
  type LocaleId,
};

/** Locale-specific overrides merged on top of en-US. */
const LOCALE_BUNDLE_OVERRIDES: Partial<Record<LocaleId, Record<string, unknown>[]>> = {
  "pl-PL": [plPL, plPLIndicators],
  "de-DE": [deDE, deDEIndicators],
  "fr-FR": [frFR, frFRIndicators],
  "es-ES": [esES, esESIndicators],
  "pt-BR": [ptBR, ptBRIndicators],
  "it-IT": [itIT, itITIndicators],
  "tr-TR": [trTR, trTRIndicators],
  "id-ID": [idID, idIDIndicators],
  "ko-KR": [koKR, koKRIndicators],
  "zh-CN": [zhCN, zhCNIndicators],
  "ja-JP": [jaJP, jaJPIndicators],
  "vi-VN": [viVN, viVNIndicators],
  "th-TH": [thTH, thTHIndicators],
  "ru-RU": [ruRU, ruRUIndicators],
};

export function resolveLocaleDictionary(
  localeId: string,
  messageOverrides?: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = normalizeLocaleId(localeId);
  const bundles = LOCALE_BUNDLE_OVERRIDES[normalized] ?? [];
  const base = { ...enUS, ...Object.assign({}, ...bundles) } as Record<string, unknown>;

  if (!messageOverrides || Object.keys(messageOverrides).length === 0) {
    return base;
  }

  return { ...base, ...messageOverrides };
}
