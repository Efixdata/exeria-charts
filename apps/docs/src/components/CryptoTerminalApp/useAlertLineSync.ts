import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { listOrderLineIds, readOrderLinePrice } from "./positionLines";
import type { PriceAlert } from "./priceAlerts";

const SYNC_INTERVAL_MS = 350;
const PRICE_EPSILON = 1e-8;

export function useAlertLineSync(
  chart: ChartInstance | null,
  alerts: PriceAlert[],
  setAlerts: Dispatch<SetStateAction<PriceAlert[]>>,
) {
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const lineKey = alerts
    .map((alert) => `${alert.id}:${String(alert.lineId ?? "")}`)
    .join("|");

  useEffect(() => {
    if (!chart || alertsRef.current.length === 0) {
      return undefined;
    }

    const sync = () => {
      const currentAlerts = alertsRef.current;
      const liveLineIds = listOrderLineIds(chart);
      let changed = false;

      const next = currentAlerts.map((alert) => {
        if (alert.triggeredAt !== undefined) {
          return alert;
        }

        if (alert.lineId === undefined) {
          return alert;
        }

        if (!liveLineIds.has(alert.lineId)) {
          changed = true;
          return { ...alert, lineId: undefined };
        }

        const linePrice = readOrderLinePrice(chart, alert.lineId);
        if (linePrice === null || Math.abs(linePrice - alert.price) <= PRICE_EPSILON) {
          return alert;
        }

        changed = true;
        return { ...alert, price: linePrice };
      });

      if (changed) {
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
        setAlerts(next);
      }
    };

    sync();
    const interval = window.setInterval(sync, SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [chart, lineKey, setAlerts]);
}
