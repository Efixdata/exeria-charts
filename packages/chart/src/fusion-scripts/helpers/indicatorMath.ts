import type { CoreFusionStatic } from "../../internal-types/fusion";

type MovingAverageMethod = "EMA" | "MA" | "MMA";

function getMovingAverage(
  FUSION: CoreFusionStatic,
  method: MovingAverageMethod,
  series: any,
  index: number,
  period: number,
  outputSeries: any
) {
  if (method === "EMA") {
    return FUSION.lib.getEMA(series, index, period, outputSeries);
  }

  if (method === "MMA") {
    return FUSION.lib.getMMA(series, index, period, outputSeries);
  }

  return FUSION.lib.getMA(series, index, period);
}

export function updateAtrSeries(options: {
  FUSION: CoreFusionStatic;
  high: any;
  low: any;
  close: any;
  index: number;
  period: number;
  trueRangeSeries: any;
  atrSeries: any;
}) {
  const trueRange = options.FUSION.lib.getTrueRange(
    options.high,
    options.low,
    options.close,
    options.index
  );

  options.trueRangeSeries.setValue(options.index, trueRange);

  const atr = options.FUSION.lib.getMMA(
    options.trueRangeSeries,
    options.index,
    options.period,
    options.atrSeries
  );

  options.atrSeries.setValue(options.index, atr);

  return { atr, trueRange };
}

export function updateMacdSeries(options: {
  FUSION: CoreFusionStatic;
  source: any;
  index: number;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  fastSeries: any;
  slowSeries: any;
  signalAverageSeries: any;
  lineSeries: any;
  signalSeries: any;
  histogramSeries?: any;
  smoothing: Exclude<MovingAverageMethod, "MA">;
}) {
  const fastValue = getMovingAverage(
    options.FUSION,
    options.smoothing,
    options.source,
    options.index,
    options.fastPeriod,
    options.fastSeries
  );
  const slowValue = getMovingAverage(
    options.FUSION,
    options.smoothing,
    options.source,
    options.index,
    options.slowPeriod,
    options.slowSeries
  );

  options.fastSeries.setValue(options.index, fastValue);
  options.slowSeries.setValue(options.index, slowValue);

  if (fastValue === null || slowValue === null) {
    return;
  }

  const lineValue = fastValue - slowValue;
  options.lineSeries.setValue(options.index, lineValue);

  const signalValue = getMovingAverage(
    options.FUSION,
    options.smoothing,
    options.lineSeries,
    options.index,
    options.signalPeriod,
    options.signalAverageSeries
  );

  options.signalAverageSeries.setValue(options.index, signalValue);
  options.signalSeries.setValue(options.index, signalValue);

  if (options.histogramSeries) {
    options.histogramSeries.setValue(options.index, lineValue - Number(signalValue ?? 0));
  }
}

export function updateStochasticOscillator(options: {
  FUSION: CoreFusionStatic;
  high: any;
  low: any;
  close: any;
  index: number;
  period: number;
  kPeriod: number;
  dPeriod: number;
  kBaseSeries: any;
  kSeries: any;
  dSeries: any;
  highBaselineSeries: any;
  lowBaselineSeries: any;
  highBaselineValue: number;
  lowBaselineValue: number;
  smoothing: "MA" | "MMA";
}) {
  if (
    options.close.getValue(options.index) === null ||
    options.high.getValue(options.index) === null ||
    options.low.getValue(options.index) === null
  ) {
    return;
  }

  options.highBaselineSeries.setValue(options.index, options.highBaselineValue);
  options.lowBaselineSeries.setValue(options.index, options.lowBaselineValue);

  const lowValue = options.FUSION.lib.getMin(options.low, options.index, options.period);
  const highValue = options.FUSION.lib.getMax(options.high, options.index, options.period);
  const range = highValue - lowValue;

  let rawK = 0;

  if (range > 0) {
    rawK = (100 * (options.close.getValue(options.index) - lowValue)) / range;
  }

  options.kBaseSeries.setValue(options.index, rawK);

  const kValue = getMovingAverage(
    options.FUSION,
    options.smoothing,
    options.kBaseSeries,
    options.index,
    options.kPeriod,
    options.kSeries
  );
  options.kSeries.setValue(options.index, kValue);

  const dValue = getMovingAverage(
    options.FUSION,
    options.smoothing,
    options.kSeries,
    options.index,
    options.dPeriod,
    options.dSeries
  );
  options.dSeries.setValue(options.index, dValue);
}