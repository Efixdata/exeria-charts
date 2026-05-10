import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
} from "../../utils/objects-lib";
import type {
  RuntimeObjectConstructor,
  SeriesInteractorContext,
  SeriesManagerContext,
  SeriesModelContext,
  SeriesPanelContext,
  SeriesPointerEvent,
  SeriesRendererContext,
  SeriesRuntime,
  SeriesTradeObject,
  TradeObjectSettings,
  TradeRunnerMarker,
} from "./_sharedTypes";

var TradeObject = class TradeObject {
  settings: TradeObjectSettings;
  hitTolerance: number;
  relativeOffset: { x: number; y: number } | null;

  constructor(settings: TradeObjectSettings) {
    this.settings = settings;
    this.hitTolerance = 2;
    this.relativeOffset = null;
  }

  getMenuItems(_object: SeriesTradeObject, _chart: unknown) {
    return null;
  }

  render(
    o: SeriesTradeObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    this.drawTradeObject(o, ctx, renderer, model, panel, seriesManager);
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var line_y =
      renderer.getYCoordinateForPrice(o.price, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;

    if (this.isDragHandlerAllowedForObject(o, model)) this.drawDragHandler(line_y, ctx);

    const runnerMarker = this.prepareRunnerMarker(o);
    if (runnerMarker) this.drawRunnerMarker(line_y, ctx, runnerMarker);
  }

  drawTradeObject(
    o: SeriesTradeObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var line_y =
      renderer.getYCoordinateForPrice(o.price, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    var line_x = this.settings.bar.x + this.settings.bar.w;
    var line_w = model._timeAxisWidth;

    ctx.save();

    if (o.modified) {
      ctx.globalAlpha = 0.5;
    } else if (WEBRCP.utils.isOrderWaiting(o.object)) {
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalAlpha = 1;
    }

    this.drawLine(line_x, line_y, line_w, this.settings.line.color, ctx);
    this.drawBar(o.title, line_y, this.settings.bar.color, ctx);

    ctx.restore();
  }

  isDragHandlerAllowedForObject(o: SeriesTradeObject, model: SeriesModelContext) {
    if (o.object.instrument?.type !== "OTC") return false;
    if (o.relatedAllowed && !o.modified && !o.object.runner) {
      var tp = this.getTpForPosition(o, model);
      var sl = this.getSlForPosition(o, model);
      if (!tp || !sl) return true;
    }
    return false;
  }

  prepareRunnerMarker(o: SeriesTradeObject) {
    const runnerName = o.object.runner?.name;
    if (typeof runnerName === "string" && runnerName.length > 0) {
      const marker = {
        bg: this.settings.runnerMarker.activeBg,
        color: this.settings.runnerMarker.color,
        text: runnerName.substring(0, 1).toUpperCase(),
      };
      return marker;
    }

    const portfolioName = o.object.portfolio?.name;
    if (typeof portfolioName === "string" && portfolioName.length > 0) {
      const marker = {
        bg: this.settings.runnerMarker.activeBg,
        color: this.settings.runnerMarker.color,
        text: portfolioName.substring(0, 1).toUpperCase(),
      };
      return marker;
    }

    return null;
  }

  postRender(
    o: SeriesTradeObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    this.drawPriceTag(o, ctx, renderer, model, panel, seriesManager);
  }

  drawPriceTag(
    o: SeriesTradeObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var valueY =
      renderer.getYCoordinateForPrice(o.price, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    renderer.drawPriceTag(
      ctx,
      model,
      panel,
      valueY,
      this.settings.bar.color,
      this.settings.bar.text_color,
      o.price,
      "real"
    );
  }

  renderOverlay(
    o: SeriesTradeObject,
    octx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    if (o.related) {
      var fV = LIB.getReferenceValue(o.related, model, seriesManager);
      var line_y =
        renderer.getYCoordinateForPrice(o.related.price, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      var line_x = this.settings.bar.x + this.settings.bar.w;
      var line_w = model._timeAxisWidth;
      octx.globalAlpha = this.settings.relatedBar.alpha;
      this.drawLine(line_x, line_y, line_w, this.settings.relatedBar.color, octx);
      this.drawBar(o.related.title, line_y, this.settings.relatedBar.color, octx);
      var tp = this.getTpForPosition(o, model);
      var sl = this.getSlForPosition(o, model);
      if (o.modifyAllowed && !o.modified && (!tp || !sl)) this.drawDragHandler(line_y, octx);
    }

    if (o._hit) {
      var fV = LIB.getReferenceValue(o, model, seriesManager);
      var hoverLineY: number | null = null;
      var tp_y: number | null = null;
      var sl_y: number | null = null;

      //"o" is related?
      if (o.parentId) {
        var parent = this.getTradeObjectById(o.parentId, model);
        if (parent) {
          hoverLineY =
            renderer.getYCoordinateForPrice(parent.price, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV,
            }) + panel._offset;
          var tp = this.getTpForPosition(parent, model);
          if (tp)
            tp_y =
              renderer.getYCoordinateForPrice(tp.price, {
                panelHeight: panel._height,
                minValue: panel.vMin,
                maxValue: panel.vMax,
                valueAxisMode: panel.valueAxisMode,
                fV,
              }) + panel._offset;

          var sl = this.getSlForPosition(parent, model);
          if (sl)
            sl_y =
              renderer.getYCoordinateForPrice(sl.price, {
                panelHeight: panel._height,
                minValue: panel.vMin,
                maxValue: panel.vMax,
                valueAxisMode: panel.valueAxisMode,
                fV,
              }) + panel._offset;
        }
      }
      //or not ....
      else {
        hoverLineY =
          renderer.getYCoordinateForPrice(o.price, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;

        var tp = this.getTpForPosition(o, model);
        if (tp)
          tp_y =
            renderer.getYCoordinateForPrice(tp.price, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV,
            }) + panel._offset;

        var sl = this.getSlForPosition(o, model);
        if (sl)
          sl_y =
            renderer.getYCoordinateForPrice(sl.price, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV,
            }) + panel._offset;
      }

      if (hoverLineY !== null && (tp_y !== null || sl_y !== null))
        this.drawRelations(hoverLineY, tp_y, sl_y, octx, renderer, model, panel, seriesManager);

      if (o.priceConnections && o.priceConnections.length > 0) {
        const priceConnectionsLineY =
          renderer.getYCoordinateForPrice(o.price, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;

        for (const i in o.priceConnections) {
          const connectedPriceY =
            renderer.getYCoordinateForPrice(o.priceConnections[i], {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV,
            }) + panel._offset;
          this.drawRelations(
            priceConnectionsLineY,
            connectedPriceY,
            null,
            octx,
            renderer,
            model,
            panel,
            seriesManager
          );
        }
      }
    }
  }

  postRenderOverlay(
    o: SeriesTradeObject,
    octx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    if (o.related) {
      var fV = LIB.getReferenceValue(o.related, model, seriesManager);
      var line_y =
        renderer.getYCoordinateForPrice(o.related.price, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      var line_x = this.settings.bar.x + this.settings.bar.w;
      var line_w = model._timeAxisWidth;
      octx.globalAlpha = 1;
      renderer.drawPriceTag(
        octx,
        model,
        panel,
        line_y,
        this.settings.relatedBar.color,
        this.settings.bar.text_color,
        o.related.price,
        "real"
      );
    }
  }

  updateExtremes(
    _o: SeriesTradeObject,
    _extremes: unknown,
    _model: SeriesModelContext,
    _seriesManager: SeriesManagerContext,
    _panel: SeriesPanelContext,
    _renderer: SeriesRendererContext
  ) {}

  hit(
    x: number,
    y: number,
    o: SeriesTradeObject,
    renderer: SeriesRendererContext,
    _interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    var self = this;
    var hitResult = false;

    if (o.hidden == true) return false;
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    const price = o.stop ? o.stopPrice : o.price;
    if (typeof price !== "number") return false;

    if (o.stop) {
      var valueY =
        renderer.getYCoordinateForPrice(price, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
      o.hitStop = true;
    } else {
      var valueY =
        renderer.getYCoordinateForPrice(price, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        }) + panel._offset;
    }
    o._hit = null;
    o._hitCloseButton = null;
    o._hitDragHandler = null;

    //hit?
    if (
      between(valueY - 1, y, valueY + 1, self.hitTolerance) &&
      between(0, x, model._timeAxisWidth, self.hitTolerance)
    ) {
      o._hit = true;
      hitResult = true;

      if (
        between(
          this.settings.bar.closeBtn.x,
          x,
          this.settings.bar.closeBtn.x + this.settings.bar.closeBtn.w,
          0
        )
      ) {
        o._hitCloseButton = true;
      }
      if (
        o.relatedAllowed &&
        between(
          this.settings.bar.dragTpSlHandler.x,
          x,
          this.settings.bar.dragTpSlHandler.x + this.settings.bar.dragTpSlHandler.w,
          0
        )
      ) {
        if (this.isDragHandlerAllowedForObject(o, model)) {
          //var tp = getTpForPosition(o, model);
          //var sl = getSlForPosition(o, model);
          //if(!o.modified && (!tp || !sl)){
          o._hitDragHandler = true;
        }
      }
    }
    return hitResult;
  }

  mouseDown(
    _event: SeriesPointerEvent,
    o: SeriesTradeObject,
    _renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    _model: SeriesModelContext,
    _panel: SeriesPanelContext,
    _seriesManager: SeriesManagerContext
  ) {
    if (o._hitDragHandler) o.related = null;

    var offset = interactor.chart.topLayer[0].getBoundingClientRect();

    this.relativeOffset = {
      x: offset.left,
      y: offset.top,
    };
  }

  mouseUp(
    _event: SeriesPointerEvent,
    o: SeriesTradeObject,
    _renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    _panel: SeriesPanelContext,
    _seriesManager: SeriesManagerContext
  ) {
    if (o._hitCloseButton) {
      o.modified = true;
      interactor.doCloseTradeObject(o);
    } else if (o.modified) {
      const parent = o.parentId ? this.getTradeObjectById(o.parentId, model) : undefined;
      interactor.doModifyTradeObject(o, parent);
    } else if (o.relatedAllowed && o.related) {
      interactor.doAddTradeObject(o);
      const orderCandidate = {
        //temporary add to chart model
        id: "empty",
        price: o.related.price,
        instrument: o.object.instrument,
        parentId: o.id,
        selected: true,
        title: o.related.title,
        type: o.related.type,
      };
      model.orders.list.push(orderCandidate);
      o.related = null;
    }
  }

  mouseDrag(
    e: SeriesPointerEvent,
    o: SeriesTradeObject,
    renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    var dragPrice = this.getDragPrice(e, o, renderer, interactor, model, panel, seriesManager);
    const stopTypes = [
      "BUY STOP",
      "SELL STOP",
      "BUY TRAILING_STOP",
      "SELL TRAILING_STOP",
      "BUY TAKE_PROFIT",
      "SELL TAKE_PROFIT",
      "BUY TAKE_PROFIT_MARKET",
      "SELL TAKE_PROFIT_MARKET",
    ];
    const limitTypes = [
      "BUY LIMIT",
      "SELL LIMIT",
      "BUY TAKE_PROFIT_LIMIT",
      "SELL TAKE_PROFIT_LIMIT",
    ];
    //drag object
    if (o.modifyAllowed && !o._hitCloseButton && !o._hitDragHandler) {
      o.modified = true;
      if (stopTypes.includes(o.type)) o.stopPrice = o.price = dragPrice;
      else if (limitTypes.includes(o.type)) o.limitPrice = o.price = dragPrice;
      else o.modified = false;
    }
  }

  mouseOut(
    _event: SeriesPointerEvent,
    o: SeriesTradeObject,
    _renderer: SeriesRendererContext,
    _interactor: SeriesInteractorContext,
    _model: SeriesModelContext,
    _panel: SeriesPanelContext,
    _seriesManager: SeriesManagerContext
  ) {
    o.related = null;
    o.modified = false;
  }

  getDragPrice(
    e: SeriesPointerEvent,
    o: SeriesTradeObject,
    renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    const instrument = model.instrumentsSeries[0].instrument;
    const precision = typeof instrument?.precision === "number" ? instrument.precision : 0;
    const priceChangeStep =
      typeof instrument?.priceChangeStep === "number" ? instrument.priceChangeStep : 0;
    const offset = getOffset(e).offsetY;
    const relativeOffset = this.relativeOffset;

    const fV = this.getReferenceValue(e, o, renderer, interactor, model, panel, seriesManager);
    const dragPrice = parseFloat(
      renderer
        .getPriceForYCoordinate(offset - panel._offset, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        })
        .toFixed(precision)
    );

    return WEBRCP.utils.roundPrice(dragPrice, priceChangeStep, precision);

    function getOffset(event: SeriesPointerEvent) {
      var x = (event.pageX ?? 0) - (relativeOffset?.x ?? 0);
      var y = (event.pageY ?? 0) - (relativeOffset?.y ?? 0);
      return {
        offsetX: x,
        offsetY: y,
      };
    }
  }

  getReferenceValue(
    _event: SeriesPointerEvent,
    o: SeriesTradeObject,
    _renderer: SeriesRendererContext,
    _interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    _panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    return LIB.getReferenceValue(o, model, seriesManager);
  }

  drawLine(x: number, y: number, w: number, color: string, ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.setLineDash(this.settings.line.dash || []);
    ctx.lineWidth = this.settings.line.w;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.closePath();
    ctx.restore();
  }

  drawBar(title: string, y: number, color: string, ctx: CanvasRenderingContext2D) {
    var x = this.settings.bar.x;
    var close_x = this.settings.bar.closeBtn.x;
    //bar
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.moveTo(x, y - this.settings.bar.h / 2);
    ctx.rectRound(
      -10,
      y - this.settings.bar.h / 2,
      this.settings.bar.w + 10,
      this.settings.bar.h,
      4,
      4,
      0,
      0
    );
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = this.settings.bar.text_color;
    ctx.moveTo(close_x, y - this.settings.bar.closeBtn.w / 2);
    ctx.lineTo(close_x + this.settings.bar.closeBtn.w, y + this.settings.bar.closeBtn.w / 2);
    ctx.moveTo(close_x, y + this.settings.bar.closeBtn.w / 2);
    ctx.lineTo(close_x + this.settings.bar.closeBtn.w, y - this.settings.bar.closeBtn.w / 2);
    ctx.closePath();
    ctx.stroke();

    //text
    var label_x =
      this.settings.bar.closeBtn.x + this.settings.bar.closeBtn.w + this.settings.bar.spacing;
    ctx.fillStyle = this.settings.bar.text_color;
    ctx.fillText(title, label_x, y + 3);
    ctx.restore();
  }

  drawRect(y1: number, y2: number, ctx: CanvasRenderingContext2D, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.05;
    ctx.fillRect(0, y1, ctx.canvas.width, y2 - y1);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawDragHandler(y: number, ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.settings.bar.text_color;
    ctx.strokeStyle = this.settings.bar.text_color;
    ctx.beginPath();
    ctx.moveTo(this.settings.bar.dragTpSlHandler.x, y);
    ctx.lineTo(this.settings.bar.dragTpSlHandler.x + this.settings.bar.dragTpSlHandler.w, y);
    ctx.moveTo(
      this.settings.bar.dragTpSlHandler.x + this.settings.bar.dragTpSlHandler.w / 2,
      y - this.settings.bar.dragTpSlHandler.w / 2
    );
    ctx.lineTo(
      this.settings.bar.dragTpSlHandler.x + this.settings.bar.dragTpSlHandler.w / 2,
      y + this.settings.bar.dragTpSlHandler.w / 2
    );
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  drawRunnerMarker(y: number, ctx: CanvasRenderingContext2D, marker: TradeRunnerMarker) {
    ctx.save();
    ctx.fillStyle = marker.bg;
    ctx.strokeStyle = this.settings.bar.color;
    ctx.beginPath();
    ctx.rectRound(
      this.settings.runnerMarker.x,
      y - this.settings.bar.h / 2,
      this.settings.runnerMarker.w,
      this.settings.bar.h,
      4,
      4,
      0,
      0
    );
    ctx.fill();
    ctx.fillStyle = marker.color;
    ctx.fillText(
      marker.text.substring(0, 1).toUpperCase(),
      this.settings.runnerMarker.x + 2,
      y + 3
    );
    ctx.closePath();
    ctx.restore();
  }

  drawRelations(
    y: number,
    y1: number | null,
    y2: number | null,
    ctx: CanvasRenderingContext2D,
    _renderer: SeriesRendererContext,
    _model: SeriesModelContext,
    _panel: SeriesPanelContext,
    _seriesManager: SeriesManagerContext
  ) {
    var r = 9;
    ctx.save();
    if (y1) {
      var yS = y > y1 ? y : y1;
      var yE = y < y1 ? y : y1;

      ctx.lineWidth = this.settings.connections.w;
      ctx.strokeStyle = this.settings.connections.color;
      ctx.beginPath();
      ctx.moveTo(this.settings.bar.x + this.settings.bar.w, yS);
      ctx.lineTo(this.settings.bar.x + this.settings.bar.w + r, yS);
      ctx.arc(
        this.settings.bar.x + this.settings.bar.w + r,
        yS - r,
        r,
        0.5 * Math.PI,
        0 * Math.PI,
        true
      );
      ctx.lineTo(this.settings.bar.x + this.settings.bar.w + r * 2, yE + r);
      ctx.arc(
        this.settings.bar.x + this.settings.bar.w + r,
        yE + r,
        r,
        0 * Math.PI,
        1.5 * Math.PI,
        true
      );
      ctx.lineTo(this.settings.bar.x + this.settings.bar.w, yE);
      ctx.stroke();
      ctx.closePath();
    }

    if (y2) {
      var yS = y > y2 ? y : y2;
      var yE = y < y2 ? y : y2;

      ctx.lineWidth = this.settings.connections.w;
      ctx.strokeStyle = this.settings.connections.color;
      ctx.beginPath();
      ctx.moveTo(this.settings.bar.x + this.settings.bar.w, yS);
      ctx.lineTo(this.settings.bar.x + this.settings.bar.w + r, yS);
      ctx.arc(
        this.settings.bar.x + this.settings.bar.w + r,
        yS - r,
        r,
        0.5 * Math.PI,
        0 * Math.PI,
        true
      );
      ctx.lineTo(this.settings.bar.x + this.settings.bar.w + r * 2, yE + r);
      ctx.arc(
        this.settings.bar.x + this.settings.bar.w + r,
        yE + r,
        r,
        0 * Math.PI,
        1.5 * Math.PI,
        true
      );
      ctx.lineTo(this.settings.bar.x + this.settings.bar.w, yE);
      ctx.stroke();
      ctx.closePath();
    }

    ctx.restore();
  }

  getTpForPosition(p: SeriesTradeObject, model: SeriesModelContext) {
    for (var i in model.orders.list) {
      if (model.orders.list[i].parentId == p.id && model.orders.list[i].type == "TP")
        return model.orders.list[i] as SeriesTradeObject;
    }
    return null;
  }

  getSlForPosition(p: SeriesTradeObject, model: SeriesModelContext) {
    for (var i in model.orders.list) {
      if (model.orders.list[i].parentId == p.id && model.orders.list[i].type == "SL")
        return model.orders.list[i] as SeriesTradeObject;
    }
    return null;
  }

  getTradeObjectById(id: string | number | null | undefined, model: SeriesModelContext) {
    for (var i in model.orders.list) {
      if (model.orders.list[i].id == id) return model.orders.list[i] as SeriesTradeObject;
    }
    for (var i in model.positions.list) {
      if (model.positions.list[i].id == id) return model.positions.list[i] as SeriesTradeObject;
    }
    return null;
  }
};

export { TradeObject as TradeObjectClass };
const TradeObjectCtor =
  TradeObject as unknown as RuntimeObjectConstructor<SeriesRuntime, [TradeObjectSettings]>;
export { TradeObjectCtor as TradeObject };
