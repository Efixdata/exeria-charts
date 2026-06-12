import { describe, expect, it, vi } from "vitest";
import { CcxtAdapter } from "../src/adapter";

vi.mock("../src/exchange-factory", () => {
  const mockExchange = {
    loadMarkets: vi.fn().mockResolvedValue(undefined),
    fetchOHLCV: vi.fn().mockResolvedValue([
      [1_700_000_000_000, 10, 12, 9, 11, 100],
      [1_700_000_360_000, 11, 13, 10, 12, 120],
    ]),
    fetchTicker: vi.fn().mockResolvedValue({
      symbol: "BTC/USDT",
      timestamp: 1_700_000_720_000,
      last: 12,
    }),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    createCcxtExchange: vi.fn(() => mockExchange),
    isCcxtExchangeId: vi.fn(() => true),
  };
});

describe("CcxtAdapter", () => {
  it("requires exchangeId", () => {
    expect(() => new CcxtAdapter({ exchangeId: "" })).toThrow(
      "CcxtAdapter requires exchangeId",
    );
  });

  it("should initialize and load historical data", async () => {
    const adapter = new CcxtAdapter({ exchangeId: "kraken" });
    await adapter.initialize({});

    const candles = await adapter.getHistoricalData("BTCUSDT", {
      interval: "1h",
      limit: 2,
    });

    expect(candles).toHaveLength(2);
    expect(candles[0]).toMatchObject({
      stamp: 1_700_000_000_000,
      o: 10,
      c: 11,
    });
  });

  it("should fetch current price", async () => {
    const adapter = new CcxtAdapter({ exchangeId: "kraken" });
    await adapter.initialize({});

    const tick = await adapter.getCurrentPrice("BTCUSDT");
    expect(tick.price).toBe(12);
  });

  it("should have required methods", () => {
    const adapter = new CcxtAdapter({ exchangeId: "kraken" });
    expect(typeof adapter.initialize).toBe("function");
    expect(typeof adapter.getHistoricalData).toBe("function");
    expect(typeof adapter.getCurrentPrice).toBe("function");
    expect(typeof adapter.subscribeToUpdates).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("should disconnect without errors", async () => {
    const adapter = new CcxtAdapter({ exchangeId: "kraken" });
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
