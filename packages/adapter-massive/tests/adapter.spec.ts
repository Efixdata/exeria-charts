import { afterEach, describe, expect, it, vi } from "vitest";
import { MassiveAdapter } from "../src/adapter";

function bar(time: number, close = 100) {
  return { t: time, o: 99, h: 101, l: 98, c: close, v: 10 };
}

describe("MassiveAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("implements DataAdapter historical + current price", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "OK",
            results: [bar(1_700_000_000_000, 150)],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "OK",
            results: [bar(1_700_003_600_000, 151)],
          }),
        }),
    );

    const adapter = new MassiveAdapter({ apiKey: "test-key" });
    await adapter.initialize({});

    const candles = await adapter.getHistoricalData("MSFT", {
      interval: "1h",
      limit: 1,
    });

    expect(candles[0]?.c).toBe(150);

    const tick = await adapter.getCurrentPrice("MSFT");
    expect(tick.price).toBe(151);

    await adapter.disconnect();
  });

  it("requires api key in constructor", () => {
    expect(() => new MassiveAdapter({ apiKey: "" })).toThrow(
      "MassiveAdapter requires apiKey",
    );
  });
});
