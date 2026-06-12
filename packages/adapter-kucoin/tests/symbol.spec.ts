import { describe, expect, it } from "vitest";
import { toKucoinSymbol } from "../src/symbol";

describe("symbol mapping", () => {
  it("maps compact symbols to KuCoin hyphen format", () => {
    expect(toKucoinSymbol("BTCUSDT")).toBe("BTC-USDT");
    expect(toKucoinSymbol("ETHUSDT")).toBe("ETH-USDT");
    expect(toKucoinSymbol("BTC-USDT")).toBe("BTC-USDT");
  });

  it("normalizes case and other quote assets", () => {
    expect(toKucoinSymbol("btc-usdt")).toBe("BTC-USDT");
    expect(toKucoinSymbol("SOLETH")).toBe("SOL-ETH");
    expect(toKucoinSymbol("BTCUSDC")).toBe("BTC-USDC");
  });
});
