import { afterEach, describe, expect, it, vi } from "vitest";
import { FinnhubApiClient } from "../src/api-client";

describe("FinnhubApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and maps stock candles", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        s: "ok",
        t: [1717372800],
        o: [290],
        h: [295],
        l: [289],
        c: [294],
        v: [1000],
      }),
    } as Response);

    const client = new FinnhubApiClient({ apiKey: "test-key" });
    const candles = await client.getCandles({
      symbol: "AAPL",
      interval: "1d",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(294);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/stock/candle");
  });

  it("fetches forex candles", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        s: "ok",
        t: [1717372800],
        o: [1.1],
        h: [1.11],
        l: [1.09],
        c: [1.105],
        v: [100],
      }),
    } as Response);

    const client = new FinnhubApiClient({ apiKey: "test-key" });
    const candles = await client.getCandles({
      symbol: "EUR/USD",
      interval: "1h",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/forex/candle");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("OANDA%3AEUR_USD");
  });

  it("fetches stock quote", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        c: 195.5,
        t: 1717372800,
      }),
    } as Response);

    const client = new FinnhubApiClient({ apiKey: "test-key" });
    const tick = await client.getLatestPrice("AAPL");

    expect(tick.price).toBe(195.5);
  });

  it("requires apiKey", () => {
    expect(() => new FinnhubApiClient({ apiKey: "" })).toThrow(
      "requires apiKey",
    );
  });
});
