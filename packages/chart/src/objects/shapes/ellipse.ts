import WEBRCP from "../../WebRCP";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
} from "../../utils/objects-lib";
import {
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { LegacyShapeObject, LegacyShapePoint } from "../../objectRuntimeBases";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function EllipseObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    ctx.save();
    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    var r1 = (pts[1].x - pts[0].x) / 2;
    var r2 = (pts[1].y - pts[0].y) / 2;
    var ellipseX = pts[0].x + r1;
    var ellipseY = pts[0].y + r2;

    ctx.beginPath();
    ctx.ellipse(
      ellipseX,
      ellipseY,
      Math.abs(r1),
      Math.abs(r2),
      (1 * Math.PI) / 180,
      0,
      2 * Math.PI
    );

    if (o.fillBg == true) {
      ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      ctx.globalAlpha = 0.2;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
          drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5);
      }
    }

    if (o._hit || o.selected) {
      drawDiagonal(o, octx, pts);
      drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
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
      between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
      between(pts[0].y, y, pts[1].y, self.hitTolerance)
    ) {
      var nlp1 = getLinePointNearestMouse(
        { x0: pts[0].x, y0: pts[0].y, x1: pts[1].x, y1: pts[1].y },
        x,
        y
      );
      var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
      if (distance < self.hitTolerance) {
        hitResult = true;
        o._hit = true;
        var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
        if (p) {
          o._hitAnchor = { x: p.x, y: p.y };
        }
      }

      var r1 = (pts[1].x - pts[0].x) / 2;
      var r2 = (pts[1].y - pts[0].y) / 2;
      var ellipseX = pts[0].x + r1;
      var ellipseY = pts[0].y + r2;
      var xx = x - ellipseX;
      var ey1 = ellipseY + Math.abs(r2) * Math.sqrt(1 - (xx * xx) / (r1 * r1));
      var ey2 = ellipseY - Math.abs(r2) * Math.sqrt(1 - (xx * xx) / (r1 * r1));

      if (Math.abs(ey1 - y) <= self.hitTolerance) {
        hitResult = true;
        o._hit = true;
      }

      if (Math.abs(ey2 - y) <= self.hitTolerance) {
        o._hit = true;
        hitResult = true;
      }
    }
    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");

  /*
   * STAGE
   */

  // this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
  // 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
  // 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
  // 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
  // 		console.log("ELLIPSE long drag ");
  // 		interactor.currentAnchor.drag = true;
  // 		var i = interactor.currentAnchor.selected;
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("ELLIPSE after drag",i, o.anchors[i]);
  // 		}
  // 	}
  // };
  // this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
  // 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
  // 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
  // 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
  // 		console.log("ELLIPSE long drag ");
  // 		interactor.currentAnchor.drag = true;
  // 		var i = interactor.currentAnchor.selected;
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("ELLIPSE after drag",i, o.anchors[i]);
  // 		}
  // 	}
  // };

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;

  // this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("ELLIPSE stage move", interactor.currentAnchor);
  // 	if(interactor.currentAnchor!==null){
  // 		var i = interactor.currentAnchor.selected;
  // 		var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("TRENDLINE stage move",i, o.anchors);
  // 		}
  // 	}
  // };
}

const EllipseObjectCtor: import("./_sharedTypes").ShapeConstructor =
  EllipseObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { EllipseObjectCtor as EllipseObject };
