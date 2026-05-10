import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { TradeObjectClass } from "./tradeObject";
import type {
  RuntimeObjectConstructor,
  SeriesInteractorContext,
  SeriesManagerContext,
  SeriesModelContext,
  SeriesPanelContext,
  SeriesPointerEvent,
  SeriesRendererContext,
  SeriesRuntime,
  SeriesStopLimitObject,
  TradeObjectSettings,
} from "./_sharedTypes";

var StopLimitObject = class StopLimitObject extends TradeObjectClass {
  constructor(settings: TradeObjectSettings) {
    super(settings);
    this.settings = settings;
    this.hitTolerance = 2;
  }

  getOperationTitle(operation: string) {
    return WEBRCP.locale.fusion.getMessage(operation, operation);
  }

  render(
    o: SeriesStopLimitObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    this.drawFieldBetweenTrades(o, ctx, model, panel, seriesManager, renderer);
    let orderTypeText = " Limit";
    if (o.type.includes("TAKE_PROFIT")) orderTypeText = " TP" + orderTypeText;
    o.title =
      this.getOperationTitle(o.operation) +
      orderTypeText +
      " " +
      (o.object.classification !== "DEFAULT" ? o.object.classification : "");
    this.drawTradeObject(o, ctx, renderer, model, panel, seriesManager);
    this.drawTradeObject(this.makeStopObject(o), ctx, renderer, model, panel, seriesManager);
  }

  drawFieldBetweenTrades(
    o: SeriesStopLimitObject,
    ctx: CanvasRenderingContext2D,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext,
    renderer: SeriesRendererContext
  ) {
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var lineY =
      renderer.getYCoordinateForPrice(o.price, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    var fV = LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
    var lineStopY =
      renderer.getYCoordinateForPrice(o.stopPrice, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    var color = this.settings.line.color;
    if (o.type.includes("BUY")) this.drawRect(lineY, lineStopY, ctx, color);
    else this.drawRect(lineStopY, lineY, ctx, color);
  }

  makeStopObject(o: SeriesStopLimitObject) {
    const stopObject: SeriesStopLimitObject = {
      ...o,
      object: {
        ...o.object,
      },
    };
    let orderTypeText = " Stop";
    if (o.type.includes("TAKE_PROFIT")) orderTypeText = " TP" + orderTypeText;
    stopObject.title =
      this.getOperationTitle(o.operation) +
      orderTypeText +
      " " +
      (o.object.classification !== "DEFAULT" ? o.object.classification : "");
    stopObject.price = o.stopPrice;
    stopObject.object.price = o.object.stopPrice;
    return stopObject;
  }

  hit(
    x: number,
    y: number,
    o: SeriesStopLimitObject,
    renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    o.stop = false;
    if (super.hit(x, y, o, renderer, interactor, model, panel, seriesManager)) {
      o.hitStop = false;
      return true;
    } else {
      o.stop = true;
      super.hit(x, y, o, renderer, interactor, model, panel, seriesManager);
      o.stop = false;
      return o._hit === true;
    }
  }

  postRender(
    o: SeriesStopLimitObject,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    this.drawPriceTag(o, ctx, renderer, model, panel, seriesManager);
    this.drawPriceTag(this.makeStopObject(o), ctx, renderer, model, panel, seriesManager);
  }

  renderOverlay(
    o: SeriesStopLimitObject,
    octx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    if (o._hit) {
      var fVLimit = LIB.getReferenceValue(o, model, seriesManager);
      var lineLimit =
        renderer.getYCoordinateForPrice(o.price, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV: fVLimit,
        }) + panel._offset;
      var fVStop = LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
      var lineStop =
        renderer.getYCoordinateForPrice(o.stopPrice, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV: fVStop,
        }) + panel._offset;
      super.drawRelations(lineLimit, lineStop, null, octx, renderer, model, panel, seriesManager);

      if (o.priceConnections && o.priceConnections.length > 0) {
        for (const connectedPrice of o.priceConnections) {
          const connectedPriceLimitY =
            renderer.getYCoordinateForPrice(connectedPrice, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV: fVLimit,
            }) + panel._offset;
          const connectedPriceStopY =
            renderer.getYCoordinateForPrice(connectedPrice, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV: fVStop,
            }) + panel._offset;
          this.drawRelations(
            lineLimit,
            connectedPriceLimitY,
            null,
            octx,
            renderer,
            model,
            panel,
            seriesManager
          );
          this.drawRelations(
            lineStop,
            connectedPriceStopY,
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

  mouseUp(
    e: SeriesPointerEvent,
    o: SeriesStopLimitObject,
    renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    super.mouseUp(e, o, renderer, interactor, model, panel, seriesManager);
    o.drag = false;
  }

  mouseDrag(
    e: SeriesPointerEvent,
    o: SeriesStopLimitObject,
    renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    var dragPrice = this.getDragPrice(e, o, renderer, interactor, model, panel, seriesManager);
    const isBuy = o.type === "BUY TAKE_PROFIT_LIMIT" || o.type === "BUY STOP_LIMIT";
    const isSell = o.type === "SELL TAKE_PROFIT_LIMIT" || o.type === "SELL STOP_LIMIT";
    //drag object
    if (o.modifyAllowed && !o._hitCloseButton && !o._hitDragHandler) {
      o.modified = true;
      if (isBuy && o.hitStop) {
        o.stopPrice = dragPrice;
      } else if (isSell && o.hitStop) {
        o.stopPrice = dragPrice;
      } else if (isBuy && !o.hitStop) {
        o.limitPrice = o.price = dragPrice;
      } else if (isSell && !o.hitStop) {
        o.limitPrice = o.price = dragPrice;
      } else {
        o.modified = false;
      }
    }
    o.drag = true;
  }

  getReferenceValue(
    _event: SeriesPointerEvent,
    o: SeriesStopLimitObject,
    _renderer: SeriesRendererContext,
    _interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    _panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    if (o.limitPrice && o.stopPrice && o.hitStop)
      return LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
    else return LIB.getReferenceValue(o, model, seriesManager);
  }

  mouseOut(
    e: SeriesPointerEvent,
    o: SeriesStopLimitObject,
    renderer: SeriesRendererContext,
    interactor: SeriesInteractorContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext
  ) {
    super.mouseOut(e, o, renderer, interactor, model, panel, seriesManager);
    o.drag = false;
    o.stopPrice = o.object.stopPrice;
    o.limitPrice = o.object.limitPrice;
  }
};

const StopLimitObjectCtor =
  StopLimitObject as unknown as RuntimeObjectConstructor<SeriesRuntime, [TradeObjectSettings]>;
export { StopLimitObjectCtor as StopLimitObject };
