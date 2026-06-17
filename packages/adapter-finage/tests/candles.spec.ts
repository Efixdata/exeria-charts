import { describe, expect, it } from "vitest";
import { mapAggregateBarsToCandles } from "../src/candles";

describe("mapAggregateBarsToCandles", () => {
  it("maps Finage aggregate bars and sorts ascending", () => {
    const candles = mapAggregateBarsToCandles([
      {
        o: 1.1,
        h: 1.2,
        l: 1.0,
        c: 1.15,
        v: 10,
        t: 1717376400000,
      },
      {
        o: 1.0,
        h: 1.1,
        l: 0.9,
        c: 1.05,
        v: 5,
        t: 1717372800000,
      },
    ]);

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(1717372800000);
    expect(candles[1]?.c).toBe(1.15);
  });
});
