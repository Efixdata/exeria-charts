const { createRequire } = require("node:module");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const requireFromRepo = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const { MassiveAdapter, toMassiveTicker } = requireFromRepo(
  path.join(repoRoot, "packages/adapter-massive/dist/index.js"),
);

const ALLOWED_SYMBOLS = new Set([
  "AAPL",
  "MSFT",
  "EURUSD",
  "GBPUSD",
  "BTCUSD",
  "ETHUSD",
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
  const apiKey =
    process.env.MASSIVE_API_KEY?.trim() ?? process.env.POLYGON_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "MASSIVE_API_KEY (or POLYGON_API_KEY) is not set. Add it to apps/docs/.env.local for local demos.",
    );
  }

  return apiKey;
}

function getAdapter() {
  if (!adapter) {
    adapter = new MassiveAdapter({
      apiKey: getApiKey(),
    });
  }

  return adapter;
}

function normalizeSymbol(symbol) {
  const ticker = toMassiveTicker(String(symbol ?? "").trim());
  const compact = ticker.replace(/^X:|^C:/, "");

  if (!ALLOWED_SYMBOLS.has(compact)) {
    throw new Error(`Unsupported symbol for docs proxy: ${symbol}`);
  }

  return String(symbol ?? "").trim();
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function handleOhlcv(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = normalizeSymbol(url.searchParams.get("symbol"));
  const interval = url.searchParams.get("interval") ?? "1h";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), MAX_LIMIT) : 500;

  const massiveAdapter = getAdapter();
  await massiveAdapter.initialize({});

  const candles = await massiveAdapter.getHistoricalData(symbol, {
    interval,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  sendJson(res, 200, { candles });
}

async function handleTicker(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const symbol = normalizeSymbol(url.searchParams.get("symbol"));

  const massiveAdapter = getAdapter();
  await massiveAdapter.initialize({});

  const tick = await massiveAdapter.getCurrentPrice(symbol);
  sendJson(res, 200, { tick });
}

function registerMassiveRoutes(app) {
  app.get("/api/massive/ohlcv", (req, res) => {
    void handleOhlcv(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load OHLCV";
      sendJson(res, 500, { error: message });
    });
  });

  app.get("/api/massive/ticker", (req, res) => {
    void handleTicker(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load ticker";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerMassiveRoutes,
};
