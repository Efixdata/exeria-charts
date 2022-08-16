import rendererSettings from "./rendererSettings";
import ChartRenderer from "./Renderer";
import model from "./model";
import theme from "./theme";
import fusion from "./fusion";

export default class Chart {
  containerId;
  ctx;
  canvas;
  container;
  renderer;


  constructor(options) {
    this.containerId = options.containerId;
  }

  init() {
    this.container = document.getElementById(this.containerId);
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.container.append(this.canvas);
    this.draw();
  }

  draw() {
    const boundingRect = this.container.getBoundingClientRect()
    const w = boundingRect.width;
    const h = boundingRect.height;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(w, h);
    this.ctx.stroke();
  }
}