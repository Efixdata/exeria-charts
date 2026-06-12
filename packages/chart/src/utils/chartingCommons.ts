import WEBRCP from "../WebRCP";
import type { Interval, Instrument } from "../types";
import type { ChartLike, ChartModelFragment } from "../internal-types/chart";
import type { ChartPanelObject } from "../internal-types/objects";
import type { ScriptModelConfig } from "../internal-types/scripts";
import type {
  OhlcvCandle,
  SeriesManager,
  SeriesModel,
  SeriesWithData,
  TickLike,
} from "../internal-types/series";
import { trimInsignificantFractionZeros } from "./numberFormat";

declare global {
  interface CanvasRenderingContext2D {
    rectRound(
      x: number,
      y: number,
      w: number,
      h: number,
      r1: number,
      r2: number,
      r3: number,
      r4: number
    ): CanvasRenderingContext2D;
  }
}

type DataPoint = Record<string, unknown>;

interface RawSeriesWrapper {
  getValue(index: number): unknown;
  setValue(index: number, value: unknown): void;
}

interface OHLCSeriesWrapper extends RawSeriesWrapper {
  getOpen(index: number): number;
  setOpen(index: number, value: number): number;
  getHigh(index: number): number;
  setHigh(index: number, value: number): number;
  getLow(index: number): number;
  setLow(index: number, value: number): number;
  getClose(index: number): number;
  setClose(index: number, value: number): number;
  getVolume(index: number): number;
  setVolume(index: number, value: number): number;
  getInt(index: number): number;
  setInt(index: number, value: number): number;
  getStamp(index: number): number;
  setStamp(index: number, value: number): number;
  getSeriesLength(): number;
  update(tick: TickLike): boolean;
  upsertCandle(candle: OhlcvCandle): boolean;
  synchronize(fetchedCandles: OhlcvCandle[]): void;
}

interface AxisValueConverter {
  realToAxis(rV: number, fV?: number): number;
  axisToReal(aV: number, fV?: number): number;
}

interface InstrumentWithDefaultInterval extends Instrument {
  defaultInterval?: Interval;
}

function getNumberMagnitude(num: number): number {
  return -Math.floor(Math.log10(num) + 1);
}

function nFormatter(num: number, digits: number): string {
  const si = [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
  ];
  const rx = /(\.[0-9]*[1-9])0+$/;

  for (let index = 0; index < si.length; index += 1) {
    if (num >= si[index].value) {
      return (num / si[index].value).toFixed(digits).replace(rx, "$1") + si[index].symbol;
    }
  }

  return trimInsignificantFractionZeros(num.toFixed(digits));
}

function round(num: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(num * factor) / factor;
}

function getObjectById(
  model: Pick<ChartModelFragment, "panels">,
  id: string | number
): ChartPanelObject | null {
  for (let panelIndex = 0; panelIndex < model.panels.length; panelIndex += 1) {
    for (
      let objectIndex = 0;
      objectIndex < model.panels[panelIndex].objects.length;
      objectIndex += 1
    ) {
      if (model.panels[panelIndex].objects[objectIndex].id === id) {
        return model.panels[panelIndex].objects[objectIndex];
      }
    }
  }

  return null;
}

function getRawSeriesWrapper(series: SeriesWithData, field: string): RawSeriesWrapper {
  return {
    getValue(index: number) {
      return series.data[index]?.[field];
    },
    setValue(index: number, value: unknown) {
      series.data[index][field] = value;
    },
  };
}

