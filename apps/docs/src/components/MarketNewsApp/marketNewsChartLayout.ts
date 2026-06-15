import type { ChartInstance } from "@exeria/charts";
import { scrollChartToEnd } from "../ForexOpportunityApp/chartBarPosition";

/** Wait until the chart container has non-zero dimensions (avoids blank first paint). */
export function waitForChartContainerReady(
  container: HTMLElement,
  timeoutMs = 2_000,
): Promise<void> {
  return new Promise((resolve) => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      resolve();
      return;
    }

    let timeoutId: number;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve();
      }
    });

    observer.observe(container);
    timeoutId = window.setTimeout(() => {
      observer.disconnect();
      resolve();
    }, timeoutMs);
  });
}

export function relayoutNewsChart(chart: ChartInstance): void {
  try {
    chart.fit();
    scrollChartToEnd(chart);
    chart.render();
  } catch {
    // Chart may already be destroyed.
  }
}

export function scheduleNewsChartRelayout(
  chart: ChartInstance,
  chartRef?: { current: ChartInstance | null },
): () => void {
  const relayout = () => {
    if (chartRef && chartRef.current !== chart) {
      return;
    }
    relayoutNewsChart(chart);
  };

  relayout();

  let rafId = 0;
  if (typeof requestAnimationFrame === "function") {
    rafId = requestAnimationFrame(relayout);
  }

  const timeoutId = window.setTimeout(relayout, 320);

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    clearTimeout(timeoutId);
  };
}

export function observeChartContainer(
  container: HTMLElement,
  chartRef: { current: ChartInstance | null },
  relayout: (chart: ChartInstance) => void,
): ResizeObserver {
  const observer = new ResizeObserver(() => {
    window.requestAnimationFrame(() => {
      const chart = chartRef.current;
      if (!chart) {
        return;
      }

      relayout(chart);
    });
  });

  observer.observe(container);
  return observer;
}
