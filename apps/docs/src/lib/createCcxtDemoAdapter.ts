import type { DataAdapter } from "@exeria/charts";
import { BinanceAdapter } from "../../../../packages/adapter-binance/src";
import { BybitAdapter } from "../../../../packages/adapter-bybit/src";
import { OkxAdapter } from "../../../../packages/adapter-okx/src";
import { ProxyCcxtAdapter } from "./proxyCcxtAdapter";

/**
 * Browser demo adapter: dedicated connectors for Binance/Bybit/OKX (WebSocket),
 * CCXT proxy for every other exchange id.
 */
export function createCcxtDemoAdapter(exchangeId: string): DataAdapter {
  switch (exchangeId) {
    case "binance":
      return new BinanceAdapter();
    case "bybit":
      return new BybitAdapter();
    case "okx":
      return new OkxAdapter();
    default:
      return new ProxyCcxtAdapter({ exchangeId });
  }
}

export function usesCcxtProxy(exchangeId: string): boolean {
  return !["binance", "bybit", "okx"].includes(exchangeId);
}
