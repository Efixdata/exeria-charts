import { getCandleTopic, getSubscriptionKey } from "./interval";
import { toKucoinSymbol } from "./symbol";
import {
  KucoinAdapterConfig,
  KucoinCandleStreamMessage,
  KucoinWsConnectInfo,
} from "./types";

export type WebSocketCallback = (candles: string[]) => void;
export type WebSocketErrorCallback = (error: Error) => void;
export type TokenProvider = () => Promise<KucoinWsConnectInfo>;

interface ControlMessage {
  type?: string;
  id?: string;
  topic?: string;
  data?: string;
}

export class KucoinWebSocketClient {
  private tokenProvider: TokenProvider;
  private webSocket: globalThis.WebSocket | null = null;
  private subscriptions: Map<string, WebSocketCallback[]> = new Map();
  private topics: Map<string, string> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongDeadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private connectInfo: KucoinWsConnectInfo | null = null;
  private messageId = 1;

  constructor(
    _config: KucoinAdapterConfig = {},
    tokenProvider: TokenProvider,
  ) {
    this.tokenProvider = tokenProvider;
  }

  subscribe(
    symbol: string,
    interval: string,
    callback: WebSocketCallback,
  ): () => void {
    const kucoinSymbol = toKucoinSymbol(symbol);
    const topic = getCandleTopic(kucoinSymbol, interval);
    const key = getSubscriptionKey(topic);
    const isNewSubscription = !this.subscriptions.has(key);

    if (isNewSubscription) {
      this.subscriptions.set(key, []);
      this.topics.set(key, topic);
      void this.connect();
    }

    const callbacks = this.subscriptions.get(key)!;
    callbacks.push(callback);

    if (
      !isNewSubscription &&
      this.webSocket?.readyState === globalThis.WebSocket.OPEN
    ) {
      this.sendSubscribe(topic);
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
        const activeTopic = this.topics.get(key);
        this.subscriptions.delete(key);
        this.topics.delete(key);

        if (activeTopic) {
          this.sendUnsubscribe(activeTopic);
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

  private async connect(): Promise<void> {
    if (
      this.webSocket &&
      (this.webSocket.readyState === globalThis.WebSocket.OPEN ||
        this.webSocket.readyState === globalThis.WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      this.isIntentionallyClosed = false;
      this.connectInfo = await this.tokenProvider();
      const endpoint = this.connectInfo.endpoint.replace(/\/$/, "");
      const wsUrl = `${endpoint}?token=${this.connectInfo.token}`;
      this.webSocket = new globalThis.WebSocket(wsUrl);

      this.webSocket.addEventListener("open", () => {
        this.reconnectAttempts = 0;
        this.startPingLoop();
        for (const topic of this.topics.values()) {
          this.sendSubscribe(topic);
        }
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as
            | KucoinCandleStreamMessage
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
        this.stopPingLoop();

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
    data: KucoinCandleStreamMessage | ControlMessage,
  ): void {
    if (data.type === "pong") {
      this.resetPongDeadline();
      return;
    }

    if (data.type === "welcome" || data.type === "ack") {
      return;
    }

    if (data.type === "error") {
      const message = (data as ControlMessage).data || "Unknown error";
      this.notifyError(new Error(`KuCoin WebSocket error: ${message}`));
      return;
    }

    if (
      data.type !== "message" ||
      !("topic" in data) ||
      !data.topic?.startsWith("/market/candles:")
    ) {
      return;
    }

    const message = data as KucoinCandleStreamMessage;
    const candles = message.data?.candles;
    if (!candles || candles.length === 0) {
      return;
    }

    const key = getSubscriptionKey(message.topic);
    const callbacks = this.subscriptions.get(key) || [];
    callbacks.forEach((callback) => callback(candles));
  }

  private sendSubscribe(topic: string): void {
    this.sendMessage({
      id: this.nextMessageId(),
      type: "subscribe",
      topic,
      response: true,
    });
  }

  private sendUnsubscribe(topic: string): void {
    this.sendMessage({
      id: this.nextMessageId(),
      type: "unsubscribe",
      topic,
      response: true,
    });
  }

  private sendMessage(payload: Record<string, unknown>): void {
    if (this.webSocket?.readyState !== globalThis.WebSocket.OPEN) {
      return;
    }

    this.webSocket.send(JSON.stringify(payload));
  }

  private startPingLoop(): void {
    this.stopPingLoop();

    const pingInterval = this.connectInfo?.pingInterval ?? 18_000;
    const pingTimeout = this.connectInfo?.pingTimeout ?? 10_000;

    this.pingTimer = setInterval(() => {
      this.sendMessage({
        id: this.nextMessageId(),
        type: "ping",
      });
      this.resetPongDeadline(pingTimeout);
    }, pingInterval);
  }

  private resetPongDeadline(timeoutMs?: number): void {
    if (this.pongDeadlineTimer) {
      clearTimeout(this.pongDeadlineTimer);
      this.pongDeadlineTimer = null;
    }

    const pingTimeout = timeoutMs ?? this.connectInfo?.pingTimeout ?? 10_000;
    this.pongDeadlineTimer = setTimeout(() => {
      if (!this.isIntentionallyClosed && this.subscriptions.size > 0) {
        this.webSocket?.close();
      }
    }, pingTimeout);
  }

  private stopPingLoop(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.pongDeadlineTimer) {
      clearTimeout(this.pongDeadlineTimer);
      this.pongDeadlineTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isIntentionallyClosed &&
      this.subscriptions.size > 0
    ) {
      this.reconnectAttempts++;
      this.webSocket = null;
      setTimeout(() => {
        void this.connect();
      }, this.reconnectDelay);
    }
  }

  private nextMessageId(): number {
    this.messageId += 1;
    return this.messageId;
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingLoop();
    this.connectInfo = null;

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
