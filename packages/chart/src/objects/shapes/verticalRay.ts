import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
} from "../../utils/objects-lib";
import {
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function getVerticalRayOrigin(
  o: ShapeRenderArgs[0],
  renderer: ShapeRenderArgs[2],
  panel: ShapeRenderArgs[4],
  model: ShapeRenderArgs[3],
  seriesManager: ShapeRenderArgs[5],
) {
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

  return { x, y, index, value: o.anchors[0].value };
}

function VerticalRayObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const origin = getVerticalRayOrigin(o, renderer, panel, model, seriesManager);
    const bottomY = panel._offset + panel._height;

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x, bottomY);
    ctx.stroke();

    if (o.selected) {
      drawAnchors(ctx, panel, [origin], this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const origin = getVerticalRayOrigin(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor && o._hitAnchor.x === origin.x && o._hitAnchor.y === origin.y) {
      drawAnchor(octx, panel, origin, this.hitTolerance, this.anchorColorHover, 0.5);
    }

    if (o._hit || o.selected) {
      drawAnchors(octx, panel, [origin], this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    const origin = getVerticalRayOrigin(o, renderer, panel, model, seriesManager);
    this.clearHits(o);

    if (
      between(origin.x - 1, x, origin.x + 1, this.hitTolerance) &&
      between(origin.y, y, panel._offset + panel._height, this.hitTolerance)
    ) {
      o._hit = true;
      const anchor = findAnchorPointForXY([origin], x, y, this.hitTolerance);
      if (anchor) {
        o._hitAnchor = { x: anchor.x, y: anchor.y };
      }
      return true;
    }

    return false;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");

  this.stageDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const value = renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    });
    const index = renderer.getPointIndex(e._offset.offsetX, model);

    o.anchors[0].value = value;
    o.anchors[0]._index = index;
    o.anchors[0].stamp = renderer.getIndexStamp(index, model, seriesManager);

    if (interactor.currentAnchor == null) {
      return this.createAnchorSelection(o, 1);
    }

    interactor.pushPanel(this, o, panel);
    return this.createAnchorSelection(o, (interactor.currentAnchor.selected ?? 0) + 1);
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    const xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
      this.mouseDrag(e, o, renderer, interactor, model, panel, seriesManager);
    }
  };

  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const value = renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    });
    const index = renderer.getPointIndex(e._offset.offsetX, model);
    o.anchors[0]._index = index;
    o.anchors[0].value = value;
    o.anchors[0].stamp = renderer.getIndexStamp(index, model, seriesManager);
  };

  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const VerticalRayObjectCtor: import("./_sharedTypes").ShapeConstructor =
  VerticalRayObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { VerticalRayObjectCtor as VerticalRayObject };
