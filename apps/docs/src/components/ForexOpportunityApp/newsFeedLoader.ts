import type { NewsFeedBundle, NewsFeedQuery, NewsFeedRecord } from "@efixdata/exeria-chart";
import eurUsdBundle from "./data/eur-usd-news-feed.json";
import gbpUsdBundle from "./data/gbp-usd-news-feed.json";
import eurGbpBundle from "./data/eur-gbp-news-feed.json";
import usdJpyBundle from "./data/usd-jpy-news-feed.json";
import usdChfBundle from "./data/usd-chf-news-feed.json";

const STATIC_BUNDLES: Record<string, NewsFeedBundle> = {
  "EUR/USD": eurUsdBundle as NewsFeedBundle,
  "GBP/USD": gbpUsdBundle as NewsFeedBundle,
  "EUR/GBP": eurGbpBundle as NewsFeedBundle,
  "USD/JPY": usdJpyBundle as NewsFeedBundle,
  "USD/CHF": usdChfBundle as NewsFeedBundle,
};

function filterEvents(events: NewsFeedRecord[], query: NewsFeedQuery): NewsFeedRecord[] {
  let filtered = events.filter((event) => event.instrument === query.instrument);

  if (query.from != null) {
    filtered = filtered.filter((event) => event.releasedAt >= query.from!);
  }

  if (query.to != null) {
    filtered = filtered.filter((event) => event.releasedAt <= query.to!);
  }

  filtered.sort((left, right) => left.releasedAt - right.releasedAt);

  if (query.limit != null && query.limit > 0) {
    filtered = filtered.slice(-query.limit);
  }

  return filtered;
}

export function getStaticNewsFeedBundle(instrument: string): NewsFeedBundle | null {
  return STATIC_BUNDLES[instrument] ?? null;
}

export async function loadInstrumentNewsFeed(
  instrument: string,
  query: Omit<NewsFeedQuery, "instrument"> = {},
): Promise<NewsFeedRecord[]> {
  const bundle = getStaticNewsFeedBundle(instrument);
  if (!bundle) {
    return [];
  }

  return filterEvents(bundle.events, { instrument, ...query });
}

export async function fetchInstrumentNewsFeedFromApi(
  instrument: string,
  query: Omit<NewsFeedQuery, "instrument"> = {},
): Promise<NewsFeedRecord[]> {
  const params = new URLSearchParams({ instrument });

  if (query.from != null) {
    params.set("from", String(query.from));
  }

  if (query.to != null) {
    params.set("to", String(query.to));
  }

  if (query.limit != null) {
    params.set("limit", String(query.limit));
  }

  const response = await fetch(`/api/news-feed?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`News feed API failed (${response.status})`);
  }

  const payload = (await response.json()) as { events?: NewsFeedRecord[] };
  return payload.events ?? [];
}
