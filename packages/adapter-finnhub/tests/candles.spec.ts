import { describe, expect, it } from "vitest";
import {
  mapFinnhubCandlesResponse,
  mapParallelArraysToCandles,
} from "../src/candles";

describe("mapParallelArraysToCandles", () => {
  it("maps Finnhub parallel arrays and sorts ascending", () => {
    const candles = mapParallelArraysToCandles({
      s: "ok",
      t: [1717376400, 1717372800],
      o: [1.1, 1.0],
      h: [1.2, 1.1],
      l: [1.0, 0.9],
      c: [1.15, 1.05],
      v: [10, 5],
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(1717372800000);
    expect(candles[1]?.c).toBe(1.15);
  });
});

describe("mapFinnhubCandlesResponse", () => {
  it("returns empty array for no_data", () => {
    expect(mapFinnhubCandlesResponse({ s: "no_data" })).toEqual([]);
  });

  it("throws for unexpected status", () => {
    expect(() => mapFinnhubCandlesResponse({ s: "error" })).toThrow(
      "Finnhub candle error",
    );
  });
});