function getOHLCSeriesWrapper(series: SeriesWithData): OHLCSeriesWrapper {
  return {
    getOpen(index: number) {
      return Number(series.data[index]?.o);
    },
    setOpen(index: number, value: number) {
      series.data[index].o = value;
      return series.data[index].o;
    },
    getHigh(index: number) {
      return Number(series.data[index]?.h);
    },
    setHigh(index: number, value: number) {
      series.data[index].h = value;
      return series.data[index].h;
    },
    getLow(index: number) {
      return Number(series.data[index]?.l);
    },
    setLow(index: number, value: number) {
      series.data[index].l = value;
      return series.data[index].l;
    },
    getClose(index: number) {
      return Number(series.data[index]?.c);
    },
    setClose(index: number, value: number) {
      series.data[index].c = value;
      return series.data[index].c;
    },
    getVolume(index: number) {
      return Number(series.data[index]?.v ?? 0);
    },
    setVolume(index: number, value: number) {
      series.data[index].v = value;
      return Number(series.data[index].v ?? 0);
    },
    getInt(index: number) {
      return Number(series.data[index]?.i ?? 0);
    },
    setInt(index: number, value: number) {
      series.data[index].i = value;
      return Number(series.data[index].i ?? 0);
    },
    getStamp(index: number) {
      return Number(series.data[index]?.stamp);
    },
    setStamp(index: number, value: number) {
      series.data[index].stamp = value;
      return series.data[index].stamp;
    },
    getSeriesLength() {
      return series.data.length;
    },
    getValue(index: number) {
      return this.getClose(index);
    },
    setValue(index: number, value: unknown) {
      this.setClose(index, Number(value));
    },
    update(tick: TickLike) {
      const length = series.data.length;
      const lastStamp = series.data[length - 1]?.stamp;
      const flooredTickStamp = florStampToInterval(tick.stamp, series.interval, lastStamp);
      const price = WEBRCP.utils.getPriceFromTick(tick);

      const calculateNewVolume = (lastCandle: OhlcvCandle | null, nextTick: TickLike) => {
        if (series.interval.symbol === "1D" && nextTick.dailyVolume) {
          return nextTick.dailyVolume;
        }

        if (lastCandle) {
          return Number(lastCandle.v ?? 0) + Number(nextTick.volume ?? 0);
        }

        return Number(nextTick.volume ?? 0);
      };

      if (lastStamp !== undefined && flooredTickStamp < lastStamp) {
        return false;
      }

      if (lastStamp === undefined || lastStamp < flooredTickStamp) {
        series.data.push({
          o: price,
          h: price,
          l: price,
          c: price,
          v: calculateNewVolume(null, tick),
          i: 0,
          stamp: flooredTickStamp,
        });

        return true;
      }

      const lastCandle = series.data[length - 1];

      if (price > Number(lastCandle.h)) lastCandle.h = price;
      if (price < Number(lastCandle.l)) lastCandle.l = price;
      lastCandle.c = price;
      lastCandle.v = calculateNewVolume(lastCandle, tick);

      return false;
    },
    upsertCandle(candle: OhlcvCandle) {
      const length = series.data.length;
      const lastStamp = series.data[length - 1]?.stamp;
      const flooredCandleStamp = florStampToInterval(candle.stamp, series.interval, lastStamp);

      if (lastStamp !== undefined && flooredCandleStamp < lastStamp) {
        console.warn("Attempting to update earlier candle than last. This is not supported.");
        return false;
      }

      if (lastStamp === undefined || lastStamp < flooredCandleStamp) {
        series.data.push({
          o: candle.o,
          h: candle.h,
          l: candle.l,
          c: candle.c,
          v: candle.v,
          i: candle.i || 0,
          stamp: flooredCandleStamp,
        });

        return true;
      }

      const lastCandle = series.data[length - 1];
      lastCandle.o = candle.o;
      lastCandle.h = candle.h;
      lastCandle.l = candle.l;
      lastCandle.c = candle.c;
      lastCandle.v = candle.v;
      lastCandle.i = candle.i || 0;

      return false;
    },
    synchronize(fetchedCandles: OhlcvCandle[]) {
      const tail = series.data.slice(Math.max(series.data.length - fetchedCandles.length, 0));

      for (let index = 0; index < fetchedCandles.length; index += 1) {
        const fetched = fetchedCandles[index];
        const current = tail[index];

        if (current && current.stamp === fetched.stamp) {
          current.o = fetched.o;
          current.h = fetched.h;
          current.l = fetched.l;
          current.c = fetched.c;
          current.v = fetched.v;
          current.i = fetched.i;
        }
      }
    },
  };
}

