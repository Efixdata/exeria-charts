import WEBRCP from "../../WebRCP";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  drawAnchor,
  drawAnchors,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import {
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import { resolveShapeOpacity } from "../../shapeStyle";
import {
  REGRESSION_CHANNEL_DEFAULT_VALUES,
  REGRESSION_CHANNEL_DEFAULT_VALUES_STATE,
  formatRegressionDeviationLabel,
  pickRegressionChannelAnchorIndex,
  resolveRegressionChannelAnchorHitTolerance,
  resolveRegressionChannelGeometry,
  snapRegressionChannelAnchorsToCenterLine,
} from "./regressionChannelBase";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function RegressionChannelObject(this: ShapeRuntime) {
  this.getPoints = function (object, renderer, panel, model, seriesManager) {
    const basePoints = Shape.prototype.getPoints.call(
      this,
      object,
      renderer,
      panel,
      model,
      seriesManager,
    );
    if (!panel) {
      return basePoints;
    }

    const geometry = resolveRegressionChannelGeometry(
      object as LegacyValueLevelsShapeObject,
      renderer,
      model,
      panel,
      seriesManager,
    );

    return snapRegressionChannelAnchorsToCenterLine(basePoints, geometry);
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const channelObject = o as LegacyValueLevelsShapeObject;
    const geometry = resolveRegressionChannelGeometry(
      channelObject,
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

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.font = this.defaultFont;
    ctx.globalAlpha = opacity;

    if (o.fillBg === true && geometry.segments.length > 1) {
      for (let index = 0; index < geometry.segments.length - 1; index += 1) {
        const upper = geometry.segments[index + 1];
        const lower = geometry.segments[index];
        ctx.beginPath();
        ctx.globalAlpha = opacity * (0.05 + (index % 2) * 0.03);
        ctx.moveTo(lower.x0, lower.y0);
        ctx.lineTo(lower.x1, lower.y1);
        ctx.lineTo(upper.x1, upper.y1);
        ctx.lineTo(upper.x0, upper.y0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = opacity;
    }

    for (const segment of geometry.segments) {
      ctx.setLineDash(segment.deviation === 0 ? dash : dash.length ? dash : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(segment.x0, segment.y0);
      ctx.lineTo(segment.x1, segment.y1);
      ctx.stroke();

      const labelX = Math.min(segment.x0, segment.x1) + 4;
      const labelY = Math.min(segment.y0, segment.y1) - 4;
      ctx.fillText(formatRegressionDeviationLabel(segment.deviation), labelX, labelY);
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = opacity * 0.85;
    ctx.fillText(
      `R ${Math.abs(geometry.pearsonR).toFixed(2)}`,
      Math.max(geometry.segments[0].x0, geometry.segments[0].x1) - 36,
      Math.min(...geometry.segments.map((segment) => Math.min(segment.y0, segment.y1))) - 6,
    );
    ctx.globalAlpha = 1;
  };

  this.renderOverlay = function (
    ...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs
  ) {
    if (!panel || (!o.selected && !o._hit)) {
      return;
    }

    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts.length) {
      return;
    }

    const anchorStroke =
      WEBRCP.utils.colorManager.getColor("accent", this.anchorColor) ?? this.anchorColor;
    const anchorHover =
      WEBRCP.utils.colorManager.getColor("chartZeroColor", this.anchorColorHover) ??
      this.anchorColorHover;
    const plotRight =
      panel._width -
      (typeof renderer.getPriceRenderingOptions === "function"
        ? renderer.getPriceRenderingOptions().valueAxisWidth
        : 0);
    const anchorRadius = Math.max(this.anchorPointSize + 2, this.hitTolerance - 1);
    const anchorOptions = { plotRight, strokeColor: anchorStroke, hollow: true };

    if (o._hitAnchor) {
      for (const point of pts) {
        if (point.x === o._hitAnchor.x && point.y === o._hitAnchor.y) {
          drawAnchor(octx, panel, point, anchorRadius + 2, anchorHover, 1, anchorOptions);
        }
      }
    }

    drawAnchors(octx, panel, pts, anchorRadius, anchorStroke, 1, anchorOptions);
  };

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const channelObject = o as LegacyValueLevelsShapeObject;
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const geometry = resolveRegressionChannelGeometry(
      channelObject,
      renderer,
      model,
      panel,
      seriesManager,
    );

    this.clearHits(o);
    if (!geometry || !pts.length) {
      return false;
    }

    const anchorTolerance = resolveRegressionChannelAnchorHitTolerance(
      this.hitTolerance,
      this.anchorPointSize,
      o.selected === true,
    );
    const anchorIndex = pickRegressionChannelAnchorIndex(x, y, pts, anchorTolerance);
    if (anchorIndex != null) {
      o._hit = true;
      o._hitAnchor = { x: pts[anchorIndex].x, y: pts[anchorIndex].y };
      drawAnchors(
        interactor.octx,
        panel,
        pts,
        Math.max(this.anchorPointSize + 2, this.hitTolerance - 1),
        this.anchorColor,
        0.5,
      );
      return true;
    }

    const tolerance = Math.max(this.hitTolerance, (typeof o.width === "number" ? o.width : 1) + 2);

    for (const segment of geometry.segments) {
      if (
        !between(Math.min(segment.x0, segment.x1), x, Math.max(segment.x0, segment.x1), tolerance)
      ) {
        continue;
      }

      const nearest = getLinePointNearestMouse(
        { x0: segment.x0, y0: segment.y0, x1: segment.x1, y1: segment.y1 },
        x,
        y,
      );

      if (pointsDistance({ x, y }, nearest) < tolerance) {
        o._hit = true;
        return true;
      }
    }

    return false;
  };

  this.mouseDown = function (
    ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
  ) {
    interactor.pushPanel(this, object, panel);
    this.wasDrag = false;

    const points = this.getPoints(object, renderer, panel, model, seriesManager);
    if (!points.length) {
      return this.createAnchorSelection(object, null);
    }

    const eventOffset = event._offset ?? { offsetX: 0, offsetY: 0 };
    const anchorTolerance = resolveRegressionChannelAnchorHitTolerance(
      this.hitTolerance,
      this.anchorPointSize,
      object.selected === true,
    );
    const anchorIndex = pickRegressionChannelAnchorIndex(
      eventOffset.offsetX,
      eventOffset.offsetY,
      points,
      anchorTolerance,
    );

    if (anchorIndex != null) {
      return this.createAnchorSelection(object, anchorIndex);
    }

    return this.createAnchorSelection(object, null);
  };

  this.mouseUp = createShapeMouseUpExpandableDelegate();
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const RegressionChannelObjectCtor: import("./_sharedTypes").ShapeConstructor =
  RegressionChannelObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { RegressionChannelObjectCtor as RegressionChannelObject };

export {
  REGRESSION_CHANNEL_DEFAULT_VALUES,
  REGRESSION_CHANNEL_DEFAULT_VALUES_STATE,
} from "./regressionChannelBase";
