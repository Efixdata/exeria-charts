import { describe, expect, it } from "vitest";
import {
  normalizeInputSymbol,
  splitCompactSymbol,
  toCcxtSymbol,
} from "../src/symbol";

describe("splitCompactSymbol", () => {
  it("splits USDT pairs", () => {
    expect(splitCompactSymbol("BTCUSDT")).toBe("BTC/USDT");
    expect(splitCompactSymbol("ETHUSDT")).toBe("ETH/USDT");
  });

  it("splits BTC quote pairs", () => {
    expect(splitCompactSymbol("ETHBTC")).toBe("ETH/BTC");
  });
});

describe("normalizeInputSymbol", () => {
  it("normalizes slash and dash formats", () => {
    expect(normalizeInputSymbol("btc/usdt")).toBe("BTC/USDT");
    expect(normalizeInputSymbol("BTC-USDT")).toBe("BTC/USDT");
    expect(normalizeInputSymbol("BTCUSDT")).toBe("BTC/USDT");
  });
});

describe("toCcxtSymbol", () => {
  it("uses market metadata when available", () => {
    const exchange = {
      markets: {
        "BTC/USDT": {
          id: "BTCUSDT",
          symbol: "BTC/USDT",
        },
      },
    };

    expect(toCcxtSymbol("BTCUSDT", exchange as never)).toBe("BTC/USDT");
    expect(toCcxtSymbol("BTC-USDT", exchange as never)).toBe("BTC/USDT");
  });
});
