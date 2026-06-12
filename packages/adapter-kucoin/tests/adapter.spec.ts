import { afterEach, describe, expect, it, vi } from "vitest";
import { KucoinAdapter } from "../src/adapter";

describe("KucoinAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize without errors", async () => {
    const adapter = new KucoinAdapter();
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should support configuration", async () => {
    const adapter = new KucoinAdapter({
      baseUrl: "https://api.kucoin.com",
      pageDelayMs: 300,
      requestTimeout: 5000,
      maxRetries: 3,
      pollingIntervalMs: 30_000,
    });
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should have required methods", () => {
    const adapter = new KucoinAdapter();
    expect(typeof adapter.initialize).toBe("function");
    expect(typeof adapter.getHistoricalData).toBe("function");
    expect(typeof adapter.getCurrentPrice).toBe("function");
    expect(typeof adapter.subscribeToUpdates).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("should map historical data to Exeria candles", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "200000",
          data: [["1000", "1", "1.5", "2", "0.5", "10", "12"]],
        }),
      }),
    );

    const adapter = new KucoinAdapter();
    const candles = await adapter.getHistoricalData("BTC-USDT", {
      interval: "1d",
      limit: 1,
    });

    expect(candles).toEqual([
      {
        stamp: 1_000_000,
        o: 1,
        h: 2,
        l: 0.5,
        c: 1.5,
        v: 10,
      },
    ]);
  });

  it("should disconnect without errors", async () => {
    const adapter = new KucoinAdapter();
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
