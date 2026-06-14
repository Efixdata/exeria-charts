export type NewsFeedSentiment = "positive" | "negative" | "neutral";

export type NewsFeedImportance = "low" | "medium" | "high";

export type NewsFeedImpactDirection = "up" | "down" | "flat";

export type NewsFeedImpactHorizon = "15m" | "1h" | "4h" | "1d";

export type NewsFeedImpactMeasure = {
  horizon: NewsFeedImpactHorizon;
  pips?: number;
  percent?: number;
  direction?: NewsFeedImpactDirection;
};

export type NewsFeedSource = {
  name: string;
  url?: string;
};

/**
 * Canonical news event. Time is always UTC milliseconds (`releasedAt`).
 * The chart maps this to a bar index for the active instrument interval at runtime.
 */
export type NewsFeedRecord = {
  id: string;
  instrument: string;
  releasedAt: number;
  ingestedAt?: number;
  source: NewsFeedSource;
  title: string;
  summary: string;
  url?: string;
  sentiment: NewsFeedSentiment;
  importance?: NewsFeedImportance;
  categories?: string[];
  locale?: string;
  relatedInstruments?: string[];
  impact?: NewsFeedImpactMeasure[];
};

export type NewsFeedBundle = {
  schemaVersion: 1;
  feedId: string;
  instrument: string;
  provider: string;
  generatedAt: string;
  coverage: {
    from: number;
    to: number;
  };
  events: NewsFeedRecord[];
};

export type NewsFeedQuery = {
  instrument: string;
  from?: number;
  to?: number;
  limit?: number;
};

export type NewsFeedPage = {
  instrument: string;
  events: NewsFeedRecord[];
  nextCursor?: string | null;
};

/**
 * Provider contract — parallel to `DataAdapter` for OHLCV.
 * Implementations may read static JSON bundles or call a remote API.
 */
export interface NewsFeedAdapter {
  initialize(config?: Record<string, unknown>): Promise<void>;
  getHistoricalEvents(query: NewsFeedQuery): Promise<NewsFeedRecord[]>;
  subscribe?(
    instrument: string,
    onEvent: (event: NewsFeedRecord) => void,
  ): () => void;
  disconnect?(): Promise<void>;
}
