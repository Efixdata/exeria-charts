import { afterEach, describe, expect, it, vi } from "vitest";
import { FinnhubAdapter } from "../src/adapter";

describe("FinnhubAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads historical candles", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        s: "ok",
        t: [1717372800],
        o: [100],
        h: [101],
        l: [99],
        c: [100.5],
        v: [10],
      }),
    } as Response);

    const adapter = new FinnhubAdapter({ apiKey: "test-key" });
    const candles = await adapter.getHistoricalData("AAPL", {
      interval: "1d",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    await adapter.disconnect();
  });

  it("requires apiKey", () => {
    expect(() => new FinnhubAdapter({ apiKey: "" })).toThrow("requires apiKey");
  });
});
