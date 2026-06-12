import { describe, it, expect, vi } from "vitest";
import { BinanceAdapter } from "../src/adapter";

describe("BinanceAdapter", () => {
  it("should initialize without errors", async () => {
    const adapter = new BinanceAdapter();
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should support configuration", async () => {
    const adapter = new BinanceAdapter({
      baseUrl: "https://api.binance.com",
      requestTimeout: 5000,
      maxRetries: 3,
    });
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should have required methods", async () => {
    const adapter = new BinanceAdapter();
    expect(typeof adapter.initialize).toBe("function");
    expect(typeof adapter.getHistoricalData).toBe("function");
    expect(typeof adapter.getCurrentPrice).toBe("function");
    expect(typeof adapter.subscribeToUpdates).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("should disconnect without errors", async () => {
    const adapter = new BinanceAdapter();
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
