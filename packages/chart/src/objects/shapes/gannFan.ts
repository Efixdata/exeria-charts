import { between, findAnchorPointForXY, drawAnchors } from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import {
  collectGannFanHitSegments,
  drawGannFanFills,
  drawGannFanLabels,
  drawGannSegment,
  hitGannSegments,
  resolveGannFanGeometry,
  resolveGannPlotBounds,
} from "./gannBase";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function GannFanObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const bounds = resolveGannPlotBounds(panel, valueAxisWidth);
    const geometry = resolveGannFanGeometry(pts, bounds);
    if (!geometry) return;

    const lineWidth = typeof o.width === "number" ? o.width : 1;
    const dash = Array.isArray(o.dash) ? o.dash : [];

    drawGannFanFills(ctx, geometry);

    for (const ray of geometry.rays) {
      drawGannSegment(ctx, ray.segment, ray.level.lineColor, lineWidth, dash);
    }

    drawGannFanLabels(ctx, geometry, this.defaultFont);
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const bounds = resolveGannPlotBounds(panel, valueAxisWidth);
    const geometry = resolveGannFanGeometry(pts, bounds);

    this.clearHits(o);
    if (!geometry || !between(bounds.plotLeft, x, bounds.plotRight, this.hitTolerance)) {
      return false;
    }

    if (!hitGannSegments(x, y, collectGannFanHitSegments(geometry), this.hitTolerance)) {
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

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const GannFanObjectCtor: import("./_sharedTypes").ShapeConstructor =
  GannFanObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { GannFanObjectCtor as GannFanObject };
