import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
  findAnchorPointArrowForXY,
} from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import type { ShapeConstructor, ShapeRuntime } from "./_sharedTypes";

export function createFibonLevelsObject(): ShapeConstructor {
  const FibonLevelsObject = function (this: ShapeRuntime) {
    this.render = function (o, ctx, renderer, model, panel, seriesManager) {
      const fibonObject = o as LegacyValueLevelsShapeObject;
      const pts = this.getPoints(o, renderer, panel, model, seriesManager);
      const distance = Math.abs(pts[0].y - pts[1].y);
      const valuesPoints: Array<{ y: number; v: number; p: number }> = [];

      for (let index = 0; index < fibonObject.values.length; index += 1) {
        if (fibonObject.valuesState[index] === true) {
          const p = pts[1];
          let y = p.y;
          if (p.y > pts[0].y) {
            y = y - (distance * fibonObject.values[index]) / 100;
          } else {
            y = y + (distance * fibonObject.values[index]) / 100;
          }

          const fV = LIB.getReferenceValue(o, model, seriesManager);
          const v = renderer.getPriceForYCoordinate(y, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          });

          valuesPoints.push({ y, v, p: fibonObject.values[index] });
        }
      }

      ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      ctx.lineWidth = o.width;
      ctx.setLineDash(o.dash ? o.dash : []);

      ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      if (o.fillBg && o.color !== null && o.color !== undefined) {
        for (let index = 0; index < valuesPoints.length - 1; index += 1) {
          const vp = valuesPoints[index];
          const vp2 = valuesPoints[index + 1];
          ctx.beginPath();
          ctx.globalAlpha = 0.05 + index * 0.03;
          ctx.moveTo(pts[0].x, vp.y);
          ctx.lineTo(pts[1].x, vp.y);
          ctx.lineTo(pts[1].x, vp2.y);
          ctx.lineTo(pts[0].x, vp2.y);
          ctx.lineTo(pts[0].x, vp.y);
          ctx.fill();
          ctx.closePath();
        }
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      for (let index = 0; index < valuesPoints.length; index += 1) {
        let lineFrom = pts[0].x;
        let lineTo = pts[1].x;

        if (o.anchors[0].expanded === true) {
          if (pts[0].x > pts[1].x) {
            lineTo = model._timeAxisWidth;
          } else {
            lineFrom = 0;
          }
        }
        if (o.anchors[1].expanded === true) {
          if (pts[1].x < pts[0].x) {
            lineFrom = 0;
          } else {
            lineTo = model._timeAxisWidth;
          }
        }

        ctx.moveTo(lineFrom, valuesPoints[index].y);
        ctx.lineTo(lineTo, valuesPoints[index].y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracementLine");
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = this.defaultFont;
      for (let index = 0; index < valuesPoints.length; index += 1) {
        const vp = valuesPoints[index];
        ctx.fillText(`${vp.v.toFixed(panel.precision)} (${vp.p}%)`, pts[0].x, vp.y - 5);
      }
    };

    this.renderOverlay = createShapeAnchorOverlayDelegate();

    this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
      const self = this;
      const pts = this.getPoints(o, renderer, panel, model, seriesManager);
      let hitResult = false;
      const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

      this.clearHits(o);

      if (
        (between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
          between(pts[0].y, y, pts[1].y, self.hitTolerance + self.anchorPointDistanceToArrow)) ||
        (o.anchors[0].expanded === true &&
          between(
            pts[0].x < pts[1].x ? 0 : pts[0].x,
            x,
            pts[0].x < pts[1].x ? pts[1].x : panel._width - valueAxisWidth,
            self.hitTolerance,
          )) ||
        (o.anchors[1].expanded === true &&
          between(
            pts[1].x < pts[0].x ? 0 : pts[1].x,
            x,
            pts[1].x < pts[0].x ? pts[0].x : panel._width - valueAxisWidth,
            self.hitTolerance,
          ))
      ) {
        const nlp1 = getLinePointNearestMouse(
          { x0: pts[0].x, y0: pts[0].y, x1: pts[1].x, y1: pts[0].y },
          x,
          y,
        );
        let distance = pointsDistance({ x, y }, { x: nlp1.x, y: nlp1.y });
        if (distance < self.hitTolerance) {
          hitResult = true;
          o._hit = true;
        }

        if (!hitResult) {
          const nlp2 = getLinePointNearestMouse(
            { x0: pts[0].x, y0: pts[1].y, x1: pts[1].x, y1: pts[1].y },
            x,
            y,
          );
          distance = pointsDistance({ x, y }, { x: nlp2.x, y: nlp2.y });
          if (distance < self.hitTolerance) {
            hitResult = true;
            o._hit = true;
          }
        }

        if (!hitResult) {
          const nlp3 = getLinePointNearestMouse(
            { x0: pts[0].x, y0: pts[0].y, x1: pts[1].x, y1: pts[1].y },
            x,
            y,
          );
          distance = pointsDistance({ x, y }, { x: nlp3.x, y: nlp3.y });
          if (distance < self.hitTolerance) {
            hitResult = true;
            o._hit = true;
          }
        }

        if (hitResult) {
          const anchor = findAnchorPointForXY(pts, x, y, self.hitTolerance);
          if (anchor) {
            o._hitAnchor = { x: anchor.x, y: anchor.y };
          }
        } else {
          const arrow = findAnchorPointArrowForXY(
            pts,
            x,
            y,
            self.anchorPointDistanceToArrow,
            self.hitTolerance,
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

    this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
    this.mouseUp = createShapeMouseUpExpandableDelegate();
    this.mouseOut = createShapeMouseOutDelegate("mouseOutKeepHits");
    this.stageUp = shapeStageUpDelegate;
    this.stageOut = function () {};
  };

  return FibonLevelsObject as unknown as ShapeConstructor;
}

/** Default extension levels (100% and beyond the swing). */
export const FIBON_EXTENSION_DEFAULT_VALUES = [
  0, 61.8, 100, 127.2, 141.4, 161.8, 200, 261.8, 361.8, 423.6,
];

export const FIBON_EXTENSION_DEFAULT_VALUES_STATE = [
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
];
