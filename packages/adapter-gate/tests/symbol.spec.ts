import { describe, expect, it } from "vitest";
import { toGateCurrencyPair } from "../src/symbol";

describe("toGateCurrencyPair", () => {
  it("keeps native Gate pairs", () => {
    expect(toGateCurrencyPair("BTC_USDT")).toBe("BTC_USDT");
    expect(toGateCurrencyPair("ETH_USDC")).toBe("ETH_USDC");
  });

  it("maps dash and slash symbols", () => {
    expect(toGateCurrencyPair("BTC-USDT")).toBe("BTC_USDT");
    expect(toGateCurrencyPair("BTC/USDT")).toBe("BTC_USDT");
    expect(toGateCurrencyPair("ETHUSDT")).toBe("ETH_USDT");
  });

  it("defaults bare base symbols to USDT", () => {
    expect(toGateCurrencyPair("SOL")).toBe("SOL_USDT");
    expect(toGateCurrencyPair("btc")).toBe("BTC_USDT");
  });
});
