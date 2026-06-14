export type ArbSignalCategory = "arb" | "rare" | "signal" | "event";

export type ArbSignalScriptKey =
  | "EMA"
  | "SMA"
  | "MACD"
  | "BBAND"
  | "RSI"
  | "ATR"
  | "CEX"
  | "CROSS"
  | "EXCEED"
  | "NEWSFEED";

export type ArbChartSceneScript = {
  key: ArbSignalScriptKey;
  inputs?: Record<string, unknown>;
  /** When CROSS follows MACD, render buy/sell markers on the MACD panel. */
  crossOnMacdPanel?: boolean;
};

export type ArbChartSceneOverlay = {
  symbol: string;
  renderAs: "Line";
  color?: string;
  valueAxisMode?: "lin" | "log" | "perc" | "%";
  lineFillMode?: "gradient" | "solid";
  fillOpacity?: number;
};

export type ArbSceneAnchorAt = "detectedAt" | "stamp" | "barOffset" | "signal";

export type ArbScenePriceField = "o" | "h" | "l" | "c";

export type ArbSceneAnchor = {
  at: ArbSceneAnchorAt;
  stamp?: number;
  barOffset?: number;
  priceField?: ArbScenePriceField;
  valueOffsetPips?: number;
};

export type ArbSceneDrawing = {
  id: string;
  type: string;
  color?: string;
  text?: string;
  fontSize?: number;
  fillBg?: boolean;
  editable?: boolean;
  anchors: ArbSceneAnchor[];
};

export type ArbChartSceneFocus = {
  at: "detectedAt" | "stamp" | "barOffset";
  stamp?: number;
  barOffset?: number;
  plotCenterRatio?: number;
};

export type ArbChartScene = {
  version: 1;
  instrument: string;
  timeframe: "m15" | "h1";
  dataSource?: "static";
  mainDrawMode?: "OHLC" | "Line" | "Bars";
  mainInstrumentColor?: string;
  mainLineFillMode?: "gradient" | "solid";
  mainLineFillOpacity?: number;
  valueAxisMode?: "lin" | "log" | "perc" | "%";
  scripts?: ArbChartSceneScript[];
  overlays?: ArbChartSceneOverlay[];
  drawings?: ArbSceneDrawing[];
  focus: ArbChartSceneFocus;
  highlights?: {
    newsIds?: string[];
  };
};

export type ArbMetrics = {
  impliedEurGbp?: number;
  quotedEurGbp?: number;
  edgePips: number;
  label?: string;
};

export type ArbSignalBrief = {
  unusualBecause: string[];
  thesis: string;
  confluence?: number;
};

/**
 * Canonical ARB / opportunity signal. `detectedAt` is UTC ms; the chart maps it to a bar index at runtime.
 */
export type ArbSignalRecord = {
  id: string;
  category: ArbSignalCategory;
  title: string;
  pair: string;
  edgeLabel: string;
  ageMinutes: number;
  unusualScore: number;
  detectedAt: number;
  sparkline: number[];
  lastSeenDays?: number;
  linkedNewsId?: string;
  confluenceChecks?: string[];
  playbook?: string;
  brief: ArbSignalBrief;
  arbMetrics?: ArbMetrics;
  chartScene: ArbChartScene;
};

export type ArbSignalBundle = {
  schemaVersion: 1;
  feedId: string;
  provider: string;
  generatedAt: string;
  coverage: {
    from: number;
    to: number;
  };
  signals: ArbSignalRecord[];
};

export type ArbSignalQuery = {
  category?: ArbSignalCategory;
  instrument?: string;
  from?: number;
  to?: number;
  limit?: number;
};
