import { afterEach, describe, expect, it, vi } from "vitest";
import { FinageAdapter } from "../src/adapter";

describe("FinageAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads historical data and polls when WebSocket is not configured", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          symbol: "EURUSD",
          results: [
            {
              o: 1.1,
              h: 1.11,
              l: 1.09,
              c: 1.105,
              v: 1,
              t: 1717372800000,
            },
          ],
        }),
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          symbol: "EURUSD",
          ask: 1.106,
          bid: 1.104,
          timestamp: 1717376400000,
        }),
      } as Response);

    const adapter = new FinageAdapter({
      apiKey: "test-key",
      pollIntervalMs: 50_000,
    });

    const candles = await adapter.getHistoricalData("EURUSD", {
      interval: "1h",
      limit: 1,
    });

    expect(candles).toHaveLength(1);

    const updates: number[] = [];
    const unsubscribe = adapter.subscribeToUpdates("EURUSD", (tick) => {
      updates.push(tick.price ?? tick.c ?? 0);
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    unsubscribe();
    await adapter.disconnect();

    expect(updates.length).toBeGreaterThan(0);
  });

  it("requires apiKey", () => {
    expect(() => new FinageAdapter({ apiKey: "" })).toThrow("requires apiKey");
  });
});
