import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
  drawAnchor,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";

function TextObject(this: ShapeRuntime) {
  this.cfg = {
    offsetX: 0,
    offsetY: 0,

    widthMin: 100,
    widthMax: 240,

    heightMin: 24,

    margin: 10,

    lineSpacing: 5,
    lineHeight: 14,
    lineMultiplier: 1.3,
    fontSize: 12,
  };

  this.getPoints = function (o, renderer, panel, model, seriesManager) {
    if (!panel) return [];
    if (!o.anchors[1].dragged) {
      var fV = LIB.getReferenceValue(o, model, seriesManager);
      var p0 = renderer.getYCoordinateForPrice(o.anchors[0].value, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      });
      var p1 = p0 + o._height;
      var v = renderer.getPriceForYCoordinate(p1, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV,
      });
      o.anchors[1].value = v;
    }
    var pts = TextObject.prototype.getPoints.call(this, o, renderer, panel, model, seriesManager);
    return pts;
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    const cfg =
      this.cfg ||
      {
        offsetX: 0,
        offsetY: 0,
        widthMin: 100,
        widthMax: 240,
        heightMin: 24,
        margin: 10,
        lineSpacing: 5,
        lineHeight: 14,
        lineMultiplier: 1.3,
        fontSize: 12,
      };

    o._width = cfg.widthMin;
    o._height = cfg.heightMin;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    const text = o.text ?? "";

    var x = pts[0].x;
    var y = pts[0].y;

    this.font = (o.fontSize || cfg.fontSize) + "px" + WEBRCP.utils.colorManager.getFont("fontName");
    const lineHeight = o.fontSize ? o.fontSize * cfg.lineMultiplier : cfg.lineHeight;
    this.lineHeight = lineHeight;

    ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.font = this.font;

    var wrapped = wrap(text, cfg.widthMax - 2 * cfg.margin, ctx);
    o._width = wrapped.width + 2 * cfg.margin;
    o._height = wrapped.text.length * lineHeight + cfg.margin * 1.5;

    if (o.fillBg) {
      ctx.beginPath();
      if (o.anchors[1].dragged) {
        ctx.moveTo(x - cfg.offsetX, y - cfg.offsetY);

        if (pts[1].y < pts[0].y) {
          ctx.lineTo(x - cfg.offsetX + o._width / 2 - 10, y - cfg.offsetY);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.lineTo(x - cfg.offsetX + o._width / 2 + 10, y - cfg.offsetY);
          ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY);
          ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY + o._height);
          ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY + o._height);
        } else if (pts[1].y > pts[0].y + o._height) {
          ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY);
          ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY + o._height);
          ctx.lineTo(x - cfg.offsetX + o._width / 2 + 10, y - cfg.offsetY + o._height);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.lineTo(x - cfg.offsetX + o._width / 2 - 10, y - cfg.offsetY + o._height);
          ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY + o._height);
        } else {
          if (pts[1].x > pts[0].x + o._width) {
            ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY);
            ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY + o._height / 2 - 10);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY + o._height / 2 + 10);
            ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY + o._height);
            ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY + o._height);
          } else if (pts[1].x < pts[0].x) {
            ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY);
            ctx.lineTo(x - cfg.offsetX + o._width, y - cfg.offsetY + o._height);
            ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY + o._height);
            ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY + o._height / 2 + 10);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY + o._height / 2 - 10);
          } else {
            ctx.rect(x - cfg.offsetX, y - cfg.offsetY, o._width, o._height);
          }
        }
        ctx.lineTo(x - cfg.offsetX, y - cfg.offsetY);
      } else {
        ctx.rect(x - cfg.offsetX, y - cfg.offsetY, o._width, o._height);
      }
      ctx.fill();
    }
    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.fillStyle = o.fillBg
      ? WEBRCP.utils.getContrastColor(
          color,
          WEBRCP.utils.colorManager.getColor("darkTextColor"),
          "#ffffff"
        )
      : color;

    for (let index = 0; index < wrapped.text.length; index += 1) {
      ctx.fillText(
        wrapped.text[index],
        x + cfg.offsetX + cfg.margin,
        y +
          cfg.offsetY +
          cfg.margin +
          ((index + 1) * lineHeight - (o.fontSize || cfg.fontSize) / 2)
      );
    }
    ctx.closePath();

    function wrap(text: string, maxWidth: number, ctx: CanvasRenderingContext2D) {
      var wrapped = [];
      var width = 0;

      var words = text.split("\n").join(" \n").split(" ");
      var line = "";

      for (var n = 0; n < words.length; n++) {
        if (words[n].startsWith("\n") || words[n].startsWith("\r")) {
          words[n] = words[n].replace("\n", "").replace("\r", "");
          wrapped.push(line);
          var lw = ctx.measureText(line).width;
          width = lw > width ? lw : width;
          line = "";
        }
        var testLine = line + words[n] + " ";
        var testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && n > 0) {
          wrapped.push(line);
          var lw = ctx.measureText(line).width;
          width = lw > width ? lw : width;
          line = words[n].replace("\n", "").replace("\r", "") + " ";
        } else {
          width = testWidth > width ? testWidth : width;
          line = testLine;
        }
      }
      if (line.length > 0) wrapped.push(line);
      var lw = ctx.measureText(line).width;
      width = lw > width ? lw : width;
      return { text: wrapped, width: width };
    }

    this.postRender(o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderOverlay = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);

    if (o._hitAnchor) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
          if ((i == 1 && o.fillBg) || i == 0)
            drawAnchor(ctx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5);
      }
    }

    if (o._hit) {
      drawAnchor(ctx, panel, pts[0], this.anchorPointSize, this.anchorColor, 1);
      if (o.fillBg) drawAnchor(ctx, panel, pts[1], this.anchorPointSize, this.anchorColor, 1);
    }

    if (o.selected) {
      drawAnchor(ctx, panel, pts[0], this.anchorPointSize, this.anchorColor, 1);
      if (o.fillBg) drawAnchor(ctx, panel, pts[1], this.anchorPointSize, this.anchorColor, 1);
    }
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;

    if (
      between(pts[0].x, x, pts[0].x + o._width, self.hitTolerance) &&
      between(pts[0].y, y, pts[0].y + o._height, self.hitTolerance)
    ) {
      hitResult = true;
      o._hit = { x: x, y: y };
      var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
      if (p) {
        o._hitAnchor = { x: p.x, y: p.y };
      }
    }

    if (
      between(pts[1].x - 1, x, pts[1].x + 1, self.hitTolerance) &&
      between(pts[1].y - 1, y, pts[1].y + 1, self.hitTolerance)
    ) {
      hitResult = true;
      o._hit = { x: x, y: y };
      o._hitAnchor = { x: pts[1].x, y: pts[1].y };
    }
    return hitResult;
  };

  this.lastClickStamp = 0;
  this.mouseDown = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeLifecycleArgs) {
    const now = Date.now();
    const lastClickStamp = this.lastClickStamp ?? 0;
    if (now < lastClickStamp + 600) {
      this.lastClickStamp = 0;
      interactor.chart.requestObjectText(o, "text", o.text);
    } else this.lastClickStamp = now;

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

  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
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

    if (idx == 0) {
      var index0 = renderer.getStampIndex(baseAnchors[0].stamp, model, seriesManager);
      o.anchors[0]._index = index0 + xOffset;
      o.anchors[0].value = baseAnchors[0].value + yOffset;
      o.anchors[0].stamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
      if (!o.anchors[1].dragged) {
        var index1 = renderer.getStampIndex(baseAnchors[1].stamp, model, seriesManager);
        o.anchors[1]._index = index1 + xOffset;
        o.anchors[1].value = baseAnchors[1].value + yOffset;
        o.anchors[1].stamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
      }
    } else if (idx == 1) {
      var index11 = renderer.getStampIndex(baseAnchors[1].stamp, model, seriesManager);
      o.anchors[1]._index = index11 + xOffset;
      o.anchors[1].value = baseAnchors[1].value + yOffset;
      o.anchors[1].dragged = true;
      o.anchors[1].stamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
    } else {
      for (var i = 0; i < o.anchors.length; i++) {
        if (!o.anchors[i].dragged) {
          var ix = renderer.getStampIndex(baseAnchors[i].stamp, model, seriesManager);
          o.anchors[i]._index = ix + xOffset;
          o.anchors[i].value = baseAnchors[i].value + yOffset;
          o.anchors[i].stamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
        }
      }
    }
  };

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
      o.anchors[1].value = v;
      o.anchors[1]._index = idx;
      o.anchors[1].stamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
      return this.createAnchorSelection(o, 1);
    }
    interactor.pushPanel(this, o, panel);
    return this.createAnchorSelection(o, (interactor.currentAnchor.selected ?? 0) + 1);
  };

  this.stageDrag = function () {};

  this.stageUp = function (...[e, o, renderer, interactor, model, panel]: ShapeLifecycleArgs) {
    return Shape.prototype.stageUpWithSelectionLimit.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      1
    );
  };

  this.stageOut = function (...[e, o, renderer, interactor, model, panel]: ShapeLifecycleArgs) {
    return Shape.prototype.stageUpWithSelectionLimit.call(
      this,
      e,
      o,
      renderer,
      interactor,
      model,
      panel,
      1
    );
  };

  // this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
  // 	if(interactor.currentAnchor!==null){
  // 		var i = interactor.currentAnchor.selected;
  // 		var fV = LIB.getReferenceValue(o, model, seriesManager);
  // 		var v = renderer.getPriceForYCoordinate(e._offset.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});
  // 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
  // 		if(i!=null && i < o.anchors.length){
  // 			o.anchors[i]._index = idx;
  // 			console.log("TEXT ANNOTATION stage move",i, o.anchors);
  // 		}
  // 		//interactor.renderOverlayedObject (this, o, panel);
  // 	}
  // };
}

const TextObjectCtor: import("./_sharedTypes").ShapeConstructor =
  TextObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { TextObjectCtor as TextObject };
