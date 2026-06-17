"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import type { ChartNewsEvent } from "../ForexOpportunityApp/chartNews";
import { SENTIMENT_COLORS, formatNewsTime, formatPips } from "../ForexOpportunityApp/chartNews";
import {
  resolveCenteredCalloutPosition,
  resolveStackPositionFromClientPoint,
} from "../ForexOpportunityApp/chartBarPosition";
import styles from "./marketNewsApp.module.css";

type MarketNewsChartCalloutProps = {
  chart: ChartInstance;
  news: ChartNewsEvent;
  containerRef: RefObject<HTMLDivElement | null>;
  stackRef: RefObject<HTMLDivElement | null>;
  anchor?: { clientX: number; clientY: number } | null;
  layoutToken?: number;
  /** When set, applies callout colors without a Market News page shell wrapper. */
  theme?: "dark" | "light";
  onClose: () => void;
};

export default function MarketNewsChartCallout({
  chart,
  news,
  containerRef,
  stackRef,
  anchor,
  layoutToken = 0,
  theme,
  onClose,
}: MarketNewsChartCalloutProps) {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: 200,
    y: 120,
  }));

  const fallbackPosition = useCallback((): { x: number; y: number } => {
    const canvas = containerRef.current;
    const stack = stackRef.current;
    if (canvas && stack) {
      return resolveCenteredCalloutPosition(canvas, stack);
    }

    const width = stack?.clientWidth ?? 400;
    const height = stack?.clientHeight ?? 360;
    return { x: width * 0.52, y: Math.max(96, height * 0.22) };
  }, [containerRef, stackRef]);

  useEffect(() => {
    const canvas = containerRef.current;
    const stack = stackRef.current;
    if (!canvas || !stack) {
      setPosition(fallbackPosition());
      return undefined;
    }

    if (
      anchor &&
      Number.isFinite(anchor.clientX) &&
      Number.isFinite(anchor.clientY)
    ) {
      setPosition(resolveStackPositionFromClientPoint(anchor.clientX, anchor.clientY, stack));
      return undefined;
    }

    setPosition(resolveCenteredCalloutPosition(canvas, stack));

    return undefined;
  }, [anchor, layoutToken, containerRef, stackRef, fallbackPosition]);

  const stackWidth = stackRef.current?.clientWidth ?? 400;
  const themeClass =
    theme === "dark"
      ? styles.newsCalloutThemeDark
      : theme === "light"
        ? styles.newsCalloutThemeLight
        : undefined;

  return (
    <div
      className={[styles.newsLayer, themeClass].filter(Boolean).join(" ")}
      aria-label="News detail overlay"
    >
      <button
        type="button"
        className={styles.newsCalloutBackdrop}
        aria-label="Close news detail"
        onClick={onClose}
      />
      <div
        className={[
          styles.newsCallout,
          !anchor ? styles.newsCalloutCentered : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...(anchor
            ? {
                left: `${Math.max(12, Math.min(position.x - 80, stackWidth - 260))}px`,
                top: `${Math.max(12, position.y - 120)}px`,
              }
            : {}),
          borderColor: SENTIMENT_COLORS[news.sentiment],
        }}
        role="dialog"
        aria-label="News detail"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.newsCalloutActions}>
          <button
            type="button"
            className={styles.newsCalloutIconBtn}
            aria-label="Close news detail"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className={styles.newsCalloutMeta}>
          <span
            className={styles.newsCalloutDot}
            style={{ backgroundColor: SENTIMENT_COLORS[news.sentiment] }}
          />
          {news.source} · {formatNewsTime(news.stamp)}
        </p>
        <strong className={styles.newsCalloutHeadline}>{news.headline}</strong>
        <p className={styles.newsCalloutBody}>{news.body}</p>
        <p className={styles.newsCalloutImpact}>
          Impact: {formatPips(news.impact.pips15m)} / 15m · {formatPips(news.impact.pips1h)} / 1h
        </p>
      </div>
    </div>
  );
}
