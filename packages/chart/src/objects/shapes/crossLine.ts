import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
  pointsDistance,
  getLinePointNearestMouse,
} from "../../utils/objects-lib";
import {
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type {
  ShapeHitArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function getPlotRight(panel: ShapeRenderArgs[4], renderer: ShapeRenderArgs[2]): number {
  return panel._width - renderer.getPriceRenderingOptions().valueAxisWidth;
}

function getCrossLineAnchorPoint(
  o: ShapeRenderArgs[0],
  renderer: ShapeRenderArgs[2],
  panel: ShapeRenderArgs[4],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
) {
  const fV = LIB.getReferenceValue(o, model, seriesManager);
  const index = renderer.getStampIndex(o.anchors[0].stamp, model, seriesManager);
  return {
    x: renderer.getIndexPoint(index, model) + model._midOffset,
    y:
      renderer.getYCoordinateForPrice(o.anchors[0].value, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset,
    index,
    value: o.anchors[0].value,
  };
}

function CrossLineObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const anchor = getCrossLineAnchorPoint(o, renderer, panel, model, seriesManager);
    const plotRight = getPlotRight(panel, renderer);
    const topY = panel._offset;
    const bottomY = panel._offset + panel._height;

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(0, anchor.y);
    ctx.lineTo(plotRight, anchor.y);
    ctx.moveTo(anchor.x, topY);
    ctx.lineTo(anchor.x, bottomY);
    ctx.stroke();

    if (o.selected) {
      drawAnchors(ctx, panel, [anchor], this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const anchor = getCrossLineAnchorPoint(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor && o._hitAnchor.x === anchor.x && o._hitAnchor.y === anchor.y) {
      drawAnchor(octx, panel, anchor, this.hitTolerance, this.anchorColorHover, 0.5);
    }

    if (o._hit || o.selected) {
      drawAnchors(octx, panel, [anchor], this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    const anchor = getCrossLineAnchorPoint(o, renderer, panel, model, seriesManager);
    const plotRight = getPlotRight(panel, renderer);
    this.clearHits(o);

    const horizontalDistance = pointsDistance(
      { x, y },
      getLinePointNearestMouse({ x0: 0, y0: anchor.y, x1: plotRight, y1: anchor.y }, x, y),
    );
    const verticalDistance = pointsDistance(
      { x, y },
      getLinePointNearestMouse(
        { x0: anchor.x, y0: panel._offset, x1: anchor.x, y1: panel._offset + panel._height },
        x,
        y,
      ),
    );

    if (horizontalDistance < this.hitTolerance || verticalDistance < this.hitTolerance) {
      o._hit = true;
      if (between(anchor.x, x, anchor.x, this.hitTolerance) && between(anchor.y, y, anchor.y, this.hitTolerance)) {
        o._hitAnchor = { x: anchor.x, y: anchor.y };
      }
      return true;
    }

    return false;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");

  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const CrossLineObjectCtor: import("./_sharedTypes").ShapeConstructor =
  CrossLineObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { CrossLineObjectCtor as CrossLineObject };
