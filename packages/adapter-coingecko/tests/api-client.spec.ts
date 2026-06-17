import { afterEach, describe, expect, it, vi } from "vitest";
import { CoingeckoApiClient } from "../src/api-client";

describe("CoingeckoApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses OHLC rows and sorts oldest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          [2000, 4, 5, 3, 4.5],
          [1000, 1, 2, 0.5, 1.5],
        ],
      }),
    );

    const client = new CoingeckoApiClient();
    const candles = await client.getOhlc({
      coinId: "bitcoin",
      days: "7",
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(1000);
    expect(candles[1]?.close).toBe(4.5);
    expect(candles[0]?.volume).toBe(0);

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/coins/bitcoin/ohlc");
    expect(requestUrl).toContain("vs_currency=usd");
    expect(requestUrl).toContain("days=7");
  });

  it("uses market_chart/range when from and to are provided", async () => {
    const older = new Date("2026-05-10T12:00:00.000Z").getTime();
    const newer = new Date("2026-05-20T12:00:00.000Z").getTime();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          prices: [
            [older, 10],
            [newer, 20],
          ],
          market_caps: [
            [older, 100],
            [newer, 200],
          ],
          total_volumes: [
            [older, 50],
            [newer, 60],
          ],
        }),
      }),
    );

    const client = new CoingeckoApiClient();
    const candles = await client.getHistoricalCandles({
      coinId: "bitcoin",
      interval: "1d",
      from: new Date("2026-05-01T00:00:00.000Z"),
      to: new Date("2026-05-31T00:00:00.000Z"),
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.stamp).toBe(newer);
    expect(candles[0]?.close).toBe(20);
    expect(candles[0]?.volume).toBe(60);

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/market_chart/range");
    expect(requestUrl).toContain("interval=daily");
  });

  it("fetches simple price with last updated timestamp", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bitcoin: {
            usd: 62869,
            last_updated_at: 1781246221,
          },
        }),
      }),
    );

    const client = new CoingeckoApiClient();
    const data = await client.getSimplePrice({ coinIds: ["bitcoin"] });

    expect(data.bitcoin?.usd).toBe(62869);
    expect(data.bitcoin?.last_updated_at).toBe(1781246221);

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("include_last_updated_at=true");
  });

  it("sends pro API key header when configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ bitcoin: { usd: 1 } }),
      }),
    );

    const client = new CoingeckoApiClient({ apiKey: "test-key" });
    await client.getSimplePrice({ coinIds: ["bitcoin"] });

    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      "x-cg-pro-api-key": "test-key",
    });
  });

  it("throws on API error payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            status: {
              error_message: "Invalid coin id",
            },
          },
        }),
      }),
    );

    const client = new CoingeckoApiClient({ maxRetries: 0 });

    await expect(
      client.getOhlc({
        coinId: "not-a-coin",
        days: "7",
      }),
    ).rejects.toThrow("CoinGecko API error: Invalid coin id");
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

    const client = new CoingeckoApiClient({ maxRetries: 0 });

    await expect(
      client.getOhlc({
        coinId: "bitcoin",
        days: "7",
      }),
    ).rejects.toThrow("CoinGecko API error: 500 Internal Server Error");
  });
});
