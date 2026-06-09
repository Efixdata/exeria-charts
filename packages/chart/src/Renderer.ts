import WEBRCP from "./WebRCP";
import { resolveChartLocaleMessage, resolveCatalogLocaleMessage } from "./chartLocaleRuntime";
import { getCatalogTypeForScriptId } from "./locale/catalogTranslator";
import LIB from "./utils/chartingCommons";
import {
  Series,
  SeriesObject,
  StrategyObject,
  IndicatorObject,
  CandlestickPatternStrategyObject,
  FractalsObject,
  TradeObject,
  StopLimitObject,
  MovePaneArrows,
} from "./Objects";
import {
  Shape,
  TrendLineObject,
  TrendRayObject,
  HorizontalRayObject,
  VerticalRayObject,
  CrossLineObject,
  FibonLinesObject,
  FibonExtensionObject,
  FibonTimeZoneObject,
  FibonChannelObject,
  FibonArcsObject,
  FibonCirclesObject,
  ParallelChannelObject,
  PitchforkObject,
  RegressionChannelObject,
  GannFanObject,
  GannGridObject,
  GannBoxObject,
  ArrowObject,
  BrushObject,
  HorizontalLineObject,
  VerticalLineObject,
  DiNapoliLevels,
  DiNapoliAbcObject,
  MultiLineObject,
  AbcdObject,
  EllipseObject,
  HorizontalRangeObject,
  VerticalRangeObject,
  TimeRangeObject,
  TimeBetObject,
  CycleObject,
  TextObject,
  BoxObject,
  FixedRangeVolumeProfileObject,
  TriangleObject,
  PriceTagObject,
  LongShortPositionObject,
} from "./Objects2";
import { measurePriceTextWidth, renderPriceText } from "./utils/objects-lib";
import { withShapeOpacity } from "./shapeStyle";
import type { CoreChartController, CoreChartModel } from "./internal-types/chart";
import type { CoreFusionRuntime } from "./internal-types/fusion";
import type {
  ChartRuntimeObject,
  CoreRendererObject,
  KnownRendererObjectsRegistry,
  RendererObjectsRegistry,
} from "./internal-types/objects";
import type {
  CoreRenderer,
  CoreRendererConstructor,
  LegendCloseHit,
  RendererSettings,
  ValueAxisTick,
  ValueConverterLike,
} from "./internal-types/renderer";
import type { CoreChartPanel } from "./internal-types/chart";
import { hitTolerance } from "./utils/environment";
import {
  getLegendLayoutMetrics,
  getPriceAxisFontKeys,
  isModelCompactLayout,
  truncateCanvasText,
} from "./utils/compactLayout";
import {
  formatFullAxisPrice,
  formatValueAxisPriceLabel,
  layoutValueAxisLabels,
  deriveCompactAxisHeadPrefix,
  splitCompactAxisByHead,
  PRICE_AXIS_PREFIX_MIN_LENGTH,
  valuesShareCompactHead,
} from "./utils/formatPriceLabel";
import {
  drawLedgerAxisAnchorRow,
  drawPriceAxisExpandHint,
  getCollapsedLedgerDividerX,
  getPriceAxisChromeLayout,
  getPriceAxisExpandHintLayout,
  drawLedgerPriceTagLabel,
  getValueAxisLedgerGeometry,
  layoutLedgerAxisColumn,
  layoutPriceTag,
} from "./utils/priceAxisLayout";

type LegendRenderValue = {
  label: { text?: string; x?: number; y?: number };
  value: { text?: string; x?: number; y?: number; zerosToReduce?: number };
  separator: { text?: string; x?: number; y?: number };
};

const LEGEND_CLOSE_GAP = 8;
const LEGEND_CLOSE_HALF = 3.5;

function isLegendBackgroundVisible(color: string | null | undefined): boolean {
  if (!color) return false;
  const normalized = String(color).trim().toLowerCase();
  if (normalized === "transparent") return false;
  const rgbaMatch = normalized.match(
    /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*([\d.]+%?))?\s*\)$/
  );
  if (rgbaMatch && rgbaMatch[4] != null) {
    const alpha = parseFloat(rgbaMatch[4]);
    if (!Number.isNaN(alpha) && alpha <= 0) return false;
  }
  return true;
}

function drawLegendCloseIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - LEGEND_CLOSE_HALF);
  ctx.lineTo(x + LEGEND_CLOSE_HALF, y + LEGEND_CLOSE_HALF);
  ctx.moveTo(x, y + LEGEND_CLOSE_HALF);
  ctx.lineTo(x + LEGEND_CLOSE_HALF, y - LEGEND_CLOSE_HALF);
  ctx.stroke();
  ctx.restore();
}

type RendererRuntimeError = {
  type?: string;
  message?: string;
  stack?: string;
};

function isRendererRuntimeError(error: unknown): error is RendererRuntimeError {
  return typeof error === "object" && error !== null;
}

function resolveThemeColor(token: string, fallbackToken: string): string {
  const colorManager = WEBRCP.utils.colorManager;
  const value = colorManager.getColor(token);
  const fallbacks = [fallbackToken, "primaryTextColor", "priceAxisTextColor", "timeAxisTextColor"];

  if (!value || value === token || value.toLowerCase() === "transparent") {
    for (const fallback of fallbacks) {
      const next = colorManager.getColor(fallback);
      if (next && next !== fallback && next.toLowerCase() !== "transparent") {
        return next;
      }
    }
  }

  return value;
}

const TIME_AXIS_LABEL_GAP = 12;
const TIME_AXIS_ESTIMATED_LABEL_WIDTH = 96;

type TimeAxisFormat = "time" | "day-time" | "date";

function getTimeAxisMinSpacing(model: CoreChartModel): number {
  const configured = model.minTimeTickWidth > 0 ? model.minTimeTickWidth : 90;
  return Math.max(configured, TIME_AXIS_ESTIMATED_LABEL_WIDTH + TIME_AXIS_LABEL_GAP);
}

function downsampleTimeTicks(ticks: number[], maxCount: number): number[] {
  if (ticks.length <= maxCount) {
    return ticks;
  }

  if (maxCount <= 1) {
    return [ticks[0]];
  }

  const result: number[] = [];
  const last = ticks.length - 1;

  for (let i = 0; i < maxCount; i++) {
    result.push(ticks[Math.round((i / (maxCount - 1)) * last)]);
  }

  return result;
}

function resolveTimeAxisFormat(
  tickIndices: number[],
  data: Array<{ stamp?: number }>,
): TimeAxisFormat {
  if (tickIndices.length < 2) {
    return "day-time";
  }

  const firstStamp = data[tickIndices[0]]?.stamp;
  const lastStamp = data[tickIndices[tickIndices.length - 1]]?.stamp;

  if (typeof firstStamp !== "number" || typeof lastStamp !== "number") {
    return "day-time";
  }

  const spanMs = Math.abs(lastStamp - firstStamp);
  const avgIntervalMs = spanMs / Math.max(1, tickIndices.length - 1);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (avgIntervalMs <= 2 * hour) {
    return "time";
  }

  if (avgIntervalMs <= 1.5 * day) {
    return "day-time";
  }

  if (spanMs >= 45 * day) {
    return "date";
  }

  return "day-time";
}

