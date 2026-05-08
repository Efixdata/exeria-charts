import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function DiNapoliAbcObject(this: ShapeRuntime){
	this.subscriptionPack = 'diNapoliTools';
	
	this.getPoints = function(o, renderer, panel, model, seriesManager){
		var pts = DiNapoliAbcObject.prototype.getPoints.call(this,o, renderer, panel, model,seriesManager);
		
		// var xLength = pts[0].x - pts[1].x;
		// var yLength = pts[0].y - pts[1].y;
		// var x = (pts[2].x - xLength * o.values[o.values.length-1]/100);
		// var y = (pts[2].y - yLength * o.values[o.values.length-1]/100);
		// var index = renderer.getPointIndex(x, model);
		// pts.push({
		// 	x: x,
		// 	y: y,
		// 	stamp: renderer.getIndexStamp(index, model, seriesManager),
		// 	expandable:true,
		// 	expanded:pts[2].expanded
		// });

		// pts[2].expandable = false;
		// pts[2].expanded = false;
		return pts;
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");

		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();

		for(var i=0; i<pts.length;i++){
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			this.drawPoint(ctx, pts, i, pts[i].value.toFixed(this.getPrecision(model)));
		}
		ctx.stroke();

		this.drawLevelPoints(pts, o, ctx, renderer, model, panel, seriesManager);
	}

	this.drawPoint = function (ctx, pts, i, price) {
		const circleRadius = 6;
		const text = this.getIndexName(i) + price;
		ctx.moveTo(pts[i].x + circleRadius, pts[i].y);
		ctx.arc(pts[i].x, pts[i].y, circleRadius, 0, 2 * Math.PI);
		ctx.lineTo(pts[i].x + 100, pts[i].y);
		ctx.moveTo(pts[i].x + circleRadius, pts[i].y + 12);

		ctx.fillText(text, pts[i].x + circleRadius + 4, pts[i].y - 4);
	}

	this.getIndexName = function (index) {
		if (index === 0) return "A ";
		else if (index === 1) return "B ";
		else if (index === 2) return "C ";
		else return "";
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

	this.getPrecision = function (model) {
		let p = 2
		if(model.instrumentsSeries[0] && model.instrumentsSeries[0].instrument && model.instrumentsSeries[0].instrument.precision){
			p = model.instrumentsSeries[0].instrument.precision;
		}

		return p;
	}

	this.drawLevelPoints = function(pts, o, ctx, renderer, model, panel, seriesManager){
		var yLength = pts[0].y - pts[1].y;
		var valueDistance = pts[0].value - pts[1].value;

		const p = this.getPrecision(model);

		var expanded = o.anchors[2].expanded;

		for (var i = 0; i < o.values.length; i++) {

			var level = o.values[i];
			var enabled = o.valuesState[i];
			if(enabled == true){
				var levelX = (pts[2].x);
				var levelY = (pts[2].y - yLength * level/100);

				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var y = renderer.getPriceForYCoordinate(levelY, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})+panel._offset;
				
				var valueText = (pts[2].value - valueDistance * level/100).toFixed(p);
				var levelText = (level / 100).toFixed(3);

				if (i == o.values.length - 1){
					ctx.moveTo(pts[2].x, pts[2].y);
					ctx.lineTo(levelX, levelY);
				}

				
				ctx.beginPath()
				ctx.fillStyle = this.getValueColor(level);
				ctx.strokeStyle = this.getValueColor(level);
				ctx.moveTo(levelX + 30, levelY);
				if(!expanded)
					ctx.lineTo(levelX + 130, levelY);
				else{
					ctx.fillStyle = this.getValueColor(level);
					ctx.setLineDash([3,3]);
					ctx.lineTo(model._width, levelY);
				}
				ctx.stroke();

				var textHeight = 12;
				var textWidth = 100;

				ctx.fillText(this.getValueName(level), levelX, levelY + 3);

				ctx.fillText(valueText, levelX + 30, levelY - 4);
				ctx.fillText(levelText, levelX + 30, levelY + 12);
			}
			
			ctx.setLineDash(o.dash ? o.dash : []);
		}
	}

	this.getValueColor = function (value) {
		if (value === 61.8) return WEBRCP.utils.colorManager.getColor("accent");
		else if (value === 100) return WEBRCP.utils.colorManager.getColor("buyColor");
		else if(value === 161.8) return WEBRCP.utils.colorManager.getColor("sellColor");
		else return WEBRCP.utils.colorManager.getColor("primaryTextColor");
	}

	this.getValueName = function (value) {
		if (value === 61.8) return "COP";
		else if (value === 100) return "OP";
		else if(value === 161.8) return "XOP";
		else return "";
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if (pts.length >= 2) {
			for (var i = 0; i < pts.length; i++) {

				if (between(pts[i].x, x, pts[i].x + 100, self.hitTolerance + self.anchorPointDistanceToArrow) &&
					between(pts[i].y, y, pts[i].y, self.hitTolerance + self.anchorPointDistanceToArrow)) {

					var nlp1 = getLinePointNearestMouse({ x0: pts[i].x, y0: pts[i].y, x1: pts[i].x + 100, y1: pts[i].y }, x, y);
					var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y })

					if (distance < self.hitTolerance && between(pts[i].x, x, pts[i].x + 100, self.hitTolerance) && between(pts[i].y, y, pts[i].y, self.hitTolerance)) {
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if (p) {
							o._hitAnchor = { x: p.x, y: p.y };
						}
						break;
					} else {
						var p = findAnchorPointArrowForXY(pts, x, y, self.anchorPointDistanceToArrow, self.hitTolerance);
						if (p && o.selected) {
							hitResult = true;
							o._hit = true;
							o._hitArrow = { x: p.x, y: p.y };
						}
					}
				}
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		this.wasDrag = false;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		if(interactor.currentAnchor.selected === 3 ) interactor.currentAnchor.selected = null;
		// SUPER COULD BE CALLED HERE
		Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		if(!this.wasDrag){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[2].x, pts[2].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
				this.expandAnchor(o.anchors[2]);
			}
		}
		interactor.popPanel(this, o, panel);

	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].value = v;
				o.anchors[i].stamp = renderer.getIndexStamp(idx, model, seriesManager);

				for(var ii=i+1; ii< o.anchors.length; ii++){
					o.anchors[ii].value = v;
					o.anchors[ii]._index = idx;
					o.anchors[i].stamp = renderer.getIndexStamp(idx, model, seriesManager);
				}

			}
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		// console.log(" ABCD stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			o.hidden=false;
			interactor.currentAnchor = null;
			return true;
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ABCD stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("ABCD stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}


const DiNapoliAbcObjectCtor: new (...args: any[]) => any = DiNapoliAbcObject as any;
export { DiNapoliAbcObjectCtor as DiNapoliAbcObject };
