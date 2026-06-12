import { afterEach, describe, expect, it, vi } from "vitest";
import { CoingeckoAdapter } from "../src/adapter";

describe("CoingeckoAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize without errors", async () => {
    const adapter = new CoingeckoAdapter();
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should support configuration", async () => {
    const adapter = new CoingeckoAdapter({
      baseUrl: "https://api.coingecko.com/api/v3",
      pollIntervalMs: 60_000,
      requestTimeout: 5000,
      maxRetries: 3,
    });
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should have required methods", () => {
    const adapter = new CoingeckoAdapter();
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
        json: async () => [[1000, 1, 2, 0.5, 1.5]],
      }),
    );

    const adapter = new CoingeckoAdapter();
    const candles = await adapter.getHistoricalData("bitcoin", {
      interval: "1d",
      limit: 1,
    });

    expect(candles).toEqual([
      {
        stamp: 1000,
        o: 1,
        h: 2,
        l: 0.5,
        c: 1.5,
        v: 0,
      },
    ]);
  });

  it("should disconnect without errors", async () => {
    const adapter = new CoingeckoAdapter();
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
