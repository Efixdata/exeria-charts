import WEBRCP from "../../WebRCP";
import { resolveChartLocaleMessage } from "../../chartLocaleRuntime";
import FUSION from "../../fusion";
import LIB from "../../utils/chartingCommons";
import {
  isPointInCircle,
} from "../../utils/objects-lib";
import imageCandleChartWhite from "../../img/icons/candle_chart_white.svg";
import { getScriptTitle, isSeriesHitPoint } from "./_sharedTypes";
import type { LegacySeriesObject } from "../../objectRuntimeBases";
import type {
  PatternStrategyRuntime,
  RuntimeObjectConstructor,
  SeriesManagerContext,
  SeriesModelContext,
  SeriesPanelContext,
  SeriesRendererContext,
  SeriesRuntime,
  SeriesStrategyValueRange,
  SeriesTooltipData,
} from "./_sharedTypes";

function getLinkedSeries(
  object: LegacySeriesObject & { dataLink?: string },
  seriesManager: SeriesManagerContext,
) {
  if (!object.dataLink) return null;
  return seriesManager[object.dataLink] ?? null;
}

function getStrategyField(
  object: LegacySeriesObject & { dataField?: string | null },
  forceField?: string,
) {
  return forceField ?? object.dataField ?? null;
}

function getStrategyValue(value: unknown) {
  return typeof value === "number" ? value : null;
}

type StrategyColorObject = LegacySeriesObject & {
  buyColor?: string;
  sellColor?: string;
};

function getStrategyBuyColor(object: StrategyColorObject): string {
  if (typeof object.buyColor === "string" && object.buyColor.length > 0) {
    return object.buyColor;
  }

  return WEBRCP.utils.colorManager.getColor("buyColor");
}

function getStrategySellColor(object: StrategyColorObject): string {
  if (typeof object.sellColor === "string" && object.sellColor.length > 0) {
    return object.sellColor;
  }

  return WEBRCP.utils.colorManager.getColor("sellColor");
}

function getAuxPanelMarkerY(
  panel: SeriesPanelContext,
  strategyValue: number,
): SeriesStrategyValueRange {
  let upRatio = 0.15;
  let dnRatio = 0.85;

  if (strategyValue === FUSION.EXIT_LONG || strategyValue === FUSION.EXIT_SHORT) {
    upRatio = 0.12;
    dnRatio = 0.88;
  } else if (strategyValue === FUSION.EXIT_ALL) {
    upRatio = 0.1;
    dnRatio = 0.9;
  }

  return {
    up: panel._offset + panel._height * upRatio,
    dn: panel._offset + panel._height * dnRatio,
  };
}

