import WEBRCP from "../../WebRCP";
import { isDrawingSnapEnabled } from "../../drawingWorkflow";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
  drawIndicatorMarker,
} from "../../utils/objects-lib";
import {
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { LegacyShapePoint } from "../../objectRuntimeBases";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function getPlotRight(panel: ShapeRenderArgs[4], renderer: ShapeRenderArgs[2]): number {
  return panel._width - renderer.getPriceRenderingOptions().valueAxisWidth;
}

function HorizontalRayObject(this: ShapeRuntime) {
  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    if (!panel) {
      return [];
    }

    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const index = renderer.getStampIndex(o.anchors[0].stamp, model, seriesManager);
    const x = renderer.getIndexPoint(index, model) + model._midOffset;
    const y =
      renderer.getYCoordinateForPrice(o.anchors[0].value, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;

    return [
      { x, y, index, value: o.anchors[0].value },
      { x: getPlotRight(panel, renderer), y, index, value: o.anchors[0].value },
    ] as LegacyShapePoint[];
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();

    if (o.selected) {
      drawAnchors(ctx, panel, [pts[0]], this.anchorPointSize, this.anchorColor, 1);
    }

    if (o.isIndicator && o.canBeIndicator) {
      drawIndicatorMarker(
        ctx,
        panel,
        pts[0],
        13,
        WEBRCP.utils.colorManager.getColor("indicatorMarker"),
        0.9,
      );
    }
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor) {
      for (const point of pts.slice(0, 1)) {
        if (point.x === o._hitAnchor.x && point.y === o._hitAnchor.y) {
          drawAnchor(octx, panel, point, this.hitTolerance, this.anchorColorHover, 0.5);
        }
      }
    }

    if (o._hit || o.selected) {
      drawAnchors(octx, panel, [pts[0]], this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.postRenderOverlay = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    if (o.priceTag) {
      const pts = this.getPoints(o, renderer, panel, model, seriesManager);
      const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      const textColor = WEBRCP.utils.getContrastColor(color);
      renderer.drawPriceTag(
        ctx,
        model,
        panel,
        pts[0].y,
        color,
        textColor,
        o.anchors[0].value,
        "real",
      );
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    this.clearHits(o);

    if (
      between(pts[0].x, x, pts[1].x, this.hitTolerance) &&
      between(pts[0].y - 1, y, pts[1].y + 1, this.hitTolerance)
    ) {
      o._hit = true;
      const anchor = findAnchorPointForXY(pts.slice(0, 1), x, y, this.hitTolerance);
      if (anchor) {
        o._hitAnchor = { x: anchor.x, y: anchor.y };
      }
      return true;
    }

    return false;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");

  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    const baseAnchors = interactor.currentAnchor.anchors;
    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const yValue = e._offset.offsetY - panel._offset;
    const yOffset =
      renderer.getPriceForYCoordinate(yValue, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) -
      renderer.getPriceForYCoordinate(
        interactor.initialMouseEvent._offset.offsetY - panel._offset,
        {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        },
      );

    const index = renderer.getPointIndex(e._offset.offsetX, model);
    let nextValue = baseAnchors[0].value + yOffset;
    if (isDrawingSnapEnabled(o, interactor)) {
      nextValue = this.stickToCandleValue(
        yValue,
        this.getCurrentCandles(index, model, seriesManager),
        panel,
        renderer,
        fV,
      );
    }

    o.anchors[0].value = LIB.round(nextValue, renderer.getPrecision(model, panel));
    o.anchors[0]._index = index;
    o.anchors[0].stamp = renderer.getIndexStamp(index, model, seriesManager);
  };

  this.stageDrag = function (...args: ShapeInteractionArgs) {
    const [e, o, renderer, interactor, model, panel, seriesManager] = args;
    const xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
    }
    this.mouseDrag(e, o, renderer, interactor, model, panel, seriesManager);
  };

  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const HorizontalRayObjectCtor: import("./_sharedTypes").ShapeConstructor =
  HorizontalRayObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { HorizontalRayObjectCtor as HorizontalRayObject };
