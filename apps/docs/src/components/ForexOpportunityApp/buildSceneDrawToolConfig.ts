import type { ArbSceneDrawing } from "@efixdata/exeria-chart";
import type { DrawToolConfig, ToolAnchor } from "@efixdata/exeria-chart";

const FIBON_LINES_VALUES = [0, 23.6, 38.2, 50, 61.8, 78.6, 100, 161.8];
const FIBON_LINES_VALUES_STATE = [true, true, true, true, true, true, true, false];

function withExpandableTrendAnchors(anchors: ToolAnchor[]): ToolAnchor[] {
  return anchors.map((anchor, index) => ({
    ...anchor,
    expandable: true,
    expanded: false,
    defaultDirection: index === 0 ? "left" : "right",
  }));
}

function withParallelChannelAnchors(anchors: ToolAnchor[]): ToolAnchor[] {
  return anchors.map((anchor, index) => {
    if (index >= 2) {
      return anchor;
    }

    return {
      ...anchor,
      expandable: true,
      expanded: false,
      defaultDirection: index === 0 ? "left" : "right",
    };
  });
}

export function minimumAnchorsForDrawing(type: string): number {
  switch (type) {
    case "parallelChannel":
    case "pitchfork":
    case "regressionChannel":
    case "fibonChannel":
      return 3;
    case "priceTag":
      return 1;
    default:
      return 2;
  }
}

export function buildSceneDrawToolConfig(
  drawing: ArbSceneDrawing,
  anchors: ToolAnchor[],
): DrawToolConfig {
  const base: DrawToolConfig = {
    id: drawing.id,
    type: drawing.type,
    editable: drawing.editable ?? false,
    anchors,
    width: 2,
  };
  if (drawing.color !== undefined) base.color = drawing.color;
  if (drawing.text !== undefined) base.text = drawing.text;
  if (drawing.fontSize !== undefined) base.fontSize = drawing.fontSize;
  if (drawing.fillBg !== undefined) base.fillBg = drawing.fillBg;

  switch (drawing.type) {
    case "fibonLines":
      return {
        ...base,
        width: 1,
        anchors: withExpandableTrendAnchors(anchors),
        values: FIBON_LINES_VALUES,
        valuesState: FIBON_LINES_VALUES_STATE,
        valuesCanAdd: true,
        valuesCanDelete: true,
      };
    case "fibonExtension":
      return {
        ...base,
        width: 1,
        anchors: withExpandableTrendAnchors(anchors),
        values: [0, 61.8, 100, 127.2, 141.4, 161.8, 200, 261.8],
        valuesState: [false, false, true, true, true, true, true, false],
        valuesCanAdd: true,
        valuesCanDelete: true,
      };
    case "parallelChannel":
      return {
        ...base,
        anchors: withParallelChannelAnchors(anchors),
      };
    case "trendRay":
    case "trendLine":
      return {
        ...base,
        anchors: withExpandableTrendAnchors(anchors),
      };
    default:
      return base;
  }
}
