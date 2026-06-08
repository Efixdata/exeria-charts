import WEBRCP from "../../WebRCP";
import { resolveChartLocaleMessage } from "../../chartLocaleRuntime";
import LIB from "../../utils/chartingCommons";
import {
  between,
  isPointInCircle,
  pointsDistance,
  getLinePointNearestMouse,
  roundAndTranslate,
} from "../../utils/objects-lib";
import { createSeriesMenu } from "./_menu";
import { renderSeriesPriceTag } from "./_priceTag";
import { getScriptTitle, isSeriesHitPoint } from "./_sharedTypes";
import type { LegacySeriesObject } from "../../objectRuntimeBases";
import type {
  RuntimeObjectConstructor,
  SeriesDataPoint,
  SeriesManagerContext,
  SeriesMenuOption,
  SeriesRuntime,
  SeriesTooltipData,
} from "./_sharedTypes";

function getLinkedSeries(
  object: LegacySeriesObject & { dataLink?: string },
  seriesManager: SeriesManagerContext,
) {
  if (!object.dataLink) return null;
  return seriesManager[object.dataLink] ?? null;
}

function parseLineFillColor(color: string): { r: number; g: number; b: number } {
  if (color.startsWith("#")) {
    const normalized =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (match) {
      return {
        r: Number.parseInt(match[1], 16),
        g: Number.parseInt(match[2], 16),
        b: Number.parseInt(match[3], 16),
      };
    }
  }

  const match = color.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (match) {
    return {
      r: Number.parseInt(match[1], 10),
      g: Number.parseInt(match[2], 10),
      b: Number.parseInt(match[3], 10),
    };
  }

  return { r: 41, g: 98, b: 255 };
}

function getSeriesLabel(labels: string[] | Record<string, string>, index: number, field: string) {
  return Array.isArray(labels) ? (labels[index] ?? field) : (labels[field] ?? field);
}

function getSeriesPrecision(precisions: unknown, index: number, field: string) {
  if (Array.isArray(precisions)) return precisions[index];
  if (precisions && typeof precisions === "object") {
    return (precisions as Record<string, unknown>)[field];
  }
  return undefined;
}

const SERIES_RENDER_MODE_OPTIONS: SeriesMenuOption[] = [
  { key: "radio1", mode: "OHLC", labelKey: "candles" },
  { key: "radio2", mode: "Line", labelKey: "line" },
  {
    key: "radio3",
    mode: "Line and Histogram",
    labelKey: "line_and_histogram",
    fallback: "Line and Histogram",
  },
  { key: "radio4", mode: "Histogram", labelKey: "histogram", fallback: "Histogram" },
  { key: "radio5", mode: "Bars", labelKey: "bars", fallback: "Bars" },
];
const SERIES_PRICE_TAG_LINE_MODES = ["Line", "Line and Histogram", "Histogram"];
const SERIES_PRICE_TAG_OHLC_MODES = ["OHLC", "Bars"];

