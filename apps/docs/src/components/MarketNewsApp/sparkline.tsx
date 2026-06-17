"use client";

import { useMemo } from "react";
import type { Candle } from "@efixdata/exeria-chart";
import { computeChangePercent, readSparklineValues } from "./forexCandleUtils";
import styles from "./marketNewsApp.module.css";

type SparklineProps = {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
};

export function Sparkline({
  values,
  color = "#2563eb",
  width = 88,
  height = 32,
}: SparklineProps) {
  const path = useMemo(() => {
    if (values.length < 2) {
      return "";
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [height, values, width]);

  if (!path) {
    return <svg className={styles.sparkline} width={width} height={height} aria-hidden />;
  }

  return (
    <svg className={styles.sparkline} width={width} height={height} aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function formatQuoteChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function quoteTone(value: number): "up" | "down" | "flat" {
  if (value > 0.01) {
    return "up";
  }
  if (value < -0.01) {
    return "down";
  }
  return "flat";
}

export type QuoteSnapshot = {
  symbol: string;
  last: number;
  changePercent: number;
  sparkline: number[];
};

export function buildQuoteSnapshot(symbol: string, candles: Candle[], decimals: number): QuoteSnapshot {
  const periodCandles = candles.slice(-168);
  const last = candles.at(-1)?.c ?? 0;

  return {
    symbol,
    last,
    changePercent: computeChangePercent(periodCandles),
    sparkline: readSparklineValues(periodCandles, 40),
  };
}

export function formatQuotePrice(value: number, decimals: number): string {
  return value.toFixed(decimals);
}
