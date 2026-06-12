import { useEffect, useRef, useState } from "react";
import {
  aggTradeStreamName,
  buildMultiplexWsUrl,
  buildOrderBookFromDepth,
  depthStreamName,
  eventLatencyMs,
  parseAggTrade,
  type BinanceAggTrade,
  type BinanceDepthUpdate,
  type TapeTrade,
} from "./binancePublicStreams";
import type { OrderBookLevel } from "./mockMarketData";

export type StreamLatency = {
  depthFreshnessMs: number | null;
  tapeMs: number | null;
};

type OrderBookState = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadBps: number;
};

const EMPTY_BOOK: OrderBookState = {
  bids: [],
  asks: [],
  spread: 0,
  spreadBps: 0,
};

const MAX_TRADES = 48;

export function useBinanceMarketStreams(symbol: string) {
  const [orderBook, setOrderBook] = useState<OrderBookState>(EMPTY_BOOK);
  const [trades, setTrades] = useState<TapeTrade[]>([]);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState<StreamLatency>({
    depthFreshnessMs: null,
    tapeMs: null,
  });
  const lastDepthAtRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;

    setOrderBook(EMPTY_BOOK);
    setTrades([]);
    setConnected(false);
    setLatency({ depthFreshnessMs: null, tapeMs: null });
    lastDepthAtRef.current = null;

    const streams = [depthStreamName(symbol), aggTradeStreamName(symbol)];
    const ws = new WebSocket(buildMultiplexWsUrl(streams));
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      if (!disposed) {
        setConnected(true);
      }
    });

    ws.addEventListener("close", () => {
      if (!disposed) {
        setConnected(false);
      }
    });

    ws.addEventListener("message", (event) => {
      if (disposed) {
        return;
      }

      const receivedAt = Date.now();

      try {
        const raw = typeof event.data === "string" ? event.data : event.data.toString();
        const payload = JSON.parse(raw) as
          | { stream: string; data: BinanceDepthUpdate | BinanceAggTrade }
          | BinanceDepthUpdate
          | BinanceAggTrade;

        const streamData = "stream" in payload && "data" in payload ? payload.data : payload;

        if ("lastUpdateId" in streamData) {
          lastDepthAtRef.current = receivedAt;
          setOrderBook(buildOrderBookFromDepth(streamData));
          setLatency((current) => ({
            ...current,
            depthFreshnessMs: 0,
          }));
          return;
        }

        if (streamData.e === "aggTrade") {
          const trade = parseAggTrade(streamData);
          setTrades((current) => [trade, ...current].slice(0, MAX_TRADES));
          setLatency((current) => ({
            ...current,
            tapeMs: eventLatencyMs(streamData.E, receivedAt),
          }));
        }
      } catch {
        // Ignore malformed frames
      }
    });

    const freshnessTimer = window.setInterval(() => {
      if (disposed || lastDepthAtRef.current === null) {
        return;
      }
      setLatency((current) => ({
        ...current,
        depthFreshnessMs: Date.now() - lastDepthAtRef.current!,
      }));
    }, 250);

    return () => {
      disposed = true;
      window.clearInterval(freshnessTimer);
      ws.close();
      wsRef.current = null;
    };
  }, [symbol]);

  return { orderBook, trades, connected, latency };
}
