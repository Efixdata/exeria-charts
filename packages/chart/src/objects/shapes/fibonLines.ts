import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

var FibonLinesObject	=	function (this: ShapeRuntime) {

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var distance = Math.abs(pts[0].y-pts[1].y);
		//calc line values
		var valuesPoints = [];
		for(var i =0; i< o.values.length;i++){
			if(o.valuesState[i]==true){
				var p = pts[1];
				var y = p.y;
				if(p.y>pts[0].y)
					y = y-distance*o.values[i]/100;
				else
					y = y+distance*o.values[i]/100;
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var v = renderer.getPriceForYCoordinate(y, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})+panel._offset;
				valuesPoints.push({y:y, v:v, p:o.values[i]});
			}
		}

		ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		//fill
		ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		if(o.fillBg && o.color!==null && o.color!==undefined){
			for(var i =0; i< valuesPoints.length-1;i++){
				var vp = valuesPoints[i];
				var vp2 = valuesPoints[i+1];
				ctx.beginPath();
				ctx.globalAlpha = 0.05+i*0.03;
				ctx.moveTo(pts[0].x, vp.y);
				ctx.lineTo(pts[1].x, vp.y);
				ctx.lineTo(pts[1].x, vp2.y);
				ctx.lineTo(pts[0].x, vp2.y);
				ctx.lineTo(pts[0].x, vp.y);
				ctx.fill();
				ctx.closePath();
			}
			ctx.globalAlpha = 1;
		}

		//draw lines
		ctx.beginPath();
		for(var i =0; i< valuesPoints.length;i++){
			var lineFrom = pts[0].x;
			var lineTo = pts[1].x;

			if(o.anchors[0].expanded == true){
				if(pts[0].x > pts[1].x){
					lineTo = model._timeAxisWidth;
				}else{
					lineFrom = 0;
				}

			}
			if(o.anchors[1].expanded == true){
				if(pts[1].x < pts[0].x){
					lineFrom = 0;
				}else{
					lineTo = model._timeAxisWidth;
				}

			}


			ctx.moveTo(lineFrom, valuesPoints[i].y);
			ctx.lineTo(lineTo, valuesPoints[i].y);
		}
		ctx.stroke();
		//draw diagonal
		//ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracementLine");
		ctx.moveTo(pts[0].x,pts[0].y);
		ctx.lineTo(pts[1].x,pts[1].y);
		ctx.stroke();
		ctx.setLineDash([]);

		//draw labels
		ctx.font = this.defaultFont;
		for(var i =0; i< valuesPoints.length;i++){
			var vp = valuesPoints[i];
			ctx.fillText(vp.v.toFixed(panel.precision)+" ("+vp.p+"%)",pts[0].x,vp.y-5);
		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		Shape.prototype.renderAnchorsOverlay.call(this, o, octx, renderer, model, panel, seriesManager);
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;
		const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

		this.clearHits(o);

		if(	(	between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
				between(pts[0].y, y, pts[1].y, self.hitTolerance+self.anchorPointDistanceToArrow)
		)
		|| (
				o.anchors[0].expanded == true &&
				between(pts[0].x < pts[1].x ? 0 : pts[0].x, x , pts[0].x < pts[1].x ? pts[1].x : panel._width - valueAxisWidth, self.hitTolerance)
			)
		|| (
				o.anchors[1].expanded == true &&
				between(pts[1].x < pts[0].x ? 0 : pts[1].x, x , pts[1].x < pts[0].x ? pts[0].x : panel._width - valueAxisWidth, self.hitTolerance)
			)
		){
			//line 1
			var nlp1 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[0].y}, x, y);
			var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
			if(distance<self.hitTolerance){
				hitResult = true;
				o._hit = true;
			}

			if(!hitResult){ //line 2
				var nlp2 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[1].y, x1:pts[1].x, y1:pts[1].y}, x, y);
				var distance=pointsDistance({x:x,y:y},{x:nlp2.x, y:nlp2.y})
				if(distance< self.hitTolerance){
					hitResult = true;
					o._hit = true;
				}
			}

			if(!hitResult){//diagonal
				var nlp2 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[1].y}, x, y);
				var distance=pointsDistance({x:x,y:y},{x:nlp2.x, y:nlp2.y})
				if(distance< self.hitTolerance){
					hitResult = true;
					o._hit = true;
				}
			}

			if(hitResult){
				var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
				if(p){
					o._hitAnchor = {x:p.x, y:p.y};
				}
			}else{
				//arrows
				var p = findAnchorPointArrowForXY(pts, x,y,self.anchorPointDistanceToArrow,self.hitTolerance);
				if(p && o.selected){
					hitResult = true;
					o._hit=true;
					o._hitArrow = {x:p.x, y:p.y};
				}
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		return Shape.prototype.mouseDownWithPanelPush.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	}

	// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var idx = interactor.currentAnchor.selected;
	// 	var baseAnchors = interactor.currentAnchor.anchors;
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);

	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));

	// 	if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

	// 	if(idx!=null){
	// 		if(idx===0){
	// 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
	// 			o.anchors[0].value = baseAnchors[0].value+yOffset;
	// 		}else if(idx===1){
	// 			o.anchors[1]._index = baseAnchors[1]._index+xOffset;
	// 			o.anchors[1].value = baseAnchors[1].value+yOffset;
	// 		}
	// 	}else{
	// 		for(var i=0; i< o.anchors.length ;i++){
	// 			o.anchors[i]._index = baseAnchors[i]._index+xOffset;
	// 			o.anchors[i].value = baseAnchors[i].value+yOffset;
	// 		}
	// 	}
	// };

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		Shape.prototype.mouseUpWithExpandableAnchors.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		Shape.prototype.mouseOutKeepHits.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};


	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 	if(interactor.currentAnchor==null){
	// 		o.anchors[0].value = v;
	// 		o.anchors[0]._index = idx;
	// 		o.anchors[1].value = v;
	// 		o.anchors[1]._index = idx;
	// 		//panel.objects.push(o);
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("stage down start", ca);
	// 		return ca;
	// 	}
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("start drag ");
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("real drag ");
	// 		interactor.currentAnchor.drag = true;
	// 	}
	// 	this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
	// };

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		return Shape.prototype.stageUp.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		// console.log("stage out");
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("stage move",i, o.anchors[i]);
	// 		}
	// 	}
	// };
}



const FibonLinesObjectCtor: new (...args: any[]) => any = FibonLinesObject as any;
export { FibonLinesObjectCtor as FibonLinesObject };
