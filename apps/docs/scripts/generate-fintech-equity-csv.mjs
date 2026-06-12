#!/usr/bin/env node
/**
 * Generates mock daily equity CSV fixtures for the Fintech Wealth demo.
 * Run: node apps/docs/scripts/generate-fintech-equity-csv.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../static/data/fintech-equity");

const SYMBOLS = {
  AAPL: { start: 178.5, drift: 0.00085, vol: 0.018, label: "Apple" },
  VWCE: { start: 98.2, drift: 0.00055, vol: 0.011, label: "Vanguard FTSE All-World" },
  SPY: { start: 472.4, drift: 0.00048, vol: 0.0095, label: "S&P 500 ETF" },
  MSFT: { start: 398.6, drift: 0.00072, vol: 0.014, label: "Microsoft" },
  NVDA: { start: 118.4, drift: 0.00135, vol: 0.028, label: "Nvidia" },
  GOOGL: { start: 165.8, drift: 0.00068, vol: 0.016, label: "Alphabet" },
};

const TRADING_DAYS = 540;

function mulberry32(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSymbol(symbol) {
  return [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function generateSeries(symbol, config) {
  const rand = mulberry32(hashSymbol(symbol) * 97);
  const rows = [];
  let price = config.start;
  const startDate = new Date("2023-01-03T00:00:00Z");

  for (let index = 0; index < TRADING_DAYS; index += 1) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);

    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
      continue;
    }

    const shock = (rand() - 0.5) * config.vol;
    const next = price * (1 + config.drift + shock);
    const open = price;
    const close = Math.max(0.01, next);
    const high = Math.max(open, close) * (1 + rand() * 0.008);
    const low = Math.min(open, close) * (1 - rand() * 0.008);
    const volume = Math.round(4_000_000 + rand() * 18_000_000);

    rows.push({
      date: date.toISOString().slice(0, 10),
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume,
    });

    price = close;
  }

  return rows;
}

function toCsv(rows) {
  const header = "date,open,high,low,close,volume";
  const body = rows.map(
    (row) => `${row.date},${row.open},${row.high},${row.low},${row.close},${row.volume}`,
  );
  return [header, ...body].join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const [symbol, config] of Object.entries(SYMBOLS)) {
    const rows = generateSeries(symbol, config);
    const csv = toCsv(rows);
    await writeFile(path.join(OUT_DIR, `${symbol}.csv`), `${csv}\n`, "utf8");
    console.log(`Wrote ${symbol}.csv (${rows.length} rows) — ${config.label}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
