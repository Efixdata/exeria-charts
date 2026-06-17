const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { CoinbaseAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-coinbase/dist/index.js"),
);

const ALLOWED_SYMBOLS = new Set(["BTC-USD", "ETH-USD", "SOL-USD", "BTC-USDC"]);

const MAX_LIMIT = 500;

let adapter;

function getAdapter() {
  if (!adapter) {
    adapter = new CoinbaseAdapter({
      pageDelayMs: 300,
      useWebSocket: false,
    });
  }

  return adapter;
}

function assertAllowedSymbol(symbol) {
  const normalized = String(symbol ?? "").trim().toUpperCase();

  if (!ALLOWED_SYMBOLS.has(normalized)) {
    throw new Error(`Unsupported symbol for docs proxy: ${symbol}`);
  }

  return normalized;
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

  const coinbaseAdapter = getAdapter();
  await coinbaseAdapter.initialize({});

  const candles = await coinbaseAdapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));

  const coinbaseAdapter = getAdapter();
  await coinbaseAdapter.initialize({});

  const tick = await coinbaseAdapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerCoinbaseRoutes(app) {
  app.get("/api/coinbase/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/coinbase/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerCoinbaseRoutes,
};
