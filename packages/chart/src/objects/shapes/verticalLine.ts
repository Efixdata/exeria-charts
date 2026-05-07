import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function VerticalLineObject(this: ShapeRuntime){
	this.getPoints = function(o, renderer, panel, model, seriesManager){
		if (!panel) return;
		var index = renderer.getStampIndex(o.anchors[0].prawilnyStamp, model, seriesManager);
		var x = renderer.getIndexPoint(index, model)+ model._midOffset;
		//var x = renderer.getIndexPoint(o.anchors[0]._index, model)+ model._midOffset;
		return [{x:x, y:panel._offset+this.anchorPointSize},{x:x,y:panel._height+panel._offset}];
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);
		ctx.lineTo(pts[1].x, pts[1].y);
		ctx.stroke();

		if (o.selected) {
			drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(between(pts[0].x-1, x, pts[1].x+1, self.hitTolerance)){
			hitResult = true;
			o._hit = true;
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var idx = interactor.currentAnchor.selected;
	// 	var baseAnchors = interactor.currentAnchor.anchors;
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	for(var i=0; i< o.anchors.length ;i++){
	// 		o.anchors[0]._index = baseAnchors[0]._index+xOffset;
	// 		o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
	// 	}
	// };

	/*
	 * STAGE
	 */

	this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});

		var idx = renderer.getPointIndex (e._offset.offsetX, model);
		if(interactor.currentAnchor==null){
			o.anchors[0].value = v;
			o.anchors[0]._index = idx;
			o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
			//panel.objects.push(o);
			var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
			return ca;
		}
		interactor.pushPanel(this, o, panel);
		return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			o.anchors[0]._index = idx;
			o.anchors[0].value = v;
			o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);

		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		if(interactor.currentAnchor!==null){
			var i = interactor.currentAnchor.selected;
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].value = v;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};
}


const VerticalLineObjectCtor: new (...args: any[]) => any = VerticalLineObject as any;
export { VerticalLineObjectCtor as VerticalLineObject };
