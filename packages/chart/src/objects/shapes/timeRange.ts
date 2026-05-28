import WEBRCP from "../../WebRCP";
import {
  between,
  drawAnchor,
  drawAnchors,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject, LegacyShapePoint } from "../../objectRuntimeBases";
import { resolveShapeOpacity } from "../../shapeStyle";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

const BOTTOM_BAR_HEIGHT = 22;

type TimeSpan = {
  startStamp: number;
  endStamp: number;
};

function hasAnchorTimeSpan(object: LegacyShapeObject): boolean {
  const anchors = object.anchors;
  if (!Array.isArray(anchors) || anchors.length < 2) {
    return false;
  }

  const firstStamp = anchors[0]?.stamp;
  const secondStamp = anchors[1]?.stamp;
  return typeof firstStamp === "number" && firstStamp > 0 && typeof secondStamp === "number" && secondStamp > 0;
}

export function formatTimeRangePeriodLabel(
  startStamp: number,
  endStamp: number,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
): string {
  const mainSeries = seriesManager[model.mainSeries];
  const index1 = renderer.getStampIndex(startStamp, model, seriesManager);
  const index2 = renderer.getStampIndex(endStamp, model, seriesManager);
  const periodCount = Math.abs(index2 - index1);

  if (!mainSeries.data?.length || index1 < 0) {
    return `${periodCount} periods`;
  }

  if (index2 >= mainSeries.data.length) {
    return `${periodCount} periods`;
  }

  let delta = Math.abs(endStamp - startStamp) / 1000;
  const days = Math.floor(delta / 86400);
  delta -= days * 86400;
  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;
  const minutes = Math.floor(delta / 60) % 60;

  return `${days}d : ${hours}h : ${minutes}m ${periodCount} periods`;
}

function syncTimeFieldsFromAnchors(
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
): void {
  if (!hasAnchorTimeSpan(object)) {
    return;
  }

  const mainSeries = seriesManager[model.mainSeries];
  const interval = mainSeries.interval.milis;
  const startStamp = Math.min(object.anchors[0].stamp, object.anchors[1].stamp);
  const endStamp = Math.max(object.anchors[0].stamp, object.anchors[1].stamp);

  object.startTime = startStamp;
  object.timeRange = Math.max(endStamp - startStamp, interval);

  if (object._textManual !== true) {
    object.text = formatTimeRangePeriodLabel(startStamp, endStamp, renderer, model, seriesManager);
  }
}

function resolveTimeSpan(
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
): TimeSpan | null {
  const mainSeries = seriesManager[model.mainSeries];
  const interval = mainSeries.interval.milis;

  if (hasAnchorTimeSpan(object)) {
    const startStamp = Math.min(object.anchors[0].stamp, object.anchors[1].stamp);
    let endStamp = Math.max(object.anchors[0].stamp, object.anchors[1].stamp);
    if (endStamp <= startStamp) {
      endStamp = startStamp + interval * 3;
    }
    return { startStamp, endStamp };
  }

  if (object.startTime === "now" && typeof object.timeRange === "number") {
    const now = Date.now();
    return { startStamp: now, endStamp: now + object.timeRange };
  }

  if (typeof object.startTime === "number" && object.startTime > 0 && typeof object.timeRange === "number") {
    return {
      startStamp: object.startTime,
      endStamp: object.startTime + Math.max(object.timeRange, interval),
    };
  }

  return null;
}

function stampFromEventX(
  event: ShapeInteractionArgs[0],
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
): { index: number; stamp: number } {
  const index = renderer.getPointIndex(event._offset.offsetX, model);
  return {
    index,
    stamp: renderer.getIndexStamp(index, model, seriesManager),
  };
}

function getBottomBarAnchorY(panel: ShapeRenderArgs[4]): number {
  return panel._offset + panel._height - BOTTOM_BAR_HEIGHT / 2;
}

function resolveToolColor(color: string | undefined): string {
  return WEBRCP.utils.colorManager.getColor(color ? color : "defaultToolColor");
}

function pickEdgeAnchorIndex(
  x: number,
  y: number,
  pts: LegacyShapePoint[],
  panel: ShapeRenderArgs[4],
  tolerance: number,
): number | null {
  const edgeTolerance = Math.max(tolerance, 10);
  let bestIndex: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  if (
    !between(panel._offset, y, panel._offset + panel._height, edgeTolerance)
  ) {
    return null;
  }

  for (let i = 0; i < pts.length; i += 1) {
    const distance = Math.abs(x - pts[i].x);
    if (distance <= edgeTolerance && distance < bestDistance) {
      bestIndex = i;
      bestDistance = distance;
    }
  }

  return bestIndex;
}

