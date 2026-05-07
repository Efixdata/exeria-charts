import type { ChartEventPayloads, ChartSubscription } from "./types";

type KnownTopic = keyof ChartEventPayloads;
type ChartEventTopic = KnownTopic | (string & {});
type ChartEventCallback<TData> = (data: TData) => void;

interface ChartEvent<TTopic extends ChartEventTopic = ChartEventTopic, TData = unknown> {
  topic: TTopic;
  data: TTopic extends KnownTopic ? ChartEventPayloads[TTopic] : TData;
}

export default class SubscriptionManager {
  callbacks: Map<ChartEventTopic, Array<ChartEventCallback<unknown>>>;

  constructor(_chart?: unknown) {
    this.callbacks = new Map();
  }

  subscribe<TTopic extends KnownTopic>(
    topic: TTopic,
    callback: ChartEventCallback<ChartEventPayloads[TTopic]>,
  ): ChartSubscription | void;
  subscribe(topic: ChartEventTopic, callback: ChartEventCallback<unknown>): ChartSubscription | void;
  subscribe(topic: ChartEventTopic, callback: ChartEventCallback<unknown>): ChartSubscription | void {
    if (topic === undefined) return;
    if (!this.callbacks.get(topic)) this.callbacks.set(topic, []);

    this.callbacks.get(topic)?.push(callback);

    return {
      unsubscribe: () => {
        const callbackIdx = this.callbacks.get(topic)?.indexOf(callback);
        if (callbackIdx !== undefined && callbackIdx !== -1) {
          this.callbacks.get(topic)?.splice(callbackIdx, 1);
        }
      },
    };
  }

  onEvent<TTopic extends KnownTopic>(event: ChartEvent<TTopic>): void;
  onEvent(event: ChartEvent): void;
  onEvent(event: ChartEvent): void {
    this.callbacks.get(event.topic)?.forEach((callback) => {
      callback(event.data);
    });
  }

  clear(): void {
    this.callbacks.clear();
  }
}