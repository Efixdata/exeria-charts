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
  FIBON_CIRCLES_DEFAULT_VALUES,
  FIBON_CIRCLES_DEFAULT_VALUES_STATE,
  fillFibCircleBand,
  isPointNearFibCircle,
  resolveFibonCirclesGeometry,
} from "./fibonCirclesBase";
import type { ShapeHitArgs, ShapeInteractionArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function FibonCirclesObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const circlesObject = o as LegacyValueLevelsShapeObject;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 2) {
      return;
    }

    const values = Array.isArray(circlesObject.values)
      ? circlesObject.values
      : FIBON_CIRCLES_DEFAULT_VALUES;
    const valuesState = Array.isArray(circlesObject.valuesState)
      ? circlesObject.valuesState
      : FIBON_CIRCLES_DEFAULT_VALUES_STATE;
    const geometry = resolveFibonCirclesGeometry(points, values, valuesState);
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
        fillFibCircleBand(ctx, geometry.levels[index + 1], geometry.levels[index]);
      }
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracementLine");
    ctx.moveTo(geometry.trendLine.x0, geometry.trendLine.y0);
    ctx.lineTo(geometry.trendLine.x1, geometry.trendLine.y1);
    ctx.stroke();
    ctx.strokeStyle = color;

    for (const circle of geometry.levels) {
      ctx.beginPath();
      ctx.arc(circle.centerX, circle.centerY, Math.max(circle.radius, 0.5), 0, Math.PI * 2);
      ctx.stroke();

      const labelX = circle.centerX + circle.radius + 4;
      const labelY = circle.centerY - 4;
      ctx.fillText(`${circle.level}%`, labelX, labelY);
    }

    ctx.setLineDash([]);
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const circlesObject = o as LegacyValueLevelsShapeObject;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 2) {
      return false;
    }

    const values = Array.isArray(circlesObject.values) ? circlesObject.values : FIBON_CIRCLES_DEFAULT_VALUES;
    const valuesState = Array.isArray(circlesObject.valuesState)
      ? circlesObject.valuesState
      : FIBON_CIRCLES_DEFAULT_VALUES_STATE;
    const geometry = resolveFibonCirclesGeometry(points, values, valuesState);

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
        for (const circle of geometry.levels) {
          if (isPointNearFibCircle(x, y, circle, this.hitTolerance)) {
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

const FibonCirclesObjectCtor: import("./_sharedTypes").ShapeConstructor =
  FibonCirclesObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { FibonCirclesObjectCtor as FibonCirclesObject };

export {
  FIBON_CIRCLES_DEFAULT_VALUES,
  FIBON_CIRCLES_DEFAULT_VALUES_STATE,
} from "./fibonCirclesBase";
