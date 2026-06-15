import type { ForexTimeframeId } from "../ForexOpportunityApp/forexInstruments";
import { toChartInterval } from "../ForexOpportunityApp/forexInstruments";
import { INITIAL_EQUITY } from "./constants";
import type { QuantPresetId } from "./strategyPresets";
import { findQuantPreset } from "./strategyPresets";

function pairSlug(symbol: string): string {
  return symbol.toLowerCase().replace("/", "-");
}

function datasetPath(symbol: string, timeframeId: ForexTimeframeId): string {
  return `/data/${pairSlug(symbol)}-${timeframeId}.json`;
}

export function buildQuantStarterSnippet(
  presetId: QuantPresetId,
  symbol: string,
  timeframeId: ForexTimeframeId,
): string {
  const preset = findQuantPreset(presetId);
  const interval = toChartInterval(timeframeId);
  const dataUrl = datasetPath(symbol, timeframeId);

  const presetBlocks: Record<QuantPresetId, string> = {
    macdCrossover: `  await chart.addScript("MACD");

  const cross = structuredClone(chart.getScripts().CROSS);
  cross.inputs.LINE.value = getSeriesRef(chart, "MACDLine");
  cross.inputs.SIGNAL.value = getSeriesRef(chart, "MACDSignal");
  await chart.addScript("CROSS", cross);`,
    bollingerBreakout: `  await chart.addScript("BBAND");

  const exceed = structuredClone(chart.getScripts().EXCEED);
  const close = getSeriesRef(chart, "c");
  exceed.inputs.UPPER.value = getSeriesRef(chart, "BBUpper");
  exceed.inputs.LOWER.value = getSeriesRef(chart, "BBLower");
  exceed.inputs.HIGH.value = close;
  exceed.inputs.LOW.value = close;
  await chart.addScript("EXCEED", exceed);`,
    meanReversion: `  await chart.addScript("BBAND");

  const rebound = structuredClone(chart.getScripts().REBOUND);
  const close = getSeriesRef(chart, "c");
  rebound.inputs.UPPER.value = getSeriesRef(chart, "BBUpper");
  rebound.inputs.LOWER.value = getSeriesRef(chart, "BBLower");
  rebound.inputs.VALUE.value = close;
  await chart.addScript("REBOUND", rebound);`,
    emaSmaCross: `  const ema = structuredClone(chart.getScripts().EMA);
  ema.inputs.PERIODS.value = 12;
  await chart.addScript("EMA", ema);

  const sma = structuredClone(chart.getScripts().SMA);
  sma.inputs.PERIODS.value = 34;
  await chart.addScript("SMA", sma);

  const cross = structuredClone(chart.getScripts().CROSS);
  cross.inputs.LINE.value = getSeriesRef(chart, "EMA");
  cross.inputs.SIGNAL.value = getSeriesRef(chart, "SMAValue");
  cross.inputs.ONDN.value = "Buy";
  cross.inputs.ONUP.value = "Sell";
  await chart.addScript("CROSS", cross);`,
  };

  return `import { createChart } from "@efixdata/exeria-chart";

function getSeriesRef(chart, field) {
  const series = Object.values(chart.getSeriesManager()).find(
    (candidate) => candidate.seriesId && candidate.fields.includes(field),
  );
  return \`\${series.seriesId}:\${field}\`;
}

export async function mountQuantDashboard(container) {
  const chart = createChart({
    container,
    instrument: { symbol: "${symbol}", description: "${symbol}", tradable: true },
  });
  chart.init();

  const response = await fetch("${dataUrl}");
  const payload = await response.json();
  await chart.setMainSeriesData(payload.candles, "${interval}");

${presetBlocks[presetId]}

  const equity = structuredClone(chart.getScripts().EQUITY);
  equity.inputs.STRATEGY.value = getSeriesRef(chart, "${preset.strategyField}");
  equity.inputs.PRICE.value = getSeriesRef(chart, "c");
  equity.inputs.INITEQ.value = ${INITIAL_EQUITY};
  equity.inputs.CAPITAL.value = true;
  await chart.addScript("EQUITY", equity);

  await chart.recalculateScripts?.({ rerender: true });
  return chart;
}`;
}
