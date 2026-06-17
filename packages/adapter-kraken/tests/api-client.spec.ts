import { afterEach, describe, expect, it, vi } from "vitest";
import { KrakenApiClient } from "../src/api-client";

function ohlcRow(time: number, close = "100"): [number, string, string, string, string, string, string, number] {
  return [time, "100", "110", "90", close, "105", "10", 5];
}

describe("KrakenApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses OHLC rows and sorts oldest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: [],
          result: {
            XXBTZUSD: [ohlcRow(2000, "102"), ohlcRow(1000, "101")],
            last: 2000,
          },
        }),
      }),
    );

    const client = new KrakenApiClient({ pageDelayMs: 0 });
    const candles = await client.getOhlc({
      symbol: "BTC/USD",
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.startTime).toBe(1_000_000);
    expect(candles[1]?.startTime).toBe(2_000_000);
    expect(candles[1]?.close).toBe("102");

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/0/public/OHLC");
    expect(requestUrl).toContain("pair=XBTUSD");
    expect(requestUrl).toContain("interval=60");
  });

  it("fetches ticker price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: [],
          result: {
            XXBTZUSD: {
              c: ["64253.0", "0.345"],
            },
          },
        }),
      }),
    );

    const client = new KrakenApiClient();
    const ticker = await client.getTickerPrice("BTC/USD");

    expect(ticker.price).toBe("64253.0");
  });

  it("throws on API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: ["EQuery:Unknown asset pair"],
          result: {},
        }),
      }),
    );

    const client = new KrakenApiClient({ maxRetries: 0 });

    await expect(
      client.getOhlc({
        symbol: "BAD",
        interval: "1h",
      }),
    ).rejects.toThrow("Kraken API error: EQuery:Unknown asset pair");
  });

  it("throws on HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    const client = new KrakenApiClient({ maxRetries: 0 });

    await expect(
      client.getOhlc({
        symbol: "BTC/USD",
        interval: "1h",
      }),
    ).rejects.toThrow("Kraken API error: 500 Internal Server Error");
  });
});
