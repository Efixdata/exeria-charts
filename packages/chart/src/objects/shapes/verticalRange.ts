import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function VerticalRangeObject(this: ShapeRuntime){
	this.render			=	function (o: LegacyShapeObject, ctx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];

		ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		var x = pts[0].x;
		var y1 = pts[0].y;
		var y2 = pts[1].y;
		if(y2<y1){
			var tmp = y1;
			y1 = y2;
			y2=tmp;
		}
		var yMid = (pts[0].y+pts[1].y)/2;

		if(!o.flipped){
			ctx.beginPath();
			ctx.bezierCurveTo(x - 4, y1 + 1, x - 6, y1 + 4, x - 6, y1 + 7);
			ctx.lineTo(x - 6, yMid - 7);
			ctx.bezierCurveTo(x - 6, yMid - 7 + 3, x - 8, yMid - 7 + 6, x - 12, yMid - 7 + 7);
			ctx.bezierCurveTo(x - 8, yMid + 7 - 6, x - 6, yMid + 7 - 3, x - 6, yMid + 7);
			ctx.lineTo(x - 6, y2 - 7);
			ctx.bezierCurveTo(x - 6, y2 - 4, x - 4, y2 - 1, x, y2);
			ctx.stroke();

			if(o.text)
				ctx.fillText(o.text, x-20 -ctx.measureText(o.text).width, yMid);

		}else{
			ctx.beginPath();
			ctx.bezierCurveTo(x + 4, y1 + 1, x + 6, y1 + 4, x + 6, y1 + 7);
			ctx.lineTo(x + 6, yMid - 7);
			ctx.bezierCurveTo(x + 6, yMid - 7 + 3, x + 8, yMid - 7 + 6, x + 12, yMid - 7 + 7);
			ctx.bezierCurveTo(x + 8, yMid + 7 - 6, x + 6, yMid + 7 - 3, x + 6, yMid + 7);
			ctx.lineTo(x + 6, y2 - 7);
			ctx.bezierCurveTo(x + 6, y2 - 4, x + 4, y2 - 1, x, y2);
			ctx.stroke();

			if(o.text)
				ctx.fillText(o.text, x+20, yMid);

		}
	}

	this.renderOverlay = function (o: LegacyShapeObject, octx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
		var x = pts[0].x;
		var y1 = pts[0].y;
		var y2 = pts[1].y;

		if(o._hit || o.selected){
			octx.setLineDash([2,5]);
			octx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
			if(!o.flipped){
				octx.beginPath();
				octx.moveTo(x,y1);
				octx.lineTo(panel._width , y1);
				octx.moveTo(x,y2);
				octx.lineTo(panel._width, y2);
				octx.stroke();
				octx.setLineDash([1,1]);
				octx.closePath();
			}else{
				octx.beginPath();
				octx.moveTo(0,y1);
				octx.lineTo(x, y1);
				octx.moveTo(0,y2);
				octx.lineTo(x, y2);
				octx.stroke();
				octx.setLineDash([1,1]);
				octx.closePath();
			}
		}

		Shape.prototype.renderAnchorsOverlay.call(this, o, octx, renderer, model, panel, seriesManager, { drawArrowHandles: false });

	}

	this.hit	=	function (x: number, y: number, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
		var hitResult = false;

		this.clearHits(o);

		var off = o.flipped ? 6 : -6;

		if(between(pts[0].x-1+off, x, pts[1].x+1+off, self.hitTolerance) && between(pts[0].y, y, pts[1].y, self.hitTolerance)){
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
		return Shape.prototype.mouseDownWithPanelPush.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	}

	this.mouseDrag	=	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));

		if(idx!=null){
			if(idx===0){
				//o.anchors[0]._index = baseAnchors[0]._index+xOffset;
				o.anchors[0].value = baseAnchors[0].value+yOffset;
			}else if(idx===1){
				//o.anchors[1]._index = baseAnchors[1]._index+xOffset;
				o.anchors[1].value = baseAnchors[1].value+yOffset;
			}
		}else{
			for(var i=0; i< o.anchors.length ;i++){
				let index = renderer.getStampIndex(baseAnchors[i].stamp, model, seriesManager);
				o.anchors[i]._index = index+xOffset;
				o.anchors[i].value = baseAnchors[i].value+yOffset;
				o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};

	this.stageDrag		=	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				//o.anchors[i]._index = idx;
				o.anchors[i].value = v;
			}
		}
	};

	this.stageUp			=	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		return Shape.prototype.stageUp.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageOut			=	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		return Shape.prototype.stageOut.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};
	
	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("TRENDLINE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			//o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("TRENDLINE stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}


const VerticalRangeObjectCtor: new (...args: any[]) => any = VerticalRangeObject as any;
export { VerticalRangeObjectCtor as VerticalRangeObject };
