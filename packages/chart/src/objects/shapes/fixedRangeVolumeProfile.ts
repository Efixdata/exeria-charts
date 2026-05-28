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
import { resolveShapeOpacity } from "../../shapeStyle";
import { resolveFixedRangeVolumeProfileGeometry } from "./fixedRangeVolumeProfileBase";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function FixedRangeVolumeProfileObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 2) {
      return;
    }

    const geometry = resolveFixedRangeVolumeProfileGeometry(
      o as LegacyShapeObject,
      points,
      renderer,
      model,
      panel,
      seriesManager,
    );
    if (!geometry) {
      return;
    }

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    const lineWidth = typeof o.width === "number" ? o.width : 1;
    const dash = Array.isArray(o.dash) ? o.dash : [];
    const opacity = resolveShapeOpacity(o);
    const showValueArea = (o as { showValueArea?: boolean }).showValueArea !== false;
    const showPoc = (o as { showPoc?: boolean }).showPoc !== false;
    const { rect, rows, maxVolume } = geometry;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    if (o.fillBg === true && showValueArea) {
      ctx.globalAlpha = opacity * 0.12;
      ctx.fillRect(
        rect.left,
        geometry.valueAreaHighY,
        rect.width,
        geometry.valueAreaLowY - geometry.valueAreaHighY,
      );
      ctx.globalAlpha = opacity;
    }

    const maxBarWidth = rect.width / 2;

    ctx.globalAlpha = opacity * 0.55;
    for (const row of rows) {
      if (row.volume <= 0) {
        continue;
      }

      const barWidth = (row.volume / maxVolume) * maxBarWidth;
      ctx.fillRect(rect.left, row.yTop, barWidth, Math.max(row.yBottom - row.yTop, 1));
    }
    ctx.globalAlpha = opacity;

    ctx.setLineDash(dash);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    if (showPoc) {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rect.left, geometry.pocY);
      ctx.lineTo(rect.right, geometry.pocY);
      ctx.stroke();
    }

    if (showValueArea) {
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(rect.left, geometry.valueAreaHighY);
      ctx.lineTo(rect.right, geometry.valueAreaHighY);
      ctx.moveTo(rect.left, geometry.valueAreaLowY);
      ctx.lineTo(rect.right, geometry.valueAreaLowY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    Shape.prototype.renderAnchorsOverlay.call(
      this,
      o,
      octx,
      renderer,
      model,
      panel,
      seriesManager,
      { drawArrowHandles: false },
    );

    if ((o._hit || o.selected) && points?.length >= 2) {
      drawDiagonal(o, octx, points);
    }

    function drawDiagonal(
      object: LegacyShapeObject,
      overlayContext: CanvasRenderingContext2D,
      anchorPoints: LegacyShapePoint[],
    ) {
      overlayContext.strokeStyle =
        object.color ? object.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      overlayContext.beginPath();
      overlayContext.moveTo(anchorPoints[0].x, anchorPoints[0].y);
      overlayContext.setLineDash([2, 5]);
      overlayContext.lineTo(anchorPoints[1].x, anchorPoints[1].y);
      overlayContext.stroke();
      overlayContext.setLineDash([]);
      overlayContext.closePath();
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    const self = this;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 2) {
      return false;
    }

    const geometry = resolveFixedRangeVolumeProfileGeometry(
      o as LegacyShapeObject,
      points,
      renderer,
      model,
      panel,
      seriesManager,
    );

    this.clearHits(o);
    if (!geometry) {
      return false;
    }

    const rect = geometry.rect;
    let hitResult = false;

    if (
      between(rect.left, x, rect.right, self.hitTolerance) &&
      between(rect.top, y, rect.bottom, self.hitTolerance + self.anchorPointDistanceToArrow)
    ) {
      const nearest = getLinePointNearestMouse(
        { x0: rect.left, y0: rect.top, x1: rect.right, y1: rect.bottom },
        x,
        y,
      );
      const distance = pointsDistance({ x, y }, nearest);

      if (
        distance < self.hitTolerance ||
        between(rect.left, x, rect.left, self.hitTolerance) ||
        between(rect.right, x, rect.right, self.hitTolerance) ||
        between(rect.top, y, rect.top, self.hitTolerance) ||
        between(rect.bottom, y, rect.bottom, self.hitTolerance)
      ) {
        hitResult = true;
        o._hit = true;
        const anchor = findAnchorPointForXY(points, x, y, self.hitTolerance);
        if (anchor) {
          o._hitAnchor = { x: anchor.x, y: anchor.y };
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

const FixedRangeVolumeProfileObjectCtor: import("./_sharedTypes").ShapeConstructor =
  FixedRangeVolumeProfileObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { FixedRangeVolumeProfileObjectCtor as FixedRangeVolumeProfileObject };
