import type { FintechAsset } from "./constants";
import type { FintechMarketId } from "./marketPresets";

export function formatDisplaySymbol(asset: FintechAsset, marketId: FintechMarketId): string {
  if (marketId === "equities") {
    return asset.symbol;
  }

  return asset.symbol.replace("USDT", "/USDT");
}

export function formatPercent(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function formatSharePercent(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(fractionDigits)}%`;
}

export function readSparklineChange(points: number[]): number | null {
  const valid = points.filter((point) => Number.isFinite(point));
  if (valid.length < 2) {
    return null;
  }

  const first = valid[0]!;
  const last = valid[valid.length - 1]!;

  if (first === 0) {
    return null;
  }

  const change = ((last - first) / first) * 100;
  return Number.isFinite(change) ? change : null;
}

export function formatAssetPrice(value: number, marketId: FintechMarketId): string {
  if (marketId === "equities") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}
