"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import type { ChartNewsEvent } from "./chartNews";
import { SENTIMENT_COLORS, formatNewsTime, formatPips } from "./chartNews";
import {
  resolveCenteredCalloutPosition,
  resolveNewsCalloutPosition,
  resolveStackPositionFromClientPoint,
} from "./chartBarPosition";
import styles from "./forexOpportunityApp.module.css";

type NewsChartCalloutProps = {
  chart: ChartInstance;
  news: ChartNewsEvent;
  containerRef: RefObject<HTMLDivElement | null>;
  stackRef: RefObject<HTMLDivElement | null>;
  anchor?: { clientX: number; clientY: number } | null;
  layoutToken?: number;
  onClose: () => void;
};

function resolveNewsFeedScriptId(chart: ChartInstance): string | number | null {
  const settings = chart.getChartIndicatorSettings?.() ?? [];

  for (let index = settings.length - 1; index >= 0; index -= 1) {
    const entry = settings[index];
    if (entry?.key === "NEWSFEED" && entry.scriptId != null) {
      return entry.scriptId;
    }
  }

  return null;
}

export default function NewsChartCallout({
  chart,
  news,
  containerRef,
  stackRef,
  anchor,
  layoutToken = 0,
  onClose,
}: NewsChartCalloutProps) {
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

    let cancelled = false;
    let attempts = 0;

    const resolve = () => {
      if (cancelled) {
        return;
      }

      const next = resolveNewsCalloutPosition(chart, news.barIndex, canvas, stack);
      if (next) {
        setPosition(next);
        return;
      }

      if (attempts < 32) {
        attempts += 1;
        requestAnimationFrame(resolve);
        return;
      }

      setPosition(fallbackPosition());
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [anchor, chart, layoutToken, news.barIndex, containerRef, stackRef, fallbackPosition]);

  const openNewsFeedSettings = () => {
    const scriptId = resolveNewsFeedScriptId(chart);
    if (scriptId == null) {
      return;
    }

    chart.requestIndicatorEdit(scriptId);
    onClose();
  };

  const stackWidth = stackRef.current?.clientWidth ?? 400;

  return (
    <div className={styles.newsLayer} aria-label="News detail overlay">
      <button
        type="button"
        className={styles.newsCalloutBackdrop}
        aria-label="Close news detail"
        onClick={onClose}
      />
      <div
        className={styles.newsCallout}
        style={{
          left: `${Math.max(12, Math.min(position.x - 80, stackWidth - 260))}px`,
          top: `${Math.max(12, position.y - 120)}px`,
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
            aria-label="Edit News Feed indicator"
            title="Edit News Feed indicator"
            onClick={openNewsFeedSettings}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
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
