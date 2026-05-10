import WEBRCP from "../../WebRCP";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject, LegacyShapePoint } from "../../objectRuntimeBases";
import {
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function BoxObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
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
      between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
      between(pts[0].y, y, pts[1].y, self.hitTolerance + self.anchorPointDistanceToArrow)
    ) {
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
  this.mouseUp = createShapeMouseUpExpandableDelegate({ popPanel: false });
  this.mouseOut = createShapeMouseOutDelegate();
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const BoxObjectCtor: import("./_sharedTypes").ShapeConstructor =
  BoxObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { BoxObjectCtor as BoxObject };