function synchronizeSeries(seriesManager: SeriesManager): void {
  let longest: SeriesWithData | null = null;

  for (const key in seriesManager) {
    if (Object.prototype.hasOwnProperty.call(seriesManager, key)) {
      if (!longest || seriesManager[key].data.length > longest.data.length) {
        longest = seriesManager[key];
      }
    }
  }

  if (!longest) return;

  for (const key in seriesManager) {
    if (Object.prototype.hasOwnProperty.call(seriesManager, key) && seriesManager[key].data) {
      while (seriesManager[key].data.length < longest.data.length) {
        const last = seriesManager[key].data[seriesManager[key].data.length - 1];
        const next = JSON.parse(JSON.stringify(last)) as OhlcvCandle;

        if (next.c !== null && next.c !== undefined) {
          next.o = next.c;
          next.h = next.c;
          next.l = next.c;
          next.v = 0;
          next.i = 0;
        }

        next.stamp = longest.data[seriesManager[key].data.length].stamp;
        seriesManager[key].data.push(next);
      }
    }
  }
}

function synchronizeAllWithAll(
  seriesManager: SeriesManager,
  model: Pick<ChartModelFragment, "instrumentsSeries">
): void {
  let longestLength = 1;
  const stampIndex: Record<string, Record<number, number>> = {};
  const stamps: Record<number, number> = {};

  for (const instrumentSeries of model.instrumentsSeries) {
    const id = instrumentSeries.seriesId;
    const series = seriesManager[id];

    if (!series) continue;
    if (series.data.length > longestLength) longestLength = series.data.length;

    stampIndex[id] = {};
    for (let index = 0; index < series.data.length; index += 1) {
      stampIndex[id][series.data[index].stamp] = index;
      stamps[series.data[index].stamp] = series.data[index].stamp;
    }
  }

  const stampsArray = Object.keys(stamps).sort((a, b) => Number(a) - Number(b));

  const lastValue: Record<string, OhlcvCandle> = {};

  for (let index = 0; index < stampsArray.length; index += 1) {
    const stamp = Number(stampsArray[index]);

    for (const instrumentSeries of model.instrumentsSeries) {
      const id = instrumentSeries.seriesId;
      const series = seriesManager[id];

      if (!series || series.data.length === 0) continue;

      if (index === 0) {
        lastValue[id] = series.data[0];
      }

      const value = series.data[index];
      if (!value || !value.stamp || value.stamp !== stamp) {
        const candle: OhlcvCandle = {
          c: lastValue[id].c,
          h: lastValue[id].c,
          l: lastValue[id].c,
          o: lastValue[id].c,
          stamp,
          v: 0,
          i: 0,
        };
        series.data.splice(index, 0, candle);
      } else {
        lastValue[id] = series.data[index];
      }
    }
  }
}

function createStrategyToExport(o: ChartPanelObject, chart: ChartLike) {
  const model = chart.model;
  const strategy = {
    series: [] as Array<{
      id: string;
      title?: string;
      instrument?: Instrument;
      interval?: Interval;
      fields: string[];
      labels: string[] | Record<string, string>;
    }>,
    mainStrategy: { id: o.id, dataLink: o.dataLink, dataField: o.dataField },
    scripts: model.scripts,
  };

  const seriesManager = chart.fusion.getSeriesManager();
  for (const key in seriesManager) {
    if (Object.prototype.hasOwnProperty.call(seriesManager, key) && seriesManager[key].instrument) {
      strategy.series.push({
        id: seriesManager[key].seriesId,
        title: seriesManager[key].title,
        instrument: seriesManager[key].instrument,
        interval: seriesManager[key].interval,
        fields: seriesManager[key].fields,
        labels: seriesManager[key].labels,
      });
    }
  }

  return strategy;
}

function getPlottersForScriptByScriptId(
  model: Pick<ChartModelFragment, "scripts" | "panels">,
  scriptId: string | number
): ChartPanelObject[] {
  let script: ScriptModelConfig | null = null;

  for (let index = 0; index < (model.scripts || []).length; index += 1) {
    if ((model.scripts || [])[index].id === scriptId) {
      script = (model.scripts || [])[index];
      break;
    }
  }

  const plotters: ChartPanelObject[] = [];
  if (script === null) return plotters;

  for (let panelIndex = 0; panelIndex < model.panels.length; panelIndex += 1) {
    for (
      let objectIndex = 0;
      objectIndex < model.panels[panelIndex].objects.length;
      objectIndex += 1
    ) {
      const panelObject = model.panels[panelIndex].objects[objectIndex];
      if (panelObject.dataLink) {
        for (const key in script.outputs) {
          if (panelObject.dataLink === script.outputs[key]) {
            plotters.push(panelObject);
          }
        }
      }
    }
  }

  return plotters;
}

