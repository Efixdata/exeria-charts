import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import {
  applyScreenerStrategyScene,
  configureScreenerMiniChartVisibility,
} from "./screenerScene";
import { SCREENER_SIGNAL_BUY_COLOR, SCREENER_SIGNAL_SELL_COLOR } from "./constants";
import type { ResolvedMiniChartSignal } from "./signalMiniChartData";
import type { ScreenerSignal } from "./signalCatalog";
import { ensureMiniChartStrategyLayout, refreshMiniChartChrome } from "./miniChartChrome";
import {
  fitMiniChartAutoViewport,
  shouldFlipSignalPriceTag,
} from "./miniChartSignalTagViewport";
import { applyMiniChartSignalMarker } from "./miniChartSignalMarker";
import { setMiniChartMarkerState } from "./miniChartMarkerState";

const BUY_COLOR = SCREENER_SIGNAL_BUY_COLOR;
const SELL_COLOR = SCREENER_SIGNAL_SELL_COLOR;

type ChartWithScripts = ChartInstance & {
  recalculateScripts?: (options?: { rerender?: boolean }) => Promise<void>;
};

export async function applyMiniChartScene(
  chart: ChartInstance,
  candles: Candle[],
  signal: ScreenerSignal,
  resolved: ResolvedMiniChartSignal,
): Promise<void> {
  await applyScreenerStrategyScene(chart, signal.symbol);
  configureScreenerMiniChartVisibility(chart, signal.symbol);
  ensureMiniChartStrategyLayout(chart);

  const host = chart as ChartWithScripts;
  await host.recalculateScripts?.({ rerender: false });

  const { barIndex, candle: signalCandle } = resolved;
  setMiniChartMarkerState(chart, { barIndex, side: signal.side });
  applyMiniChartSignalMarker(chart, barIndex, signal.side);
  const markerColor = signal.side === "buy" ? BUY_COLOR : SELL_COLOR;
  const flipped = shouldFlipSignalPriceTag(candles.length, barIndex);

  chart.toolDrawer.drawTool({
    type: "priceTag",
    color: markerColor,
    flipped,
    anchors: [
      {
        stamp: signalCandle.stamp,
        offset: 0,
        value: signalCandle.c,
        _index: barIndex,
      },
    ],
  });

  chart.setCursor("DEFAULT");
  chart.fit();
  refreshMiniChartChrome(chart);
  fitMiniChartAutoViewport(chart, barIndex);
  chart.render();

  requestAnimationFrame(() => {
    if (chart.canvasWidth === 0) {
      return;
    }
    fitMiniChartAutoViewport(chart, barIndex);
    chart.render();
  });
}
