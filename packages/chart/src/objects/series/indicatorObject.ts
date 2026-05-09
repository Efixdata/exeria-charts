import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { createSeriesMenu } from "./_menu";
import { renderSeriesPriceTag } from "./_priceTag";
import type {
  SeriesMenuOption,
  SeriesRuntime,
} from "./_sharedTypes";

const INDICATOR_RENDER_MODE_OPTIONS: SeriesMenuOption[] = [
  { key: "radio1", mode: "Line", labelKey: "line" },
  {
    key: "radio2",
    mode: "Line and Histogram",
    labelKey: "line_and_histogram",
    fallback: "Line and Histogram",
  },
  { key: "radio3", mode: "Histogram", labelKey: "histogram", fallback: "Histogram" },
];
const INDICATOR_PRICE_TAG_LINE_MODES = ["Line"];
const INDICATOR_PRICE_TAG_OHLC_MODES = ["OHLC", "Bars"];

var IndicatorObject = function (this: SeriesRuntime) {
  this.getMenuItems = function (o, chart) {
    return createSeriesMenu(chart, o, {
      renderModes: INDICATOR_RENDER_MODE_OPTIONS,
      selectRenderMode: function (mode, object) {
        object.renderAs = mode;
      },
      toggles: [
        {
          key: "priceMarker",
          labelKey: "show_price_marker",
          isChecked: function (object) {
            return object.priceTag === true;
          },
          toggle: function (object) {
            object.priceTag = !object.priceTag;
            object.priceLine = object.priceTag;
          },
        },
      ],
    });
  };

  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    if (model._leftIndex >= seriesManager[o.dataLink].data.length) return;

    if (o.renderAs == "Line")
      return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
    if (o.renderAs == "Histogram")
      return this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
    if (o.renderAs == "Line and Histogram") {
      this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
      this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
      return;
    }
    if (o.renderAs == "Band") {
      this.renderAsBand(o, ctx, renderer, model, panel, seriesManager);
      this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
      this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
      return;
    }

    //default
    return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
  };

  this.postRender = function (o, ctx, renderer, model, panel, seriesManager) {
    //#draw a closing line

    if (o.priceTag) this.renderPriceTag(o, ctx, renderer, model, panel, seriesManager);

    if (o.selected) {
      if (o.renderAs == "Line" || o.renderAs == "ChartShape")
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
      else if (o.renderAs == "Band") {
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
      } else if (
        o.renderAs == "Line and Histogram" ||
        o.renderAs == "Histogram" ||
        o.renderAs == "Volume Histogram"
      ) {
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
      }
    }
  };

  this.renderPriceTag = function (o, ctx, renderer, model, panel, seriesManager) {
    return renderSeriesPriceTag(o, ctx, renderer, model, panel, seriesManager, {
      getRenderMode: function (object) {
        return object.renderAs ?? "";
      },
      lineModes: INDICATOR_PRICE_TAG_LINE_MODES,
      ohlcModes: INDICATOR_PRICE_TAG_OHLC_MODES,
      getBaseColor: function (object) {
        return object.color;
      },
      getTextColor: function () {
        return "#ffffff";
      },
      getUpColor: function () {
        return WEBRCP.utils.colorManager.getColor("chartGreen");
      },
      getDownColor: function () {
        return WEBRCP.utils.colorManager.getColor("chartRed");
      },
    });
  };

  this.renderAsHistogram = function (o, ctx, renderer, model, panel, seriesManager) {
    var indexX = 0;
    var valueY = 0;
    var midX = 0;
    var zeroY = 0;

    var stroke = o.color;
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = o.width;

    var field = o.dataField;
    var fV = LIB.getReferenceValue(o, model, seriesManager);

    zeroY =
      renderer.getYCoordinateForPrice(0, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      }) + panel._offset;

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.dataField], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + parseInt(model._midOffset);
      }

      ctx.beginPath();
      ctx.moveTo(midX, zeroY);
      ctx.lineTo(midX, valueY);
      ctx.stroke();
    }

    if (o.priceLine) {
      const value =
        seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][o.dataField];

      this.renderPriceLine({
        ctx,
        panel,
        model,
        value,
        y:
          renderer.getYCoordinateForPrice(value, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset,
      });
    }

    ctx.restore();
    return true;
  };

  this.renderAsBand = function (o, ctx, renderer, model, panel, seriesManager) {
    var indexX = 0;
    var valueY = 0;
    var midX = 0;

    var fill = o.color;

    ctx.save();
    ctx.fillStyle = fill;
    ctx.lineWidth = o.width;
    ctx.beginPath();
    ctx.globalAlpha = 0.3;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;
      if (seriesManager[o.dataLink].data[i][o.upperField] === null) continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.upperField], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        if (i == model._leftIndex) midX = 0;
        else if (i == model._rightIndex) midX = model._width;
        else if (i == seriesManager[o.dataLink].data.length - 1)
          midX = indexX + Math.trunc(model._midOffset * 2);
        else midX = indexX + parseInt(model._midOffset);
      }

      if (i == model._leftIndex) {
        ctx.moveTo(midX, valueY);
      } else {
        ctx.lineTo(midX, valueY);
      }
    }

    for (var i = model._rightIndex; i >= model._leftIndex - 1; i--) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;
      if (i < 0) continue;
      if (seriesManager[o.dataLink].data[i][o.lowerField] === null) continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.lowerField], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        if (i == model._leftIndex) midX = 0;
        else if (i == model._rightIndex) midX = model._width;
        else if (i == seriesManager[o.dataLink].data.length - 1)
          midX = indexX + Math.trunc(model._midOffset * 2);
        else midX = indexX + parseInt(model._midOffset);
      }

      ctx.lineTo(midX, valueY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  };

  this.drawSelectionLine = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    var indexX = 0;
    var valueY = 0;
    var midX = 0;
    var lastX = 0;

    var field = o.dataField;
    if (forceField) field = forceField;

    ctx.save();
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;
      if (seriesManager[o.dataLink].data[i][field] === null) continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + parseInt(model._midOffset);
      }

      if (midX - lastX >= 50) {
        if (i == seriesManager[o.dataLink].data.length - 1)
          midX = indexX + Math.trunc(model._midOffset * 2);

        ctx.beginPath();
        ctx.arc(midX, valueY, 3, 0, 2 * Math.PI, false);
        ctx.fill();
        lastX = midX;
      }
    }

    ctx.restore();
  };

  this.renderAsLine = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    var indexX = 0;
    var valueY = 0;
    var midX = 0;
    var lastX = 0;

    var stroke = o.color;
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = o.width;
    ctx.beginPath();

    if (!seriesManager[o.dataLink]) return true;

    var link = o.dataLink;
    var field = o.dataField;
    if (forceField) field = forceField;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > seriesManager[o.dataLink].data.length - 1) continue;
      if (seriesManager[link].data[i][field] === null) continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(seriesManager[link].data[i][field], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        if (i == model._leftIndex) midX = 0;
        else if (i == model._rightIndex) midX = model._width;
        else if (i == seriesManager[link].data.length - 1)
          midX = indexX + Math.trunc(model._midOffset * 2);
        else midX = indexX + parseInt(model._midOffset);
      }

      if (i == model._leftIndex) {
        ctx.moveTo(midX, valueY);
      } else {
        ctx.lineTo(midX, valueY);
      }

      lastX = indexX;
    }

    ctx.stroke();

    if (o.priceLine) {
      const value = seriesManager[o.dataLink].data[seriesManager[link].data.length - 1][field];

      this.renderPriceLine({
        ctx,
        panel,
        model,
        value,
        y:
          renderer.getYCoordinateForPrice(value, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset,
      });
    }
    ctx.restore();
    return true;
  };

  this.updateExtremes = function (o, extremes, model, seriesManager) {
    return this.updateExtremesLine(o, extremes, model, seriesManager);
  };

  this.updateExtremesLine = function (o, extremes, model, seriesManager) {
    for (var i = model._leftIndex; i < model._rightIndex; i++) {
      if (seriesManager[o.dataLink] == undefined || i > seriesManager[o.dataLink].data.length - 1) {
        return;
      }
      if (seriesManager[o.dataLink].data[i][o.dataField] > extremes.max)
        extremes.max = seriesManager[o.dataLink].data[i][o.dataField];
      if (seriesManager[o.dataLink].data[i][o.dataField] < extremes.min)
        extremes.min = seriesManager[o.dataLink].data[i][o.dataField];
    }
  };

  this.tmpIndex = 0;
  this.tmpValue = 0;
  this.tmpPoint = 0;

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    if (o.hidden == true) return false;
    if (o.renderAs == "Line")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (o.renderAs == "ChartShape")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (o.renderAs == "Band")
      return this.hitBand(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (o.renderAs == "Line and Histogram")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (o.renderAs == "Histogram")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);

    return false;
  };

  this.hitLine = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    this.tmpIndex = renderer.getPointIndex(x, model);

    if (!seriesManager[o.dataLink]) return false;

    if (this.tmpIndex > seriesManager[o.dataLink].data.length - 1) return false;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    this.tmpPoint =
      renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][o.dataField], {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;

    return interactor.isOver(x, y, x, this.tmpPoint, 4);
  };

  this.hitBand = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    this.tmpIndex = renderer.getPointIndex(x, model);
    if (this.tmpIndex > seriesManager[o.dataLink].data.length - 1) return false;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    this.tmpPoint =
      renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][o.upperField], {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    if (interactor.isOver(x, y, x, this.tmpPoint, 4)) return true;
    this.tmpPoint =
      renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][o.lowerField], {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    if (interactor.isOver(x, y, x, this.tmpPoint, 4)) return true;

    return false;
  };

  this.getMin = function (index, o, seriesManager) {
    var min = Number.MAX_VALUE;
    var data = seriesManager[o["dataLink"]].data;
    var fields = seriesManager[o["dataLink"]].fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] != "v" && fields[i] != "i") {
        var value = data[index][fields[i]];
        if (value !== null && value < min) min = data[index][fields[i]];
      }
    }
    return min;
  };

  this.getMax = function (index, o, seriesManager) {
    var max = -Number.MAX_VALUE;
    var data = seriesManager[o["dataLink"]].data;
    var fields = seriesManager[o["dataLink"]].fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] != "v" && fields[i] != "i") {
        var value = data[index][fields[i]];
        if (value !== null && value > max) max = data[index][fields[i]];
      }
    }
    return max;
  };
};

const IndicatorObjectCtor: new (...args: any[]) => any = IndicatorObject as any;
export { IndicatorObjectCtor as IndicatorObject };
