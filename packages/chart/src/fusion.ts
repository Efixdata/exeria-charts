import WEBRCP from "./WebRCP";
import {
  getFusionServices,
  requireFusionServices,
} from "./adapters/fusionServices";
import { createFusionIndicatorScripts } from "./fusion-scripts/indicators";
import { createFusionStrategyScripts } from "./fusion-scripts/strategies";
import { createFusionFunctionScripts } from "./fusion-scripts/functions";
import { createFusionHiddenScripts } from "./fusion-scripts/hidden";
import type { Instrument, Interval } from "./types";
import type { FusionServicesAdapter } from "./adapters/fusionServices";
import type {
  CoreFusionBuilder,
  CoreFusionLoader,
  CoreFusionRuntime,
  CoreFusionStatic,
  FusionIntervalRuntime,
  FusionInstrumentRuntime,
  FusionLoadCache,
  FusionLoadResponse,
  FusionLoaderError,
  FusionLoaderSuccess,
  FusionModelRuntime,
  FusionPanelRuntime,
  FusionRawSeriesWrapper,
  FusionRecord,
  FusionSeriesData,
  FusionSeriesWrapper,
  FusionTooltipStore,
  FusionTooltipSeriesWrapper,
} from "./internal-types/fusion";
import type {
  FusionScriptControllerRuntime,
  FusionSignalMatrix,
  RuntimeScriptConfig,
  RuntimeScriptDefinition,
} from "./internal-types/scripts";
import type { FusionSeriesRuntime } from "./internal-types/series";
import type { UnknownFn } from "./internal-types/shared";

type FusionInterval = FusionIntervalRuntime & {
  symbol: string;
  milis?: number;
};

type FusionInstrument = FusionInstrumentRuntime & {
  id: string | number;
  symbol: string;
};

type MainFusionSeries = ReturnType<CoreFusionRuntime["getMainSeries"]>;

type LoadedFusionResponse = Omit<FusionLoadResponse, "candles" | "instrument" | "interval"> & {
  candles: FusionSeriesData;
  instrument: FusionInstrument;
  interval: FusionInterval;
};

type FusionHistoryResponseMap = Record<string, LoadedFusionResponse>;

type IntervalDelta = {
  index: number;
  value: number;
};

type FusionServices = FusionServicesAdapter<FusionInstrument, LoadedFusionResponse>;

type FusionStaticConstants = {
  DEBUG: boolean;
  MIN_VALUE: number;
  MAX_VALUE: number;
  BUY: number;
  SELL: number;
  EXIT_LONG: number;
  EXIT_SHORT: number;
  EXIT_ALL: number;
  DO_NOTHING: number;
};

type FusionBootstrapStatic = Pick<CoreFusionStatic, "lib" | "scripts" | "signals"> &
  FusionStaticConstants;

type MutableFusionStatic = CoreFusionStatic & FusionStaticConstants;

const FUSION_SIGNAL_VALUES = {
  BUY: 1,
  SELL: -1,
  EXIT_LONG: 2,
  EXIT_SHORT: -2,
  EXIT_ALL: -3,
  DO_NOTHING: 0,
} as const;

function getServices(): FusionServices | null {
  return getFusionServices<FusionInstrument, LoadedFusionResponse>();
}

function requireServices(): FusionServices {
  return requireFusionServices<FusionInstrument, LoadedFusionResponse>();
}

function toChartInstrument(instrument: FusionInstrument | undefined): Instrument | undefined {
  if (!instrument) return undefined;
  return {
    ...instrument,
    id: instrument.id != null ? String(instrument.id) : undefined,
  };
}

function toChartInterval(interval: FusionInterval): Interval {
  return {
    ...interval,
    symbol: interval.symbol,
    milis: interval.milis ?? 0,
  };
}

function getTooltipMap(tooltips: FusionTooltipStore | undefined): Record<string, unknown> {
  if (!tooltips || Array.isArray(tooltips)) return {};
  return tooltips;
}

function isLoadedFusionResponse(
  data: LoadedFusionResponse | FusionHistoryResponseMap,
): data is LoadedFusionResponse {
  return "candles" in data && "instrument" in data && "interval" in data;
}

const fusionBootstrap: FusionBootstrapStatic = {
  scripts: {},
  lib: {},
  DEBUG: false,
  MIN_VALUE: -Number.MAX_VALUE,
  MAX_VALUE: Number.MAX_VALUE,
  ...FUSION_SIGNAL_VALUES,
  signals: {
    Buy: FUSION_SIGNAL_VALUES.BUY,
    Sell: FUSION_SIGNAL_VALUES.SELL,
    "Exit long": FUSION_SIGNAL_VALUES.EXIT_LONG,
    "Exit short": FUSION_SIGNAL_VALUES.EXIT_SHORT,
    "Exit all": FUSION_SIGNAL_VALUES.EXIT_ALL,
    "Do nothing": FUSION_SIGNAL_VALUES.DO_NOTHING,
  },
};

const FUSION: MutableFusionStatic = fusionBootstrap as unknown as MutableFusionStatic;

/**
 * @memberOf FUSION
 */
class FusionMatrix implements FusionSignalMatrix {
  [key: string]: Record<string, string>;

  constructor() {
    this["Buy"] = {
      Buy: "Buy",
      Sell: "Do nothing",
      "Exit long": "Exit long",
      "Exit short": "Exit short",
      "Exit all": "Exit all",
      "Do nothing": "Buy",
    };

    this["Sell"] = {
      Buy: "Do nothing",
      Sell: "Sell",
      "Exit long": "Exit long",
      "Exit short": "Exit short",
      "Exit all": "Exit all",
      "Do nothing": "Sell",
    };

    this["Exit long"] = {
      Buy: "Exit long",
      Sell: "Exit long",
      "Exit long": "Exit long",
      "Exit short": "Exit all",
      "Exit all": "Exit all",
      "Do nothing": "Exit long",
    };

    this["Exit short"] = {
      Buy: "Exit short",
      Sell: "Exit short",
      "Exit long": "Exit all",
      "Exit short": "Exit short",
      "Exit all": "Exit all",
      "Do nothing": "Exit short",
    };

    this["Exit all"] = {
      Buy: "Exit all",
      Sell: "Exit all",
      "Exit long": "Exit all",
      "Exit short": "Exit all",
      "Exit all": "Exit all",
      "Do nothing": "Exit all",
    };

    this["Do nothing"] = {
      Buy: "Buy",
      Sell: "Sell",
      "Exit long": "Exit long",
      "Exit short": "Exit short",
      "Exit all": "Exit all",
      "Do nothing": "Do nothing",
    };
  }
}

FUSION.Matrix = FusionMatrix;

FUSION.signalValueToName = function (value) {
  for (var property in FUSION.signals) {
    if (FUSION.signals.hasOwnProperty(property)) {
      if (FUSION.signals[property] == value) return property;
    }
  }
  return undefined;
};

FUSION.signalNameToValue = function (name) {
  return FUSION.signals[name];
};

FUSION.createDoubleCheckMatrix = function () {
  var matrix = new FUSION.Matrix();
  for (var r in matrix) {
    if (matrix.hasOwnProperty(r)) {
      var row = matrix[r];
      for (var c in row) {
        if (row.hasOwnProperty(c)) {
          if (r !== c) matrix[r][c] = "Do nothing";
        }
      }
    }
  }
  return matrix;
};

