import * as React from "react";
import { ReactElement, useState, useContext, useEffect } from "react";
import styled from "styled-components";
// @ts-ignore
import {
  Fibonacci,
  FibonacciExtension,
  FibonacciTimeZone,
  FibonacciChannel,
  FibonacciArcs,
  FibonacciCircles,
  Channel,
  Pitchfork,
  GannFan,
  GannGrid,
  GannBox,
  Triangle,
  Arrow,
  LineTrend,
  LineHorizontal,
  LineVertical,
  CrossLine,
  LineMulti,
  Abcd,
  Oval,
  RangeVertical,
  RangeHorizontal,
  TimeRange,
  Cycles,
  Rectangle,
  Brush,
  RegressionChannel,
  VolumeProfile,
  Text,
  PriceTag,
  LongPosition,
  ShortPosition,
} from "../../img/icons/tools/index.js";
import { IconButton, SplitButton } from "ui";
import ContainerOffsetContext from "../../contexts/ContainerOffsetContext";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";
import { getDrawingToolLabelKey } from "@efixdata/exeria-chart";
import { Eraser } from "../../img/icons/cursors";

interface DrawingToolsProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

interface DrawingToolsContextValue {
  selectedTool: string;
  containerOffset: React.ContextType<typeof ContainerOffsetContext>;
  resolveToolLabel: (toolProps: DrawingToolProps) => string;
  renderDrawingTool: (tool: DrawingTool) => React.ReactElement;
  renderSplitButton: (ids: string[], defaultOption: string) => React.ReactElement | null;
  renderAnnotationSplitButton: () => React.ReactElement | null;
  drawingTools: Record<string, DrawingTool>;
}

const DrawingToolsContext = React.createContext<DrawingToolsContextValue | null>(null);

function useDrawingToolsContext() {
  const context = React.useContext(DrawingToolsContext);
  if (!context) {
    throw new Error("Drawing tools components must be used within DrawingToolsProvider");
  }
  return context;
}

export const DrawingToolsProvider = (props: { chart: NullableChartInstance; children: React.ReactNode }) => {
  const value = useDrawingToolsState(props.chart);
  return <DrawingToolsContext.Provider value={value}>{props.children}</DrawingToolsContext.Provider>;
};

export const MainDrawingTools = () => {
  const { renderSplitButton } = useDrawingToolsContext();

  const lines = renderSplitButton(
    ["channel", "hLine", "hRay", "vLine", "vRay", "crossLine", "mLine", "trend", "trendRay"],
    "trend",
  );
  const shapes = renderSplitButton(["brush", "arrow", "ellipse", "triangle", "box"], "brush");
  const analyticalTools = renderSplitButton(
    [
      "abcd",
      "cycle",
      "pitchfork",
      "regressionChannel",
      "fixedRangeVolumeProfile",
      "gannFan",
      "gannGrid",
      "gannBox",
      "hRange",
      "vRange",
      "timeRange",
    ],
    "abcd",
  );
  const fibTools = renderSplitButton(
    ["fibon", "fibonExtension", "fibonTimeZone", "fibonChannel", "fibonArcs", "fibonCircles"],
    "fibon",
  );
  const positions = renderSplitButton(["longPosition", "shortPosition"], "longPosition");

  return (
    <Container>
      {lines}
      {shapes}
      {analyticalTools}
      {fibTools}
      {positions}
    </Container>
  );
};

export const AnnotationToolsSplit = () => {
  const { renderAnnotationSplitButton } = useDrawingToolsContext();
  return renderAnnotationSplitButton();
};

export const DrawingTools = (props: DrawingToolsProps) => {
  return (
    <DrawingToolsProvider chart={props.chart}>
      <Container style={props.style}>
        <MainDrawingTools />
        <AnnotationToolsSplit />
      </Container>
    </DrawingToolsProvider>
  );
};

interface DrawingToolAnchor {
  stamp: number;
  offset: number;
  value: number;
  _index: number;
  expandable?: boolean;
  expanded?: boolean;
  defaultDirection?: "left" | "right";
}

