import { afterEach, describe, expect, it, vi } from "vitest";
import { CoinbaseApiClient } from "../src/api-client";

function bar(startSec: number, close = "100") {
  return {
    start: String(startSec),
    open: "99",
    high: "101",
    low: "98",
    close,
    volume: "10",
  };
}

describe("CoinbaseApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses candle bars oldest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candles: [bar(1_700_003_600, "102"), bar(1_700_000_000, "101")],
        }),
      }),
    );

    const client = new CoinbaseApiClient({ pageDelayMs: 0 });
    const candles = await client.getCandles({
      symbol: "BTC-USD",
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(1_700_000_000_000);
    expect(candles[1]?.c).toBe(102);

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/market/products/BTC-USD/candles");
    expect(requestUrl).toContain("granularity=ONE_HOUR");
  });

  it("maps compact symbols to product ids", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candles: [bar(1_700_000_000)] }),
      }),
    );

    const client = new CoinbaseApiClient();
    await client.getCandles({ symbol: "ETHUSD", interval: "1d", limit: 1 });

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/market/products/ETH-USD/candles");
    expect(requestUrl).toContain("granularity=ONE_DAY");
  });

  it("fetches latest trade as tick", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          trades: [
            {
              product_id: "BTC-USD",
              price: "62869.5",
              time: "2024-01-15T12:00:00.000Z",
            },
          ],
        }),
      }),
    );

    const client = new CoinbaseApiClient();
    const tick = await client.getLatestPrice("BTC-USD");

    expect(tick.price).toBe(62869.5);
    expect(tick.stamp).toBe(Date.parse("2024-01-15T12:00:00.000Z"));
  });

  it("paginates when limit exceeds page size", async () => {
    const firstPage = Array.from({ length: 349 }, (_, index) =>
      bar(1_700_000_000 + index * 3600, String(100 + index)),
    );
    const secondPage = [
      bar(1_699_000_000, "50"),
      bar(1_698_640_000, "49"),
    ];

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ candles: firstPage }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ candles: secondPage }),
        }),
    );

    const client = new CoinbaseApiClient({ pageDelayMs: 0 });
    const candles = await client.getCandles({
      symbol: "BTC-USD",
      interval: "1h",
      limit: 351,
    });

    expect(candles.length).toBeGreaterThanOrEqual(351);
    expect(vi.mocked(fetch).mock.calls.length).toBe(2);
  });

  it("throws on HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      }),
    );

    const client = new CoinbaseApiClient();

    await expect(
      client.getCandles({ symbol: "BTC-USD", interval: "1h", limit: 1 }),
    ).rejects.toThrow("Coinbase API error: 400");
  });
});
