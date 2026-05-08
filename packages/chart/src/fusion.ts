import WEBRCP from "./WebRCP";
import { createFusionIndicatorScripts } from "./fusion-scripts/indicators";
import { createFusionStrategyScripts } from "./fusion-scripts/strategies";
import { createFusionFunctionScripts } from "./fusion-scripts/functions";
import { createFusionHiddenScripts } from "./fusion-scripts/hidden";
import type {
  CoreFusionBuilder,
  CoreFusionLoader,
  FusionModelRuntime,
  CoreFusionRuntime,
  CoreFusionStatic,
} from "./internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
  FusionSignalMatrix,
  RuntimeScriptConfig,
  RuntimeScriptDefinition,
} from "./internal-types/scripts";
import type { FusionSeriesRuntime } from "./internal-types/series";

declare const SERVICES: any;

type FusionRecord = Record<string, any>;
type FusionSeriesData = FusionRecord[];

const FUSION: CoreFusionStatic = {} as CoreFusionStatic;

FUSION.scripts = {};

FUSION.DEBUG = false;
FUSION.MIN_VALUE = -Number.MAX_VALUE;
FUSION.MAX_VALUE = Number.MAX_VALUE;

FUSION.BUY = 1;
FUSION.SELL = -1;
FUSION.EXIT_LONG = 2;
FUSION.EXIT_SHORT = -2;
FUSION.EXIT_ALL = -3;
FUSION.DO_NOTHING = 0;

/**
 * @memberOf FUSION
 */
FUSION.signals = {
  Buy: FUSION.BUY,
  Sell: FUSION.SELL,
  "Exit long": FUSION.EXIT_LONG,
  "Exit short": FUSION.EXIT_SHORT,
  "Exit all": FUSION.EXIT_ALL,
  "Do nothing": FUSION.DO_NOTHING,
};

/**
 * @memberOf FUSION
 */
FUSION.Matrix = function (this: FusionSignalMatrix) {
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
} as unknown as CoreFusionStatic["Matrix"];

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
  if (typeof SERVICES === "undefined") return FUSION.scripts[key];
  else if (!FUSION.scripts[key].subscriptionPack) return FUSION.scripts[key];
  else if (SERVICES.payments.isSubscriptionPackEnabled(FUSION.scripts[key].subscriptionPack))
    return FUSION.scripts[key];
  else return null;
};

FUSION.getScript = function (key) {
  return FUSION.scripts[key];
};

