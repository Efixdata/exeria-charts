import { afterEach, describe, expect, it, vi } from "vitest";
import { BybitApiClient } from "../src/api-client";

describe("BybitApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses klines and sorts oldest-first", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        retCode: 0,
        retMsg: "OK",
        result: {
          symbol: "BTCUSDT",
          category: "spot",
          list: [
            ["2000", "102", "103", "101", "102.5", "20", "2000"],
            ["1000", "100", "101", "99", "100.5", "10", "1000"],
          ],
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new BybitApiClient();
    const klines = await client.getKlines({
      symbol: "BTCUSDT",
      interval: "1h",
      limit: 2,
    });

    expect(klines).toHaveLength(2);
    expect(klines[0].startTime).toBe(1000);
    expect(klines[1].startTime).toBe(2000);
    expect(klines[0].close).toBe("100.5");

    const requestUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestUrl).toContain("category=spot");
    expect(requestUrl).toContain("symbol=BTCUSDT");
    expect(requestUrl).toContain("interval=60");
    expect(requestUrl).toContain("limit=2");
  });

  it("throws on non-zero retCode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 10001,
          retMsg: "Invalid symbol",
          result: { symbol: "BAD", category: "spot", list: [] },
        }),
      }),
    );

    const client = new BybitApiClient();

    await expect(
      client.getKlines({
        symbol: "BAD",
        interval: "1h",
      }),
    ).rejects.toThrow("Bybit API error: Invalid symbol (10001)");
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

    const client = new BybitApiClient({ maxRetries: 0 });

    await expect(
      client.getKlines({
        symbol: "BTCUSDT",
        interval: "1h",
      }),
    ).rejects.toThrow("Bybit API error: 500 Internal Server Error");
  });
});
