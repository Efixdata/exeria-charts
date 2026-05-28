import WEBRCP from "../../WebRCP";
import { isDrawingSnapEnabled } from "../../drawingWorkflow";
import LIB from "../../utils/chartingCommons";
import type { LegacyAnchor, LegacyShapeObject } from "../../objectRuntimeBases";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
} from "./_delegates";
import { resolveShapeOpacity } from "../../shapeStyle";
import type { CoreInteractor } from "../../internal-types/interactor";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

/** Minimum screen distance between stored brush samples (decimation). */
const BRUSH_SAMPLE_DISTANCE_PX = 4;

function createAnchorFromEvent(
  runtime: ShapeRuntime,
  event: { _offset: { offsetX: number; offsetY: number } },
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  interactor: CoreInteractor,
  model: ShapeRenderArgs[3],
  panel: ShapeRenderArgs[4],
  seriesManager: ShapeRenderArgs[5],
): LegacyAnchor {
  const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
  const index = renderer.getPointIndex(event._offset.offsetX, model);
  const yValue = event._offset.offsetY - panel._offset;
  const value = isDrawingSnapEnabled(object, interactor)
    ? runtime.stickToCandleValue(
        yValue,
        runtime.getCurrentCandles(index, model, seriesManager),
        panel,
        renderer,
        referenceValue,
      )
    : renderer.getPriceForYCoordinate(yValue, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV: referenceValue,
      });

  return {
    stamp: renderer.getIndexStamp(index, model, seriesManager),
    referenceStamp: 0,
    offset: 0,
    value: LIB.round(value, renderer.getPrecision(model, panel)),
    _index: index,
  };
}

function getAnchorPixel(
  anchor: LegacyAnchor,
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  panel: ShapeRenderArgs[4],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
): { x: number; y: number } {
  const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
  return {
    x: renderer.getIndexPoint(anchor._index, model) + model._midOffset,
    y:
      renderer.getYCoordinateForPrice(anchor.value, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV: referenceValue,
      }) + panel._offset,
  };
}

function appendBrushSample(
  runtime: ShapeRuntime,
  object: LegacyShapeObject,
  anchor: LegacyAnchor,
  renderer: ShapeRenderArgs[2],
  panel: ShapeRenderArgs[4],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
): void {
  if (object.anchors.length === 0) {
    object.anchors.push(anchor);
    return;
  }

  const currentPixel = getAnchorPixel(anchor, object, renderer, panel, model, seriesManager);
  const lastPixel = getAnchorPixel(
    object.anchors[object.anchors.length - 1],
    object,
    renderer,
    panel,
    model,
    seriesManager,
  );

  if (
    object.anchors.length === 1 &&
    pointsDistance(lastPixel, currentPixel) < BRUSH_SAMPLE_DISTANCE_PX
  ) {
    object.anchors[0] = anchor;
    return;
  }

  if (pointsDistance(lastPixel, currentPixel) >= BRUSH_SAMPLE_DISTANCE_PX) {
    object.anchors.push(anchor);
    return;
  }

  object.anchors[object.anchors.length - 1] = anchor;
}

function resolveBrushBackgroundColor(object: LegacyShapeObject): string {
  const backgroundColor = (object as { backgroundColor?: unknown }).backgroundColor;
  if (typeof backgroundColor === "string" && backgroundColor.length > 0) {
    if (backgroundColor.includes("#") || backgroundColor.toLowerCase().includes("rgb")) {
      return backgroundColor;
    }
    return WEBRCP.utils.colorManager.getColor(backgroundColor, backgroundColor);
  }

  return object.color
    ? object.color.includes("#") || object.color.toLowerCase().includes("rgb")
      ? object.color
      : WEBRCP.utils.colorManager.getColor(object.color, object.color)
    : WEBRCP.utils.colorManager.getColor("defaultToolColor");
}

function resolveBrushBackgroundOpacity(object: LegacyShapeObject): number {
  const raw = (object as { backgroundOpacity?: unknown }).backgroundOpacity;
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(parsed)) {
    return 0.25;
  }
  return Math.min(1, Math.max(0, parsed));
}

