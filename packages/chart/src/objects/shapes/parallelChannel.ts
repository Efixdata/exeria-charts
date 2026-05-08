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
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

var ParallelChannelObject = function (this: ShapeRuntime) {
  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts || pts.length < 3) return;
    var mid = findMidPoint(pts[0], pts[1]);
    var hh = pointsDistance(mid, pts[2]);
    var h = pts[2].y - mid.y;

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    var line1 = calcLine(pts[0], pts[1]);
    var line2 = calcLine({ x: pts[0].x, y: pts[0].y + h }, { x: pts[1].x, y: pts[1].y + h });
    var p1 = pts[0];
    var p2 = pts[1];
    var p3 = { x: pts[0].x, y: pts[0].y + h, expanded: pts[0].expanded };
    var p4 = { x: pts[1].x, y: pts[1].y + h, expanded: pts[1].expanded };

    if (p1.expanded == true) {
      var d = p2.x > p1.x ? -panel._width : panel._width;
      p1 = movePointByDistance(p1, d, line1);
      p3 = { ...movePointByDistance(p3, d, line1), expanded: p3.expanded };
    }

    if (p2.expanded == true) {
      var d = p2.x > p1.x ? panel._width : -panel._width;
      p2 = movePointByDistance(p2, d, line1);
      p4 = { ...movePointByDistance(p4, d, line1), expanded: p4.expanded };
    }

    o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");

    // if(o.color){
    ctx.beginPath();
    ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.globalAlpha = 0.2;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    if (o.fillBg == true) ctx.fill();
    ctx.globalAlpha = 1;
    // }
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  };

  this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
    Shape.prototype.renderAnchorsOverlay.call(
      this,
      o,
      octx,
      renderer,
      model,
      panel,
      seriesManager,
      { redrawAnchorsWhenSelected: true }
    );
  };

  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    var pts = ParallelChannelObject.prototype.getPoints.call(
      this,
      o,
      renderer,
      panel,
      model,
      seriesManager
    );
    if (!pts || pts.length < 3) return pts;
    var idx = Math.round((pts[0].index + pts[1].index) / 2);
    var x = renderer.getIndexPoint(idx, model) + model._midOffset;
    pts[2].index = idx;
    pts[2].x = x;
    return pts;
  };

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts || pts.length < 3) return false;
    var mid = findMidPoint(pts[0], pts[1]);
    var h = pts[2].y - mid.y;
    var hitResult = false;
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

    this.clearHits(o);

    if (
      between(pts[0].x, x, pts[1].x, self.hitTolerance) ||
      (o.anchors[0].expanded == true &&
        between(
          pts[0].x < pts[1].x ? 0 : pts[0].x,
          x,
          pts[0].x < pts[1].x ? pts[1].x : panel._width - valueAxisWidth,
          self.hitTolerance
        )) ||
      (o.anchors[1].expanded == true &&
        between(
          pts[1].x < pts[0].x ? 0 : pts[1].x,
          x,
          pts[1].x < pts[0].x ? pts[0].x : panel._width - valueAxisWidth,
          self.hitTolerance
        ))
    ) {
      var nlp1 = getLinePointNearestMouse(
        { x0: pts[0].x, y0: pts[0].y, x1: pts[1].x, y1: pts[1].y },
        x,
        y
      );
      var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
      if (distance < self.hitTolerance) {
        hitResult = true;
        o._hit = true;
      }

      if (!hitResult) {
        //line 2
        var nlp2 = getLinePointNearestMouse(
          { x0: pts[0].x, y0: pts[0].y + h, x1: pts[1].x, y1: pts[1].y + h },
          x,
          y
        );
        var distance = pointsDistance({ x: x, y: y }, { x: nlp2.x, y: nlp2.y });
        if (distance < self.hitTolerance) {
          hitResult = true;
          o._hit = true;
        }
      }

      if (hitResult) {
        drawAnchors(interactor.octx, panel, pts, self.anchorPointSize, this.anchorColor, 0.5);
        var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
        if (p) {
          o._hitAnchor = { x: p.x, y: p.y };
        }
      } else {
        // arrows??
        var p = findAnchorPointArrowForXY(
          pts,
          x,
          y,
          self.anchorPointDistanceToArrow,
          self.hitTolerance
        );
        if (p && o.selected) {
          hitResult = true;
          o._hit = true;
          o._hitArrow = { x: p.x, y: p.y };
        }
      }
    }
    return hitResult;
  };

  this.mouseDown = function (e, o, renderer, interactor, model, panel, seriesManager) {
    return Shape.prototype.mouseDownWithPanelPush.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };

  this.mouseDrag = function (e, o, renderer, interactor, model, panel, seriesManager) {
    var self = this;
    var i = interactor.currentAnchor.selected;
    if (i === 2) {
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
      o.anchors[2].value = baseAnchors[2].value + yOffset;
    } else {
      Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
    }

    // if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

    // if(i!=null){
    // 	if(i===0 || i == 1){
    // 		let index = renderer.getStampIndex(baseAnchors[i].stamp, model, seriesManager);
    // 		o.anchors[i]._index = index+xOffset;
    // 		o.anchors[i].value = baseAnchors[i].value+yOffset;
    // 		o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
    // 		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
    // 		var mid = findMidPoint(pts[0], pts[1]);
    // 		var h = pts[2].y-mid.y;
    // 		o.anchors[2]._index = Math.round((o.anchors[0]._index + o.anchors[1]._index)/2);
    // 		o.anchors[2]._value = renderer.getPriceForYCoordinate(mid.y+h, panel._height, panel.vMin, panel.vMax)+panel._offset;
    // 		o.anchors[2].stamp = renderer.getIndexStamp(o.anchors[2]._index, model, seriesManager);
    // 	}else if(i===2){
    // 		o.anchors[2].value = baseAnchors[2].value+yOffset;
    // 	}
    // }else{
    // 	for(var j=0; j< o.anchors.length ;j++){
    // 		let index = renderer.getStampIndex(baseAnchors[j].stamp, model, seriesManager);
    // 		o.anchors[j]._index = index+xOffset;
    // 		o.anchors[j].value = baseAnchors[j].value+yOffset;
    // 		o.anchors[j].stamp = renderer.getIndexStamp(o.anchors[j]._index, model, seriesManager);
    // 	}
    // }
  };

  this.mouseUp = function (e, o, renderer, interactor, model, panel, seriesManager) {
    Shape.prototype.mouseUpWithExpandableAnchors.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };

  this.mouseOut = function (e, o, renderer, interactor, model, panel, seriesManager) {
    Shape.prototype.mouseOutKeepHits.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };

  /*
   * STAGE
   */

  // this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("stage down start", interactor.currentAnchor);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 	var idx = renderer.getPointIndex (e._offset.offsetX, model)
  // 	if(interactor.currentAnchor==null){
  // 		o.anchors[0].value = v;
  // 		o.anchors[0]._index = idx;
  // 		o.anchors[1].value = v;
  // 		o.anchors[1]._index = idx;
  // 		o.anchors[2].value = v;
  // 		o.anchors[2]._index = idx;
  // 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
  // 		console.log("stage down start", ca);
  // 		return ca;
  // 	}
  // 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
  // };

  this.stageDrag = function (e, o, renderer, interactor, model, panel, seriesManager) {
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
    }
    this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
  };

  this.stageUp = function (e, o, renderer, interactor, model, panel, seriesManager) {
    return Shape.prototype.stageUp.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      seriesManager
    );
  };

  this.stageOut = function (e, o, renderer, interactor, model, panel, seriesManager) {
    // console.log("stage out");
  };

  this.stageMove = function (e, o, renderer, interactor, model, panel, seriesManager) {
    if (interactor.currentAnchor) {
      if (interactor.currentAnchor.selected === 2) {
        var fV = LIB.getReferenceValue(o, model, seriesManager);
        var v = renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV,
        });
        o.anchors[2].value = v;
      } else {
        Shape.prototype.stageMove.call(
          this,
          e,
          o,
          renderer,
          interactor,
          model,
          panel,
          seriesManager
        );
      }
    }
    // var self = this;
    // if(panel === null )return;

    // if(interactor.currentAnchor){
    // 	var i = interactor.currentAnchor.selected;
    // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
    // 	var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
    // 	var idx = renderer.getPointIndex (e._offset.offsetX, model);

    // 	if(i!=null){
    // 		if(i===0 || i == 1){
    // 			o.anchors[i]._index = idx;
    // 			o.anchors[i].value = v;
    // 			o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
    // 			var pts = self.getPoints(o, renderer, panel, model,seriesManager);
    // 			var mid = findMidPoint(pts[0], pts[1]);
    // 			var h = pts[2].y-mid.y;
    // 			var newIndex = (interactor.currentAnchor.anchors[0]._index + interactor.currentAnchor.anchors[1]._index)/2;
    // 			o.anchors[2]._index = newIndex;
    // 			o.anchors[2].value = renderer.getPriceForYCoordinate(mid.y-panel._offset, panel._height, panel.vMin, panel.vMax);
    // 			o.anchors[2].stamp = renderer.getIndexStamp(newIndex, model, seriesManager);
    // 			console.log("MID: ", mid.y, o.anchors[2].value);
    // 		}else if(i===2){
    // 			o.anchors[2].value = v;
    // 		}
    // 		console.log("stage move",i, o.anchors[i]);
    // 	}
    // }
  };
};

const ParallelChannelObjectCtor: new (...args: any[]) => any = ParallelChannelObject as any;
export { ParallelChannelObjectCtor as ParallelChannelObject };
