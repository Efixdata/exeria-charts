import { afterEach, describe, expect, it, vi } from "vitest";
import { GateApiClient } from "../src/api-client";

function candleRow(
  stampSec: number,
  close = "100",
): [string, string, string, string, string, string, string, string] {
  return [
    String(stampSec),
    "1000",
    close,
    "110",
    "95",
    "99",
    "12.5",
    "true",
  ];
}

describe("GateApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses candlesticks oldest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [candleRow(1_700_000_000, "101"), candleRow(1_700_003_600, "102")],
      }),
    );

    const client = new GateApiClient({ pageDelayMs: 0 });
    const candles = await client.getCandles({
      symbol: "BTC_USDT",
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]?.stamp).toBe(1_700_000_000_000);
    expect(candles[1]?.c).toBe(102);

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("/spot/candlesticks");
    expect(requestUrl).toContain("currency_pair=BTC_USDT");
    expect(requestUrl).toContain("interval=1h");
  });

  it("maps compact symbols to Gate pairs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [candleRow(1_700_000_000)],
      }),
    );

    const client = new GateApiClient();
    await client.getCandles({ symbol: "ETHUSDT", interval: "1d", limit: 1 });

    const requestUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(requestUrl).toContain("currency_pair=ETH_USDT");
    expect(requestUrl).toContain("interval=1d");
  });

  it("fetches latest ticker price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            currency_pair: "BTC_USDT",
            last: "62869.5",
          },
        ],
      }),
    );

    const client = new GateApiClient();
    const tick = await client.getLatestPrice("BTC-USDT");

    expect(tick.price).toBe(62869.5);
    expect(tick.c).toBe(62869.5);
  });

  it("surfaces Gate API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          label: "INVALID_PARAM_VALUE",
          message: "Candlestick too long ago",
        }),
      }),
    );

    const client = new GateApiClient({ maxRetries: 0 });

    await expect(
      client.getCandles({ symbol: "BTC_USDT", interval: "1h", limit: 1 }),
    ).rejects.toThrow(/Candlestick too long ago/);
  });
});
