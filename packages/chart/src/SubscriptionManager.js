class SubscriptionManager {
  callbacks;

  constructor() {
    this.callbacks = new Map();
  }

  subscribe(topic, callback) {
    if (!this.callbacks) return;
    if (topic === undefined) return;
    if (!this.callbacks.get(topic)) this.callbacks.set(topic, []);

    this.callbacks?.get(topic)?.push(callback);

    return {
      unsubscribe: () => {
        const callbackIdx = this.callbacks?.get(topic)?.indexOf(callback);
        if (callbackIdx !== undefined && callbackIdx !== -1) {
          this.callbacks?.get(topic)?.splice(callbackIdx, 1);
        }
      }
    }
  }

  onEvent(event) {
    this.callbacks?.get(event.topic)?.forEach((callback) => {
      callback(event.data);
    });
  }
} 

export default SubscriptionManager;
