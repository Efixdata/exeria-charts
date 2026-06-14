#!/usr/bin/env node
/**
 * Re-slices sparkline close prices in arb-signals-feed.json from static OHLCV fixtures.
 * Run after regenerating forex candle data: npm run generate:arb-signal-sparklines
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../src/components/ForexOpportunityApp/data");
const BUNDLE_PATH = path.join(DATA_DIR, "arb-signals-feed.json");

const PAIR_SLUGS = {
  "EUR/USD": "eur-usd",
  "GBP/USD": "gbp-usd",
  "USD/JPY": "usd-jpy",
  "USD/CHF": "usd-chf",
  "EUR/GBP": "eur-gbp",
};

function datasetFile(instrument, timeframe) {
  const slug = PAIR_SLUGS[instrument];
  if (!slug) {
    throw new Error(`Unknown instrument: ${instrument}`);
  }
  return path.join(DATA_DIR, `${slug}-${timeframe}.json`);
}

function resolveBarIndex(candles, stamp) {
  if (!candles.length || !Number.isFinite(stamp)) {
    return 0;
  }

  let lo = 0;
  let hi = candles.length - 1;
  let candidate = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const candleStamp = candles[mid]?.stamp;

    if (candleStamp === undefined) {
      break;
    }

    if (candleStamp <= stamp) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return candidate >= 0 ? candidate : 0;
}

function sliceSparkline(candles, endIndex, points) {
  const start = Math.max(0, endIndex - points + 1);
  return candles.slice(start, endIndex + 1).map((candle) => +candle.c.toFixed(5));
}

function sliceEventSparkline(candles, eventIndex, before = 10, after = 13) {
  const start = Math.max(0, eventIndex - before);
  const end = Math.min(candles.length - 1, eventIndex + after);
  return candles.slice(start, end + 1).map((candle) => +candle.c.toFixed(5));
}

async function loadCandles(instrument, timeframe) {
  const raw = await fs.readFile(datasetFile(instrument, timeframe), "utf8");
  return JSON.parse(raw).candles;
}

async function main() {
  const bundle = JSON.parse(await fs.readFile(BUNDLE_PATH, "utf8"));

  for (const signal of bundle.signals) {
    const { instrument, timeframe } = signal.chartScene;
    const candles = await loadCandles(instrument, timeframe);
    const barIndex = resolveBarIndex(candles, signal.detectedAt);

    signal.sparkline =
      signal.category === "event"
        ? sliceEventSparkline(candles, barIndex)
        : sliceSparkline(candles, barIndex, 24);
  }

  await fs.writeFile(BUNDLE_PATH, `${JSON.stringify(bundle, null, 2)}\n`);
  console.log(`Updated sparklines for ${bundle.signals.length} signals in arb-signals-feed.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
