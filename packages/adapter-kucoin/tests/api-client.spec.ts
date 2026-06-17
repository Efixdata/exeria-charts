import { afterEach, describe, expect, it, vi } from "vitest";
import { KucoinApiClient } from "../src/api-client";

function klineRow(
  timeSec: number,
  close = "100",
): [string, string, string, string, string, string, string] {
  return [
    timeSec.toString(),
    "100",
    close,
    "110",
    "90",
    "10",
    "1000",
  ];
}

describe("KucoinApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses kline rows and sorts oldest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "200000",
          data: [klineRow(2000, "102"), klineRow(1000, "101")],
        }),
      }),
    );

    const client = new KucoinApiClient({ pageDelayMs: 0 });
    const candles = await client.getKlines({
      symbol: "BTC-USDT",
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.startTime).toBe(1_000_000);
    expect(candles[1]?.startTime).toBe(2_000_000);
    expect(candles[1]?.close).toBe("102");
    expect(candles[1]?.high).toBe("110");
    expect(candles[1]?.low).toBe("90");

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/api/v1/market/candles");
    expect(requestUrl).toContain("symbol=BTC-USDT");
    expect(requestUrl).toContain("type=1hour");
  });

  it("fetches ticker price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "200000",
          data: {
            time: 1_729_000_000_000,
            price: "62869.5",
          },
        }),
      }),
    );

    const client = new KucoinApiClient();
    const ticker = await client.getTickerPrice("BTCUSDT");

    expect(ticker.price).toBe("62869.5");
    expect(ticker.stamp).toBe(1_729_000_000_000);
  });

  it("fetches public websocket token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "200000",
          data: {
            token: "abc123",
            instanceServers: [
              {
                endpoint: "wss://ws-api-spot.kucoin.com/",
                encrypt: true,
                protocol: "websocket",
                pingInterval: 18000,
                pingTimeout: 10000,
              },
            ],
          },
        }),
      }),
    );

    const client = new KucoinApiClient();
    const info = await client.getPublicWsToken();

    expect(info.token).toBe("abc123");
    expect(info.endpoint).toBe("wss://ws-api-spot.kucoin.com/");
    expect(info.pingInterval).toBe(18000);

    const request = vi.mocked(fetch).mock.calls[0];
    expect(request?.[0]).toContain("/api/v1/bullet-public");
    expect(request?.[1]?.method).toBe("POST");
  });

  it("throws on API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "400100",
          data: null,
          msg: "Invalid symbol",
        }),
      }),
    );

    const client = new KucoinApiClient({ maxRetries: 0 });

    await expect(
      client.getKlines({
        symbol: "INVALID",
        interval: "1h",
        limit: 1,
      }),
    ).rejects.toThrow("KuCoin API error");
  });
});
