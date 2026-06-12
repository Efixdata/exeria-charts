import { useCallback, useEffect, useState } from "react";
import type { ChartInstance, ChartSubscription } from "@efixdata/exeria-chart";

function unsubscribeChartTopic(subscription: ChartSubscription | void | undefined) {
  if (subscription && typeof subscription.unsubscribe === "function") {
    subscription.unsubscribe();
  }
}

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
      unsubscribeChartTopic(subscription);
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
