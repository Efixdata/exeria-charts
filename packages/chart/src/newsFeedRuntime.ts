import type { Candle } from "./types";
import {
  clearExternalNewsFeed,
  setExternalNewsFeed,
  type ExternalNewsFeedPoint,
} from "./externalNewsFeed";
import type { NewsFeedRecord } from "./newsFeedTypes";

const eventRegistry = new Map<string, NewsFeedRecord>();
const barIndexRegistry = new Map<number, string>();

/**
 * Attach a news event to the last candle whose open time is <= `releasedAt`.
 * Works across M1…1M because mapping is recomputed whenever candles or interval change.
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

export function mapNewsFeedToMarkerPoints(
  events: NewsFeedRecord[],
  candles: Candle[],
): ExternalNewsFeedPoint[] {
  const points: ExternalNewsFeedPoint[] = [];

  for (const event of events) {
    const barIndex = resolveNewsBarIndex(event.releasedAt, candles);
    if (barIndex === null) {
      continue;
    }

    points.push({
      id: event.id,
      barIndex,
      sentiment: event.sentiment,
    });
  }

  return points;
}

export function setInstrumentNewsFeed(events: NewsFeedRecord[], candles: Candle[]): void {
  eventRegistry.clear();
  barIndexRegistry.clear();

  const points = mapNewsFeedToMarkerPoints(events, candles);

  for (const point of points) {
    const event = events.find((entry) => entry.id === point.id);
    if (!event) {
      continue;
    }

    eventRegistry.set(event.id, event);
    barIndexRegistry.set(point.barIndex, event.id);
  }

  setExternalNewsFeed(points);
}

export function getNewsFeedEvent(eventId: string): NewsFeedRecord | undefined {
  return eventRegistry.get(eventId);
}

export function getNewsFeedEventByBarIndex(barIndex: number): NewsFeedRecord | undefined {
  const eventId = barIndexRegistry.get(barIndex);
  return eventId ? eventRegistry.get(eventId) : undefined;
}

export function clearInstrumentNewsFeed(): void {
  eventRegistry.clear();
  barIndexRegistry.clear();
  clearExternalNewsFeed();
}