FUSION.createSelectiveSignalsMatrix = function () {
  var matrix = new FUSION.Matrix();
  for (var r in matrix) {
    if (matrix.hasOwnProperty(r)) {
      var row = matrix[r];
      for (var c in row) {
        if (row.hasOwnProperty(c)) {
          if (r == "Do nothing") matrix[r][c] = "Do nothing";
          if (c == "Do nothing") matrix[r][c] = "Do nothing";
        }
      }
    }
  }
  return matrix;
};

FUSION.uniqueId = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    new Date().getTime() +
    "@" +
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
};

FUSION.getAvailableScript = function (key) {
  const services = getServices();
  if (!services) return FUSION.scripts[key];
  else if (!FUSION.scripts[key].subscriptionPack) return FUSION.scripts[key];
  else if (services.payments.isSubscriptionPackEnabled(FUSION.scripts[key].subscriptionPack))
    return FUSION.scripts[key];
  else return null;
};

FUSION.getScript = function (key) {
  return FUSION.scripts[key];
};

FUSION.getAvailableScripts = function () {
  const services = getServices();
  const availableScripts =
    FUSION.availableScripts ??
    (FUSION.availableScripts = JSON.parse(JSON.stringify(FUSION.scripts)));

  const keys = Object.keys(availableScripts);

  for (let key of keys) {
    const script = availableScripts[key];

    if (
      !services ||
      (script.subscriptionPack && !services.payments.isSubscriptionPackEnabled(script.subscriptionPack))
    ) {
      delete availableScripts[key];
    }
  }

  return availableScripts;
};

FUSION.getAllScripts = function () {
  if (WEBRCP && WEBRCP.platformManifest && WEBRCP.platformManifest.isWidget)
    return FUSION.getFreeScripts();
  return FUSION.scripts;
};

FUSION.getFreeScripts = function () {
  const freeScripts =
    FUSION.freeScripts ?? (FUSION.freeScripts = JSON.parse(JSON.stringify(FUSION.scripts)));

  const keys = Object.keys(freeScripts);

  for (let key of keys) {
    const script = freeScripts[key];

    if (script.subscriptionPack) {
      delete freeScripts[key];
    }
  }

  return freeScripts;
};

const indicatorScripts = createFusionIndicatorScripts(FUSION);
const strategyScripts = createFusionStrategyScripts(FUSION);
const functionScripts = createFusionFunctionScripts(FUSION);
const hiddenScripts = createFusionHiddenScripts(FUSION);

Object.assign(FUSION.scripts, indicatorScripts, functionScripts, strategyScripts, hiddenScripts);

/*
 * FUSION LIB - basic fusion functions
 */
FUSION.lib.getConditionalInputValue = function (input, index) {
  if (input["type"] && input["type"] == "double") {
    //double
    return parseFloat(input["value"]);
  } //series
  else return input.getValue(index);
};

FUSION.lib.getPercentageROC = function (index, series, periods) {
  var dis = FUSION.lib.displace(series, index, periods);

  if (dis === null) return null;
  return ((series.getValue(index) - dis) / dis) * 100;
};

FUSION.lib.calculateRSI = function (
  index,
  closeSeries,
  rsiSeries,
  auSeries,
  adSeries,
  mauSeries,
  madSeries,
  upperBandValue,
  lowerBandValue,
  rsiPeriods
) {
  auSeries.setValue(index, 0);
  adSeries.setValue(index, 0);
  mauSeries.setValue(index, 0);
  madSeries.setValue(index, 0);

  var close = closeSeries.getValue(index);
  var lastClose = closeSeries.getValue(index - 1);

  if (index < rsiPeriods) return;
  if (close === null || lastClose === null) return;

  var diff = close - lastClose;

  if (diff > 0) {
    auSeries.setValue(index, diff);
    adSeries.setValue(index, 0);
  } else {
    auSeries.setValue(index, 0);
    adSeries.setValue(index, -diff);
  }

  var mmaAU = FUSION.lib.getMMA(auSeries, index, rsiPeriods, mauSeries);
  var mmaAD = FUSION.lib.getMMA(adSeries, index, rsiPeriods, madSeries);
  mauSeries.setValue(index, mmaAU);
  madSeries.setValue(index, mmaAD);

  if (mmaAU === null || mmaAD === null) return;

  if (mmaAU + mmaAD == 0) {
    rsiSeries.setValue(index, lowerBandValue + (upperBandValue - lowerBandValue) / 2);
  } else {
    rsiSeries.setValue(index, (100 * mmaAU) / (mmaAU + mmaAD));
  }
};

FUSION.lib.getSum = function (series, index, periods, sumSeries) {
  var sum = 0;

  if (sumSeries) {
    sum = sumSeries.getValue(index - 1) + series.getValue(index) - series.getValue(index - periods);
  } else {
    for (var i = index; i > index - periods; --i) {
      sum += series.getValue(index);
    }
  }

  return sum;
};

FUSION.lib.getBestMatchingInterval = function (originalInterval, availableIntervals) {
  if (availableIntervals.length === 0) throw new Error("No intervals available for the instrument");
  if (!originalInterval) return availableIntervals[0];

  const bestDelta = availableIntervals
    .filter((interval: FusionIntervalRuntime) => typeof interval.milis === "number" && interval.milis > 0)
    .map((interval: FusionIntervalRuntime, index: number): IntervalDelta => {
      return {
        index: index,
        value: Math.abs((originalInterval.milis || 0) - (interval.milis || 0)),
      };
    })
    .sort((deltaA: IntervalDelta, deltaB: IntervalDelta) => deltaA.value - deltaB.value)
    .slice(0, 1);
  return availableIntervals[bestDelta[0].index];
};

FUSION.lib.getForecastAverage = function (
  series,
  returnRate,
  idx,
  periods,
  prognosisPeriods,
  probability
) {
  var upperSum = 0;
  var lowerSum = 0;
  var num = 0;
  var iteration = 0;
  var emptyValues = {
    upper: null,
    lower: null,
  };

  for (var i = prognosisPeriods; i > 0; --i) {
    iteration++;
    if (iteration % 10 !== 0) continue;
    if (idx - i >= series.getSeriesLength()) {
      break;
    }
    num += 1;

    var average = FUSION.lib.getMA(returnRate, idx - i, periods);
    var standardDeviation = FUSION.lib.getStdDev(returnRate, idx - i, periods);
    var valueAtRisk = FUSION.lib.inverseNormalDistribution(probability, average, standardDeviation);
    var valueAtRiskValue = valueAtRisk * Math.sqrt(i) * series.getValue(idx);
    if (
      average === null ||
      standardDeviation === null ||
      valueAtRisk === null ||
      series.getValue(idx) === null ||
      series.getValue(idx - i) === null
    )
      return emptyValues;

    upperSum += series.getValue(idx - i) - valueAtRiskValue;
    lowerSum += series.getValue(idx - i) + valueAtRiskValue;
  }

  return {
    upper: upperSum / num,
    lower: lowerSum / num,
  };
};

FUSION.lib.getReturnRate = function (series, index) {
  if (series.getValue(index) === null || series.getValue(index - 1) === null) return null;
  if (series.getValue(index - 1) === null && series.getValue(index) !== null)
    return series.getValue(index);

  return (series.getValue(index) - series.getValue(index - 1)) / series.getValue(index - 1);
};

