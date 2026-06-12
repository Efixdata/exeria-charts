import { afterEach, describe, expect, it, vi } from "vitest";
import { TwelveDataApiClient } from "../src/api-client";

describe("TwelveDataApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and maps time series candles", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        values: [
          {
            datetime: "2021-09-16 15:59:00",
            open: "1.1000",
            high: "1.1100",
            low: "1.0900",
            close: "1.1050",
            volume: "1000",
          },
        ],
      }),
    } as Response);

    const client = new TwelveDataApiClient({ apiKey: "test-key" });
    const candles = await client.getTimeSeries({
      symbol: "EURUSD",
      interval: "1h",
      outputsize: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(1.105);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/time_series?"),
      expect.any(Object),
    );
    expect(fetchMock.mock.calls[0]?.[0]).toContain("symbol=EUR%2FUSD");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("interval=1h");
  });

  it("fetches latest price", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        price: "1.2345",
      }),
    } as Response);

    const client = new TwelveDataApiClient({ apiKey: "test-key" });
    const tick = await client.getLatestPrice("EUR/USD");

    expect(tick.price).toBe(1.2345);
  });

  it("requires apiKey", () => {
    expect(() => new TwelveDataApiClient({ apiKey: "" })).toThrow(
      "requires apiKey",
    );
  });
});
