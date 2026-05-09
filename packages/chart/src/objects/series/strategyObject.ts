import WEBRCP from "../../WebRCP";
import FUSION from "../../fusion";
import LIB from "../../utils/chartingCommons";
import {
  isPointInCircle,
} from "../../utils/objects-lib";
import imageCandleChartWhite from "../../img/icons/candle_chart_white.svg";
import { getScriptTitle } from "./_sharedTypes";
import type { SeriesRuntime, PatternStrategyRuntime } from "./_sharedTypes";

var StrategyObject = function (this: SeriesRuntime) {
  this.downRenderedValues = [1, 2, -3];
  this.upperRenderedValues = [-1, -2, -3];

  this.getMenuItems = function (o, chart) {
    return null;
  };

  this.render = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    renderer.validateSeriesBeforeRender(seriesManager[o.dataLink]);

    var indexX = 0;
    var valueY = 0;
    var midX = 0;
    var lastX = 0;

    var stroke = o.color;
    var field = o.dataField;
    if (forceField) field = forceField;

    var fV = LIB.getReferenceValue(o, model, seriesManager);
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = o.width;

    for (var i = model._leftIndex; i < model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;

      var strategyValue = seriesManager[o.dataLink].data[i][field];
      if (strategyValue == FUSION.DO_NOTHING) continue;

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
        midX = indexX + parseInt(model._midOffset);
      }

      if (strategyValue == FUSION.BUY) this.drawBuy(ctx, midX, valuesY.dn);
      else if (strategyValue == FUSION.SELL) this.drawSell(ctx, midX, valuesY.up);
      else if (strategyValue == FUSION.EXIT_LONG) drawExitLong(ctx, midX, valuesY.dn);
      else if (strategyValue == FUSION.EXIT_SHORT) drawExitShort(ctx, midX, valuesY.up);
      else if (strategyValue == FUSION.EXIT_ALL) {
        this.drawExitAll(ctx, midX, valuesY.up, "up");
        this.drawExitAll(ctx, midX, valuesY.dn, "down");
      }
      lastX = indexX;
    }
    //ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  };

  this.postRender = function (o, ctx, renderer, model, panel, seriesManager) {};

  this.renderOverlay = function (o, ctx, renderer, model, panel, seriesManager) {
    if (o.selected) {
      this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
    }

    if (o._hit && o._hit.x && o._hit.y) this.drawHit(o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderPriceTag = function (o, ctx, renderer, model, panel, seriesManager) {};

  this.getToolTip = function (o, index, model, seriesManager, scriptManager) {
    const values = [];
    const fields = seriesManager[o.dataLink].fields;
    const labels = seriesManager[o.dataLink].labels;

    for (var f in fields) {
      var v =
        valToString(seriesManager[o.dataLink].data[index][fields[f]]) +
        " (" +
        seriesManager[o.dataLink].data[index].strength +
        ")";
      values.push({
        label: WEBRCP.locale.fusion.getMessage(labels[f], labels[f]),
        value: v,
      });
    }

    var data = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: seriesManager[o.dataLink].data[index].stamp,
      values: values,
    };

    return data;

    function valToString(v: any) {
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
    var indexX = 0;
    var valuesY: any = {};
    var midX = 0;
    var lastX = 0;

    var field = o.dataField;
    if (forceField) field = forceField;
    ctx.save();
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

    for (var i = model._leftIndex; i < model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;

      var strategyValue = seriesManager[o.dataLink].data[i][field];
      if (strategyValue == FUSION.DO_NOTHING) continue;

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
        midX = indexX + parseInt(model._midOffset);
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
      lastX = midX;
    }

    ctx.restore();
  };

  this.drawHit = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    try {
      var fV = LIB.getReferenceValue(o, model, seriesManager);
      var index = renderer.getPointIndex(o._hit.x, model);
      var x = renderer.getIndexPoint(index, model) + model.periodWidth / 2;
      var r = 5;
      var field = forceField || o.dataField;

      var strategyValue = seriesManager[o.dataLink].data[index][field];
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

    function renderPoint(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      color?: string
    ) {
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

  this.updateExtremes = function (o, extremes, model, seriesManager, panel, renderer) {
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
    //
    //			var vs = getValuesY4StrategyValue(o, i, strategyValue, panel, renderer, model,seriesManager)
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
    var o = null;
    if (panel) {
      for (var i = 0; i < panel.objects.length; i++) {
        if (
          panel.objects[i].type &&
          panel.objects[i].type == "SeriesObject" &&
          seriesManager[panel.objects[i]["dataLink"]].data[index]
        ) {
          o = panel.objects[i];
          break;
        }
      }
    }

    if (o) {
      var seriesObject = renderer.objects["SeriesObject"];
      var max = seriesObject.getMax(index, o, seriesManager);
      var min = seriesObject.getMin(index, o, seriesManager);

      var fV = LIB.getReferenceValue(o, model, seriesManager);
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
    var self = this;
    var offset = 0;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("buyColor");

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
    var self = this;
    var offset = 0;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");

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

  function drawExitShort(ctx: CanvasRenderingContext2D, midX: number, valueY: number) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("sellColor");
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

  function drawExitLong(ctx: CanvasRenderingContext2D, midX: number, valueY: number) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("buyColor");
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
    var self = this;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("exitAllColor");
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

    if (index > seriesManager[o.dataLink].data.length - 1) return false;

    var strategyValue = seriesManager[o.dataLink].data[index][o.dataField];
    if (strategyValue == FUSION.DO_NOTHING) return false;

    var pointX = renderer.getIndexPoint(index, model) + parseInt(model._midOffset);
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
    const values = [];
    for (var tooltip in seriesManager[o.dataLink].data[index].tooltips) {
      values.push({
        label: WEBRCP.locale.fusion.getMessage(tooltip, tooltip).toUpperCase(),
        value: valToString(seriesManager[o.dataLink].data[index].tooltips[tooltip]),
      });
    }

    var data = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: seriesManager[o.dataLink].data[index].stamp,
      values: values,
    };

    return data;

    function valToString(v: any) {
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
    var self = this;
    var offset = 0;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("sellColor");

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
    var self = this;
    var offset = 0;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("buyColor");
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("buyColor");

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

    if (index > seriesManager[o.dataLink].data.length - 1) return false;

    var strategyValue = seriesManager[o.dataLink].data[index][o.dataField];
    if (strategyValue == FUSION.DO_NOTHING) return false;

    var pointX = renderer.getIndexPoint(index, model) + parseInt(model._midOffset);
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
    const values = [];
    const fields = seriesManager[o.dataLink].fields;
    const labels = seriesManager[o.dataLink].labels;

    for (var f in fields) {
      var v = valToString(seriesManager[o.dataLink].data[index][fields[f]]);
      values.push({
        label: WEBRCP.locale.fusion.getMessage(labels[f], labels[f]),
        value: v,
      });
    }

    var data = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: seriesManager[o.dataLink].data[index].stamp,
      values: values,
    };

    return data;

    function valToString(v: any) {
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
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#009688";
    ctx.strokeStyle = "#009688";

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
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e91e63";
    ctx.strokeStyle = "#e91e63";

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

    if (index > seriesManager[o.dataLink].data.length - 1) return false;

    var strategyValue = seriesManager[o.dataLink].data[index][o.dataField];
    if (strategyValue == FUSION.DO_NOTHING) return false;

    var pointX = renderer.getIndexPoint(index, model) + parseInt(model._midOffset);
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
    var indexX = 0;
    var valuesY: any = {};
    var midX = 0;

    var field = o.dataField;
    if (forceField) field = forceField;

    ctx.save();
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

    for (var i = model._leftIndex; i < model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;

      var strategyValue = seriesManager[o.dataLink].data[i][field];
      if (strategyValue == FUSION.DO_NOTHING) continue;

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
        midX = indexX + parseInt(model._midOffset);
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
      var index = renderer.getPointIndex(o._hit.x, model);
      var x = renderer.getIndexPoint(index, model) + model.periodWidth / 2;
      var r = 5;
      var field = forceField || o.dataField;

      var strategyValue = seriesManager[o.dataLink].data[index][field];
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

    function renderPoint(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      color?: string
    ) {
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

const StrategyObjectCtor: new (...args: any[]) => any = StrategyObject as any;
const CandlestickPatternStrategyObjectCtor: new (...args: any[]) => any =
  CandlestickPatternStrategyObject as any;
const FractalsObjectCtor: new (...args: any[]) => any = FractalsObject as any;
export {
  StrategyObjectCtor as StrategyObject,
  CandlestickPatternStrategyObjectCtor as CandlestickPatternStrategyObject,
  FractalsObjectCtor as FractalsObject,
};
