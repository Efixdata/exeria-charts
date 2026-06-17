import { describe, expect, it } from "vitest";
import {
  mapEodCandles,
  mapIntradayCandles,
  parseEodDateStamp,
} from "../src/candles";

describe("mapEodCandles", () => {
  it("maps EOD rows and sorts ascending", () => {
    const candles = mapEodCandles([
      {
        date: "2024-01-03",
        open: 2,
        high: 3,
        low: 1,
        close: 2.5,
        volume: 20,
      },
      {
        date: "2024-01-02",
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 10,
      },
    ]);

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(parseEodDateStamp("2024-01-02"));
    expect(candles[1]?.c).toBe(2.5);
  });
});

describe("mapIntradayCandles", () => {
  it("maps intraday rows using unix timestamps", () => {
    const candles = mapIntradayCandles([
      {
        timestamp: 1717372800,
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 10,
      },
    ]);

    expect(candles).toHaveLength(1);
    expect(candles[0]?.stamp).toBe(1717372800000);
    expect(candles[0]?.c).toBe(1.5);
  });

  it("maps intraday rows using datetime strings", () => {
    const candles = mapIntradayCandles([
      {
        datetime: "2024-06-03 10:00:00",
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 10,
      },
    ]);

    expect(candles[0]?.stamp).toBeGreaterThan(0);
  });
});
