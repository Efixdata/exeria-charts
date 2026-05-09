import WEBRCP from "../../WebRCP";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import {
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { ShapeRuntime } from "./_sharedTypes";

function BoxObject(this: ShapeRuntime) {
  this.render = function (
    o: LegacyShapeObject,
    ctx: CanvasRenderingContext2D,
    renderer: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
    ctx.beginPath();
    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    if (o.fillBg == true) {
      ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      ctx.globalAlpha = 0.2;
      ctx.fillRect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    ctx.stroke();
    ctx.closePath();
  };

  this.renderOverlay = function (
    o: LegacyShapeObject,
    octx: CanvasRenderingContext2D,
    renderer: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
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

    function drawDiagonal(o: LegacyShapeObject, ctx: CanvasRenderingContext2D, pts: any[]) {
      ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.setLineDash([2, 5]);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      ctx.setLineDash([1]);
      ctx.closePath();
    }
  };

  this.hit = function (
    x: number,
    y: number,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
    var hitResult = false;

    this.clearHits(o);

    if (
      between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
      between(pts[0].y, y, pts[1].y, self.hitTolerance + self.anchorPointDistanceToArrow)
    ) {
      //check diagonal
      var nlp1 = getLinePointNearestMouse(
        { x0: pts[0].x, y0: pts[0].y, x1: pts[1].x, y1: pts[1].y },
        x,
        y
      );
      var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });

      if (
        distance < self.hitTolerance ||
        between(pts[0].x, x, pts[0].x, self.hitTolerance) ||
        between(pts[1].x, x, pts[1].x, self.hitTolerance) ||
        between(pts[0].y, y, pts[0].y, self.hitTolerance) ||
        between(pts[1].y, y, pts[1].y, self.hitTolerance)
      ) {
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

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;
}

const BoxObjectCtor: new (...args: any[]) => any = BoxObject as any;
export { BoxObjectCtor as BoxObject };
