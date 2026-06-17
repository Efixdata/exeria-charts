import { describe, expect, it } from "vitest";
import { toCoinbaseProductId } from "../src/symbol";

describe("symbol mapping", () => {
  it("keeps native Coinbase product ids", () => {
    expect(toCoinbaseProductId("BTC-USD")).toBe("BTC-USD");
    expect(toCoinbaseProductId("ETH-USDC")).toBe("ETH-USDC");
  });

  it("maps slash and compact symbols", () => {
    expect(toCoinbaseProductId("BTC/USD")).toBe("BTC-USD");
    expect(toCoinbaseProductId("BTCUSD")).toBe("BTC-USD");
    expect(toCoinbaseProductId("ETHUSDC")).toBe("ETH-USDC");
  });

  it("defaults bare base symbols to USD", () => {
    expect(toCoinbaseProductId("SOL")).toBe("SOL-USD");
    expect(toCoinbaseProductId("btc")).toBe("BTC-USD");
  });
});