FUSION.lib.inverseNormalDistribution = function (p, mean, std) {
  function erfcinv(p: number) {
    var j = 0;
    var x, err, t, pp;
    if (p >= 2) return -100;
    if (p <= 0) return 100;
    pp = p < 1 ? p : 2 - p;
    t = Math.sqrt(-2 * Math.log(pp / 2));
    x = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
    for (; j < 2; j++) {
      err = erfc(x) - pp;
      x += err / ((2 / Math.sqrt(Math.PI)) * Math.exp(-x * x) - x * err);
    }
    return p < 1 ? x : -x;
  }

  function erfc(x: number) {
    return 1 - erf(x);
  }

  function erf(x: number) {
    var cof = [
      -1.3026537197817094, 6.419697923564903e-1, 1.9476473204185836e-2, -9.561514786808631e-3,
      -9.46595344482036e-4, 3.66839497852761e-4, 4.2523324806907e-5, -2.0278578112534e-5,
      -1.624290004647e-6, 1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
      5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11, 2.394038e-12, -6.886027e-12,
      8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15, -1.523e-15, -9.4e-17, 1.21e-16,
      -2.8e-17,
    ];
    var j = cof.length - 1;
    var isneg = false;
    var d = 0;
    var dd = 0;
    var t, ty, tmp, res;

    if (x < 0) {
      x = -x;
      isneg = true;
    }

    t = 2 / (2 + x);
    ty = 4 * t - 2;

    for (; j > 0; j--) {
      tmp = d;
      d = ty * d - dd + cof[j];
      dd = tmp;
    }

    res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
    return isneg ? res - 1 : 1 - res;
  }

  return -Math.SQRT2 * std * erfcinv(2 * p) + mean;
};

FUSION.lib.isHighBar = function (series, idx, prd) {
  var high = series.getValue(idx);
  for (var i = idx - prd; i < idx; ++i) {
    if (series.getValue(i) === null || series.getValue(i) >= high) return false;
  }

  for (i = idx + 1; i <= idx + prd; ++i) {
    if (series.getValue(i) === null || series.getValue(i) >= high) return false;
  }

  return true;
};

FUSION.lib.isLowBar = function (series, idx, prd) {
  var low = series.getValue(idx);
  for (var i = idx - prd; i < idx; ++i) {
    if (series.getValue(i) === null || series.getValue(i) <= low) return false;
  }

  for (i = idx + 1; i <= idx + prd; ++i) {
    if (series.getValue(i) === null || series.getValue(i) <= low) return false;
  }

  return true;
};

FUSION.lib.getMA = function (series, idx, prd) {
  if (idx < prd - 1) {
    return null;
  } else {
    var movAvg = 0;
    for (var j = idx - prd + 1; j < idx + 1; j++) {
      if (series.getValue(j) === null) return null;
      movAvg = movAvg + series.getValue(j);
    }
    movAvg = movAvg / prd;

    return movAvg;
  }
};

FUSION.lib.getWMA = function (series, idx, pds) {
  if (idx < pds - 1) {
    return null;
  } else {
    var sum = 0;
    var wsum = 0;

    for (var j = 0; j < pds; j++) {
      if (series.getValue(idx - j) === null) return null;
      sum += series.getValue(idx - j) * (pds - j);
      wsum += j + 1;
    }
    return sum / wsum;
  }
};

FUSION.lib.getMMA = function (series, idx, pds, prev) {
  if (idx < pds - 1) {
    return null;
  } else if (prev.getValue(idx - 1) === null) {
    return FUSION.lib.getMA(series, idx, Math.ceil(pds));
  } else if (series.getValue(idx) === null) {
    return null;
  } else {
    var mma = 0;
    mma = prev.getValue(idx - 1) + (series.getValue(idx) - prev.getValue(idx - 1)) / pds;
    return mma;
  }
};

FUSION.lib.getEMA = function (series, idx, pds, prev) {
  if (idx < pds - 1 || series.getValue(idx) === null) {
    return null;
  } else if (prev.getValue(idx - 1) === null) {
    return FUSION.lib.getMA(series, idx, pds);
  } else {
    var alfa = 2 / (pds + 1);
    var value = series.getValue(idx);
    var yesterday = prev.getValue(idx - 1);
    var a = alfa * value + (1 - alfa) * yesterday;
    return a;
  }
};

FUSION.lib.getMin = function (series, idx, pds) {
  if (idx < pds - 1) {
    return null;
  }
  var min = FUSION.MAX_VALUE;
  for (var i = 0; i < pds; i++) {
    if (series.getValue(idx - pds + 1 + i) === null) return null;
    if (series.getValue(idx - pds + 1 + i) < min) min = series.getValue(idx - pds + 1 + i);
  }
  if (min === FUSION.MAX_VALUE) return null;
  return min;
};

FUSION.lib.getMinIndex = function (series, idx, pds) {
  if (idx < pds - 1) {
    return null;
  }
  var min = FUSION.MAX_VALUE;
  var minIndex = 0;

  for (var i = 0; i < pds; i++) {
    if (series.getValue(idx - pds + 1 + i) === null) return null;
    if (series.getValue(idx - pds + 1 + i) < min) {
      min = series.getValue(idx - pds + 1 + i);
      minIndex = idx - pds + 1 + i;
    }
  }
  if (min === FUSION.MAX_VALUE) return null;
  return minIndex;
};

FUSION.lib.getMax = function (series, idx, pds) {
  if (idx < pds - 1) {
    return null;
  }
  var max = FUSION.MIN_VALUE;
  for (var i = 0; i < pds; i++) {
    if (series.getValue(idx - pds + 1 + i) === null) return null;
    if (series.getValue(idx - pds + 1 + i) > max) max = series.getValue(idx - pds + 1 + i);
  }
  if (max === FUSION.MIN_VALUE) return null;
  return max;
};

FUSION.lib.getMaxIndex = function (series, idx, pds) {
  if (idx < pds - 1) {
    return null;
  }
  var max = FUSION.MIN_VALUE;
  var maxIndex = 0;
  for (var i = 0; i < pds; i++) {
    if (series.getValue(idx - pds + 1 + i) === null) return null;
    if (series.getValue(idx - pds + 1 + i) > max) {
      max = series.getValue(idx - pds + 1 + i);
      maxIndex = idx - pds + 1 + i;
    }
  }
  if (max === FUSION.MIN_VALUE) return null;
  return maxIndex;
};

FUSION.lib.getStdDev = function (series, idx, prd) {
  if (idx < prd - 1) {
    return null;
  }

  var movStdDev = 0;
  var mean = 0;

  for (var i = idx - prd + 1; i < idx + 1; i++) {
    if (series.getValue(i) === null) return null;
    mean = mean + series.getValue(i);
  }
  mean = mean / prd;

  for (var i = idx - prd + 1; i < idx + 1; i++) {
    var toSqrt = series.getValue(i) - mean;
    movStdDev = movStdDev + toSqrt * toSqrt;
  }

  movStdDev = movStdDev / prd;
  movStdDev = Math.sqrt(movStdDev);

  return movStdDev;
};
FUSION.lib.getTrueRange = function (high, low, close, idx) {
  if (
    idx === 0 ||
    high.getValue(idx) === null ||
    low.getValue(idx) === null ||
    close.getValue(idx - 1) === null
  ) {
    return null;
  }

  var hml = high.getValue(idx) - low.getValue(idx);
  var hmc = high.getValue(idx) - close.getValue(idx - 1);
  var cml = close.getValue(idx - 1) - low.getValue(idx);

  var ret = hml;
  if (hmc > ret) ret = hmc;
  if (cml > ret) ret = cml;

  return ret;
};
FUSION.lib.getTrueLow = function (close, low, idx) {
  if (idx === 0 || low.getValue(idx) === null || close.getValue(idx - 1) === null) {
    return null;
  }
  var tl = close.getValue(idx - 1);
  if (tl > low.getValue(idx)) tl = low.getValue(idx);
  return tl;
};

