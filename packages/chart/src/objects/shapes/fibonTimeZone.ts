import WEBRCP from "../../WebRCP";
import {
  between,
  findAnchorPointForXY,
  drawAnchors,
} from "../../utils/objects-lib";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import {
  resolveFibonTimeZoneLines,
} from "./fibonTimeZoneBase";
import type { ShapeHitArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function FibonTimeZoneObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const timeZoneObject = o as LegacyValueLevelsShapeObject;
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const lines = resolveFibonTimeZoneLines(timeZoneObject, pts, renderer, model);
    if (lines.length === 0 || !panel) {
      return;
    }

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    const panelTop = panel._offset;
    const panelBottom = panel._offset + panel._height;
    const lineWidth = typeof o.width === "number" ? o.width : 1;
    const dash = Array.isArray(o.dash) ? o.dash : [];

    if (lines.length > 1) {
      ctx.fillStyle = color;
      for (let index = 0; index < lines.length - 1; index += 1) {
        const left = lines[index].x;
        const right = lines[index + 1].x;
        ctx.globalAlpha = 0.06 + (index % 2) * 0.02;
        ctx.fillRect(Math.min(left, right), panelTop, Math.abs(right - left), panel._height);
      }
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.font = this.defaultFont;

    for (const line of lines) {
      ctx.beginPath();
      ctx.moveTo(line.x, panelTop);
      ctx.lineTo(line.x, panelBottom);
      ctx.stroke();
      ctx.fillText(line.label, line.x + 4, panelTop + 12);
    }

    if (pts.length >= 2) {
      ctx.setLineDash([4, 4]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, panelTop + 16);
      ctx.lineTo(pts[1].x, panelTop + 16);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const timeZoneObject = o as LegacyValueLevelsShapeObject;
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const lines = resolveFibonTimeZoneLines(timeZoneObject, pts, renderer, model);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const plotRight = panel._width - valueAxisWidth;

    this.clearHits(o);
    if (!between(0, x, plotRight, this.hitTolerance)) {
      return false;
    }

    let hitResult = false;
    for (const line of lines) {
      if (between(line.x - this.hitTolerance, x, line.x + this.hitTolerance, 0)) {
        hitResult = true;
        break;
      }
    }

    if (!hitResult && pts.length >= 2) {
      const topY = panel._offset + 16;
      if (
        between(Math.min(pts[0].x, pts[1].x), x, Math.max(pts[0].x, pts[1].x), this.hitTolerance) &&
        between(topY - this.hitTolerance, y, topY + this.hitTolerance, 0)
      ) {
        hitResult = true;
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

const FibonTimeZoneObjectCtor: import("./_sharedTypes").ShapeConstructor =
  FibonTimeZoneObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { FibonTimeZoneObjectCtor as FibonTimeZoneObject };

export {
  FIBON_TIME_ZONE_DEFAULT_VALUES,
  FIBON_TIME_ZONE_DEFAULT_VALUES_STATE,
} from "./fibonTimeZoneBase";
