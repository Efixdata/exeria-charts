import {
  intradayWindowSeconds,
  intervalToMilliseconds,
  toEodhdIntradayInterval,
} from "./interval";

export function formatEodDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function resolveEodDateRange(options: {
  from?: Date;
  to?: Date;
  limit?: number;
  interval: string;
}): { from: string; to: string } {
  const toDate = options.to ?? new Date();
  const limit = options.limit ?? 500;
  const spanMs = limit * intervalToMilliseconds(options.interval);
  const fromDate =
    options.from ?? new Date(toDate.getTime() - Math.max(spanMs, 86_400_000));

  return {
    from: formatEodDate(fromDate),
    to: formatEodDate(toDate),
  };
}

export function resolveIntradayUnixRange(options: {
  from?: Date;
  to?: Date;
  limit?: number;
  interval: string;
}): { from: number; to: number } {
  const toDate = options.to ?? new Date();
  const limit = options.limit ?? 500;
  const spanMs = limit * intervalToMilliseconds(options.interval);
  const fromDate =
    options.from ?? new Date(toDate.getTime() - Math.max(spanMs, 3_600_000));

  return {
    from: Math.floor(fromDate.getTime() / 1000),
    to: Math.floor(toDate.getTime() / 1000),
  };
}

export function splitIntradayWindows(options: {
  from: number;
  to: number;
  interval: string;
}): Array<{ from: number; to: number }> {
  const eodhdInterval = toEodhdIntradayInterval(options.interval);
  const maxWindow = intradayWindowSeconds(eodhdInterval);
  const windows: Array<{ from: number; to: number }> = [];

  let windowEnd = options.to;

  while (windowEnd > options.from) {
    const windowStart = Math.max(options.from, windowEnd - maxWindow);
    windows.unshift({ from: windowStart, to: windowEnd });
    windowEnd = windowStart - 1;
  }

  if (windows.length === 0) {
    windows.push({ from: options.from, to: options.to });
  }

  return windows;
}
