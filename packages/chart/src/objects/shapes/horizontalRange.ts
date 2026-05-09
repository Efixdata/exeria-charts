import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  calcLine,
  isPointInCircle,
  pointsDistance,
  findMidPoint,
  getLinePointNearestMouse,
  calcPointOnPerpendicularLine,
  movePointByDistance,
  findAnchorPointForXY,
  findAnchorPointArrowForXY,
  drawAnchor,
  drawAnchors,
  drawAnchorArrow,
  drawAnchorsArrow,
  drawIndicatorMarker,
} from "../../utils/objects-lib";
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import {
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function HorizontalRangeObject(this: ShapeRuntime) {
  this.render = function (
    o: LegacyShapeObject,
    ctx: CanvasRenderingContext2D,
    renderer: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];

    var x1 = pts[0].x;
    var x2 = pts[1].x;
    var xMid = (x1 + x2) / 2;
    var y = pts[0].y;
    var off = -6;
    var off2 = 0;

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    if (!o.flipped) {
      ctx.beginPath();
      ctx.bezierCurveTo(x1 + 1, y + 4 + off, x1 + 4, y + off, x1 + 7, y + off);
      ctx.lineTo(xMid - 7, y + off);
      ctx.bezierCurveTo(
        xMid - 7 + 3,
        y + off,
        xMid - 7 + 6,
        y - 2 + off,
        xMid - 7 + 7,
        y - 6 + off
      );
      ctx.bezierCurveTo(xMid + 1, y + off - 2, xMid + 4, y + off, xMid + 7, y + off);
      ctx.lineTo(x2 - 7, y + off);
      ctx.bezierCurveTo(x2 - 7 + 3, y + off, x2 - 7 + 6, y + 2 + off, x2, y + 6 + off);
      ctx.stroke();
      ctx.closePath();
      if (o.text) ctx.fillText(o.text, xMid - ctx.measureText(o.text).width / 2, y - 20);
    } else {
      ctx.beginPath();
      ctx.bezierCurveTo(x1 + 1, y + 4 + off2, x1 + 4, y + 6 + off2, x1 + 7, y + 6 + off2);
      ctx.lineTo(xMid - 7, y + 6 + off2);
      ctx.bezierCurveTo(
        xMid - 7 + 3,
        y + 6 + off2,
        xMid - 7 + 6,
        y + 8 + off2,
        xMid - 7 + 7,
        y + 12 + off2
      );
      ctx.bezierCurveTo(xMid + 1, y + 8 + off2, xMid + 4, y + 6 + off2, xMid + 7, y + 6 + off2);
      ctx.lineTo(x2 - 7, y + 6 + off2);
      ctx.bezierCurveTo(x2 - 7 + 3, y + 6 + off2, x2 - 7 + 6, y + 4 + off2, x2, y + off2);

      ctx.stroke();
      ctx.closePath();
      if (o.text) ctx.fillText(o.text, xMid - ctx.measureText(o.text).width / 2, y + 26 + off2);
    }
  };

  this.renderOverlay = function (
    o: LegacyShapeObject,
    octx: CanvasRenderingContext2D,
    renderer: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
    var x1 = pts[0].x;
    var x2 = pts[1].x;
    var y = pts[0].y;
    var off = -6;
    var off2 = 0;

    if (o._hit || o.selected) {
      octx.setLineDash([2, 5]);
      octx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
      if (!o.flipped) {
        octx.beginPath();
        octx.moveTo(x1, y);
        octx.lineTo(x1, panel._height + panel._offset);
        octx.moveTo(x2, y);
        octx.lineTo(x2, panel._height + panel._offset);
        octx.stroke();
        octx.closePath();
      } else {
        octx.beginPath();
        octx.moveTo(x1, y);
        octx.lineTo(x1, 0);
        octx.moveTo(x2, y);
        octx.lineTo(x2, 0);
        octx.stroke();
        octx.closePath();
      }
      octx.setLineDash([1]);
    }

    Shape.prototype.renderAnchorsOverlay.call(
      this,
      o,
      octx,
      renderer,
      model,
      panel,
      seriesManager,
      { drawArrowHandles: false }
    );
  };

  this.hit = function (
    x: number,
    y: number,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var self = this;

    var pts = this.getPoints(o, renderer, panel, model, seriesManager) as any[];
    var hitResult = false;
    this.clearHits(o);

    var off = -6;
    if (o.flipped) off = 0;

    if (
      between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
      between(pts[0].y - 1 + off, y, pts[1].y + 1 + off, self.hitTolerance)
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
  this.mouseDrag = function (
    e: any,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var idx = interactor.currentAnchor.selected;
    var baseAnchors = interactor.currentAnchor.anchors;
    var xOffset =
      renderer.getPointIndex(e._offset.offsetX, model) -
      renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var yOffset = parseFloat(
      (
        renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
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

    if (idx != null) {
      let index = renderer.getStampIndex(baseAnchors[idx].stamp, model, seriesManager);
      o.anchors[idx]._index = index + xOffset;
      o.anchors[idx].stamp = renderer.getIndexStamp(o.anchors[idx]._index, model, seriesManager);
    } else {
      for (var i = 0; i < o.anchors.length; i++) {
        let index = renderer.getStampIndex(baseAnchors[i].stamp, model, seriesManager);
        o.anchors[i]._index = index + xOffset;
        o.anchors[i].value = baseAnchors[i].value + yOffset;
        o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
      }
    }
  };

  this.stageDrag = function (
    e: any,
    o: LegacyShapeObject,
    renderer: any,
    interactor: any,
    model: any,
    panel: any,
    seriesManager: any
  ) {
    var xOffset =
      renderer.getPointIndex(e._offset.offsetX, model) -
      renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var yOffset = parseFloat(
      (
        renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
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
    var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
      var i = interactor.currentAnchor.selected;
      var v = renderer.getPriceForYCoordinate(
        e._offset.offsetY - panel._offset,
        panel._height,
        panel.vMin,
        panel.vMax
      );
      var idx = renderer.getPointIndex(e._offset.offsetX, model);
      if (i != null && i < o.anchors.length) {
        o.anchors[i]._index = idx;
        o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
      }
    }
  };

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;

  // this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("HRANGE stage move", interactor.currentAnchor);
  // 	if(interactor.currentAnchor!==null){
  // 		var i = interactor.currentAnchor.selected;
  // 		var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			console.log("HRANGE stage move",i, o.anchors);
  // 		}
  // 	}
  // };
}

const HorizontalRangeObjectCtor: new (...args: any[]) => any = HorizontalRangeObject as any;
export { HorizontalRangeObjectCtor as HorizontalRangeObject };
