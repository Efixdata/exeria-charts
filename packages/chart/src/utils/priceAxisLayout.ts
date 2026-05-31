export interface PriceTagLayout {
  axisLeft: number;
  tagLeft: number;
  tagWidth: number;
  tagTop: number;
  tagHeight: number;
  labelX: number;
  textAlign: CanvasTextAlign;
  zerosToReduce: number;
  allowOverflowLeft: boolean;
}

export interface PriceTagLayoutModel {
  _width: number;
  _priceAxisExpanded?: boolean;
  valueAxisPadding: number;
}

export interface PriceTagLayoutOptions {
  valueAxisWidth: number;
}

const TAG_HEIGHT = 18;
const TAG_PADDING_X = 6;

/** Layout for axis price tags — full price; may extend left of the narrow axis when collapsed. */
export function layoutPriceTag(
  model: PriceTagLayoutModel,
  options: PriceTagLayoutOptions,
  labelWidth: number,
  y: number,
): PriceTagLayout {
  const expanded = model._priceAxisExpanded === true;
  const valueAxisWidth = options.valueAxisWidth;
  const axisLeft = model._width - valueAxisWidth;
  const tagTop = Math.round(y - TAG_HEIGHT / 2);
  const contentWidth = labelWidth + TAG_PADDING_X * 2;

  if (expanded) {
    const axisInnerWidth = valueAxisWidth - model.valueAxisPadding * 2;
    return {
      axisLeft,
      tagLeft: axisLeft,
      tagWidth: valueAxisWidth,
      tagTop,
      tagHeight: TAG_HEIGHT,
      labelX:
        axisLeft + model.valueAxisPadding + Math.max(0, (axisInnerWidth - labelWidth) / 2),
      textAlign: "left",
      zerosToReduce: 0,
      allowOverflowLeft: false,
    };
  }

  const tagWidth = Math.max(contentWidth, valueAxisWidth);
  const tagLeft = model._width - tagWidth;

  return {
    axisLeft,
    tagLeft,
    tagWidth,
    tagTop,
    tagHeight: TAG_HEIGHT,
    labelX: model._width - TAG_PADDING_X,
    textAlign: "right",
    zerosToReduce: 0,
    allowOverflowLeft: tagWidth > valueAxisWidth,
  };
}

export const PRICE_AXIS_PREFIX_ROW_HEIGHT = 14;
export const PRICE_AXIS_HINT_ROW_HEIGHT = 18;

export interface PriceAxisChromeLayout {
  reservedTop: number;
  prefixY: number;
  hintCenterY: number;
  minTickY: number;
}

/** Vertical layout for prefix header + expand control at the top of the price axis. */
export function getPriceAxisChromeLayout(
  panelOffset: number,
  compact: boolean,
  options: { usePrefixHeader: boolean; showExpandHint: boolean },
): PriceAxisChromeLayout {
  const topPad = compact ? 3 : 4;
  let y = panelOffset + topPad;

  const prefixY = options.usePrefixHeader ? y + PRICE_AXIS_PREFIX_ROW_HEIGHT / 2 : 0;
  if (options.usePrefixHeader) {
    y += PRICE_AXIS_PREFIX_ROW_HEIGHT;
  }

  const hintCenterY = options.showExpandHint ? y + PRICE_AXIS_HINT_ROW_HEIGHT / 2 : 0;
  if (options.showExpandHint) {
    y += PRICE_AXIS_HINT_ROW_HEIGHT;
  }

  return {
    reservedTop: y - panelOffset + 2,
    prefixY,
    hintCenterY,
    minTickY: y + 2,
  };
}

export interface PriceAxisExpandHintLayout {
  centerX: number;
  centerY: number;
  pillWidth: number;
  pillHeight: number;
  expanded: boolean;
}

export function getPriceAxisExpandHintLayout(
  panelStartX: number,
  valueAxisWidth: number,
  centerY: number,
  expanded: boolean,
): PriceAxisExpandHintLayout {
  return {
    centerX: panelStartX + valueAxisWidth / 2,
    centerY,
    pillWidth: 24,
    pillHeight: 14,
    expanded,
  };
}

/** Draw «« (collapsed) expand control — chevrons centered inside the pill. */
export function drawPriceAxisExpandHint(
  ctx: CanvasRenderingContext2D,
  layout: PriceAxisExpandHintLayout,
  colors: { accent: string },
): void {
  const { centerX, centerY, pillWidth, pillHeight, expanded } = layout;
  const pillX = centerX - pillWidth / 2;
  const pillY = centerY - pillHeight / 2;
  const radius = 3;

  ctx.save();

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.moveTo(pillX + radius, pillY);
  ctx.lineTo(pillX + pillWidth - radius, pillY);
  ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + radius);
  ctx.lineTo(pillX + pillWidth, pillY + pillHeight - radius);
  ctx.quadraticCurveTo(
    pillX + pillWidth,
    pillY + pillHeight,
    pillX + pillWidth - radius,
    pillY + pillHeight,
  );
  ctx.lineTo(pillX + radius, pillY + pillHeight);
  ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - radius);
  ctx.lineTo(pillX, pillY + radius);
  ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.35;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const chevronSize = 3.5;
  const gap = 2.5;
  const pointLeft = !expanded;

  for (let i = 0; i < 2; i++) {
    const offset = pointLeft ? gap / 2 - i * gap : -gap / 2 + i * gap;
    const tipX = centerX + offset + (pointLeft ? -chevronSize / 2 : chevronSize / 2);
    const baseX = centerX + offset + (pointLeft ? chevronSize / 2 : -chevronSize / 2);

    ctx.beginPath();
    ctx.moveTo(baseX, centerY - chevronSize);
    ctx.lineTo(tipX, centerY);
    ctx.lineTo(baseX, centerY + chevronSize);
    ctx.stroke();
  }

  ctx.restore();
}
