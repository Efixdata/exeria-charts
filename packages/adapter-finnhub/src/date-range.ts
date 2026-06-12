import { intervalToMilliseconds } from "./interval";

export function resolveCandleDateRange(options: {
  from?: Date;
  to?: Date;
  limit?: number;
  interval: string;
}): { from: number; to: number } {
  const toDate = options.to ?? new Date();
  const limit = options.limit ?? 500;
  const spanMs = limit * intervalToMilliseconds(options.interval);
  const fromDate =
    options.from ?? new Date(toDate.getTime() - Math.max(spanMs, 86_400_000));

  return {
    from: Math.floor(fromDate.getTime() / 1000),
    to: Math.floor(toDate.getTime() / 1000),
  };
}
