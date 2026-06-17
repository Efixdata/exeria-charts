import { intervalToMilliseconds } from "./interval";

export function formatFinageDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function resolveAggregatesDateRange(options: {
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
    from: formatFinageDate(fromDate),
    to: formatFinageDate(toDate),
  };
}
