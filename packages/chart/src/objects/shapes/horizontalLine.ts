import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
  drawAnchorsArrow,
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

function HorizontalLineObject(this: ShapeRuntime) {
  //override pop
  this.pop = function (o, renderer, model, seriesManager) {
    var lastStamp =
      seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length - 1][
        "stamp"
      ];
    var lastIndex = seriesManager[model.mainSeries].data.length - 1;
    o.anchors[0].stamp = lastStamp;
    o.anchors[0].referenceStamp = lastStamp;
    o.anchors[0].offset = 0;
    o.anchors[0]._index = lastIndex;
  };
  //override push
  this.push = function (o, renderer, model, seriesManager) {
    var lastStamp =
      seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length - 1][
        "stamp"
      ];
    var lastIndex = seriesManager[model.mainSeries].data.length - 1;
    o.anchors[0].stamp = lastStamp;
    o.anchors[0].referenceStamp = lastStamp;
    o.anchors[0].offset = 0;
    o.anchors[0]._index = lastIndex;
  };
  //override get points
  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    if (!panel) return [];
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var y =
      renderer.getYCoordinateForPrice(o.anchors[0].value, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      }) + panel._offset;
    return [
      { x: this.anchorPointSize, y, index: o.anchors[0]._index, value: o.anchors[0].value },
      {
        x: model._timeAxisWidth - this.anchorPointSize,
        y,
        index: o.anchors[0]._index,
        value: o.anchors[0].value,
      },
    ] as LegacyShapePoint[];
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(pts[0].x - this.anchorPointSize, pts[0].y);
    ctx.lineTo(pts[1].x + this.anchorPointSize, pts[1].y);
    ctx.stroke();

    if (o.selected) {
      drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
    }

    if (o.isIndicator && o.canBeIndicator) {
      var pt = pts[0];
      drawIndicatorMarker(
        ctx,
        panel,
        pt,
        13,
        WEBRCP.utils.colorManager.getColor("indicatorMarker"),
        0.9
      );
    }
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

  this.postRenderOverlay = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    if (o.priceTag) {
      var pts = this.getPoints(o, renderer, panel, model, seriesManager);
      const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      var textColor = WEBRCP.utils.getContrastColor(color);
      renderer.drawPriceTag(
        ctx,
        model,
        panel,
        pts[0].y,
        color,
        textColor,
        o.anchors[0].value,
        "real"
      );
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;

    this.clearHits(o);

    if (between(pts[0].y - 1, y, pts[1].y + 1, self.hitTolerance)) {
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
    var idx = interactor.currentAnchor.selected;
    var baseAnchors = interactor.currentAnchor.anchors;
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var yValue = e._offset.offsetY - panel._offset;
    var yOffset =
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
      );

    for (var i = 0; i < o.anchors.length; i++) {
      var index = renderer.getPointIndex(e._offset.offsetX, model);
      var nextValue;
      if (o.sticky) {
        var candles = this.getCurrentCandles(index, model, seriesManager);
        nextValue = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
      } else {
        nextValue = baseAnchors[idx ?? 0].value + yOffset;
      }
      o.anchors[i].value = LIB.round(nextValue, renderer.getPrecision(model, panel));
    }
  };

  /*
   * STAGE
   */

  this.stageDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
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

const HorizontalLineObjectCtor: import("./_sharedTypes").ShapeConstructor =
  HorizontalLineObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { HorizontalLineObjectCtor as HorizontalLineObject };
