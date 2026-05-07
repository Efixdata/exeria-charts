import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function TimeRangeObject(this: ShapeRuntime) {

	this.render	= function (o: LegacyShapeObject, ctx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
		const text = o.text ?? "";

		ctx.save();
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		if (o.secondaryColor) {
			ctx.fillStyle = o.secondaryColor;
		} else {
			ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
			ctx.globalAlpha = 0.1;
		}

		ctx.fillRect(pts[0].x, panel._offset, pts[1].x-pts[0].x, panel._height-22);

		ctx.globalAlpha = 1;
		ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		ctx.fillRect(pts[0].x, panel._offset+panel._height - 22, pts[1].x-pts[0].x, 22);

		const measuredText = ctx.measureText(text);
		ctx.textBaseline = "middle";
		ctx.fillStyle = o.textColor ? o.textColor : WEBRCP.utils.colorManager.getColor('defaultToolTextColor');
		ctx.fillText(
			text,
			(pts[0].x + pts[1].x)/2 - measuredText.width/2,
			panel._offset + panel._height - 22/2
		);

		ctx.restore();
	}

	this.renderOverlay = function (o: LegacyShapeObject, octx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) return;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];

		if(o._hit || o.selected){
			octx.save();
			octx.setLineDash([2,5]);
			octx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
			octx.beginPath();
			octx.moveTo(pts[0].x,panel._offset);
			octx.lineTo(pts[0].x, panel._height+panel._offset);
			octx.moveTo(pts[1].x,panel._offset);
			octx.lineTo(pts[1].x, panel._height+panel._offset);
			octx.stroke();
			octx.closePath();

			octx.restore();
		}

		Shape.prototype.renderAnchorsOverlay.call(this, o, octx, renderer, model, panel, seriesManager, { drawArrowHandles: false });
	}

	this.hit = function (x: number, y: number, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) return false;
		var self = this;

		var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
		var hitResult = false;
		this.clearHits(o);

		if (between(pts[0].x, x, pts[0].x, self.hitTolerance) || between(pts[1].x, x, pts[1].x, self.hitTolerance)) {
			hitResult = true;
			o._hit = true;
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}

	this.mouseDown	=	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) {
			return Shape.prototype.createAnchorSelection.call(this, o, null);
		}
		return Shape.prototype.mouseDownWithPanelPush.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	}
	this.mouseDrag = function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) return;

		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));

		if (idx!=null) {
			let index = renderer.getStampIndex(baseAnchors[idx].prawilnyStamp, model, seriesManager);
			o.anchors[idx]._index = index+xOffset;
			o.anchors[idx].prawilnyStamp = renderer.getIndexStamp(o.anchors[idx]._index, model, seriesManager);
		} else {
			for (var i=0; i< o.anchors.length ;i++) {
				let index = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
				o.anchors[i]._index = index+xOffset;
				o.anchors[i].value = baseAnchors[i].value+yOffset;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};

	this.stageDrag = function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) return;
		
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;

		if (Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance) {
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var idx = renderer.getPointIndex (e._offset.offsetX, model);

			if (i!=null && i < o.anchors.length) {
				o.anchors[i]._index = idx;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};

	this.stageUp = function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) return;
		return Shape.prototype.stageUp.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageOut =	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		if (o.editable === false) return;
		return Shape.prototype.stageOut.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.getPoints	= function (o: LegacyShapeObject, renderer: any, panel: any, model: any, seriesManager: any) {
		const y = panel._offset + panel._height / 2 - this.anchorPointSize / 2;
		let startStamp;
		let endStamp;
		let pts = [];

		if (o.startTime === "now" && typeof o.timeRange === "number") {
			var lastStamp = seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length-1]['stamp'];
			var lastIndex = seriesManager[model.mainSeries].data.length-1;
			const now = Date.now();
			startStamp = now;
			endStamp = now + o.timeRange;

			pts[0] = {
				x: Math.floor(renderer.getIndexPoint(lastIndex, model) + model.periodWidth / 2),
				y,
				index: lastIndex,
				stamp: startStamp
			}
		} else if (typeof o.startTime === "number" && typeof o.timeRange === "number") {
			endStamp = o.startTime + o.timeRange;

			pts[0] = {
					x: Math.floor(renderer.getStampPoint(o.startTime, model, seriesManager) + model.periodWidth / 2),
					y: y,
					index: renderer.getStampIndex(o.startTime, model, seriesManager),
					stamp: o.startTime
				}
		} else {
			throw Error("Invalid TimeRange config. startTime should be numeric or 'now' and timeRange should be numeric.")
		}

		pts[1] = {
			x: Math.floor(renderer.getStampPoint(endStamp, model, seriesManager) + model.periodWidth / 2),
			y: y,
			index: renderer.getStampIndex(endStamp, model, seriesManager),
			stamp: endStamp
		};

		if (pts[1].x === pts[0].x) {
			pts[1].x += 1;
			pts[0].x -= 2;
		}
		return pts;
		
	}
}


const TimeRangeObjectCtor: new (...args: any[]) => any = TimeRangeObject as any;
export { TimeRangeObjectCtor as TimeRangeObject };
