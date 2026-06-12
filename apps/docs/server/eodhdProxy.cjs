const { createRequire } = require("node:module");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { EodhdAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-eodhd/dist/index.js"),
);

const ALLOWED_SYMBOLS = new Set([
  "AAPL",
  "TSLA",
  "VTI",
  "AMZN",
  "EURUSD",
  "EUR/USD",
  "BTC-USD",
  "BTC/USD",
]);

const MAX_LIMIT = 500;

let adapter;

function loadEnvLocal() {
  const envPath = path.join(__dirname, "../.env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

function getApiKey() {
  const apiKey = process.env.EODHD_API_KEY?.trim();
  if (apiKey) {
    return apiKey;
  }

  return "demo";
}

function getAdapter() {
  if (!adapter) {
    adapter = new EodhdAdapter({
      apiKey: getApiKey(),
      pollIntervalMs: 5000,
    });
  }

  return adapter;
}

function normalizeSymbol(symbol) {
  return String(symbol ?? "").trim();
}

function assertAllowedSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);
  const compact = normalized.replace(/\//g, "").replace(/-/g, "").toUpperCase();

  if (
    ALLOWED_SYMBOLS.has(normalized) ||
    ALLOWED_SYMBOLS.has(normalized.toUpperCase()) ||
    ALLOWED_SYMBOLS.has(compact)
  ) {
    return normalized;
  }

  throw new Error(`Unsupported symbol for docs proxy: ${symbol}`);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function handleOhlcv(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));
  const interval = url.searchParams.get("interval") ?? "1d";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), MAX_LIMIT) : 500;

  const eodhdAdapter = getAdapter();
  await eodhdAdapter.initialize({});

  const candles = await eodhdAdapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));

  const eodhdAdapter = getAdapter();
  await eodhdAdapter.initialize({});

  const tick = await eodhdAdapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerEodhdRoutes(app) {
  app.get("/api/eodhd/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/eodhd/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerEodhdRoutes,
};