FUSION.getAvailableScripts = function () {
  const availableScripts =
    FUSION.availableScripts ??
    (FUSION.availableScripts = JSON.parse(JSON.stringify(FUSION.scripts)));

  const keys = Object.keys(availableScripts);

  for (let key of keys) {
    const script = availableScripts[key];

    if (
      typeof SERVICES === "undefined" ||
      (script.subscriptionPack &&
        !SERVICES.payments.isSubscriptionPackEnabled(script.subscriptionPack))
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
FUSION.lib = {};

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
    .filter((interval: FusionRecord) => interval.milis > 0)
    .map((interval: FusionRecord, index: number) => {
      return {
        index: index,
        value: Math.abs(originalInterval.milis - interval.milis),
      };
    })
    .sort((deltaA: FusionRecord, deltaB: FusionRecord) => deltaA.value - deltaB.value)
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
      x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err);
    }
    return p < 1 ? x : -x;
  }

  function erfc(x: number) {
    return 1 - erf(x);
  }

  function erf(x: number) {
    var cof = [
      -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2, -9.561514786808631e-3,
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

  return -1.41421356237309505 * std * erfcinv(2 * p) + mean;
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

FUSION.engine = function (this: CoreFusionRuntime) {
  this.model = {
    id: FUSION.uniqueId(),
    instrumentsSeries: [],
    scripts: [],
  } as FusionModelRuntime;
  var positionsSeriesId = "POSITIONS";

  this.seriesManager = {} as Record<string, FusionSeriesRuntime>;
  this.scriptsManager = {} as Record<string, FusionScriptControllerRuntime>;

  this.createSeries = function (this: any, fields: string[]) {
    var series: FusionSeriesData = [];
    const mainSeries = this.getMainSeries();
    const mainSeriesData = (
      mainSeries && mainSeries.data ? mainSeries.data : []
    ) as FusionSeriesData;
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
  };
  this.createTooltipSeries = function (this: any, fields: string[]) {
    var series = this.createSeries(fields);
    for (var i = 0; i < series.length; i++) {
      series[i].tooltips = {};
    }
    return series;
  };

  this.configureScripts = function (this: any) {
    for (var i = 0; i < this.model.scripts.length; i++) {
      this.configureScript(this.model.scripts[i] as RuntimeScriptConfig);
    }
  };

  this.configureScript = function (this: any, scriptModel: RuntimeScriptConfig) {
    var self = this;
    var scriptProto = FUSION.scripts[scriptModel.key] as RuntimeScriptDefinition | undefined;
    if (scriptProto == null || !scriptProto.controller) return;

    scriptModel.scriptType = scriptProto.type;
    //Get Script ID

    var id = scriptModel.id;

    //create input wrappers
    var wrappers: Record<string, any> = {};

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
          wrappers[key] = scriptModel.inputs[key];
          wrappers[key].isIndicator = true;
        } else {
          wrappers[key] = scriptModel.inputs[key];
        }
      }
    }
    function initializeSeries(series: FusionRecord) {
      series.userName = scriptModel.userName;
      if (scriptModel.inputs["OBJECT"] && scriptModel.inputs["OBJECT"].userName) {
        series.userName = scriptModel.inputs["OBJECT"].userName;
      }
      series.seriesId = scriptModel.outputs[key];
      self.seriesManager[series.seriesId] = series as FusionSeriesRuntime;
    }
    //create outputs
    for (var key in scriptModel.outputs) {
      var type = scriptProto.outputs[key].type;
      if (type === "series") {
        var series: FusionRecord = JSON.parse(JSON.stringify(scriptProto.outputs[key].series));
        series.data = this.createSeries(series.fields);
        initializeSeries(series);

        for (var i = 0; i < series.fields.length; i++) {
          wrappers[series.fields[i]] = this.getSeriesWrapper(
            series.seriesId + ":" + series.fields[i]
          );
        }
      } else if (type === "tooltipSeries") {
        var series: FusionRecord = JSON.parse(JSON.stringify(scriptProto.outputs[key].series));
        series.data = this.createTooltipSeries(series.fields);
        initializeSeries(series);
        for (var i = 0; i < series.fields.length; i++) {
          wrappers[series.fields[i]] = this.getTooltipSeriesWrapper(
            series.seriesId + ":" + series.fields[i]
          );
        }
      }
    }

    //Create Script Instance
    var scriptController = scriptProto.controller(this, scriptModel.inputs, scriptModel.outputs);
    scriptController.id = scriptModel.id;
    for (var key in wrappers) {
      scriptController[key] = wrappers[key];
    }
    this.scriptsManager[String(scriptModel.id)] = scriptController;
  };

  this.getSeriesWrapper = function (this: any, seriesLink: string) {
    var spl = seriesLink.split(":");

    var self = this;

    var wrapper = {
      getValue: function (index: number) {
        const data = self.seriesManager[spl[0]].data as FusionSeriesData;
        if (index < 0) return null;
        if (index >= data.length) return null;
        return data[index][spl[1]];
      },
      setValue: function (index: number, value: any) {
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
          )
            milis = mainSeries.interval.milis;

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
      setStrength: function (index: number, value: any) {
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
  };

  this.getTooltipSeriesWrapper = function (this: any, seriesLink: string) {
    var self = this;
    var spl = seriesLink.split(":");
    var wrapper = this.getSeriesWrapper(seriesLink);
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
      )
        milis = mainSeries.interval.milis;

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

    wrapper.setTooltip = function (index: number, key: string, value: any) {
      const lastIndex = series.length - 1;
      if (index > lastIndex) pushEmptyValues(index - lastIndex);
      series[index].tooltips[key] = value;
    };
    wrapper.getTooltip = function (index: number, key: string) {
      if (index < 0) return null;
      if (index > series.length - 1) return null;
      return series[index].tooltips[key];
    };
    return wrapper;
  };

  this.getRawSeriesWrapper = function (this: any, series: FusionSeriesData, field: string) {
    var self = this;

    var wrapper = {
      getValue: function (index: number) {
        if (index < 0) return null;
        if (index > series.length - 1) return null;
        return series[index][field];
      },
      setValue: function (index: number, value: any) {
        function pushEmptyValues(number: number) {
          var lastValue = JSON.parse(JSON.stringify(series[series.length - 1]));
          const mainSeries = self.getMainSeries();
          let milis = 1;
          if (
            mainSeries &&
            mainSeries.interval &&
            mainSeries.interval.milis &&
            mainSeries.interval.milis > 0
          )
            milis = mainSeries.interval.milis;

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
        return (series as FusionRecord).seriesId;
      },
    };

    return wrapper;
  };

  this.getId = function (this: any) {
    return this.model.id;
  };

  this.getModel = function (this: any) {
    return this.model;
  };

  this.getValue = function (this: any, series: string, i: number, field?: string) {
    if (field) return this.seriesManager[series].data[i][field];

    var spl = series.split(":");
    return this.seriesManager[spl[0]].data[i][spl[1]];
  };

  this.setValue = function (this: any, series: string, i: number, value: any, field?: string) {
    if (field) this.seriesManager[series].data[i][field] = value;

    var spl = series.split(":");
    this.seriesManager[spl[0]].data[i][spl[1]] = value;
  };

  this.initAll = function (this: any) {
    for (var key in this.model.scripts) {
      //w modelu skrypty są w kolejności!!! wrappery już nie koniecznie
      const scriptConfig = this.model.scripts[key] as RuntimeScriptConfig;
      this.scriptsManager[String(scriptConfig.id)].init();
    }
  };

  this.shortSynchronization = function (this: any) {
    var seriesManager = this.getSeriesManager();
    var longest = null;
    for (var key in seriesManager) {
      if (seriesManager.hasOwnProperty(key) && seriesManager[key].instrument) {
        if (!longest || seriesManager[key].data.length > longest.data.length) {
          longest = seriesManager[key];
        }
      }
    }
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
  };

  this.fullSynchronization = function (this: any) {
    var model = this.model;
    var seriesManager = this.getSeriesManager();

    if (model.instrumentsSeries.length < 1) return; //synchronization not needed
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
        stampIndex[id][seriesData[idx].stamp] = idx;
        stamps[seriesData[idx].stamp] = seriesData[idx].stamp;
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

      for (var s in model.instrumentsSeries) {
        const id = model.instrumentsSeries[s].seriesId;
        const series = seriesManager[id];
        if (!series || !series.data) continue;
        const seriesData = series.data as FusionSeriesData;

        if (seriesData.length === 0) continue;

        const value = seriesData[index];
        const isValueMissing = !value || !value.stamp || value.stamp != stamp;
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
              stamp: Number(stamp),
              v: null,
              i: null,
            }
          : {
              c: null,
              h: null,
              l: null,
              o: null,
              stamp: Number(stamp),
              v: null,
              i: null,
            };

        if (isValueEmpty) seriesData[index] = candle;
        else seriesData.splice(index, 0, candle);
      }
    }
  };

  this.setPositions = function (this: any, positionsSeries: FusionSeriesData) {
    var self = this;
    var mainSeriesId = this.getMainSeries().seriesId;
    var series: FusionRecord = {
      seriesId: positionsSeriesId,
      data: [],
      fields: ["position"],
      interval: this.getMainSeries().interval,
      title: "Market positions",
      labels: ["Market position"],
    };
    series.data = (this.seriesManager[mainSeriesId].data as FusionSeriesData).map(function (
      e: FusionRecord
    ) {
      return { stamp: e.stamp, position: null, instrumentId: self.getMainSeries().instrument.id };
    });

    positionsSeries.sort(function (a: FusionRecord, b: FusionRecord) {
      if (a.stamp < b.stamp) return -1;
      if (a.stamp > b.stamp) return 1;
      return 0;
    });

    var lastDataIdx = 0;
    //synch
    positionsSeries.forEach(function (p: FusionRecord, _i: number) {
      for (var i = lastDataIdx; i < series.data.length; i++) {
        if (series.data[i].stamp <= p.stamp) lastDataIdx = i;
        else {
          series.data[lastDataIdx].position = p.positionSize;
          lastDataIdx = i;
          break;
        }
      }
    });

    //fill nulls
    for (var i = 0; i < series.data.length; i++) {
      if (series.data[i].position == null) {
        if (i == 0) series.data[i].position = 0;
        else series.data[i].position = series.data[i - 1].position;
      }
    }

    this.seriesManager[series.seriesId] = series as FusionSeriesRuntime;
  };

  this.isPositionsSeries = function (this: any) {
    return (
      this.seriesManager[positionsSeriesId] != null &&
      this.seriesManager[positionsSeriesId].data != null &&
      this.seriesManager[positionsSeriesId].data.length > 0
    );
  };

  this.getPositions = function (this: any) {
    return this.seriesManager[positionsSeriesId];
  };

  this.calculateAll = function (this: any) {
    // console.log('##################################FUSION CALCULATE ALL#####################################');
    for (var key in this.model.scripts) {
      //w modelu skrypty są w kolejności!!! wrappery już nie koniecznie
      const scriptConfig = this.model.scripts[key] as RuntimeScriptConfig;
      var script = this.scriptsManager[String(scriptConfig.id)];
      this.calculate(script, this.getMainSeries());

      for (var output in script.outputs) {
        var series = this.seriesManager[script.outputs[output]];
        const fields = (series.fields || []) as string[];
        for (var f in fields) {
          var outWrap = script[fields[f]];
          var lastIdx = outWrap.getSeriesLength() - 1;
          var secondLastIdx = outWrap.getSeriesLength() - 2;
          // console.log("FUSION: " + this.getMainSeries().title + ":" + series.data[lastIdx].stamp + ":" +series.fields[f]+ " "
          //     + "...," + outWrap.getValue(secondLastIdx) + "," + outWrap.getValue(lastIdx));
        }
      }
    }
  };

  this.calculate = function (
    this: any,
    script: FusionScriptControllerRuntime,
    mainSeries: FusionSeriesRuntime
  ) {
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
  };

  this.modifyScript = function (this: any, s: RuntimeScriptConfig) {
    var scriptProto = FUSION.scripts[s.key] as RuntimeScriptDefinition | undefined;
    if (scriptProto == null) return;

    if (s.permHide) s.visible = false;

    //modify inputs values
    var wrappers: Record<string, any> = {};
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
  };

  this.addScript = function (this: any, config: any) {
    //Create script id
    config.id = FUSION.uniqueId();

    //Create output ids
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
  };

  this.clearSeriesData = function (this: any) {
    if (this.seriesManager) {
      for (var k in this.seriesManager) {
        if (this.seriesManager[k].data) this.seriesManager[k].data = null;
      }
    }
  };

  this.getMainSeries = function (this: any) {
    if (this.model && this.model.instrumentsSeries && this.model.instrumentsSeries.length > 0) {
      var id = this.model.instrumentsSeries[0].seriesId;
      return this.seriesManager[id];
    }

    if (this.model.mainSeries && this.seriesManager[this.model.mainSeries])
      return this.seriesManager[this.model.mainSeries];

    return null as unknown as FusionSeriesRuntime;
  };

  this.getScriptsManager = function (this: any) {
    return this.scriptsManager;
  };

  this.getSeriesManager = function (this: any) {
    return this.seriesManager;
  };

  this.getSeriesManagerSnapshot = function (this: any) {
    var snapshot: Record<string, FusionRecord> = {};
    var index = this.getMainSeriesLastIndex();
    for (var id in this.seriesManager) {
      var series = this.seriesManager[id];
      snapshot[id] = {
        seriesId: series.seriesId,
        fields: series.fields,
        title: series.title,
        labels: series.labels,
        data: [],
      };
      snapshot[id].data.push(series.data[index]);

      if (series.instrument) snapshot[id].instrument = series.instrument;
      if (series.interval) snapshot[id].interval = series.interval;
    }
    return snapshot;
  };

  this.getMainSeriesLastIndex = function (this: any) {
    return this.getMainSeries().data.length - 1;
  };

  this.getSeriesById = function (this: any, seriesId: any) {
    return this.seriesManager[seriesId];
  };

  this.isLoaded = function (this: any) {
    for (var k in this.seriesManager) {
      if (
        this.seriesManager[k].instrument &&
        (!this.seriesManager[k].data || !Array.isArray(this.seriesManager[k].data))
      )
        return false;
    }
    return true;
  };

  this.areAllSeriesEmpty = function (this: any) {
    for (var k in this.seriesManager) {
      if (
        this.seriesManager[k].data &&
        Array.isArray(this.seriesManager[k].data) &&
        this.seriesManager[k].data.length !== 0
      )
        return false;
    }
    return true;
  };

  this.getEmptyInstrumentSeries = function (this: any) {
    const emptySeries: Record<string, FusionSeriesRuntime> = {};

    for (const k in this.seriesManager) {
      const series = this.seriesManager[k];
      if (
        series.instrument &&
        (!series.data || !Array.isArray(series.data) || series.data.length === 0)
      )
        emptySeries[k] = this.seriesManager[k];
    }
    return emptySeries;
  };
} as unknown as CoreFusionStatic["engine"];

