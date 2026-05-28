import WEBRCP from "./WebRCP";
import { isEnglishOnlyCatalogType } from "./locale/catalogTranslator";

type MessageResolver = (
  key: string | null | undefined,
  defaultMsg?: unknown,
  emptyAllowed?: boolean,
) => unknown;

type CatalogMessageResolver = (
  key: string | null | undefined,
  catalogType: string | undefined,
  defaultMsg?: unknown,
  emptyAllowed?: boolean,
) => string;

type ChartLocaleContext = {
  translate: (text: string) => string;
  translateCatalog?: (text: string, catalogType?: string) => string;
};

let activeResolver: MessageResolver | null = null;
let activeCatalogResolver: CatalogMessageResolver | null = null;

export function runWithChartLocale(chart: ChartLocaleContext, fn: () => void): void {
  const previous = activeResolver;
  const previousCatalog = activeCatalogResolver;

  activeResolver = (key, defaultMsg, emptyAllowed = true) => {
    if (!key) {
      return emptyAllowed ? "" : (defaultMsg ?? "");
    }

    const translated = chart.translate(String(key));
    if (translated !== key) {
      return translated;
    }

    if (defaultMsg !== undefined) {
      return defaultMsg;
    }

    return emptyAllowed ? key : `NO LOCALE[${key}]!`;
  };

  activeCatalogResolver = (key, catalogType, defaultMsg, emptyAllowed = true) => {
    if (!key) {
      return emptyAllowed ? "" : String(defaultMsg ?? "");
    }

    const translated = chart.translateCatalog
      ? chart.translateCatalog(String(key), catalogType)
      : chart.translate(String(key));

    if (translated !== key) {
      return translated;
    }

    if (defaultMsg !== undefined) {
      return String(defaultMsg);
    }

    return emptyAllowed ? String(key) : `NO LOCALE[${key}]!`;
  };

  try {
    fn();
  } finally {
    activeResolver = previous;
    activeCatalogResolver = previousCatalog;
  }
}

export function resolveChartLocaleMessage(
  key: string | null | undefined,
  defaultMsg?: unknown,
  emptyAllowed = true,
): string {
  if (activeResolver) {
    return String(activeResolver(key, defaultMsg, emptyAllowed));
  }

  return String(WEBRCP.locale.fusion.getMessage(key, defaultMsg, emptyAllowed));
}

export function resolveCatalogLocaleMessage(
  key: string | null | undefined,
  catalogType: string | undefined,
  defaultMsg?: unknown,
  emptyAllowed = true,
): string {
  if (activeCatalogResolver) {
    return activeCatalogResolver(key, catalogType, defaultMsg, emptyAllowed);
  }

  if (isEnglishOnlyCatalogType(catalogType)) {
    return String(WEBRCP.locale.fusion.getMessage(key, defaultMsg, emptyAllowed));
  }

  return resolveChartLocaleMessage(key, defaultMsg, emptyAllowed);
}