function createOhlcvModel(id: string, instrument: Instrument, interval: Interval): SeriesModel {
  return {
    seriesId: id,
    title: instrument.symbol,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    data: null,
    instrument,
    interval,
  };
}

function florStampToInterval(tickStamp: number, interval: Interval, lastStamp?: number): number {
  let milis = interval.milis;

  if (interval.symbol === "1W") {
    const stampMod = tickStamp + new Date().getTimezoneOffset() * 60 * 1000;
    const date = new Date(stampMod);
    const day = date.getDay();
    const floored = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + (day === 0 ? 0 : -day),
      0,
      0,
      0,
      0
    );
    return floored.getTime() - floored.getTimezoneOffset() * 60 * 1000;
  }

  if (interval.symbol === "1M") {
    const stampMod = tickStamp + new Date().getTimezoneOffset() * 60 * 1000;
    const date = new Date(stampMod);
    const floored = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    return floored.getTime() - floored.getTimezoneOffset() * 60 * 1000;
  }

  if (milis > 0) {
    if (lastStamp) {
      return tickStamp - ((tickStamp - lastStamp) % milis);
    }

    return tickStamp - (tickStamp % milis);
  }

  throw new Error("Invalid interval / milis");
}

function getIntervalInMilis(stamp: number, interval: Interval): number | null {
  let milis = interval.milis;

  if (milis < 0) {
    const stampMod = stamp + new Date().getTimezoneOffset() * 60 * 1000;
    if (interval.symbol === "1M") {
      const date = new Date(stampMod);
      const from = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      milis = to.getTime() - from.getTime();
    } else {
      return null;
    }
  }

  return milis;
}

function getUniqueId(): string {
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
}

class ValueConverterLin implements AxisValueConverter {
  realToAxis(rV: number): number {
    return rV;
  }

  axisToReal(aV: number): number {
    return aV;
  }
}

class ValueConverterPerc implements AxisValueConverter {
  realToAxis(rV: number, fV = 0): number {
    try {
      return 100 + (100 * (rV - fV)) / fV;
    } catch (error) {
      console.error(`ValueConverterPerc->realToAxis:${error}`);
      return 0;
    }
  }

  axisToReal(aV: number, fV = 0): number {
    try {
      return (aV * fV) / 100;
    } catch (error) {
      console.error(`ValueConverterPerc->axisToreal:${error}`);
      return 0;
    }
  }
}

class ValueConverterLog implements AxisValueConverter {
  realToAxis(rV: number): number {
    try {
      const value = Math.log10(rV);
      if (Number.isNaN(value) || value === -Infinity || value === Infinity) {
        return 0;
      }
      return value;
    } catch (error) {
      console.error(`ValueConverterLog->realToAxis:${error}`);
      return 0;
    }
  }

  axisToReal(aV: number): number {
    try {
      const value = Math.pow(10, aV);
      if (Number.isNaN(value) || value === -Infinity || value === Infinity) {
        return 0;
      }
      return value;
    } catch (error) {
      console.error(`ValueConverterLog->axisToreal:${error}`);
      return 0;
    }
  }
}

const converterLog = new ValueConverterLog();
const converterLin = new ValueConverterLin();
const converterPerc = new ValueConverterPerc();

class ValueConverter implements AxisValueConverter {
  mode: string;
  cnv: AxisValueConverter;

  constructor(mode: string) {
    this.mode = mode;
    if (mode === "perc") {
      this.cnv = converterPerc;
    } else if (mode === "log") {
      this.cnv = converterLog;
    } else {
      this.cnv = converterLin;
    }
  }

  realToAxis(rV: number, fV?: number): number {
    return this.cnv.realToAxis(rV, fV);
  }

  axisToReal(aV: number, rV?: number): number {
    return this.cnv.axisToReal(aV, rV);
  }
}

