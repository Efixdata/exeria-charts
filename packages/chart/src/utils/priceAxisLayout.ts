import { renderPriceText } from "./objects-lib";

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
  /** Right edge of the suffix column — matches ledger axis ticks. */
  suffixRightX?: number;
}

const TAG_HEIGHT = 18;
const TAG_PADDING_X = 6;

/** 1px handler line at the left edge of the collapsed value-axis band. */
export const PRICE_AXIS_DIVIDER_WIDTH = 1;
/** Gap between that divider and ledger price text (ticks + live tag). */
export const COLLAPSED_LEDGER_TEXT_GAP_PX = 2;

/** Divider X for collapsed ledger axis — 2px left of the band so tick/tag columns stay put. */
export function getCollapsedLedgerDividerX(panelStartX: number): number {
  return panelStartX - COLLAPSED_LEDGER_TEXT_GAP_PX;
}

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

  const suffixRightX = options.suffixRightX ?? model._width - model.valueAxisPadding;
  const tagWidth = Math.max(contentWidth, valueAxisWidth);
  const tagLeft = model._width - tagWidth;

  return {
    axisLeft,
    tagLeft,
    tagWidth,
    tagTop,
    tagHeight: TAG_HEIGHT,
    labelX: suffixRightX,
    textAlign: "right",
    zerosToReduce: 0,
    allowOverflowLeft: tagWidth > valueAxisWidth,
  };
}

/** Matches {@link Renderer.renderValueAxis} — axis band includes a 1px handler. */
export function getValueAxisLedgerGeometry(
  model: { _width: number; valueAxisPadding: number },
  panel: { _width?: number },
  valueAxisWidthOption: number,
): { panelStartX: number; axisWidth: number; suffixRightX: number } {
  const axisWidth = valueAxisWidthOption + 1;
  const panelWidth = Math.round(panel._width ?? model._width);
  const panelStartX = panelWidth - axisWidth;
  const suffixRightX = panelStartX + axisWidth - model.valueAxisPadding;

  return { panelStartX, axisWidth, suffixRightX };
}

export interface LedgerPriceTagLabelLayout {
  suffixRightX: number;
  columnSplitX: number;
  head: string;
  suffix: string;
}

export interface LedgerPriceTagLabelDrawOptions {
  zerosToReduce?: number;
  mode?: string;
  priceFont?: string;
  subscriptFont?: string;
}

/** Head + suffix columns aligned with the compact ledger axis. */
export function drawLedgerPriceTagLabel(
  ctx: CanvasRenderingContext2D,
  layout: LedgerPriceTagLabelLayout,
  y: number,
  drawOptions: LedgerPriceTagLabelDrawOptions = {},
): void {
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";

  const textOpts = {
    ctx,
    y,
    zerosToReduce: drawOptions.zerosToReduce ?? 0,
    mode: drawOptions.mode,
    priceFont: drawOptions.priceFont,
    subscriptFont: drawOptions.subscriptFont,
  };

  if (layout.head.length > 0) {
    renderPriceText({ ...textOpts, text: layout.head, x: layout.columnSplitX });
  }

  if (layout.suffix.length > 0) {
    renderPriceText({ ...textOpts, text: layout.suffix, x: layout.suffixRightX });
  }

  ctx.restore();
}

export const PRICE_AXIS_ANCHOR_ROW_HEIGHT = 16;
export const PRICE_AXIS_HINT_ROW_HEIGHT = 18;

export interface PriceAxisChromeLayout {
  reservedTop: number;
  reservedBottom: number;
  anchorRowY: number;
  hintCenterY: number;
  minTickY: number;
  maxTickY: number;
}

/** Anchor ledger row at top, expand control at bottom. */
export function getPriceAxisChromeLayout(
  panelOffset: number,
  panelHeight: number,
  compact: boolean,
  options: { useLedgerColumn: boolean; showExpandHint: boolean },
): PriceAxisChromeLayout {
  const topPad = compact ? 3 : 4;
  let topCursor = panelOffset + topPad;

  const anchorRowY = options.useLedgerColumn ? topCursor + PRICE_AXIS_ANCHOR_ROW_HEIGHT / 2 : 0;
  if (options.useLedgerColumn) {
    topCursor += PRICE_AXIS_ANCHOR_ROW_HEIGHT;
  }

  const bottomPad = compact ? 4 : 5;
  let reservedBottom = bottomPad;
  if (options.showExpandHint) {
    reservedBottom += PRICE_AXIS_HINT_ROW_HEIGHT;
  }

  const hintCenterY = options.showExpandHint
    ? panelOffset + panelHeight - bottomPad - PRICE_AXIS_HINT_ROW_HEIGHT / 2
    : 0;

  return {
    reservedTop: topCursor - panelOffset + 2,
    reservedBottom,
    anchorRowY,
    hintCenterY,
    minTickY: topCursor + 2,
    maxTickY: panelOffset + panelHeight - reservedBottom - 2,
  };
}

export interface LedgerAxisColumnLayout {
  suffixRightX: number;
  columnSplitX: number;
  maxSuffixWidth: number;
  maxHeadWidth: number;
}

export function layoutLedgerAxisColumn(
  ctx: CanvasRenderingContext2D,
  headText: string,
  suffixTexts: string[],
  anchorSuffixText: string,
  panelStartX: number,
  valueAxisWidth: number,
  valueAxisPadding: number,
): LedgerAxisColumnLayout {
  const suffixRightX = panelStartX + valueAxisWidth - valueAxisPadding;
  let maxSuffixWidth = 0;

  const measure = (text: string) => {
    if (!text) return;
    maxSuffixWidth = Math.max(maxSuffixWidth, ctx.measureText(text).width);
  };

  for (const text of suffixTexts) {
    measure(text);
  }
  measure(anchorSuffixText);

  const maxHeadWidth = headText ? ctx.measureText(headText).width : 0;
  const columnSplitX = suffixRightX - maxSuffixWidth;

  return {
    suffixRightX,
    columnSplitX,
    maxSuffixWidth,
    maxHeadWidth,
  };
}

export interface LedgerAxisAnchorColors {
  text: string;
  divider: string;
}

/** Pattern B — one font size; head │ suffix aligned with tick suffix column. */
export function drawLedgerAxisAnchorRow(
  ctx: CanvasRenderingContext2D,
  layout: LedgerAxisColumnLayout,
  head: string,
  suffix: string,
  y: number,
  colors: LedgerAxisAnchorColors,
): void {
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillStyle = colors.text;

  const hasHead = head.length > 0;
  const hasSuffix = suffix.length > 0;

  if (hasHead && hasSuffix) {
    ctx.strokeStyle = colors.divider;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(layout.columnSplitX + 0.5, y - 6);
    ctx.lineTo(layout.columnSplitX + 0.5, y + 6);
    ctx.stroke();
  }

  if (hasHead) {
    ctx.globalAlpha = 0.65;
    ctx.fillText(head, layout.columnSplitX, y);
  }

  if (hasSuffix) {
    ctx.globalAlpha = 1;
    ctx.fillText(suffix, layout.suffixRightX, y);
  }

  ctx.restore();
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

  ctx.globalAlpha = 0.4;
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

  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
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