function formatTimeAxisLabel(
  stamp: number,
  format: TimeAxisFormat,
  months: string[],
  zeroLead: (num: number) => string,
  prevStamp?: number | null,
): string {
  const date = new Date(stamp);
  const day = zeroLead(date.getDate());
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).substring(2, 4);
  const hours = zeroLead(date.getHours());
  const minutes = zeroLead(date.getMinutes());
  const currentYear = new Date().getFullYear();
  const hideYear = date.getFullYear() === currentYear;

  if (format === "time") {
    return `${hours}:${minutes}`;
  }

  if (format === "date") {
    return hideYear ? `${day}.${month}` : `${day}.${month}.${year}`;
  }

  if (typeof prevStamp === "number") {
    const prev = new Date(prevStamp);
    const sameDay =
      date.getDate() === prev.getDate() &&
      date.getMonth() === prev.getMonth() &&
      date.getFullYear() === prev.getFullYear();

    if (sameDay) {
      return `${hours}:${minutes}`;
    }

    if (hideYear) {
      return `${day}.${month} ${hours}:${minutes}`;
    }

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  if (hideYear) {
    return `${day}.${month} ${hours}:${minutes}`;
  }

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

const Renderer: CoreRendererConstructor = function (
  this: CoreRenderer,
  settings: RendererSettings,
  context: CanvasRenderingContext2D | null,
  controller: CoreChartController
) {
  const logConverter = LIB._converterLog as ValueConverterLike;
  const linConverter = LIB._converterLin as ValueConverterLike;

  this.context = context;
  this.controller = controller;
  this.settings = settings;
  this.priceRenderingOptions = {
    valueAxisWidth: 0,
    magnitude: 1,
    zerosToReduce: 0,
    axisLabelPrefix: "",
    axisUsePrefixHeader: false,
  };
  this.volumePrecision = 2;
  this.timeTicks = [];

  var series = new Series(); //instancja bazowa
  SeriesObject.prototype = series;
  StrategyObject.prototype = series;
  IndicatorObject.prototype = series;

  var shape = new Shape(); //instancja bazowa
  TrendLineObject.prototype = shape;
  TrendRayObject.prototype = shape;
  HorizontalRayObject.prototype = shape;
  VerticalRayObject.prototype = shape;
  CrossLineObject.prototype = shape;
  ArrowObject.prototype = shape;
  BrushObject.prototype = shape;
  ParallelChannelObject.prototype = shape;
  PitchforkObject.prototype = shape;
  RegressionChannelObject.prototype = shape;
  GannFanObject.prototype = shape;
  GannGridObject.prototype = shape;
  GannBoxObject.prototype = shape;
  FibonLinesObject.prototype = shape;
  FibonExtensionObject.prototype = shape;
  FibonTimeZoneObject.prototype = shape;
  FibonChannelObject.prototype = shape;
  FibonArcsObject.prototype = shape;
  FibonCirclesObject.prototype = shape;
  HorizontalLineObject.prototype = shape;
  VerticalLineObject.prototype = shape;
  MultiLineObject.prototype = shape;
  AbcdObject.prototype = shape;
  EllipseObject.prototype = shape;
  HorizontalRangeObject.prototype = shape;
  VerticalRangeObject.prototype = shape;
  TimeRangeObject.prototype = shape;
  TimeBetObject.prototype = shape;
  CycleObject.prototype = shape;
  BoxObject.prototype = shape;
  FixedRangeVolumeProfileObject.prototype = shape;
  TextObject.prototype = shape;
  TriangleObject.prototype = shape;
  PriceTagObject.prototype = shape;
  LongShortPositionObject.prototype = shape;

  DiNapoliLevels.prototype = shape;
  DiNapoliAbcObject.prototype = shape;

  const rendererObjects: KnownRendererObjectsRegistry = {
    SeriesObject: new SeriesObject(),
    StrategyObject: new StrategyObject(),
    CandlestickPatternStrategyObject: new CandlestickPatternStrategyObject(),
    FractalsObject: new FractalsObject(),
    IndicatorObject: new StrategyObject(),
    TradeObject: new TradeObject(this.settings.positions),
    StopLimitObject: new StopLimitObject(this.settings.positions),
    POSITION: new TradeObject(this.settings.positions),
    TP: new TradeObject(this.settings.orders),
    SL: new TradeObject(this.settings.orders),
    "BUY LIMIT": new TradeObject(this.settings.orders),
    "BUY STOP": new TradeObject(this.settings.orders),
    "BUY STOP_LIMIT": new StopLimitObject(this.settings.orders),
    "SELL LIMIT": new TradeObject(this.settings.orders),
    "SELL STOP": new TradeObject(this.settings.orders),
    "SELL STOP_LIMIT": new StopLimitObject(this.settings.orders),
    "SELL TRAILING_STOP": new TradeObject(this.settings.orders),
    "BUY TRAILING_STOP": new TradeObject(this.settings.orders),
    "SELL TAKE_PROFIT": new TradeObject(this.settings.orders),
    "BUY TAKE_PROFIT": new TradeObject(this.settings.orders),
    "SELL TAKE_PROFIT_MARKET": new TradeObject(this.settings.orders),
    "BUY TAKE_PROFIT_MARKET": new TradeObject(this.settings.orders),
    "SELL TAKE_PROFIT_LIMIT": new StopLimitObject(this.settings.orders),
    "BUY TAKE_PROFIT_LIMIT": new StopLimitObject(this.settings.orders),
    MovePaneArrows: new MovePaneArrows(),
    trendLine: new TrendLineObject(),
    trendRay: new TrendRayObject(),
    hRay: new HorizontalRayObject(),
    vRay: new VerticalRayObject(),
    crossLine: new CrossLineObject(),
    arrow: new ArrowObject(),
    brush: new BrushObject(),
    parallelChannel: new ParallelChannelObject(),
    pitchfork: new PitchforkObject(),
    regressionChannel: new RegressionChannelObject(),
    gannFan: new GannFanObject(),
    gannGrid: new GannGridObject(),
    gannBox: new GannBoxObject(),
    fibonLines: new FibonLinesObject(),
    fibonExtension: new FibonExtensionObject(),
    fibonTimeZone: new FibonTimeZoneObject(),
    fibonChannel: new FibonChannelObject(),
    fibonArcs: new FibonArcsObject(),
    fibonCircles: new FibonCirclesObject(),
    hLine: new HorizontalLineObject(),
    vLine: new VerticalLineObject(),
    mLine: new MultiLineObject(),
    abcd: new AbcdObject(),
    ellipse: new EllipseObject(),
    box: new BoxObject(),
    fixedRangeVolumeProfile: new FixedRangeVolumeProfileObject(),
    hRange: new HorizontalRangeObject(),
    vRange: new VerticalRangeObject(),
    timeRange: new TimeRangeObject(),
    timeBet: new TimeBetObject(),
    cycle: new CycleObject(),
    textAnnotation: new TextObject(),
    triangle: new TriangleObject(),
    priceTag: new PriceTagObject(),
    longShortPosition: new LongShortPositionObject(),
    diNapoliLevels: new DiNapoliLevels(),
    diNapoliAbcd: new DiNapoliAbcObject(),
  };

  this.objects = rendererObjects as RendererObjectsRegistry;

  const getRendererObject = (type: string | undefined): CoreRendererObject | undefined => {
    if (!type || !Object.prototype.hasOwnProperty.call(this.objects, type)) return undefined;
    return this.objects[type];
  };

  type ShapeAnchorRenderer = {
    getPoints: Shape["getPoints"];
    renderAnchorsOverlay: Shape["renderAnchorsOverlay"];
  };

  const asShapeAnchorRenderer = (
    rendererObject: CoreRendererObject | undefined,
  ): ShapeAnchorRenderer | null => {
    if (
      rendererObject == null ||
      typeof (rendererObject as unknown as ShapeAnchorRenderer).getPoints !== "function" ||
      typeof (rendererObject as unknown as ShapeAnchorRenderer).renderAnchorsOverlay !== "function"
    ) {
      return null;
    }
    return rendererObject as unknown as ShapeAnchorRenderer;
  };

  this.validateSeriesBeforeRender = function (series) {
    try {
      if (!series || !Array.isArray(series.data) || !series.data[0])
        throw { type: "EMPTY_SERIES", message: "Can't render/push/pop on empty data series" };
    } catch (_error: unknown) {
      throw { type: "EMPTY_SERIES", message: "Can't render/push/pop on empty data series" };
    }
  };

  this.render = function (ctx, model, fusion, translate, omitObject) {
    try {
      //ctx.translate(0.5, 0.5);
      ctx.clearRect(-1, -1, model._width + 2, model._height + 2);
      var seriesManager = fusion.getSeriesManager();

      this.validateSeriesBeforeRender(seriesManager[model.mainSeries]);

      ctx.font = WEBRCP.utils.colorManager.getFont("text");

      this.calculateTimeTicks(model, seriesManager);

      //## Render panels
      var panel = null;
      for (var i = 0; i < model.panels.length; i++) {
        panel = model.panels[i];
        if (panel._visible) this.renderPanel(ctx, model, panel, fusion, omitObject);
      }

      //## Render handlers
      for (var i = 0; i < model.panels.length; i++) {
        panel = model.panels[i];
        if (panel._visible) this.renderHandler(ctx, model, panel);
      }

      //## Post rendering - all objects have the possibility to draw something on whole chart after rendering
      for (var i = 0; i < model.panels.length; i++) {
        panel = model.panels[i];
        if (panel._visible) this.postRenderPlotPane(ctx, model, panel, seriesManager, omitObject);
      }

      //## Render time axis last so panel overlays cannot cover it
      this.renderTimeAxis(ctx, model, this.timeTicks, fusion);
    } catch (error: unknown) {
      if (isRendererRuntimeError(error) && error.type === "EMPTY_SERIES") {
        console.warn(error.message);
      } else {
        console.warn(error);
      }
    } finally {
      // ctx.translate (-0.5, -0.5);
    }
  };

  this.renderPanel = function (ctx, model, panel, fusion, omitObject) {
    const seriesManager = fusion.getSeriesManager();
    const valueTick = this.calculateNiceTick(model, panel);

    try {
      this.validateSeriesBeforeRender(seriesManager[model.mainSeries]);
    } catch (e) {
      this.onErrorWhileRendering(e);
    }

    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("backgroundColor");
    ctx.fillRect(
      0,
      panel._offset,
      panel._width - this.priceRenderingOptions.valueAxisWidth,
      panel._height
    );

    if (panel.hGrid) this.renderHGrid(ctx, model, panel, valueTick);
    if (panel.vGrid) this.renderVGrid(ctx, model, panel, this.timeTicks);

    this.renderPlotPane(ctx, model, panel, seriesManager, omitObject);
    this.renderValueAxis(ctx, model, panel, valueTick, fusion);

    if (model.mode === "normal") {
      try {
        this.renderLegend(ctx, model, panel, fusion);
      } catch (e) {
        this.onErrorWhileRendering(e);
      }
    }
  };

  this.renderPlotPane = function (ctx, model, panel, seriesManager, omitObject) {
    if (!omitObject || typeof omitObject === "boolean") omitObject = { id: "none" };
    const omitObjectId = typeof omitObject === "object" && omitObject ? omitObject.id : undefined;

    ctx.save();
    ctx.rect(
      0,
      panel._offset,
      panel._width - this.priceRenderingOptions.valueAxisWidth,
      panel._height
    );
    ctx.clip();
    ctx.font = WEBRCP.utils.colorManager.getFont("text");

    if (panel.zeroLine) {
      var y =
        this.getYCoordinateForPrice(0, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
        }) + panel._offset;
      ctx.strokeStyle = panel.zeroLine.color;
      ctx.lineWidth = panel.zeroLine.width;
      ctx.setLineDash(panel.zeroLine.dash);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(panel._width, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.closePath();
    }

    for (var i = 0; i < panel.objects.length; i++) {
      let object = panel.objects[i];

      if (object.isValid && !object.isValid(object)) continue;
      if (object.permHide) object.hidden = true;
      if (object.hidden && object.hidden === true) continue;
      if (object.isBeingDragged) continue;

      const objectRenderer = getRendererObject(object.type);
      if (objectRenderer && object.id != omitObjectId) {
        try {
          withShapeOpacity(ctx, object, () =>
            objectRenderer.render(object, ctx, this, model, panel, seriesManager),
          );
        } catch (e) {
          this.onErrorWhileRendering(e);
        }
      }
    }

    if (model.orders.visible) {
      if (panel.main == true && model.orders && model.orders.list && model.orders.list.length > 0) {
        for (var i = 0; i < model.orders.list.length; i++) {
          if (model.orders.list[i] != omitObject && !model.orders.list[i].drag)
            try {
              const orderRenderer = getRendererObject(model.orders.list[i].type);
              orderRenderer?.render(model.orders.list[i], ctx, this, model, panel, seriesManager);
            } catch (e) {
              this.onErrorWhileRendering(e);
            }
        }
      }
    }

    if (model.positions.visible) {
      if (
        panel.main == true &&
        model.positions &&
        model.positions.list &&
        model.positions.list.length > 0
      ) {
        for (var i = 0; i < model.positions.list.length; i++) {
          if (model.positions.list[i] != omitObject)
            try {
              const positionRenderer = getRendererObject(model.positions.list[i].type);
              positionRenderer?.render(
                model.positions.list[i],
                ctx,
                this,
                model,
                panel,
                seriesManager,
              );
            } catch (e) {
              this.onErrorWhileRendering(e);
            }
        }
      }
    }

    try {
      this.objects.MovePaneArrows.render(
        null as unknown as ChartRuntimeObject,
        ctx,
        this,
        model,
        panel,
        seriesManager
      );
    } catch (e) {
      this.onErrorWhileRendering(e);
    }

    ctx.restore();
  };

  this.onErrorWhileRendering = function (e) {
    const renderError = e as { type?: unknown; message?: unknown };
    if (renderError.type === "EMPTY_SERIES") console.warn(renderError.message);
    else console.warn(e);
  };

  this.postRenderPlotPane = function (ctx, model, panel, seriesManager, omitObject) {
    if (model.orders.visible) {
      if (panel.main == true && model.orders && model.orders.list && model.orders.list.length > 0) {
        for (var i = 0; i < model.orders.list.length; i++) {
          if (model.orders.list[i] != omitObject && !model.orders.list[i].drag)
            try {
              const orderRenderer = getRendererObject(model.orders.list[i].type);
              orderRenderer?.postRender(
                model.orders.list[i],
                ctx,
                this,
                model,
                panel,
                seriesManager,
              );
            } catch (e) {
              this.onErrorWhileRendering(e);
            }
        }
      }
    }

    if (model.positions.visible) {
      if (
        panel.main == true &&
        model.positions &&
        model.positions.list &&
        model.positions.list.length > 0
      ) {
        for (var i = 0; i < model.positions.list.length; i++) {
          if (model.positions.list[i] != omitObject)
            try {
              const positionRenderer = getRendererObject(model.positions.list[i].type);
              positionRenderer?.postRender(
                model.positions.list[i],
                ctx,
                this,
                model,
                panel,
                seriesManager,
              );
            } catch (e) {
              this.onErrorWhileRendering(e);
            }
        }
      }
    }

    for (var i = 0; i < panel.objects.length; i++) {
      if (panel.objects[i]["hidden"] && panel.objects[i]["hidden"] == true) continue;

      const panelRenderer = getRendererObject(panel.objects[i].type);
      if (panelRenderer)
        try {
          withShapeOpacity(ctx, panel.objects[i], () =>
            panelRenderer.postRender(
              panel.objects[i],
              ctx,
              this,
              model,
              panel,
              seriesManager,
            ),
          );
        } catch (e) {
          this.onErrorWhileRendering(e);
        }
    }
  };

  this.shouldBePanelVisible = function (panel) {
    for (var i = 0; i < panel.objects.length; i++) {
      if (!panel.objects[i].hidden) return true;
    }
    return false;
  };

  this.renderOverlay = function (octx, model, fusion) {
    var seriesManager = fusion.getSeriesManager();
    octx.font = WEBRCP.utils.colorManager.getFont("text");

    //## fire render overlay on all objects!
    for (var pi = 0; pi < model.panels.length; pi++) {
      var panel = model.panels[pi];

      try {
        octx.save();
        // octx.translate (0.5, 0.5);
        octx.rect(
          0,
          panel._offset,
          panel._width - this.priceRenderingOptions.valueAxisWidth,
          panel._height
        );
        octx.clip();
        octx.font = WEBRCP.utils.colorManager.getFont("text");

        for (var oi = 0; oi < panel.objects.length; oi++) {
          var o = panel.objects[oi];
          if (o.hidden && o.hidden === true) continue;

          const overlayRenderer = getRendererObject(o.type);
          const renderOverlay = overlayRenderer?.renderOverlay;
          if (renderOverlay) {
            renderOverlay(o, octx, this, model, panel, seriesManager);
          }
        }

        if (model.orders.visible) {
          if (
            panel.main == true &&
            model.orders &&
            model.orders.list &&
            model.orders.list.length > 0
          ) {
            for (var i = 0; i < model.orders.list.length; i++) {
              const orderRenderer = getRendererObject(model.orders.list[i].type);
              if (orderRenderer?.renderOverlay) {
                orderRenderer.renderOverlay(
                  model.orders.list[i],
                  octx,
                  this,
                  model,
                  panel,
                  seriesManager
                );
              }
            }
          }
        }

        if (model.positions.visible) {
          if (
            panel.main == true &&
            model.positions &&
            model.positions.list &&
            model.positions.list.length > 0
          ) {
            for (var i = 0; i < model.positions.list.length; i++) {
              const positionRenderer = getRendererObject(model.positions.list[i].type);
              if (positionRenderer?.renderOverlay) {
                positionRenderer.renderOverlay(
                  model.positions.list[i],
                  octx,
                  this,
                  model,
                  panel,
                  seriesManager
                );
              }
            }
          }
        }
      } catch (e: any) {
        console.error(e, e.stack);
      } finally {
        //permamently close all earlier paths (some can be unclosed)
        octx.beginPath();
        octx.closePath();
        // octx.translate (-0.5, -0.5);
        octx.restore();
      }
    }
  };

  this.renderSelectionHandles = function (
    octx: CanvasRenderingContext2D,
    model: CoreChartModel,
    fusion: CoreFusionRuntime,
    selectedObject: ChartRuntimeObject,
  ) {
    if (!selectedObject?.id || !selectedObject.type) {
      return;
    }

    const shapeRenderer = asShapeAnchorRenderer(getRendererObject(selectedObject.type));
    if (!shapeRenderer) {
      return;
    }

    const seriesManager = fusion.getSeriesManager();

    for (let panelIndex = 0; panelIndex < model.panels.length; panelIndex += 1) {
      const panel = model.panels[panelIndex];
      let panelObject: ChartRuntimeObject | undefined;

      for (let objectIndex = 0; objectIndex < panel.objects.length; objectIndex += 1) {
        if (panel.objects[objectIndex].id === selectedObject.id) {
          panelObject = panel.objects[objectIndex];
          break;
        }
      }

      if (!panelObject || !Array.isArray((panelObject as { anchors?: unknown }).anchors)) {
        continue;
      }

      panelObject.selected = true;

      const anchors = Array.isArray((panelObject as { anchors?: unknown }).anchors)
        ? ((panelObject as unknown as { anchors: Array<{ expandable?: boolean }> }).anchors)
        : [];
      const drawArrowHandles =
        panelObject.type !== "fibonArcs" &&
        panelObject.type !== "fibonCircles" &&
        anchors.some((anchor) => anchor.expandable === true);

      try {
        octx.save();
        octx.globalAlpha = 1;
        const plotRight = panel._width - this.priceRenderingOptions.valueAxisWidth;
        octx.rect(0, panel._offset, plotRight, panel._height);
        octx.clip();

        shapeRenderer.renderAnchorsOverlay(
          panelObject as Parameters<Shape["renderAnchorsOverlay"]>[0],
          octx,
          this,
          model,
          panel,
          seriesManager,
          { drawArrowHandles, forceShow: true },
        );
      } catch (error) {
        console.error(error);
      } finally {
        octx.restore();
      }

      return;
    }
  };

  this.renderRangeAxisGuides = function (
    octx: CanvasRenderingContext2D,
    model: CoreChartModel,
    fusion: CoreFusionRuntime,
  ) {
    const seriesManager = fusion.getSeriesManager();

    for (let panelIndex = 0; panelIndex < model.panels.length; panelIndex += 1) {
      const panel = model.panels[panelIndex];

      for (let objectIndex = 0; objectIndex < panel.objects.length; objectIndex += 1) {
        const object = panel.objects[objectIndex];
        if (object.hidden === true || (!object.selected && !object._hit)) {
          continue;
        }

        const type = String(object.type || "");
        const shapeRenderer = getRendererObject(type);
        if (!shapeRenderer || typeof shapeRenderer.getPoints !== "function") {
          continue;
        }

        const points = shapeRenderer.getPoints(object, this, panel, model, seriesManager);
        if (!Array.isArray(points) || points.length < 2) {
          continue;
        }

        const color = object.color
          ? WEBRCP.utils.colorManager.getColor(String(object.color), String(object.color))
          : WEBRCP.utils.colorManager.getColor("defaultToolColor");
        const textColor = WEBRCP.utils.getContrastColor(color);
        const plotRight = panel._width - this.priceRenderingOptions.valueAxisWidth;

        if (type === "hRange" || type === "timeRange") {
          const xValues = points.map((point) => point.x).sort((left, right) => left - right);
          const xMin = xValues[0];
          const xMax = xValues[xValues.length - 1];

          octx.save();
          octx.setLineDash([2, 5]);
          octx.strokeStyle = color;
          octx.lineWidth = 1;
          octx.beginPath();
          octx.moveTo(xMin, panel._offset);
          octx.lineTo(xMin, model._height);
          octx.moveTo(xMax, panel._offset);
          octx.lineTo(xMax, model._height);
          octx.stroke();
          octx.restore();

          this.drawTimeTag(octx, model, xMin, color, textColor, fusion);
          this.drawTimeTag(octx, model, xMax, color, textColor, fusion);
          continue;
        }

        if (type === "vRange") {
          const yValues = points.map((point) => point.y).sort((left, right) => left - right);
          const yMin = yValues[0];
          const yMax = yValues[yValues.length - 1];
          const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
          const priceContext = {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV: referenceValue,
          };

          octx.save();
          octx.setLineDash([2, 5]);
          octx.strokeStyle = color;
          octx.lineWidth = 1;
          octx.beginPath();
          octx.moveTo(0, yMin);
          octx.lineTo(plotRight, yMin);
          octx.moveTo(0, yMax);
          octx.lineTo(plotRight, yMax);
          octx.stroke();
          octx.restore();

          const priceMin = this.getPriceForYCoordinate(yMin - panel._offset, priceContext);
          const priceMax = this.getPriceForYCoordinate(yMax - panel._offset, priceContext);
          this.drawPriceTag(octx, model, panel, yMin, color, textColor, priceMin);
          this.drawPriceTag(octx, model, panel, yMax, color, textColor, priceMax);
        }
      }
    }
  };

  this.postRenderOverlay = function (octx, model, seriesManager) {
    //postRenderOverlay
    for (var pi = 0; pi < model.panels.length; pi++) {
      var panel = model.panels[pi];

      try {
        octx.save();
        // octx.translate (0.5, 0.5);
        octx.rect(0, panel._offset, panel._width, panel._height);
        octx.clip();

        for (var oi = 0; oi < panel.objects.length; oi++) {
          var o = panel.objects[oi];
          if (o["hidden"] && o["hidden"] == true) continue;

          const postOverlayRenderer = getRendererObject(o.type);
          if (postOverlayRenderer?.postRenderOverlay) {
            postOverlayRenderer.postRenderOverlay(o, octx, this, model, panel, seriesManager);
          }
        }

        if (model.orders.visible) {
          if (
            panel.main == true &&
            model.orders &&
            model.orders.list &&
            model.orders.list.length > 0
          ) {
            for (var i = 0; i < model.orders.list.length; i++) {
              const orderRenderer = getRendererObject(model.orders.list[i].type);
              if (orderRenderer?.postRenderOverlay) {
                orderRenderer.postRenderOverlay(
                  model.orders.list[i],
                  octx,
                  this,
                  model,
                  panel,
                  seriesManager
                );
              }
            }
          }
        }

        if (model.positions.visible) {
          if (
            panel.main == true &&
            model.positions &&
            model.positions.list &&
            model.positions.list.length > 0
          ) {
            for (var i = 0; i < model.positions.list.length; i++) {
              const positionRenderer = getRendererObject(model.positions.list[i].type);
              if (positionRenderer?.postRenderOverlay) {
                positionRenderer.postRenderOverlay(
                  model.positions.list[i],
                  octx,
                  this,
                  model,
                  panel,
                  seriesManager
                );
              }
            }
          }
        }
      } catch (e: any) {
        console.error(e, e.stack);
      } finally {
        //permamently close all earlier paths (some can be unclosed)
        octx.beginPath();
        octx.closePath();
        // octx.translate (-0.5, -0.5);
        octx.restore();
      }
    }
  };

  this.renderValueAxis = function (
    ctx: CanvasRenderingContext2D,
    model: CoreChartModel,
    panel: CoreChartPanel,
    tick: ValueAxisTick,
    fusion?: CoreFusionRuntime,
  ) {
    const mode = panel.valueAxisMode;

    try {
      let tickValue = tick.niceMin;
      const tickEntries: Array<{ value: number; y: number }> = [];
      const texts: Array<{ text: string; ctx: CanvasRenderingContext2D; y: number }> = [];
      let tickPoint = 0;
      let precision = this.getPrecision(model, panel);

      if (mode == "perc") {
        precision = 2;
      }

      const expanded = model._priceAxisExpanded === true;
      const usePercent = panel.valueAxisMode == "perc";

      while (tickValue < tick.niceMax) {
        tickValue += tick.tickSpacing;
        tickPoint =
          this.getYCoordinateForPrice(tickValue, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
          }) + panel._offset;

        if (tickPoint < panel._offset) continue;

        let value = tickValue;

        if (mode == "log") {
          value = logConverter.axisToReal?.(tickValue, 1) ?? tickValue;
        }

        tickEntries.push({ value, y: tickPoint + 2 });
      }

      const tickValues = tickEntries.map((entry) => entry.value);
      const layoutReferencePrices = [...tickValues];

      if (!usePercent && !expanded) {
        let refMin = panel.vMin;
        let refMax = panel.vMax;
        if (mode == "log") {
          refMin = logConverter.axisToReal?.(panel.vMin, 1) ?? panel.vMin;
          refMax = logConverter.axisToReal?.(panel.vMax, 1) ?? panel.vMax;
        }
        if (Number.isFinite(refMin)) layoutReferencePrices.push(refMin);
        if (Number.isFinite(refMax)) layoutReferencePrices.push(refMax);

        if (panel.main === true && fusion) {
          const seriesData = fusion.getMainSeries()?.data;
          if (seriesData?.length) {
            const lastIndex = Math.min(
              fusion.getMainSeriesLastIndex(),
              Math.max(0, model._rightIndex - 1),
            );
            const left = Math.max(0, model._leftIndex);
            const right = Math.min(model._rightIndex, seriesData.length);
            for (let i = left; i < right; i++) {
              const bar = seriesData[i];
              if (typeof bar?.h === "number") layoutReferencePrices.push(bar.h);
              if (typeof bar?.l === "number") layoutReferencePrices.push(bar.l);
            }
            const lastBar = seriesData[lastIndex];
            if (typeof lastBar?.c === "number") layoutReferencePrices.push(lastBar.c);
          }
        }
      }

      this.priceRenderingOptions.axisLabelPrefix = "";
      this.priceRenderingOptions.axisUsePrefixHeader = false;
      this.priceRenderingOptions.ledgerSuffixRightX = undefined;
      this.priceRenderingOptions.ledgerColumnSplitX = undefined;
      this.priceRenderingOptions.ledgerTickSuffixTexts = undefined;

      let axisLayout =
        usePercent || expanded
          ? { prefix: "", usePrefixHeader: false }
          : layoutValueAxisLabels(layoutReferencePrices, precision, false);

      const showExpandHint = !expanded && panel.main === true;
      const compactAxis = isModelCompactLayout(model);
      const compactCollapsed = compactAxis && !expanded && !usePercent;

      if (compactCollapsed && !axisLayout.usePrefixHeader) {
        const forcedPrefix = deriveCompactAxisHeadPrefix(layoutReferencePrices, precision);
        if (
          forcedPrefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH &&
          valuesShareCompactHead(layoutReferencePrices, precision, forcedPrefix)
        ) {
          axisLayout = { prefix: forcedPrefix, usePrefixHeader: true };
        }
      }

      const useLedgerColumn = axisLayout.usePrefixHeader && compactCollapsed;

      const chromeLayout = expanded
        ? null
        : getPriceAxisChromeLayout(panel._offset, panel._height, compactAxis, {
            useLedgerColumn,
            showExpandHint,
          });

      const anchorEntry =
        useLedgerColumn && tickEntries.length > 0
          ? tickEntries[Math.floor(tickEntries.length / 2)]
          : null;

      const anchorParts =
        useLedgerColumn && anchorEntry
          ? splitCompactAxisByHead(anchorEntry.value, precision, axisLayout.prefix)
          : { head: "", suffix: "" };

      if (!expanded && axisLayout.usePrefixHeader) {
        this.priceRenderingOptions.axisLabelPrefix = axisLayout.prefix;
        this.priceRenderingOptions.axisUsePrefixHeader = true;
      } else {
        this.priceRenderingOptions.axisLabelPrefix = "";
        this.priceRenderingOptions.axisUsePrefixHeader = false;
      }

      const minTickY = chromeLayout?.minTickY ?? panel._offset;
      const maxTickY = chromeLayout?.maxTickY ?? panel._offset + panel._height;

      for (const entry of tickEntries) {
        let text = formatValueAxisPriceLabel(entry.value, precision, {
          expanded,
          prefix: axisLayout.usePrefixHeader ? axisLayout.prefix : undefined,
        });

        if (usePercent) {
          text += "%";
        }

        if (entry.y >= minTickY && entry.y <= maxTickY) {
          texts.push({
            text,
            ctx,
            y: entry.y,
          });
        }
      }

      const valueAxisWidth = this.priceRenderingOptions.valueAxisWidth + 1;
      const panelWidth = Math.round(panel._width);
      const panelStartX = panelWidth - valueAxisWidth;

      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = WEBRCP.utils.colorManager.getColor("priceAxisBackground"); //priceAxisBackground
      ctx.rect(panelWidth - valueAxisWidth, panel._offset, valueAxisWidth, panel._height);
      ctx.fill();

      ctx.fillStyle = WEBRCP.utils.colorManager.getColor("handlerColor"); // handlerColor
      const dividerX = compactCollapsed
        ? getCollapsedLedgerDividerX(panelStartX)
        : panelStartX;
      ctx.fillRect(dividerX, panel._offset, 1, panel._height);

      ctx.clip();

      const axisFontKeys = getPriceAxisFontKeys(model);
      const priceFont = WEBRCP.utils.colorManager.getFont(axisFontKeys.priceFontKey);
      const subscriptFont = WEBRCP.utils.colorManager.getFont(axisFontKeys.subscriptFontKey);
      const axisInnerWidth = valueAxisWidth - model.valueAxisPadding * 2;
      const axisZerosToReduce = expanded ? 0 : this.priceRenderingOptions.zerosToReduce;

      ctx.font = priceFont;

      const suffixTexts = texts.map((item) => item.text ?? "");
      const columnLayout =
        compactCollapsed && suffixTexts.length > 0
          ? layoutLedgerAxisColumn(
              ctx,
              useLedgerColumn ? anchorParts.head : "",
              suffixTexts,
              useLedgerColumn
                ? anchorParts.suffix
                : (suffixTexts[Math.floor(suffixTexts.length / 2)] ?? ""),
              panelStartX,
              valueAxisWidth,
              model.valueAxisPadding,
            )
          : null;

      if (columnLayout) {
        this.priceRenderingOptions.ledgerSuffixRightX = columnLayout.suffixRightX;
        this.priceRenderingOptions.ledgerColumnSplitX = columnLayout.columnSplitX;
        this.priceRenderingOptions.ledgerTickSuffixTexts = suffixTexts;
      }

      if (useLedgerColumn && chromeLayout && columnLayout) {
        const axisTextColor = WEBRCP.utils.colorManager.getColor("priceAxisTextColor");
        drawLedgerAxisAnchorRow(ctx, columnLayout, anchorParts.head, anchorParts.suffix, chromeLayout.anchorRowY, {
          text: axisTextColor,
          divider: axisTextColor,
        });
      }

      ctx.fillStyle = WEBRCP.utils.colorManager.getColor("priceAxisTextColor");

      texts.forEach((options) => {
        const labelWidth = measurePriceTextWidth({
          text: options.text ?? "",
          ctx,
          zerosToReduce: axisZerosToReduce,
          priceFont,
          subscriptFont,
          mode,
        });

        let labelX =
          panelStartX + model.valueAxisPadding + Math.max(0, (axisInnerWidth - labelWidth) / 2);
        let textAlign: CanvasTextAlign = "left";

        if (columnLayout) {
          labelX = columnLayout.suffixRightX;
          textAlign = "right";
        }

        const previousAlign = ctx.textAlign;
        ctx.textAlign = textAlign;
        renderPriceText.call(this, {
          ...options,
          x: labelX,
          zerosToReduce: axisZerosToReduce,
          mode,
          priceFont,
          subscriptFont,
        });
        ctx.textAlign = previousAlign;
      });

      if (showExpandHint && chromeLayout) {
        const colorManager = WEBRCP.utils.colorManager;
        drawPriceAxisExpandHint(
          ctx,
          getPriceAxisExpandHintLayout(
            panelStartX,
            valueAxisWidth,
            chromeLayout.hintCenterY,
            expanded,
          ),
          { accent: colorManager.getColor("accent") },
        );
      }

    } catch (error: any) {
      console.error(error, error.stack);
    } finally {
      ctx.closePath();
      ctx.restore();
    }
  };

  this.renderHGrid = function (ctx, model, panel, tick) {
    var tickValue = tick.niceMin;
    var tickPoint = 0;
    const gridDash = Array.isArray(panel.gridDash) && panel.gridDash.length > 0 ? panel.gridDash : [];

    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
    ctx.lineWidth = 1;
    ctx.setLineDash(gridDash);

    while (tickValue < tick.niceMax) {
      //drawTickValue
      tickValue += tick.tickSpacing;
      tickPoint =
        this.getYCoordinateForPrice(tickValue, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
        }) + panel._offset;
      if (tickPoint < panel._offset) continue;

      ctx.beginPath();
      ctx.moveTo(0, tickPoint);
      ctx.lineTo(panel._width - this.priceRenderingOptions.valueAxisWidth, tickPoint);
      ctx.stroke();
      ctx.closePath();
    }

    ctx.setLineDash([]);
  };

  this.renderVGrid = function (ctx, model, panel, ticks) {
    var tickIndex = 0;
    var tickX = 0;
    const gridDash = Array.isArray(panel.gridDash) && panel.gridDash.length > 0 ? panel.gridDash : [];

    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
    ctx.lineWidth = 1;
    ctx.setLineDash(gridDash);

    for (var i = 0; i < ticks.length; i++) {
      tickIndex = ticks[i];
      tickX = this.getIndexPoint(tickIndex, model);

      if (tickX > panel._width) continue;

      ctx.beginPath();
      ctx.moveTo(tickX + 0.5, 0 + panel._offset);
      ctx.lineTo(tickX + 0.5, panel._offset + panel._height);
      ctx.stroke();
      ctx.closePath();
    }

    ctx.setLineDash([]);
  };

  this.renderTimeAxis = function (ctx, model, ticks, fusion) {
    const timeAxisHeight = model.timeAxisHeight > 0 ? model.timeAxisHeight : 24;
    const tickY = model._height - timeAxisHeight;
    const plotWidth = model._width - this.priceRenderingOptions.valueAxisWidth;

    ctx.fillStyle = resolveThemeColor("timeAxisBackground", "backgroundColor");
    ctx.fillRect(0, tickY, model._width, timeAxisHeight);
    ctx.fillStyle = WEBRCP.utils.colorManager.getColor("handlerColor");
    ctx.fillRect(-0.5, tickY - 0.5, model._width, 1);

    const data = fusion.getMainSeries().data;
    if (!data?.length) {
      return;
    }

    const lastIndex = fusion.getMainSeriesLastIndex();
    let validTicks = ticks.filter(
      (index) => index >= 0 && index <= lastIndex && typeof data[index]?.stamp === "number",
    );

    if (validTicks.length === 0) {
      validTicks = this.buildFallbackTimeTicks(model, lastIndex, plotWidth);
    }

    if (validTicks.length === 0) {
      return;
    }

    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
    ctx.fillStyle = resolveThemeColor("timeAxisTextColor", "primaryTextColor");
    ctx.lineWidth = 1;
    const previousTextBaseline = ctx.textBaseline;
    ctx.textBaseline = "middle";
    ctx.font = WEBRCP.utils.colorManager.getFont("time", "300 11px Chivo, Roboto, Tahoma, Arial, sans-serif");

    const format = resolveTimeAxisFormat(validTicks, data);
    let lastLabelRight = -Infinity;
    let prevRenderedStamp: number | null = null;

    for (var i = 0; i < validTicks.length; i++) {
      const tickIndex = validTicks[i];
      const tickX = this.getIndexPoint(tickIndex, model);
      const stamp = data[tickIndex].stamp as number;

      if (tickX > plotWidth) continue;

      const label = formatTimeAxisLabel(
        stamp,
        format,
        this.months,
        this.zeroLead.bind(this),
        prevRenderedStamp,
      );
      const labelWidth = ctx.measureText(label).width;
      const labelLeft = tickX - 4;

      if (labelLeft < lastLabelRight + TIME_AXIS_LABEL_GAP) {
        continue;
      }

      if (labelLeft + labelWidth > plotWidth + 4) {
        continue;
      }

      ctx.fillText(label, tickX - 4, tickY + timeAxisHeight / 2 + 2);
      lastLabelRight = labelLeft + labelWidth;
      prevRenderedStamp = stamp;

      ctx.beginPath();
      ctx.moveTo(tickX + 0.5, tickY);
      ctx.lineTo(tickX + 0.5, tickY + 6);
      ctx.stroke();
    }

    ctx.textBaseline = previousTextBaseline;
  };

  this.renderHandler = function (ctx, model, panel) {
    //## Don't draw last one
    if (panel._index == model.panels.length - 1) return;

    ctx.beginPath();
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("handlerColor");
    ctx.lineWidth = 1;
    ctx.moveTo(0, panel._height + panel._offset);
    ctx.lineTo(panel._width, panel._height + panel._offset);
    ctx.stroke();
    ctx.closePath();
  };

  this.renderLegend = function (ctx, model, panel, fusion) {
    panel._legendHits = [];
    var legendCount = 0;
    const legendsRendered: string[] = [];

    for (var i = 0; i < panel.objects.length; i++) {
      if (panel.objects[i].hidden != true && panel.objects[i].dataLink) {
        if (
          this.renderLegendLine(
            ctx,
            model,
            panel,
            panel.objects[i],
            legendCount,
            fusion,
            legendsRendered
          )
        ) {
          legendCount++;
        }
      }
    }
  };

  this.renderLegendLine = function (ctx, model, panel, object, count, fusion, legendsRendered) {
    function isThisSeriesOutputOfScript(dataLink: string) {
      const sm = fusion.getScriptsManager();
      for (const property in sm) {
        if (sm.hasOwnProperty(property)) {
          const script = sm[property];
          const outputs = script.outputs;
          for (const key in outputs) {
            if (outputs.hasOwnProperty(key)) {
              if (outputs[key] === dataLink) {
                return script;
              }
            }
          }
        }
      }
      return null;
    }
    if (object.renderLegend === false) return false;
    const seriesManager = fusion.getSeriesManager();
    const dataLink = object.dataLink;
    if (!dataLink) return false;
    const series = seriesManager[dataLink];
    if (!series) return false;
    const script = isThisSeriesOutputOfScript(dataLink);
    const catalogType = getCatalogTypeForScriptId(model.scripts, script?.id);

    this.validateSeriesBeforeRender(series);

    const index = fusion.getMainSeriesLastIndex();

    if (legendsRendered.indexOf(dataLink) > -1) return false;
    legendsRendered.push(dataLink);

    let name =
      series.userName ||
      resolveCatalogLocaleMessage(series.title, catalogType, series.title, true);
    if (series.instrument && series.instrument.relatedKey) {
      name = series.instrument.symbol + "." + series.instrument.name;
    }

    if (script) {
      const formattedInputs: string[] = [];
      for (const key in script.inputs) {
        let input = script.inputs[key];
        if (input === null) continue;
        input = input.slice ? input.slice(0, -2) : null;
        input = input && input.split ? input.split(":")[0] : input;

        if (seriesManager[input]) {
          const inputTitle = seriesManager[input]?.title;
          if (inputTitle && !formattedInputs.includes(inputTitle))
            formattedInputs.push(
              resolveChartLocaleMessage(
                inputTitle,
                inputTitle,
                true
              )
            );
        } else if (
          typeof script.inputs[key] === "string" ||
          typeof script.inputs[key] === "number"
        ) {
          formattedInputs.push(
            resolveChartLocaleMessage(
              script.inputs[key].toString(),
              script.inputs[key].toString(),
              true
            )
          );
        }
      }
      name += " (" + formattedInputs.join(", ") + ")";
    }

    let color = object.color;
    if (
      object.renderAs == "OHLC" &&
      series &&
      series.data &&
      series.data[series.data.length - 1].o
    ) {
      const instrumentIntervalSymbol = series.instrument?.interval?.symbol;
      if (instrumentIntervalSymbol) name += " (" + instrumentIntervalSymbol + ")";
      const o = series.data[series.data.length - 1].o;
      const c = series.data[series.data.length - 1].c;
      if (o > c) color = WEBRCP.utils.colorManager.getColor("chartRed");
      else if (o <= c) color = WEBRCP.utils.colorManager.getColor("chartGreen");
    } else if (!color) color = WEBRCP.utils.colorManager.getColor("legendValueColor");

    const compactLegend = isModelCompactLayout(model);
    const legendMetrics = getLegendLayoutMetrics(compactLegend);

    let objectTitle = name + "  ";

    ctx.font = WEBRCP.utils.colorManager.getFont(legendMetrics.legendFontKey);

    const startX = legendMetrics.startX;
    let x = startX;
    const y = panel._offset + legendMetrics.topOffset + count * legendMetrics.lineHeight;

    if (compactLegend) {
      const plotWidth = model._width - this.priceRenderingOptions.valueAxisWidth - 1;
      const maxTitleWidth = plotWidth - startX - 24;
      if (maxTitleWidth > 0) {
        objectTitle = truncateCanvasText(ctx, objectTitle, maxTitleWidth);
      }
    }

    x += ctx.measureText(objectTitle).width;

    const valuesToRender: LegendRenderValue[] = [];
    const seriesLabels = Array.isArray(series.labels)
      ? series.labels
      : series.fields.map(
          (fieldName) => (series.labels as Record<string, string>)[fieldName] || fieldName
        );

    for (var i = 0; i < series.fields.length; i++) {
      const field = series.data[index][series.fields[i]];
      if (!field) continue;
      const label = seriesLabels[i] || series.fields[i];

      const valueToRender: LegendRenderValue = {
        label: {},
        value: {},
        separator: {},
      };
      let precision = 2;
      let zerosToReduce = this.priceRenderingOptions.zerosToReduce;
      const seriesPrecisions =
        Array.isArray((series as unknown as { precisions?: unknown }).precisions)
          ? ((series as unknown as { precisions: Array<number | null | undefined> }).precisions ?? [])
          : [];

      if (seriesPrecisions[i] !== null && seriesPrecisions[i] !== undefined) {
        precision = seriesPrecisions[i] as number;
        zerosToReduce = 0;
      } else if (object.renderAs == "OHLC" && label == "V") {
        precision = this.volumePrecision;
        zerosToReduce = 0;
      } else {
        precision = this.getPrecision(model, panel);
      }

      var v = LIB.nFormatter(field, precision);

      valueToRender.label.text = resolveChartLocaleMessage(label, label) + ": ";
      if (series.fields.length == 1 && label == "value") valueToRender.label.text = "";
      else {
        valueToRender.label.x = x;
        valueToRender.label.y = y;
        x += ctx.measureText(valueToRender.label.text).width;
      }

      valueToRender.value.x = x;
      valueToRender.value.y = y;
      valueToRender.value.text = v;
      valueToRender.value.zerosToReduce = zerosToReduce;
      x += measurePriceTextWidth({
        text: v,
        ctx,
        priceFont: WEBRCP.utils.colorManager.getFont(legendMetrics.legendFontKey),
        subscriptFont: WEBRCP.utils.colorManager.getFont(legendMetrics.legendSubscriptFontKey),
        zerosToReduce: zerosToReduce,
      });

      if (i < series.fields.length - 1) {
        const comma = ", ";
        valueToRender.separator.text = comma;
        valueToRender.separator.x = x;
        valueToRender.separator.y = y;
        x += ctx.measureText(comma).width;
      }

      valuesToRender.push(valueToRender);
    }

    const legendBackground = WEBRCP.utils.colorManager.getColor("legendLineBackground");
    const showLegendBackground = isLegendBackgroundVisible(legendBackground);
    const titleColor = script
      ? WEBRCP.utils.colorManager.getColor("legendValueColor")
      : color || WEBRCP.utils.colorManager.getColor("text");
    const valueColor = script
      ? WEBRCP.utils.colorManager.getColor("legendValueColor")
      : color || WEBRCP.utils.colorManager.getColor("text");

    let closeButtonX: number | null = null;
    if (script?.id != null) {
      closeButtonX = x + LEGEND_CLOSE_GAP;
      x = closeButtonX + LEGEND_CLOSE_HALF * 2 + 6;
    }

    ctx.save();
    const previousTextBaseline = ctx.textBaseline;
    ctx.textBaseline = "alphabetic";
    ctx.beginPath();
    ctx.rect(
      0,
      panel._offset,
      model._width - this.priceRenderingOptions.valueAxisWidth - 1,
      panel._height
    );
    ctx.closePath();
    ctx.clip();

    if (showLegendBackground) {
      ctx.beginPath();
      ctx.fillStyle = legendBackground;
      const roundedContext = ctx as CanvasRenderingContext2D & {
        roundRect?: (
          x: number,
          y: number,
          width: number,
          height: number,
          radii?: number | number[]
        ) => void;
      };
      const pillWidth = Math.max(x - startX + 4, 0);
      if (roundedContext.roundRect)
        roundedContext.roundRect(
          startX - 4,
          y - legendMetrics.pillPaddingY,
          pillWidth,
          legendMetrics.pillHeight,
          [4],
        );
      else
        ctx.rect(startX - 4, y - legendMetrics.pillPaddingY, pillWidth, legendMetrics.pillHeight);
      ctx.fill();
    }

    ctx.fillStyle = titleColor;
    ctx.font = WEBRCP.utils.colorManager.getFont(legendMetrics.legendFontKey);
    ctx.fillText(objectTitle, startX, y);

    for (const valueToRender of valuesToRender) {
      if (
        valueToRender.label.text &&
        valueToRender.label.x != null &&
        valueToRender.label.y != null
      ) {
        ctx.fillStyle = WEBRCP.utils.colorManager.getColor("legendLabelColor");
        ctx.fillText(valueToRender.label.text, valueToRender.label.x, valueToRender.label.y);
      }

      ctx.fillStyle = valueColor;
      renderPriceText({
        text: valueToRender.value.text,
        ctx,
        x: valueToRender.value.x,
        y: valueToRender.value.y,
        priceFont: WEBRCP.utils.colorManager.getFont(legendMetrics.legendFontKey),
        subscriptFont: WEBRCP.utils.colorManager.getFont(legendMetrics.legendSubscriptFontKey),
        zerosToReduce: valueToRender.value.zerosToReduce,
      });

      if (
        valueToRender.separator.text &&
        valueToRender.separator.x != null &&
        valueToRender.separator.y != null
      ) {
        ctx.fillStyle = WEBRCP.utils.colorManager.getColor("legendLabelColor");
        ctx.fillText(", ", valueToRender.separator.x, valueToRender.separator.y);
      }
    }

    if (closeButtonX != null && script?.id != null) {
      const closeColor = WEBRCP.utils.colorManager.getColor("legendLabelColor");
      drawLegendCloseIcon(ctx, closeButtonX, y, closeColor);

      const hits = (panel._legendHits as LegendCloseHit[] | undefined) ?? [];
      hits.push({
        scriptId: script.id,
        x: closeButtonX - hitTolerance,
        y: y - 10 - hitTolerance,
        w: LEGEND_CLOSE_HALF * 2 + 6 + hitTolerance * 2,
        h: legendMetrics.pillHeight + hitTolerance * 2,
      });
      panel._legendHits = hits;
    }

    ctx.textBaseline = previousTextBaseline;
    ctx.restore();

    return true;
  };

  this.getLegendHit = function (x, y) {
    const panels = this.controller.model.panels as CoreChartPanel[];
    for (let panelIndex = 0; panelIndex < panels.length; panelIndex += 1) {
      const panel = panels[panelIndex];
      const hits = panel._legendHits as LegendCloseHit[] | undefined;
      if (!hits?.length) continue;

      for (let hitIndex = 0; hitIndex < hits.length; hitIndex += 1) {
        const hit = hits[hitIndex];
        if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) {
          return hit;
        }
      }
    }
    return null;
  };

  //------------------------------------------------------------------------------

  this.drawPriceTag = function (
    ctx,
    model,
    panel,
    y,
    color,
    textColor,
    value,
    valueType,
    style = "RECTANGLE"
  ) {
    try {
      const valueAxisWidth = this.priceRenderingOptions.valueAxisWidth;
      const axisLeft = model._width - valueAxisWidth;

      ctx.fillStyle = color;
      const axisFontKeys = getPriceAxisFontKeys(model);
      const priceFont = WEBRCP.utils.colorManager.getFont(axisFontKeys.priceFontKey);
      ctx.font = priceFont;

      var v = value;
      if (typeof v !== "number") {
        return;
      }

      if (panel.valueAxisMode == "log" && valueType != "real") {
        v = logConverter.axisToReal?.(v, 1) ?? v;
      }

      const precision = this.getPrecision(model, panel);
      const vs = formatFullAxisPrice(v, precision);
      const expanded = model._priceAxisExpanded === true;
      const axisZerosToReduce = expanded ? 0 : this.priceRenderingOptions.zerosToReduce;
      const subscriptFont = WEBRCP.utils.colorManager.getFont(axisFontKeys.subscriptFontKey);
      const mode = panel.valueAxisMode;

      let headPrefix = this.priceRenderingOptions.axisLabelPrefix ?? "";
      if (
        axisFontKeys.compactCollapsed &&
        headPrefix.length < PRICE_AXIS_PREFIX_MIN_LENGTH
      ) {
        headPrefix = deriveCompactAxisHeadPrefix([v], precision);
      }

      const useLedgerTag =
        axisFontKeys.compactCollapsed &&
        headPrefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH;
      const ledgerParts = useLedgerTag
        ? splitCompactAxisByHead(v, precision, headPrefix)
        : null;

      const ledgerGeometry = getValueAxisLedgerGeometry(model, panel, valueAxisWidth);
      const ledgerSuffixRightX = ledgerGeometry.suffixRightX;

      const labelWidth = useLedgerTag
        ? (() => {
            const headWidth = ledgerParts?.head ? ctx.measureText(ledgerParts.head).width : 0;
            const suffixWidth = ledgerParts?.suffix ? ctx.measureText(ledgerParts.suffix).width : 0;
            return headWidth + suffixWidth + (headWidth > 0 && suffixWidth > 0 ? 4 : 0);
          })()
        : measurePriceTextWidth({
            text: vs,
            ctx,
            zerosToReduce: axisZerosToReduce,
            priceFont,
            subscriptFont,
            mode,
          });
      const tagLayout = layoutPriceTag(
        model,
        { valueAxisWidth, suffixRightX: ledgerSuffixRightX },
        labelWidth,
        y,
      );

      ctx.save();
      ctx.beginPath();
      ctx.rect(tagLayout.tagLeft, panel._offset, tagLayout.tagWidth, panel._height);
      ctx.clip();

      const useArrowStyle = style === "ARROW" && !tagLayout.allowOverflowLeft;

      if (useArrowStyle) {
        ctx.beginPath();
        ctx.moveTo(axisLeft, y);
        ctx.lineTo(axisLeft + 5, y - 10);
        ctx.lineTo(model._width, y - 10);
        ctx.lineTo(model._width, y + 10);
        ctx.lineTo(axisLeft + 5, y + 10);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(tagLayout.tagLeft, tagLayout.tagTop, tagLayout.tagWidth, tagLayout.tagHeight);
      }

      ctx.fillStyle = textColor;
      const labelY = Math.round(tagLayout.tagTop + tagLayout.tagHeight / 2);

      if (useLedgerTag && ledgerParts) {
        const tickSuffixes = this.priceRenderingOptions.ledgerTickSuffixTexts ?? [];
        const ledgerColumn = layoutLedgerAxisColumn(
          ctx,
          ledgerParts.head,
          [...tickSuffixes, ledgerParts.suffix],
          ledgerParts.suffix,
          ledgerGeometry.panelStartX,
          ledgerGeometry.axisWidth,
          model.valueAxisPadding,
        );
        drawLedgerPriceTagLabel(
          ctx,
          {
            suffixRightX: ledgerColumn.suffixRightX,
            columnSplitX: ledgerColumn.columnSplitX,
            head: ledgerParts.head,
            suffix: ledgerParts.suffix,
          },
          labelY,
          {
            zerosToReduce: axisZerosToReduce,
            mode,
            priceFont,
            subscriptFont,
          },
        );
      } else {
        const previousAlign = ctx.textAlign;
        const previousBaseline = ctx.textBaseline;
        ctx.textAlign = tagLayout.textAlign;
        ctx.textBaseline = "middle";
        renderPriceText({
          text: vs,
          ctx,
          x: tagLayout.labelX,
          y: labelY,
          zerosToReduce: axisZerosToReduce,
          priceFont,
          subscriptFont,
          mode,
        });
        ctx.textAlign = previousAlign;
        ctx.textBaseline = previousBaseline;
      }
    } catch (error: unknown) {
      if (isRendererRuntimeError(error)) {
        console.error(error, error.stack);
      } else {
        console.error(error);
      }
    } finally {
      ctx.restore();
    }
  };

  this.drawDoublePriceTag = function (
    ctx,
    model,
    panel,
    y1,
    y2,
    color,
    textColor,
    innerColor,
    innerTextColor,
    v1,
    v2,
    valueType
  ) {
    try {
      ctx.save();
      ctx.rect(
        model._width - this.priceRenderingOptions.valueAxisWidth,
        panel._offset,
        this.priceRenderingOptions.valueAxisWidth,
        panel._height
      );
      ctx.clip();

      if (y2 < y1) {
        var a = y1;
        y1 = y2;
        y2 = a;
      }

      if (v2 > v1) {
        var b = v1;
        v1 = v2;
        v2 = b;
      }

      ctx.font = WEBRCP.utils.colorManager.getFont("price");
      var fontMetrics = ctx.measureText("8");
      var fontSize = fontMetrics.fontBoundingBoxAscent + fontMetrics.fontBoundingBoxDescent;
      var hMin = 4 * fontSize;
      var h = y2 - y1 - 20;
      var labelY = y1 + h / 2 + 8;
      var bottomOffset = panel._height - (y2 - panel._offset);

      const x = model._width - this.priceRenderingOptions.valueAxisWidth;
      const xL = model._width;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x + 5, y1 - 10);
      ctx.lineTo(xL, y1 - 10);
      ctx.lineTo(xL, y1 + 10);
      ctx.lineTo(x + 5, y1 + 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = textColor;
      let vp1 = v1;
      if (panel.valueAxisMode == "log" && valueType != "real")
        vp1 = logConverter.axisToReal?.(v1, 1) ?? v1;
      var vs1 = LIB.nFormatter(vp1, this.getPrecision(model, panel));
      const previousBaseline = ctx.textBaseline;
      ctx.textBaseline = "middle";
      renderPriceText({
        text: vs1,
        ctx,
        x: model._width - this.priceRenderingOptions.valueAxisWidth + 8,
        y: Math.round(y1),
        zerosToReduce: this.priceRenderingOptions.zerosToReduce,
      });

      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.moveTo(x + 5, y1 + 10);

      if (h > hMin) {
        ctx.lineTo(xL, y1 + 10);
        ctx.lineTo(xL, y2 - 10);
        ctx.lineTo(x + 5, y2 - 10);
        ctx.lineTo(x + 5, y1 + 10);
      } else if (bottomOffset < hMin + 15) {
        ctx.lineTo(x + 5, y2 - 10);
        ctx.lineTo(xL, y2 - 10);
        ctx.lineTo(xL, y1 + 10);
        ctx.lineTo(x + 5, y1 + 10);

        ctx.moveTo(x + 5, y1 - 10);

        ctx.lineTo(xL, y1 - 10);
        ctx.lineTo(xL, y1 - 10 - hMin - 5);
        ctx.lineTo(x + 5, y1 - 10 - hMin - 5);
        ctx.lineTo(x + 5, y1 - 10);

        labelY = y1 - 32 - 5;
      } else {
        ctx.lineTo(xL, y1 + 10);
        ctx.lineTo(xL, y2 + 10 + hMin + 5);
        ctx.lineTo(x + 5, y2 + 10 + hMin + 5);
        ctx.lineTo(x + 5, y1 + 10);

        labelY = y2 + 32;
      }

      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y2);
      ctx.lineTo(x + 5, y2 - 10);
      ctx.lineTo(xL, y2 - 10);
      ctx.lineTo(xL, y2 + 10);
      ctx.lineTo(x + 5, y2 + 10);
      ctx.closePath();
      ctx.fill();

      var rv1 = v1;
      var rv2 = v2;
      if (panel.valueAxisMode == "log") {
        rv1 = logConverter.axisToReal?.(v1) ?? v1;
        rv2 = logConverter.axisToReal?.(v2) ?? v2;
      }

      // arrows

      ctx.beginPath();
      ctx.fillStyle = WEBRCP.utils.colorManager.getColor("buyColor");
      ctx.moveTo(
        model._width - this.priceRenderingOptions.valueAxisWidth + 12,
        labelY - 0.5 * fontSize - 4
      );
      ctx.lineTo(
        model._width - this.priceRenderingOptions.valueAxisWidth + 18,
        labelY - 0.5 * fontSize - 4
      );
      ctx.lineTo(
        model._width - this.priceRenderingOptions.valueAxisWidth + 15,
        labelY - 0.5 * fontSize - 8
      );
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");
      ctx.moveTo(
        model._width - this.priceRenderingOptions.valueAxisWidth + 12,
        labelY + 1.5 * fontSize - 4
      );
      ctx.lineTo(
        model._width - this.priceRenderingOptions.valueAxisWidth + 18,
        labelY + 1.5 * fontSize - 4
      );
      ctx.lineTo(
        model._width - this.priceRenderingOptions.valueAxisWidth + 15,
        labelY + 1.5 * fontSize
      );
      ctx.fill();

      // labels

      var labelDn = (Math.abs((rv1 - rv2) / v1) * 100).toFixed(2) + "%";
      var labelUp = (Math.abs((rv1 - rv2) / v2) * 100).toFixed(2) + "%";
      var label = Math.abs(rv1 - rv2).toFixed(this.getPrecision(model, panel));

      let vp2 = v2;
      if (panel.valueAxisMode == "log" && valueType != "real")
        vp2 = logConverter.axisToReal?.(v2, 1) ?? v2;
      var vs2 = LIB.nFormatter(vp2, this.getPrecision(model, panel));

      ctx.fillStyle = textColor;
      renderPriceText({
        text: vs2,
        ctx,
        x: model._width - this.priceRenderingOptions.valueAxisWidth + 8,
        y: Math.round(y2),
        zerosToReduce: this.priceRenderingOptions.zerosToReduce,
      });
      ctx.textBaseline = previousBaseline;

      ctx.fillStyle = innerTextColor;
      ctx.font = WEBRCP.utils.colorManager.getFont("text");
      ctx.fillText(
        labelUp,
        model._width - this.priceRenderingOptions.valueAxisWidth + 23,
        labelY - 0.5 * fontSize - 2
      );
      renderPriceText({
        text: label,
        ctx,
        x: model._width - this.priceRenderingOptions.valueAxisWidth + 12,
        y: labelY + fontSize / 2,
        zerosToReduce: this.priceRenderingOptions.zerosToReduce,
      });
      ctx.fillText(
        labelDn,
        model._width - this.priceRenderingOptions.valueAxisWidth + 23,
        labelY + 1.5 * fontSize + 2
      );
    } catch (e: any) {
      console.error(e, e.stack);
    } finally {
      ctx.restore();
    }
  };

  this.drawTimeTag = function (ctx, model, x, color, textColor, fusion) {
    try {
      if (x > model._timeAxisWidth) return;

      ctx.save();
      ctx.rect(0, model._height - model.timeAxisHeight, model._width, model.timeAxisHeight + 10);
      ctx.clip();

      var index = this.getPointIndex(x, model);
      if (!fusion.getMainSeries().data || index > fusion.getMainSeriesLastIndex()) return;

      var stamp = fusion.getMainSeries().data[index].stamp;
      var prettyDate = this.getPrettyDate(stamp);
      const axisH = model.timeAxisHeight || 24;
      const tagH = Math.min(18, axisH - 4);
      var yT = model._height - axisH + 2;
      var yB = yT + tagH;
      var y = yT + tagH / 2;
      var w = 90;

      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(x - 10, yT + 5);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 5, yT);
      ctx.lineTo(x + w - 5, yT);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - 5, yB);
      ctx.lineTo(x + 5, yB);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = WEBRCP.utils.colorManager.getFont("time");

      var tw = ctx.measureText(prettyDate).width;
      var txtX = x + w / 2 - tw / 2;
      ctx.fillText(prettyDate, txtX, y + 4);
    } catch (e: any) {
      console.error(e, e.stack);
    } finally {
      ctx.restore();
    }
  };

  this.drawDoubleTimeTag = function (ctx, model, x1, x2, color, textColor, fusion) {
    try {
      ctx.save();
      ctx.rect(0, model._height - model.timeAxisHeight, model._width, model.timeAxisHeight + 10);
      ctx.clip();

      if (x1 > model._timeAxisWidth) return;
      if (x2 > model._timeAxisWidth) return;
      if (x2 < x1) {
        var a = x1;
        x1 = x2;
        x2 = a;
      }
      var withDateDiff = true;
      var index1 = this.getPointIndex(x1, model);
      if (index1 > fusion.getMainSeries().data.length - 1) return;
      var index2 = this.getPointIndex(x2, model);
      if (index2 > fusion.getMainSeries().data.length - 1) {
        withDateDiff = false;
      }

      const axisH = model.timeAxisHeight || 24;
      const tagH = Math.min(18, axisH - 4);
      var yT = model._height - axisH + 2;
      var yB = yT + tagH;
      var y = yT + tagH / 2;
      var wMin = 150;
      var w = 150;
      if (Math.abs(x2 - x1) > w) w = Math.abs(x2 - x1);

      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(x1 - 10, yT + 5);
      ctx.lineTo(x1, y);
      ctx.lineTo(x1 + 5, yT);

      if (w > wMin) {
        ctx.lineTo(x2 - 5, yT);
        ctx.lineTo(x2, y);
        ctx.lineTo(x2 - 5, yB);
      } else {
        ctx.lineTo(x1 + w - 5, yT);
        ctx.lineTo(x1 + w, y);
        ctx.lineTo(x1 + w - 5, yB);
      }

      ctx.lineTo(x1 + 5, yB);
      ctx.lineTo(x1, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = WEBRCP.utils.colorManager.getFont("time");

      var label = "";
      if (withDateDiff) {
        var stamp1 = fusion.getMainSeries().data[index1].stamp;
        var stamp2 = fusion.getMainSeries().data[index2].stamp;
        var delta = Math.abs(stamp2 - stamp1) / 1000;
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        label = days + "d : " + hours + "h : " + minutes + "m " + (index2 - index1) + " periods";
      } else {
        label = index2 - index1 + " periods";
      }
      var tw = ctx.measureText(label).width;
      var txtX = x1 + w / 2 - tw / 2;

      ctx.fillText(label, txtX, y + 4);
    } catch (e: any) {
      console.error(e, e.stack);
    } finally {
      ctx.restore();
    }
  };

  this.getIndexPoint = function (i, model) {
    return i * model.periodWidth - model.viewportLeft;
  };

  this.getPointIndex = function (x, model) {
    return Math.floor((x + model.viewportLeft) / model.periodWidth);
  };

  this.getStampPoint = function (s, model, seriesManager) {
    var index = this.getStampIndex(s, model, seriesManager);
    return this.getIndexPoint(index, model);
  };

  this.getStampIndex = function (s, model, seriesManager) {
    var lastIndex = seriesManager[model.mainSeries].data.length - 1;
    var stamp = seriesManager[model.mainSeries].data[lastIndex]?.stamp ?? 0;
    var intervalInMilis = seriesManager[model.mainSeries].interval.milis || 1;

    for (var i = 0; i < seriesManager[model.mainSeries].data.length; i++) {
      stamp = seriesManager[model.mainSeries].data[i].stamp;

      if (stamp == s) return i;

      if (i < lastIndex) {
        var nextStamp = seriesManager[model.mainSeries].data[i + 1].stamp;
        if (s > stamp && s < nextStamp) return i;
      }

      if (i == lastIndex) {
        intervalInMilis = seriesManager[model.mainSeries].interval.milis || 1;
        if (s > stamp && s < stamp + intervalInMilis) return i;
      }
    }
    stamp += intervalInMilis;
    return i + Math.floor((s - stamp) / seriesManager[model.mainSeries].interval.milis);
  };

  this.getIndexStamp = function (index, model, seriesManager) {
    var seriesLength = seriesManager[model.mainSeries].data.length;
    if (isNaN(index)) index = 0;
    if (index >= seriesLength) {
      let stamp = seriesManager[model.mainSeries].data[seriesLength - 1].stamp;
      let leftOver = (index - seriesLength) * seriesManager[model.mainSeries].interval.milis;
      return stamp + leftOver;
    }
    if (index < 0) {
      let stamp = seriesManager[model.mainSeries].data[0].stamp;
      let leftOver = index * seriesManager[model.mainSeries].interval.milis;
      return stamp - leftOver;
    } else {
      return seriesManager[model.mainSeries].data[index].stamp;
    }
  };

  this.getYCoordinateForPrice = function (price, options) {
    const { panelHeight, minValue, maxValue, valueAxisMode, fV } = options;
    const referenceValue = typeof fV === "number" ? fV : undefined;
    var len = maxValue - minValue;

    var nv = null;
    if (valueAxisMode == "perc") nv = LIB._converterPerc.realToAxis(price, referenceValue);
    else if (valueAxisMode == "log") nv = logConverter.realToAxis(price, referenceValue);
    else nv = linConverter.realToAxis(price, referenceValue);

    if (minValue < 0) {
      nv = Number(nv) + Math.abs(minValue);
    } else {
      nv -= Math.abs(minValue);
    }

    var yy = (nv * panelHeight) / len;

    return panelHeight - Math.floor(yy);
  };

  this.getPriceForYCoordinate = function (p, options) {
    const { panelHeight, minValue, maxValue, valueAxisMode, fV } = options;
    const referenceValue = typeof fV === "number" ? fV : undefined;

    var len = maxValue - minValue;
    var point = panelHeight - p;

    var aV = (point * len) / panelHeight;
    aV += minValue;

    var nv = null;
    if (valueAxisMode == "perc") nv = LIB._converterPerc.axisToReal(aV, referenceValue);
    else if (valueAxisMode == "log") nv = logConverter.axisToReal?.(aV, referenceValue) ?? aV;
    else nv = linConverter.axisToReal?.(aV, referenceValue) ?? aV;

    //return Math.floor(nv*100000)/100000;
    return nv;
  };

  this.buildFallbackTimeTicks = function (model: CoreChartModel, lastIndex: number, plotWidth: number) {
    const ticks: number[] = [];
    const minSpacing = getTimeAxisMinSpacing(model);
    let lastX = -minSpacing;

    for (let x = 0; x <= plotWidth; x += 1) {
      const index = this.getPointIndex(x, model);
      if (index < 0 || index > lastIndex) {
        continue;
      }

      const pointX = this.getIndexPoint(index, model);
      if (pointX - lastX >= minSpacing) {
        ticks.push(index);
        lastX = pointX;
      }
    }

    if (ticks.length === 0 && lastIndex >= 0) {
      ticks.push(0, lastIndex);
    }

    const maxTicks = Math.max(2, Math.floor(plotWidth / minSpacing));
    return downsampleTimeTicks(ticks, maxTicks);
  };

  this.calculateTimeTicks = function (model, seriesManager) {
    this.timeTicks = [];

    const seriesData = seriesManager?.[model.mainSeries]?.data;
    const lastIndex =
      Array.isArray(seriesData) && seriesData.length > 0 ? seriesData.length - 1 : -1;

    if (lastIndex < 0) {
      return this.timeTicks;
    }

    let left = Math.max(0, model._leftIndex);
    let right = Math.min(lastIndex, model._rightIndex);

    if (left > right) {
      left = Math.max(0, Math.min(lastIndex, model._leftIndex));
      right = lastIndex;
    }

    const plotWidth = model._width - this.priceRenderingOptions.valueAxisWidth;
    const minSpacing = getTimeAxisMinSpacing(model);
    const maxTicks = Math.max(2, Math.floor(plotWidth / minSpacing));
    var lastIndexPoint = 4 - minSpacing;
    var indexPoint = 0;

    for (var i = left; i <= right; i++) {
      indexPoint = this.getIndexPoint(i, model);

      if (indexPoint - lastIndexPoint >= minSpacing) {
        lastIndexPoint = indexPoint;
        this.timeTicks.push(i);
      }
    }

    if (this.timeTicks.length === 0) {
      this.timeTicks = this.buildFallbackTimeTicks(model, lastIndex, plotWidth);
    } else if (this.timeTicks.length > maxTicks) {
      this.timeTicks = downsampleTimeTicks(this.timeTicks, maxTicks);
    }

    return this.timeTicks;
  };

  this.calculateNiceTick = function (model, panel) {
    const tick: ValueAxisTick = {
      maxTicks: 0,
      range: 0,
      tickSpacing: 0,
      niceMin: 0,
      niceMax: 0,
    };

    tick.maxTicks = panel._height / model.minValueTickHeight;
    tick.range = this.niceNum(panel.vMax - panel.vMin, false);
    tick.tickSpacing = this.niceNum(tick.range / tick.maxTicks, true);
    tick.niceMin = Math.floor(panel.vMin / tick.tickSpacing) * tick.tickSpacing;
    tick.niceMax = Math.ceil(panel.vMax / tick.tickSpacing) * tick.tickSpacing;

    return tick;
  };

  this.niceNum = function (range, round) {
    var exponent = 0;
    var fraction = 0;
    var niceFraction = 0;

    exponent = Math.floor(Math.log10(range));
    fraction = range / Math.pow(10, exponent);

    if (round) {
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
    } else {
      if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 5) niceFraction = 5;
      else niceFraction = 10;
    }

    return niceFraction * Math.pow(10, exponent);
  };

  this.months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  this.getPrettyDate = function (stamp, hidden) {
    const date = new Date(stamp);
    let str = "";

    if (!hidden || !hidden.day) str += this.zeroLead(date.getDate());
    if (!hidden || !hidden.month) str += "." + this.months[date.getMonth()];
    if (!hidden || !hidden.year) str += "." + String(date.getFullYear()).substring(2, 4);
    if (!hidden || !hidden.hour)
      str += " " + this.zeroLead(date.getHours()) + ":" + this.zeroLead(date.getMinutes());

    if (!str.trim()) {
      return (
        this.zeroLead(date.getDate()) +
        "." +
        this.months[date.getMonth()] +
        "." +
        String(date.getFullYear()).substring(2, 4) +
        " " +
        this.zeroLead(date.getHours()) +
        ":" +
        this.zeroLead(date.getMinutes())
      );
    }

    return str;
  };

  this.zeroLead = function (num) {
    if (num < 10) return "0" + num;
    return "" + num;
  };

  this.getPrecision = function (model, _panel) {
    var p = 5;
    void _panel;
    const primaryInstrument = model.instrumentsSeries?.[0]?.instrument;

    if (primaryInstrument && typeof primaryInstrument.precision === "number") {
      p = primaryInstrument.precision;
    }

    return p;
  };

  this.calculatePriceRenderingOptions = function (data, model, precision) {
    let magnitude = 1;
    let valueAxisWidth;
    let zerosToReduce = 0;
    let greatestNumber = Number.MIN_VALUE;
    let greatestFraction = Number.MIN_VALUE;

    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      const h = candle.h;
      greatestNumber = h > greatestNumber ? h : greatestNumber;

      greatestFraction = getGreater(greatestFraction, candle.o);
      greatestFraction = getGreater(greatestFraction, candle.h);
      greatestFraction = getGreater(greatestFraction, candle.l);
      greatestFraction = getGreater(greatestFraction, candle.c);
    }

    magnitude = (Math.log(Math.floor(greatestNumber)) * Math.LOG10E + 1) | 0 || 1;
    zerosToReduce =
      greatestFraction > 0 && greatestFraction !== Number.MIN_VALUE
        ? -Math.floor(Math.log10(greatestFraction) + 1)
        : 0;

    const expanded = model._priceAxisExpanded === true;
    const axisFontKeys = getPriceAxisFontKeys(model);
    const priceFont = WEBRCP.utils.colorManager.getFont(axisFontKeys.priceFontKey);
    const subscriptFont = WEBRCP.utils.colorManager.getFont(axisFontKeys.subscriptFontKey);

    let maxLabelWidth = 0;
    let axisLabelPrefix = "";
    let axisUsePrefixHeader = false;
    const samplePrices: number[] = [];

    if (data.length > 0) {
      let minPrice = Infinity;
      let maxPrice = -Infinity;

      for (let i = 0; i < data.length; i++) {
        const candle = data[i];
        minPrice = Math.min(minPrice, candle.l);
        maxPrice = Math.max(maxPrice, candle.h);
      }

      samplePrices.push(minPrice, (minPrice + maxPrice) / 2, maxPrice);

      if (!expanded) {
        const axisLayout = layoutValueAxisLabels(samplePrices, precision, false);
        axisLabelPrefix = axisLayout.prefix;
        axisUsePrefixHeader = axisLayout.usePrefixHeader;
      }
    } else {
      let fallbackText = "";
      for (let i = 0; i < magnitude; i++) {
        fallbackText += "8";
      }

      if (precision > 0) {
        fallbackText += ".";

        for (let i = 0; i < precision; i++) {
          fallbackText += "8";
        }
      }

      maxLabelWidth = measurePriceTextWidth({
        text: fallbackText,
        ctx: this.context,
        zerosToReduce,
        priceFont,
        subscriptFont,
      });
      samplePrices.length = 0;
    }

    if (samplePrices.length > 0) {
      if (axisUsePrefixHeader && this.context) {
        const midPrice = samplePrices[Math.floor(samplePrices.length / 2)];
        const anchorParts = splitCompactAxisByHead(midPrice, precision, axisLabelPrefix);
        const suffixSamples = samplePrices.map((samplePrice) =>
          formatValueAxisPriceLabel(samplePrice, precision, { prefix: axisLabelPrefix }),
        );

        this.context.font = priceFont;
        const ledgerLayout = layoutLedgerAxisColumn(
          this.context,
          anchorParts.head,
          suffixSamples,
          anchorParts.suffix,
          0,
          9999,
          model.valueAxisPadding,
        );
        const headWidth = anchorParts.head
          ? Math.ceil(this.context.measureText(anchorParts.head).width)
          : 0;
        maxLabelWidth = Math.max(
          maxLabelWidth,
          headWidth + Math.ceil(ledgerLayout.maxSuffixWidth),
        );
      }

      for (const samplePrice of samplePrices) {
        const label = formatValueAxisPriceLabel(samplePrice, precision, {
          expanded,
          prefix: axisUsePrefixHeader ? axisLabelPrefix : undefined,
        });
        maxLabelWidth = Math.max(
          maxLabelWidth,
          measurePriceTextWidth({
            text: label,
            ctx: this.context,
            zerosToReduce: expanded ? 0 : zerosToReduce,
            priceFont,
            subscriptFont,
          }),
        );
      }
    }

    valueAxisWidth = maxLabelWidth + model.valueAxisPadding * 2;

    if (axisFontKeys.layoutIsCompact && !expanded) {
      valueAxisWidth = Math.min(valueAxisWidth, model.valueAxisWidth);
    }

    if (expanded) {
      valueAxisWidth = Math.max(valueAxisWidth, maxLabelWidth + model.valueAxisPadding * 2);
    }

    this.priceRenderingOptions = {
      magnitude,
      zerosToReduce,
      valueAxisWidth,
      axisLabelPrefix,
      axisUsePrefixHeader,
    };

    function getGreater(current: number, proposal: number) {
      const positiveProposal = Math.abs(proposal);
      const y = positiveProposal - Math.floor(positiveProposal);
      return y > current ? y : current;
    }
  };

  this.getPriceRenderingOptions = function () {
    return this.priceRenderingOptions;
  };
} as unknown as CoreRendererConstructor;

export default Renderer;

//# sourceURL=./platform/components/newchart/js/renderer.js
