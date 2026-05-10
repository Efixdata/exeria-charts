import bnbUsdHourly from "../data/BNBUSD.json";
import bnbUsd5m from "../data/BNBUSD-5m.json";
import btcUsdHourly from "../data/BTCUSD.json";
import exampleRange from "../data/EXAMPLE-0-100.json";
import type { Candle, DrawMode, Instrument, Interval } from "@dexer-io/chart";

interface IndexedCandleArrays {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v?: number[];
}

interface CandleContainer {
  candles: Candle[];
}

type CandleSource = CandleContainer | Candle[] | IndexedCandleArrays | unknown;

export interface IntervalFixture {
  interval: Interval;
  candles: Candle[];
}

export interface ReviewPreset {
  id: string;
  label: string;
  summary: string;
  callout: string;
  runtimeThemeId: string;
  uiThemeId: string;
  themeVariant: string;
  overlayAccent: string;
  swatch: [string, string];
  instrument: Instrument;
  intervalFixtures: Record<string, IntervalFixture>;
  defaultIntervalSymbol: string;
}

const AVAILABLE_DRAW_MODES: DrawMode[] = ["OHLC", "Bars", "Line", "Histogram", "Line and Histogram"];

function createInterval(symbol: string, milis: number): Interval {
  return { symbol, milis };
}

function isCandleContainer(source: CandleSource): source is CandleContainer {
  return typeof source === "object" && source !== null && Array.isArray((source as CandleContainer).candles);
}

function isIndexedCandleArrays(source: CandleSource): source is IndexedCandleArrays {
  return typeof source === "object" && source !== null && Array.isArray((source as IndexedCandleArrays).t);
}

function createCandles(source: CandleSource, multiplier = 1): Candle[] {
  if (isCandleContainer(source)) {
    return source.candles.map((candle: Candle) => {
      const nextCandle: Candle = {
        stamp: candle.stamp,
        o: candle.o * multiplier,
        h: candle.h * multiplier,
        l: candle.l * multiplier,
        c: candle.c * multiplier,
      };

      if (typeof candle.v === "number") {
        nextCandle.v = candle.v;
      }

      return nextCandle;
    });
  }

  if (Array.isArray(source)) {
    return source.map((candle: Candle) => {
      const nextCandle: Candle = {
        stamp: candle.stamp,
        o: candle.o * multiplier,
        h: candle.h * multiplier,
        l: candle.l * multiplier,
        c: candle.c * multiplier,
      };

      if (typeof candle.v === "number") {
        nextCandle.v = candle.v;
      }

      return nextCandle;
    });
  }

  if (!isIndexedCandleArrays(source)) {
    return [];
  }

  const candles: Candle[] = [];

  source.t.forEach((stamp: number, index: number) => {
    const o = source.o[index];
    const h = source.h[index];
    const l = source.l[index];
    const c = source.c[index];

    if (
      typeof o !== "number" ||
      typeof h !== "number" ||
      typeof l !== "number" ||
      typeof c !== "number"
    ) {
      return;
    }

    const nextCandle: Candle = {
      stamp,
      o: o * multiplier,
      h: h * multiplier,
      l: l * multiplier,
      c: c * multiplier,
    };

    const v = source.v?.[index];
    if (typeof v === "number") {
      nextCandle.v = v;
    }

    candles.push(nextCandle);
  });

  return candles;
}

const fiveMinutes = createInterval("5m", 300000);
const oneHour = createInterval("1h", 3600000);

const bnbHourlyCandles = createCandles(bnbUsdHourly);
const bnbFiveMinuteCandles = createCandles(bnbUsd5m);
const btcHourlyCandles = createCandles(btcUsdHourly);
const exampleCandles = createCandles(exampleRange);

const reviewPresets: ReviewPreset[] = [
  {
    id: "swipper",
    label: "Swipper Default",
    summary: "Shipping dark theme with BNB/USD intraday candles and dense toolbar chrome.",
    callout: "Best for checking the default release surface and how overlays read on compact data.",
    runtimeThemeId: "swipper",
    uiThemeId: "swipper",
    themeVariant: "dark",
    overlayAccent: "#3CC3AF",
    swatch: ["#1EA1CD", "#3CC3AF"],
    instrument: {
      id: "BNBUSD",
      symbol: "BNB/USD",
      name: "Binance Coin / US Dollar",
      currency: "USD",
      precision: 2,
    },
    intervalFixtures: {
      "5m": { interval: fiveMinutes, candles: bnbFiveMinuteCandles },
      "1h": { interval: oneHour, candles: bnbHourlyCandles },
    },
    defaultIntervalSymbol: "5m",
  },
  {
    id: "dexer",
    label: "Dexer Signal",
    summary:
      "High-contrast runtime palette moved out of the package and into the app review surface.",
    callout: "Good for validating neon contrast, crosshair readability, and line-based studies.",
    runtimeThemeId: "dexer",
    uiThemeId: "dexer",
    themeVariant: "dark",
    overlayAccent: "#13F899",
    swatch: ["#13F899", "#6D86B1"],
    instrument: {
      id: "BTCUSD",
      symbol: "BTC/USD",
      name: "Bitcoin / US Dollar",
      currency: "USD",
      precision: 2,
    },
    intervalFixtures: {
      "1h": { interval: oneHour, candles: btcHourlyCandles },
    },
    defaultIntervalSymbol: "1h",
  },
  {
    id: "exeria",
    label: "Exeria Reference",
    summary:
      "Legacy exeria palette paired with a deterministic synthetic dataset for regression checks.",
    callout:
      "Useful when you want repeatable structure while switching between draw modes in the toolbar.",
    runtimeThemeId: "exeria",
    uiThemeId: "exeria",
    themeVariant: "dark",
    overlayAccent: "#2196F3",
    swatch: ["#2196F3", "#353741"],
    instrument: {
      id: "EXAMPLE-0-100",
      symbol: "EXAMPLE",
      name: "Example 0-100",
      currency: "PTS",
      precision: 0,
    },
    intervalFixtures: {
      "1h": { interval: oneHour, candles: exampleCandles },
    },
    defaultIntervalSymbol: "1h",
  },
];

function getPresetById(id: string): ReviewPreset {
  const selectedPreset = reviewPresets.find((preset) => preset.id === id);
  if (selectedPreset) return selectedPreset;

  const fallbackPreset = reviewPresets[0];
  if (fallbackPreset) return fallbackPreset;

  throw new Error("No review presets configured");
}

function getIntervalFixture(preset: ReviewPreset, symbol: string): IntervalFixture {
  const selectedFixture = preset.intervalFixtures[symbol];
  if (selectedFixture) return selectedFixture;

  const fallbackFixture = preset.intervalFixtures[preset.defaultIntervalSymbol];
  if (fallbackFixture) return fallbackFixture;

  throw new Error(`Missing interval fixture for preset ${preset.id}`);
}

function buildInstrument(preset: ReviewPreset, intervalSymbol: string): Instrument {
  const intervalFixture = getIntervalFixture(preset, intervalSymbol);

  return {
    ...preset.instrument,
    chart: "ohlc",
    availableIntervals: Object.values(preset.intervalFixtures).map((fixture) => fixture.interval),
    interval: intervalFixture.interval,
  };
}

export { AVAILABLE_DRAW_MODES, buildInstrument, getIntervalFixture, getPresetById, reviewPresets };
