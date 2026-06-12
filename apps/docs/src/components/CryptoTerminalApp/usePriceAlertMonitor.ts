import { useEffect, useRef } from "react";
import { checkAlertCrossing, type PriceAlert } from "./priceAlerts";

type UsePriceAlertMonitorOptions = {
  onTrigger: (alert: PriceAlert, currentPrice: number) => void;
};

export function usePriceAlertMonitor(
  alerts: PriceAlert[],
  markPrices: Record<string, number>,
  options: UsePriceAlertMonitorOptions,
) {
  const previousPricesRef = useRef<Record<string, number>>({});
  const triggeredIdsRef = useRef(new Set<string>());
  const onTriggerRef = useRef(options.onTrigger);
  onTriggerRef.current = options.onTrigger;

  useEffect(() => {
    for (const alert of alerts) {
      if (alert.triggeredAt !== undefined || triggeredIdsRef.current.has(alert.id)) {
        continue;
      }

      const currentPrice = markPrices[alert.symbol];
      if (currentPrice === undefined) {
        continue;
      }

      const previousPrice = previousPricesRef.current[alert.symbol] ?? currentPrice;
      if (checkAlertCrossing(alert, previousPrice, currentPrice)) {
        triggeredIdsRef.current.add(alert.id);
        onTriggerRef.current(alert, currentPrice);
      }
    }

    previousPricesRef.current = { ...markPrices };
  }, [alerts, markPrices]);
}
