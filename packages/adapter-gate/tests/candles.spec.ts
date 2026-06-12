import { describe, expect, it } from "vitest";
import {
  mapGateCandleRow,
  mapGateCandleUpdateToTick,
} from "../src/candles";

describe("candle mapping", () => {
  it("maps REST candle rows", () => {
    const candle = mapGateCandleRow([
      "1700000000",
      "1000",
      "105",
      "110",
      "95",
      "100",
      "12.5",
      "true",
    ]);

    expect(candle.stamp).toBe(1_700_000_000_000);
    expect(candle.o).toBe(100);
    expect(candle.h).toBe(110);
    expect(candle.l).toBe(95);
    expect(candle.c).toBe(105);
    expect(candle.v).toBe(12.5);
  });

  it("maps websocket candle updates", () => {
    const tick = mapGateCandleUpdateToTick({
      t: "1700000060",
      o: "100",
      h: "106",
      l: "99",
      c: "104",
      a: "2.5",
      n: "1m_BTC_USDT",
    });

    expect(tick.stamp).toBe(1_700_000_060_000);
    expect(tick.price).toBe(104);
    expect(tick.c).toBe(104);
  });
});
