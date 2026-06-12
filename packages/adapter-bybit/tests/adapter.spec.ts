import { describe, it, expect } from "vitest";
import { BybitAdapter } from "../src/adapter";

describe("BybitAdapter", () => {
  it("should initialize without errors", async () => {
    const adapter = new BybitAdapter();
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should support configuration", async () => {
    const adapter = new BybitAdapter({
      baseUrl: "https://api.bybit.com",
      requestTimeout: 5000,
      maxRetries: 3,
    });
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should have required methods", async () => {
    const adapter = new BybitAdapter();
    expect(typeof adapter.initialize).toBe("function");
    expect(typeof adapter.getHistoricalData).toBe("function");
    expect(typeof adapter.getCurrentPrice).toBe("function");
    expect(typeof adapter.subscribeToUpdates).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("should disconnect without errors", async () => {
    const adapter = new BybitAdapter();
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
