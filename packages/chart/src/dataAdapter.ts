import type { Candle, Tick } from "./types";

export interface LoadDataOptions {
  interval: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface DataAdapter {
  initialize(config: Record<string, unknown>): Promise<void>;
  getHistoricalData(symbol: string, options: LoadDataOptions): Promise<Candle[]>;
  getCurrentPrice(symbol: string): Promise<Tick>;
  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void;
  disconnect(): Promise<void>;
}