FUSION.lib.displace = function (source, idx, pds) {
  var i = idx - pds;
  if (i < 0) {
    return null; //source.getValue(0);
  } else if (i > source.getSeriesLength() - 1) {
    return null; //source.getValue(source.getSeriesLength() - 1);
  } else {
    return source.getValue(i);
  }
};

FUSION.lib.getLarge = function (series, index, period, n) {
  var values = [];
  var from = index - period;
  if (from < 0) from = 0;

  for (var i = index; i > from; --i) {
    if (series.getValue(i) !== null) {
      values.push(series.getValue(i));
    }
  }

  values.sort(function (a, b) {
    return b - a;
  });

  if (n >= values.length) n = values.length - 1;
  return values[n];
};

FUSION.lib.getSmall = function (series, index, period, n) {
  var values = [];
  var from = index - period;
  if (from < 0) from = 0;

  for (var i = index; i > from; --i) {
    if (series.getValue(i) !== null) {
      values.push(series.getValue(i));
    }
  }

  values.sort(function (a, b) {
    return a - b;
  });

  if (n >= values.length) n = values.length - 1;
  return values[n];
};

/*
 * ENGINE
 */

class FusionEngine implements CoreFusionRuntime {
  [key: string]: any;

  model = {
    id: FUSION.uniqueId(),
    instrumentsSeries: [],
    scripts: [],
  } as FusionModelRuntime;
  seriesManager = {} as Record<string, FusionSeriesRuntime>;
  scriptsManager = {} as Record<string, FusionScriptControllerRuntime>;

  private readonly positionsSeriesId = "POSITIONS";

  createSeries(fields: string[]) {
    var series: FusionSeriesData = [];
    const mainSeries = this.getMainSeries();
    const mainSeriesData = (mainSeries && mainSeries.data ? mainSeries.data : []) as FusionSeriesData;
    if (mainSeriesData) {
      for (var i = 0; i < mainSeriesData.length; i++) {
        series[i] = {};
        series[i]["stamp"] = mainSeriesData[i].stamp;
        series[i]["strength"] = 1.0;
        for (var j = 0; j < fields.length; j++) {
          series[i][fields[j]] = null;
        }
      }
    }
    return series;
  }

  createTooltipSeries(fields: string[]) {
    var series = this.createSeries(fields);
    for (var i = 0; i < series.length; i++) {
      series[i].tooltips = {};
    }
    return series;
  }

  configureScripts() {
    for (var i = 0; i < this.model.scripts.length; i++) {
      this.configureScript(this.model.scripts[i] as RuntimeScriptConfig);
    }
  }

  configureScript(scriptModel: RuntimeScriptConfig) {
    var self = this;
    var scriptProto = FUSION.scripts[scriptModel.key] as RuntimeScriptDefinition | undefined;
    if (scriptProto == null || !scriptProto.controller) return;

    scriptModel.scriptType = scriptProto.type;

    var wrappers: Record<string, unknown> = {};

    for (var key in scriptModel.inputs) {
      if (scriptProto.inputs[key]) {
        if (scriptProto.inputs[key].type == "series") {
          wrappers[key] = this.getSeriesWrapper(scriptModel.inputs[key]);
          if (!scriptModel.reference && scriptModel.scriptType != "strategies")
            scriptModel.reference = scriptModel.inputs[key];
        } else if (
          scriptProto.inputs[key].type == "conditional" &&
          scriptModel.inputs[key]["type"] == "series"
        ) {
          wrappers[key] = this.getSeriesWrapper(scriptModel.inputs[key]["value"]);
        } else if (scriptProto.inputs[key].type == "object") {
          const objectInput = scriptModel.inputs[key] as FusionRecord;
          objectInput.isIndicator = true;
          wrappers[key] = objectInput;
        } else {
          wrappers[key] = scriptModel.inputs[key];
        }
      }
    }

    function initializeSeries(series: FusionSeriesRuntime) {
      series.userName = scriptModel.userName;
      if (scriptModel.inputs["OBJECT"] && scriptModel.inputs["OBJECT"].userName) {
        series.userName = scriptModel.inputs["OBJECT"].userName;
      }
      series.seriesId = scriptModel.outputs[key];
      self.seriesManager[series.seriesId] = series;
    }

    for (var key in scriptModel.outputs) {
      var type = scriptProto.outputs[key].type;
      if (type === "series") {
        var series: FusionSeriesRuntime = JSON.parse(JSON.stringify(scriptProto.outputs[key].series));
        series.data = this.createSeries(series.fields);
        initializeSeries(series);

        for (var i = 0; i < series.fields.length; i++) {
          wrappers[series.fields[i]] = this.getSeriesWrapper(series.seriesId + ":" + series.fields[i]);
        }
      } else if (type === "tooltipSeries") {
        var series: FusionSeriesRuntime = JSON.parse(JSON.stringify(scriptProto.outputs[key].series));
        series.data = this.createTooltipSeries(series.fields);
        initializeSeries(series);
        for (var i = 0; i < series.fields.length; i++) {
          wrappers[series.fields[i]] = this.getTooltipSeriesWrapper(
            series.seriesId + ":" + series.fields[i],
          );
        }
      }
    }

    var scriptController = scriptProto.controller(this, scriptModel.inputs, scriptModel.outputs);
    scriptController.id = scriptModel.id;
    for (var key in wrappers) {
      scriptController[key] = wrappers[key];
    }
    this.scriptsManager[String(scriptModel.id)] = scriptController;
  }

  getSeriesWrapper(seriesLink: string) {
    var spl = seriesLink.split(":");
    var self = this;

    var wrapper: FusionSeriesWrapper = {
      getValue: function (index: number) {
        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        if (index < 0) return null;
        if (index >= data.length) return null;
        return data[index][spl[1]];
      },
      setValue: function (index: number, value: unknown) {
        function pushEmptyValues(number: number) {
          const data = self.seriesManager[spl[0]].data as FusionSeriesData;
          var lastValue = JSON.parse(JSON.stringify(data[data.length - 1]));
          const mainSeries = self.getMainSeries();
          let milis = 1;
          if (
            mainSeries &&
            mainSeries.interval &&
            mainSeries.interval.milis &&
            mainSeries.interval.milis > 0
          ) {
            milis = mainSeries.interval.milis;
          }

          for (let i = 0; i < number; ++i) {
            const value = {
              stamp: lastValue.stamp + (i + 1) * milis,
            };

            data.push(value);
          }
        }

        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        const lastIndex = data.length - 1;
        if (index > lastIndex) pushEmptyValues(index - lastIndex);

        data[index][spl[1]] = value;
      },
      getStrength: function (index: number) {
        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        if (index < 0) return undefined;
        return data[index]["strength"];
      },
      setStrength: function (index: number, value: unknown) {
        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        data[index]["strength"] = value;
      },
      getSeriesLength: function () {
        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        return data.length;
      },
      getStamp: function (index: number) {
        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        if (index < 0) return undefined;
        return data[index].stamp;
      },
      getSeriesId: function () {
        return self.seriesManager[spl[0]].seriesId;
      },
    };

    return wrapper;
  }

