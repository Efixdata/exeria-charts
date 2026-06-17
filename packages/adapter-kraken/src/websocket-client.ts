import { getSubscriptionKey, toKrakenInterval } from "./interval";
import { toKrakenWsPair } from "./symbol";
import {
  KrakenAdapterConfig,
  KrakenHeartbeatMessage,
  KrakenOhlcStreamCandle,
  KrakenOhlcStreamMessage,
  KrakenSubscriptionParams,
} from "./types";

export type WebSocketCallback = (data: KrakenOhlcStreamCandle) => void;
export type WebSocketErrorCallback = (error: Error) => void;

interface ControlMessage {
  method?: string;
  success?: boolean;
  error?: string;
  result?: {
    channel?: string;
    symbol?: string;
    interval?: number;
  };
}

export class KrakenWebSocketClient {
  private wsUrl: string;
  private heartbeatDeadlineMs: number;
  private webSocket: globalThis.WebSocket | null = null;
  private subscriptions: Map<string, WebSocketCallback[]> = new Map();
  private subscriptionParams: Map<string, KrakenSubscriptionParams> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;
  private heartbeatSubscribed = false;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: KrakenAdapterConfig = {}) {
    this.wsUrl = config.wsUrl || "wss://ws.kraken.com/v2";
    this.heartbeatDeadlineMs = config.heartbeatDeadlineMs ?? 5000;
  }

  subscribe(
    symbol: string,
    interval: string,
    callback: WebSocketCallback,
  ): () => void {
    const wsSymbol = toKrakenWsPair(symbol);
    const krakenInterval = toKrakenInterval(interval);
    const key = getSubscriptionKey(wsSymbol, krakenInterval);
    const isNewSubscription = !this.subscriptions.has(key);

    if (isNewSubscription) {
      this.subscriptions.set(key, []);
      this.subscriptionParams.set(key, {
        channel: "ohlc",
        symbol: wsSymbol,
        interval: krakenInterval,
      });
      this.connect();
    }

    const callbacks = this.subscriptions.get(key)!;
    callbacks.push(callback);

    if (
      !isNewSubscription &&
      this.webSocket?.readyState === globalThis.WebSocket.OPEN
    ) {
      this.sendSubscribe([this.subscriptionParams.get(key)!]);
    }

    return () => {
      const topicCallbacks = this.subscriptions.get(key);
      if (!topicCallbacks) {
        return;
      }

      const index = topicCallbacks.indexOf(callback);
      if (index > -1) {
        topicCallbacks.splice(index, 1);
      }

      if (topicCallbacks.length === 0) {
        const params = this.subscriptionParams.get(key);
        this.subscriptions.delete(key);
        this.subscriptionParams.delete(key);

        if (params) {
          this.sendUnsubscribe([params]);
        }

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
        this.subscribeHeartbeat();
        this.sendSubscribe(Array.from(this.subscriptionParams.values()));
        this.resetHeartbeatDeadline();
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as
            | KrakenOhlcStreamMessage
            | KrakenHeartbeatMessage
            | ControlMessage;

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
        this.clearHeartbeatDeadline();

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

  private handleMessage(
    data: KrakenOhlcStreamMessage | KrakenHeartbeatMessage | ControlMessage,
  ): void {
    this.resetHeartbeatDeadline();

    if ("method" in data && data.method) {
      if (data.success === false) {
        this.notifyError(
          new Error(`Kraken WebSocket error: ${data.error || "Unknown error"}`),
        );
      }
      return;
    }

    if ("channel" in data && data.channel === "heartbeat") {
      return;
    }

    if (
      !("channel" in data) ||
      data.channel !== "ohlc" ||
      !Array.isArray(data.data)
    ) {
      return;
    }

    const message = data as KrakenOhlcStreamMessage;

    for (const candle of message.data) {
      const key = getSubscriptionKey(
        candle.symbol,
        candle.interval as KrakenSubscriptionParams["interval"],
      );
      const callbacks = this.subscriptions.get(key) || [];
      callbacks.forEach((callback) => callback(candle));
    }
  }

  private subscribeHeartbeat(): void {
    if (this.heartbeatSubscribed) {
      return;
    }

    this.sendMessage({
      method: "subscribe",
      params: {
        channel: "heartbeat",
      },
    });
    this.heartbeatSubscribed = true;
  }

  private sendSubscribe(paramsList: KrakenSubscriptionParams[]): void {
    for (const params of paramsList) {
      this.sendMessage({
        method: "subscribe",
        params: {
          channel: params.channel,
          symbol: [params.symbol],
          interval: params.interval,
          snapshot: true,
        },
      });
    }
  }

  private sendUnsubscribe(paramsList: KrakenSubscriptionParams[]): void {
    for (const params of paramsList) {
      this.sendMessage({
        method: "unsubscribe",
        params: {
          channel: params.channel,
          symbol: [params.symbol],
          interval: params.interval,
        },
      });
    }
  }

  private sendMessage(payload: Record<string, unknown>): void {
    if (this.webSocket?.readyState !== globalThis.WebSocket.OPEN) {
      return;
    }

    this.webSocket.send(JSON.stringify(payload));
  }

  private resetHeartbeatDeadline(): void {
    this.clearHeartbeatDeadline();

    this.heartbeatTimer = setTimeout(() => {
      if (!this.isIntentionallyClosed && this.subscriptions.size > 0) {
        this.webSocket?.close();
      }
    }, this.heartbeatDeadlineMs);
  }

  private clearHeartbeatDeadline(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isIntentionallyClosed &&
      this.subscriptions.size > 0
    ) {
      this.reconnectAttempts++;
      this.heartbeatSubscribed = false;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearHeartbeatDeadline();
    this.heartbeatSubscribed = false;

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  isConnected(): boolean {
    return this.webSocket?.readyState === globalThis.WebSocket.OPEN;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
