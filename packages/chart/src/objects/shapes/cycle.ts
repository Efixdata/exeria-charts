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

function CycleObject(this: ShapeRuntime) {
  function getCycleValues(x1: number, x2: number, panel: any) {
    var values = [];
    var delta = Math.abs(x1 - x2);
    if (delta < 1) {
      values.push(x1);
      return values;
    }
    for (var x = x1; x > 0; x = x - delta) {
      values.push(x);
    }
    for (var x = x2; x < panel._width; x = x + delta) {
      values.push(x);
    }
    values.sort(function (a, b) {
      return a - b;
    });
    return values;
  }

  this.getPoints = function (
    o: LegacyShapeObject,
    renderer: any,
    panel: any,
    model: any,
    seriesManager: any
  ) {
    var pts = CycleObject.prototype.getPoints.call(
      this,
      o,
      renderer,
      panel,
      model,
      seriesManager
    ) as any[];
    var x1 = pts[0].x;
    var x2 = pts[1].x;
    var vals = getCycleValues(x1, x2, panel);
    var pts2 = [];
    for (var i in vals) {
      pts2.push({ x: vals[i], y: this.anchorPointSize + 1 });
      pts2.push({ x: vals[i], y: panel._height + panel._offset - this.anchorPointSize - 1 });
    }
    return pts2;
  };

  this.render = function (
    o: LegacyShapeObject,
    ctx: CanvasRenderingContext2D,
    renderer: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
    if (!pts || !pts[0] || !pts[1]) return;

    var x1 = pts[0].x;
    var x2 = pts[1].x;
    var y1 = pts[0].y;
    var y2 = pts[1].y;

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x1, panel._height + panel._offset);
    ctx.moveTo(x2, 0);
    ctx.lineTo(x2, panel._height + panel._offset);
    ctx.stroke();

    for (var i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i].x, 0);
      ctx.lineTo(pts[i].x, panel._height + panel._offset - this.anchorPointSize);
      ctx.stroke();
    }
  };
  this.renderOverlay = function (
    o: LegacyShapeObject,
    octx: CanvasRenderingContext2D,
    renderer: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
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
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
    var self = this;
    var hitResult = false;
    this.clearHits(o);

    for (var i = 0; i < pts.length; i++) {
      if (between(pts[i].x - 1, x, pts[i].x + 1, self.hitTolerance)) {
        hitResult = true;
        o._hit = true;
        var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
        if (p) {
          o._hitAnchor = { x: p.x, y: p.y };
        }
        break;
      }
    }
    return hitResult;
  };

  this.mouseDown = function (
    e: any,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    return Shape.prototype.mouseDownWithPanelPush.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };

  this.mouseDrag = function (
    e: any,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var idx = interactor.currentAnchor.selected;
    var baseAnchors = interactor.currentAnchor.anchors;

    var baseMouseIndex = renderer.getPointIndex(
      interactor.initialMouseEvent._offset.offsetX,
      model
    );
    var currentMouseIndex = renderer.getPointIndex(e._offset.offsetX, model);

    var xOffset = currentMouseIndex - baseMouseIndex;

    let index1 = renderer.getStampIndex(baseAnchors[1].stamp, model, seriesManager);
    let index0 = renderer.getStampIndex(baseAnchors[0].stamp, model, seriesManager);
    var oldPeriods = Math.abs(index1 - index0);

    if (idx != null) {
      if (xOffset < 0) {
        o.anchors[0]._index = baseMouseIndex - oldPeriods;
        o.anchors[1]._index = baseMouseIndex + xOffset;
        o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
        o.anchors[1].stamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
      } else if (xOffset > 0) {
        o.anchors[0]._index = baseMouseIndex + xOffset;
        o.anchors[1]._index = baseMouseIndex - oldPeriods;
        o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
        o.anchors[1].stamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
      }
    } else {
      for (var i = 0; i < o.anchors.length; i++) {
        let index = renderer.getStampIndex(baseAnchors[i].stamp, model, seriesManager);
        o.anchors[i]._index = index + xOffset;
        o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
      }
    }
  };

  this.stageUp = function (
    e: any,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    return Shape.prototype.stageUp.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };

  this.stageOut = function (
    e: any,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    return Shape.prototype.stageOut.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };
}

const CycleObjectCtor: new (...args: any[]) => any = CycleObject as any;
export { CycleObjectCtor as CycleObject };
