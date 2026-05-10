import type { Candle, Interval, Instrument } from "../types";

export interface OhlcvCandle extends Candle {
  i?: number | null;
  [key: string]: unknown;
}

export interface TickLike {
  stamp: number;
  volume?: number;
  dailyVolume?: number;
  price?: number;
  [key: string]: unknown;
}

export interface SeriesBase {
  seriesId: string;
  title?: string;
  userName?: string;
  fields: string[];
  labels: string[] | Record<string, string>;
  interval: Interval;
  instrument?: Instrument;
  [key: string]: unknown;
}

export interface SeriesWithData extends SeriesBase {
  data: OhlcvCandle[];
}

export interface SeriesModel extends SeriesBase {
  data: OhlcvCandle[] | null;
}

export type SeriesManager = Record<string, SeriesWithData>;

export interface InstrumentSeriesRef {
  seriesId: string;
  title?: string;
  instrument?: Instrument;
  [key: string]: unknown;
}

export interface InstrumentSeriesRuntime extends InstrumentSeriesRef {
  seriesId: string;
  instrument?: Instrument;
  [key: string]: unknown;
}

export interface FusionSeriesRuntime {
  seriesId: string;
  fields: string[];
  labels: string[] | Record<string, string>;
  interval: Interval;
  data: any;
  title?: string;
  userName?: string;
  instrument?: Instrument;
  [key: string]: unknown;
}

export type FusionSeriesManager = Record<string, FusionSeriesRuntime>;
