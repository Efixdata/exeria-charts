import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  pointsDistance,
  getLinePointNearestMouse,
  findAnchorPointForXY,
  findAnchorPointArrowForXY,
  drawAnchor,
  drawAnchors,
  drawAnchorArrow,
  drawAnchorsArrow,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";
import type { ShapeHitArgs, ShapeInteractionArgs, ShapeLifecycleArgs, ShapeRuntime } from "./_sharedTypes";

function AbcdObject(this: ShapeRuntime) {
  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    var valueLevelsObject = o as LegacyValueLevelsShapeObject;
    var pts = AbcdObject.prototype.getPoints.call(this, o, renderer, panel, model, seriesManager);

    var xLength = pts[0].x - pts[1].x;
    var yLength = pts[0].y - pts[1].y;
    var x = pts[2].x - (xLength * valueLevelsObject.values[valueLevelsObject.values.length - 1]) / 100;
    var y = pts[2].y - (yLength * valueLevelsObject.values[valueLevelsObject.values.length - 1]) / 100;
    var index = renderer.getPointIndex(x, model);
    pts.push({
      x: x,
      y: y,
      stamp: renderer.getIndexStamp(index, model, seriesManager),
      expandable: true,
      expanded: pts[2].expanded,
    });

    pts[2].expandable = false;
    pts[2].expanded = false;
    return pts;
  };

  this.render = function (o, ctx, renderer, model, panel, seriesManager) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    this.drawLevelPoints(pts, o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
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

  this.drawLevelPoints = function (pts, o, ctx, renderer, model, panel, seriesManager) {
    var valueLevelsObject = o as LegacyValueLevelsShapeObject;
    var xLength = pts[0].x - pts[1].x;
    var yLength = pts[0].y - pts[1].y;

    var p = 2;
    if (
      model.instrumentsSeries[0] &&
      model.instrumentsSeries[0].instrument &&
      model.instrumentsSeries[0].instrument.precision
    ) {
      p = model.instrumentsSeries[0].instrument.precision;
    }

    var expanded = o.anchors[2].expanded;

    for (var i = 0; i < valueLevelsObject.values.length; i++) {
      var level = valueLevelsObject.values[i];
      var enabled = valueLevelsObject.valuesState[i];
      if (enabled == true) {
        var levelX = pts[2].x - (xLength * level) / 100;
        var levelY = pts[2].y - (yLength * level) / 100;

        var fV = LIB.getReferenceValue(o, model, seriesManager);
        var y =
          renderer.getPriceForYCoordinate(levelY, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV,
          }) + panel._offset;
        var text = level + "% (" + y.toFixed(p) + ")";

        if (i == valueLevelsObject.values.length - 1) {
          ctx.moveTo(pts[2].x, pts[2].y);
          ctx.lineTo(levelX, levelY);
        }

        ctx.beginPath();
        ctx.moveTo(levelX - 5, levelY);
        if (!expanded) ctx.lineTo(levelX + 5, levelY);
        else {
          ctx.setLineDash([3, 3]);
          ctx.lineTo(model._width, levelY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillText(text, levelX + 7, levelY - 2);
      }
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;

    this.clearHits(o);

    if (pts.length >= 2)
      for (var i = 1; i < pts.length; i++) {
        if (
          between(pts[i - 1].x, x, pts[i].x, self.hitTolerance + self.anchorPointDistanceToArrow) &&
          between(pts[i - 1].y, y, pts[i].y, self.hitTolerance + self.anchorPointDistanceToArrow)
        ) {
          var nlp1 = getLinePointNearestMouse(
            { x0: pts[i - 1].x, y0: pts[i - 1].y, x1: pts[i].x, y1: pts[i].y },
            x,
            y
          );
          var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });

          if (
            distance < self.hitTolerance &&
            between(pts[i - 1].x, x, pts[i].x, self.hitTolerance) &&
            between(pts[i - 1].y, y, pts[i].y, self.hitTolerance)
          ) {
            hitResult = true;
            o._hit = true;
            var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
            if (p) {
              o._hitAnchor = { x: p.x, y: p.y };
            }
            break;
          } else {
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

      this.mouseDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    var self = this;
    this.wasDrag = false;
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
        return this.createAnchorSelection(o, i);
      }
    }
    return this.createAnchorSelection(o, null);
  };

  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    if (interactor.currentAnchor.selected === 3) interactor.currentAnchor.selected = null;
    Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
  };

  this.mouseUp = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    var self = this;
    var pts = self.getPoints(o, renderer, panel, model, seriesManager);
    if (!this.wasDrag) {
      if (
        interactor.isOver(
          e._offset.offsetX,
          e._offset.offsetY,
          pts[3].x,
          pts[3].y + this.anchorPointDistanceToArrow,
          self.hitTolerance
        )
      ) {
        this.expandAnchor(o.anchors[2]);
      }
    }
    interactor.popPanel(this, o, panel);
  };

  this.stageDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
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
        {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
        }
      );
      var idx = renderer.getPointIndex(e._offset.offsetX, model);
      if (i != null && i < o.anchors.length) {
        o.anchors[i]._index = idx;
        o.anchors[i].value = v;
        o.anchors[i].stamp = renderer.getIndexStamp(idx, model, seriesManager);

        for (var ii = i + 1; ii < o.anchors.length; ii++) {
          o.anchors[ii].value = v;
          o.anchors[ii]._index = idx;
          o.anchors[i].stamp = renderer.getIndexStamp(idx, model, seriesManager);
        }
      }
    }
  };

  this.stageUp = function (...[, o, , interactor, , panel]: ShapeLifecycleArgs) {
    interactor.popPanel(this, o, panel);

    if (
      interactor.currentAnchor &&
      interactor.currentAnchor.drag &&
      interactor.currentAnchor.selected != null
    )
      interactor.currentAnchor.selected++;

    if (
      interactor.currentAnchor !== null &&
      interactor.currentAnchor.selected != null &&
      interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length
    ) {
      o.hidden = false;
      interactor.currentAnchor = null;
      return true;
    }
  };

  this.stageOut = function (...[, o, , interactor, , panel]: ShapeLifecycleArgs) {
    interactor.popPanel(this, o, panel);

    if (
      interactor.currentAnchor &&
      interactor.currentAnchor.drag &&
      interactor.currentAnchor.selected != null
    )
      interactor.currentAnchor.selected++;

    if (
      interactor.currentAnchor !== null &&
      interactor.currentAnchor.selected != null &&
      interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length
    ) {
      o.hidden = false;
      interactor.currentAnchor = null;
      return true;
    }
  };

  // this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	console.log("ABCD stage move", interactor.currentAnchor);
  // 	if(interactor.currentAnchor!==null){
  // 		var i = interactor.currentAnchor.selected;
  // 		var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			o.anchors[i].value = v;
  // 			console.log("ABCD stage move",i, o.anchors);
  // 		}
  // 	}
  // };
}

const AbcdObjectCtor: import("./_sharedTypes").ShapeConstructor =
  AbcdObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { AbcdObjectCtor as AbcdObject };
