import WEBRCP from "../WebRCP";

interface PointLike {
  x: number;
  y: number;
  [key: string]: any;
}

interface CircleLike extends PointLike {
  r: number;
}

interface LineRange {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface LinearEquation {
  a: number;
  b: number;
}

interface PanelLike {
  _width: number;
  _height: number;
  _offset: number;
  [key: string]: any;
}

interface AnchorPoint extends PointLike {
  expandable?: boolean;
  dir?: string;
  expanded?: boolean;
}

interface PriceTextOptions {
  text?: string;
  ctx: CanvasRenderingContext2D | null;
  x?: number;
  y?: number;
  priceFont?: string;
  subscriptFont?: string;
  zerosToReduce?: number;
  mode?: string;
}

interface PriceMeasureOptions {
  text?: string;
  ctx: CanvasRenderingContext2D | null;
  priceFont?: string;
  subscriptFont?: string;
  zerosToReduce?: number;
  mode?: string;
}

export function isPointInCircle(circle: CircleLike, x: number, y: number): boolean {
  return Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2) < Math.pow(circle.r, 2);
}

export function pointsDistance(point1: PointLike, point2: PointLike): number {
  const dx2 = point1.x - point2.x;
  const dy2 = point1.y - point2.y;
  return Math.abs(Math.sqrt(dx2 * dx2 + dy2 * dy2));
}

export function findMidPoint(point1: PointLike, point2: PointLike): PointLike {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  };
}

export function getLinePointNearestMouse(line: LineRange, x: number, y: number): PointLike {
  const lerp = (a: number, b: number, amount: number) => a + amount * (b - a);
  const dx = line.x1 - line.x0;
  const dy = line.y1 - line.y0;
  const t = ((x - line.x0) * dx + (y - line.y0) * dy) / (dx * dx + dy * dy);

  return {
    x: lerp(line.x0, line.x1, t),
    y: lerp(line.y0, line.y1, t),
  };
}

export function calcLine(p1: PointLike, p2: PointLike): LinearEquation {
  const a = (p2.y - p1.y) / (p2.x - p1.x);
  const b = p1.y - a * p1.x;
  return { a, b };
}

export function calcPointOnPerpendicularLine(baseLine: LinearEquation, point: PointLike, distance: number): PointLike {
  if (baseLine.a === 0) {
    return { x: point.x, y: point.y + distance };
  }

  if (!Number.isFinite(baseLine.a)) {
    return { x: point.x + distance, y: point.y };
  }

  const c = Math.sqrt(1 + (1 / baseLine.a) * (1 / baseLine.a));
  return {
    x: point.x + distance / c,
    y: point.y - (distance / baseLine.a) / c,
  };
}

