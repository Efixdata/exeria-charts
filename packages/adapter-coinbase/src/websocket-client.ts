import { toCoinbaseProductId } from "./symbol";
import type {
  CoinbaseAdapterConfig,
  CoinbaseWsMessage,
} from "./types";
import type { Tick } from "@efixdata/exeria-chart";

const DEFAULT_WS_URL = "wss://advanced-trade-ws.coinbase.com";

export type TickerBatchCallback = (tick: Tick, productId: string) => void;
export type WebSocketErrorCallback = (error: Error) => void;

export class CoinbaseWebSocketClient {
  private wsUrl: string;
  private webSocket: WebSocket | null = null;
  private subscriptions: Map<string, TickerBatchCallback[]> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;
  private heartbeatsSubscribed = false;

  constructor(config: CoinbaseAdapterConfig = {}) {
    this.wsUrl = config.wsUrl ?? DEFAULT_WS_URL;
  }

  subscribe(productId: string, callback: TickerBatchCallback): () => void {
    const normalized = toCoinbaseProductId(productId);
    const isNew = !this.subscriptions.has(normalized);

    if (isNew) {
      this.subscriptions.set(normalized, []);
      void this.connect();
    }

    const callbacks = this.subscriptions.get(normalized)!;
    callbacks.push(callback);

    if (!isNew && this.webSocket?.readyState === WebSocket.OPEN) {
      this.sendSubscribe([normalized]);
    }

    return () => {
      const topicCallbacks = this.subscriptions.get(normalized);
      if (!topicCallbacks) {
        return;
      }

      const index = topicCallbacks.indexOf(callback);
      if (index > -1) {
        topicCallbacks.splice(index, 1);
      }

      if (topicCallbacks.length === 0) {
        this.subscriptions.delete(normalized);
        this.sendUnsubscribe([normalized]);

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

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.heartbeatsSubscribed = false;

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  private async connect(): Promise<void> {
    if (
      this.webSocket &&
      (this.webSocket.readyState === WebSocket.OPEN ||
        this.webSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      this.isIntentionallyClosed = false;
      this.webSocket = new WebSocket(this.wsUrl);

      this.webSocket.addEventListener("open", () => {
        this.reconnectAttempts = 0;
        this.subscribeHeartbeats();
        this.sendSubscribe([...this.subscriptions.keys()]);
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as CoinbaseWsMessage;
          this.handleMessage(data);
        } catch (error) {
          this.notifyError(
            new Error(`Failed to parse WebSocket message: ${error}`),
          );
        }
      });

      this.webSocket.addEventListener("error", () => {
        this.notifyError(new Error("Coinbase WebSocket error"));
      });

      this.webSocket.addEventListener("close", () => {
        if (!this.isIntentionallyClosed && this.subscriptions.size > 0) {
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

  private handleMessage(data: CoinbaseWsMessage): void {
    if (data.channel !== "ticker_batch") {
      return;
    }

    for (const event of data.events ?? []) {
      for (const ticker of event.tickers ?? []) {
        const productId = ticker.product_id;
        const price = parseFloat(ticker.price ?? "0");

        if (!productId || !Number.isFinite(price) || price <= 0) {
          continue;
        }

        const tick: Tick = {
          stamp: Date.now(),
          c: price,
          price,
        };

        const callbacks = this.subscriptions.get(productId) ?? [];
        callbacks.forEach((callback) => callback(tick, productId));
      }
    }
  }

  private subscribeHeartbeats(): void {
    if (this.heartbeatsSubscribed) {
      return;
    }

    this.send({
      type: "subscribe",
      channel: "heartbeats",
    });
    this.heartbeatsSubscribed = true;
  }

  private sendSubscribe(productIds: string[]): void {
    if (productIds.length === 0) {
      return;
    }

    this.send({
      type: "subscribe",
      product_ids: productIds,
      channel: "ticker_batch",
    });
  }

  private sendUnsubscribe(productIds: string[]): void {
    if (productIds.length === 0) {
      return;
    }

    this.send({
      type: "unsubscribe",
      product_ids: productIds,
      channel: "ticker_batch",
    });
  }

  private send(payload: Record<string, unknown>): void {
    if (this.webSocket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.webSocket.send(JSON.stringify(payload));
  }

  private attemptReconnect(): void {
    if (
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      this.isIntentionallyClosed
    ) {
      return;
    }

    this.reconnectAttempts += 1;
    this.webSocket = null;
    this.heartbeatsSubscribed = false;

    setTimeout(() => {
      void this.connect();
    }, this.reconnectDelay);
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }
}
