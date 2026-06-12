import { detectMassiveMarket, toMassiveTicker, toWsTicker } from "./symbol";
import { mapBarToTick } from "./ticker";
import type {
  MassiveAdapterConfig,
  MassiveAggregateMessage,
  MassiveMarket,
  MassiveStatusMessage,
} from "./types";
import type { Tick } from "@efixdata/exeria-chart";

const DEFAULT_WS_URLS: Record<MassiveMarket, string> = {
  stocks: "wss://socket.massive.com/stocks",
  crypto: "wss://socket.massive.com/crypto",
  forex: "wss://socket.massive.com/forex",
};

type WsMessage = MassiveAggregateMessage | MassiveStatusMessage;

export class MassiveWebSocketClient {
  private apiKey: string;
  private wsUrls: Record<MassiveMarket, string>;
  private onError?: (error: unknown) => void;
  private connections = new Map<MassiveMarket, MarketConnection>();

  constructor(config: MassiveAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("MassiveWebSocketClient requires apiKey");
    }

    this.apiKey = config.apiKey;
    this.wsUrls = {
      ...DEFAULT_WS_URLS,
      ...config.wsUrls,
    };
    this.onError = config.onError;
  }

  subscribe(symbol: string, onTick: (tick: Tick) => void): () => void {
    const market = detectMassiveMarket(symbol);
    const ticker = toWsTicker(symbol, market);
    const connection = this.getConnection(market);

    return connection.subscribe(ticker, onTick);
  }

  disconnect(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
  }

  private getConnection(market: MassiveMarket): MarketConnection {
    const existing = this.connections.get(market);
    if (existing) {
      return existing;
    }

    const connection = new MarketConnection({
      market,
      url: this.wsUrls[market],
      apiKey: this.apiKey,
      onError: this.onError,
    });

    this.connections.set(market, connection);
    return connection;
  }
}

interface MarketConnectionOptions {
  market: MassiveMarket;
  url: string;
  apiKey: string;
  onError?: (error: unknown) => void;
}

class MarketConnection {
  private market: MassiveMarket;
  private url: string;
  private apiKey: string;
  private onError?: (error: unknown) => void;
  private ws: WebSocket | null = null;
  private authenticated = false;
  private pendingChannels = new Set<string>();
  private listeners = new Map<string, Set<(tick: Tick) => void>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(options: MarketConnectionOptions) {
    this.market = options.market;
    this.url = options.url;
    this.apiKey = options.apiKey;
    this.onError = options.onError;
    this.connect();
  }

  subscribe(ticker: string, onTick: (tick: Tick) => void): () => void {
    const channel = this.toChannel(ticker);
    const existing = this.listeners.get(channel) ?? new Set();
    existing.add(onTick);
    this.listeners.set(channel, existing);

    if (this.authenticated) {
      this.sendSubscribe([channel]);
    } else {
      this.pendingChannels.add(channel);
    }

    return () => {
      const callbacks = this.listeners.get(channel);
      if (!callbacks) {
        return;
      }

      callbacks.delete(onTick);
      if (callbacks.size === 0) {
        this.listeners.delete(channel);
        this.sendUnsubscribe([channel]);
      }
    };
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.pendingChannels.clear();
  }

  private connect(): void {
    if (this.closed) {
      return;
    }

    this.ws = new WebSocket(this.url);
    this.authenticated = false;

    this.ws.onopen = () => {
      this.send({ action: "auth", params: this.apiKey });
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (error) => {
      this.onError?.(error);
    };

    this.ws.onclose = () => {
      this.authenticated = false;
      if (!this.closed) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  private handleMessage(raw: unknown): void {
    let parsed: unknown;

    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return;
    }

    const messages = Array.isArray(parsed) ? parsed : [parsed];

    for (const message of messages) {
      if (!message || typeof message !== "object") {
        continue;
      }

      const payload = message as WsMessage;

      if (payload.ev === "status") {
        if (payload.status === "auth_success") {
          this.authenticated = true;
          const channels = [
            ...new Set([...this.pendingChannels, ...this.listeners.keys()]),
          ];
          if (channels.length > 0) {
            this.sendSubscribe(channels);
          }
          this.pendingChannels.clear();
        }
        continue;
      }

      const tick = this.mapAggregateToTick(payload);
      if (!tick) {
        continue;
      }

      const channel = this.toChannel(payload.sym ?? payload.pair ?? "");

      const callbacks = this.listeners.get(channel);
      if (!callbacks) {
        continue;
      }

      for (const callback of callbacks) {
        callback(tick);
      }
    }
  }

  private mapAggregateToTick(message: MassiveAggregateMessage): Tick | null {
    const time = message.s ?? message.e;
    const close = message.c;

    if (time === undefined || close === undefined) {
      return null;
    }

    return mapBarToTick({
      t: time,
      o: message.o ?? close,
      h: message.h ?? close,
      l: message.l ?? close,
      c: close,
      v: message.v,
    });
  }

  private toChannel(ticker: string): string {
    const normalized = ticker.toUpperCase();

    switch (this.market) {
      case "stocks":
        return `AM.${normalized.replace(/^AM\./, "")}`;
      case "crypto": {
        const body = normalized.startsWith("X:")
          ? normalized
          : toMassiveTicker(normalized, "crypto");
        return `XA.${body}`;
      }
      case "forex": {
        const body = normalized.startsWith("C:")
          ? normalized
          : toMassiveTicker(normalized, "forex");
        return `CA.${body}`;
      }
    }
  }

  private sendSubscribe(channels: string[]): void {
    if (channels.length === 0) {
      return;
    }

    this.send({ action: "subscribe", params: channels.join(",") });
  }

  private sendUnsubscribe(channels: string[]): void {
    if (channels.length === 0) {
      return;
    }

    this.send({ action: "unsubscribe", params: channels.join(",") });
  }

  private send(payload: Record<string, string>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}
