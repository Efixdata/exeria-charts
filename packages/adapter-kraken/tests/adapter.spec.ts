import { afterEach, describe, expect, it, vi } from "vitest";
import { KrakenAdapter } from "../src/adapter";

describe("KrakenAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize without errors", async () => {
    const adapter = new KrakenAdapter();
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should support configuration", async () => {
    const adapter = new KrakenAdapter({
      baseUrl: "https://api.kraken.com",
      pageDelayMs: 1000,
      requestTimeout: 5000,
      maxRetries: 3,
    });
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should have required methods", () => {
    const adapter = new KrakenAdapter();
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
          error: [],
          result: {
            XXBTZUSD: [[1000, "1", "2", "0.5", "1.5", "1.2", "10", 3]],
            last: 1000,
          },
        }),
      }),
    );

    const adapter = new KrakenAdapter();
    const candles = await adapter.getHistoricalData("BTC/USD", {
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
    const adapter = new KrakenAdapter();
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