  getTooltipSeriesWrapper(seriesLink: string) {
    var self = this;
    var spl = seriesLink.split(":");
    var wrapper = this.getSeriesWrapper(seriesLink) as FusionTooltipSeriesWrapper;
    var series = self.seriesManager[spl[0]].data as FusionSeriesData;

    function pushEmptyValues(number: number) {
      var lastValue = JSON.parse(JSON.stringify(series[series.length - 1]));
      const mainSeries = self.getMainSeries();
      let milis = 1;
      if (
        mainSeries &&
        mainSeries.interval &&
        mainSeries.interval.milis &&
        mainSeries.interval.milis > 0
      ) {
        milis = mainSeries.interval.milis;
      }

      for (let i = 0; i < number; ++i) {
        const value = {
          stamp: lastValue.stamp + (i + 1) * milis,
          strength: 1,
          tooltips: [],
        };
        series.push(value);
      }
    }

    wrapper.clearTooltips = function (index: number) {
      const lastIndex = series.length - 1;
      if (index > lastIndex) pushEmptyValues(index - lastIndex);
      series[index].tooltips = [];
    };

    wrapper.setTooltip = function (index: number, key: string, value: unknown) {
      const lastIndex = series.length - 1;
      if (index > lastIndex) pushEmptyValues(index - lastIndex);
      const tooltips = getTooltipMap(series[index].tooltips);
      tooltips[key] = value;
      series[index].tooltips = tooltips;
    };

    wrapper.getTooltip = function (index: number, key: string) {
      if (index < 0) return null;
      if (index > series.length - 1) return null;
      const tooltips = getTooltipMap(series[index].tooltips);
      return tooltips[key];
    };

    return wrapper;
  }

  getRawSeriesWrapper(series: FusionSeriesData, field: string) {
    var self = this;

    var wrapper: FusionRawSeriesWrapper = {
      getValue: function (index: number) {
        if (index < 0) return null;
        if (index > series.length - 1) return null;
        return series[index][field];
      },
      setValue: function (index: number, value: unknown) {
        function pushEmptyValues(number: number) {
          var lastValue = JSON.parse(JSON.stringify(series[series.length - 1]));
          const mainSeries = self.getMainSeries();
          let milis = 1;
          if (
            mainSeries &&
            mainSeries.interval &&
            mainSeries.interval.milis &&
            mainSeries.interval.milis > 0
          ) {
            milis = mainSeries.interval.milis;
          }

          for (let i = 0; i < number; ++i) {
            const value = {
              stamp: lastValue.stamp + (i + 1) * milis,
            };
            series.push(value);
          }
        }
        if (index < 0) return;

        var lastIndex = series.length - 1;
        if (index > lastIndex) pushEmptyValues(index - lastIndex);

        series[index][field] = value;
      },
      getStamp: function (index: number) {
        return series[index].stamp;
      },
      getSeriesLength: function () {
        return series.length;
      },
      getSeriesId: function () {
        return series.seriesId;
      },
    };

    return wrapper;
  }

  getId() {
    return this.model.id;
  }

  getModel() {
    return this.model;
  }

  getValue(series: string, i: number, field?: string) {
    if (field) return this.seriesManager[series].data[i][field];

    var spl = series.split(":");
    return this.seriesManager[spl[0]].data[i][spl[1]];
  }

  setValue(series: string, i: number, value: unknown, field?: string) {
    if (field) this.seriesManager[series].data[i][field] = value;

    var spl = series.split(":");
    this.seriesManager[spl[0]].data[i][spl[1]] = value;
  }

  initAll() {
    for (var key in this.model.scripts) {
      const scriptConfig = this.model.scripts[key] as RuntimeScriptConfig;
      this.scriptsManager[String(scriptConfig.id)].init();
    }
  }

  shortSynchronization() {
    var seriesManager = this.getSeriesManager();
    var longest = null;
    for (var key in seriesManager) {
      if (seriesManager.hasOwnProperty(key) && seriesManager[key].instrument) {
        if (!longest || seriesManager[key].data.length > longest.data.length) {
          longest = seriesManager[key];
        }
      }
    }
    if (!longest) return;
    for (var key in seriesManager) {
      if (
        seriesManager.hasOwnProperty(key) &&
        seriesManager[key].data &&
        seriesManager[key].data.length > 0
      ) {
        while (seriesManager[key].data.length < longest.data.length) {
          var last = seriesManager[key].data[seriesManager[key].data.length - 1];
          var next = JSON.parse(JSON.stringify(last));
          if (next["c"] != null && next["c"] != undefined) {
            next["o"] = next["c"];
            next["h"] = next["c"];
            next["l"] = next["c"];
            next["v"] = null;
            next["i"] = null;
          }

          next.stamp = longest.data[seriesManager[key].data.length].stamp;
          seriesManager[key].data.push(next);
        }
      }
    }
  }

  fullSynchronization() {
    var model = this.model;
    var seriesManager = this.getSeriesManager();

    if (model.instrumentsSeries.length < 1) return;
    if (!this.isLoaded()) {
      throw "Can't synchronize unloaded series! Load it first!";
    }

    var l = 1;
    var stampIndex: Record<string, FusionRecord> = {};
    var stamps: Record<string, number> = {};

    for (var s in model.instrumentsSeries) {
      var id = model.instrumentsSeries[s].seriesId;
      var series = seriesManager[id];
      if (!series || !series.data) continue;
      model.instrumentsSeries[s].instrument = JSON.parse(JSON.stringify(series.instrument));
      const seriesData = series.data as FusionSeriesData;
      if (seriesData.length > l) l = seriesData.length;

      stampIndex[id] = {};
      for (var idx in seriesData) {
        const stamp = seriesData[idx].stamp;
        if (typeof stamp !== "number") continue;
        stampIndex[id][stamp] = idx;
        stamps[stamp] = stamp;
      }
    }

    var stampsArray = Object.keys(stamps).sort(function (a: string, b: string) {
      var n1 = parseInt(a);
      var n2 = parseInt(b);
      return n1 - n2;
    });

    let lastValue: Record<string, FusionRecord> = {};

    for (var index = 0; index < stampsArray.length; index++) {
      const stamp = stampsArray[index];
      const numericStamp = Number(stamp);

      for (var s in model.instrumentsSeries) {
        const id = model.instrumentsSeries[s].seriesId;
        const series = seriesManager[id];
        if (!series || !series.data) continue;
        const seriesData = series.data as FusionSeriesData;

        if (seriesData.length === 0) continue;

        const value = seriesData[index];
        const isValueMissing = !value || !value.stamp || value.stamp != numericStamp;
        const isValueEmpty = value && !value.o;

        if (!isValueMissing && !isValueEmpty) {
          lastValue[id] = seriesData[index];
          continue;
        }

        const candle: FusionRecord = lastValue[id]
          ? {
              c: lastValue[id].c,
              h: lastValue[id].c,
              l: lastValue[id].c,
              o: lastValue[id].c,
              stamp: numericStamp,
              v: null,
              i: null,
            }
          : {
              c: null,
              h: null,
              l: null,
              o: null,
              stamp: numericStamp,
              v: null,
              i: null,
            };

        if (isValueEmpty) seriesData[index] = candle;
        else seriesData.splice(index, 0, candle);
      }
    }
  }

