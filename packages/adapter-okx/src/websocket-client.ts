import { getCandleChannel, getSubscriptionKey } from "./interval";
import { toOkxInstId } from "./symbol";
import {
  OkxAdapterConfig,
  OkxCandleStreamMessage,
  OkxSubscriptionArg,
} from "./types";

export type WebSocketCallback = (data: string[]) => void;
export type WebSocketErrorCallback = (error: Error) => void;

interface ControlMessage {
  event?: string;
  code?: string;
  msg?: string;
  arg?: OkxSubscriptionArg;
}

export class OkxWebSocketClient {
  private wsUrl: string;
  private webSocket: globalThis.WebSocket | null = null;
  private subscriptions: Map<string, WebSocketCallback[]> = new Map();
  private subscriptionArgs: Map<string, OkxSubscriptionArg> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;

  constructor(config: OkxAdapterConfig = {}) {
    this.wsUrl =
      config.wsUrl || "wss://ws.okx.com:8443/ws/v5/business";
  }

  subscribe(
    symbol: string,
    interval: string,
    callback: WebSocketCallback,
  ): () => void {
    const instId = toOkxInstId(symbol);
    const channel = getCandleChannel(interval);
    const key = getSubscriptionKey(channel, instId);
    const isNewSubscription = !this.subscriptions.has(key);

    if (isNewSubscription) {
      this.subscriptions.set(key, []);
      this.subscriptionArgs.set(key, { channel, instId });
      this.connect();
    }

    const callbacks = this.subscriptions.get(key)!;
    callbacks.push(callback);

    if (
      !isNewSubscription &&
      this.webSocket?.readyState === globalThis.WebSocket.OPEN
    ) {
      this.sendSubscribe([this.subscriptionArgs.get(key)!]);
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
        const arg = this.subscriptionArgs.get(key);
        this.subscriptions.delete(key);
        this.subscriptionArgs.delete(key);

        if (arg) {
          this.sendUnsubscribe([arg]);
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
        this.sendSubscribe(Array.from(this.subscriptionArgs.values()));
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as
            | OkxCandleStreamMessage
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

  private handleMessage(data: OkxCandleStreamMessage | ControlMessage): void {
    if ("event" in data && data.event) {
      if (data.event === "error") {
        this.notifyError(
          new Error(
            `OKX WebSocket error: ${data.msg || "Unknown error"} (${data.code || "unknown"})`,
          ),
        );
      }
      return;
    }

    if (!("arg" in data) || !data.arg?.channel?.startsWith("candle")) {
      return;
    }

    const message = data as OkxCandleStreamMessage;
    const key = getSubscriptionKey(message.arg.channel, message.arg.instId);
    const callbacks = this.subscriptions.get(key) || [];

    for (const row of message.data) {
      callbacks.forEach((callback) => callback(row));
    }
  }

  private sendSubscribe(args: OkxSubscriptionArg[]): void {
    if (args.length === 0) {
      return;
    }

    this.sendMessage({
      op: "subscribe",
      args,
    });
  }

  private sendUnsubscribe(args: OkxSubscriptionArg[]): void {
    if (args.length === 0) {
      return;
    }

    this.sendMessage({
      op: "unsubscribe",
      args,
    });
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

  isConnected(): boolean {
    return this.webSocket?.readyState === globalThis.WebSocket.OPEN;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