export function movePointByDistance(point: PointLike, distance: number, byLine: LinearEquation): PointLike {
  if (byLine.a === 0) {
    return { x: point.x + distance, y: point.y };
  }

  if (!Number.isFinite(byLine.a)) {
    return { x: point.x, y: point.y + distance };
  }

  const r = Math.sqrt(1 + byLine.a * byLine.a);
  const dx = distance / r;
  const dy = byLine.a * dx;

  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

export function between(min: number, point: number, max: number, tolerance = 0): boolean {
  if (min <= max && point > min - tolerance && point < max + tolerance) {
    return true;
  }

  if (min > max && point > max - tolerance && point < min + tolerance) {
    return true;
  }

  return point === min || point === max;
}

export function findAnchorPointForXY(points: AnchorPoint[], x: number, y: number, tolerance: number): AnchorPoint | null {
  let result: AnchorPoint | null = null;
  points.forEach((point) => {
    if (isPointInCircle({ x, y, r: tolerance }, point.x, point.y)) {
      result = point;
    }
  });
  return result;
}

export function findAnchorPointArrowForXY(
  points: AnchorPoint[],
  x: number,
  y: number,
  distance: number,
  tolerance: number,
): AnchorPoint | null {
  let result: AnchorPoint | null = null;
  points.forEach((point) => {
    if (point.expandable && isPointInCircle({ x, y, r: tolerance }, point.x, point.y + distance)) {
      result = point;
    }
  });
  return result;
}

export function drawAnchor(
  ctx: CanvasRenderingContext2D,
  panel: PanelLike,
  point: PointLike,
  radius: number,
  color: string,
  alpha: number,
): void {
  if (!between(0, point.x, panel._width) || !between(panel._offset, point.y, panel._offset + panel._height)) {
    return;
  }

  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.closePath();
  ctx.globalAlpha = 1;
}

export function drawAnchors(
  ctx: CanvasRenderingContext2D,
  panel: PanelLike,
  points: PointLike[],
  radius: number,
  color: string,
  alpha: number,
): void {
  for (const point of points) {
    if (!between(0, point.x, panel._width) || !between(panel._offset, point.y, panel._offset + panel._height)) {
      continue;
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1;
  }
}

export function drawAnchorArrow(
  ctx: CanvasRenderingContext2D,
  _panel: PanelLike,
  point: AnchorPoint,
  size: number,
  distance: number,
  color: string,
  alpha: number,
): void {
  let direction = point.dir === "left" ? -1 : 1;
  if (point.expanded === true) {
    direction = -direction;
  }

  const { x, y } = point;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - (direction * size) / 2, y + distance - size / 2);
  ctx.lineTo(x + (direction * size) / 2, y + distance);
  ctx.lineTo(x - (direction * size) / 2, y + distance + size / 2);
  ctx.lineTo(x - (direction * size) / 2, y + distance - size / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.closePath();
}

export function drawAnchorsArrow(
  ctx: CanvasRenderingContext2D,
  panel: PanelLike,
  points: AnchorPoint[],
  size: number,
  distance: number,
  color: string,
  alpha: number,
): void {
  for (const point of points) {
    if (!between(0, point.x, panel._width) || !between(panel._offset, point.y, panel._offset + panel._height)) {
      continue;
    }

    if (point.expandable) {
      drawAnchorArrow(ctx, panel, point, size, distance, color, alpha);
    }
  }
}

export function drawIndicatorMarker(
  ctx: CanvasRenderingContext2D,
  panel: PanelLike,
  point: PointLike,
  radius: number,
  color: string,
  alpha: number,
): void {
  const x = point.x + radius;
  const y = point.y - radius - 13;

  if (!between(0, x, panel._width) || !between(panel._offset, y, panel._offset + panel._height)) {
    return;
  }

  ctx.restore();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0.7 * Math.PI, 2.5 * Math.PI);
  ctx.lineTo(x - radius, y + radius + 11);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.moveTo(x - 6.5, y + 3.5);
  ctx.lineTo(x - 4.5, y - 2.5);
  ctx.lineTo(x - 1.5, y + 6.5);
  ctx.lineTo(x + 1.5, y - 5.5);
  ctx.lineTo(x + 3.5, y + 0.5);
  ctx.lineTo(x + 5.5, y - 5.5);
  ctx.stroke();
  ctx.closePath();

  ctx.globalAlpha = 1;
}

export function renderPriceText(options: PriceTextOptions): void {
  const {
    text = "",
    ctx,
    x = 0,
    y = 0,
    mode,
    zerosToReduce = 0,
  } = options;
  let { priceFont, subscriptFont } = options;

  if (!ctx) {
    return;
  }

  if (!priceFont) {
    priceFont = WEBRCP.utils.colorManager.getFont("price");
  }

  if (!subscriptFont) {
    subscriptFont = WEBRCP.utils.colorManager.getFont("priceSubscript");
  }

  ctx.font = priceFont;

  if (!text.includes(".") || zerosToReduce < 4 || mode === "perc") {
    ctx.fillText(text, x, y);
    return;
  }

  const [beforeDot, afterDot = ""] = text.split(".");
  const zerosLabel = String(zerosToReduce);

  let currentText = `${beforeDot}.(0`;
  ctx.fillText(currentText, x, y);
  let currentX = x + ctx.measureText(currentText).width + 1;

  ctx.font = subscriptFont;
  ctx.fillText(zerosLabel, currentX, y + 2);
  currentX += ctx.measureText(zerosLabel).width + 1;

  ctx.font = priceFont;
  currentText = `)${afterDot.slice(zerosToReduce)}`;
  ctx.fillText(currentText, currentX, y);
}

export function measurePriceTextWidth(options: PriceMeasureOptions): number {
  const {
    text = "",
    ctx,
    mode,
    zerosToReduce = 0,
  } = options;
  let { priceFont, subscriptFont } = options;

  if (!ctx) {
    return 0;
  }

  if (!priceFont) {
    priceFont = WEBRCP.utils.colorManager.getFont("price");
  }

  if (!subscriptFont) {
    subscriptFont = WEBRCP.utils.colorManager.getFont("priceSubscript");
  }

  ctx.font = priceFont;

  if (!text.includes(".") || zerosToReduce < 4 || mode === "perc") {
    return ctx.measureText(text).width;
  }

  const [beforeDot, afterDot = ""] = text.split(".");
  const zerosLabel = String(zerosToReduce);

  let currentText = `${beforeDot}.(0`;
  let width = ctx.measureText(currentText).width + 1;

  ctx.font = subscriptFont;
  width += ctx.measureText(zerosLabel).width + 1;
  ctx.font = priceFont;
  currentText = `)${afterDot.slice(zerosToReduce)}`;
  width += ctx.measureText(currentText).width;

  return Math.ceil(width);
}

export function roundAndTranslate(coordinate: number): number {
  return Math.round(coordinate) - 0.5;
}