  setPositions(positionsSeries: FusionSeriesData) {
    var self = this;
    var mainSeriesId = this.getMainSeries().seriesId;
    var series: FusionSeriesRuntime = {
      seriesId: this.positionsSeriesId,
      data: [],
      fields: ["position"],
      interval: this.getMainSeries().interval,
      title: "Market positions",
      labels: ["Market position"],
    };
    const seriesData = ((series.data = (this.seriesManager[mainSeriesId].data as FusionSeriesData).map(
      function (e: FusionRecord) {
        return { stamp: e.stamp, position: null, instrumentId: self.getMainSeries().instrument.id };
      },
    )) || []) as FusionSeriesData;

    positionsSeries.sort(function (a: FusionRecord, b: FusionRecord) {
      if (Number(a.stamp) < Number(b.stamp)) return -1;
      if (Number(a.stamp) > Number(b.stamp)) return 1;
      return 0;
    });

    var lastDataIdx = 0;
    positionsSeries.forEach(function (p: FusionRecord) {
      const positionStamp = Number(p.stamp);
      for (var i = lastDataIdx; i < seriesData.length; i++) {
        const seriesPoint = seriesData[i];
        if (!seriesPoint) continue;
        if (typeof seriesPoint.stamp === "number" && seriesPoint.stamp <= positionStamp)
          lastDataIdx = i;
        else {
          seriesData[lastDataIdx].position = p.positionSize;
          lastDataIdx = i;
          break;
        }
      }
    });

    for (var i = 0; i < seriesData.length; i++) {
      if (seriesData[i].position == null) {
        if (i == 0) seriesData[i].position = 0;
        else seriesData[i].position = seriesData[i - 1].position;
      }
    }

    this.seriesManager[series.seriesId] = series;
  }

  isPositionsSeries() {
    return (
      this.seriesManager[this.positionsSeriesId] != null &&
      this.seriesManager[this.positionsSeriesId].data != null &&
      this.seriesManager[this.positionsSeriesId].data.length > 0
    );
  }

  getPositions() {
    return this.seriesManager[this.positionsSeriesId];
  }

  calculateAll() {
    for (var key in this.model.scripts) {
      const scriptConfig = this.model.scripts[key] as RuntimeScriptConfig;
      var script = this.scriptsManager[String(scriptConfig.id)];
      this.calculate(script, this.getMainSeries());
    }
  }

  calculate(script: FusionScriptControllerRuntime, mainSeries: FusionSeriesRuntime) {
    const mainSeriesData = (mainSeries.data || []) as FusionSeriesData;
    var maxLength = mainSeriesData.length;
    for (var key in script.inputs) {
      const inputName = script.inputs[key];
      const isSeries = typeof inputName === "string" && this.seriesManager[inputName.split(":")[0]];

      if (isSeries)
        try {
          const spl = inputName.split(":");
          const inputSeries = this.seriesManager[spl[0]];
          const seriesLength = inputSeries && inputSeries.data ? inputSeries.data.length : 0;

          if (seriesLength > maxLength) {
            maxLength = seriesLength;
          }
        } catch (e) {
          console.log(e);
        }
    }
    for (let i = 0; i < maxLength; i++) {
      script.calculate(i);
    }
  }

  modifyScript(s: RuntimeScriptConfig) {
    var scriptProto = FUSION.scripts[s.key] as RuntimeScriptDefinition | undefined;
    if (scriptProto == null) return;

    if (s.permHide) s.visible = false;

    var wrappers: Record<string, unknown> = {};
    for (var key in s.inputs) {
      if (scriptProto.inputs[key].type == "series") {
        wrappers[key] = this.getSeriesWrapper(s.inputs[key]);
      } else if (
        scriptProto.inputs[key].type == "conditional" &&
        s.inputs[key]["type"] == "series"
      ) {
        wrappers[key] = this.getSeriesWrapper(s.inputs[key]["value"]);
      } else {
        wrappers[key] = s.inputs[key];
      }

      for (var i in this.model.scripts) {
        if (this.model.scripts[i].id == s.id) {
          const modelScript = this.model.scripts[i] as RuntimeScriptConfig;
          modelScript.inputs[key] = s.inputs[key];
          break;
        }
      }
    }
    var scriptInstance = this.scriptsManager[String(s.id)];
    for (var id in scriptInstance.outputs) {
      var scriptSeries = this.seriesManager[scriptInstance.outputs[id]];
      scriptSeries.userName = s.userName;
      scriptSeries.data = this.createSeries((scriptSeries.fields || []) as string[]);
    }
    if (scriptInstance.onModify) scriptInstance.onModify();
    for (var key in wrappers) {
      scriptInstance[key] = wrappers[key];
    }
  }

  addScript(config: RuntimeScriptConfig) {
    config.id = FUSION.uniqueId();

    config["outputs"] = {};
    var proto = JSON.parse(JSON.stringify(FUSION.scripts[config.key]));
    for (var key in proto.outputs) {
      config.outputs[key] = FUSION.uniqueId();
    }
    config.permHide = proto.permHide;
    config.visible = proto.permHide == true ? false : config.visible;
    this.configureScript(config);

    this.model.scripts.push(config);
    this.scriptsManager[String(config.id)].init();
  }

  clearSeriesData() {
    if (this.seriesManager) {
      for (var k in this.seriesManager) {
        if (this.seriesManager[k].data) this.seriesManager[k].data = null;
      }
    }
  }

  getMainSeries() {
    if (this.model && this.model.instrumentsSeries && this.model.instrumentsSeries.length > 0) {
      var id = this.model.instrumentsSeries[0].seriesId;
      return this.seriesManager[id] as MainFusionSeries;
    }

    if (this.model.mainSeries && this.seriesManager[this.model.mainSeries])
      return this.seriesManager[this.model.mainSeries] as MainFusionSeries;

    return null as unknown as MainFusionSeries;
  }

  getScriptsManager() {
    return this.scriptsManager;
  }

  getSeriesManager() {
    return this.seriesManager;
  }

  getSeriesManagerSnapshot() {
    var snapshot: Record<string, FusionSeriesRuntime> = {};
    var index = this.getMainSeriesLastIndex();
    for (var id in this.seriesManager) {
      var series = this.seriesManager[id];
      snapshot[id] = {
        seriesId: series.seriesId,
        fields: series.fields,
        title: series.title,
        labels: series.labels,
        interval: series.interval,
        data: [],
      };
      snapshot[id].data.push(series.data[index]);

      if (series.instrument) snapshot[id].instrument = series.instrument;
      if (series.interval) snapshot[id].interval = series.interval;
    }
    return snapshot;
  }

  getMainSeriesLastIndex() {
    return this.getMainSeries().data.length - 1;
  }

  getSeriesById(seriesId: string) {
    return this.seriesManager[seriesId];
  }

  isLoaded() {
    for (var k in this.seriesManager) {
      if (
        this.seriesManager[k].instrument &&
        (!this.seriesManager[k].data || !Array.isArray(this.seriesManager[k].data))
      ) {
        return false;
      }
    }
    return true;
  }

  areAllSeriesEmpty() {
    for (var k in this.seriesManager) {
      if (
        this.seriesManager[k].data &&
        Array.isArray(this.seriesManager[k].data) &&
        this.seriesManager[k].data.length !== 0
      ) {
        return false;
      }
    }
    return true;
  }

