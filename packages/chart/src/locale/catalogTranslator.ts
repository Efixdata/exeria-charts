import FUSION from "../fusion";
import type { ChartLocaleMessages } from "./messages";
import type { RuntimeScriptDefinition } from "../internal-types/scripts";

export function getCatalogTypeForScriptKey(scriptKey: string | undefined): string | undefined {
  if (!scriptKey) {
    return undefined;
  }

  return FUSION.getScript(scriptKey)?.type;
}

export function getCatalogTypeForScriptId(
  scripts: Array<{ id?: string | number; key?: string }>,
  scriptId: string | number | undefined,
): string | undefined {
  if (scriptId == null) {
    return undefined;
  }

  const modelScript = scripts.find((script) => script.id == scriptId);
  return getCatalogTypeForScriptKey(
    typeof modelScript?.key === "string" ? modelScript.key : undefined,
  );
}

export function isEnglishOnlyCatalogType(type: string | undefined): boolean {
  return type === "functions" || type === "strategies";
}

export function createCatalogTranslator(
  localeMessages: ChartLocaleMessages,
  englishMessages: ChartLocaleMessages,
) {
  const getTranslator = (type: string | undefined) =>
    isEnglishOnlyCatalogType(type) ? englishMessages : localeMessages;

  const translateKey = (
    translator: ChartLocaleMessages,
    key: string | undefined,
    fallback?: string,
  ): string => {
    if (!key) {
      return fallback ?? "";
    }

    const translated = translator.getMessage(key, fallback ?? key);
    return typeof translated === "string" ? translated : String(fallback ?? key);
  };

  const translateCatalogScript = (script: RuntimeScriptDefinition): RuntimeScriptDefinition => {
    const translated = JSON.parse(JSON.stringify(script)) as RuntimeScriptDefinition;
    const type = script.type;
    const catalogTranslator = getTranslator(type);
    const labelTranslator = localeMessages;

    translated.title = translateKey(catalogTranslator, script.title, script.title);
    translated.description = translateKey(
      catalogTranslator,
      script.description,
      script.title ?? script.description,
    );

    for (const inputKey in translated.inputs) {
      const input = translated.inputs[inputKey];
      input.name = translateKey(labelTranslator, input.name, input.name);
    }

    for (const outputKey in translated.outputs) {
      const output = translated.outputs[outputKey];

      if (output.type === "series" && output.series) {
        const series = output.series;
        series.title = translateKey(catalogTranslator, series.title, series.title);

        if (output.labels) {
          const seriesLabels = (series.labels ?? {}) as Record<string, string>;
          for (const labelKey in output.labels) {
            const label = seriesLabels[labelKey];
            if (label !== undefined) {
              seriesLabels[labelKey] = translateKey(labelTranslator, label, label);
            }
          }
          series.labels = seriesLabels;
        }
      }
    }

    return translated;
  };

  const translateCatalogMessage = (
    key: string | undefined,
    catalogType: string | undefined,
    fallback?: string,
  ): string => translateKey(getTranslator(catalogType), key, fallback ?? key);

  return {
    translateCatalogScript,
    translateCatalogMessage,
  };
}
