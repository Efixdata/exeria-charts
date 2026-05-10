import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
  drawAnchorArrow,
  drawAnchorsArrow,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import type {
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function DiNapoliLevels(this: ShapeRuntime) {
  this.subscriptionPack = "diNapoliTools";

  this.lineWidth = 100;
  this.margin = 20;

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    for (var i = 0; i < pts.length; i++) {
      const circleRadius = 6;
      ctx.beginPath();
      ctx.moveTo(pts[i].x + circleRadius, pts[i].y);
      ctx.arc(pts[i].x, pts[i].y, circleRadius, 0, 2 * Math.PI);

      if (i > 0 && !this.isHighestDifference(pts[0], pts[i], model, seriesManager)) {
        ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");
        ctx.fill();
      }

      ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
      ctx.stroke();
    }

    for (var i = 1; i < pts.length; ++i) {
      var fibonPoints = [pts[0], pts[i]];
      this.drawLevels(i - 1, fibonPoints, o, ctx, renderer, model, panel, seriesManager);
    }

    if (o.selected) {
      drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.drawLevels = function (index, pts, o, ctx, renderer, model, panel, seriesManager) {
    var valueLevelsObject = o as LegacyValueLevelsShapeObject;
    const lineWidth = this.lineWidth ?? 100;
    const margin = this.margin ?? 20;
    var distance = Math.abs(pts[0].y - pts[1].y);
    var valueDistance = Math.abs(pts[0].value - pts[1].value);
    //calc line values
    var valuesPoints = [];
    for (var i = 0; i < valueLevelsObject.values.length; i++) {
      var p = pts[0];
      var y = p.y;
      var v;
      if (p.y > pts[1].y) {
        y = y - (distance * valueLevelsObject.values[i]) / 100;
        v = p.value + (valueDistance * valueLevelsObject.values[i]) / 100;
      } else {
        y = y + (distance * valueLevelsObject.values[i]) / 100;
        v = p.value - (valueDistance * valueLevelsObject.values[i]) / 100;
      }
      valuesPoints.push({ y: y, v: v, p: valueLevelsObject.values[i] });
    }

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    //draw lines

    ctx.font = this.defaultFont;
    var lastIndex = valuesPoints.length - 1;
    const lastCandlePoint = this.getLastCandlePoint(renderer, model, seriesManager);
    for (var i = 0; i <= lastIndex; i++) {
      var lineFrom;
      var lineTo;

      if (i == lastIndex) {
        lineTo = lastCandlePoint + index * lineWidth + lineWidth - margin; //pts[0].x;
        lineFrom = pts[1].x;
      } else {
        lineFrom = lastCandlePoint + index * lineWidth;
        lineTo = lineFrom + lineWidth - margin;
      }
      if (i == 0) {
        ctx.fillStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement1");
        ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement1");
      } else if (i == 1) {
        ctx.fillStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement2");
        ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement2");
      } else {
        ctx.fillStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
        ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
        lineFrom = pts[1].x + 6;
        lineTo = lastCandlePoint + index * lineWidth + lineWidth - margin;
      }

      ctx.beginPath();
      ctx.moveTo(lineFrom, valuesPoints[i].y);
      ctx.lineTo(lineTo, valuesPoints[i].y);
      ctx.stroke();
      //draw label
      var vp = valuesPoints[i];
      var x = lastCandlePoint + index * lineWidth;
      ctx.fillText(vp.v.toFixed(panel.precision), x, vp.y - 4);
      ctx.fillText((vp.p / 100).toFixed(3), x, vp.y + 12);

      if (i > 0) {
        ctx.beginPath();
        var x = lastCandlePoint + index * lineWidth + lineWidth - margin;
        //ctx.lineTo(x, valuesPoints[0].y);
        var radiusY = (valuesPoints[i].y - valuesPoints[i - 1].y) / 2;
        var yCenter = valuesPoints[i].y - radiusY;
        radiusY = Math.abs(radiusY);
        ctx.ellipse(x, yCenter, 20, radiusY, 0, (-90 * Math.PI) / 180, (90 * Math.PI) / 180, false);
        ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("disabledTextColor");
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  this.isHighestDifference = function (rootPoint, point, model, seriesManager) {
    if (rootPoint.index < point.index) return false;

    const seriesId = model.instrumentsSeries[0].seriesId;
    const series = seriesManager[seriesId];
    const priceDifference = Math.abs(rootPoint.value - point.value);

    for (let i = rootPoint.index; i >= point.index; --i) {
      if (!series.data[i]) return false;
      if (Math.abs(rootPoint.value - series.data[i].h) > priceDifference) return false;
      if (Math.abs(rootPoint.value - series.data[i].l) > priceDifference) return false;
    }

    return true;
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
          drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5);
      }
    }

    if (o._hitArrow) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p.x == o._hitArrow.x && p.y == o._hitArrow.y)
          drawAnchorArrow(
            octx,
            panel,
            p,
            this.anchorPointArrowSize + 2,
            this.anchorPointDistanceToArrow,
            this.anchorColorHover,
            0.5
          );
      }
    }

    if (o._hit || o.selected) {
      drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
    }

    if (o.selected) {
      drawAnchorsArrow(
        octx,
        panel,
        pts,
        this.anchorPointArrowSize,
        this.anchorPointDistanceToArrow,
        this.anchorColor,
        1
      );
    }
  };

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;
    const lineWidth = this.lineWidth ?? 100;
    const margin = this.margin ?? 20;

    this.clearHits(o);
    const lastCandlePoint = this.getLastCandlePoint(renderer, model, seriesManager);
    if (pts.length >= 2) {
      for (var i = 0; i < pts.length; i++) {
        var horizontalLineStart =
          lastCandlePoint + i * (lineWidth - margin) + (i - 1) * margin;
        if (between(horizontalLineStart, x, pts[i].x, self.hitTolerance)) {
          var distance = Math.abs(y - pts[i].y);
          if (distance < self.hitTolerance) {
            hitResult = true;
            o._hit = true;
            var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
            if (p) {
              o._hitAnchor = { x: p.x, y: p.y };
            } else if (i === 0) {
              hitResult = false;
              o._hit = false;
            }
            break;
          }
        }
      }
    }
    return hitResult;
  };

  this.mouseDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    var self = this;
    var pts = self.getPoints(o, renderer, panel, model, seriesManager);
    interactor.pushPanel(this, o, panel);
    for (var i = 0; i < pts.length; i++) {
      if (
        interactor.isOver(
          e._offset.offsetX,
          e._offset.offsetY,
          pts[i].x,
          pts[i].y,
          self.hitTolerance
        )
      ) {
        return { selected: i, anchors: JSON.parse(JSON.stringify(o.anchors)) };
      }
    }
    return { selected: null, anchors: JSON.parse(JSON.stringify(o.anchors)) };
  };

  this.mouseUp = function (...[, o, , interactor, , panel]: ShapeLifecycleArgs) {
    interactor.popPanel(this, o, panel);
  };

  this.mouseOut = function (...[, o, , interactor, , panel]: ShapeLifecycleArgs) {
    interactor.popPanel(this, o, panel);
  };

  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    if (interactor.currentAnchor.selected === 0) {
      this.allowedStickyKeys = { h: true, l: true };
    } else {
      var pts = this.getPoints(o, renderer, panel, model, seriesManager);
      var yValue = e._offset.offsetY - panel._offset;

      if (yValue < pts[0].y) this.allowedStickyKeys = { h: true };
      else this.allowedStickyKeys = { l: true };
    }

    Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
  };

  this.stageUp = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    // console.log(" MULTILINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
    interactor.popPanel(this, o, panel);

    if (interactor.currentAnchor && interactor.currentAnchor.drag && interactor.currentAnchor.selected != null)
      interactor.currentAnchor.selected++;

    if (
      interactor.currentAnchor !== null &&
      interactor.currentAnchor.selected != null &&
      interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length
    ) {
      if (e.button == 0) {
        var fV = LIB.getReferenceValue(o, model, seriesManager);
        var v = renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        });
        var idx = renderer.getPointIndex(e._offset.offsetX, model);
        o.anchors.push({
          stamp: renderer.getIndexStamp(idx, model, seriesManager),
          referenceStamp: 0,
          offset: 0,
          value: v,
          _index: idx,
        });
        return false;
      } else {
        o.hidden = false;
        interactor.currentAnchor = null;
        return true;
      }
    }
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);

    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var idx = renderer.getPointIndex(e._offset.offsetX, model);
    var yValue = e._offset.offsetY - panel._offset;
    var v;

    if (o.sticky) {
      var candles = this.getCurrentCandles(idx, model, seriesManager);
      v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
    } else
      v = renderer.getPriceForYCoordinate(yValue, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      });

    if (interactor.currentAnchor.selected == null) return;

    var i = interactor.currentAnchor.selected - 1;
    o.anchors[i].value = LIB.round(v, renderer.getPrecision(model, panel));
    o.anchors[i]._index = idx;
    o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
  };

  this.stageOut = function () {
    // this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
  };
}

const DiNapoliLevelsCtor: import("./_sharedTypes").ShapeConstructor =
  DiNapoliLevels as unknown as import("./_sharedTypes").ShapeConstructor;
export { DiNapoliLevelsCtor as DiNapoliLevels };
