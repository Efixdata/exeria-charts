#!/usr/bin/env node
/**
 * Generates 10 static OHLCV datasets (5 FX pairs × M15/H1) for Forex Opportunity Radar.
 * Fetches real FX bars from Twelve Data (when API key allows) or Yahoo Finance, keeps native
 * bar timestamps, and trims obvious bad-tick wicks (1000 candles per file).
 *
 * Usage: node apps/docs/scripts/generate-forex-static-data.mjs [--allow-derived]
 * Env:   TWELVE_DATA_API_KEY (optional; defaults to "demo")
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(
  __dirname,
  "../src/components/ForexOpportunityApp/data",
);

const CANDLE_COUNT = 1000;
const FETCH_BUFFER = 600;
const API_KEY = process.env.TWELVE_DATA_API_KEY?.trim() || "demo";
const ALLOW_DERIVED = process.argv.includes("--allow-derived");
const TWELVE_DATA_DELAY_MS = API_KEY === "demo" ? 3000 : 8000;
const YAHOO_DELAY_MS = 400;
const MAX_RETRIES = 3;

const PAIRS = [
  { symbol: "EUR/USD", slug: "eur-usd", decimals: 5, scaleFrom: null },
  { symbol: "GBP/USD", slug: "gbp-usd", decimals: 5, scaleFrom: "EUR/USD", scaleRatio: 1.268 / 1.084 },
  { symbol: "USD/JPY", slug: "usd-jpy", decimals: 5, scaleFrom: "EUR/USD", scaleRatio: 149.2 / 1.084 },
  { symbol: "USD/CHF", slug: "usd-chf", decimals: 5, scaleFrom: "EUR/USD", scaleRatio: 0.884 / 1.084 },
  { symbol: "EUR/GBP", slug: "eur-gbp", decimals: 5, scaleFrom: "EUR/USD", scaleRatio: 0.855 / 1.084 },
];

const TIMEFRAMES = [
  { id: "m15", interval: "15m", twelveDataInterval: "15min", stepMs: 15 * 60 * 1000 },
  { id: "h1", interval: "1h", twelveDataInterval: "1h", stepMs: 60 * 60 * 1000 },
];

const YAHOO_SYMBOLS = {
  "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USD/JPY": "USDJPY=X",
  "USD/CHF": "USDCHF=X",
  "EUR/GBP": "EURGBP=X",
};

const YAHOO_FETCH_CONFIG = {
  m15: { interval: "15m", range: "1mo" },
  h1: { interval: "60m", range: "6mo" },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundPrice(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function median(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function parseTwelveDataDatetime(datetime) {
  const normalized = datetime.trim();
  const isoLike = normalized.includes("T")
    ? normalized
    : normalized.replace(" ", "T");
  return Date.parse(isoLike.endsWith("Z") ? isoLike : `${isoLike}Z`);
}

function mergeOhlcGroup(group) {
  return {
    stamp: group[0].stamp,
    o: group[0].o,
    h: Math.max(...group.map((bar) => bar.h)),
    l: Math.min(...group.map((bar) => bar.l)),
    c: group[group.length - 1].c,
    v: group.reduce((sum, bar) => sum + (bar.v ?? 0), 0),
  };
}

function aggregateCandles(candles, factor) {
  const usable = candles.slice(-(CANDLE_COUNT * factor));
  const aggregated = [];

  for (let index = 0; index + factor <= usable.length; index += factor) {
    aggregated.push(mergeOhlcGroup(usable.slice(index, index + factor)));
  }

  if (aggregated.length < CANDLE_COUNT) {
    throw new Error(
      `Expected at least ${CANDLE_COUNT} aggregated candles, got ${aggregated.length}`,
    );
  }

  return aggregated.slice(-CANDLE_COUNT);
}

async function fetchTwelveDataCandles(symbol, twelveDataInterval) {
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", twelveDataInterval);
  url.searchParams.set("outputsize", String(CANDLE_COUNT + FETCH_BUFFER));
  url.searchParams.set("apikey", API_KEY);

  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await sleep(TWELVE_DATA_DELAY_MS * (attempt + 1));
    }

    try {
      const response = await fetch(url);
      if (response.status === 401) {
        throw new Error(`Twelve Data HTTP 401 for ${symbol} ${twelveDataInterval}`);
      }

      if (response.status === 429) {
        lastError = new Error(`Twelve Data HTTP 429 for ${symbol} ${twelveDataInterval}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Twelve Data HTTP ${response.status} for ${symbol} ${twelveDataInterval}`);
      }

      const payload = await response.json();
      if (payload.status === "error") {
        lastError = new Error(
          `Twelve Data error for ${symbol} ${twelveDataInterval}: ${payload.message ?? "unknown"}`,
        );
        continue;
      }

      if (!Array.isArray(payload.values)) {
        throw new Error(`Twelve Data malformed response for ${symbol} ${twelveDataInterval}`);
      }

      const candles = payload.values
        .map((bar) => ({
          stamp: parseTwelveDataDatetime(bar.datetime),
          o: parseFloat(bar.open),
          h: parseFloat(bar.high),
          l: parseFloat(bar.low),
          c: parseFloat(bar.close),
          v: bar.volume ? parseFloat(bar.volume) : 0,
        }))
        .sort((a, b) => a.stamp - b.stamp);

      if (candles.length < CANDLE_COUNT) {
        throw new Error(
          `Expected at least ${CANDLE_COUNT} candles for ${symbol} ${twelveDataInterval}, got ${candles.length}`,
        );
      }

      return candles.slice(-(CANDLE_COUNT + FETCH_BUFFER));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${symbol} ${twelveDataInterval}`);
}

async function fetchYahooFinanceCandles(symbol, tf) {
  const yahooSymbol = YAHOO_SYMBOLS[symbol];
  const config = YAHOO_FETCH_CONFIG[tf.id];

  if (!yahooSymbol || !config) {
    throw new Error(`No Yahoo Finance mapping for ${symbol} ${tf.id}`);
  }

  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`);
  url.searchParams.set("interval", config.interval);
  url.searchParams.set("range", config.range);

  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await sleep(YAHOO_DELAY_MS * (attempt + 1));
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "exeria-charts-forex-static-generator/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance HTTP ${response.status} for ${symbol} ${tf.interval}`);
      }

      const payload = await response.json();
      const result = payload.chart?.result?.[0];
      const timestamps = result?.timestamp;
      const quote = result?.indicators?.quote?.[0];

      if (!Array.isArray(timestamps) || !quote) {
        throw new Error(`Yahoo Finance malformed response for ${symbol} ${tf.interval}`);
      }

      const candles = timestamps
        .map((stampSeconds, index) => {
          const o = quote.open?.[index];
          const h = quote.high?.[index];
          const l = quote.low?.[index];
          const c = quote.close?.[index];

          if ([o, h, l, c].some((value) => typeof value !== "number" || Number.isNaN(value))) {
            return null;
          }

          return {
            stamp: stampSeconds * 1000,
            o,
            h,
            l,
            c,
            v: typeof quote.volume?.[index] === "number" ? quote.volume[index] : 0,
          };
        })
        .filter((bar) => bar !== null)
        .sort((a, b) => a.stamp - b.stamp);

      if (config.aggregateFactor) {
        return aggregateCandles(candles, config.aggregateFactor);
      }

      if (candles.length < CANDLE_COUNT) {
        throw new Error(
          `Expected ${CANDLE_COUNT} Yahoo candles for ${symbol} ${tf.interval}, got ${candles.length}`,
        );
      }

      return candles.slice(-CANDLE_COUNT);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`Failed to fetch Yahoo Finance data for ${symbol} ${tf.interval}`);
}

function isWeekend(stamp) {
  const day = new Date(stamp).getUTCDay();
  return day === 0 || day === 6;
}

function dropWeekendBars(candles) {
  return candles.filter((candle) => !isWeekend(candle.stamp));
}

function isStaleBar(candle, previous, decimals) {
  const tick = 10 ** -decimals;
  const range = candle.h - candle.l;
  const body = Math.abs(candle.c - candle.o);

  if (range <= tick * 3 && body <= tick * 3) {
    return true;
  }

  if (
    previous &&
    candle.h === previous.h &&
    candle.l === previous.l &&
    Math.abs(candle.c - previous.c) <= tick &&
    Math.abs(candle.o - previous.o) <= tick
  ) {
    return true;
  }

  return false;
}

function trimStaleSuffix(candles, decimals) {
  const minLength = Math.floor(CANDLE_COUNT * 0.92);
  const trimmed = [...candles];

  while (trimmed.length > minLength) {
    const tail = trimmed.slice(-10);
    const staleCount = tail.filter((candle, index) =>
      isStaleBar(candle, index > 0 ? tail[index - 1] : trimmed[trimmed.length - 11], decimals),
    ).length;

    if (staleCount < 8) {
      break;
    }

    trimmed.pop();
  }

  return trimmed;
}

function normalizeCandleSeries(candles, decimals) {
  const ranges = candles
    .map((candle) => candle.h - candle.l)
    .filter((range) => range > 0);
  const medianRange = median(ranges) || 10 ** -(decimals - 1);
  const tick = 10 ** -decimals;

  return candles.map((candle) => {
    const bodyHigh = Math.max(candle.o, candle.c);
    const bodyLow = Math.min(candle.o, candle.c);
    const body = bodyHigh - bodyLow;
    const range = candle.h - candle.l;
    let high = candle.h;
    let low = candle.l;

    // Twelve Data often leaves a stale session high/low on otherwise flat M15 bars.
    if (range > medianRange * 1.1 && body < Math.max(tick * 2, range * 0.22)) {
      const maxWick = Math.max(medianRange * 0.85, tick * 4);
      high = Math.min(high, bodyHigh + maxWick);
      low = Math.max(low, bodyLow - maxWick);
    }

    return {
      stamp: candle.stamp,
      o: roundPrice(candle.o, decimals),
      h: roundPrice(Math.max(high, bodyHigh), decimals),
      l: roundPrice(Math.min(low, bodyLow), decimals),
      c: roundPrice(candle.c, decimals),
      v: typeof candle.v === "number" ? candle.v : 0,
    };
  });
}

function prepareCandleSeries(sourceCandles, decimals) {
  const candles = dropWeekendBars(
    sourceCandles.map((candle) => ({
      stamp: candle.stamp,
      o: candle.o,
      h: candle.h,
      l: candle.l,
      c: candle.c,
      v: typeof candle.v === "number" ? candle.v : 0,
    })),
  );

  const normalized = trimStaleSuffix(normalizeCandleSeries(candles, decimals), decimals);

  if (normalized.length < CANDLE_COUNT) {
    throw new Error(`Expected at least ${CANDLE_COUNT} candles, got ${normalized.length}`);
  }

  return normalized.slice(-CANDLE_COUNT);
}

function scaleCandleSeries(sourceCandles, ratio, decimals) {
  return sourceCandles.map((candle) => ({
    stamp: candle.stamp,
    o: roundPrice(candle.o * ratio, decimals),
    h: roundPrice(candle.h * ratio, decimals),
    l: roundPrice(candle.l * ratio, decimals),
    c: roundPrice(candle.c * ratio, decimals),
    v: candle.v,
  }));
}

async function resolveSourceCandles(pair, tf, fetchedByKey, sourceByKey) {
  const fetchKey = `${pair.symbol}:${tf.id}`;

  try {
    const fetched = await fetchTwelveDataCandles(pair.symbol, tf.twelveDataInterval);
    fetchedByKey.set(fetchKey, fetched);
    sourceByKey.set(fetchKey, "twelvedata");
    console.log(`    ✓ Twelve Data (${fetched.length} bars)`);
    return fetched;
  } catch (error) {
    console.warn(`    ! Twelve Data failed: ${error.message}`);
  }

  try {
    const fetched = await fetchYahooFinanceCandles(pair.symbol, tf);
    fetchedByKey.set(fetchKey, fetched);
    sourceByKey.set(fetchKey, "yahoo-finance");
    console.log(`    ✓ Yahoo Finance (${fetched.length} bars)`);
    return fetched;
  } catch (error) {
    console.warn(`    ! Yahoo Finance failed: ${error.message}`);
  }

  if (ALLOW_DERIVED && pair.scaleFrom) {
    const templateKey = `${pair.scaleFrom}:${tf.id}`;
    let template = fetchedByKey.get(templateKey);

    if (!template) {
      const templatePair = PAIRS.find((item) => item.symbol === pair.scaleFrom);
      if (templatePair) {
        template = await resolveSourceCandles(templatePair, tf, fetchedByKey, sourceByKey);
      }
    }

    if (template) {
      sourceByKey.set(fetchKey, "twelvedata-derived");
      console.log(`    → derived from ${pair.scaleFrom} (ratio ${pair.scaleRatio})`);
      return scaleCandleSeries(template, pair.scaleRatio, pair.decimals);
    }
  }

  throw new Error(`No live source candles available for ${pair.symbol} ${tf.interval}`);
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const fetchedByKey = new Map();
  const sourceByKey = new Map();
  const writtenSources = [];
  let manifestEndStamp = 0;

  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`API key: ${API_KEY === "demo" ? "demo" : "(custom)"}`);
  console.log(`Derived fallback: ${ALLOW_DERIVED ? "enabled" : "disabled"}`);

  for (const tf of TIMEFRAMES) {
    console.log(`\n[${tf.id}]`);

    for (const pair of PAIRS) {
      const filename = `${pair.slug}-${tf.id}.json`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      const fetchKey = `${pair.symbol}:${tf.id}`;

      console.log(`  Fetching ${pair.symbol} ${tf.interval}…`);
      const source = await resolveSourceCandles(pair, tf, fetchedByKey, sourceByKey);
      const candles = prepareCandleSeries(source, pair.decimals);
      const sourceLabel = sourceByKey.get(fetchKey) ?? "unknown";
      const endStamp = candles.at(-1)?.stamp ?? 0;
      manifestEndStamp = Math.max(manifestEndStamp, endStamp);

      const dataset = {
        symbol: pair.symbol,
        timeframeId: tf.id,
        interval: tf.interval,
        endStamp,
        candleCount: CANDLE_COUNT,
        source: sourceLabel,
        generatedAt: new Date().toISOString(),
        candles,
      };

      await fs.writeFile(outputPath, `${JSON.stringify(dataset)}\n`, "utf8");
      writtenSources.push({ file: filename, source: sourceLabel });
      await sleep(sourceLabel === "twelvedata" ? TWELVE_DATA_DELAY_MS : YAHOO_DELAY_MS);
    }
  }

  const manifest = {
    endStamp: manifestEndStamp,
    candleCount: CANDLE_COUNT,
    pairs: PAIRS.map((pair) => pair.symbol),
    timeframes: TIMEFRAMES.map((tf) => tf.id),
    files: PAIRS.flatMap((pair) =>
      TIMEFRAMES.map((tf) => `${pair.slug}-${tf.id}.json`),
    ),
    sources: Object.fromEntries(
      writtenSources.map((entry) => [entry.file, entry.source]),
    ),
  };

  await fs.writeFile(
    path.join(OUTPUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  const derivedCount = writtenSources.filter((entry) => entry.source === "twelvedata-derived").length;
  const yahooCount = writtenSources.filter((entry) => entry.source === "yahoo-finance").length;
  const twelveCount = writtenSources.filter((entry) => entry.source === "twelvedata").length;

  console.log("\nSource summary:");
  console.log(`  Twelve Data: ${twelveCount}`);
  console.log(`  Yahoo Finance: ${yahooCount}`);
  console.log(`  Derived: ${derivedCount}`);

  if (derivedCount > 0 && !ALLOW_DERIVED) {
    throw new Error(`${derivedCount} dataset(s) would be derived — re-run with a valid TWELVE_DATA_API_KEY`);
  }

  console.log("\nDone — 10 datasets + manifest.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
