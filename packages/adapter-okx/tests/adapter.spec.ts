import { describe, it, expect } from "vitest";
import { OkxAdapter } from "../src/adapter";

describe("OkxAdapter", () => {
  it("should initialize without errors", async () => {
    const adapter = new OkxAdapter();
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should support configuration", async () => {
    const adapter = new OkxAdapter({
      baseUrl: "https://www.okx.com",
      requestTimeout: 5000,
      maxRetries: 3,
    });
    await adapter.initialize({});
    expect(adapter).toBeDefined();
  });

  it("should have required methods", async () => {
    const adapter = new OkxAdapter();
    expect(typeof adapter.initialize).toBe("function");
    expect(typeof adapter.getHistoricalData).toBe("function");
    expect(typeof adapter.getCurrentPrice).toBe("function");
    expect(typeof adapter.subscribeToUpdates).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("should disconnect without errors", async () => {
    const adapter = new OkxAdapter();
    await adapter.initialize({});
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });
});
