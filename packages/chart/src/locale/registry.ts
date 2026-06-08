export type LocaleId = "en-US" | "pl-PL" | "de-DE" | "fr-FR" | "es-ES" | "pt-BR" | "it-IT" | "tr-TR" | "id-ID" | "ko-KR" | "zh-CN" | "ja-JP" | "vi-VN" | "th-TH" | "ru-RU";

export const DEFAULT_LOCALE_ID: LocaleId = "en-US";

export const LOCALE_STORAGE_KEY = "exeria-chart-locale";

export const SUPPORTED_LOCALES: ReadonlyArray<{ id: LocaleId; labelKey: string }> = [
  { id: "en-US", labelKey: "locale_name_en_us" },
  { id: "pl-PL", labelKey: "locale_name_pl_pl" },
  { id: "de-DE", labelKey: "locale_name_de_de" },
  { id: "fr-FR", labelKey: "locale_name_fr_fr" },
  { id: "es-ES", labelKey: "locale_name_es_es" },
  { id: "pt-BR", labelKey: "locale_name_pt_br" },
  { id: "it-IT", labelKey: "locale_name_it_it" },
  { id: "tr-TR", labelKey: "locale_name_tr_tr" },
  { id: "id-ID", labelKey: "locale_name_id_id" },
  { id: "ko-KR", labelKey: "locale_name_ko_kr" },
  { id: "zh-CN", labelKey: "locale_name_zh_cn" },
  { id: "ja-JP", labelKey: "locale_name_ja_jp" },
  { id: "vi-VN", labelKey: "locale_name_vi_vn" },
  { id: "th-TH", labelKey: "locale_name_th_th" },
  { id: "ru-RU", labelKey: "locale_name_ru_ru" },
];

const LOCALE_ALIASES: Record<string, LocaleId> = {
  en: "en-US",
  "en-us": "en-US",
  pl: "pl-PL",
  "pl-pl": "pl-PL",
  de: "de-DE",
  "de-de": "de-DE",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  es: "es-ES",
  "es-es": "es-ES",
  pt: "pt-BR",
  "pt-br": "pt-BR",
  "pt-pt": "pt-BR",
  it: "it-IT",
  "it-it": "it-IT",
  tr: "tr-TR",
  "tr-tr": "tr-TR",
  id: "id-ID",
  "id-id": "id-ID",
  ko: "ko-KR",
  "ko-kr": "ko-KR",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
  "zh-hans-cn": "zh-CN",
  ja: "ja-JP",
  "ja-jp": "ja-JP",
  vi: "vi-VN",
  "vi-vn": "vi-VN",
  th: "th-TH",
  "th-th": "th-TH",
  ru: "ru-RU",
  "ru-ru": "ru-RU",
};

export function normalizeLocaleId(localeId?: string | null): LocaleId {
  if (!localeId) {
    return DEFAULT_LOCALE_ID;
  }

  const normalized = localeId.trim().toLowerCase();
  return LOCALE_ALIASES[normalized] ?? DEFAULT_LOCALE_ID;
}

export function isSupportedLocaleId(localeId: string): localeId is LocaleId {
  return SUPPORTED_LOCALES.some((entry) => entry.id === localeId);
}
