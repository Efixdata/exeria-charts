const BENIGN_RESIZE_OBSERVER_MESSAGES = [
  "ResizeObserver loop completed with undelivered notifications.",
  "ResizeObserver loop limit exceeded",
] as const;

export function isBenignResizeObserverError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return BENIGN_RESIZE_OBSERVER_MESSAGES.some((entry) => message.includes(entry));
}

export function installBenignResizeObserverErrorSuppression(): () => void {
  const onError = (event: ErrorEvent) => {
    if (isBenignResizeObserverError(event.message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };

  window.addEventListener("error", onError, true);
  return () => window.removeEventListener("error", onError, true);
}
