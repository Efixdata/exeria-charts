import type { Candle, ChartInstance, Interval } from "@efixdata/exeria-chart";

type ChartPanelObject = {
  id?: string;
  type?: string;
  dataLink?: string;
  [key: string]: unknown;
};

type ChartRuntime = ChartInstance & {
  model: {
    mainSeries: string;
    panels: Array<{ main?: boolean; objects: ChartPanelObject[] }>;
    instrumentsSeries: Array<{
      seriesId: string;
      title: string;
      labels: string[];
      fields: string[];
      instrument: Record<string, unknown>;
    }>;
    interval?: unknown;
  };
  fusion: {
    fullSynchronization(): void;
  };
  recalculateScripts?(options?: { rerender?: boolean }): Promise<void>;
};

function overlaySeriesId(symbol: string): string {
  return `overlay-${symbol}`;
}

function createInstrument(symbol: string, label: string) {
  return {
    id: symbol,
    symbol,
    name: label,
    description: label,
    precision: symbol.startsWith("BTC") ? 2 : symbol.includes("USDT") ? 4 : 6,
    chart: "ohlc",
    tradable: false,
    keyWords: [symbol, label],
    related: [],
  };
}

function createLinePlotter(seriesId: string, color: string): ChartPanelObject {
  return {
    id: seriesId,
    type: "SeriesObject",
    dataLink: seriesId,
    renderAs: "Line",
    color,
    stroke: [1],
    dash: [],
    width: 1,
    priceTag: true,
    priceLine: false,
    openDataField: "o",
    highDataField: "h",
    lowDataField: "l",
    closeDataField: "c",
    dataField: "c",
    strokeStyle: color,
    _hit: false,
    _hitAnchor: null,
    _hitArrow: null,
    selected: false,
  };
}

function getMainPanel(runtime: ChartRuntime) {
  return runtime.model.panels.find((panel) => panel.main) ?? runtime.model.panels[0];
}

export function removeChartOverlay(chart: ChartInstance, symbol: string): void {
  const runtime = chart as ChartRuntime;
  const seriesId = overlaySeriesId(symbol);
  const mainPanel = getMainPanel(runtime);

  const instrumentIndex = runtime.model.instrumentsSeries.findIndex(
    (entry) => entry.seriesId === seriesId,
  );
  if (instrumentIndex >= 0) {
    runtime.model.instrumentsSeries.splice(instrumentIndex, 1);
  }

  if (mainPanel) {
    const plotterIndex = mainPanel.objects.findIndex((object) => object.dataLink === seriesId);
    if (plotterIndex >= 0) {
      mainPanel.objects.splice(plotterIndex, 1);
    }
  }

  delete chart.getSeriesManager()[seriesId];
  chart.setValueAxisMode("lin");
  chart.render();
}

export function applyStaticChartOverlay(
  chart: ChartInstance,
  symbol: string,
  label: string,
  candles: Candle[],
  interval: Interval,
  color = "#f59e0b",
): void {
  const runtime = chart as ChartRuntime;
  const seriesId = overlaySeriesId(symbol);
  const instrument = createInstrument(symbol, label);
  const mainPanel = getMainPanel(runtime);

  const existingIndex = runtime.model.instrumentsSeries.findIndex(
    (entry) => entry.seriesId === seriesId,
  );

  if (existingIndex < 0) {
    runtime.model.instrumentsSeries.push({
      seriesId,
      title: label,
      labels: ["O", "H", "L", "C", "V", "I"],
      fields: ["o", "h", "l", "c", "v", "i"],
      instrument,
    });

    if (mainPanel && !mainPanel.objects.some((object) => object.dataLink === seriesId)) {
      mainPanel.objects.push(createLinePlotter(seriesId, color));
    }
  }

  const seriesManager = chart.getSeriesManager();
  seriesManager[seriesId] = {
    seriesId,
    title: label,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    instrument,
    interval,
    data: candles,
  };

  runtime.fusion.fullSynchronization();
  chart.setInstrumentDrawMode("Line", seriesId);
  chart.applyChartInstrumentSettings(seriesId, {
    lineColor: color,
    lineDash: [4, 4],
  });
  chart.render();
}

export async function applyChartOverlay(
  chart: ChartInstance,
  symbol: string,
  label: string,
  interval: string,
  color = "#f59e0b",
): Promise<void> {
  const runtime = chart as ChartRuntime;
  const seriesId = overlaySeriesId(symbol);
  const instrument = createInstrument(symbol, label);
  const mainPanel = getMainPanel(runtime);

  const [{ intervalFromSymbol }, { BinanceAdapter }] = await Promise.all([
    import("@efixdata/exeria-chart"),
    import("../../../../../packages/adapter-binance/src"),
  ]);
  const chartInterval = intervalFromSymbol(interval);

  const adapter = new BinanceAdapter();
  let candles: Candle[] = [];

  try {
    candles = await adapter.getHistoricalData(symbol, { interval, limit: 1000 });
  } finally {
    adapter.disconnect?.();
  }

  const existingIndex = runtime.model.instrumentsSeries.findIndex(
    (entry) => entry.seriesId === seriesId,
  );

  if (existingIndex < 0) {
    runtime.model.instrumentsSeries.push({
      seriesId,
      title: label,
      labels: ["O", "H", "L", "C", "V", "I"],
      fields: ["o", "h", "l", "c", "v", "i"],
      instrument,
    });

    if (mainPanel && !mainPanel.objects.some((object) => object.dataLink === seriesId)) {
      mainPanel.objects.push(createLinePlotter(seriesId, color));
    }
  }

  const seriesManager = chart.getSeriesManager();
  seriesManager[seriesId] = {
    seriesId,
    title: label,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    instrument,
    interval: chartInterval,
    data: candles,
  };

  runtime.fusion.fullSynchronization();
  chart.setInstrumentDrawMode("Line", seriesId);
  chart.applyChartInstrumentSettings(seriesId, {
    lineColor: color,
    lineDash: [],
  });
  chart.setValueAxisMode("%");

  chart.render();
}
