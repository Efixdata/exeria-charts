import type { Candle, ChartInstance } from "@efixdata/exeria-chart";

const OHLC_SAMPLE_SIZE = 48;
const MIN_MEANINGFUL_BODY_RATIO = 0.2;
const MIN_MEANINGFUL_BAR_SHARE = 0.35;

function isFinitePrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function candlesHaveConsistentScale(candles: Candle[]): boolean {
  if (candles.length < 3) {
    return true;
  }

  const history = candles.slice(0, -1);
  const last = candles[candles.length - 1]!;

  if (
    !isFinitePrice(last.c) ||
    !isFinitePrice(last.h) ||
    !isFinitePrice(last.l)
  ) {
    return true;
  }

  const historyCloses = history
    .map((candle) => candle.c)
    .filter((value): value is number => isFinitePrice(value));

  if (historyCloses.length === 0) {
    return true;
  }

  const historyMin = Math.min(...historyCloses);
  const historyMax = Math.max(...historyCloses);
  const historySpan = historyMax - historyMin;
  const lastGap = Math.max(
    Math.abs(last.c - historyMax),
    Math.abs(last.c - historyMin),
  );
  const lastRange = last.h - last.l;

  if (historySpan <= 0) {
    return lastGap <= Math.max(Math.abs(last.c) * 0.02, 1);
  }

  return lastGap <= historySpan * 2 && lastRange <= historySpan * 3;
}

export function candlesHaveMeaningfulOhlc(candles: Candle[]): boolean {
  if (candles.length === 0) {
    return false;
  }

  if (!candlesHaveConsistentScale(candles)) {
    return false;
  }

  const sample = candles.slice(-Math.min(OHLC_SAMPLE_SIZE, candles.length));
  let barsWithAllFields = 0;
  let meaningfulBars = 0;

  for (const candle of sample) {
    const { o, h, l, c } = candle;

    if (
      !isFinitePrice(o) ||
      !isFinitePrice(h) ||
      !isFinitePrice(l) ||
      !isFinitePrice(c)
    ) {
      continue;
    }

    barsWithAllFields += 1;

    const range = h - l;
    const body = Math.abs(c - o);

    if (range <= 0) {
      if (body > 0) {
        meaningfulBars += 1;
      }
      continue;
    }

    if (body / range >= MIN_MEANINGFUL_BODY_RATIO) {
      meaningfulBars += 1;
    }
  }

  if (barsWithAllFields === 0) {
    return false;
  }

  return meaningfulBars / barsWithAllFields >= MIN_MEANINGFUL_BAR_SHARE;
}

export function applyLineChartWithGradient(
  chart: ChartInstance,
  options?: {
    lineColor?: string;
    fillOpacity?: number;
  },
): void {
  chart.setMainDrawMode("Line");

  const appearance = chart.getChartAppearanceSettings();
  chart.applyChartAppearanceSettings({
    ...appearance,
    chartLineFillVisible: true,
    chartLineFillMode: "gradient",
    chartFillGradientOpacity: options?.fillOpacity ?? 0.28,
    ...(options?.lineColor
      ? {
          chartLineColor: options.lineColor,
          chartFillGradientColor: options.lineColor,
        }
      : {}),
  });
}

export function configureChartDrawModeForCandles(
  chart: ChartInstance,
  candles: Candle[],
  options?: {
    lineColor?: string;
    fillOpacity?: number;
  },
): void {
  if (candlesHaveMeaningfulOhlc(candles)) {
    chart.setMainDrawMode("OHLC");
    return;
  }

  applyLineChartWithGradient(chart, options);
}

type ChartRuntime = ChartInstance & {
  model?: {
    panels?: Array<{
      main?: boolean;
      basis?: number;
      _visible?: boolean;
      objects?: Array<{ hidden?: boolean }>;
    }>;
  };
};

export function hideChartVolume(chart: ChartInstance): void {
  const runtime = chart as ChartRuntime;
  const volume = chart.getChartVolumeSettings();

  if (volume.available) {
    chart.applyChartVolumeSettings({ ...volume, visible: false });
    if (volume.scriptId != null) {
      chart.setChartIndicatorVisibility(volume.scriptId, false);
    }
  }

  for (const panel of runtime.model?.panels ?? []) {
    if (!panel.main) {
      panel.basis = 0;
      panel._visible = false;
      for (const object of panel.objects ?? []) {
        object.hidden = true;
      }
    }
  }
}

export function extractLargestSeriesCandles(
  seriesManager: Record<string, { data?: Candle[] }> | null | undefined,
): Candle[] {
  if (!seriesManager) {
    return [];
  }

  let largest: Candle[] = [];

  for (const key in seriesManager) {
    const series = seriesManager[key];
    if (Array.isArray(series?.data) && series.data.length > largest.length) {
      largest = series.data;
    }
  }

  return largest;
}
