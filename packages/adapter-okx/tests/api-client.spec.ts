import { afterEach, describe, expect, it, vi } from "vitest";
import { OkxApiClient } from "../src/api-client";

function candleRow(ts: string, close = "100"): string[] {
  return [ts, "100", "110", "90", close, "10", "10", "10", "1"];
}

describe("OkxApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses candles and sorts oldest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "0",
          msg: "",
          data: [candleRow("2000", "102"), candleRow("1000", "101")],
        }),
      }),
    );

    const client = new OkxApiClient({ pageDelayMs: 0 });
    const candles = await client.getCandles({
      symbol: "BTC-USDT",
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.startTime).toBe(1000);
    expect(candles[1]?.startTime).toBe(2000);
    expect(candles[1]?.close).toBe("102");

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("instId=BTC-USDT");
    expect(requestUrl).toContain("bar=1H");
    expect(requestUrl).toContain("limit=2");
  });

  it("paginates when limit exceeds a single page", async () => {
    const page1 = Array.from({ length: 300 }, (_, index) =>
      candleRow(String((300 - index) * 1000)),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: "0",
          msg: "",
          data: page1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: "0",
          msg: "",
          data: [candleRow("500")],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const client = new OkxApiClient({ pageDelayMs: 0 });
    const candles = await client.getCandles({
      symbol: "BTCUSDT",
      interval: "1h",
      limit: 301,
    });

    expect(candles).toHaveLength(301);
    expect(candles[0]?.startTime).toBe(500);
    expect(candles[300]?.startTime).toBe(300000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondUrl = fetchMock.mock.calls[1]?.[0] as string;
    expect(secondUrl).toContain("after=1000");
  });

  it("throws on non-zero code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "51001",
          msg: "Invalid instrument ID",
          data: [],
        }),
      }),
    );

    const client = new OkxApiClient({ maxRetries: 0 });

    await expect(
      client.getCandles({
        symbol: "BAD",
        interval: "1h",
      }),
    ).rejects.toThrow("OKX API error: Invalid instrument ID (51001)");
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

    const client = new OkxApiClient({ maxRetries: 0 });

    await expect(
      client.getCandles({
        symbol: "BTC-USDT",
        interval: "1h",
      }),
    ).rejects.toThrow("OKX API error: 500 Internal Server Error");
  });
});