interface DrawingToolProps {
  id: string;
  type: string;
  name: string;
  defaultColor: string;
  order: number;
  sticky?: boolean;
  width?: number;
  dash?: number[];
  values?: number[];
  valuesState?: boolean[];
  valuesCanDelete?: boolean;
  valuesCanAdd?: boolean;
  fillBg?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  anchors: DrawingToolAnchor[];
  canBeIndicator?: boolean;
  text?: string;
  isIndicator?: boolean;
  setAnchorValue?: number[];
  flipped?: boolean;
  style?: string;
  priceMarker?: boolean;
  fontSize?: number;
  direction?: "LONG" | "SHORT";
  textColor?: string;
  secondaryColor?: string;
  editable?: boolean;
  startTime?: number | "now";
  timeRange?: number;
}

interface DrawingTool {
  icon: ReactElement;
  props: DrawingToolProps;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

function useDrawingToolsState(chart: NullableChartInstance): DrawingToolsContextValue {
  const t = useChartTranslate(chart);

  const resolveToolLabel = (toolProps: DrawingToolProps) => {
    if (toolProps.id === "fibon") {
      return t("drawing_tool_fibonacci_retracement", toolProps.name);
    }
    if (toolProps.id === "longPosition") {
      return t("drawing_tool_long_position", toolProps.name);
    }
    if (toolProps.id === "shortPosition") {
      return t("drawing_tool_short_position", toolProps.name);
    }

    const labelKey = getDrawingToolLabelKey(toolProps.type);
    return labelKey ? t(labelKey, toolProps.name) : toolProps.name;
  };

  const drawingTools: { [index: string]: DrawingTool } = {
    fibon: {
      icon: <Fibonacci />,
      props: {
        id: "fibon",
        type: "fibonLines",
        name: "Fibonacci Retracement",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100, 161.8, 261.8, 423.6],
        valuesState: [true, true, true, true, true, true, true, false, false, false],
        valuesCanDelete: true,
        valuesCanAdd: true,
        fillBg: false,
        anchors: [
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "left",
          },
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "right",
          },
        ],
        order: 6,
      },
    },
    fibonExtension: {
      icon: <FibonacciExtension />,
      props: {
        id: "fibonExtension",
        type: "fibonExtension",
        name: "Fibonacci Extension",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [0, 61.8, 100, 127.2, 141.4, 161.8, 200, 261.8, 361.8, 423.6],
        valuesState: [false, false, true, true, true, true, true, true, false, false],
        valuesCanDelete: true,
        valuesCanAdd: true,
        fillBg: false,
        anchors: [
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "left",
          },
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "right",
          },
        ],
        order: 7,
      },
    },
    fibonTimeZone: {
      icon: <FibonacciTimeZone />,
      props: {
        id: "fibonTimeZone",
        type: "fibonTimeZone",
        name: "Fibonacci Time Zone",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987],
        valuesState: [true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false],
        valuesCanDelete: true,
        valuesCanAdd: true,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 8,
      },
    },
    fibonChannel: {
      icon: <FibonacciChannel />,
      props: {
        id: "fibonChannel",
        type: "fibonChannel",
        name: "Fibonacci Channel",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100, 161.8, 261.8, 423.6],
        valuesState: [true, true, true, true, true, true, true, false, false, false],
        valuesCanDelete: true,
        valuesCanAdd: true,
        fillBg: false,
        anchors: [
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "left",
          },
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "right",
          },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 9,
      },
    },
    fibonArcs: {
      icon: <FibonacciArcs />,
      props: {
        id: "fibonArcs",
        type: "fibonArcs",
        name: "Fibonacci Arcs",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100],
        valuesState: [false, true, true, true, true, true, true],
        valuesCanDelete: true,
        valuesCanAdd: true,
        fillBg: false,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 10,
      },
    },
    fibonCircles: {
      icon: <FibonacciCircles />,
      props: {
        id: "fibonCircles",
        type: "fibonCircles",
        name: "Fibonacci Circles",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100],
        valuesState: [false, true, true, true, true, true, true],
        valuesCanDelete: true,
        valuesCanAdd: true,
        fillBg: false,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 11,
      },
    },
    channel: {
      icon: <Channel />,
      props: {
        id: "channel",
        type: "parallelChannel",
        name: "Parallel Channel",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        fillBg: false,
        anchors: [
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "left",
          },
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "right",
          },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 2,
      },
    },
    pitchfork: {
      icon: <Pitchfork />,
      props: {
        id: "pitchfork",
        type: "pitchfork",
        name: "Pitchfork",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 8,
      },
    },
    regressionChannel: {
      icon: <RegressionChannel />,
      props: {
        id: "regressionChannel",
        type: "regressionChannel",
        name: "Regression Channel",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        source: "c",
        fillBg: false,
        values: [-2, -1, 0, 1, 2],
        valuesState: [true, false, true, false, true],
        valuesCanDelete: true,
        valuesCanAdd: true,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 9,
      },
    },
    fixedRangeVolumeProfile: {
      icon: <VolumeProfile />,
      props: {
        id: "fixedRangeVolumeProfile",
        type: "fixedRangeVolumeProfile",
        name: "Volume Profile",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        fillBg: true,
        showPoc: true,
        showValueArea: true,
        valueAreaPercent: 70,
        profileRows: 0,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 9.5,
      },
    },
    gannFan: {
      icon: <GannFan />,
      props: {
        id: "gannFan",
        type: "gannFan",
        name: "Gann Fan",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 9,
      },
    },
    gannGrid: {
      icon: <GannGrid />,
      props: {
        id: "gannGrid",
        type: "gannGrid",
        name: "Gann Grid",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 10,
      },
    },
    gannBox: {
      icon: <GannBox />,
      props: {
        id: "gannBox",
        type: "gannBox",
        name: "Gann Box",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 11,
      },
    },
    triangle: {
      icon: <Triangle />,
      props: {
        id: "triangle",
        type: "triangle",
        name: "Triangle",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        fillBg: true,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 11,
      },
    },
    arrow: {
      icon: <Arrow />,
      props: {
        id: "arrow",
        type: "arrow",
        name: "Arrow",
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 8,
      },
    },
    trendRay: {
      icon: <LineTrend />,
      props: {
        id: "trendRay",
        type: "trendRay",
        name: "Trend Ray",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 2,
      },
    },
    hRay: {
      icon: <LineHorizontal />,
      props: {
        id: "hRay",
        type: "hRay",
        name: "Horizontal Ray",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        setAnchorValue: [0],
        priceMarker: true,
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 4,
      },
    },
    vRay: {
      icon: <LineVertical />,
      props: {
        id: "vRay",
        type: "vRay",
        name: "Vertical Ray",
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 5,
      },
    },
    crossLine: {
      icon: <CrossLine />,
      props: {
        id: "crossLine",
        type: "crossLine",
        name: "Cross Line",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 6,
      },
    },
    trend: {
      icon: <LineTrend />,
      props: {
        id: "trend",
        type: "trendLine",
        name: "Trend Line",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        canBeIndicator: true,
        isIndicator: false,
        anchors: [
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "left",
          },
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "right",
          },
        ],
        order: 1,
      },
    },
    hLine: {
      icon: <LineHorizontal />,
      props: {
        id: "hLine",
        type: "hLine",
        name: "Horizontal Line",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        canBeIndicator: true,
        isIndicator: false,
        setAnchorValue: [0], //st value to anchors with index
        priceMarker: true,
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 3,
      },
    },
    vLine: {
      icon: <LineVertical />,
      props: {
        id: "vLine",
        type: "vLine",
        name: "Vertical Line",
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 4,
      },
    },
    mLine: {
      icon: <LineMulti />,
      props: {
        id: "mLine",
        type: "mLine",
        name: "Multi-Line",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 5,
      },
    },
    abcd: {
      icon: <Abcd />,
      props: {
        id: "abcd",
        type: "abcd",
        name: "ABCD Tool",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        values: [38.2, 50, 61.8, 100, 161.8],
        valuesState: [true, true, true, true, true],
        valuesCanDelete: true,
        valuesCanAdd: true,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          {
            stamp: 0,
            offset: 0,
            value: 0,
            _index: 0,
            expandable: true,
            expanded: false,
            defaultDirection: "right",
          },
        ],
        order: 7,
      },
    },
    ellipse: {
      icon: <Oval />,
      props: {
        id: "ellipse",
        type: "ellipse",
        name: "Ellipse",
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        fillBg: false,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 9,
      },
    },
    vRange: {
      icon: <RangeVertical />,
      props: {
        id: "vRange",
        type: "vRange",
        name: "Vertical Range",
        defaultColor: "defaultToolColor",
        width: 1,
        text: "",
        flipped: false,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 13,
      },
    },
    hRange: {
      icon: <RangeHorizontal />,
      props: {
        id: "hRange",
        type: "hRange",
        name: "Horizontal Range",
        defaultColor: "defaultToolColor",
        width: 1,
        text: "",
        flipped: false,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 12,
      },
    },
    timeRange: {
      icon: <TimeRange />,
      props: {
        id: "timeRange",
        type: "timeRange",
        name: "Time Range",
        defaultColor: "defaultToolColor",
        secondaryColor: "rgba(255, 255, 255, 0.08)",
        width: 1,
        dash: [],
        text: "",
        editable: true,
        startTime: 0,
        timeRange: 0,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 14,
      },
    },
    cycle: {
      icon: <Cycles />,
      props: {
        id: "cycle",
        type: "cycle",
        name: "Cycle",
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        style: "line",
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 15,
      },
    },
    box: {
      icon: <Rectangle />,
      props: {
        id: "box",
        type: "box",
        name: "Rectangle",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        style: "line",
        fillBg: true,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 10,
      },
    },
    brush: {
      icon: <Brush />,
      props: {
        id: "brush",
        type: "brush",
        name: "Brush",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 2,
        dash: [],
        fillBg: false,
        backgroundColor: "defaultToolColor",
        backgroundOpacity: 0.25,
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 11,
      },
    },
    textAnnotation: {
      icon: <Text />,
      props: {
        id: "textAnnotation",
        type: "textAnnotation",
        name: "Text",
        defaultColor: "defaultToolColor",
        fillBg: false,
        width: 1,
        dash: [],
        text: "sample text",
        fontSize: 13,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0 },
        ],
        order: 15,
      },
    },
    longPosition: {
      icon: <LongPosition />,
      props: {
        id: "longPosition",
        type: "longShortPosition",
        direction: "LONG",
        name: "Long Position",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        fillBg: false,
        accountSize: 10000,
        riskMode: "PERCENT",
        riskPercent: 1,
        riskAmount: 100,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, defaultDirection: "right" },
          { stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, defaultDirection: "left" },
        ],
        order: 16,
      },
    },
    shortPosition: {
      icon: <ShortPosition />,
      props: {
        id: "shortPosition",
        type: "longShortPosition",
        direction: "SHORT",
        name: "Short Position",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        fillBg: false,
        accountSize: 10000,
        riskMode: "PERCENT",
        riskPercent: 1,
        riskAmount: 100,
        anchors: [
          { stamp: 0, offset: 0, value: 0, _index: 0 },
          { stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, defaultDirection: "right" },
          { stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, defaultDirection: "left" },
        ],
        order: 17,
      },
    },
    priceTag: {
      icon: <PriceTag />,
      props: {
        id: "priceTag",
        type: "priceTag",
        name: "Price Tag",
        sticky: true,
        defaultColor: "defaultToolColor",
        width: 1,
        dash: [],
        flipped: false,
        setAnchorValue: [0], //st value to anchors with index
        anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
        order: 18,
      },
    },
  };

  const [selectedTool, setSelectedTool] = useState("");
  const [eraserActive, setEraserActive] = useState(false);
  const containerOffset = useContext(ContainerOffsetContext);

  useEffect(() => {
    const subscription = chart?.subscribe("CURSOR_CHANGE", (data: { cursor: string }) => {
      setEraserActive(data.cursor === "ERASER");
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [chart]);

  function cancelDrawingMode() {
    if (!chart) return;

    const interactor = chart.getInteractor();
    if (interactor.currentMode && interactor.currentMode.onCancel) {
      interactor.currentMode.onCancel();
    }
    setSelectedTool("");
  }

  function activateEraser() {
    if (!chart) return;

    if (eraserActive) {
      chart.setCursor("DEFAULT");
      return;
    }

    cancelDrawingMode();
    chart.setCursor("ERASER");
  }

  function renderAnnotationSplitButton() {
    const eraserLabel = t("toolbar_cursor_eraser", "Eraser");
    const textTool = drawingTools.textAnnotation;
    const priceTool = drawingTools.priceTag;

    if (!textTool || !priceTool) {
      return null;
    }

    const options: React.ComponentProps<typeof SplitButton>["options"] = {
      eraser: {
        id: "eraser",
        label: eraserLabel,
        icon: <Eraser />,
        callback: activateEraser,
      },
      textAnnotation: {
        id: textTool.props.id,
        label: resolveToolLabel(textTool.props),
        icon: textTool.icon,
        callback: () => onSelectTool(textTool.props),
      },
      priceTag: {
        id: priceTool.props.id,
        label: resolveToolLabel(priceTool.props),
        icon: priceTool.icon,
        callback: () => onSelectTool(priceTool.props),
      },
    };

    const activeOption = eraserActive
      ? "eraser"
      : selectedTool === "textAnnotation" || selectedTool === "priceTag"
        ? selectedTool
        : undefined;

    return (
      <SplitButton
        defaultOption="eraser"
        activeOption={activeOption}
        options={options}
        containerOffset={containerOffset}
      />
    );
  }

  function renderDrawingTool(tool: DrawingTool) {
    const label = resolveToolLabel(tool.props);

    return (
      <IconButton
        onClick={() => {
          onSelectTool(tool.props);
        }}
        active={tool.props.id === selectedTool}
        themeContext="toolbar"
        title={label}
        ariaLabel={label}
        tooltipPlacement="right"
      >
        {tool.icon}
      </IconButton>
    );
  }

  function renderSplitButton(ids: string[], defaultOption: string) {
    const options = ids
      .map((id) => drawingTools[id])
      .filter((option): option is DrawingTool => option !== undefined);

    const splitButtonOptions = options.reduce(
      renderSplitButtonOption,
      {} as React.ComponentProps<typeof SplitButton>["options"],
    );

    return (
      <SplitButton
        defaultOption={defaultOption}
        // @ts-ignore
        activeOption={ids.indexOf(selectedTool) > -1 ? selectedTool : undefined}
        options={splitButtonOptions}
        containerOffset={containerOffset}
      />
    );
  }

  function renderSplitButtonOption(
    options: React.ComponentProps<typeof SplitButton>["options"],
    option: DrawingTool,
  ) {
    options[option.props.id] = {
      label: resolveToolLabel(option.props),
      icon: option.icon,
      id: option.props.id,
      callback: () => {
        onSelectTool(option.props);
      },
    };

    return options;
  }

  function onSelectTool(tool: DrawingToolProps) {
    if (!chart) return;

    chart.setCursor?.("DEFAULT");
    setEraserActive(false);

    const interactor = chart.getInteractor();
    if (interactor.currentMode && interactor.currentMode.onCancel) {
      interactor.currentMode.onCancel();
    }

    if (selectedTool === tool.id) {
      setSelectedTool("");
    } else {
      interactor.setMode("STAGE", { ...tool }, () => {
        setSelectedTool("");
      });
      setSelectedTool(tool.id);
    }
  }

  return {
    selectedTool,
    containerOffset,
    resolveToolLabel,
    renderDrawingTool,
    renderSplitButton,
    renderAnnotationSplitButton,
    drawingTools,
  };
}