  getEmptyInstrumentSeries() {
    const emptySeries: Record<string, FusionSeriesRuntime> = {};

    for (const k in this.seriesManager) {
      const series = this.seriesManager[k];
      if (
        series.instrument &&
        (!series.data || !Array.isArray(series.data) || series.data.length === 0)
      ) {
        emptySeries[k] = this.seriesManager[k];
      }
    }
    return emptySeries;
  }
}

FUSION.engine = FusionEngine;

class FusionLoader implements CoreFusionLoader {
  [key: string]: unknown;

  loaded = {} as FusionLoadCache;

  loadFusionData(
    engine: CoreFusionRuntime,
    onSuccess: FusionLoaderSuccess,
    onError: FusionLoaderError,
  ) {
    engine.clearSeriesData();

    var interval = (engine.model.interval || engine.model.instrumentsSeries[0].interval) as FusionInterval;

    for (var key in engine.model.instrumentsSeries) {
      var instrumentSeries = engine.model.instrumentsSeries[key];
      this.load(
        instrumentSeries.instrument as FusionInstrument,
        interval,
        function (data: LoadedFusionResponse) {
          FusionLoader.setData(engine, data);
          onSuccess(engine, data);
        },
        (error: unknown) => {
          if (typeof error === "object" && error !== null) {
            (error as FusionRecord).instrument = instrumentSeries.instrument as FusionInstrument;
          }
          onError(error);
        },
      );
    }
  }

  loadFusionDataHistoric(
    engine: CoreFusionRuntime,
    onSuccess: FusionLoaderSuccess,
    onError: FusionLoaderError,
  ) {
    var interval = (engine.model.interval || engine.model.instrumentsSeries[0].interval) as FusionInterval;
    var toStamp =
      engine.getSeriesManager()[engine.model.instrumentsSeries[0].seriesId].data[0].stamp - 1;
    var instrumentsToLoad = [];

    for (var key in engine.model.instrumentsSeries) {
      instrumentsToLoad.push(engine.model.instrumentsSeries[key].instrument as FusionInstrument);
    }

    this.loadHistoric(
      instrumentsToLoad,
      interval,
      toStamp,
      function (data: FusionHistoryResponseMap) {
        FusionLoader.setDataHistoric(engine, data, toStamp);
        onSuccess(engine, data);
      },
      onError,
    );
  }

  //metoda KUBY dla charta
  loadHistory(engine: CoreFusionRuntime, onSuccess: UnknownFn, onError: UnknownFn) {
    var model = engine.model;
    var instruments: Array<FusionInstrument | undefined> = [];
    for (var series in model.instrumentsSeries) {
      instruments.push(model.instrumentsSeries[series].instrument as FusionInstrument | undefined);
    }
    var toStamp = engine.getSeriesManager()[model.instrumentsSeries[0].seriesId].data[0].stamp - 1;
    requireServices().datasource.loadCandlesHistory(
      2000,
      (model.interval as FusionInterval).symbol,
      null,
      toStamp,
      instruments,
      onSuccess,
      onError,
    );
  }

  private load(
    instrument: FusionInstrument,
    interval: FusionInterval,
    onSuccess: (data: LoadedFusionResponse) => void,
    onError: FusionLoaderError,
  ) {
    this.loaded[interval.symbol] = this.loaded[interval.symbol] || {};

    if (this.loaded[interval.symbol][instrument.id]) {
      onSuccess(this.loaded[interval.symbol][instrument.id] as LoadedFusionResponse);
    } else {
      const services = requireServices();

      services.datasource.loadInstrumentCandles(
        instrument,
        interval.symbol,
        null,
        null,
        (data: LoadedFusionResponse) => {
          this.loaded[interval.symbol][instrument.id] = data;
          onSuccess(this.loaded[interval.symbol][instrument.id] as LoadedFusionResponse);
        },
        function (errorMessage: unknown) {
          onError(errorMessage);
        },
      );
    }
  }

  private loadHistoric(
    instruments: FusionInstrument[],
    interval: FusionInterval,
    toStamp: number,
    onSuccess: (data: FusionHistoryResponseMap) => void,
    onError: FusionLoaderError,
  ) {
    const services = requireServices();

    services.datasource.loadCandlesHistory(
      2000,
      interval.symbol,
      null,
      toStamp,
      instruments,
      function (data: LoadedFusionResponse | FusionHistoryResponseMap) {
        if (isLoadedFusionResponse(data)) {
          const dataKey = data.instrument.id != null ? String(data.instrument.id) : String(FUSION.uniqueId());
          onSuccess({ [dataKey]: data });
          return;
        }
        onSuccess(data);
      },
      function (errorMessage: unknown) {
        onError(errorMessage);
      },
    );
  }

  private static setData(engine: CoreFusionRuntime, data: LoadedFusionResponse) {
    var seriesManager = engine.getSeriesManager();
    const modelInterval = engine.model.interval as FusionIntervalRuntime | null;
    const chartInstrument = toChartInstrument(data.instrument);

    if (modelInterval && modelInterval.symbol == data.interval.symbol && chartInstrument) {
      for (var key in seriesManager) {
        const seriesInstrument = seriesManager[key].instrument;
        if (seriesInstrument && seriesInstrument.id == chartInstrument.id) {
          seriesManager[key].data = JSON.parse(JSON.stringify(data.candles));
          seriesManager[key].title = chartInstrument.symbol;
          seriesManager[key].instrument = chartInstrument;
          seriesManager[key].interval = toChartInterval(data.interval);
        }
      }
    }
  }

  private static setDataHistoric(
    engine: CoreFusionRuntime,
    dataById: FusionHistoryResponseMap,
    toStamp: number,
  ) {
    const seriesManager = engine.getSeriesManager();
    const modelInterval = engine.model.interval as FusionIntervalRuntime | null;

    for (const id in dataById) {
      if (modelInterval && modelInterval.symbol === dataById[id].interval.symbol) {
        const data = dataById[id];
        const chartInstrument = toChartInstrument(data.instrument);
        for (const key in seriesManager) {
          const seriesInstrument = seriesManager[key].instrument;
          if (seriesInstrument && chartInstrument && seriesInstrument.id === chartInstrument.id) {
            const history = data.candles.filter(
              (c: FusionRecord) => typeof c.stamp === "number" && c.stamp <= toStamp,
            );
            const joined = history.concat((seriesManager[key].data || []) as FusionSeriesData);
            const map = new Map<number, FusionRecord>();

            joined.forEach((c: FusionRecord) => {
              if (typeof c.stamp === "number") {
                map.set(c.stamp, c);
              }
            });
            seriesManager[key].data = Array.from(map.values());
          }
        }
      }
    }
  }
}

FUSION.loader = FusionLoader;

/*
 * ENGINE BUILDER
 */
class FusionBuilder implements CoreFusionBuilder {
  [key: string]: unknown;

  _engine?: CoreFusionRuntime | null;
  _model: FusionModelRuntime = {
    interval: null,
    instrumentsSeries: [],
    scripts: [],
  };
  _interval?: Interval | null = null;
  _scripts: RuntimeScriptConfig[] = [];
  _series: FusionSeriesRuntime[] = [];
  _instrumentsToAdd: CoreFusionBuilder["_instrumentsToAdd"] = [];
  _instrumentsToReplace: CoreFusionBuilder["_instrumentsToReplace"] = [];

