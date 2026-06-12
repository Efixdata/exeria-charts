export function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 1000 ? 2 : value >= 1 ? 4 : 6,
  });
}

export function formatCompactUsd(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${formatPrice(value)}`;
}

export function formatChangePercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPnl(usd: number): string {
  const sign = usd >= 0 ? "+" : "−";
  return `${sign}$${formatPrice(Math.abs(usd))}`;
}

export function formatPnlPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSize(value: number): string {
  if (value >= 1) {
    return value.toFixed(4);
  }
  return value.toFixed(6);
}
