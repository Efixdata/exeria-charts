type MarketingEventProperties = Record<string, string | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackMarketingEvent(event: string, properties: MarketingEventProperties = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const detail = { event, ...properties };

  window.dispatchEvent(new CustomEvent("exeria:analytics", { detail }));

  if (typeof window.gtag === "function") {
    window.gtag("event", event, properties);
  }
}
