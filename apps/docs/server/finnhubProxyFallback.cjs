const INTERVAL_MS = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "30m": 30 * 60_000,
  "1h": 3_600_000,
  "1d": 86_400_000,
  "1w": 7 * 86_400_000,
  "1M": 30 * 86_400_000,
};

function intervalToMs(interval) {
  return INTERVAL_MS[interval] ?? 3_600_000;
}

function hashSeed(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

function pseudoRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function isAccessError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /don't have access|no recent price|no_data/i.test(message);
}

function isStockSymbol(symbol) {
  const trimmed = symbol.trim();
  if (trimmed.includes(":") || trimmed.includes("/") || trimmed.includes("-")) {
    return false;
  }

  return /^[A-Z]{1,5}$/i.test(trimmed);
}

function pushCloseOnlyBar(candles, stamp, price) {
  candles.push({
    stamp,
    o: price,
    h: price,
    l: price,
    c: price,
    v: 0,
  });
}

function synthesizeCandlesFromQuote(quote, interval, limit) {
  const intervalMs = intervalToMs(interval);
  const anchorStamp =
    (quote.t ?? Math.floor(Date.now() / 1000)) < 1_000_000_000_000
      ? (quote.t ?? Math.floor(Date.now() / 1000)) * 1000
      : (quote.t ?? Date.now());
  const close = quote.c ?? quote.pc ?? 100;
  const start = quote.pc ?? close;
  const candles = [];

  for (let index = limit - 1; index >= 0; index -= 1) {
    const stamp = anchorStamp - index * intervalMs;
    const progress = limit <= 1 ? 1 : (limit - 1 - index) / (limit - 1);
    const price = start + (close - start) * progress;
    pushCloseOnlyBar(candles, stamp, price);
  }

  return candles.sort((left, right) => left.stamp - right.stamp);
}

function synthesizeDemoCandles(symbol, interval, limit) {
  const intervalMs = intervalToMs(interval);
  const random = pseudoRandom(hashSeed(symbol.toUpperCase()));
  const basePrices = {
    "EUR/USD": 1.085,
    EURUSD: 1.085,
    "GBP/USD": 1.265,
    GBPUSD: 1.265,
    "BINANCE:BTCUSDT": 95_000,
    BTCUSDT: 95_000,
    "BINANCE:ETHUSDT": 3_500,
    ETHUSDT: 3_500,
  };
  const compact = symbol.replace(/\//g, "").toUpperCase();
  const base = basePrices[symbol] ?? basePrices[compact] ?? 100;
  const now = Date.now();
  const candles = [];
  let price = base;

  for (let index = limit - 1; index >= 0; index -= 1) {
    const stamp = now - index * intervalMs;
    const drift = price * (random() - 0.5) * 0.01;
    const close = price + drift;
    pushCloseOnlyBar(candles, stamp, close);
    price = close;
  }

  return candles;
}

function synthesizeDemoTick(symbol) {
  const candles = synthesizeDemoCandles(symbol, "1m", 1);
  const last = candles[candles.length - 1];
  return {
    stamp: last.stamp,
    c: last.c,
    price: last.c,
  };
}

module.exports = {
  intervalToMs,
  isAccessError,
  isStockSymbol,
  synthesizeCandlesFromQuote,
  synthesizeDemoCandles,
  synthesizeDemoTick,
};
