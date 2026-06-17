import { afterEach, describe, expect, it, vi } from "vitest";
import { MassiveApiClient } from "../src/api-client";

function bar(time: number, close = 100) {
  return { t: time, o: 99, h: 101, l: 98, c: close, v: 10 };
}

describe("MassiveApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses aggregate bars for stocks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [bar(1_700_000_000_000, 101), bar(1_700_003_600_000, 102)],
        }),
      }),
    );

    const client = new MassiveApiClient({ apiKey: "test-key", pageDelayMs: 0 });
    const candles = await client.getAggregates({
      symbol: "AAPL",
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(1_700_000_000_000);
    expect(candles[1]?.c).toBe(102);

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/v2/aggs/ticker/AAPL/range/1/hour/");
    expect(requestUrl).toContain("apiKey=test-key");
  });

  it("uses crypto ticker prefix", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "OK", results: [bar(1_700_000_000_000)] }),
      }),
    );

    const client = new MassiveApiClient({ apiKey: "test-key" });
    await client.getAggregates({ symbol: "BTC-USD", interval: "1d", limit: 1 });

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/v2/aggs/ticker/X%3ABTCUSD/range/1/day/");
  });

  it("fetches previous close as tick", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [bar(1_700_000_000_000, 189.42)],
        }),
      }),
    );

    const client = new MassiveApiClient({ apiKey: "test-key" });
    const tick = await client.getPreviousClose("AAPL");

    expect(tick.price).toBe(189.42);
    expect(tick.stamp).toBe(1_700_000_000_000);
  });

  it("accepts DELAYED status with results (trial / delayed feed)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "DELAYED",
          results: [bar(1_700_000_000_000, 420)],
        }),
      }),
    );

    const client = new MassiveApiClient({ apiKey: "test-key" });
    const candles = await client.getAggregates({
      symbol: "MSFT",
      interval: "1d",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(420);
  });

  it("throws on API error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ERROR",
          error: "Invalid API Key",
        }),
      }),
    );

    const client = new MassiveApiClient({ apiKey: "bad-key" });

    await expect(
      client.getAggregates({ symbol: "AAPL", interval: "1h", limit: 1 }),
    ).rejects.toThrow("Invalid API Key");
  });
});
