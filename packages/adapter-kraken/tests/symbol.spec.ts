import { describe, expect, it } from "vitest";
import { toKrakenRestPair, toKrakenWsPair } from "../src/symbol";

describe("symbol mapping", () => {
  it("maps compact BTC symbols to Kraken REST and WS formats", () => {
    expect(toKrakenRestPair("BTCUSD")).toBe("XBTUSD");
    expect(toKrakenRestPair("BTCUSDT")).toBe("XBTUSDT");
    expect(toKrakenWsPair("BTCUSD")).toBe("BTC/USD");
    expect(toKrakenWsPair("BTC/USD")).toBe("BTC/USD");
    expect(toKrakenWsPair("XBTUSD")).toBe("BTC/USD");
  });

  it("maps ETH and SOL pairs", () => {
    expect(toKrakenRestPair("ETH-USD")).toBe("ETHUSD");
    expect(toKrakenWsPair("ETH/USD")).toBe("ETH/USD");
    expect(toKrakenRestPair("SOLUSD")).toBe("SOLUSD");
    expect(toKrakenWsPair("SOLUSD")).toBe("SOL/USD");
  });
});