FUSION.loader = function (this: CoreFusionLoader) {
  var self = this;
  this.loaded = {};

  this.loadFusionData = function (this: any, engine: any, onSuccess: any, onError: any) {
    engine.clearSeriesData();

    var interval = engine.model.interval || engine.model.instrumentsSeries[0].interval;

    for (var k in engine.model.instrumentsSeries) {
      var is = engine.model.instrumentsSeries[k];
      load(
        is.instrument,
        interval,
        this,
        function (data: FusionRecord) {
          setData(engine, data);
          onSuccess(engine, data);
        },
        (error: FusionRecord) => {
          error.instrument = is.instrument;
          onError(error);
        }
      );
    }
  };

  function setData(engine: CoreFusionRuntime, data: FusionRecord) {
    var sm = engine.getSeriesManager();
    const modelInterval = engine.model.interval as FusionRecord | null;

    if (modelInterval && modelInterval.symbol == data.interval.symbol) {
      for (var k in sm) {
        const seriesInstrument = sm[k].instrument;
        if (seriesInstrument && seriesInstrument.id == data.instrument.id) {
          sm[k].data = JSON.parse(JSON.stringify(data.candles));
          sm[k].title = data.instrument.symbol;
          sm[k].instrument = data.instrument;
          sm[k].interval = data.interval;
        }
      }
    }
  }

  function load(
    instrument: FusionRecord,
    interval: FusionRecord,
    loader: CoreFusionLoader,
    onSuccess: (data: FusionRecord) => void,
    onError: (error: any) => void
  ) {
    loader.loaded[interval.symbol] = loader.loaded[interval.symbol] || {};

    if (loader.loaded[interval.symbol][instrument.id]) {
      onSuccess(loader.loded[interval.symbol][instrument.id]);
    } else {
      SERVICES.datasource.loadInstrumentCandles(
        instrument,
        interval.symbol,
        null,
        null,
        function (data: FusionRecord) {
          loader.loaded[interval.symbol][instrument.id] = data;
          onSuccess(loader.loaded[interval.symbol][instrument.id]);
        },
        function (errorMessage: any) {
          onError(errorMessage);
        }
      );
    }
  }

  this.loadFusionDataHistoric = function (this: any, engine: any, onSuccess: any, onError: any) {
    var interval = engine.model.interval || engine.model.instrumentsSeries[0].interval;
    var toStamp =
      engine.getSeriesManager()[engine.model.instrumentsSeries[0].seriesId].data[0].stamp - 1;
    var instrumentsToLoad = [];

    for (var k in engine.model.instrumentsSeries) {
      instrumentsToLoad.push(engine.model.instrumentsSeries[k].instrument);
    }

    loadHistoric(
      instrumentsToLoad,
      interval,
      toStamp,
      this,
      function (data: FusionRecord) {
        setDataHistoric(engine, data, toStamp);
        onSuccess(engine, data);
      },
      onError
    );
  };

  function setDataHistoric(
    engine: CoreFusionRuntime,
    _data: Record<string, FusionRecord>,
    toStamp: number
  ) {
    const sm = engine.getSeriesManager();
    const modelInterval = engine.model.interval as FusionRecord | null;

    for (const id in _data) {
      if (modelInterval && modelInterval.symbol === _data[id].interval.symbol) {
        const data = _data[id];
        for (const k in sm) {
          const seriesInstrument = sm[k].instrument;
          if (seriesInstrument && seriesInstrument.id === data.instrument.id) {
            const history = data.candles.filter((c: FusionRecord) => c.stamp <= toStamp);
            const joined = history.concat((sm[k].data || []) as FusionSeriesData);
            const map = new Map<number, FusionRecord>();

            joined.forEach((c: FusionRecord) => map.set(c.stamp, c));
            sm[k].data = Array.from(map.values());
          }
        }
      }
    }
  }

  function loadHistoric(
    instruments: FusionRecord[],
    interval: FusionRecord,
    toStamp: number,
    loader: CoreFusionLoader,
    onSuccess: (data: FusionRecord) => void,
    onError: (error: any) => void
  ) {
    SERVICES.datasource.loadCandlesHistory(
      2000,
      interval.symbol,
      null,
      toStamp,
      instruments,
      //some cache ???
      function (data: FusionRecord) {
        onSuccess(data);
      },
      function (errorMessage: any) {
        onError(errorMessage);
      }
    );
  }

  //metoda KUBY dla charta
  this.loadHistory = function (this: any, engine: any, onSuccess: any, onError: any) {
    var model = engine.model;
    var instruments = [];
    for (var series in model.instrumentsSeries) {
      instruments.push(model.instrumentsSeries[series].instrument);
    }
    var toStamp = engine.getSeriesManager()[model.instrumentsSeries[0].seriesId].data[0].stamp - 1;
    SERVICES.datasource.loadCandlesHistory(
      2000,
      model.interval.symbol,
      null,
      toStamp,
      instruments,
      onSuccess,
      onError
    );
  };
} as unknown as CoreFusionStatic["loader"];

