import { afterEach, describe, expect, it, vi } from "vitest";
import { GateAdapter } from "../src/adapter";

describe("GateAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads historical candles and current price", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            [
              "1700000000",
              "1000",
              "101",
              "110",
              "95",
              "100",
              "12.5",
              "true",
            ],
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ currency_pair: "BTC_USDT", last: "101.5" }],
        }),
    );

    const adapter = new GateAdapter({ useWebSocket: false, pageDelayMs: 0 });
    await adapter.initialize({});

    const candles = await adapter.getHistoricalData("BTC-USDT", {
      interval: "1h",
      limit: 1,
    });
    const tick = await adapter.getCurrentPrice("BTC-USDT");

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(101);
    expect(tick.price).toBe(101.5);

    await adapter.disconnect();
  });
});
