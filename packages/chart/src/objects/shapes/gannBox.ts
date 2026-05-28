import { between, findAnchorPointForXY, drawAnchors } from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import {
  collectGannBoxHitSegments,
  drawGannFanLabels,
  drawGannSegment,
  drawGannSquareFills,
  drawGannSquareLabels,
  drawGannSquareLines,
  hitGannSegments,
  resolveGannBoxGeometry,
  resolveGannPlotBounds,
} from "./gannBase";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function GannBoxObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const geometry = resolveGannBoxGeometry(pts);
    if (!geometry) return;

    const lineWidth = typeof o.width === "number" ? o.width : 1;
    const dash = Array.isArray(o.dash) ? o.dash : [];

    drawGannSquareFills(ctx, geometry);
    drawGannSquareLines(ctx, geometry, lineWidth, dash);

    for (const diagonal of geometry.diagonals) {
      drawGannSegment(ctx, diagonal.segment, diagonal.level.lineColor, lineWidth, dash);
    }

    drawGannSquareLabels(ctx, geometry, this.defaultFont);

    if (geometry.diagonals.length > 0) {
      drawGannFanLabels(
        ctx,
        {
          origin: { x: pts[0].x, y: pts[0].y },
          rays: geometry.diagonals,
        },
        this.defaultFont,
      );
    }
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const bounds = resolveGannPlotBounds(panel, valueAxisWidth);
    const geometry = resolveGannBoxGeometry(pts);

    this.clearHits(o);
    if (!geometry || !between(bounds.plotLeft, x, bounds.plotRight, this.hitTolerance)) {
      return false;
    }

    if (!hitGannSegments(x, y, collectGannBoxHitSegments(geometry), this.hitTolerance)) {
      return false;
    }

    o._hit = true;
    const anchor = findAnchorPointForXY(pts, x, y, this.hitTolerance);
    if (anchor) {
      o._hitAnchor = { x: anchor.x, y: anchor.y };
    }
    drawAnchors(interactor.octx, panel, pts, this.anchorPointSize, this.anchorColor, 0.5);
    return true;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithExpandableArrowSelection");
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const GannBoxObjectCtor: import("./_sharedTypes").ShapeConstructor =
  GannBoxObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { GannBoxObjectCtor as GannBoxObject };
