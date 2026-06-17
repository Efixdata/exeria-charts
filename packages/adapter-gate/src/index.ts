export { GateAdapter } from "./adapter";
export { GateApiClient } from "./api-client";
export { GateWebSocketClient } from "./websocket-client";
export {
  mapGateCandleRow,
  mapGateCandleRows,
  mapGateCandleUpdateToTick,
} from "./candles";
export {
  estimateRangeSeconds,
  getSubscriptionKey,
  isWsSupportedInterval,
  resolveExeriaInterval,
  toGateInterval,
} from "./interval";
export { toGateCurrencyPair } from "./symbol";
export { mapGateTickerToTick } from "./ticker";
export type {
  GateAdapterConfig,
  GateCandleRow,
  GateCandlestickUpdate,
  GateInterval,
  GateTicker,
  GateWsMessage,
} from "./types";
