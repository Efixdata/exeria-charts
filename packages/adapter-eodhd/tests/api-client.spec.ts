import { afterEach, describe, expect, it, vi } from "vitest";
import { EodhdApiClient } from "../src/api-client";

describe("EodhdApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and maps EOD candles", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify([
          {
            date: "2024-01-02",
            open: 100,
            high: 110,
            low: 95,
            close: 105,
            volume: 1000,
          },
        ]),
    } as Response);

    const client = new EodhdApiClient({ apiKey: "test-key" });
    const candles = await client.getCandles({
      symbol: "AAPL",
      interval: "1d",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(105);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/eod/AAPL.US");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("period=d");
  });

  it("fetches intraday candles", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify([
          {
            timestamp: 1717372800,
            open: 1.1,
            high: 1.11,
            low: 1.09,
            close: 1.105,
            volume: 100,
          },
        ]),
    } as Response);

    const client = new EodhdApiClient({ apiKey: "test-key" });
    const candles = await client.getCandles({
      symbol: "EUR/USD",
      interval: "1h",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/intraday/EURUSD.FOREX");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("interval=1h");
  });

  it("fetches real-time price", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: "AAPL.US",
          timestamp: 1717372800,
          close: 195.5,
        }),
    } as Response);

    const client = new EodhdApiClient({ apiKey: "test-key" });
    const tick = await client.getLatestPrice("AAPL");

    expect(tick.price).toBe(195.5);
  });

  it("requires apiKey", () => {
    expect(() => new EodhdApiClient({ apiKey: "" })).toThrow("requires apiKey");
  });
});
