import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  calcLine,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { ShapeRuntime } from "./_sharedTypes";

function hasRenderableTrendPoints(
  pts: Array<{ index?: number; value?: number; x?: number; y?: number }> | undefined,
): boolean {
  return (
    Array.isArray(pts) &&
    pts.length >= 2 &&
    Number.isFinite(pts[0]?.index) &&
    Number.isFinite(pts[1]?.index) &&
    Number.isFinite(pts[0]?.value) &&
    Number.isFinite(pts[1]?.value)
  );
}

function TrendRayObject(this: ShapeRuntime) {
  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!hasRenderableTrendPoints(pts)) {
      return;
    }

    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const line = calcLine({ x: pts[0].index, y: pts[0].value }, { x: pts[1].index, y: pts[1].value });

    ctx.beginPath();
    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    if (pts[0].x === pts[1].x) {
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts[1].y >= pts[0].y) {
        ctx.lineTo(pts[0].x, panel._offset + panel._height);
      } else {
        ctx.lineTo(pts[0].x, panel._offset);
      }
    } else {
      const forward = pts[1].index >= pts[0].index || pts[1].x >= pts[0].x;
      const startI = pts[0].index;
      const endI = forward ? model._rightIndex : model._leftIndex;

      if (panel.valueAxisMode === "lin") {
        const x1 = renderer.getIndexPoint(startI, model) + model._midOffset;
        const x2 = renderer.getIndexPoint(endI, model) + model._midOffset;
        const y1 =
          renderer.getYCoordinateForPrice(line.a * startI + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        const y2 =
          renderer.getYCoordinateForPrice(line.a * endI + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else {
        const step = forward ? 1 : -1;
        for (let index = startI; forward ? index <= endI : index >= endI; index += step) {
          const lineValue = line.a * index + line.b;
          const x = renderer.getIndexPoint(index, model) + model._midOffset;
          const y =
            renderer.getYCoordinateForPrice(lineValue, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV,
            }) + panel._offset;

          if (index === startI) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
    }

    ctx.stroke();
    ctx.closePath();
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    const self = this;
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;
    const plotRight = panel._width - valueAxisWidth;
    let hitResult = false;

    this.clearHits(o);

    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const forward = pts[1].index >= pts[0].index || pts[1].x >= pts[0].x;
    const hitLeftX = forward ? pts[0].x : 0;
    const hitRightX = forward ? plotRight : pts[0].x;

    if (
      between(hitLeftX, x, hitRightX, self.hitTolerance) &&
      between(
        Math.min(pts[0].y, pts[1].y),
        y,
        Math.max(pts[0].y, pts[1].y),
        self.hitTolerance + self.anchorPointDistanceToArrow,
      )
    ) {
      if (pts[0].x === pts[1].x) {
        const onRay =
          forward ? y >= pts[0].y - self.hitTolerance : y <= pts[0].y + self.hitTolerance;
        if (onRay && between(pts[0].x - self.hitTolerance, x, pts[0].x + self.hitTolerance, 0)) {
          hitResult = true;
          o._hit = true;
          const anchor = findAnchorPointForXY(pts, x, y, self.hitTolerance);
          if (anchor) {
            o._hitAnchor = { x: anchor.x, y: anchor.y };
          }
        }
      } else {
        const line = calcLine(
          { x: pts[0].index, y: pts[0].value },
          { x: pts[1].index, y: pts[1].value },
        );
        const lIndex1 = renderer.getPointIndex(x, model);
        const lIndex2 = lIndex1 >= 1 ? lIndex1 - 1 : lIndex1 + 1;
        const lx1 = renderer.getIndexPoint(lIndex1, model) + model._midOffset;
        const ly1 =
          renderer.getYCoordinateForPrice(line.a * lIndex1 + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        const lx2 = renderer.getIndexPoint(lIndex2, model) + model._midOffset;
        const ly2 =
          renderer.getYCoordinateForPrice(line.a * lIndex2 + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;

        const nearest = getLinePointNearestMouse({ x0: lx1, y0: ly1, x1: lx2, y1: ly2 }, x, y);
        const distance = pointsDistance({ x, y }, { x: nearest.x, y: nearest.y });
        const onRaySide = forward ? x >= pts[0].x - self.hitTolerance : x <= pts[0].x + self.hitTolerance;

        if (onRaySide && distance < self.hitTolerance) {
          hitResult = true;
          o._hit = true;
          const anchor = findAnchorPointForXY(pts, x, y, self.hitTolerance);
          if (anchor) {
            o._hitAnchor = { x: anchor.x, y: anchor.y };
          }
        }
      }
    }

    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate();
  this.mouseOut = createShapeMouseOutDelegate();
  this.stageUp = shapeStageUpDelegate;
  this.stageOut = shapeStageOutDelegate;
}

const TrendRayObjectCtor: import("./_sharedTypes").ShapeConstructor =
  TrendRayObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { TrendRayObjectCtor as TrendRayObject };
