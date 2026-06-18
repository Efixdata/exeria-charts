const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { KucoinAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-kucoin/dist/index.js"),
);

const ALLOWED_SYMBOLS = new Set([
  "BTC-USDT",
  "ETH-USDT",
  "SOL-USDT",
  "ADA-USDT",
  "XRP-USDT",
]);

const MAX_LIMIT = 500;

let adapter;

function getAdapter() {
  if (!adapter) {
    adapter = new KucoinAdapter({
      pageDelayMs: 300,
      pollingIntervalMs: 5000,
    });
  }

  return adapter;
}

function normalizeSymbol(symbol) {
  return String(symbol ?? "").trim().toUpperCase();
}

function assertAllowedSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);

  if (ALLOWED_SYMBOLS.has(normalized)) {
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
  const interval = url.searchParams.get("interval") ?? "1h";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), MAX_LIMIT) : 500;

  const kucoinAdapter = getAdapter();
  await kucoinAdapter.initialize({});

  const candles = await kucoinAdapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));

  const kucoinAdapter = getAdapter();
  await kucoinAdapter.initialize({});

  const tick = await kucoinAdapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerKucoinRoutes(app) {
  app.get("/api/kucoin/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/kucoin/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerKucoinRoutes,
};
