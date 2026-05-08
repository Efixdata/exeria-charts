import bnbUsdHourly from "../data/BNBUSD.json";
import bnbUsd5m from "../data/BNBUSD-5m.json";
import btcUsdHourly from "../data/BTCUSD.json";
import exampleRange from "../data/EXAMPLE-0-100.json";

const AVAILABLE_DRAW_MODES = ["OHLC", "Bars", "Line", "Histogram", "Line and Histogram"];

function createInterval(symbol, milis) {
  return { symbol, milis };
}

function createCandles(source, multiplier = 1) {
  if (Array.isArray(source?.candles)) {
    return source.candles.map((candle) => ({
      stamp: candle.stamp,
      o: candle.o * multiplier,
      h: candle.h * multiplier,
      l: candle.l * multiplier,
      c: candle.c * multiplier,
      v: candle.v,
    }));
  }

  if (Array.isArray(source)) {
    return source.map((candle) => ({
      stamp: candle.stamp,
      o: candle.o * multiplier,
      h: candle.h * multiplier,
      l: candle.l * multiplier,
      c: candle.c * multiplier,
      v: candle.v,
    }));
  }

  if (!Array.isArray(source?.t)) {
    return [];
  }

  return source.t.map((stamp, index) => ({
    stamp,
    o: source.o[index] * multiplier,
    h: source.h[index] * multiplier,
    l: source.l[index] * multiplier,
    c: source.c[index] * multiplier,
    v: source.v?.[index],
  }));
}

const fiveMinutes = createInterval("5m", 300000);
const oneHour = createInterval("1h", 3600000);

const bnbHourlyCandles = createCandles(bnbUsdHourly);
const bnbFiveMinuteCandles = createCandles(bnbUsd5m);
const btcHourlyCandles = createCandles(btcUsdHourly);
const exampleCandles = createCandles(exampleRange);

const reviewPresets = [
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

function getPresetById(id) {
  return reviewPresets.find((preset) => preset.id === id) || reviewPresets[0];
}

function getIntervalFixture(preset, symbol) {
  return preset.intervalFixtures[symbol] || preset.intervalFixtures[preset.defaultIntervalSymbol];
}

function buildInstrument(preset, intervalSymbol) {
  const intervalFixture = getIntervalFixture(preset, intervalSymbol);

  return {
    ...preset.instrument,
    chart: "ohlc",
    availableIntervals: Object.values(preset.intervalFixtures).map((fixture) => fixture.interval),
    interval: intervalFixture.interval,
  };
}

export { AVAILABLE_DRAW_MODES, buildInstrument, getIntervalFixture, getPresetById, reviewPresets };