/*
 * ENGINE BUILDER
 */
FUSION.builder = function (this: CoreFusionBuilder, engine: CoreFusionRuntime | null) {
  var self = this;

  this._engine = engine ? engine : null;
  this._instrumentsToAdd = [];
  this._instrumentsToReplace = [];

  this._interval = null;
  this._scripts = [];
  this._series = [];

  this._model = {
    interval: null,
    instrumentsSeries: [],
    scripts: [],
  };

  this.setModel = function (this: any, model: any) {
    this._model = model;
    return this;
  };

  this.addInstrument = function (this: any, instrument: any, seriesId: any) {
    this._instrumentsToAdd.push({ instrument: instrument, seriesId: seriesId });
    return this;
  };

  this.replaceInstrumentByOther = function (
    this: any,
    oldInstrument: any,
    newInstrument: any,
    withRelated: any
  ) {
    this._instrumentsToReplace.push({
      old: oldInstrument,
      new: newInstrument,
      withRelated: withRelated,
    });
    return this;
  };

  this.setInterval = function (this: any, interval: any) {
    this._interval = interval;
    return this;
  };

  this.addScript = function (this: any, script: any, pos: any) {
    if (pos == null || pos == undefined) this._scripts.push(script);
    else this._scripts.splice(pos, 0, script);
    return this;
  };

  this.addSeries = function (this: any, series: any) {
    this._series.push(series);
    return this;
  };

  this.build = function (this: any): CoreFusionRuntime {
    var self = this;
    var engine: CoreFusionRuntime;
    var model: FusionModelRuntime;

    if (!self._model && !self._engine)
      throw new FusionBuilderException(
        "Give me some model or primal engine by builder param ",
        null
      );

    if (self._engine) {
      engine = self._engine as CoreFusionRuntime;
      model = engine.model;
    } else {
      engine = new (FUSION.engine as CoreFusionStatic["engine"])();
      model = self._model;
    }

    prepareModel(engine);

    return engine;

    function prepareModel(engine: CoreFusionRuntime) {
      //set interval - default if none
      if (self._interval) model.interval = self._interval;

      //add instruments
      for (var k in self._instrumentsToAdd) {
        if (!containsInstrument(self._instrumentsToAdd[k].instrument, model)) {
          var id = self._instrumentsToAdd[k].seriesId || FUSION.uniqueId();
          var newSeries = createOhlcvModel(
            id,
            self._instrumentsToAdd[k].instrument,
            model.interval
          );
          model.instrumentsSeries.push(newSeries);
        }
      }

      //replace instrument
      for (var k in self._instrumentsToReplace) {
        var oldInstrumentSeries = containsInstrument(self._instrumentsToReplace[k].old, model);
        if (oldInstrumentSeries) {
          //first find related instruments - some fundametals?
          if (self._instrumentsToReplace[k].withRelated === true) {
            var related = findInstrumentSeriesRelatedTo(oldInstrumentSeries.instrument, model);
            //find coresponding related from new instrument
            for (var r in related) {
              var newRelated = getInstrumentsRelatedFromBaseInstrumentByRelatedKey(
                self._instrumentsToReplace[k]["new"],
                related[r].instrument.relatedKey
              );
              if (newRelated) {
                related[r].instrument = newRelated;
                related[r].title = newRelated.symbol + "." + newRelated.name;
              }
            }
          }

          oldInstrumentSeries.instrument = self._instrumentsToReplace[k]["new"];
          oldInstrumentSeries.title = self._instrumentsToReplace[k]["new"].symbol;
          delete oldInstrumentSeries.data;
        }
      }

      model.scripts = model.scripts.concat(self._scripts);
      model.id = model.id || FUSION.uniqueId();
      engine.model = model;

      mergeScriptInputObjectsWithObjects(engine.model);

      //seriesId
      //register instrument series to manager
      var _tmp = null;
      if (self._engine) {
        _tmp = engine.seriesManager;
      }

      engine.seriesManager = {};

      for (var k in engine.model.instrumentsSeries) {
        const series = engine.model.instrumentsSeries[k];

        engine.seriesManager[series.seriesId] = JSON.parse(JSON.stringify(series));
        delete series.data; //no data in model!

        if (_tmp && _tmp[engine.model.instrumentsSeries[k].seriesId]) {
          const previousSeries = _tmp[engine.model.instrumentsSeries[k].seriesId];
          if (
            previousSeries &&
            previousSeries.instrument &&
            previousSeries.instrument.id == engine.model.instrumentsSeries[k].instrument.id
          ) {
            engine.seriesManager[engine.model.instrumentsSeries[k].seriesId].data =
              previousSeries.data;
          }
        }
      }

      engine.model.mainSeries = engine.getMainSeries() ? engine.getMainSeries().seriesId : null;

      for (var i in self._series) {
        engine.seriesManager[self._series[i].seriesId] = JSON.parse(
          JSON.stringify(self._series[i])
        );
      }
    }
  };

  class FusionBuilderException {
    model: FusionModelRuntime | null;
    message: string;

    constructor(message: string, model: FusionModelRuntime | null) {
      this.model = model;
      this.message = message;
    }
  }

  function mergeScriptInputObjectsWithObjects(model: FusionModelRuntime) {
    model.scripts.forEach((s: FusionRecord) => {
      if (s.key === "OBJECT") {
        const id = s.inputs["OBJECT"].id;
        const o = findObjectById(model, id);
        if (o) s.inputs["OBJECT"] = o;
      }
    });
  }

  function findObjectById(model: FusionModelRuntime, id: string | number) {
    var obj: FusionRecord | null = null;
    if (!model.panels) return null;
    model.panels.forEach((panel: FusionRecord) => {
      panel.objects.forEach((o: FusionRecord) => {
        if (o.id === id) obj = o;
      });
    });
    return obj;
  }

  function createOhlcvModel(
    id: string,
    instrument: FusionRecord,
    interval: FusionRecord | null | undefined
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
    //deep clone
    return JSON.parse(JSON.stringify(res));
  }

  function containsInstrument(instrument: FusionRecord, model: FusionModelRuntime) {
    for (var i in model.instrumentsSeries) {
      if (model.instrumentsSeries[i] && model.instrumentsSeries[i].instrument.id == instrument.id)
        return model.instrumentsSeries[i];
    }
    return false;
  }

  function findInstrumentSeriesRelatedTo(instrument: FusionRecord, model: FusionModelRuntime) {
    var related: FusionRecord[] = [];
    for (var i in model.instrumentsSeries) {
      for (var j in instrument.related) {
        if (instrument.related[j].id == model.instrumentsSeries[i].instrument.id) {
          related.push(model.instrumentsSeries[i]);
          break;
        }
      }
    }
    return related;
  }

  function getInstrumentsRelatedFromBaseInstrumentByRelatedKey(
    instrument: FusionRecord,
    key: string
  ) {
    for (var j in instrument.related) {
      if (instrument.related[j].relatedKey == key) {
        return instrument.related[j];
      }
    }
    return null;
  }

  function containsSeries(seriesId: string, model: FusionModelRuntime) {
    for (var i in model.instrumentsSeries) {
      if (model.instrumentsSeries[i] && model.instrumentsSeries[i].seriesId == seriesId)
        return model.instrumentsSeries[i];
    }
    return false;
  }

  function deleteInstrumentSeriesById(seriesId: string, model: FusionModelRuntime) {
    for (var c = 0; c < model.instrumentsSeries.length; c++) {
      if (model.instrumentsSeries[c].seriesId == seriesId) {
        model.instrumentsSeries.splice(c, 1);
        return true;
      }
    }
    return false;
  }
} as unknown as CoreFusionStatic["builder"];

export default FUSION;
