import WEBRCP from "../../WebRCP";
import {
  between,
} from "../../utils/objects-lib";
import type {
  RuntimeObjectConstructor,
  SeriesRuntime,
} from "./_sharedTypes";

type MovePaneArrowOptions = {
  color: string;
  alpha: number;
  width: number;
  height: number;
  offsetY: number;
  offsetX: number;
  spacing: number;
};

type MovePaneArrowsHitResult = false | { type: "MovePaneArrows"; arrow: "up" | "dn" };

var MovePaneArrows = function (this: SeriesRuntime) {
  const opts: MovePaneArrowOptions = {
    color: WEBRCP.utils.colorManager.getColor("iconColor"),
    alpha: 0.54,
    width: 8,
    height: 6,
    offsetY: 12,
    offsetX: 8, //-w*2-spacing
    spacing: 8,
  };
  this.opts = opts;

  this.getMenuItems = function () {
    return null;
  };

  this.hitTolerance = 2;

  this.render = function (_o, ctx) {
    var color = WEBRCP.utils.colorManager.getColor("iconColor");
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.globalAlpha = this.opts.alpha;
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  this.init = function () {};

  this.postRender = function () {};
  this.updateExtremes = function () {};

  this.hit = function (x, y, _o, renderer, interactor, _model, panel) {
    var self = this;
    var hitResult: MovePaneArrowsHitResult = false;
    const valueAxisWidth = renderer.getPriceRenderingOptions().valueAxisWidth;

    var x1 =
      panel._width - valueAxisWidth - this.opts.offsetX - this.opts.width * 2 - this.opts.spacing;
    var x2 = panel._width - valueAxisWidth - this.opts.offsetX - this.opts.width;

    var y1 = panel._offset + this.opts.offsetY;
    var y2 = panel._offset + this.opts.offsetY + this.opts.height;

    if (between(y1, y, y2, self.hitTolerance)) {
      //upper arrow
      if (between(x1, x, x1 + this.opts.width, self.hitTolerance)) {
        hitResult = { type: "MovePaneArrows", arrow: "up" };
        interactor.octx.globalAlpha = 1;
        interactor.octx.fillStyle = this.opts.color;
        interactor.octx.strokeStyle = this.opts.color;
        //var arrowUp = createArrowUp(panel, interactor.renderer, this.opts);
        //drawArrow(interactor.octx,arrowUp);
      }
      //down arrow
      else if (between(x2, x, x2 + this.opts.width, self.hitTolerance)) {
        hitResult = { type: "MovePaneArrows", arrow: "dn" };
        interactor.octx.globalAlpha = 1;
        interactor.octx.fillStyle = this.opts.color;
        interactor.octx.strokeStyle = this.opts.color;
        //var arrowDn = createArrowDn(panel, model, this.opts);
        //drawArrow(interactor.octx,arrowDn);
      }
    }
    return hitResult;
  };

  this.mouseDown = function () {};

  this.mouseDrag = function () {};

  this.mouseUp = function (_event, o, _renderer, interactor, _model, panel) {
    interactor.movePanelUpDn(panel, o);
  };

  this.mouseOut = function () {};
};

const MovePaneArrowsCtor = MovePaneArrows as unknown as RuntimeObjectConstructor<SeriesRuntime>;
export { MovePaneArrowsCtor as MovePaneArrows };