var SeriesObject = function (this: SeriesRuntime) {
  this.getMenuItems = function (o, chart) {
    return createSeriesMenu(chart, o, {
      renderModes: SERIES_RENDER_MODE_OPTIONS,
      selectRenderMode: function (mode, object) {
        chart.onDrawModeSelected?.({
          type: mode,
          object,
          selected: true,
        });
      },
      toggles: [
        {
          key: "priceMarker",
          labelKey: "show_price_marker",
          fallback: "Show price marker",
          isChecked: function (object) {
            return object.priceTag === true;
          },
          toggle: function (object) {
            object.priceTag = !object.priceTag;
          },
        },
        {
          key: "priceLine",
          labelKey: "show_price_line",
          fallback: "Show price line",
          isChecked: function (object) {
            return object.priceLine === true;
          },
          toggle: function (object) {
            object.priceLine = !object.priceLine;
          },
        },
      ],
    });
  };

  this.getRenderMode = function (o, model) {
    const renderAs = o.renderAs ?? "Line";

    if (model.periodWidth < 1) {
      switch (renderAs.toLowerCase()) {
        case "histogram":
          return "Histogram";
          break;
        case "volume histogram":
          return "Volume Histogram";
          break;
        case "line and histogram":
          return "ChartShape";
          break;
        case "band":
          return "Band";
          break;
        default:
          return "Line";
      }
    } else return renderAs;
  };

  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return;

    renderer.validateSeriesBeforeRender(linkedSeries);

    if (model._leftIndex >= linkedSeries.data.length) return;

    o.strokeStyle = o.color;
    const renderMode = this.getRenderMode(o, model).toLowerCase();

    if (renderMode === "ohlc")
      return this.renderAsOHLC(o, ctx, renderer, model, panel, seriesManager);
    if (renderMode === "bars")
      return this.renderAsBars(o, ctx, renderer, model, panel, seriesManager);
    if (renderMode === "line") {
      if (o.lineFillVisible) {
        this.renderLineAreaFill(o, ctx, renderer, model, panel, seriesManager);
      }
      return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
    }
    if (renderMode === "chartshape")
      return this.renderAsChartShape(o, ctx, renderer, model, panel, seriesManager);
    if (renderMode === "histogram")
      return this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
    if (renderMode === "volume histogram")
      return this.renderAsVolumeHistogram(o, ctx, renderer, model, panel, seriesManager);
    if (renderMode === "line and histogram") {
      this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
      this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
      return;
    }
    if (renderMode === "band") {
      this.renderAsBand(o, ctx, renderer, model, panel, seriesManager);
      this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
      this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
      return;
    }

    //default
    return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderOverlay = function (o, ctx, renderer, model, panel, seriesManager) {
    if (o.selected) {
      if (this.getRenderMode(o, model) == "Line" || this.getRenderMode(o, model) == "ChartShape")
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
      else if (this.getRenderMode(o, model) == "Band") {
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
      } else if (this.getRenderMode(o, model) == "OHLC" || this.getRenderMode(o, model) == "Bars") {
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.highDataField);
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.lowDataField);
      } else if (
        this.getRenderMode(o, model) == "Line and Histogram" ||
        this.getRenderMode(o, model) == "Histogram" ||
        this.getRenderMode(o, model) == "Volume Histogram"
      ) {
        this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
      }
    }

    if (isSeriesHitPoint(o._hit)) this.drawHit(o, ctx, renderer, model, panel, seriesManager);
  };

  this.postRender = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);

    if (o.priceTag && linkedSeries && linkedSeries.data.length > 0)
      this.renderPriceTag(o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderPriceTag = function (o, ctx, renderer, model, panel, seriesManager) {
    return renderSeriesPriceTag(o, ctx, renderer, model, panel, seriesManager, {
      getRenderMode: (object, nextModel) => this.getRenderMode(object, nextModel),
      lineModes: SERIES_PRICE_TAG_LINE_MODES,
      ohlcModes: SERIES_PRICE_TAG_OHLC_MODES,
      getBaseColor: function (object) {
        const color = object.color ?? "chartLine";
        return WEBRCP.utils.colorManager.getColor(color, color);
      },
      getTextColor: function (object) {
        const colorKey = typeof object.color === "string" ? object.color : "chartLine";
        const resolvedColor = WEBRCP.utils.colorManager.getColor(colorKey, colorKey);
        return WEBRCP.utils.getContrastColor(resolvedColor);
      },
      getUpColor: function () {
        return WEBRCP.utils.colorManager.getColor("chartGreenBackground");
      },
      getDownColor: function () {
        return WEBRCP.utils.colorManager.getColor("chartRed");
      },
    });
  };

  this.renderAsHistogram = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || !o.dataField) return true;

    var indexX = 0;
    var valueY = 0;
    var midX = 0;
    var zeroY = 0;

    const stroke = o.color ?? WEBRCP.utils.colorManager.getColor("chartLine");

    ctx.strokeStyle = stroke;
    ctx.lineWidth = o.width;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    zeroY =
      renderer.getYCoordinateForPrice(0, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      }) + panel._offset;

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > linkedSeries.data.length - 1) continue;
      if (linkedSeries.data[i][o.dataField] === null) continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(linkedSeries.data[i][o.dataField], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      ctx.beginPath();
      ctx.moveTo(midX, zeroY);
      ctx.lineTo(midX, valueY);
      ctx.stroke();
      ctx.closePath();
    }

    if (o.priceLine) {
      const value = linkedSeries.data[linkedSeries.data.length - 1][o.dataField];

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

    return true;
  };

  this.renderAsVolumeHistogram = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const max = typeof o.localExtremes?.max === "number" ? o.localExtremes.max : 0;
    if (!linkedSeries || !o.dataField || max == 0) return;

    var indexX = 0;

    const getColor = (i: number) => {
      if (o.volumeColorMode === "single" && typeof o.color === "string" && o.color.length > 0) {
        return o.color;
      }

      const close = seriesManager[model.mainSeries].data[i]["c"];
      const open = seriesManager[model.mainSeries].data[i]["o"];
      if (close > open) return WEBRCP.utils.colorManager.getColor("chartGreen");
      else if (close == open) return WEBRCP.utils.colorManager.getColor("exitAllColor");
      else return WEBRCP.utils.colorManager.getColor("chartRed");
    };

    ctx.globalAlpha =
      typeof o.volumeOpacity === "number" ? Math.min(1, Math.max(0, o.volumeOpacity)) : 0.2;
    const maxHeight = Math.round(panel._height * 0.25);

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > linkedSeries.data.length - 1) continue;

      let value = linkedSeries.data[i][o.dataField];
      if (value === null) continue;

      indexX = renderer.getIndexPoint(i, model);
      let width = 1;

      if (model.periodWidth > 2) {
        width = model.periodWidth - 2;
        indexX += 1;
      }

      ctx.fillStyle = getColor(i);
      ctx.beginPath();

      ctx.rect(indexX, panel._height, width, (Number(value) / max) * maxHeight * -1);
      ctx.fill();
      ctx.closePath();
    }

    if (o.priceLine) {
      const value = linkedSeries.data[linkedSeries.data.length - 1][o.dataField];

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

    ctx.globalAlpha = 1;
    return true;
  };

  this.renderAsBand = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || !o.upperField || !o.lowerField) return true;

    var indexX = 0;
    var valueY = 0;
    var midX = 0;

    const fill = o.color ?? WEBRCP.utils.colorManager.getColor("chartLine");

    ctx.fillStyle = fill;
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash || []);
    ctx.beginPath();
    ctx.globalAlpha = 0.3;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    var start = model._leftIndex;
    var end = model._rightIndex;
    if (start > 0) start -= 1;
    if (end < linkedSeries.data.length - 1) end += 1;
    var firstRender = true;

    for (var i = start; i <= end; i++) {
      if (
        i > linkedSeries.data.length - 1 ||
        linkedSeries.data[i] === null ||
        linkedSeries.data[i][o.upperField] === null
      ) {
        continue;
      }

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(linkedSeries.data[i][o.upperField], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      if (firstRender) {
        ctx.moveTo(midX, valueY);
        firstRender = false;
      } else {
        ctx.lineTo(midX, valueY);
      }
    }

    for (i = end; i >= start - 1; i--) {
      if (
        i > linkedSeries.data.length - 1 ||
        i < 0 ||
        linkedSeries.data[i] === null ||
        linkedSeries.data[i][o.lowerField] === null
      ) {
        continue;
      }

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(linkedSeries.data[i][o.lowerField], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      ctx.lineTo(midX, valueY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    return true;
  };

  this.drawSelectionLine = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = forceField || o.dataField;
    if (!linkedSeries || !field) return;

    var indexX = 0;
    var valueY = 0;
    var midX = 0;

    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const data = linkedSeries.data;

    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

    for (let i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > data.length - 1) break;
      if (data[i][field] === null) continue;

      const d = Math.round(50 / model.periodWidth < 1 ? 1 : 50 / model.periodWidth);
      const mod = i % d;

      if (mod == 0) {
        indexX = renderer.getIndexPoint(i, model);
        valueY =
          renderer.getYCoordinateForPrice(data[i][field], {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;

        if (this.getRenderMode(o, model) == "Volume Histogram") {
          if (!data[i][field]) continue;
          valueY = panel._height + panel._offset - 10;
        }

        if (model.periodWidth == 1) {
          midX = indexX;
        } else {
          midX = indexX + model._midOffset;
        }

        ctx.beginPath();
        ctx.arc(midX, valueY, 3, 0, 2 * Math.PI, false);
        ctx.fill();
      }
    }
  };

  this.drawHit = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || !isSeriesHitPoint(o._hit)) return;

    let index = -1;
    try {
      var fV = LIB.getReferenceValue(o, model, seriesManager);
      index = renderer.getPointIndex(o._hit.x, model);
      var x = renderer.getIndexPoint(index, model) + model.periodWidth / 2;
      var r = 5;
      var field = forceField || o.dataField;
      const dataPoint = linkedSeries.data[index];

      if (!dataPoint) return;

      if (
        this.getRenderMode(o, model) == "Line" ||
        this.getRenderMode(o, model) == "ChartShape" ||
        this.getRenderMode(o, model) == "Line and Histogram" ||
        this.getRenderMode(o, model) == "Histogram"
      ) {
        if (!field) return;
        const value = dataPoint[field];
        if (typeof value !== "number") return;
        var y =
          renderer.getYCoordinateForPrice(value, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        renderPoint(ctx, x, y, r);
      } else if (this.getRenderMode(o, model) == "Band") {
        if (!o.upperField || !o.lowerField) return;
        const upperValue = dataPoint[o.upperField];
        const lowerValue = dataPoint[o.lowerField];
        if (typeof upperValue !== "number" || typeof lowerValue !== "number") return;
        var yUp =
          renderer.getYCoordinateForPrice(upperValue, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        var yDn =
          renderer.getYCoordinateForPrice(lowerValue, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        renderPoint(ctx, x, yUp, r);
        renderPoint(ctx, x, yDn, r);
      } else if (this.getRenderMode(o, model) == "OHLC" || this.getRenderMode(o, model) == "Bars") {
        const closeField = o.closeDataField || o.dataField;
        const openField = o.openDataField || o.dataField;
        if (!closeField || !openField) return;
        const closeValue = dataPoint[closeField];
        const openValue = dataPoint[openField];
        if (typeof closeValue !== "number" || typeof openValue !== "number") return;
        var yC =
          renderer.getYCoordinateForPrice(closeValue, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        var yO =
          renderer.getYCoordinateForPrice(openValue, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;

        renderPoint(ctx, x, (yC + yO) / 2, r);
      } else if (this.getRenderMode(o, model) == "Volume Histogram") {
        var volumeY = panel._height + panel._offset - 10;
        renderPoint(ctx, x, volumeY, r);
      }
    } catch (e) {
      console.log("Cant render series hit point", e, index);
    }

    function renderPoint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      ctx.beginPath();
      ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("hitColor");
      ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.stroke();
      ctx.closePath();
    }
  };

  this.getStartIndex = function (start, data, field) {
    for (let i = start - 1; i > 0; --i) {
      if (data[i][field] !== null) return i;
    }
    return 0;
  };

  this.getEndIndex = function (end, data, field) {
    for (let i = end + 1; i < data.length - 1; ++i) {
      if (data[i][field] !== null) return i;
    }
    return data.length - 1;
  };

  this.renderAsLine = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = forceField || o.dataField;
    if (!linkedSeries || !field) return true;

    var indexX = 0;
    var valueY = 0;
    var midX = 0;

    var stroke = o.color ?? WEBRCP.utils.colorManager.getColor("chartLine");

    if (this.getRenderMode(o, model) === "Line" && o.dash) {
      ctx.setLineDash(o.dash || []);
    }

    ctx.strokeStyle = stroke;
    ctx.lineWidth = o.width;
    ctx.beginPath();

    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var start = model._leftIndex;
    var end = model._rightIndex;
    if (start > 0) start = this.getStartIndex(start, linkedSeries.data, field);
    if (end < linkedSeries.data.length - 1) end = this.getEndIndex(end, linkedSeries.data, field);
    var firstRender = true;
    for (var i = start; i <= end; i++) {
      if (i > linkedSeries.data.length - 1) continue;

      const value = linkedSeries.data[i]?.[field];
      if (typeof value !== "number") continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(value, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      if (firstRender) {
        ctx.moveTo(midX, valueY);
        firstRender = false;
      } else {
        ctx.lineTo(midX, valueY);
      }
    }

    ctx.stroke();
    ctx.closePath();

    if (o.priceLine) {
      const value = linkedSeries.data[linkedSeries.data.length - 1]?.[field];
      if (typeof value === "number") {
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
    }

    return true;
  };

  this.renderLineAreaFill = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = forceField || o.closeDataField || o.dataField;
    if (!linkedSeries || !field) return;

    var indexX = 0;
    var valueY = 0;
    var midX = 0;

    ctx.save();

    const baseY = panel._offset + panel._height;
    const fillMode = o.lineFillMode === "gradient" ? "gradient" : "solid";

    if (fillMode === "gradient") {
      const color = WEBRCP.utils.colorManager.getColor("chartFillGradient", "chartLine");
      const opacity =
        typeof o.lineFillGradientOpacity === "number" ? o.lineFillGradientOpacity : 0.4;
      const rgb = parseLineFillColor(color);
      const gradient = ctx.createLinearGradient(0, panel._offset, 0, baseY);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = WEBRCP.utils.colorManager.getColor("chartFill");
    }

    ctx.beginPath();

    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var start = model._leftIndex;
    var end = model._rightIndex;
    if (start > 0) start = this.getStartIndex(start, linkedSeries.data, field);
    if (end < linkedSeries.data.length - 1) end = this.getEndIndex(end, linkedSeries.data, field);

    var firstRender = true;
    var firstX = 0;
    var lastX = 0;

    for (var i = start; i <= end; i++) {
      if (i > linkedSeries.data.length - 1) continue;

      const value = linkedSeries.data[i]?.[field];
      if (typeof value !== "number") continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(value, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      if (firstRender) {
        ctx.moveTo(midX, valueY);
        firstRender = false;
        firstX = midX;
      } else {
        ctx.lineTo(midX, valueY);
      }
      lastX = midX;
    }

    if (!firstRender) {
      ctx.lineTo(lastX, baseY);
      ctx.lineTo(firstX, baseY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  this.renderAsOHLC = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return true;

    let startX = 0;
    var highY = 0;
    var lowY = 0;
    var openY = 0;
    var closeY = 0;

    const redFillColor = WEBRCP.utils.colorManager.getColor("chartRed");
    const greenFillColor = WEBRCP.utils.colorManager.getColor("chartGreen");
    const grayFillColor = WEBRCP.utils.colorManager.getColor("chartGray");

    const redStrokeColor = WEBRCP.utils.colorManager.getColor("chartRedStroke");
    const greenStrokeColor = WEBRCP.utils.colorManager.getColor("chartGreenStroke");
    const grayStrokeColor = WEBRCP.utils.colorManager.getColor("chartGray");

    let color = redFillColor;
    let stroke = redStrokeColor;

    ctx.save();
    ctx.lineWidth = 1;

    let dfH = o.highDataField ? o.highDataField : o.dataField;
    let dfL = o.lowDataField ? o.lowDataField : o.dataField;
    let dfO = o.openDataField ? o.openDataField : o.dataField;
    let dfC = o.closeDataField ? o.closeDataField : o.dataField;
    if (!dfH || !dfL || !dfO || !dfC) return true;

    const roundedPeriodWidth = Math.round(model.periodWidth);
    const data = linkedSeries.data;
    const panelOffset = panel._offset;
    const panelProps = {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV: LIB.getFirstAvailableValue(model, data, dfC),
    };

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      const dataPrice = data[i];

      if (i > data.length - 1) continue;
      if (!dataPrice) continue;

      const highValue = dataPrice[dfH];
      const lowValue = dataPrice[dfL];
      const openValue = dataPrice[dfO];
      const closeValue = dataPrice[dfC];
      if (
        typeof highValue !== "number" ||
        typeof lowValue !== "number" ||
        typeof openValue !== "number" ||
        typeof closeValue !== "number"
      ) {
        continue;
      }

      startX = roundAndTranslate(renderer.getIndexPoint(i, model));
      highY = Math.round(renderer.getYCoordinateForPrice(highValue, panelProps) + panelOffset);
      lowY = Math.round(renderer.getYCoordinateForPrice(lowValue, panelProps) + panelOffset);
      openY = roundAndTranslate(renderer.getYCoordinateForPrice(openValue, panelProps) + panelOffset);
      closeY = Math.round(renderer.getYCoordinateForPrice(closeValue, panelProps) + panelOffset);

      const rightX = startX + roundedPeriodWidth;
      const midX = roundAndTranslate(rightX - roundedPeriodWidth / 2);

      const change = closeValue - openValue;

      if (change > 0) {
        color = greenFillColor;
        stroke = greenStrokeColor;
      } else if (change < 0) {
        color = redFillColor;
        stroke = redStrokeColor;
      } else {
        color = grayFillColor;
        stroke = grayStrokeColor;
      }

      ctx.strokeStyle = stroke;
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(midX, highY);
      ctx.lineTo(midX, lowY);
      ctx.stroke();
      ctx.closePath();

      if (roundedPeriodWidth > 3) {
        ctx.beginPath();
        ctx.rect(startX + 1, openY, roundedPeriodWidth - 2, closeY - openY);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
      }
    }

    if (o.priceLine) {
      const value = data[data.length - 1][dfC];
      const open = data[data.length - 1][dfO];
      if (typeof value !== "number" || typeof open !== "number") {
        ctx.restore();
        return true;
      }

      this.renderPriceLine({
        ctx,
        panel,
        model,
        value,
        green: greenFillColor,
        red: redFillColor,
        open,
        y: renderer.getYCoordinateForPrice(value, panelProps) + panelOffset,
      });
    }

    ctx.restore();

    return true;
  };

  this.renderAsBars = function (o, ctx, renderer, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return true;

    var indexX = 0;
    var highY = 0;
    var lowY = 0;
    var openY = 0;
    var closeY = 0;

    var red = WEBRCP.utils.colorManager.getColor("chartRed");
    var green = WEBRCP.utils.colorManager.getColor("chartGreen");
    var redStroke = WEBRCP.utils.colorManager.getColor("chartRedStroke");
    var greenStroke = WEBRCP.utils.colorManager.getColor("chartGreenStroke");
    var stroke = redStroke;
    var grayStroke = WEBRCP.utils.colorManager.getColor("chartGray");
    var rightX = 0;
    var midX = 0;

    ctx.save();
    ctx.lineWidth = 1;

    var dfH = o.highDataField ? o.highDataField : o.dataField;
    var dfL = o.lowDataField ? o.lowDataField : o.dataField;
    var dfO = o.openDataField ? o.openDataField : o.dataField;
    var dfC = o.closeDataField ? o.closeDataField : o.dataField;
    if (!dfH || !dfL || !dfO || !dfC) return true;

    const data = linkedSeries.data;
    var fV = LIB.getFirstAvailableValue(model, data, dfC);

    for (var i = model._leftIndex; i <= model._rightIndex; i++) {
      if (i > data.length - 1) continue;

      const dataPrice = data[i];
      const highValue = dataPrice?.[dfH];
      const lowValue = dataPrice?.[dfL];
      const openValue = dataPrice?.[dfO];
      const closeValue = dataPrice?.[dfC];
      if (
        typeof highValue !== "number" ||
        typeof lowValue !== "number" ||
        typeof openValue !== "number" ||
        typeof closeValue !== "number"
      ) {
        continue;
      }
      const panelProps = {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      };

      indexX = renderer.getIndexPoint(i, model);
      highY = renderer.getYCoordinateForPrice(highValue, panelProps) + panel._offset;
      lowY = renderer.getYCoordinateForPrice(lowValue, panelProps) + panel._offset;
      openY = renderer.getYCoordinateForPrice(openValue, panelProps) + panel._offset;
      closeY = renderer.getYCoordinateForPrice(closeValue, panelProps) + panel._offset;

      if (model.periodWidth == 1) {
        rightX = indexX;
        midX = indexX;
      } else if (model.periodWidth == 2) {
        rightX = indexX;
        midX = indexX;
      } else if (model.periodWidth == 3) {
        rightX = indexX + 1;
        midX = indexX + 1;
        indexX = indexX + 1;
      } else if (model.periodWidth == 4) {
        rightX = indexX + 2;
        midX = indexX + 1;
      } else if (model.periodWidth == 5) {
        rightX = indexX + 3;
        midX = indexX + 1;
      } else if (model.periodWidth == 6) {
        rightX = indexX + 4;
        midX = indexX + 2;
      } else if (model.periodWidth > 6) {
        midX = indexX + model._midOffset;
        rightX = indexX + model.periodWidth - 2;
        indexX = indexX + 1;
      } else {
        midX = indexX + model._midOffset;
        rightX = indexX + model.periodWidth - 1;
      }

      if (closeValue - openValue > 0) {
        stroke = greenStroke;
      } else if (closeValue - openValue < 0) {
        stroke = redStroke;
      } else {
        stroke = grayStroke;
      }

      if (model.periodWidth < 3) {
        ctx.strokeStyle = stroke;
        ctx.beginPath();
        ctx.moveTo(midX, highY);
        ctx.lineTo(midX, lowY);
        ctx.stroke();
      } else {
        ctx.strokeStyle = stroke; //grayStroke;
        ctx.beginPath();
        ctx.moveTo(midX, highY);
        ctx.lineTo(midX, lowY);
        ctx.moveTo(indexX, openY);
        ctx.lineTo(midX, openY);
        ctx.moveTo(rightX, closeY);
        ctx.lineTo(midX, closeY);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.closePath();
      }
    }

    if (o.priceLine) {
      const value = data[data.length - 1]?.[dfC];
      const open = data[data.length - 1]?.[dfO];
      if (typeof value !== "number" || typeof open !== "number") {
        ctx.restore();
        return true;
      }

      this.renderPriceLine({
        ctx,
        panel,
        model,
        value,
        green,
        red,
        open,
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

  this.renderAsChartShape = function (o, ctx, renderer, model, panel, seriesManager, forceField) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    let field = forceField || o.closeDataField || o.dataField;
    if (!linkedSeries || !field) return;

    let indexX = 0;
    var valueY = 0;
    var midX = 0;
    const data = linkedSeries.data;

    ctx.save();

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("chartStroke");
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("chartFill");
    ctx.lineWidth = o.width ? o.width : 1;
    ctx.beginPath();

    const zeroY =
      renderer.getYCoordinateForPrice(0, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      }) + panel._offset;
    const fV = LIB.getFirstAvailableValue(model, data, field);
    const end = getFirstValueAfterEnd(model._rightIndex, data, field);

    let firstRender = true;
    let firstX = -5;

    for (var i = 0; i <= data.length - 1; i++) {
      if (i > data.length - 1) continue;
      if ((data[i] === null || data[i][field] === null) && i !== end && i !== data.length - 1)
        continue;

      indexX = renderer.getIndexPoint(i, model);
      valueY =
        renderer.getYCoordinateForPrice(data[i][field], {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;

      if (model.periodWidth == 1) {
        midX = indexX;
      } else {
        midX = indexX + model._midOffset;
      }

      if (firstRender) {
        ctx.moveTo(midX, valueY);
        firstRender = false;
        firstX = midX;
      } else {
        ctx.lineTo(midX, valueY);
      }

      if (i === end) {
        ctx.lineTo(panel._width, valueY || zeroY);
        ctx.stroke();
        ctx.lineTo(panel._width, zeroY);
        ctx.lineTo(firstX, zeroY);
      }

      if (i == data.length - 1) {
        ctx.stroke();
        ctx.lineTo(midX, zeroY);
        ctx.lineTo(firstX, zeroY);
      }
    }
    ctx.closePath();
    ctx.fill();

    if (o.priceLine) {
      const value = data[data.length - 1]?.[field];
      if (typeof value === "number") {
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
            }) + panel._offset,
        });
      }
    }

    function getFirstValueAfterEnd(rightIndex: number, data: SeriesDataPoint[], field: string) {
      let end = rightIndex;

      if (!data[rightIndex] || !data[rightIndex][field]) {
        for (let i = rightIndex; i <= data.length; i++) {
          if (data[i] && data[i][field]) end = i;
        }
      }

      if (end < data.length - 1) end += 1;
      return end;
    }

    ctx.restore();
  };

  this.renderPriceLine = function (options) {
    const { ctx, panel, y, value, green, red, open } = options;
    const roundedY = roundAndTranslate(y);

    if (typeof open === "number") {
      const priceLineColor = value - open > 0 ? green : red;
      if (priceLineColor) {
        ctx.strokeStyle = priceLineColor;
      }
    }

    ctx.save();
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(0, roundedY);
    ctx.lineTo(panel._width, roundedY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.closePath();
    ctx.restore();
  };

  this.updateExtremes = function (o, extremes, model, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || linkedSeries.data.length == 0) return;

    if (this.getRenderMode(o, model) == "OHLC" || this.getRenderMode(o, model) == "Bars")
      return this.updateExtremesOHLC(o, extremes, model, seriesManager);
    return this.updateExtremesLine(o, extremes, model, seriesManager);
  };

  this.updateExtremesOHLC = function (o, extremes, model, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return;

    const dfH = o.highDataField ? o.highDataField : o.dataField;
    const dfL = o.lowDataField ? o.lowDataField : o.dataField;
    if (!dfH || !dfL) return;

    for (var i = model._leftIndex; i < model._rightIndex; i++) {
      if (i > linkedSeries.data.length - 1) return;

      const highValue = linkedSeries.data[i]?.[dfH];
      const lowValue = linkedSeries.data[i]?.[dfL];

      if (typeof highValue === "number" && highValue > extremes.max) extremes.max = highValue;
      if (typeof lowValue === "number" && lowValue < extremes.min) extremes.min = lowValue;
    }
  };

  this.updateExtremesLine = function (o, extremes, model, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || !o.dataField) return;

    const renderMode = this.getRenderMode(o, model).toLowerCase();

    if (renderMode == "volume histogram") {
      const localExtremes = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };

      for (var i = model._leftIndex; i < model._rightIndex; i++) {
        if (i > linkedSeries.data.length - 1) {
          o.localExtremes = localExtremes;
          return;
        }
        const value = linkedSeries.data[i][o.dataField];
        if (typeof value !== "number") continue;

        if (value > localExtremes.max) localExtremes.max = value;
        if (value < localExtremes.min) localExtremes.min = value;
      }

      o.localExtremes = localExtremes;
    } else {
      for (var i = model._leftIndex; i < model._rightIndex; i++) {
        if (i > linkedSeries.data.length - 1) {
          return;
        }
        const value = linkedSeries.data[i][o.dataField];
        if (typeof value !== "number") continue;

        if (value > extremes.max) extremes.max = value;
        if (value < extremes.min) extremes.min = value;
      }
    }
  };

  this.getToolTip = function (o, index, model, seriesManager, scriptManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) return null;

    const dataPoint = linkedSeries.data[index];
    if (!dataPoint) return null;

    const values: SeriesTooltipData["values"] = [];
    const { fields, labels } = linkedSeries;
    const precisions = linkedSeries.precisions;

    fields.forEach((field, fieldIndex) => {
      const label = getSeriesLabel(labels, fieldIndex, field);
      const value: SeriesTooltipData["values"][number] = {
        label: resolveChartLocaleMessage(label, label),
        value: dataPoint[field],
      };

      const precision = getSeriesPrecision(precisions, fieldIndex, field);
      if (precision !== undefined) {
        value.precision = precision;
      }

      values.push(value);
    });

    const data: SeriesTooltipData = {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: dataPoint.stamp,
      values: values,
    };

    return data;
  };

  this.tmpIndex = 0;
  this.tmpValue = 0;
  this.tmpPoint = 0;

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    this.clearHits(o);

    if (o.hidden == true) return false;

    const renderMode = this.getRenderMode(o, model).toLowerCase();

    if (renderMode == "ohlc")
      return this.hitOHLC(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "line")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "bars")
      return this.hitBars(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "chartshape")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "band")
      return this.hitBand(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "line and histogram")
      return this.hitLine(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "histogram")
      return this.hitHistogram(x, y, o, renderer, interactor, model, panel, seriesManager);
    if (renderMode == "volume histogram")
      return this.hitVolumeHistogram(x, y, o, renderer, interactor, model, panel, seriesManager);

    return false;
  };

  this.isHitEmpty = function (
    pointX,
    pointY,
    o,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  ) {
    const index = renderer.getPointIndex(pointX, model);
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || !linkedSeries.data || index > linkedSeries.data.length - 1) return true;

    const dataPoint = linkedSeries.data[index];
    if (!dataPoint) return true;

    let allValuesEmpty = true;

    for (const field of linkedSeries.fields) {
      const fieldValue = dataPoint[field];
      if (fieldValue !== null && fieldValue !== undefined) {
        allValuesEmpty = false;
      }
    }

    return allValuesEmpty;
  };

  this.hitOHLC = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    var dfH = o.highDataField ? o.highDataField : o.dataField;
    var dfL = o.lowDataField ? o.lowDataField : o.dataField;
    if (!linkedSeries || !dfH || !dfL) return false;
    if (this.isHitEmpty(x, y, o, renderer, interactor, model, panel, seriesManager)) return false;

    this.tmpIndex = renderer.getPointIndex(x, model);
    const dataPoint = linkedSeries.data[this.tmpIndex];
    if (!dataPoint) return false;

    var hitResult = false;
    var valueH = dataPoint[dfH];
    var valueL = dataPoint[dfL];
    if (typeof valueH !== "number" || typeof valueL !== "number") return false;

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    this.tmpValue = renderer.getPriceForYCoordinate(y - panel._offset, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    });
    if (this.tmpValue <= valueH && this.tmpValue >= valueL) {
      hitResult = true;
    } else {
      var pointH =
        renderer.getYCoordinateForPrice(valueH, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      var pointL =
        renderer.getYCoordinateForPrice(valueL, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      if (pointH == pointL) {
        hitResult = isPointInCircle({ x: x, y: pointH, r: 4 + this.hitTolerance }, x, y);
      }
    }
    o._hit = hitResult == true ? { x: x, y: y } : false;
    return hitResult;
  };

  this.hitBars = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    var dfH = o.highDataField ? o.highDataField : o.dataField;
    var dfL = o.lowDataField ? o.lowDataField : o.dataField;
    if (!linkedSeries || !dfH || !dfL) return false;
    if (this.isHitEmpty(x, y, o, renderer, interactor, model, panel, seriesManager)) return false;

    var hitResult = false;
    var index = renderer.getPointIndex(x, model);
    const dataPoint = linkedSeries.data[index];
    if (!dataPoint) return false;

    var valueH = dataPoint[dfH];
    var valueL = dataPoint[dfL];
    if (typeof valueH !== "number" || typeof valueL !== "number") return false;
    var indexX = renderer.getIndexPoint(index, model) + model.periodWidth / 2;

    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var indexH =
      renderer.getYCoordinateForPrice(valueH, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    var indexL =
      renderer.getYCoordinateForPrice(valueL, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;

    if (
      between(indexX - 1, x, indexX + 1, this.hitTolerance) &&
      between(indexH, y, indexL, this.hitTolerance)
    ) {
      hitResult = true;
    }

    o._hit = hitResult == true ? { x: x, y: y } : false;
    return hitResult;
  };

  this.getLineHitResult = function (
    x,
    y,
    o,
    renderer,
    interactor,
    model,
    panel,
    seriesManager,
    dataField
  ) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries || !dataField) return false;
    if (this.isHitEmpty(x, y, o, renderer, interactor, model, panel, seriesManager)) return false;

    var index = renderer.getPointIndex(x, model);
    if (index > linkedSeries.data.length - 1) return false;
    var closestRightIndex = this.getEndIndex(index, linkedSeries.data, dataField);
    var closestLeftIndex = this.getStartIndex(index, linkedSeries.data, dataField);
    if (linkedSeries.data[index]?.[dataField] === null) index = closestLeftIndex;

    const dataPoint = linkedSeries.data[index];
    const currentValue = dataPoint?.[dataField];
    if (!dataPoint || typeof currentValue !== "number") return false;

    var hitResult = false;
    var fV = LIB.getReferenceValue(o, model, seriesManager);

    var indexY =
      renderer.getYCoordinateForPrice(currentValue, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    //var indexX = Math.round(renderer.getIndexPoint(index, model)+model.periodWidth/2);
    var indexX = renderer.getIndexPoint(index, model) + model.periodWidth / 2;

    if (x > Math.round(indexX) && closestRightIndex < linkedSeries.data.length) {
      const rightValue = linkedSeries.data[closestRightIndex]?.[dataField];
      if (typeof rightValue !== "number") return false;

      var _y =
        renderer.getYCoordinateForPrice(rightValue, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      var _x = renderer.getIndexPoint(closestRightIndex, model) + model.periodWidth / 2;
      if (between(indexY, y, _y, this.hitTolerance)) {
        var nlp1 = getLinePointNearestMouse({ x0: indexX, y0: indexY, x1: _x, y1: _y }, x, y);
        var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
        if (distance < this.hitTolerance) {
          hitResult = true;
        }
      }
    } else if (x < Math.round(indexX) && closestLeftIndex >= 0) {
      const leftValue = linkedSeries.data[closestLeftIndex]?.[dataField];
      if (typeof leftValue !== "number") return false;

      var _y =
        renderer.getYCoordinateForPrice(leftValue, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      var _x = renderer.getIndexPoint(closestLeftIndex, model) + model.periodWidth / 2;
      if (between(indexY, y, _y, this.hitTolerance)) {
        var nlp1 = getLinePointNearestMouse({ x0: indexX, y0: indexY, x1: _x, y1: _y }, x, y);
        var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
        if (distance < this.hitTolerance) {
          hitResult = true;
        }
      }
    } else {
      hitResult = interactor.isOver(x, y, x, indexY, 4);
    }

    o._hit = hitResult == true ? { x: x, y: y } : false;
    return hitResult;
  };

  this.hitLine = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    if (!o.dataField) return false;
    return this.getLineHitResult(
      x,
      y,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
      o.dataField
    );
  };

  this.hitHistogram = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = o.dataField;
    if (!linkedSeries || !field) return false;
    if (this.isHitEmpty(x, y, o, renderer, interactor, model, panel, seriesManager)) return false;

    var index = renderer.getPointIndex(x, model);
    const dataPoint = linkedSeries.data[index];
    const value = dataPoint?.[field];
    if (!dataPoint || typeof value !== "number") return false;

    var hitResult = false;
    var fV = LIB.getReferenceValue(o, model, seriesManager);

    var indexY =
      renderer.getYCoordinateForPrice(value, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    var indexX = renderer.getIndexPoint(index, model) + model.periodWidth / 2;

    if (
      between(indexX - 1, x, indexX + 1, this.hitTolerance) &&
      between(indexY, y, model._height, this.hitTolerance)
    ) {
      hitResult = true;
    }

    o._hit = hitResult == true ? { x: x, y: y } : false;
    return hitResult;
  };

  this.hitVolumeHistogram = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = o.dataField;
    if (!linkedSeries || !field) return false;
    if (this.isHitEmpty(x, y, o, renderer, interactor, model, panel, seriesManager)) return false;

    var index = renderer.getPointIndex(x, model);
    const dataPoint = linkedSeries.data[index];
    const value = dataPoint?.[field];
    const maxValue = o.localExtremes?.max;
    if (!dataPoint || typeof value !== "number" || typeof maxValue !== "number") return false;

    var hitResult = false;

    // var indexY = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[index][o.dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
    const maxHeight = Math.round(panel._height * 0.25);
    var indexY =
      panel._height +
      panel._offset -
      (value / maxValue) * maxHeight;
    var indexX = renderer.getIndexPoint(index, model);

    if (
      between(indexX, x, indexX + model.periodWidth, this.hitTolerance) &&
      between(indexY, y, panel._height + panel._offset, this.hitTolerance)
    ) {
      hitResult = true;
    }

    o._hit = hitResult == true ? { x: x, y: y } : false;
    return hitResult;
  };

  this.hitBand = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    if (!o.upperField || !o.lowerField) return false;

    const upperHitResult = this.getLineHitResult(
      x,
      y,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
      o.upperField
    );
    if (upperHitResult) return upperHitResult;

    const lowerHitResult = this.getLineHitResult(
      x,
      y,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
      o.lowerField
    );
    if (lowerHitResult) return lowerHitResult;

    return false;
  };

  this.getMin = function (index, o, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const dataPoint = linkedSeries?.data[index];
    if (!linkedSeries || !dataPoint) return 0;

    var min = Number.MAX_VALUE;
    var fields = linkedSeries.fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] != "v" && fields[i] != "i") {
        const fieldValue = dataPoint[fields[i]];
        if (typeof fieldValue === "number" && fieldValue < min) min = fieldValue;
      }
    }
    return min === Number.MAX_VALUE ? 0 : min;
  };

  this.getMax = function (index, o, seriesManager) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    const dataPoint = linkedSeries?.data[index];
    if (!linkedSeries || !dataPoint) return 0;

    var max = -Number.MAX_VALUE;
    var fields = linkedSeries.fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] != "v" && fields[i] != "i") {
        const fieldValue = dataPoint[fields[i]];
        if (typeof fieldValue === "number" && fieldValue > max) max = fieldValue;
      }
    }
    return max === -Number.MAX_VALUE ? 0 : max;
  };
};

/*
 * Próba wydzielenia z SeriesObjecta oddzielnego renderera dla seri wskaźników
 * - sporo przeróbek w fusion - narazie ostawione na bok
 */

const SeriesObjectCtor = SeriesObject as unknown as RuntimeObjectConstructor<SeriesRuntime>;
export { SeriesObjectCtor as SeriesObject };
