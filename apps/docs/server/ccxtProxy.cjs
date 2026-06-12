const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { CcxtAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-ccxt/dist/index.js"),
);

const ALLOWED_EXCHANGES = new Set([
  "binance",
  "bybit",
  "okx",
  "kraken",
  "coinbase",
  "kucoin",
  "gate",
  "bitfinex",
  "mexc",
]);

const adapters = new Map();
const MAX_LIMIT = 1000;

function getAdapter(exchangeId) {
  const normalized = String(exchangeId ?? "").trim().toLowerCase();

  if (!ALLOWED_EXCHANGES.has(normalized)) {
    throw new Error(`Unsupported exchange: ${exchangeId}`);
  }

  if (!adapters.has(normalized)) {
    adapters.set(normalized, new CcxtAdapter({ exchangeId: normalized }));
  }

  return adapters.get(normalized);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function handleOhlcv(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const exchange = url.searchParams.get("exchange");
  const symbol = url.searchParams.get("symbol");
  const interval = url.searchParams.get("interval") ?? "1h";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), MAX_LIMIT) : 500;

  if (!symbol) {
    sendJson(res, 400, { error: "Missing symbol query parameter" });
    return;
  }

  const adapter = getAdapter(exchange);
  await adapter.initialize({});

  const candles = await adapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const exchange = url.searchParams.get("exchange");
  const symbol = url.searchParams.get("symbol");

  if (!symbol) {
    sendJson(res, 400, { error: "Missing symbol query parameter" });
    return;
  }

  const adapter = getAdapter(exchange);
  await adapter.initialize({});

  const tick = await adapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerCcxtRoutes(app) {
  app.get("/api/ccxt/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/ccxt/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerCcxtRoutes,
};