  constructor(engine: CoreFusionRuntime | null = null) {
    this._engine = engine ? engine : null;
  }

  setModel(model: FusionModelRuntime) {
    this._model = model;
    return this;
  }

  addInstrument(instrument: FusionInstrument, seriesId?: string) {
    this._instrumentsToAdd.push({ instrument, seriesId });
    return this;
  }

  replaceInstrumentByOther(
    oldInstrument: FusionInstrument,
    newInstrument: FusionInstrument,
    withRelated?: boolean,
  ) {
    this._instrumentsToReplace.push({
      old: oldInstrument,
      new: newInstrument,
      withRelated,
    });
    return this;
  }

  setInterval(interval: Interval) {
    this._interval = interval;
    return this;
  }

  addScript(script: RuntimeScriptConfig, pos?: number) {
    if (pos == null) this._scripts.push(script);
    else this._scripts.splice(pos, 0, script);
    return this;
  }

  addSeries(series: FusionSeriesRuntime) {
    this._series.push(series);
    return this;
  }

  build(): CoreFusionRuntime {
    let engine: CoreFusionRuntime;
    let model: FusionModelRuntime;

    if (!this._model && !this._engine) {
      throw new FusionBuilderException(
        "Give me some model or primal engine by builder param ",
        null,
      );
    }

    if (this._engine) {
      engine = this._engine;
      model = engine.model;
    } else {
      engine = new FUSION.engine();
      model = this._model;
    }

    this.prepareModel(engine, model);

    return engine;
  }

  private prepareModel(engine: CoreFusionRuntime, model: FusionModelRuntime) {
    if (this._interval) model.interval = this._interval;

    for (var key in this._instrumentsToAdd) {
      if (!containsInstrument(this._instrumentsToAdd[key].instrument, model)) {
        var id = this._instrumentsToAdd[key].seriesId || FUSION.uniqueId();
        var newSeries = createOhlcvModel(String(id), this._instrumentsToAdd[key].instrument, model.interval);
        model.instrumentsSeries.push(newSeries);
      }
    }

    for (var key in this._instrumentsToReplace) {
      var oldInstrumentSeries = containsInstrument(this._instrumentsToReplace[key].old, model);
      if (oldInstrumentSeries) {
        const relatedInstrument = oldInstrumentSeries.instrument;
        if (this._instrumentsToReplace[key].withRelated === true && relatedInstrument) {
          var related = findInstrumentSeriesRelatedTo(relatedInstrument, model);
          for (var relatedIndex in related) {
            const relatedSeries = related[relatedIndex];
            const relatedKey = relatedSeries.instrument?.relatedKey;
            if (!relatedKey) continue;
            var newRelated = getInstrumentsRelatedFromBaseInstrumentByRelatedKey(
              this._instrumentsToReplace[key].new,
              relatedKey,
            );
            if (newRelated) {
              relatedSeries.instrument = newRelated;
              relatedSeries.title = newRelated.symbol + "." + newRelated.name;
            }
          }
        }

        oldInstrumentSeries.instrument = this._instrumentsToReplace[key].new;
        oldInstrumentSeries.title = this._instrumentsToReplace[key].new.symbol;
        delete oldInstrumentSeries.data;
      }
    }

    model.scripts = model.scripts.concat(this._scripts);
    model.id = model.id || FUSION.uniqueId();
    engine.model = model;

    mergeScriptInputObjectsWithObjects(engine.model);

    let previousSeriesManager: CoreFusionRuntime["seriesManager"] | null = null;
    if (this._engine) {
      previousSeriesManager = engine.seriesManager;
    }

    engine.seriesManager = {};

    for (var key in engine.model.instrumentsSeries) {
      const series = engine.model.instrumentsSeries[key];

      engine.seriesManager[series.seriesId] = JSON.parse(JSON.stringify(series));
      delete series.data;

      if (previousSeriesManager && previousSeriesManager[engine.model.instrumentsSeries[key].seriesId]) {
        const previousSeries = previousSeriesManager[engine.model.instrumentsSeries[key].seriesId];
        const currentInstrument = engine.model.instrumentsSeries[key].instrument;
        if (
          previousSeries &&
          previousSeries.instrument &&
          currentInstrument &&
          previousSeries.instrument.id == currentInstrument.id
        ) {
          engine.seriesManager[engine.model.instrumentsSeries[key].seriesId].data = previousSeries.data;
        }
      }
    }

    engine.model.mainSeries = engine.getMainSeries() ? engine.getMainSeries().seriesId : null;

    for (var i in this._series) {
      engine.seriesManager[this._series[i].seriesId] = JSON.parse(JSON.stringify(this._series[i]));
    }
  }
}

class FusionBuilderException {
  model: FusionModelRuntime | null;
  message: string;

  constructor(message: string, model: FusionModelRuntime | null) {
    this.model = model;
    this.message = message;
  }
}

function mergeScriptInputObjectsWithObjects(model: FusionModelRuntime) {
  model.scripts.forEach((s) => {
    if (s.key === "OBJECT") {
      const script = s as RuntimeScriptConfig;
      const objectInput = script.inputs["OBJECT"] as FusionRecord | undefined;
      const id = objectInput?.id;
      if (id == null) return;
      const o = findObjectById(model, id);
      if (o) script.inputs["OBJECT"] = o;
    }
  });
}

function findObjectById(model: FusionModelRuntime, id: string | number) {
  var obj: FusionRecord | null = null;
  if (!model.panels) return null;
  model.panels.forEach((panel: FusionPanelRuntime) => {
    panel.objects.forEach((o: FusionRecord) => {
      if (o.id === id) obj = o;
    });
  });
  return obj;
}

function createOhlcvModel(
  id: string,
  instrument: FusionInstrumentRuntime,
  interval: FusionIntervalRuntime | null | undefined,
) {
  var res = {
    seriesId: id,
    title: instrument.relatedKey ? instrument.symbol + "." + instrument.name : instrument.symbol,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    data: null,
    instrument: instrument,
    interval: interval,
  };
  return JSON.parse(JSON.stringify(res));
}

function containsInstrument(instrument: FusionInstrumentRuntime, model: FusionModelRuntime) {
  for (var i in model.instrumentsSeries) {
    const seriesInstrument = model.instrumentsSeries[i].instrument;
    if (model.instrumentsSeries[i] && seriesInstrument && seriesInstrument.id == instrument.id)
      return model.instrumentsSeries[i];
  }
  return false;
}

function findInstrumentSeriesRelatedTo(
  instrument: FusionInstrumentRuntime,
  model: FusionModelRuntime,
) {
  var related: FusionRecord[] = [];
  const relatedInstruments = instrument.related || [];
  for (var i in model.instrumentsSeries) {
    for (const relatedInstrument of relatedInstruments) {
      const seriesInstrument = model.instrumentsSeries[i].instrument;
      if (seriesInstrument && relatedInstrument.id == seriesInstrument.id) {
        related.push(model.instrumentsSeries[i]);
        break;
      }
    }
  }
  return related;
}

function getInstrumentsRelatedFromBaseInstrumentByRelatedKey(
  instrument: FusionInstrumentRuntime,
  key: string,
) {
  const relatedInstruments = instrument.related || [];
  for (const relatedInstrument of relatedInstruments) {
    if (relatedInstrument.relatedKey == key) {
      return relatedInstrument;
    }
  }
  return null;
}

FUSION.builder = FusionBuilder;

export default FUSION;
