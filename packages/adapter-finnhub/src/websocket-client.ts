import { toFinnhubSymbol } from "./symbol";
import { mapTradeEventToTick } from "./ticker";
import type { FinnhubAdapterConfig, FinnhubWsMessage } from "./types";
import type { Tick } from "@efixdata/exeria-chart";

export type WebSocketCallback = (update: Tick) => void;
export type WebSocketErrorCallback = (error: Error) => void;

export function resolveFinnhubWsUrl(config: FinnhubAdapterConfig): string {
  if (config.wsUrl?.trim()) {
    return config.wsUrl.trim();
  }

  return `wss://ws.finnhub.io?token=${encodeURIComponent(config.apiKey)}`;
}

export class FinnhubWebSocketClient {
  private wsUrl: string;
  private symbolOptions: {
    defaultForexExchange?: string;
    defaultCryptoExchange?: string;
  };
  private subscriptions: Map<string, WebSocketCallback[]> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private webSocket: globalThis.WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;

  constructor(config: FinnhubAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("FinnhubWebSocketClient requires apiKey");
    }

    this.wsUrl = resolveFinnhubWsUrl(config);
    this.symbolOptions = {
      ...(config.defaultForexExchange
        ? { defaultForexExchange: config.defaultForexExchange }
        : {}),
      ...(config.defaultCryptoExchange
        ? { defaultCryptoExchange: config.defaultCryptoExchange }
        : {}),
    };
  }

  subscribe(symbol: string, callback: WebSocketCallback): () => void {
    const normalizedSymbol = toFinnhubSymbol(symbol, this.symbolOptions);
    const isNewSymbol = !this.subscriptions.has(normalizedSymbol);

    if (isNewSymbol) {
      this.subscriptions.set(normalizedSymbol, []);
      this.connect();
    }

    const callbacks = this.subscriptions.get(normalizedSymbol)!;
    callbacks.push(callback);

    if (
      !isNewSymbol &&
      this.webSocket?.readyState === globalThis.WebSocket.OPEN
    ) {
      this.sendSubscribe([normalizedSymbol]);
    }

    return () => {
      const symbolCallbacks = this.subscriptions.get(normalizedSymbol);
      if (!symbolCallbacks) {
        return;
      }

      const index = symbolCallbacks.indexOf(callback);
      if (index > -1) {
        symbolCallbacks.splice(index, 1);
      }

      if (symbolCallbacks.length === 0) {
        this.subscriptions.delete(normalizedSymbol);
        this.sendUnsubscribe([normalizedSymbol]);

        if (this.subscriptions.size === 0) {
          this.disconnect();
        }
      }
    };
  }

  onError(callback: WebSocketErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private connect(): void {
    if (
      this.webSocket &&
      (this.webSocket.readyState === globalThis.WebSocket.OPEN ||
        this.webSocket.readyState === globalThis.WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      this.isIntentionallyClosed = false;
      this.webSocket = new globalThis.WebSocket(this.wsUrl);

      this.webSocket.addEventListener("open", () => {
        this.reconnectAttempts = 0;
        this.sendSubscribe(Array.from(this.subscriptions.keys()));
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as FinnhubWsMessage;
          this.handleMessage(data);
        } catch (error) {
          this.notifyError(
            new Error(`Failed to parse WebSocket message: ${error}`),
          );
        }
      });

      this.webSocket.addEventListener("error", (event) => {
        this.notifyError(new Error(`WebSocket error: ${event.type}`));
      });

      this.webSocket.addEventListener("close", () => {
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      });
    } catch (error) {
      this.notifyError(
        error instanceof Error
          ? error
          : new Error("Failed to create WebSocket connection"),
      );
    }
  }

  private handleMessage(data: FinnhubWsMessage): void {
    if (data.type === "ping") {
      return;
    }

    if (data.type !== "trade" || !Array.isArray(data.data)) {
      return;
    }

    for (const trade of data.data) {
      if (!trade.s) {
        continue;
      }

      const tick = mapTradeEventToTick(trade);
      const callbacks = this.subscriptions.get(trade.s) ?? [];

      callbacks.forEach((callback) => callback(tick));
    }
  }

  private sendSubscribe(symbols: string[]): void {
    for (const symbol of symbols) {
      this.sendMessage({
        type: "subscribe",
        symbol,
      });
    }
  }

  private sendUnsubscribe(symbols: string[]): void {
    for (const symbol of symbols) {
      this.sendMessage({
        type: "unsubscribe",
        symbol,
      });
    }
  }

  private sendMessage(payload: Record<string, unknown>): void {
    if (this.webSocket?.readyState !== globalThis.WebSocket.OPEN) {
      return;
    }

    this.webSocket.send(JSON.stringify(payload));
  }

  private attemptReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isIntentionallyClosed &&
      this.subscriptions.size > 0
    ) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }
}
