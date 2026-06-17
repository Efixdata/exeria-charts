import type { Candle } from "@efixdata/exeria-chart";

/**
 * SSR-safe copy of @efixdata/exeria-chart resolveNewsBarIndex (binary search on candle stamps).
 *
 * @param candles Must be sorted in ascending order by `stamp`. Passing unsorted or
 *   raw API data will produce incorrect bar indices.
 */
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