function getPanelPrimarySeriesField(
  panel: { main?: boolean; objects?: ChartPanelObject[] },
  seriesManager: SeriesManager,
): { dataLink: string; dataField: string } | null {
  if (panel.main === true || !Array.isArray(panel.objects)) {
    return null;
  }

  for (const panelObject of panel.objects) {
    const dataLink = panelObject.dataLink ? String(panelObject.dataLink) : "";
    const dataField = panelObject.dataField ? String(panelObject.dataField) : "";

    if (
      (panelObject.type === "SeriesObject" || panelObject.type === "IndicatorObject") &&
      dataLink &&
      dataField &&
      seriesManager[dataLink]?.data?.length
    ) {
      return { dataLink, dataField };
    }
  }

  return null;
}

function getPanelReferenceValue(
  panel: { main?: boolean; objects?: ChartPanelObject[] },
  model: Pick<ChartModelFragment, "mainSeries" | "_leftIndex" | "_rightIndex">,
  seriesManager: SeriesManager,
): number | null {
  const primarySeries = getPanelPrimarySeriesField(panel, seriesManager);

  if (!primarySeries) {
    return null;
  }

  try {
    return getFirstAvailableValue(
      model,
      seriesManager[primarySeries.dataLink].data as DataPoint[],
      primarySeries.dataField,
    );
  } catch (_error) {
    return null;
  }
}

function getReferenceValue(
  o: ChartPanelObject,
  model: Pick<ChartModelFragment, "mainSeries" | "_leftIndex" | "_rightIndex">,
  seriesManager: SeriesManager,
): number | null {
  let link = o.dataLink;
  let field = o.dataField;

  if (field === "BBMiddle") field = null;

  if (
    o.type === "StrategyObject" ||
    o.type === "CandlestickPatternStrategyObject" ||
    o.type === "FractalsObject"
  ) {
    link = model.mainSeries;
    field = "c";
  }

  if (!(link && field) || o.reference) {
    if (o.reference) {
      const reference = o.reference.split(":");
      link = reference[0];
      field = reference[1];
    } else {
      link = model.mainSeries;
      field = "c";
    }
  }

  if (!(link && field) || !seriesManager[link]) return null;

  try {
    return getFirstAvailableValue(model, seriesManager[link].data as DataPoint[], field);
  } catch (_error) {
    return null;
  }
}

function getFirstAvailableValue(
  model: Pick<ChartModelFragment, "_leftIndex" | "_rightIndex">,
  data: DataPoint[],
  field: string
): number | null {
  if (model._leftIndex < model._rightIndex) {
    for (let index = model._leftIndex; index < model._rightIndex; index += 1) {
      if (data[index] && data[index][field]) return data[index][field] as number;
    }
  } else {
    for (let index = model._leftIndex; index > model._rightIndex; index -= 1) {
      if (data[index] && data[index][field]) return data[index][field] as number;
    }
  }

  return null;
}

type OhlcDataFieldObject = {
  openDataField?: string | null;
  highDataField?: string | null;
  lowDataField?: string | null;
  closeDataField?: string | null;
  dataField?: string | null;
};

function ensureInstrumentOhlcDataFields(object: OhlcDataFieldObject): void {
  if (
    object.openDataField &&
    object.highDataField &&
    object.lowDataField &&
    object.closeDataField
  ) {
    return;
  }

  const baseField = object.dataField ?? "c";
  if (baseField !== "c") return;

  if (!object.openDataField) object.openDataField = "o";
  if (!object.highDataField) object.highDataField = "h";
  if (!object.lowDataField) object.lowDataField = "l";
  if (!object.closeDataField) object.closeDataField = "c";
}

function synchronizeArraysByObjId<
  T extends { id?: string | number; drag?: boolean; [key: string]: unknown },
>(src: T[], dst: T[]): void {
  const newDest = dst.filter((item) => getObjById(src, item.id) !== null);
  dst.splice(0, dst.length);
  newDest.forEach((item) => dst.push(item));

  for (let index = 0; index < src.length; index += 1) {
    const current = getObjById(dst, src[index].id);
    if (!current) {
      dst.push(src[index]);
    } else {
      updateOneByOther(current, src[index]);
    }
  }

  function updateOneByOther(target: T, source: T): T {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && !target.drag) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function getObjById(arr: T[], id?: string | number): T | null {
    for (let index = 0; index < arr.length; index += 1) {
      if (arr[index] && arr[index].id && arr[index].id === id) return arr[index];
    }
    return null;
  }
}

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function validateIntervalSymbolForInstrument(
  instrument: Instrument,
  intervalSymbol: string
): Interval | false {
  for (const interval of instrument.availableIntervals || []) {
    if (interval.symbol === intervalSymbol) return interval;
  }
  return false;
}

