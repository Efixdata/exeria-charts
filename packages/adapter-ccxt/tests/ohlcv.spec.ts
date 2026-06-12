import { describe, expect, it } from "vitest";
import { mapOhlcvToCandles, mapTickerToTick } from "../src/ohlcv";

describe("mapOhlcvToCandles", () => {
  it("maps CCXT OHLCV rows to Exeria candles", () => {
    expect(
      mapOhlcvToCandles([[1_700_000_000_000, 10, 12, 9, 11, 100]]),
    ).toEqual([
      {
        stamp: 1_700_000_000_000,
        o: 10,
        h: 12,
        l: 9,
        c: 11,
        v: 100,
      },
    ]);
  });
});

describe("mapTickerToTick", () => {
  it("prefers last price from ticker", () => {
    expect(
      mapTickerToTick({
        symbol: "BTC/USDT",
        timestamp: 1_700_000_000_000,
        last: 42_000,
      }),
    ).toEqual({
      stamp: 1_700_000_000_000,
      c: 42_000,
      price: 42_000,
    });
  });
});
