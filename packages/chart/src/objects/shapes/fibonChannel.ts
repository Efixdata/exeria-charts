import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  calcLine,
  pointsDistance,
  getLinePointNearestMouse,
  movePointByDistance,
  findAnchorPointArrowForXY,
  drawAnchor,
  drawAnchors,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import {
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import {
  FIBON_CHANNEL_DEFAULT_VALUES,
  FIBON_CHANNEL_DEFAULT_VALUES_STATE,
  formatFibChannelLevelLabel,
  resolveFibChannelLabelEdgeX,
  interpolateLineY,
  pickFibonChannelAnchorIndex,
  resolveFibonChannelAnchorHitTolerance,
  resolveFibonChannelGeometry,
  snapFibonChannelWidthAnchor,
  type FibChannelLevelLine,
} from "./fibonChannelBase";
import type { ShapeHitArgs, ShapeInteractionArgs, ShapeRenderArgs, ShapeRuntime } from "./_sharedTypes";

function extendChannelLine(
  line: FibChannelLevelLine,
  points: ReturnType<ShapeRuntime["getPoints"]>,
  panel: ShapeRenderArgs[4],
  _model: ShapeRenderArgs[3],
  object: LegacyValueLevelsShapeObject,
): FibChannelLevelLine {
  const baseline = calcLine(points[0], points[1]);
  let start = { x: line.x0, y: line.y0 };
  let end = { x: line.x1, y: line.y1 };

  if (pointsDistance(start, points[0]) > pointsDistance(end, points[0])) {
    const swappedStart = end;
    end = start;
    start = swappedStart;
  }

  if (object.anchors[0]?.expanded === true) {
    const distance = points[0].x > points[1].x ? panel._width : -panel._width;
    start = movePointByDistance(start, distance, baseline);
  }

  if (object.anchors[1]?.expanded === true) {
    const distance = points[1].x < points[0].x ? -panel._width : panel._width;
    end = movePointByDistance(end, distance, baseline);
  }

  return { ...line, x0: start.x, y0: start.y, x1: end.x, y1: end.y };
}

function resolveFibonChannelPoints(
  runtime: ShapeRuntime,
  object: LegacyValueLevelsShapeObject,
  rendererOrContext: ShapeRenderArgs[2],
  panel: ShapeRenderArgs[4] | null | undefined,
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
) {
  const basePoints = Shape.prototype.getPoints.call(
    runtime,
    object,
    rendererOrContext,
    panel,
    model,
    seriesManager,
  );
  if (!basePoints || basePoints.length < 3) {
    return basePoints;
  }

  const values = Array.isArray(object.values) ? object.values : FIBON_CHANNEL_DEFAULT_VALUES;
  const valuesState = Array.isArray(object.valuesState)
    ? object.valuesState
    : FIBON_CHANNEL_DEFAULT_VALUES_STATE;
  const geometry = resolveFibonChannelGeometry(basePoints, values, valuesState);

  return snapFibonChannelWidthAnchor(basePoints, geometry);
}

function FibonChannelObject(this: ShapeRuntime) {
  this.getPoints = function (object, rendererOrContext, panel, model, seriesManager) {
    return resolveFibonChannelPoints(
      this,
      object as LegacyValueLevelsShapeObject,
      rendererOrContext,
      panel,
      model,
      seriesManager,
    );
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const channelObject = o as LegacyValueLevelsShapeObject;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 3) {
      return;
    }

    const values = Array.isArray(channelObject.values)
      ? channelObject.values
      : FIBON_CHANNEL_DEFAULT_VALUES;
    const valuesState = Array.isArray(channelObject.valuesState)
      ? channelObject.valuesState
      : FIBON_CHANNEL_DEFAULT_VALUES_STATE;
    const geometry = resolveFibonChannelGeometry(points, values, valuesState);
    if (!geometry) {
      return;
    }

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    const lineWidth = typeof o.width === "number" ? o.width : 1;
    const dash = Array.isArray(o.dash) ? o.dash : [];
    const referenceValue = LIB.getReferenceValue(o, model, seriesManager);
    const priceOptions = {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV: referenceValue,
    };

    const renderedLevels = geometry.levels.map((line) =>
      extendChannelLine(line, points, panel, model, channelObject),
    );

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.font = this.defaultFont;

    if (o.fillBg === true && renderedLevels.length > 1) {
      for (let index = 0; index < renderedLevels.length - 1; index += 1) {
        const lower = renderedLevels[index];
        const upper = renderedLevels[index + 1];
        ctx.beginPath();
        ctx.globalAlpha = 0.05 + (index % 2) * 0.03;
        ctx.moveTo(lower.x0, lower.y0);
        ctx.lineTo(lower.x1, lower.y1);
        ctx.lineTo(upper.x1, upper.y1);
        ctx.lineTo(upper.x0, upper.y0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    for (const line of renderedLevels) {
      ctx.beginPath();
      ctx.moveTo(line.x0, line.y0);
      ctx.lineTo(line.x1, line.y1);
      ctx.stroke();

      const labelEdgeX = resolveFibChannelLabelEdgeX(points, line);
      const labelY = interpolateLineY(line, labelEdgeX);
      const labelPrice = renderer.getPriceForYCoordinate(labelY - panel._offset, priceOptions);
      const previousTextAlign = ctx.textAlign;

      ctx.textAlign = "right";
      ctx.fillText(
        formatFibChannelLevelLabel(line.level, labelPrice, panel.precision ?? 0),
        labelEdgeX - 6,
        labelY - 4,
      );
      ctx.textAlign = previousTextAlign;
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracementLine");
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
  };

  this.renderOverlay = function (
    ...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs
  ) {
    if (!panel || (!o.selected && !o._hit)) {
      return;
    }

    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points?.length) {
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
      for (const point of points) {
        if (point.x === o._hitAnchor.x && point.y === o._hitAnchor.y) {
          drawAnchor(octx, panel, point, anchorRadius + 2, anchorHover, 1, anchorOptions);
        }
      }
    }

    drawAnchors(octx, panel, points, anchorRadius, anchorStroke, 1, anchorOptions);
  };

  this.hit = function (...[x, y, o, renderer, interactor, model, panel, seriesManager]: ShapeHitArgs) {
    const channelObject = o as LegacyValueLevelsShapeObject;
    const points = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!points || points.length < 3) {
      return false;
    }

    const values = Array.isArray(channelObject.values)
      ? channelObject.values
      : FIBON_CHANNEL_DEFAULT_VALUES;
    const valuesState = Array.isArray(channelObject.valuesState)
      ? channelObject.valuesState
      : FIBON_CHANNEL_DEFAULT_VALUES_STATE;
    const geometry = resolveFibonChannelGeometry(points, values, valuesState);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

    this.clearHits(o);
    if (!geometry) {
      return false;
    }

    const anchorTolerance = resolveFibonChannelAnchorHitTolerance(
      this.hitTolerance,
      this.anchorPointSize,
      o.selected === true,
    );
    const anchorIndex = pickFibonChannelAnchorIndex(x, y, points, anchorTolerance);
    if (anchorIndex != null) {
      o._hit = true;
      o._hitAnchor = { x: points[anchorIndex].x, y: points[anchorIndex].y };
      drawAnchors(
        interactor.octx,
        panel,
        points,
        Math.max(this.anchorPointSize + 2, this.hitTolerance - 1),
        this.anchorColor,
        0.5,
      );
      return true;
    }

    const renderedLevels = geometry.levels.map((line) =>
      extendChannelLine(line, points, panel, model, channelObject),
    );

    let hitResult = false;

    if (
      between(points[0].x, x, points[1].x, this.hitTolerance) ||
      (channelObject.anchors[0]?.expanded === true &&
        between(
          points[0].x < points[1].x ? 0 : points[0].x,
          x,
          points[0].x < points[1].x ? points[1].x : panel._width - valueAxisWidth,
          this.hitTolerance,
        )) ||
      (channelObject.anchors[1]?.expanded === true &&
        between(
          points[1].x < points[0].x ? 0 : points[1].x,
          x,
          points[1].x < points[0].x ? points[0].x : panel._width - valueAxisWidth,
          this.hitTolerance,
        ))
    ) {
      for (const line of renderedLevels) {
        const nearest = getLinePointNearestMouse(
          { x0: line.x0, y0: line.y0, x1: line.x1, y1: line.y1 },
          x,
          y,
        );
        if (pointsDistance({ x, y }, nearest) < this.hitTolerance) {
          hitResult = true;
          break;
        }
      }

      const baselineNearest = getLinePointNearestMouse(
        { x0: points[0].x, y0: points[0].y, x1: points[1].x, y1: points[1].y },
        x,
        y,
      );
      if (pointsDistance({ x, y }, baselineNearest) < this.hitTolerance) {
        hitResult = true;
      }

      if (hitResult) {
        o._hit = true;
        drawAnchors(interactor.octx, panel, points, this.anchorPointSize, this.anchorColor, 0.5);
      } else {
        const arrow = findAnchorPointArrowForXY(
          points,
          x,
          y,
          this.anchorPointDistanceToArrow,
          this.hitTolerance,
        );
        if (arrow && o.selected) {
          hitResult = true;
          o._hit = true;
          o._hitArrow = { x: arrow.x, y: arrow.y };
        }
      }
    }

    return hitResult;
  };

  this.mouseDown = function (
    ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
  ) {
    interactor.pushPanel(this, object, panel);
    this.wasDrag = false;

    const points = this.getPoints(object, renderer, panel, model, seriesManager);
    if (!points?.length) {
      return this.createAnchorSelection(object, null);
    }

    const eventOffset = event._offset ?? { offsetX: 0, offsetY: 0 };
    const anchorTolerance = resolveFibonChannelAnchorHitTolerance(
      this.hitTolerance,
      this.anchorPointSize,
      object.selected === true,
    );
    const anchorIndex = pickFibonChannelAnchorIndex(
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

  this.mouseDrag = function (
    ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
  ) {
    const selectedAnchor = interactor.currentAnchor.selected;
    if (selectedAnchor === 2) {
      const baseAnchors = interactor.currentAnchor.anchors;
      const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
      const yOffset = Number.parseFloat(
        (
          renderer.getPriceForYCoordinate(event._offset.offsetY - panel._offset, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV: referenceValue,
          }) -
          renderer.getPriceForYCoordinate(
            interactor.initialMouseEvent._offset.offsetY - panel._offset,
            {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV: referenceValue,
            },
          )
        ).toFixed(panel.precision),
      );
      object.anchors[2].value = baseAnchors[2].value + yOffset;
      return;
    }

    Shape.prototype.mouseDrag.call(
      this,
      event,
      object,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );
  };

  this.mouseUp = createShapeMouseUpExpandableDelegate();
  this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = function () {};

  this.stageDrag = function (
    ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
  ) {
    const xOffset = event._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yOffset = event._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
    if (Math.abs(xOffset) > this.hitTolerance || Math.abs(yOffset) > this.hitTolerance) {
      interactor.currentAnchor.drag = true;
    }
    this.stageMove(event, object, renderer, interactor, model, panel, seriesManager);
  };

  this.stageMove = function (
    ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
  ) {
    if (!interactor.currentAnchor) {
      return;
    }

    if (interactor.currentAnchor.selected === 2) {
      const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
      const value = renderer.getPriceForYCoordinate(event._offset.offsetY - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV: referenceValue,
      });
      object.anchors[2].value = value;
      return;
    }

    Shape.prototype.stageMove.call(
      this,
      event,
      object,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );
  };
}

const FibonChannelObjectCtor: import("./_sharedTypes").ShapeConstructor =
  FibonChannelObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { FibonChannelObjectCtor as FibonChannelObject };

export {
  FIBON_CHANNEL_DEFAULT_VALUES,
  FIBON_CHANNEL_DEFAULT_VALUES_STATE,
} from "./fibonChannelBase";
