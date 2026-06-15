import type { Candle } from "@exeria/charts";

/** SSR-safe copy of @exeria/charts resolveNewsBarIndex (binary search on candle stamps). */
export function resolveNewsBarIndex(releasedAt: number, candles: Candle[]): number | null {
  if (!candles.length || !Number.isFinite(releasedAt)) {
    return null;
  }

  let lo = 0;
  let hi = candles.length - 1;
  let candidate = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const stamp = candles[mid]?.stamp;

    if (stamp === undefined) {
      break;
    }

    if (stamp <= releasedAt) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return candidate >= 0 ? candidate : null;
}
