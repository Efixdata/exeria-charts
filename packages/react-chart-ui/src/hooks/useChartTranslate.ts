import { useCallback, useEffect, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";

export function useChartTranslate(chart: ChartInstance | null | undefined) {
  const [localeVersion, setLocaleVersion] = useState(0);

  useEffect(() => {
    if (!chart?.subscribe) {
      return undefined;
    }

    const subscription = chart.subscribe("LOCALE_CHANGE", () => {
      setLocaleVersion((value) => value + 1);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [chart]);

  return useCallback(
    (key: string, fallback?: string) => {
      if (!chart?.translate) {
        return fallback ?? key;
      }

      const translated = chart.translate(key);
      return translated !== key ? translated : (fallback ?? key);
    },
    [chart, localeVersion],
  );
}
