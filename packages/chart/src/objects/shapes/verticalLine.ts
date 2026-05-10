import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
  drawAnchors,
  drawAnchorsArrow,
} from "../../utils/objects-lib";
import {
  createShapeMouseDownDelegate,
  shapeStageOutDelegate,
  shapeStageUpDelegate,
} from "./_delegates";
import type { LegacyShapePoint } from "../../objectRuntimeBases";
import type {
  ShapeHitArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function VerticalLineObject(this: ShapeRuntime) {
  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    if (!panel) return [];
    var index = renderer.getStampIndex(o.anchors[0].stamp, model, seriesManager);
    var x = renderer.getIndexPoint(index, model) + model._midOffset;
    return [
      { x, y: panel._offset + this.anchorPointSize, index, value: o.anchors[0].value },
      { x, y: panel._height + panel._offset, index, value: o.anchors[0].value },
    ] as LegacyShapePoint[];
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();

    if (o.selected) {
      drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1);
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

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;

    this.clearHits(o);

    if (between(pts[0].x - 1, x, pts[1].x + 1, self.hitTolerance)) {
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

  // this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	var idx = interactor.currentAnchor.selected;
  // 	var baseAnchors = interactor.currentAnchor.anchors;
  // 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
  // 		for(var i=0; i< o.anchors.length ;i++){
  // 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
  // 			o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
  // 	}
  // };

  /*
   * STAGE
   */

  this.stageDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    var fV = LIB.getReferenceValue(o, model, seriesManager);
    var v = renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    });

    var idx = renderer.getPointIndex(e._offset.offsetX, model);
    if (interactor.currentAnchor == null) {
      o.anchors[0].value = v;
      o.anchors[0]._index = idx;
      o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
      return this.createAnchorSelection(o, 1);
    }
    interactor.pushPanel(this, o, panel);
    return this.createAnchorSelection(o, (interactor.currentAnchor.selected ?? 0) + 1);
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: import("./_sharedTypes").ShapeInteractionArgs) {
    var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
      var v = renderer.getPriceForYCoordinate(
        e._offset.offsetY - panel._offset,
        {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
        }
      );
      var idx = renderer.getPointIndex(e._offset.offsetX, model);
      o.anchors[0]._index = idx;
      o.anchors[0].value = v;
      o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
    }
  };

  this.stageUp = shapeStageUpDelegate;

  this.stageOut = shapeStageOutDelegate;

  this.stageMove = function (e, o, renderer, interactor, model, panel, seriesManager) {
    if (interactor.currentAnchor !== null) {
      var i = interactor.currentAnchor.selected;
      var fV = LIB.getReferenceValue(o, model, seriesManager);
      var v = renderer.getPriceForYCoordinate(e._offset.offsetY - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      });
      var idx = renderer.getPointIndex(e._offset.offsetX, model);
      if (i != null && i < o.anchors.length) {
        o.anchors[i]._index = idx;
        o.anchors[i].value = v;
        o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
      }
    }
  };
}

const VerticalLineObjectCtor: import("./_sharedTypes").ShapeConstructor =
  VerticalLineObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { VerticalLineObjectCtor as VerticalLineObject };
