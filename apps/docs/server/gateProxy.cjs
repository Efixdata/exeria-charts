const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { GateAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-gate/dist/index.js"),
);

const ALLOWED_SYMBOLS = new Set([
  "BTC_USDT",
  "ETH_USDT",
  "SOL_USDT",
  "GT_USDT",
  "BTC-USDT",
  "ETH-USDT",
  "SOL-USDT",
  "GT-USDT",
]);

const MAX_LIMIT = 500;

let adapter;

function getAdapter() {
  if (!adapter) {
    adapter = new GateAdapter({
      pageDelayMs: 300,
      useWebSocket: false,
      pollingIntervalMs: 5000,
    });
  }

  return adapter;
}

function normalizeSymbol(symbol) {
  return String(symbol ?? "").trim();
}

function assertAllowedSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);
  const upper = normalized.toUpperCase();
  const underscored = upper.replace(/-/g, "_");

  if (
    ALLOWED_SYMBOLS.has(normalized) ||
    ALLOWED_SYMBOLS.has(upper) ||
    ALLOWED_SYMBOLS.has(underscored)
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
  const interval = url.searchParams.get("interval") ?? "1h";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), MAX_LIMIT) : 500;

  const gateAdapter = getAdapter();
  await gateAdapter.initialize({});

  const candles = await gateAdapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));

  const gateAdapter = getAdapter();
  await gateAdapter.initialize({});

  const tick = await gateAdapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerGateRoutes(app) {
  app.get("/api/gate/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/gate/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerGateRoutes,
};
