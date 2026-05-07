import WEBRCP from "../../WebRCP";
import FUSION from "../../fusion";
import LIB from "../../utils/chartingCommons";
import { between, isPointInCircle, pointsDistance, getLinePointNearestMouse, roundAndTranslate } from '../../utils/objects-lib';
import imageCandleChartWhite from "../../img/icons/candle_chart_white.svg";
import { Series } from "../../objectRuntimeBases";
import { TradeObjectClass } from "./tradeObject";
import type { SeriesRuntime } from "./_sharedTypes";

declare const $: any;

var StopLimitObject = class StopLimitObject extends TradeObjectClass{

	constructor(settings: Record<string, any>){
		super(settings);
		this.settings = settings;
		this.hitTolerance = 2;
	}

	getOperationTitle(operation: string) {
		return WEBRCP.locale.fusion.getMessage(operation, operation);
	};

	render (o: any, ctx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		this.drawFieldBetweenTrades(o, ctx, model, panel, seriesManager, renderer);
		let orderTypeText = ' Limit';
		if (o.type.includes("TAKE_PROFIT")) orderTypeText = ' TP' + orderTypeText;
		o.title = this.getOperationTitle(o.operation) + orderTypeText + ' ' + (o.object.classification !== 'DEFAULT' ? o.object.classification : '');
		this.drawTradeObject(o, ctx, renderer, model, panel, seriesManager)
		this.drawTradeObject(this.makeStopObject(o), ctx, renderer, model, panel, seriesManager);
	}

	drawFieldBetweenTrades(o: any, ctx: CanvasRenderingContext2D, model: any, panel: any, seriesManager: any, renderer: any){
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var lineY = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var fV = LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
		var lineStopY = renderer.getYCoordinateForPrice(o.stopPrice, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var color = this.settings.line.color;
		if (o.type.includes('BUY')) this.drawRect(lineY, lineStopY, ctx, color);
		else this.drawRect(lineStopY, lineY, ctx, color);
	}

	makeStopObject(o: any){
		var stopObject = $.extend(true,{},o);
		let orderTypeText = ' Stop';
		if (o.type.includes("TAKE_PROFIT")) orderTypeText = ' TP' + orderTypeText;
		stopObject.title = this.getOperationTitle(o.operation) + orderTypeText + ' ' + (o.object.classification !== 'DEFAULT' ? o.object.classification : '');;
		stopObject.price = o.stopPrice;
		stopObject.object.price = o.object.stopPrice
		return(stopObject);
	}

	hit (x: number, y: number, o: any, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		o.stop = false;
		if(super.hit(x, y, o, renderer, interactor, model, panel, seriesManager)){
			o.hitStop = false;
			return o._hit;
		} else {
			o.stop = true;
			super.hit(x, y, o, renderer, interactor, model, panel, seriesManager)
			o.stop = false;
			return o._hit;
		}
	}

	postRender (o: any, ctx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any){
		this.drawPriceTag(o, ctx, renderer, model, panel, seriesManager);
		this.drawPriceTag(this.makeStopObject(o), ctx, renderer, model, panel, seriesManager);
	}

	renderOverlay (o: any, octx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		if (o._hit) {
			var fVLimit = LIB.getReferenceValue(o, model, seriesManager);
			var lineLimit = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVLimit})+panel._offset;
			var fVStop = LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
			var lineStop = renderer.getYCoordinateForPrice(o.stopPrice, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVStop})+panel._offset;
			super.drawRelations(lineLimit, lineStop, null, octx, renderer, model, panel, seriesManager);

			if (o.priceConnections && o.priceConnections.length > 0) {
				for (const i in o.priceConnections) {
					const connectedPriceLimitY = renderer.getYCoordinateForPrice(o.priceConnections[i], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVLimit}) + panel._offset;
					const connectedPriceStopY = renderer.getYCoordinateForPrice(o.priceConnections[i], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVStop}) + panel._offset;
					this.drawRelations(lineLimit, connectedPriceLimitY, null, octx, renderer, model, panel, seriesManager);
					this.drawRelations(lineStop, connectedPriceStopY, null, octx, renderer, model, panel, seriesManager);
				}
			}
		}		
	};

	mouseUp	(e: any, o: any, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		super.mouseUp(e, o, renderer, interactor, model, panel, seriesManager);
		o.drag = false;
	}

	mouseDrag (e: any, o: any, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		var dragPrice = this.getDragPrice(e, o, renderer, interactor, model, panel, seriesManager);

		const candles = seriesManager[model.instrumentsSeries[0].seriesId].data;
		const lastClose = candles[candles.length - 1].c;
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

	getReferenceValue(e: any, o: any, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.limitPrice && o.stopPrice && o.hitStop) 
			return LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
		else 
			return LIB.getReferenceValue(o, model, seriesManager);
	}

	mouseOut (e: any, o: any, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		super.mouseOut(e, o, renderer, interactor, model, panel, seriesManager);
		o.drag = false;
		o.stopPrice = o.object.stopPrice;
		o.limitPrice = o.object.limitPrice;
	}
}



const StopLimitObjectCtor: new (...args: any[]) => any = StopLimitObject as any;
export { StopLimitObjectCtor as StopLimitObject };
