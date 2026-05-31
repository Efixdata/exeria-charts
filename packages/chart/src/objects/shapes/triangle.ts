import WEBRCP from "../../WebRCP";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import { resolveShapeOpacity } from "../../shapeStyle";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import {
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { LegacyShapePoint } from "../../objectRuntimeBases";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

var TriangleObject = function (this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    ctx.beginPath();
    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    const opacity = resolveShapeOpacity(o);
    const fillColor = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[0].x, pts[0].y);
    if (o.fillBg == true) {
      ctx.globalAlpha = opacity * 0.2;
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.globalAlpha = opacity;
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.closePath();
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    Shape.prototype.renderAnchorsOverlay.call(
      this,
      o,
      octx,
      renderer,
      model,
      panel,
      seriesManager,
      { drawArrowHandles: false }
    );
    if (o._hit || o.selected) {
      drawDiagonal(o, octx, pts);
    }

    function drawDiagonal(
      object: LegacyShapeObject,
      ctx: CanvasRenderingContext2D,
      points: LegacyShapePoint[]
    ) {
      ctx.strokeStyle =
        object.color ? object.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.setLineDash([2, 5]);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      ctx.setLineDash([1]);
      ctx.closePath();
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;

    this.clearHits(o);

    if (
      (between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
        between(pts[0].y, y, pts[1].y, self.hitTolerance)) ||
      (between(pts[1].x, x, pts[2].x, self.hitTolerance) &&
        between(pts[1].y, y, pts[2].y, self.hitTolerance)) ||
      (between(pts[0].x, x, pts[2].x, self.hitTolerance) &&
        between(pts[0].y, y, pts[2].y, self.hitTolerance))
    ) {
      var nlp1 = getLinePointNearestMouse(
        { x0: pts[0].x, y0: pts[0].y, x1: pts[1].x, y1: pts[1].y },
        x,
        y
      );
      var d1 = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
      var nlp2 = getLinePointNearestMouse(
        { x0: pts[1].x, y0: pts[1].y, x1: pts[2].x, y1: pts[2].y },
        x,
        y
      );
      var d2 = pointsDistance({ x: x, y: y }, { x: nlp2.x, y: nlp2.y });
      var nlp3 = getLinePointNearestMouse(
        { x0: pts[0].x, y0: pts[0].y, x1: pts[2].x, y1: pts[2].y },
        x,
        y
      );
      var d3 = pointsDistance({ x: x, y: y }, { x: nlp3.x, y: nlp3.y });

      if (d1 < self.hitTolerance || d2 < self.hitTolerance || d3 < self.hitTolerance) {
        hitResult = true;
        o._hit = true;
        var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
        if (p) {
          o._hitAnchor = { x: p.x, y: p.y };
        }
      }
    }

    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithExpandableArrowSelection");

  // this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	o._hitAnchor=null;
  // 	o._hitArrow=null;

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

  this.mouseUp = createShapeMouseUpExpandableDelegate({ popPanel: false });

  this.mouseOut = createShapeMouseOutDelegate();

  /*
			 * STAGE
			//  */

  // this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("BOX stage down start", interactor.currentAnchor);
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
  // 		console.log("BOX stage down start", ca);
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
  // 		console.log("BOX long drag ");
  // 		interactor.currentAnchor.drag = true;
  // 		var i = interactor.currentAnchor.selected;
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("BOX after drag",i, o.anchors[i]);
  // 		}
  // 	}
  // 	interactor.renderOverlayedObject (this, o, panel);
  // };

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;
};

const TriangleObjectCtor: import("./_sharedTypes").ShapeConstructor =
  TriangleObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { TriangleObjectCtor as TriangleObject };
