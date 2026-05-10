import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
} from "./_delegates";
import type { ShapeHitArgs, ShapeInteractionArgs, ShapeRenderArgs, ShapeTagRuntime } from "./_sharedTypes";

function PriceTagObject(this: ShapeTagRuntime) {
  this.defaultTagLen = 100;
  this.defaultLineLen = 50;

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    var x = pts[0].x;
    var y = pts[0].y;

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    var value = o.anchors[0].value;
    var valueS = LIB.nFormatter(value, renderer.getPrecision(model, panel));
    var w =
      this.defaultLineLen +
      15 +
      measurePriceTextWidth({
        text: valueS,
        ctx,
        zerosToReduce: renderer.getPriceRenderingOptions().zerosToReduce,
      });

    if (!o.flipped) {
      ctx.beginPath();
      ctx.moveTo(x + this.defaultLineLen, y);
      ctx.lineTo(x + this.defaultLineLen + 5, y - 10);
      ctx.lineTo(x + w, y - 10);
      ctx.lineTo(x + w, y + 10);
      ctx.lineTo(x + this.defaultLineLen + 5, y + 10);
      ctx.lineTo(x + this.defaultLineLen, y);
      ctx.fill();
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
      ctx.fillStyle = WEBRCP.utils.getContrastColor(
        color,
        WEBRCP.utils.colorManager.getColor("indicatorMarker"),
        "#ffffff"
      );
      renderPriceText({
        text: valueS,
        ctx,
        x: x + this.defaultLineLen + 10,
        y: y + 3,
        zerosToReduce: renderer.getPriceRenderingOptions().zerosToReduce,
      });
    } else {
      ctx.beginPath();
      ctx.moveTo(x - this.defaultLineLen, y);
      ctx.lineTo(x - this.defaultLineLen - 5, y - 10);
      ctx.lineTo(x - w, y - 10);
      ctx.lineTo(x - w, y + 10);
      ctx.lineTo(x - this.defaultLineLen - 5, y + 10);
      ctx.lineTo(x - this.defaultLineLen, y);
      ctx.fill();
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
      ctx.fillStyle = WEBRCP.utils.getContrastColor(
        color,
        WEBRCP.utils.colorManager.getColor("indicatorMarker"),
        "#ffffff"
      );
      renderPriceText({
        text: valueS,
        ctx,
        x: x - w + 10,
        y: y + 3,
        zerosToReduce: renderer.getPriceRenderingOptions().zerosToReduce,
      });
    }
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;

    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;
    this.clearHits(o);

    if (
      (o.flipped &&
        between(
          pts[0].x,
          x,
          pts[0].x - this.defaultLineLen - this.defaultTagLen,
          self.hitTolerance
        ) &&
        between(pts[0].y - 1, y, pts[0].y + 1, self.hitTolerance)) ||
      (!o.flipped &&
        between(
          pts[0].x,
          x,
          pts[0].x + this.defaultLineLen + this.defaultTagLen,
          self.hitTolerance
        ) &&
        between(pts[0].y - 1, y, pts[0].y + 1, self.hitTolerance))
    ) {
      hitResult = true;
      o._hit = true;
      var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
      if (p) {
        o._hitAnchor = { x: p.x, y: p.y };
      }
    }
    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    var yValue = e._offset.offsetY - panel._offset;
    var baseAnchors = interactor.currentAnchor.anchors;
    var xOffset =
      renderer.getPointIndex(e._offset.offsetX, model) -
      renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var yOffset = parseFloat(
      (
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
          }
        )
      ).toFixed(panel.precision)
    );

    if (Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

    let index = renderer.getStampIndex(baseAnchors[0].stamp, model, seriesManager) + xOffset;
    var v = baseAnchors[0].value + yOffset;
    if (o.sticky) {
      var candles = this.getCurrentCandles(index, model, seriesManager);
      v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
    }
    o.anchors[0].value = LIB.round(v, renderer.getPrecision(model, panel));
    o.anchors[0]._index = index;
    o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, , seriesManager]: ShapeInteractionArgs) {
    var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
      var i = interactor.currentAnchor.selected;
      var idx = renderer.getPointIndex(e._offset.offsetX, model);
      if (i != null && i < o.anchors.length) {
        o.anchors[i]._index = idx;
        o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
      }
    }
  };
}

const PriceTagObjectCtor: import("./_sharedTypes").ShapeConstructor =
  PriceTagObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { PriceTagObjectCtor as PriceTagObject };
