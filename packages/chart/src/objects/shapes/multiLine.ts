import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function MultiLineObject(this: ShapeRuntime){
	this.render = function (o, ctx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);

		for (var i = 1; i < pts.length; i++) {
			ctx.lineTo(pts[i].x, pts[i].y);
		}
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

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
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

		if(pts.length >=2)
			for(var i = 1; i< pts.length;i++){

				if(between(pts[i-1].x, x, pts[i].x, self.hitTolerance)){
					var nlp1 = getLinePointNearestMouse({x0:pts[i-1].x, y0:pts[i-1].y, x1:pts[i].x, y1:pts[i].y}, x, y);
					var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
					if(distance<self.hitTolerance){
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if(p){
							o._hitAnchor = {x:p.x, y:p.y};
						}
						break;
					}
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

	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	o.hidden=true;
	// 	console.log("MULTILINE stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});

	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 	if(interactor.currentAnchor==null){
	// 		for(var i in o.anchors){
	// 			o.anchors[i].value = v;
	// 			o.anchors[i]._index = idx;
	// 		}
	// 		//panel.objects.push(o);
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("MULTILINE stage down start", ca);
	// 		return ca;
	// 	}
	// 	interactor.pushPanel(this, o, panel);
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("MULTILINE long drag ");
	// 		interactor.currentAnchor.drag = true;
	// 		var i = interactor.currentAnchor.selected;
	// 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("MULTILINE after drag",i, o.anchors[i]);
	// 		}
	// 	}
	// };

	this.stageDrag = function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);

		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var idx = renderer.getPointIndex (e._offset.offsetX, model);
		var yValue = e._offset.offsetY-panel._offset;

		if(o.sticky){
			var candles = this.getCurrentCandles(idx, model, seriesManager);
			var v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
		}
		else
			var v = renderer.getPriceForYCoordinate(yValue, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});

		var i = interactor.currentAnchor.selected - 1;
		o.anchors[i].value = LIB.round(v,renderer.getPrecision(model,panel));
		o.anchors[i]._index = idx;
		o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		// console.log(" MULTILINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			if(e.button == 0){
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
				var idx = renderer.getPointIndex (e._offset.offsetX, model);
				o.anchors.push( {stamp: renderer.getIndexStamp(idx, model, seriesManager), referenceStamp: 0, offset: 0, value: v, _index: idx} );
				return false;
			}else{
				o.hidden=false;
				interactor.currentAnchor = null;
				return true;
			}
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {

	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("MULTILINE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("MULTILINE stage move",i, o.anchors);
	// 		}
	// 	}
	// };

}


const MultiLineObjectCtor: new (...args: any[]) => any = MultiLineObject as any;
export { MultiLineObjectCtor as MultiLineObject };
