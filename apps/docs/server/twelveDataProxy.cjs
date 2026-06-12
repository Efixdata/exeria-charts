const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { TwelveDataAdapter } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-twelve-data/dist/index.js"),
);

const ALLOWED_SYMBOLS = new Set([
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
  "EUR/JPY",
  "AAPL",
  "QQQ",
  "BTC/USD",
]);

const MAX_LIMIT = 500;

let adapter;

function getApiKey() {
  return process.env.TWELVE_DATA_API_KEY?.trim() || "demo";
}

function getAdapter() {
  if (!adapter) {
    adapter = new TwelveDataAdapter({ apiKey: getApiKey() });
  }

  return adapter;
}

function normalizeSymbol(symbol) {
  const trimmed = String(symbol ?? "").trim();

  if (trimmed.includes("/")) {
    return trimmed.toUpperCase();
  }

  if (trimmed.includes("-")) {
    const [base, quote] = trimmed.toUpperCase().split("-");
    if (base && quote) {
      return `${base}/${quote}`;
    }
  }

  if (/^[A-Z]{6}$/i.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    return `${upper.slice(0, 3)}/${upper.slice(3)}`;
  }

  return trimmed.toUpperCase();
}

function assertAllowedSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);

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

  const twelveDataAdapter = getAdapter();
  await twelveDataAdapter.initialize({});

  const candles = await twelveDataAdapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = assertAllowedSymbol(url.searchParams.get("symbol"));

  const twelveDataAdapter = getAdapter();
  await twelveDataAdapter.initialize({});

  const tick = await twelveDataAdapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerTwelveDataRoutes(app) {
  app.get("/api/twelve-data/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/twelve-data/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerTwelveDataRoutes,
};
