import WEBRCP from "../../WebRCP";
import {
  between,
  calcLine,
  getLinePointNearestMouse,
  movePointByDistance,
  pointsDistance,
  findAnchorPointForXY,
  drawAnchors,
} from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { LegacyShapePoint } from "../../objectRuntimeBases";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

interface PitchforkSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface PitchforkGeometry {
  prongs: PitchforkSegment[];
  baseline: PitchforkSegment;
  pivotToBaseA: PitchforkSegment;
}

const CONSTRUCTION_DASH = [6, 4];

function resolveForwardSign(
  origin: LegacyShapePoint,
  line: ReturnType<typeof calcLine>,
  toward: LegacyShapePoint,
): number {
  const forward = movePointByDistance(origin, 1, line);
  const back = movePointByDistance(origin, -1, line);
  const forwardDistance = pointsDistance(forward, toward);
  const backDistance = pointsDistance(back, toward);
  return forwardDistance <= backDistance ? 1 : -1;
}

function extendProngForward(
  origin: LegacyShapePoint,
  line: ReturnType<typeof calcLine>,
  forwardSign: number,
  plotRight: number,
): PitchforkSegment {
  const parallelB = origin.y - line.a * origin.x;
  const yAtX = (x: number) => line.a * x + parallelB;
  const far = movePointByDistance(origin, forwardSign * 100000, line);
  let endX = far.x;
  let endY = far.y;

  if (forwardSign > 0) {
    if (endX < origin.x) {
      endX = origin.x;
      endY = origin.y;
    } else if (endX > plotRight) {
      endX = plotRight;
      endY = yAtX(plotRight);
    }
  } else {
    if (endX > origin.x) {
      endX = origin.x;
      endY = origin.y;
    } else if (endX < 0) {
      endX = 0;
      endY = yAtX(0);
    }
  }

  return {
    x0: origin.x,
    y0: origin.y,
    x1: endX,
    y1: endY,
  };
}

function resolvePitchforkGeometry(
  pts: LegacyShapePoint[],
  plotRight: number,
): PitchforkGeometry | null {
  if (!pts || pts.length < 3) return null;

  const apex = pts[0];
  const baseA = pts[1];
  const baseB = pts[2];
  const mid = {
    x: (baseA.x + baseB.x) / 2,
    y: (baseA.y + baseB.y) / 2,
    index: (baseA.index + baseB.index) / 2,
    value: (baseA.value + baseB.value) / 2,
  } as LegacyShapePoint;
  const medianDirection = calcLine(apex, mid);
  const forwardSign = resolveForwardSign(apex, medianDirection, mid);

  return {
    prongs: [
      extendProngForward(apex, medianDirection, forwardSign, plotRight),
      extendProngForward(baseA, medianDirection, forwardSign, plotRight),
      extendProngForward(baseB, medianDirection, forwardSign, plotRight),
    ],
    baseline: {
      x0: baseA.x,
      y0: baseA.y,
      x1: baseB.x,
      y1: baseB.y,
    },
    pivotToBaseA: {
      x0: apex.x,
      y0: apex.y,
      x1: baseA.x,
      y1: baseA.y,
    },
  };
}

function drawSegment(ctx: CanvasRenderingContext2D, segment: PitchforkSegment): void {
  ctx.moveTo(segment.x0, segment.y0);
  ctx.lineTo(segment.x1, segment.y1);
}

function hitSegment(x: number, y: number, segment: PitchforkSegment, tolerance: number): boolean {
  const nearest = getLinePointNearestMouse(
    { x0: segment.x0, y0: segment.y0, x1: segment.x1, y1: segment.y1 },
    x,
    y,
  );
  return pointsDistance({ x, y }, nearest) < tolerance;
}

function PitchforkObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const plotRight = panel._width - valueAxisWidth;
    const geometry = resolvePitchforkGeometry(pts, plotRight);
    if (!geometry) return;

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.strokeStyle = color;
    ctx.lineWidth = o.width;

    ctx.beginPath();
    ctx.setLineDash(CONSTRUCTION_DASH);
    drawSegment(ctx, geometry.pivotToBaseA);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([]);
    drawSegment(ctx, geometry.baseline);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash(o.dash ? o.dash : []);
    for (const prong of geometry.prongs) {
      drawSegment(ctx, prong);
    }
    ctx.stroke();
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const plotRight = panel._width - valueAxisWidth;
    const geometry = resolvePitchforkGeometry(pts, plotRight);
    if (!geometry) return false;

    let hitResult = false;
    this.clearHits(o);

    if (!between(0, x, plotRight, this.hitTolerance)) {
      return false;
    }

    const segments = [geometry.pivotToBaseA, geometry.baseline, ...geometry.prongs];
    for (const segment of segments) {
      if (hitSegment(x, y, segment, this.hitTolerance)) {
        hitResult = true;
        break;
      }
    }

    if (hitResult) {
      o._hit = true;
      const anchor = findAnchorPointForXY(pts, x, y, this.hitTolerance);
      if (anchor) {
        o._hitAnchor = { x: anchor.x, y: anchor.y };
      }
      drawAnchors(interactor.octx, panel, pts, this.anchorPointSize, this.anchorColor, 0.5);
    }

    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const PitchforkObjectCtor: import("./_sharedTypes").ShapeConstructor =
  PitchforkObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { PitchforkObjectCtor as PitchforkObject };
