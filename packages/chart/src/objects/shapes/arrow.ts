import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  calcLine,
  isPointInCircle,
  pointsDistance,
  findMidPoint,
  getLinePointNearestMouse,
  calcPointOnPerpendicularLine,
  movePointByDistance,
  findAnchorPointForXY,
  findAnchorPointArrowForXY,
  drawAnchor,
  drawAnchors,
  drawAnchorArrow,
  drawAnchorsArrow,
  drawIndicatorMarker,
} from "../../utils/objects-lib";
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

var ArrowObject = function (this: ShapeRuntime) {
  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var baseLine = calcLine(pts[0], pts[1]);
    var distance = pointsDistance(pts[0], pts[1]);
    var midPoint = findMidPoint(pts[0], pts[1]);

    var drawPoints = [];
    drawPoints.push(pts[0]);
    drawPoints.push(calcPointOnPerpendicularLine(baseLine, pts[0], -distance / 4));
    drawPoints.push(calcPointOnPerpendicularLine(baseLine, midPoint, -distance / 4));
    drawPoints.push(calcPointOnPerpendicularLine(baseLine, midPoint, -distance / 2));
    drawPoints.push(pts[1]);
    drawPoints.push(calcPointOnPerpendicularLine(baseLine, midPoint, distance / 2));
    drawPoints.push(calcPointOnPerpendicularLine(baseLine, midPoint, distance / 4));
    drawPoints.push(calcPointOnPerpendicularLine(baseLine, pts[0], distance / 4));
    drawPoints.push(pts[0]);

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
    for (var i = 0; i < drawPoints.length; i++) {
      ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
    }

    ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();

    if (o.selected) {
      drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
          drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5);
      }
    }

    if (o._hit || o.selected) {
      drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
    }

    if (o.selected) {
      drawAnchorsArrow(
        octx,
        panel,
        pts,
        this.anchorPointArrowSize,
        this.anchorPointDistanceToArrow,
        this.anchorColor,
        1
      );
    }
  };

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    var self = this;
    var hitResult = false;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var mid = findMidPoint(pts[0], pts[1]);
    var d = pointsDistance(pts[0], pts[1]);

    this.clearHits(o);

    hitResult = isPointInCircle({ x: mid.x, y: mid.y, r: d / 2 + self.hitTolerance }, x, y);
    if (hitResult) {
      o._hit = true;
      drawAnchors(interactor.octx, panel, pts, self.anchorPointSize, this.anchorColor, 0.5);
      var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
      if (p) {
        o._hitAnchor = { x: p.x, y: p.y };
      }
    }
    return hitResult;
  };

  this.mouseDown = function (e, o, renderer, interactor, model, panel, seriesManager) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    interactor.pushPanel(this, o, panel);
    for (var i = 0; i < pts.length; i++) {
      if (
        interactor.isOver(
          e._offset.offsetX,
          e._offset.offsetY,
          pts[i].x,
          pts[i].y,
          self.hitTolerance
        )
      ) {
        console.log("Clicked point :", i, pts[i]);
        return { selected: i, anchors: JSON.parse(JSON.stringify(o.anchors)) };
      }
    }
    return { selected: null, anchors: JSON.parse(JSON.stringify(o.anchors)) };
  };

  /*
   * STAGE
   */

  // this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("ARROW stage down start", interactor.currentAnchor);
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
  // 		console.log("ARROW stage down start", ca);
  // 		return ca;
  // 	}
  // 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
  // };

  // this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("ARROW start drag ");
  // 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
  // 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
  // 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
  // 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){			console.log("ARROW real drag ");
  // 	interactor.currentAnchor.drag = true;
  // 	}
  // 	this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
  // };

  this.stageUp = function (e, o, renderer, interactor, model, panel, seriesManager) {
    interactor.popPanel(this, o, panel);

    if (interactor.currentAnchor && interactor.currentAnchor.drag)
      interactor.currentAnchor.selected++;

    if (
      interactor.currentAnchor !== null &&
      interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length
    ) {
      interactor.currentAnchor = null;
      return true;
    }
  };

  this.stageOut = function (e, o, renderer, interactor, model, panel, seriesManager) {};

  // this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("ARROW stage move", interactor.currentAnchor);
  // 	if(interactor.currentAnchor){
  // 		var i = interactor.currentAnchor.selected;
  // 		var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("ARROW stage move",i, o.anchors[i]);
  // 		}
  // 	}
  // };
};

const ArrowObjectCtor: new (...args: any[]) => any = ArrowObject as any;
export { ArrowObjectCtor as ArrowObject };