function traceBrushPath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  closePath: boolean,
): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  if (closePath) {
    ctx.closePath();
  }
}

function isPointInPolygon(
  x: number,
  y: number,
  points: Array<{ x: number; y: number }>,
): boolean {
  let inside = false;

  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const current = points[index];
    const prior = points[previous];
    const intersects =
      current.y > y !== prior.y > y &&
      x < ((prior.x - current.x) * (y - current.y)) / (prior.y - current.y) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function BrushObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts || pts.length < 2) {
      return;
    }

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    const lineWidth = typeof o.width === "number" ? o.width : 2;
    const lineOpacity = resolveShapeOpacity(o);

    if (o.fillBg === true && pts.length >= 3) {
      traceBrushPath(ctx, pts, true);
      ctx.fillStyle = resolveBrushBackgroundColor(o);
      ctx.globalAlpha = resolveBrushBackgroundOpacity(o);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(Array.isArray(o.dash) ? o.dash : []);
    ctx.globalAlpha = lineOpacity;
    traceBrushPath(ctx, pts, false);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    this.clearHits(o);

    if (!pts || pts.length < 2) {
      return false;
    }

    const tolerance = Math.max(this.hitTolerance, (typeof o.width === "number" ? o.width : 2) / 2 + 2);

    if (o.fillBg === true && pts.length >= 3 && isPointInPolygon(x, y, pts)) {
      o._hit = true;
      const anchor = findAnchorPointForXY(pts, x, y, this.hitTolerance);
      if (anchor) {
        o._hitAnchor = { x: anchor.x, y: anchor.y };
      }
      return true;
    }

    for (let index = 1; index < pts.length; index += 1) {
      const segmentStart = pts[index - 1];
      const segmentEnd = pts[index];
      const withinXSpan =
        between(segmentStart.x, x, segmentEnd.x, tolerance) ||
        between(segmentEnd.x, x, segmentStart.x, tolerance);
      const withinYSpan =
        between(segmentStart.y, y, segmentEnd.y, tolerance) ||
        between(segmentEnd.y, y, segmentStart.y, tolerance);

      if (!withinXSpan && !withinYSpan) {
        continue;
      }

      const nearest = getLinePointNearestMouse(
        {
          x0: segmentStart.x,
          y0: segmentStart.y,
          x1: segmentEnd.x,
          y1: segmentEnd.y,
        },
        x,
        y,
      );

      if (pointsDistance({ x, y }, nearest) < tolerance) {
        o._hit = true;
        const anchor = findAnchorPointForXY(pts, x, y, this.hitTolerance);
        if (anchor) {
          o._hitAnchor = { x: anchor.x, y: anchor.y };
        }
        return true;
      }
    }

    return false;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");

  this.stageDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    o.anchors = [createAnchorFromEvent(this, e, o, renderer, interactor, model, panel, seriesManager)];

    return {
      selected: 1,
      anchors: this.cloneAnchors(o.anchors),
    };
  };

  this.stageMove = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    if (!interactor.currentAnchor || o.anchors.length === 0) {
      return;
    }

    const anchor = createAnchorFromEvent(this, e, o, renderer, interactor, model, panel, seriesManager);
    appendBrushSample(this, o, anchor, renderer, panel, model, seriesManager);
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    const xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;

    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
    }

    this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
  };

  this.stageUp = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    if (!interactor.currentAnchor?.drag) {
      return false;
    }

    if (o.anchors.length < 2) {
      appendBrushSample(
        this,
        o,
        createAnchorFromEvent(this, e, o, renderer, interactor, model, panel, seriesManager),
        renderer,
        panel,
        model,
        seriesManager,
      );
    }

    if (o.anchors.length < 2) {
      return false;
    }

    interactor.currentAnchor = null;
    return true;
  };

  this.stageOut = function () {};
}

const BrushObjectCtor: import("./_sharedTypes").ShapeConstructor =
  BrushObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { BrushObjectCtor as BrushObject };