function resolveDisplayText(
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
  span: TimeSpan,
): string {
  if (typeof object.text === "string" && object.text.length > 0) {
    return object.text;
  }

  return formatTimeRangePeriodLabel(span.startStamp, span.endStamp, renderer, model, seriesManager);
}

function TimeRangeObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts.length) {
      return;
    }

    const span = resolveTimeSpan(o, renderer, model, seriesManager);
    if (!span) {
      return;
    }

    const left = Math.min(pts[0].x, pts[1].x);
    const right = Math.max(pts[0].x, pts[1].x);
    const width = Math.max(right - left, 1);
    const bottomBarTop = panel._offset + panel._height - BOTTOM_BAR_HEIGHT;
    const text = resolveDisplayText(o, renderer, model, seriesManager, span);
    const opacity = resolveShapeOpacity(o);
    const baseColor = resolveToolColor(o.color);
    const labelColor = WEBRCP.utils.getContrastColor(baseColor);

    ctx.save();
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.globalAlpha = opacity;

    if (o.secondaryColor) {
      ctx.fillStyle = o.secondaryColor;
    } else {
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = opacity * 0.1;
    }

    ctx.fillRect(left, panel._offset, width, panel._height - BOTTOM_BAR_HEIGHT);

    ctx.globalAlpha = opacity;
    ctx.fillStyle = baseColor;
    ctx.fillRect(left, bottomBarTop, width, BOTTOM_BAR_HEIGHT);

    ctx.font = WEBRCP.utils.colorManager.getFont("time");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = labelColor;
    ctx.fillText(text, left + width / 2, bottomBarTop + BOTTOM_BAR_HEIGHT / 2);

    ctx.restore();
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    if (o.editable === false) return;
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts.length) {
      return;
    }

    if (o._hit || o.selected) {
      octx.save();
      octx.setLineDash([2, 5]);
      octx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      octx.beginPath();
      octx.moveTo(pts[0].x, panel._offset);
      octx.lineTo(pts[0].x, panel._height + panel._offset);
      octx.moveTo(pts[1].x, panel._offset);
      octx.lineTo(pts[1].x, panel._height + panel._offset);
      octx.stroke();
      octx.closePath();
      octx.restore();
    }

    if (o._hitAnchor) {
      for (const point of pts) {
        if (point.x === o._hitAnchor.x && point.y === o._hitAnchor.y) {
          drawAnchor(octx, panel, point, this.hitTolerance, this.anchorColorHover, 0.5);
        }
      }
    }

    if (o._hit || o.selected) {
      drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    if (o.editable === false) return false;

    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts.length) {
      return false;
    }

    this.clearHits(o);

    const edgeIndex = pickEdgeAnchorIndex(x, y, pts, panel, this.hitTolerance);
    if (edgeIndex != null) {
      o._hit = true;
      o._hitAnchor = { x: pts[edgeIndex].x, y: pts[edgeIndex].y };
      return true;
    }

    const left = Math.min(pts[0].x, pts[1].x);
    const right = Math.max(pts[0].x, pts[1].x);
    if (
      between(left, x, right, this.hitTolerance) &&
      between(panel._offset, y, panel._offset + panel._height, this.hitTolerance)
    ) {
      o._hit = true;
      return true;
    }

    return false;
  };

  this.mouseDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    if (o.editable === false) {
      return this.createAnchorSelection(o, null);
    }

    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts.length) {
      return this.createAnchorSelection(o, null);
    }

    interactor.pushPanel(this, o, panel);

    const edgeIndex = pickEdgeAnchorIndex(
      e._offset.offsetX,
      e._offset.offsetY,
      pts,
      panel,
      this.hitTolerance,
    );
    if (edgeIndex != null) {
      return this.createAnchorSelection(o, edgeIndex);
    }

    return this.createAnchorSelection(o, null);
  };

  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    if (o.editable === false) return;

    const idx = interactor.currentAnchor.selected;
    const baseAnchors = interactor.currentAnchor.anchors;
    const xOffset =
      renderer.getPointIndex(e._offset.offsetX, model) -
      renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);

    if (idx !== null && idx !== undefined) {
      const index = renderer.getStampIndex(baseAnchors[idx].stamp, model, seriesManager) + xOffset;
      o.anchors[idx]._index = index;
      o.anchors[idx].stamp = renderer.getIndexStamp(o.anchors[idx]._index, model, seriesManager);
    } else {
      for (let i = 0; i < o.anchors.length; i += 1) {
        const index = renderer.getStampIndex(baseAnchors[i].stamp, model, seriesManager) + xOffset;
        o.anchors[i]._index = index;
        o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
      }
    }

    syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
  };

  this.push = function (o, renderer, model, seriesManager) {
    syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
    Shape.prototype.push.call(this, o, renderer, model, seriesManager);
  };

  this.stageDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    if (o.editable === false) return this.createAnchorSelection(o, null);

    const { index, stamp } = stampFromEventX(e, renderer, model, seriesManager);
    const interval = seriesManager[model.mainSeries].interval.milis;

    if (!interactor.currentAnchor) {
      o.anchors[0].stamp = stamp;
      o.anchors[0]._index = index;
      o.anchors[0].value = 0;
      o.anchors[1].stamp = stamp + interval * 3;
      o.anchors[1]._index = renderer.getStampIndex(o.anchors[1].stamp, model, seriesManager);
      o.anchors[1].value = 0;
      syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
      return this.createAnchorSelection(o, 1);
    }

    interactor.pushPanel(this, o, panel);
    const anchorIndex = interactor.currentAnchor.selected ?? 0;
    if (anchorIndex < o.anchors.length) {
      o.anchors[anchorIndex].stamp = stamp;
      o.anchors[anchorIndex]._index = index;
      o.anchors[anchorIndex].value = 0;
    }
    syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
    return this.createAnchorSelection(o, anchorIndex + 1);
  };

  this.stageMove = function (...[e, o, renderer, interactor, model, , seriesManager]: ShapeInteractionArgs) {
    if (o.editable === false || !interactor.currentAnchor) return;

    const selected = interactor.currentAnchor.selected;
    if (selected == null || selected < 1 || o.anchors.length < 2) {
      return;
    }

    const { index, stamp } = stampFromEventX(e, renderer, model, seriesManager);
    o.anchors[1].stamp = stamp;
    o.anchors[1]._index = index;
    syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, , seriesManager]: ShapeInteractionArgs) {
    if (o.editable === false) return;

    const xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;

    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
    }

    if (!interactor.currentAnchor) {
      return;
    }

    const selected = interactor.currentAnchor.selected ?? 1;
    const anchorIndex = selected <= 1 ? 1 : Math.min(selected - 1, o.anchors.length - 1);
    const { index, stamp } = stampFromEventX(e, renderer, model, seriesManager);
    if (anchorIndex < o.anchors.length) {
      o.anchors[anchorIndex].stamp = stamp;
      o.anchors[anchorIndex]._index = index;
      syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
    }
  };

  this.stageUp = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    if (o.editable === false) return;
    syncTimeFieldsFromAnchors(o, renderer, model, seriesManager);
    return Shape.prototype.stageUp.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );
  };

  this.stageOut = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    if (o.editable === false) return;
    return Shape.prototype.stageOut.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );
  };

  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    if (!panel) return [];

    const span = resolveTimeSpan(o, renderer, model, seriesManager);
    if (!span) {
      return [];
    }

    const anchorY = getBottomBarAnchorY(panel);
    const pts: LegacyShapePoint[] = [];

    if (hasAnchorTimeSpan(o)) {
      for (let i = 0; i < 2; i += 1) {
        const stamp = o.anchors[i].stamp;
        pts[i] = {
          x: Math.floor(renderer.getStampPoint(stamp, model, seriesManager) + model.periodWidth / 2),
          y: anchorY,
          index: renderer.getStampIndex(stamp, model, seriesManager),
          stamp,
          value: 0,
        };
      }
      return pts;
    }

    if (o.startTime === "now") {
      const lastIndex = seriesManager[model.mainSeries].data.length - 1;
      pts[0] = {
        x: Math.floor(renderer.getIndexPoint(lastIndex, model) + model.periodWidth / 2),
        y: anchorY,
        index: lastIndex,
        stamp: span.startStamp,
        value: 0,
      };
    } else {
      pts[0] = {
        x: Math.floor(
          renderer.getStampPoint(span.startStamp, model, seriesManager) + model.periodWidth / 2,
        ),
        y: anchorY,
        index: renderer.getStampIndex(span.startStamp, model, seriesManager),
        stamp: span.startStamp,
        value: 0,
      };
    }

    pts[1] = {
      x: Math.floor(renderer.getStampPoint(span.endStamp, model, seriesManager) + model.periodWidth / 2),
      y: anchorY,
      index: renderer.getStampIndex(span.endStamp, model, seriesManager),
      stamp: span.endStamp,
      value: 0,
    };

    if (pts[1].x === pts[0].x) {
      pts[1].x += 1;
      pts[0].x -= 2;
    }

    return pts;
  };
}

const TimeRangeObjectCtor: import("./_sharedTypes").ShapeConstructor =
  TimeRangeObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { TimeRangeObjectCtor as TimeRangeObject };
