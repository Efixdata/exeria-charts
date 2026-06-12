import { getKlineTopic } from "./interval";
import {
  BybitAdapterConfig,
  BybitKlineStreamCandle,
  BybitKlineStreamMessage,
} from "./types";

export type WebSocketCallback = (data: BybitKlineStreamCandle) => void;
export type WebSocketErrorCallback = (error: Error) => void;

interface ControlMessage {
  op?: string;
  success?: boolean;
  ret_msg?: string;
  topic?: string;
}

export class BybitWebSocketClient {
  private wsUrl: string;
  private pingIntervalMs: number;
  private webSocket: globalThis.WebSocket | null = null;
  private subscriptions: Map<string, WebSocketCallback[]> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config: BybitAdapterConfig = {}) {
    this.wsUrl =
      config.wsUrl || "wss://stream.bybit.com/v5/public/spot";
    this.pingIntervalMs = config.pingIntervalMs || 20000;
  }

  subscribe(
    symbol: string,
    interval: string,
    callback: WebSocketCallback,
  ): () => void {
    const topic = getKlineTopic(symbol, interval);
    const isNewTopic = !this.subscriptions.has(topic);

    if (isNewTopic) {
      this.subscriptions.set(topic, []);
      this.connect();
    }

    const callbacks = this.subscriptions.get(topic)!;
    callbacks.push(callback);

    if (
      !isNewTopic &&
      this.webSocket?.readyState === globalThis.WebSocket.OPEN
    ) {
      this.sendSubscribe([topic]);
    }

    return () => {
      const topicCallbacks = this.subscriptions.get(topic);
      if (!topicCallbacks) {
        return;
      }

      const index = topicCallbacks.indexOf(callback);
      if (index > -1) {
        topicCallbacks.splice(index, 1);
      }

      if (topicCallbacks.length === 0) {
        this.subscriptions.delete(topic);
        this.sendUnsubscribe([topic]);

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
        this.startPing();
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as
            | BybitKlineStreamMessage
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
        this.stopPing();

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
    data: BybitKlineStreamMessage | ControlMessage,
  ): void {
    if (!("topic" in data) || !data.topic?.startsWith("kline.")) {
      return;
    }

    const message = data as BybitKlineStreamMessage;
    const callbacks = this.subscriptions.get(message.topic) || [];

    for (const candle of message.data) {
      callbacks.forEach((callback) => callback(candle));
    }
  }

  private sendSubscribe(topics: string[]): void {
    if (topics.length === 0) {
      return;
    }

    this.sendMessage({
      op: "subscribe",
      args: topics,
    });
  }

  private sendUnsubscribe(topics: string[]): void {
    if (topics.length === 0) {
      return;
    }

    this.sendMessage({
      op: "unsubscribe",
      args: topics,
    });
  }

  private sendMessage(payload: Record<string, unknown>): void {
    if (this.webSocket?.readyState !== globalThis.WebSocket.OPEN) {
      return;
    }

    this.webSocket.send(JSON.stringify(payload));
  }

  private startPing(): void {
    this.stopPing();

    this.pingIntervalId = setInterval(() => {
      this.sendMessage({ op: "ping" });
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
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
    this.stopPing();

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
