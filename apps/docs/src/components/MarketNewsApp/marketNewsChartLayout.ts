import type { ChartInstance } from "@exeria/charts";
import { scrollChartToEnd } from "../ForexOpportunityApp/chartBarPosition";

/** Wait until the chart container has non-zero dimensions (avoids blank first paint). */
export function waitForChartContainerReady(
  container: HTMLElement,
  timeoutMs = 2_000,
): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();

    const tick = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        resolve();
        return;
      }

      if (performance.now() - started >= timeoutMs) {
        resolve();
        return;
      }

      window.requestAnimationFrame(tick);
    };

    tick();
  });
}

export function relayoutNewsChart(chart: ChartInstance): void {
  chart.fit();
  scrollChartToEnd(chart);
  chart.render();
}

export function scheduleNewsChartRelayout(chart: ChartInstance): void {
  relayoutNewsChart(chart);

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => relayoutNewsChart(chart));
  }

  window.setTimeout(() => relayoutNewsChart(chart), 320);
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
