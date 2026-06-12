import { afterEach, describe, expect, it, vi } from "vitest";
import { CoinbaseAdapter } from "../src/adapter";

function bar(startSec: number, close = "100") {
  return {
    start: String(startSec),
    open: "99",
    high: "101",
    low: "98",
    close,
    volume: "10",
  };
}

describe("CoinbaseAdapter", () => {
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
            candles: [bar(1_700_000_000, "150")],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            trades: [
              {
                product_id: "ETH-USD",
                price: "3200.5",
                time: "2024-01-15T12:00:00.000Z",
              },
            ],
          }),
        }),
    );

    const adapter = new CoinbaseAdapter({ useWebSocket: false });
    await adapter.initialize({});

    const candles = await adapter.getHistoricalData("ETH-USD", {
      interval: "1h",
      limit: 1,
    });

    expect(candles[0]?.c).toBe(150);

    const tick = await adapter.getCurrentPrice("ETH-USD");
    expect(tick.price).toBe(3200.5);

    await adapter.disconnect();
  });

  it("polls live updates when websocket is disabled", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          trades: [
            {
              product_id: "BTC-USD",
              price: "50000",
              time: "2024-01-15T12:00:00.000Z",
            },
          ],
        }),
      }),
    );

    const adapter = new CoinbaseAdapter({
      useWebSocket: false,
      pollingIntervalMs: 1000,
    });
    await adapter.initialize({});

    const updates: number[] = [];
    const unsubscribe = adapter.subscribeToUpdates("BTC-USD", (tick) => {
      updates.push(tick.price ?? 0);
    });

    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.runOnlyPendingTimersAsync();

    expect(updates.length).toBeGreaterThanOrEqual(1);
    expect(updates[0]).toBe(50000);

    unsubscribe();
    await adapter.disconnect();
    vi.useRealTimers();
  });
});
