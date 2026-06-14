const fs = require("node:fs/promises");
const path = require("node:path");

const ALLOWED_INSTRUMENTS = new Set(["EUR/USD", "GBP/USD", "EUR/GBP", "USD/JPY", "USD/CHF"]);
const MAX_LIMIT = 500;

const bundlePathByInstrument = {
  "EUR/USD": path.resolve(
    __dirname,
    "../src/components/ForexOpportunityApp/data/eur-usd-news-feed.json",
  ),
  "GBP/USD": path.resolve(
    __dirname,
    "../src/components/ForexOpportunityApp/data/gbp-usd-news-feed.json",
  ),
  "EUR/GBP": path.resolve(
    __dirname,
    "../src/components/ForexOpportunityApp/data/eur-gbp-news-feed.json",
  ),
  "USD/JPY": path.resolve(
    __dirname,
    "../src/components/ForexOpportunityApp/data/usd-jpy-news-feed.json",
  ),
  "USD/CHF": path.resolve(
    __dirname,
    "../src/components/ForexOpportunityApp/data/usd-chf-news-feed.json",
  ),
};

const bundleCache = new Map();

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function assertInstrument(value) {
  const instrument = value?.trim();
  if (!instrument || !ALLOWED_INSTRUMENTS.has(instrument)) {
    throw new Error(`Unsupported instrument: ${value ?? "(missing)"}`);
  }

  return instrument;
}

async function loadBundle(instrument) {
  if (bundleCache.has(instrument)) {
    return bundleCache.get(instrument);
  }

  const filePath = bundlePathByInstrument[instrument];
  if (!filePath) {
    throw new Error(`No news feed bundle for ${instrument}`);
  }

  const raw = await fs.readFile(filePath, "utf8");
  const bundle = JSON.parse(raw);
  bundleCache.set(instrument, bundle);
  return bundle;
}

function filterEvents(events, { from, to, limit }) {
  let filtered = [...events];

  if (from != null) {
    filtered = filtered.filter((event) => event.releasedAt >= from);
  }

  if (to != null) {
    filtered = filtered.filter((event) => event.releasedAt <= to);
  }

  filtered.sort((left, right) => left.releasedAt - right.releasedAt);

  if (limit != null && limit > 0) {
    filtered = filtered.slice(-limit);
  }

  return filtered;
}

async function handleNewsFeed(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const instrument = assertInstrument(url.searchParams.get("instrument"));
  const from = url.searchParams.has("from") ? Number(url.searchParams.get("from")) : undefined;
  const to = url.searchParams.has("to") ? Number(url.searchParams.get("to")) : undefined;
  const limit = url.searchParams.has("limit")
    ? Math.min(MAX_LIMIT, Number(url.searchParams.get("limit")))
    : undefined;

  const bundle = await loadBundle(instrument);
  const events = filterEvents(bundle.events ?? [], { from, to, limit });

  sendJson(res, 200, {
    instrument,
    events,
    nextCursor: null,
  });
}

function registerNewsFeedRoutes(app) {
  app.get("/api/news-feed", (req, res) => {
    void handleNewsFeed(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load news feed";
      sendJson(res, 500, { error: message });
    });
  });
}

module.exports = {
  registerNewsFeedRoutes,
};