function validateIntervalSymbol(
  instrument: InstrumentWithDefaultInterval,
  intervalSymbol: string
): Interval | undefined {
  let firstInterval = instrument.defaultInterval;

  for (const interval of instrument.availableIntervals || []) {
    firstInterval = firstInterval || interval;
    if (interval.symbol === intervalSymbol) return interval;
  }

  return firstInterval;
}

if (
  typeof CanvasRenderingContext2D !== "undefined" &&
  !CanvasRenderingContext2D.prototype.rectRound
) {
  CanvasRenderingContext2D.prototype.rectRound = function rectRound(
    x: number,
    y: number,
    w: number,
    h: number,
    r1: number,
    r2: number,
    r3: number,
    r4: number
  ) {
    if (w < 2 * r1) r1 = w / 2;
    if (h < 2 * r1) r1 = h / 2;
    this.beginPath();
    this.moveTo(x + r1, y);
    this.arcTo(x + w, y, x + w, y + h, r1);
    this.arcTo(x + w, y + h, x, y + h, r2);
    this.arcTo(x, y + h, x, y, r3);
    this.arcTo(x, y, x + w, y, r4);
    this.closePath();
    return this;
  };
}

function resizeImage(
  image: string,
  onSuccess: (base64Image: string) => void,
  width = 300,
  height = 150
): void {
  const img = new Image();
  img.src = image;
  img.onload = function onLoad() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = width;
    canvas.height = height;

    context.drawImage(img, 0, 0, width, height);
    const base64image = canvas.toDataURL();
    onSuccess(base64image);
  };
}

function getSortedKeys(
  orderModel: string[] | null | undefined,
  object: Record<string, unknown>
): string[] {
  const objectKeys = Object.keys(object);
  if (!orderModel) return objectKeys;

  const sortedKeys: string[] = [];
  for (let index = 0; index < orderModel.length; index += 1) {
    const modelKey = orderModel[index];
    const objectIndex = objectKeys.indexOf(modelKey);
    if (objectIndex > -1) {
      sortedKeys.push(objectKeys.splice(objectIndex, 1)[0]);
    }
  }

  return objectKeys.concat(sortedKeys);
}

function groupBy<T extends Record<string, unknown>>(
  property: keyof T,
  array: T[]
): Record<string, T> {
  const map: Record<string, T> = {};
  for (let index = 0; index < array.length; index += 1) {
    map[String(array[index][property])] = array[index];
  }
  return map;
}

function getMilisFromIntervalSymbol(symbol: string): number | undefined {
  switch (symbol) {
    case "1m":
      return 60000;
    case "5m":
      return 300000;
    case "15m":
      return 900000;
    case "30m":
      return 1800000;
    case "1h":
      return 3600000;
    case "1D":
      return 86400000;
    case "1W":
      return 604800000;
    default:
      return undefined;
  }
}

const LIB = {
  getNumberMagnitude,
  nFormatter,
  round,
  getObjectById,
  getRawSeriesWrapper,
  getOHLCSeriesWrapper,
  synchronizeSeries,
  synchronizeAllWithAll,
  createStrategyToExport,
  getPlottersForScriptByScriptId,
  createOhlcvModel,
  florStampToInterval,
  getIntervalInMilis,
  getUniqueId,
  ValueConverterLin,
  ValueConverterPerc,
  ValueConverterLog,
  _converterLog: converterLog,
  _converterLin: converterLin,
  _converterPerc: converterPerc,
  ValueConverter,
  getReferenceValue,
  getPanelPrimarySeriesField,
  getPanelReferenceValue,
  getFirstAvailableValue,
  ensureInstrumentOhlcDataFields,
  synchronizeArraysByObjId,
  capitalizeFirstLetter,
  validateIntervalSymbolForInstrument,
  validateIntervalSymbol,
  resizeImage,
  getSortedKeys,
  groupBy,
  getMilisFromIntervalSymbol,
};

export default LIB;
