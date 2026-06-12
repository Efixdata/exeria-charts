import { describe, it, expect } from "vitest";
import { toOkxInstId } from "../src/symbol";

describe("symbol normalization", () => {
  it("keeps OKX instId format unchanged", () => {
    expect(toOkxInstId("BTC-USDT")).toBe("BTC-USDT");
    expect(toOkxInstId("eth-usdt")).toBe("ETH-USDT");
  });

  it("converts compact spot symbols to OKX instId", () => {
    expect(toOkxInstId("BTCUSDT")).toBe("BTC-USDT");
    expect(toOkxInstId("ETHUSDT")).toBe("ETH-USDT");
    expect(toOkxInstId("SOLETH")).toBe("SOL-ETH");
  });
});