var StrategyObject = function (this: SeriesRuntime) {
  this.downRenderedValues = [1, 2, -3];
  this.upperRenderedValues = [-1, -2, -3];

  this.getMenuItems = function () {
    return null;
  };

  this.render = function (
    o: LegacySeriesObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext,
    forceField?: string,
  ) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return false;

    renderer.validateSeriesBeforeRender(linkedSeries);

    var indexX = 0;
    var midX = 0;

    const stroke = o.color ?? WEBRCP.utils.colorManager.getColor("fontColor");
    const field = getStrategyField(o, forceField);
    if (!field) return false;

    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = o.width;

    this._activeStrategyObject = o;

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > linkedSeries.data.length - 1) continue;

      const strategyValue = getStrategyValue(linkedSeries.data[i][field]);
      if (strategyValue === null || strategyValue == FUSION.DO_NOTHING) continue;

      indexX = renderer.getIndexPoint(i, model);
      //valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
      const valuesY = this.getPointY4StrategyValue(
        o,
        i,
        strategyValue,
        panel,
        renderer,
        model,
        seriesManager
      );

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      if (strategyValue == FUSION.BUY) this.drawBuy(ctx, midX, valuesY.dn);
      else if (strategyValue == FUSION.SELL) this.drawSell(ctx, midX, valuesY.up);
      else if (strategyValue == FUSION.EXIT_LONG)
        drawExitLong(ctx, midX, valuesY.dn, getStrategyBuyColor(o));
      else if (strategyValue == FUSION.EXIT_SHORT)
        drawExitShort(ctx, midX, valuesY.up, getStrategySellColor(o));
      else if (strategyValue == FUSION.EXIT_ALL) {
        this.drawExitAll(ctx, midX, valuesY.up, "up");
        this.drawExitAll(ctx, midX, valuesY.dn, "down");
      }
    }
    this._activeStrategyObject = null;
    //ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  };

  this.postRender = function () {};

  this.renderOverlay = function (o, ctx, renderer, model, panel, seriesManager) {
    if (o.selected) {
      this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
    }

    if (isSeriesHitPoint(o._hit)) this.drawHit(o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderPriceTag = function () {};

  this.getToolTip = function (o, index, model, seriesManager, scriptManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return null;

    const dataPoint = linkedSeries.data[index];
    if (!dataPoint) return null;

    const values: SeriesTooltipData["values"] = [];
    const { fields, labels } = linkedSeries;

    fields.forEach((field, fieldIndex) => {
      const label = Array.isArray(labels) ? (labels[fieldIndex] ?? field) : (labels[field] ?? field);
      var v =
        valToString(dataPoint[field]) +
        " (" +
        dataPoint.strength +
        ")";
      values.push({
        label: resolveChartLocaleMessage(label, label),
        value: v,
      });
    });

    const data: SeriesTooltipData = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: dataPoint.stamp,
      values: values,
    };

    return data;

    function valToString(v: unknown) {
      switch (v) {
        case 1:
          return "BUY";
        case -1:
          return "SELL";
        case 2:
          return "EXIT LONG";
        case -2:
          return "EXIT SHORT";
        case -3:
          return "EXIT ALL";
        default:
          return v;
      }
    }
  };

  this.drawSelectionLine = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = getStrategyField(o, forceField);
    if (!linkedSeries || !field) return;

    var indexX = 0;
    var valuesY: SeriesStrategyValueRange = { up: 0, dn: 0 };
    var midX = 0;

    ctx.save();
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > linkedSeries.data.length - 1) continue;

      const strategyValue = getStrategyValue(linkedSeries.data[i][field]);
      if (strategyValue === null || strategyValue == FUSION.DO_NOTHING) continue;

      indexX = renderer.getIndexPoint(i, model);
      //valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
      valuesY = this.getPointY4StrategyValue(
        o,
        i,
        strategyValue,
        panel,
        renderer,
        model,
        seriesManager
      );

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      ctx.beginPath();
      if (strategyValue == FUSION.BUY) ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
      else if (strategyValue == FUSION.SELL) ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
      else if (strategyValue == FUSION.EXIT_LONG)
        ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
      else if (strategyValue == FUSION.EXIT_SHORT)
        ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
      else if (strategyValue == FUSION.EXIT_ALL) {
        ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
        ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
      }
      ctx.fill();
    }

    ctx.restore();
  };

  this.drawHit = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    try {
      if (!isSeriesHitPoint(o._hit)) return;

      const linkedSeries = getLinkedSeries(o, seriesManager);
      const field = getStrategyField(o, forceField);
      if (!linkedSeries || !field) return;

      var index = renderer.getPointIndex(o._hit.x, model);
      var x = renderer.getIndexPoint(index, model) + model.periodWidth / 2;
      var r = 5;
      const strategyValue = getStrategyValue(linkedSeries.data[index]?.[field]);
      if (strategyValue === null) return;
      var valuesY = this.getPointY4StrategyValue(
        o,
        index,
        strategyValue,
        panel,
        renderer,
        model,
        seriesManager
      );

      if (this.downRenderedValues.indexOf(strategyValue) >= 0) renderPoint(ctx, x, valuesY.dn, r);

      if (this.upperRenderedValues.indexOf(strategyValue) >= 0) renderPoint(ctx, x, valuesY.up, r);
    } catch (e) {
      console.log("Cant render series hit point", e);
    }

    function renderPoint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("hitColor");
      ctx.globalAlpha = 0.7;
      ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  };

  this.updateExtremes = function () {
    return null;

    //		var updateMax = extremes.max;
    //		var updateMin = extremes.min;
    //		if(o._lastExtremes)
    //			if(o._lastExtremes.up == updateMax || o._lastExtremes.dn == updateMin)
    //				o._lastExtremes = null;
    //
    //		for (var i=model._leftIndex; i<model._rightIndex; i++) {
    //			if (seriesManager[o.dataLink]==undefined || i>seriesManager[o.dataLink].data.length-1) {
    //				continue;
    //			}
    //
    //			var strategyValue = seriesManager[o.dataLink].data[i][o.dataField];
    //			if(strategyValue==FUSION.DO_NOTHING) continue;
    //			if(updateMax < vs.up) updateMax = vs.up;
    //			if(updateMin > vs.dn) updateMin = vs.dn;
    //		}
    //		if(o._lastExtremes){
    //			var p = model.instrumentsSeries[0].instrument.precision;
    //			if(Math.abs(Math.abs(o._lastExtremes.up)-Math.abs(extremes.max)) > 1/Math.pow(10,p)){
    //				extremes.max = updateMax;
    //				o._lastExtremes.up = updateMax;
    //			}
    //			if(Math.abs(Math.abs(o._lastExtremes.dn)-Math.abs(extremes.min)) > 1/Math.pow(10,p)){
    //				extremes.min = updateMin;
    //				o._lastExtremes.dn = updateMin;
    //			}
    //		}else{
    //			o._lastExtremes = {up: updateMax, dn: updateMin};
    //			extremes.max = updateMax;
    //			extremes.min = updateMin;
    //		}
  };

  this.getValuesY4StrategyValue = function (
    o,
    index,
    strategyValue,
    panel,
    renderer,
    model,
    seriesManager
  ) {
    var sv = { up: Number.MIN_VALUE, dn: Number.MAX_VALUE };
    var seriesObjectTarget = null;
    if (panel) {
      for (var i = 0; i < panel.objects.length; i++) {
        const panelObject = panel.objects[i];
        const panelLink = panelObject["dataLink"];
        if (
          panelObject.type &&
          panelObject.type == "SeriesObject" &&
          typeof panelLink === "string" &&
          seriesManager[panelLink]?.data[index]
        ) {
          seriesObjectTarget = panelObject;
          break;
        }
      }
    }

    if (!seriesObjectTarget) {
      const mainSeriesKey = model.mainSeries;
      if (
        typeof mainSeriesKey === "string" &&
        seriesManager[mainSeriesKey]?.data?.[index]
      ) {
        seriesObjectTarget = { type: "SeriesObject", dataLink: mainSeriesKey };
      }
    }

    if (seriesObjectTarget) {
      var seriesObject = renderer.objects["SeriesObject"];
      var max = seriesObject.getMax(index, seriesObjectTarget, seriesManager);
      var min = seriesObject.getMin(index, seriesObjectTarget, seriesManager);

      var fV = LIB.getReferenceValue(seriesObjectTarget, model, seriesManager);
      var vup =
        renderer.getYCoordinateForPrice(max, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      var vdn =
        renderer.getYCoordinateForPrice(min, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (strategyValue == FUSION.BUY || strategyValue == FUSION.SELL) {
        vup -= 10;
        vdn += 10;
      } else if (strategyValue == FUSION.EXIT_LONG || strategyValue == FUSION.EXIT_SHORT) {
        vup -= 22;
        vdn += 22;
      } else {
        vup -= 36;
        vdn += 36;
      }
      max = renderer.getPriceForYCoordinate(vup - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      });

      min = renderer.getPriceForYCoordinate(vdn - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      });

      sv = { up: max, dn: min };
    } else {
      sv = { up: 1, dn: -1 };
    }
    return sv;
  };

  this.getPointY4StrategyValue = function (
    o,
    index,
    strategyValue,
    panel,
    renderer,
    model,
    seriesManager
  ) {
    if (panel.main !== true) {
      return getAuxPanelMarkerY(panel, strategyValue);
    }

    var sv = this.getValuesY4StrategyValue(
      o,
      index,
      strategyValue,
      panel,
      renderer,
      model,
      seriesManager
    );
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var vup =
      renderer.getYCoordinateForPrice(sv.up, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    var vdn =
      renderer.getYCoordinateForPrice(sv.dn, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    return { up: vup, dn: vdn };
  };

  this.drawBuy = function (ctx, midX, valueY) {
    var offset = 0;
    const object = this._activeStrategyObject as StrategyColorObject | null;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = object ? getStrategyBuyColor(object) : WEBRCP.utils.colorManager.getColor("buyColor");

    // #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
    midX -= 0.5;
    valueY -= 0.5;

    ctx.beginPath();
    ctx.moveTo(midX - 5, valueY + 4 + offset);
    ctx.lineTo(midX + 5, valueY + 4 + offset);
    ctx.lineTo(midX, valueY - 4 + offset);
    ctx.lineTo(midX - 5, valueY + 4 + offset);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };

  this.drawSell = function (ctx, midX, valueY) {
    var offset = 0;
    const object = this._activeStrategyObject as StrategyColorObject | null;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = object ? getStrategySellColor(object) : WEBRCP.utils.colorManager.getColor("sellColor");

    // #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
    midX -= 0.5;
    valueY -= 0.5;

    ctx.beginPath();
    ctx.moveTo(midX - 5, valueY - 4 + offset);
    ctx.lineTo(midX + 5, valueY - 4 + offset);
    ctx.lineTo(midX, valueY + 4 + offset);
    ctx.lineTo(midX - 5, valueY - 4 + offset);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };

  function drawExitShort(
    ctx: CanvasRenderingContext2D,
    midX: number,
    valueY: number,
    color: string,
  ) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    var offset = -2;
    ctx.moveTo(midX - 4, valueY + 4 + offset);
    ctx.lineTo(midX, valueY + offset);
    ctx.lineTo(midX + 4, valueY + 6 + offset);
    ctx.lineTo(midX, valueY + 6 + offset);
    ctx.moveTo(midX + 4, valueY + 6 + offset);
    ctx.lineTo(midX + 4, valueY + 2 + offset);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  function drawExitLong(
    ctx: CanvasRenderingContext2D,
    midX: number,
    valueY: number,
    color: string,
  ) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    var offset = +2;
    ctx.moveTo(midX - 4, valueY - 4 + offset);
    ctx.lineTo(midX, valueY + offset);
    ctx.lineTo(midX + 4, valueY - 6 + offset);
    ctx.lineTo(midX, valueY - 6 + offset);
    ctx.moveTo(midX + 4, valueY - 6 + offset);
    ctx.lineTo(midX + 4, valueY - 2 + offset);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  this.drawExitAll = function (ctx, midX, valueY) {
    const object = this._activeStrategyObject as StrategyColorObject | null;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = object
      ? getStrategySellColor(object)
      : WEBRCP.utils.colorManager.getColor("exitAllColor");
    ctx.beginPath();
    var offset = 0;
    ctx.moveTo(midX - 3, valueY - 3 + offset);
    ctx.lineTo(midX + 3, valueY + 3 + offset);
    ctx.moveTo(midX - 3, valueY + 3 + offset);
    ctx.lineTo(midX + 3, valueY - 3 + offset);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    if (o.hidden == true) return false;

    this.clearHits(o);

    var self = this;
    var hitResult = false;
    var index = renderer.getPointIndex(x, model);
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = getStrategyField(o);
    if (!linkedSeries || !field) return false;

    if (index > linkedSeries.data.length - 1) return false;

    const strategyValue = getStrategyValue(linkedSeries.data[index][field]);
    if (strategyValue === null || strategyValue == FUSION.DO_NOTHING) return false;

    var pointX = renderer.getIndexPoint(index, model) + model._midOffset;
    var pointsY = this.getPointY4StrategyValue(
      o,
      index,
      strategyValue,
      panel,
      renderer,
      model,
      seriesManager
    );

    if (this.downRenderedValues.indexOf(strategyValue) >= 0) {
      hitResult = isPointInCircle({ x: pointX, y: pointsY.dn, r: 4 + self.hitTolerance }, x, y);
    }

    if (!hitResult && this.upperRenderedValues.indexOf(strategyValue) >= 0) {
      hitResult = isPointInCircle({ x: pointX, y: pointsY.up, r: 4 + self.hitTolerance }, x, y);
    }

    o._hit = hitResult ? { x: x, y: y } : false;
    return hitResult;
  };
};

var CandlestickPatternStrategyObject = function () {
  var candleStickPatternStrategyObject = new StrategyObjectCtor() as PatternStrategyRuntime;
  candleStickPatternStrategyObject.candleChartImage = new Image();
  candleStickPatternStrategyObject.candleChartImage.src = imageCandleChartWhite.src;
  candleStickPatternStrategyObject.candleChartImage.onload = function () {
    candleStickPatternStrategyObject.candleChartImage.width = 18;
    candleStickPatternStrategyObject.candleChartImage.height = 18;
  };
  candleStickPatternStrategyObject.getToolTip = function (
    o,
    index,
    model,
    seriesManager,
    scriptManager
  ) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return null;

    const dataPoint = linkedSeries.data[index];
    if (!dataPoint || !dataPoint.tooltips || typeof dataPoint.tooltips !== "object") return null;

    const values: SeriesTooltipData["values"] = [];
    const tooltips = dataPoint.tooltips as Record<string, unknown>;
    for (var tooltip in tooltips) {
      const patternLabel = resolveChartLocaleMessage(tooltip, tooltip);
      values.push({
        label: patternLabel + ": " + valToString(tooltips[tooltip]),
        value: null,
      });
    }

    const data: SeriesTooltipData = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: dataPoint.stamp,
      values: values,
    };

    return data;

    function valToString(v: unknown) {
      switch (v) {
        case 1:
          return "BUY";
        case -1:
          return "SELL";
        case 2:
          return "EXIT LONG";
        case -2:
          return "EXIT SHORT";
        case -3:
          return "EXIT ALL";
        default:
          return v;
      }
    }
  };

  candleStickPatternStrategyObject.drawSell = function (ctx, midX, valueY) {
    var offset = 0;
    const object = this._activeStrategyObject as StrategyColorObject | null;
    const sellColor = object
      ? getStrategySellColor(object)
      : WEBRCP.utils.colorManager.getColor("sellColor");
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = sellColor;
    ctx.strokeStyle = sellColor;

    // #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
    midX -= 0.5;
    valueY -= 0.5;

    ctx.beginPath();
    ctx.moveTo(midX - 5, valueY - 4 + offset);
    ctx.lineTo(midX + 5, valueY - 4 + offset);
    ctx.lineTo(midX, valueY + 4 + offset);
    ctx.lineTo(midX - 5, valueY - 4 + offset);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
    ctx.beginPath();
    ctx.arc(midX, valueY - 24, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 0.87;
    ctx.drawImage(
      this.candleChartImage,
      midX - 9,
      valueY - 33,
      this.candleChartImage.width,
      this.candleChartImage.height
    );
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  candleStickPatternStrategyObject.drawBuy = function (ctx, midX, valueY) {
    var offset = 0;
    const object = this._activeStrategyObject as StrategyColorObject | null;
    const buyColor = object
      ? getStrategyBuyColor(object)
      : WEBRCP.utils.colorManager.getColor("buyColor");
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = buyColor;
    ctx.strokeStyle = buyColor;

    // #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
    midX -= 0.5;
    valueY -= 0.5;

    ctx.beginPath();
    ctx.moveTo(midX - 5, valueY + 4 + offset);
    ctx.lineTo(midX + 5, valueY + 4 + offset);
    ctx.lineTo(midX, valueY - 4 + offset);
    ctx.lineTo(midX - 5, valueY + 4 + offset);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
    ctx.beginPath();
    ctx.arc(midX, valueY + 24, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 0.87;
    ctx.drawImage(
      this.candleChartImage,
      midX - 9,
      valueY + 15,
      this.candleChartImage.width,
      this.candleChartImage.height
    );
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  candleStickPatternStrategyObject.hit = function (
    x,
    y,
    o,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  ) {
    if (o.hidden == true) return false;
    this.clearHits(o);

    var self = this;
    var hitResult = false;
    var index = renderer.getPointIndex(x, model);
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = getStrategyField(o);
    if (!linkedSeries || !field) return false;

    if (index > linkedSeries.data.length - 1) return false;

    const strategyValue = getStrategyValue(linkedSeries.data[index][field]);
    if (strategyValue === null || strategyValue == FUSION.DO_NOTHING) return false;

    var pointX = renderer.getIndexPoint(index, model) + model._midOffset;
    var pointsY = this.getPointY4StrategyValue(
      o,
      index,
      strategyValue,
      panel,
      renderer,
      model,
      seriesManager
    );

    if (this.downRenderedValues.indexOf(strategyValue) >= 0) {
      hitResult =
        isPointInCircle({ x: pointX, y: pointsY.dn, r: 4 + self.hitTolerance }, x, y) ||
        isPointInCircle({ x: pointX, y: pointsY.dn + 24, r: 12 + self.hitTolerance }, x, y);
    }

    if (!hitResult && this.upperRenderedValues.indexOf(strategyValue) >= 0) {
      hitResult =
        isPointInCircle({ x: pointX, y: pointsY.up, r: 4 + self.hitTolerance }, x, y) ||
        isPointInCircle({ x: pointX, y: pointsY.up - 24, r: 12 + self.hitTolerance }, x, y);
    }

    o._hit = hitResult ? { x: x, y: y } : false;
    return hitResult;
  };

  return candleStickPatternStrategyObject;
};

var FractalsObject = function () {
  var fractalsObject = new StrategyObjectCtor() as SeriesRuntime;

  fractalsObject.getToolTip = function (o, index, model, seriesManager, scriptManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return null;

    const dataPoint = linkedSeries.data[index];
    if (!dataPoint) return null;

    const values: SeriesTooltipData["values"] = [];
    const { fields, labels } = linkedSeries;

    fields.forEach((field, fieldIndex) => {
      const label = Array.isArray(labels) ? (labels[fieldIndex] ?? field) : (labels[field] ?? field);
      var v = valToString(dataPoint[field]);
      values.push({
        label: resolveChartLocaleMessage(label, label),
        value: v,
      });
    });

    const data: SeriesTooltipData = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: dataPoint.stamp,
      values: values,
    };

    return data;

    function valToString(v: unknown) {
      switch (v) {
        case 1:
          return "DOWN";
        case -1:
          return "UP";
        case -3:
          return "UP AND DOWN";
        default:
          return v;
      }
    }
  };

  fractalsObject.drawSell = function (ctx, midX, valueY) {
    var offset = -4;
    const object = this._activeStrategyObject as StrategyColorObject | null;
    const sellColor = object ? getStrategySellColor(object) : "#009688";
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = sellColor;
    ctx.strokeStyle = sellColor;

    midX -= 0.5;
    valueY -= 0.5;

    ctx.beginPath();
    ctx.moveTo(midX - 10, valueY + offset);
    ctx.lineTo(midX, valueY - 4 + offset);
    ctx.lineTo(midX + 10, valueY + offset);
    ctx.lineTo(midX, valueY - 16 + offset);
    ctx.lineTo(midX - 10, valueY + offset);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };

  fractalsObject.drawBuy = function (ctx, midX, valueY) {
    var offset = 4;
    const object = this._activeStrategyObject as StrategyColorObject | null;
    const buyColor = object ? getStrategyBuyColor(object) : "#e91e63";
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = buyColor;
    ctx.strokeStyle = buyColor;

    midX -= 0.5;
    valueY -= 0.5;

    ctx.beginPath();
    ctx.moveTo(midX - 10, valueY + offset);
    ctx.lineTo(midX, valueY + 4 + offset);
    ctx.lineTo(midX + 10, valueY + offset);
    ctx.lineTo(midX, valueY + 16 + offset);
    ctx.lineTo(midX - 10, valueY + offset);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };

  fractalsObject.drawExitAll = function (ctx, midX, valueY, position) {
    if (position == "up") {
      fractalsObject.drawSell(ctx, midX, valueY + 26);
    } else {
      fractalsObject.drawBuy(ctx, midX, valueY - 26);
    }
  };

  fractalsObject.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    if (o.hidden == true) return false;

    this.clearHits(o);

    var self = this;
    var hitResult = false;
    var index = renderer.getPointIndex(x, model);
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = getStrategyField(o);
    if (!linkedSeries || !field) return false;

    if (index > linkedSeries.data.length - 1) return false;

    const strategyValue = getStrategyValue(linkedSeries.data[index][field]);
    if (strategyValue === null || strategyValue == FUSION.DO_NOTHING) return false;

    var pointX = renderer.getIndexPoint(index, model) + model._midOffset;
    var pointsY = this.getPointY4StrategyValue(
      o,
      index,
      strategyValue,
      panel,
      renderer,
      model,
      seriesManager
    );
    pointsY.up -= 12;
    pointsY.dn += 12;

    if (strategyValue == FUSION.EXIT_ALL) {
      pointsY.up += 26;
      pointsY.dn -= 26;
    }

    if (this.downRenderedValues.indexOf(strategyValue) >= 0) {
      hitResult = isPointInCircle({ x: pointX, y: pointsY.dn, r: 8 + self.hitTolerance }, x, y);
    }

    if (!hitResult && this.upperRenderedValues.indexOf(strategyValue) >= 0) {
      hitResult = isPointInCircle({ x: pointX, y: pointsY.up, r: 8 + self.hitTolerance }, x, y);
    }

    o._hit = hitResult ? { x: x, y: y } : false;
    return hitResult;
  };

  fractalsObject.drawSelectionLine = function (
    o,
    ctx,
    renderer,
    model,
    panel,
    seriesManager,
    forceField
  ) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = getStrategyField(o, forceField);
    if (!linkedSeries || !field) return;

    var indexX = 0;
    var valuesY: SeriesStrategyValueRange = { up: 0, dn: 0 };
    var midX = 0;

    ctx.save();
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > linkedSeries.data.length - 1) continue;

      const strategyValue = getStrategyValue(linkedSeries.data[i][field]);
      if (strategyValue === null || strategyValue == FUSION.DO_NOTHING) continue;

      indexX = renderer.getIndexPoint(i, model);
      //valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
      valuesY = this.getPointY4StrategyValue(
        o,
        i,
        strategyValue,
        panel,
        renderer,
        model,
        seriesManager
      );
      valuesY.up -= 12;
      valuesY.dn += 10;

      if (strategyValue == FUSION.EXIT_ALL) {
        valuesY.up += 26;
        valuesY.dn -= 26;
      }

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      ctx.beginPath();

      if (strategyValue == FUSION.BUY) ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
      else if (strategyValue == FUSION.SELL) ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
      else if (strategyValue == FUSION.EXIT_ALL) {
        ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
        ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
      }

      ctx.fill();
    }

    ctx.restore();
  };

  fractalsObject.drawHit = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    try {
      if (!isSeriesHitPoint(o._hit)) return;

      const linkedSeries = getLinkedSeries(o, seriesManager);
      const field = getStrategyField(o, forceField);
      if (!linkedSeries || !field) return;

      var index = renderer.getPointIndex(o._hit.x, model);
      var x = renderer.getIndexPoint(index, model) + model.periodWidth / 2;
      var r = 5;
      const strategyValue = getStrategyValue(linkedSeries.data[index]?.[field]);
      if (strategyValue === null) return;
      var valuesY = this.getPointY4StrategyValue(
        o,
        index,
        strategyValue,
        panel,
        renderer,
        model,
        seriesManager
      );
      valuesY.up -= 12;
      valuesY.dn += 10;

      if (strategyValue == FUSION.EXIT_ALL) {
        valuesY.up += 26;
        valuesY.dn -= 26;
      }

      if (this.downRenderedValues.indexOf(strategyValue) >= 0) renderPoint(ctx, x, valuesY.dn, r);

      if (this.upperRenderedValues.indexOf(strategyValue) >= 0) renderPoint(ctx, x, valuesY.up, r);
    } catch (e) {
      console.log("Cant render series hit point", e);
    }

    function renderPoint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("hitColor");
      ctx.globalAlpha = 0.7;
      ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  };

  return fractalsObject;
};

const StrategyObjectCtor = StrategyObject as unknown as RuntimeObjectConstructor<SeriesRuntime>;
const CandlestickPatternStrategyObjectCtor =
  CandlestickPatternStrategyObject as unknown as RuntimeObjectConstructor<PatternStrategyRuntime>;
const FractalsObjectCtor = FractalsObject as unknown as RuntimeObjectConstructor<PatternStrategyRuntime>;
export {
  StrategyObjectCtor as StrategyObject,
  CandlestickPatternStrategyObjectCtor as CandlestickPatternStrategyObject,
  FractalsObjectCtor as FractalsObject,
};
