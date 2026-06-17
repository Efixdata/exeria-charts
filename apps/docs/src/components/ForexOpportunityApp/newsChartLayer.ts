import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import type { ChartNewsEvent } from "./chartNews";
import { SENTIMENT_COLORS, formatPips } from "./chartNews";
import { FOREX_INTERVAL_MILIS } from "./constants";
import { focusChartOnBar } from "./chartBarPosition";

const trackedDrawingIds: Array<string | number> = [];

function collectId(result: string | number | void): void {
  if (result !== undefined && result !== null) {
    trackedDrawingIds.push(result);
  }
}

export function clearNewsChartLayer(chart: ChartInstance): void {
  while (trackedDrawingIds.length > 0) {
    const id = trackedDrawingIds.pop();
    if (id !== undefined) {
      chart.toolDrawer.deleteTool(id);
    }
  }
  chart.render();
}

export function expandNewsOnChart(
  chart: ChartInstance,
  news: ChartNewsEvent,
  candles: Candle[],
): void {
  clearNewsChartLayer(chart);

  const candle = candles[news.barIndex];
  const peak = candles[news.impact.peakBarIndex];
  if (!candle || !peak) {
    return;
  }

  const color = SENTIMENT_COLORS[news.sentiment];
  const impactLabel = `${formatPips(news.impact.pips15m)} / 15m`;

  collectId(
    chart.toolDrawer.drawTool({
      id: `news-line-${news.id}`,
      type: "vLine",
      color,
      width: 1.5,
      dash: [4, 4],
      editable: false,
      anchors: [
        {
          stamp: news.stamp,
          offset: 0,
          value: candle.c,
          _index: news.barIndex,
        },
      ],
    }),
  );

  const timeRangeId = chart.toolDrawer.drawTimeRange({
    text: `${news.source} · ${impactLabel}`,
    startTime: news.stamp,
    timeRange: FOREX_INTERVAL_MILIS * 4,
    config: {
      editable: false,
      color,
      secondaryColor: `${color}22`,
      textColor: color,
    },
  });
  collectId(timeRangeId);

  const peakValue =
    news.impact.direction === "down"
      ? Math.min(candle.c, peak.l)
      : Math.max(candle.c, peak.h);

  collectId(
    chart.toolDrawer.drawTool({
      id: `news-arrow-${news.id}`,
      type: "arrow",
      color,
      editable: false,
      anchors: [
        {
          stamp: news.stamp,
          offset: 0,
          value: candle.c,
          _index: news.barIndex,
        },
        {
          stamp: peak.stamp,
          offset: 0,
          value: peakValue,
          _index: news.impact.peakBarIndex,
        },
      ],
    }),
  );

  collectId(
    chart.toolDrawer.drawTool({
      id: `news-tag-${news.id}`,
      type: "priceTag",
      color,
      editable: false,
      anchors: [
        {
          stamp: peak.stamp,
          offset: 0,
          value: peakValue,
          _index: news.impact.peakBarIndex,
        },
      ],
    }),
  );

  collectId(
    chart.toolDrawer.drawTool({
      id: `news-text-${news.id}`,
      type: "textAnnotation",
      color: "#f8fafc",
      text: news.headline,
      fontSize: 12,
      editable: false,
      anchors: [
        {
          stamp: news.stamp,
          offset: 0,
          value: candle.h,
          _index: news.barIndex,
        },
        {
          stamp: candles[Math.min(news.barIndex + 6, candles.length - 1)]!.stamp,
          offset: 0,
          value: candle.h + 0.0008,
          _index: Math.min(news.barIndex + 6, candles.length - 1),
        },
      ],
    }),
  );

  focusChartOnBar(chart, news.barIndex);
  chart.render();
}
