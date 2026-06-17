const { createRequire } = require("node:module");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { FinnhubAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-finnhub/dist/index.js"),
);
const {
  isAccessError,
  isStockSymbol,
  synthesizeCandlesFromQuote,
  synthesizeDemoCandles,
  synthesizeDemoTick,
} = require("./finnhubProxyFallback.cjs");

const ALLOWED_SYMBOLS = new Set([
  "AAPL",
  "MSFT",
  "SPY",
  "QQQ",
  "EURUSD",
  "EUR/USD",
  "GBPUSD",
  "GBP/USD",
  "BTCUSDT",
  "BINANCE:BTCUSDT",
  "ETHUSDT",
  "BINANCE:ETHUSDT",
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
  const apiKey = process.env.FINNHUB_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "FINNHUB_API_KEY is not set. Add it to apps/docs/.env.local for local demos.",
    );
  }

  return apiKey;
}

function getAdapter() {
  if (!adapter) {
    adapter = new FinnhubAdapter({
      apiKey: getApiKey(),
      pollIntervalMs: 3000,
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

async function fetchStockQuote(symbol) {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams({
    symbol: symbol.replace(/\//g, "").replace(/-/g, "").toUpperCase(),
    token: apiKey,
  });
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?${searchParams.toString()}`,
  );
  const payload = await response.json();

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Failed to load Finnhub quote");
  }

  return payload;
}

async function loadCandlesWithFallback(symbol, interval, limit) {
  const finnhubAdapter = getAdapter();
  await finnhubAdapter.initialize({});

  try {
    const candles = await finnhubAdapter.getHistoricalData(symbol, {
      interval,
      limit,
    });

    if (candles.length > 0) {
      return { candles, fallback: false };
    }

    throw new Error("no_data");
  } catch (error) {
    if (!isAccessError(error)) {
      throw error;
    }

    if (isStockSymbol(symbol)) {
      const quote = await fetchStockQuote(symbol);
      return {
        candles: synthesizeCandlesFromQuote(quote, interval, limit),
        fallback: true,
      };
    }

    return {
      candles: synthesizeDemoCandles(symbol, interval, limit),
      fallback: true,
    };
  }
}

async function handleOhlcv(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));
  const interval = url.searchParams.get("interval") ?? "1h";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), MAX_LIMIT) : 500;

  const { candles, fallback } = await loadCandlesWithFallback(
    symbol,
    interval,
    Number.isFinite(limit) ? limit : 500,
  );

  sendJson(res, 200, { candles, ...(fallback ? { fallback: true } : {}) });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));

  const finnhubAdapter = getAdapter();
  await finnhubAdapter.initialize({});

  try {
    const tick = await finnhubAdapter.getCurrentPrice(symbol);
    sendJson(res, 200, { tick });
    return;
  } catch (error) {
    if (!isAccessError(error)) {
      throw error;
    }
  }

  if (isStockSymbol(symbol)) {
    const quote = await fetchStockQuote(symbol);
    const price = quote.c ?? quote.pc ?? 0;
    const rawStamp = quote.t ?? Math.floor(Date.now() / 1000);
    const stamp =
      rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

    sendJson(res, 200, {
      tick: { stamp, c: price, price },
      fallback: true,
    });
    return;
  }

  sendJson(res, 200, {
    tick: synthesizeDemoTick(symbol),
    fallback: true,
  });
}

function registerFinnhubRoutes(app) {
  app.get("/api/finnhub/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/finnhub/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerFinnhubRoutes,
};
