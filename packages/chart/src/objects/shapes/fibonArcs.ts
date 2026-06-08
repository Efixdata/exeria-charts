import WEBRCP from "../../WebRCP";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
  drawAnchors,
} from "../../utils/objects-lib";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import { Shape } from "../../objectRuntimeBases";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import {
  FIBON_ARCS_DEFAULT_VALUES,
  FIBON_ARCS_DEFAULT_VALUES_STATE,
  fillFibArcBand,
  isPointNearFibArc,
  resolveFibArcLabelPoint,
  resolveFibonArcsGeometry,
  strokeFibArc,
} from "./fibonArcsBase";
import type { ShapeHitArgs, ShapeInteractionArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function FibonArcsObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const arcsObject = o as LegacyValueLevelsShapeObject;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 2) {
      return;
    }

    const values = Array.isArray(arcsObject.values) ? arcsObject.values : FIBON_ARCS_DEFAULT_VALUES;
    const valuesState = Array.isArray(arcsObject.valuesState)
      ? arcsObject.valuesState
      : FIBON_ARCS_DEFAULT_VALUES_STATE;
    const geometry = resolveFibonArcsGeometry(points, values, valuesState);
    if (!geometry) {
      return;
    }

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    const lineWidth = typeof o.width === "number" ? o.width : 1;
    const dash = Array.isArray(o.dash) ? o.dash : [];

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.font = this.defaultFont;

    if (o.fillBg === true && geometry.levels.length > 1) {
      for (let index = 0; index < geometry.levels.length - 1; index += 1) {
        ctx.globalAlpha = 0.05 + (index % 2) * 0.03;
        fillFibArcBand(ctx, geometry.levels[index + 1], geometry.levels[index]);
      }
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracementLine");
    ctx.moveTo(geometry.trendLine.x0, geometry.trendLine.y0);
    ctx.lineTo(geometry.trendLine.x1, geometry.trendLine.y1);
    ctx.stroke();
    ctx.strokeStyle = color;

    for (const arc of geometry.levels) {
      strokeFibArc(ctx, arc);

      const labelPoint = resolveFibArcLabelPoint(arc);
      ctx.fillText(`${arc.level}%`, labelPoint.x + 4, labelPoint.y - 4);
    }

    ctx.setLineDash([]);
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const arcsObject = o as LegacyValueLevelsShapeObject;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 2) {
      return false;
    }

    const values = Array.isArray(arcsObject.values) ? arcsObject.values : FIBON_ARCS_DEFAULT_VALUES;
    const valuesState = Array.isArray(arcsObject.valuesState)
      ? arcsObject.valuesState
      : FIBON_ARCS_DEFAULT_VALUES_STATE;
    const geometry = resolveFibonArcsGeometry(points, values, valuesState);

    this.clearHits(o);
    if (!geometry) {
      return false;
    }

    let hitResult = false;
    const minX = Math.min(points[0].x, points[1].x);
    const maxX = Math.max(points[0].x, points[1].x);

    if (between(minX, x, maxX, this.hitTolerance)) {
      const nearest = getLinePointNearestMouse(geometry.trendLine, x, y);
      if (pointsDistance({ x, y }, nearest) < this.hitTolerance) {
        hitResult = true;
      }

      if (!hitResult) {
        for (const arc of geometry.levels) {
          if (isPointNearFibArc(x, y, arc, this.hitTolerance)) {
            hitResult = true;
            break;
          }
        }
      }

      if (hitResult) {
        o._hit = true;
        const anchor = findAnchorPointForXY(points, x, y, this.hitTolerance);
        if (anchor) {
          o._hitAnchor = { x: anchor.x, y: anchor.y };
        }
        drawAnchors(interactor.octx, panel, points, this.anchorPointSize, this.anchorColor, 0.5);
      }
    }

    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
  this.mouseUp = function (
    ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
  ) {
    Shape.prototype.mouseUp.call(this, event, object, renderer, interactor, model, panel, seriesManager);
  };
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = function () {};
}

const FibonArcsObjectCtor: import("./_sharedTypes").ShapeConstructor =
  FibonArcsObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { FibonArcsObjectCtor as FibonArcsObject };

export {
  FIBON_ARCS_DEFAULT_VALUES,
  FIBON_ARCS_DEFAULT_VALUES_STATE,
} from "./fibonArcsBase";
