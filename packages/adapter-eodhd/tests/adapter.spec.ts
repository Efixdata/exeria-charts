import { afterEach, describe, expect, it, vi } from "vitest";
import { EodhdAdapter } from "../src/adapter";

describe("EodhdAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("implements DataAdapter with historical data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
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

    const adapter = new EodhdAdapter({ apiKey: "test-key" });
    const candles = await adapter.getHistoricalData("AAPL", {
      interval: "1d",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    await adapter.disconnect();
  });

  it("requires apiKey", () => {
    expect(() => new EodhdAdapter({ apiKey: "" })).toThrow("requires apiKey");
  });
});
