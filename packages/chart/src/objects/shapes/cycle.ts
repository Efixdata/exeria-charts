import WEBRCP from "../../WebRCP";
import {
  between,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import type { LegacyShapePoint } from "../../objectRuntimeBases";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { ShapeHitArgs, ShapeInteractionArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function CycleObject(this: ShapeRuntime) {
  function getCycleValues(x1: number, x2: number, panel: { _width: number }) {
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

  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    if (!panel) return [];
    var pts = CycleObject.prototype.getPoints.call(
      this,
      o,
      renderer,
      panel,
      model,
      seriesManager
    );
    var x1 = pts[0].x;
    var x2 = pts[1].x;
    var vals = getCycleValues(x1, x2, panel);
    var pts2: LegacyShapePoint[] = [];
    for (var i in vals) {
      const x = vals[i];
      const index = renderer.getPointIndex(x, model);
      pts2.push({ x, y: this.anchorPointSize + 1, index, value: 0 });
      pts2.push({
        x,
        y: panel._height + panel._offset - this.anchorPointSize - 1,
        index,
        value: 0,
      });
    }
    return pts2;
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts || !pts[0] || !pts[1]) return;

    var x1 = pts[0].x;
    var x2 = pts[1].x;

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
  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
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

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");

  this.mouseDrag = function (...[e, o, renderer, interactor, model, , seriesManager]: ShapeInteractionArgs) {
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

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;
}

const CycleObjectCtor: import("./_sharedTypes").ShapeConstructor =
  CycleObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { CycleObjectCtor as CycleObject };
