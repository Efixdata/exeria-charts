import { mapGateCandleUpdateToTick } from "./candles";
import { getSubscriptionKey, toGateInterval } from "./interval";
import { toGateCurrencyPair } from "./symbol";
import type {
  GateAdapterConfig,
  GateCandlestickUpdate,
  GateWsMessage,
} from "./types";
import type { Tick } from "@efixdata/exeria-chart";

const DEFAULT_WS_URL = "wss://api.gateio.ws/ws/v4/";

export type CandlestickCallback = (update: Tick) => void;
export type WebSocketErrorCallback = (error: Error) => void;

interface ActiveSubscription {
  currencyPair: string;
  interval: string;
  callbacks: CandlestickCallback[];
}

export class GateWebSocketClient {
  private wsUrl: string;
  private webSocket: WebSocket | null = null;
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private errorCallbacks: Set<WebSocketErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;

  constructor(config: GateAdapterConfig = {}) {
    this.wsUrl = config.wsUrl ?? DEFAULT_WS_URL;
  }

  subscribe(
    symbol: string,
    interval: string,
    callback: CandlestickCallback,
  ): () => void {
    const currencyPair = toGateCurrencyPair(symbol);
    const gateInterval = toGateInterval(interval);
    const key = getSubscriptionKey(currencyPair, gateInterval);
    const isNew = !this.subscriptions.has(key);

    if (isNew) {
      this.subscriptions.set(key, {
        currencyPair,
        interval: gateInterval,
        callbacks: [],
      });
      void this.connect();
    }

    const subscription = this.subscriptions.get(key)!;
    subscription.callbacks.push(callback);

    if (!isNew && this.webSocket?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(currencyPair, gateInterval);
    }

    return () => {
      const active = this.subscriptions.get(key);
      if (!active) {
        return;
      }

      const index = active.callbacks.indexOf(callback);
      if (index > -1) {
        active.callbacks.splice(index, 1);
      }

      if (active.callbacks.length === 0) {
        this.subscriptions.delete(key);
        this.sendUnsubscribe(currencyPair, gateInterval);

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
        for (const subscription of this.subscriptions.values()) {
          this.sendSubscribe(subscription.currencyPair, subscription.interval);
        }
      });

      this.webSocket.addEventListener("message", (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : event.data.toString();
          const data = JSON.parse(raw) as GateWsMessage;
          this.handleMessage(data);
        } catch (error) {
          this.notifyError(
            new Error(`Failed to parse WebSocket message: ${error}`),
          );
        }
      });

      this.webSocket.addEventListener("error", () => {
        this.notifyError(new Error("Gate.io WebSocket error"));
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

  private handleMessage(data: GateWsMessage): void {
    if (data.event !== "update" || data.channel !== "spot.candlesticks") {
      return;
    }

    const result = data.result;
    if (!result) {
      return;
    }

    const tick = mapGateCandleUpdateToTick(result as GateCandlestickUpdate);
    const key = this.resolveSubscriptionKey(result);

    if (!key) {
      return;
    }

    const subscription = this.subscriptions.get(key);
    if (!subscription) {
      return;
    }

    subscription.callbacks.forEach((callback) => callback(tick));
  }

  private resolveSubscriptionKey(
    result: GateCandlestickUpdate,
  ): string | null {
    if (result.n) {
      const match = /^([^_]+)_(.+)$/.exec(result.n);
      if (match?.[1] && match[2]) {
        return getSubscriptionKey(match[2], match[1]);
      }
    }

    for (const subscription of this.subscriptions.values()) {
      if (this.subscriptions.size === 1) {
        return getSubscriptionKey(
          subscription.currencyPair,
          subscription.interval,
        );
      }
    }

    return null;
  }

  private sendSubscribe(currencyPair: string, interval: string): void {
    this.send({
      time: Math.floor(Date.now() / 1000),
      channel: "spot.candlesticks",
      event: "subscribe",
      payload: [interval, currencyPair],
    });
  }

  private sendUnsubscribe(currencyPair: string, interval: string): void {
    this.send({
      time: Math.floor(Date.now() / 1000),
      channel: "spot.candlesticks",
      event: "unsubscribe",
      payload: [interval, currencyPair],
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

    setTimeout(() => {
      void this.connect();
    }, this.reconnectDelay);
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }
}
