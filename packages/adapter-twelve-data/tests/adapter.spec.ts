import { describe, expect, it, vi } from "vitest";
import { TwelveDataAdapter } from "../src/adapter";

vi.mock("../src/api-client", () => {
  return {
    TwelveDataApiClient: vi.fn().mockImplementation(() => ({
      getTimeSeries: vi.fn().mockResolvedValue([
        {
          stamp: 1_700_000_000_000,
          o: 1.1,
          h: 1.2,
          l: 1.0,
          c: 1.15,
          v: 0,
        },
      ]),
      getLatestPrice: vi.fn().mockResolvedValue({
        stamp: 1_700_000_360_000,
        price: 1.15,
        c: 1.15,
      }),
    })),
  };
});

vi.mock("../src/websocket-client", () => {
  return {
    TwelveDataWebSocketClient: vi.fn().mockImplementation(() => ({
      onError: vi.fn(),
      subscribe: vi.fn(() => () => {}),
      disconnect: vi.fn(),
    })),
  };
});

describe("TwelveDataAdapter", () => {
  it("requires apiKey", () => {
    expect(() => new TwelveDataAdapter({ apiKey: "" })).toThrow(
      "TwelveDataAdapter requires apiKey",
    );
  });

  it("loads historical data", async () => {
    const adapter = new TwelveDataAdapter({ apiKey: "test-key" });
    await adapter.initialize({});

    const candles = await adapter.getHistoricalData("EURUSD", {
      interval: "1h",
      limit: 1,
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.c).toBe(1.15);
  });

  it("fetches current price", async () => {
    const adapter = new TwelveDataAdapter({ apiKey: "test-key" });
    const tick = await adapter.getCurrentPrice("EURUSD");
    expect(tick.price).toBe(1.15);
  });

  it("has required methods", () => {
    const adapter = new TwelveDataAdapter({ apiKey: "test-key" });
    expect(typeof adapter.initialize).toBe("function");
    expect(typeof adapter.getHistoricalData).toBe("function");
    expect(typeof adapter.getCurrentPrice).toBe("function");
    expect(typeof adapter.subscribeToUpdates).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("disconnects without errors", async () => {
    const adapter = new TwelveDataAdapter({ apiKey: "test-key" });
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
