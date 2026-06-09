import {
  BinanceInterval,
  BinanceKlineStream,
  BinanceMultiplexedKlineStream,
  BinanceAdapterConfig,
} from "./types";

export type WebSocketCallback = (data: BinanceKlineStream) => void;
export type WebSocketErrorCallback = (error: Error) => void;

export class BinanceWebSocketClient {
  private wsUrl: string;
  private webSocket: globalThis.WebSocket | null = null;
  private subscriptions: Map<string, WebSocketCallback[]> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;

  constructor(config: BinanceAdapterConfig = {}) {
    this.wsUrl = config.wsUrl || "wss://stream.binance.com:9443";
  }

  subscribe(
    symbol: string,
    interval: BinanceInterval,
    callback: WebSocketCallback
  ): () => void {
    const streamName = this.getStreamName(symbol, interval);

    if (!this.subscriptions.has(streamName)) {
      this.subscriptions.set(streamName, []);
      this.connect();
    }

    const callbacks = this.subscriptions.get(streamName)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        this.subscriptions.delete(streamName);
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
    if (this.webSocket && this.webSocket.readyState === globalThis.WebSocket.OPEN) {
      return;
    }

    try {
      const streamNames = Array.from(this.subscriptions.keys());
      const streamUrl = streamNames.length > 0 
        ? `${this.wsUrl}/stream?streams=${streamNames.join("/")}` 
        : this.wsUrl;

      this.webSocket = new globalThis.WebSocket(streamUrl);

      this.webSocket.addEventListener("open", () => {
        this.reconnectAttempts = 0;
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw);
          this.handleMessage(data);
        } catch (error) {
          this.notifyError(
            new Error(`Failed to parse WebSocket message: ${error}`)
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
          : new Error("Failed to create WebSocket connection")
      );
    }
  }

  private handleMessage(
    data: BinanceKlineStream | BinanceMultiplexedKlineStream
  ): void {
    if ("stream" in data && "data" in data) {
      const callbacks = this.subscriptions.get(data.stream) || [];
      callbacks.forEach((callback) => callback(data.data));
      return;
    }

    const streamName = `${data.s.toLowerCase()}@kline_${data.k.i}`;
    const callbacks = this.subscriptions.get(streamName) || [];
    callbacks.forEach((callback) => callback(data));
  }

  private attemptReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isIntentionallyClosed
    ) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private getStreamName(symbol: string, interval: BinanceInterval): string {
    return `${symbol.toLowerCase()}@kline_${interval}`;
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
