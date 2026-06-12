import { afterEach, describe, expect, it, vi } from "vitest";
import { FinageApiClient } from "../src/api-client";

describe("FinageApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and maps aggregate candles", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: "EURUSD",
        totalResults: 1,
        results: [
          {
            o: 1.1,
            h: 1.11,
            l: 1.09,
            c: 1.105,
            v: 100,
            t: 1717372800000,
          },
        ],
      }),
    } as Response);

    const client = new FinageApiClient({ apiKey: "test-key" });
    const candles = await client.getAggregates({
      symbol: "EUR/USD",
      interval: "1h",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(1.105);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/agg/forex/EURUSD/1/hour/"),
      expect.any(Object),
    );
  });

  it("fetches latest forex quote", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: "EURUSD",
        ask: 1.086,
        bid: 1.085,
        timestamp: 1717372800000,
      }),
    } as Response);

    const client = new FinageApiClient({ apiKey: "test-key" });
    const tick = await client.getLatestPrice("EURUSD");

    expect(tick.price).toBeCloseTo(1.0855, 4);
  });

  it("fetches stock aggregates", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: "AAPL",
        totalResults: 1,
        results: [
          {
            o: 290,
            h: 295,
            l: 289,
            c: 294,
            v: 1000,
            t: 1717372800000,
          },
        ],
      }),
    } as Response);

    const client = new FinageApiClient({ apiKey: "test-key" });
    const candles = await client.getAggregates({
      symbol: "AAPL",
      interval: "1d",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/agg/stock/AAPL/");
  });

  it("requires apiKey", () => {
    expect(() => new FinageApiClient({ apiKey: "" })).toThrow(
      "requires apiKey",
    );
  });
});
