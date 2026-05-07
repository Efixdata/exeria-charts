import WEBRCP from "../../WebRCP";
import FUSION from "../../fusion";
import LIB from "../../utils/chartingCommons";
import { between, isPointInCircle, pointsDistance, getLinePointNearestMouse, roundAndTranslate } from '../../utils/objects-lib';
import imageCandleChartWhite from "../../img/icons/candle_chart_white.svg";
import { Series } from "../../objectRuntimeBases";
import { getScriptTitle } from "./_sharedTypes";
import type { SeriesRuntime, PatternStrategyRuntime } from "./_sharedTypes";

var MovePaneArrows	=	function (this: SeriesRuntime) {
	this.opts = {
			color: WEBRCP.utils.colorManager.getColor("iconColor"),
			alpha: 0.54,
			width: 8,
			height: 6,
			offsetY: 12,
			offsetX: 8, //-w*2-spacing
			spacing:8
	}

	this.getMenuItems	=	function (o, chart) {
		return null;
	};

	this.hitTolerance = 2;

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {
		var color = WEBRCP.utils.colorManager.getColor("iconColor");
		ctx.save();
		//ctx.fillStyle = this.opts.color;
		//ctx.strokeStyle = this.opts.color;
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.globalAlpha   = this.opts.alpha;
		



		// var arrowDn = createArrowDn(panel, renderer, this.opts);
		// var arrowUp = createArrowUp(panel, renderer, this.opts);

		// drawArrow(ctx,arrowUp);
		// drawArrow(ctx,arrowDn);
		ctx.globalAlpha   = 1;
		ctx.restore();
	}

	function createArrowDn(panel: any, renderer: any, opts: any){
		const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

		var arrowDn = {
				x: [
				             	panel._width-valueAxisWidth-opts.offsetX-opts.width,
				             	panel._width-valueAxisWidth-opts.offsetX,
				             	panel._width-valueAxisWidth-opts.offsetX-Math.floor(opts.width/2),
				             	panel._width-valueAxisWidth-opts.offsetX-Math.floor(opts.width/2)-1,
				   ],
				y: [
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY+opts.height,
				             	panel._offset+opts.offsetY+opts.height,
				   ]
				}
		return arrowDn;
	}

	function createArrowUp(panel: any, renderer: any, opts: any){
		const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

		var arrowUp = {
				x: [
				             	panel._width-valueAxisWidth-opts.offsetX-opts.width*2-opts.spacing,
				             	panel._width-valueAxisWidth-opts.offsetX-Math.floor(opts.width*1.5)-1-opts.spacing,
				             	panel._width-valueAxisWidth-opts.offsetX-Math.floor(opts.width*1.5)-opts.spacing,
				             	panel._width-valueAxisWidth-opts.offsetX-opts.width-opts.spacing,
				   ],
				y: [
				             	panel._offset+opts.offsetY+opts.height,
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY+opts.height,
				   ]
				}
		return arrowUp;
	}

	function drawArrow(ctx: CanvasRenderingContext2D, a: any){
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(a.x[0], a.y[0]);
		ctx.lineTo(a.x[1], a.y[1]);
		ctx.lineTo(a.x[2], a.y[2]);
		ctx.lineTo(a.x[3], a.y[3]);
		ctx.lineTo(a.x[0], a.y[0]);
		ctx.fill();
		//ctx.stroke();
		ctx.restore();
	}

	this.init = function(){}

	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {}
	this.updateExtremes	=	function (o, extremes, model, seriesManager, panel, renderer) {}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var hitResult: any = false;
		const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

		var x1 = panel._width-valueAxisWidth-this.opts.offsetX-this.opts.width*2-this.opts.spacing;
		var x2 = panel._width-valueAxisWidth-this.opts.offsetX-this.opts.width;

		var y1 = panel._offset+this.opts.offsetY;
		var y2 = panel._offset+this.opts.offsetY+this.opts.height;


		if(between(y1, y, y2, self.hitTolerance)){
			//upper arrow
			if(between(x1, x, x1+this.opts.width, self.hitTolerance)){
				hitResult = {type: 'MovePaneArrows', arrow: 'up'};
				interactor.octx.globalAlpha   = 1;
				interactor.octx.fillStyle   = this.opts.color;
				interactor.octx.strokeStyle = this.opts.color;
				//var arrowUp = createArrowUp(panel, interactor.renderer, this.opts);
				//drawArrow(interactor.octx,arrowUp);
			}
			//down arrow
			else if(between(x2, x, x2+this.opts.width, self.hitTolerance)){
				hitResult = {type: 'MovePaneArrows', arrow: 'dn'};
				interactor.octx.globalAlpha   = 1;
				interactor.octx.fillStyle   = this.opts.color;
				interactor.octx.strokeStyle = this.opts.color;
				//var arrowDn = createArrowDn(panel, model, this.opts);
				//drawArrow(interactor.octx,arrowDn);
			}
		}
		return hitResult;
	}

	function getHoveredArrow(o: any){
		return null;
	}

	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {}

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.movePanelUpDn(panel, o);
	}

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {}

}

const MovePaneArrowsCtor: new (...args: any[]) => any = MovePaneArrows as any;
export { MovePaneArrowsCtor as MovePaneArrows };
