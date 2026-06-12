export type AlertDirection = "above" | "below";

export type PriceAlert = {
  id: string;
  symbol: string;
  price: number;
  direction: AlertDirection;
  createdAt: number;
  triggeredAt?: number;
  lineId?: string | number;
};

export function checkAlertCrossing(
  alert: PriceAlert,
  previousPrice: number,
  currentPrice: number,
): boolean {
  if (alert.triggeredAt !== undefined) {
    return false;
  }

  if (alert.direction === "above") {
    return previousPrice < alert.price && currentPrice >= alert.price;
  }

  return previousPrice > alert.price && currentPrice <= alert.price;
}

export function formatAlertDirection(direction: AlertDirection): string {
  return direction === "above" ? "Crosses above" : "Crosses below";
}
