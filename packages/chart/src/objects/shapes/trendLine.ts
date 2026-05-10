import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  calcLine,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
  findAnchorPointArrowForXY,
  drawIndicatorMarker,
} from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
  createShapeMouseOutDelegate,
  createShapeMouseUpExpandableDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { ShapeRuntime } from "./_sharedTypes";

function TrendLineObject(this: ShapeRuntime) {
  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var fV = LIB.getReferenceValue(o, model, seriesManager);

    var line = calcLine({ x: pts[0].index, y: pts[0].value }, { x: pts[1].index, y: pts[1].value });

    var lPoint = pts[0].x < pts[1].x ? pts[0] : pts[1];
    var rPoint = pts[0].x > pts[1].x ? pts[0] : pts[1];

    ctx.beginPath();
    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();

    var startI = lPoint.expanded == true ? 0 : lPoint.index;
    var endI = rPoint.expanded == true ? model._rightIndex : rPoint.index;
    if (pts[0].x == pts[1].x) {
      var uPoint = pts[0].y < pts[1].y ? pts[0] : pts[1];
      var dPoint = pts[0].y > pts[1].y ? pts[0] : pts[1];

      if (uPoint.expanded == true) ctx.moveTo(pts[0].x, 0);
      else ctx.moveTo(pts[0].x, uPoint.y);

      if (dPoint.expanded == true) ctx.lineTo(pts[0].x, model._height);
      else ctx.lineTo(pts[0].x, dPoint.y);
    } else {
      if (panel.valueAxisMode == "lin") {
        let x1 = renderer.getIndexPoint(startI, model) + model._midOffset;
        let x2 = renderer.getIndexPoint(endI, model) + model._midOffset;
        let y1 =
          renderer.getYCoordinateForPrice(line.a * startI + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        let y2 =
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
        for (var i = startI; i <= endI; i++) {
          var lineValue = line.a * i + line.b;
          let x = renderer.getIndexPoint(i, model) + model._midOffset;
          let y =
            renderer.getYCoordinateForPrice(lineValue, {
              panelHeight: panel._height,
              minValue: panel.vMin,
              maxValue: panel.vMax,
              valueAxisMode: panel.valueAxisMode,
              fV,
            }) + panel._offset;

          if (i == model._leftIndex) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
    }

    ctx.stroke();
    ctx.closePath();

    if (o.isIndicator && o.canBeIndicator) {
      var pt = pts[0];
      if (pts[1].x < pts[0].x) pt = pts[1];
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

  this.renderOverlay = createShapeAnchorOverlayDelegate();

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

    this.clearHits(o);

    var fV = LIB.getReferenceValue(o, model, seriesManager);

    if (
      (between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
        between(pts[0].y, y, pts[1].y, self.hitTolerance + self.anchorPointDistanceToArrow)) ||
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
      if (pts[0].x == pts[1].x) {
        //vertical line
        var hDistance = pointsDistance({ x: x, y: y }, { x: pts[0].x, y: y });
        if (hDistance < self.hitTolerance) {
          hitResult = true;
          o._hit = true;
          var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
          if (p) {
            o._hitAnchor = { x: p.x, y: p.y };
          }
          var a = findAnchorPointArrowForXY(
            pts,
            x,
            y,
            self.anchorPointDistanceToArrow,
            self.hitTolerance
          );
          if (a && o.selected) {
            o._hitArrow = { x: a.x, y: a.y };
          }
        }
      } else {
        var line = calcLine(
          { x: pts[0].index, y: pts[0].value },
          { x: pts[1].index, y: pts[1].value }
        );

        var lIndex1 = renderer.getPointIndex(x, model);
        var lIndex2 = lIndex1 >= 1 ? lIndex1 - 1 : lIndex1 + 1;

        let lx1 = renderer.getIndexPoint(lIndex1, model) + model._midOffset;
        let ly1 =
          renderer.getYCoordinateForPrice(line.a * lIndex1 + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        let lx2 = renderer.getIndexPoint(lIndex2, model) + model._midOffset;
        let ly2 =
          renderer.getYCoordinateForPrice(line.a * lIndex2 + line.b, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;

        var nlp1 = getLinePointNearestMouse({ x0: lx1, y0: ly1, x1: lx2, y1: ly2 }, x, y);
        var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });

        if (distance < self.hitTolerance + self.anchorPointDistanceToArrow) {
          if (distance < self.hitTolerance) {
            hitResult = true;
            o._hit = true;
            var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
            if (p) {
              o._hitAnchor = { x: p.x, y: p.y };
            }
          }
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
    }
    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate();

  // this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	o._hitAnchor=null;
  // 	o._hitArrow=null;

  // 	var idx = interactor.currentAnchor.selected;
  // 	var baseAnchors = interactor.currentAnchor.anchors;
  // 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));

  // 	if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

  // 	if(idx!=null){
  // 		if(idx===0){
  // 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
  // 			o.anchors[0].value = baseAnchors[0].value+yOffset;
  // 		}else if(idx===1){
  // 			o.anchors[1]._index = baseAnchors[1]._index+xOffset;
  // 			o.anchors[1].value = baseAnchors[1].value+yOffset;
  // 		}
  // 	}else{
  // 		for(var i=0; i< o.anchors.length ;i++){
  // 			o.anchors[i]._index = baseAnchors[i]._index+xOffset;
  // 			o.anchors[i].value = baseAnchors[i].value+yOffset;
  // 		}
  // 	}
  // };

  this.mouseUp = createShapeMouseUpExpandableDelegate({ requireHitArrow: true });

  this.mouseOut = createShapeMouseOutDelegate();

  /*
   * STAGE
   */

  // this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("TRENDLINE stage down start", interactor.currentAnchor);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 	if(interactor.currentAnchor==null){
  // 		o.anchors[0].value = v;
  // 		o.anchors[0]._index = idx;
  // 		o.anchors[1].value = v;
  // 		o.anchors[1]._index = idx;
  // 		//panel.objects.push(o);
  // 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
  // 		console.log("TRENDLINE stage down start", ca);
  // 		return ca;
  // 	}
  // 	interactor.pushPanel(this, o, panel);
  // 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
  // };

  // this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
  // 	var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 	var yOffset = parseFloat((renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV}) - renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV})).toFixed(panel.precision));
  // 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
  // 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
  // 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
  // 		console.log("TRENDLINE long drag ");
  // 		interactor.currentAnchor.drag = true;
  // 		var i = interactor.currentAnchor.selected;
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("TRENDLINE after drag",i, o.anchors[i]);
  // 		}
  // 	}
  // 	interactor.renderOverlayedObject (this, o, panel);
  // };

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;

  // this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("TRENDLINE stage move", interactor.currentAnchor);
  // 	if(interactor.currentAnchor!==null){
  // 		var i = interactor.currentAnchor.selected;
  // 		var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("TRENDLINE stage move",i, o.anchors);
  // 		}
  // 	}
  // };
}

const TrendLineObjectCtor: import("./_sharedTypes").ShapeConstructor =
  TrendLineObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { TrendLineObjectCtor as TrendLineObject };
