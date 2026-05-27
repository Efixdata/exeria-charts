import LIB from "./utils/chartingCommons";
import type {
  DrawToolConfig,
  TimeBetToolOptions,
  LongShortPositionToolOptions,
  TimeRangeToolOptions,
  ToolAnchor,
  ToolDrawerApi,
  TrendLineToolOptions,
} from "./types";
import type { ChartPanelObject } from "./internal-types/objects";

interface ToolDrawerChart {
  model: {
    panels: Array<{
      objects: ChartPanelObject[];
    }>;
  };
  onDelete(id: string | number): void;
}

type ToolObjectConfig = DrawToolConfig & ChartPanelObject;

export default class ToolDrawer implements ToolDrawerApi {
  chart: ToolDrawerChart;

  constructor(chart: ToolDrawerChart) {
    this.chart = chart;
  }

  createDefaultToolConfig(toolOptions: Partial<ToolObjectConfig>): ToolObjectConfig {
    return {
      id: LIB.getUniqueId(),
      type: toolOptions.type,
      name: toolOptions.name || "tool",
      color: toolOptions.color,
      secondaryColor: toolOptions.secondaryColor,
      text: toolOptions.text,
      textColor: toolOptions.textColor,
      editable: toolOptions.editable === false ? false : true,
      width: 2,
      dash: [0, 0],
      _hit: false,
      _hitAnchor: null,
      _hitArrow: null,
      anchors: [],
    };
  }

  drawTool(toolConfig: DrawToolConfig): string | number | void {
    const config = {
      ...this.createDefaultToolConfig(toolConfig),
      ...toolConfig,
    } as ToolObjectConfig;

    this.chart.model.panels[0].objects.push(config);
    return config.id;
  }

  drawTrendLine(initialOptions: TrendLineToolOptions = {}): string | number | void {
    const anchors: ToolAnchor[] = [
      {
        stamp: initialOptions.startStamp,
        offset: 0,
        value: initialOptions.startPrice,
        _index: 0,
        expandable: true,
        expanded: false,
        defaultDirection: "left",
      },
      {
        stamp: initialOptions.endStamp,
        offset: 0,
        value: initialOptions.endPrice,
        _index: 0,
        expandable: true,
        expanded: false,
        defaultDirection: "right",
      },
    ];

    const formattedConfig: DrawToolConfig = {
      ...initialOptions.config,
      type: "trendLine",
      anchors,
    };

    return this.drawTool(formattedConfig);
  }

  drawTimeRange(initialOptions: TimeRangeToolOptions): string | number | void {
    const formattedConfig: DrawToolConfig = {
      ...initialOptions.config,
      type: "timeRange",
      text: initialOptions.text,
      startTime: initialOptions.startTime,
      timeRange: initialOptions.timeRange,
    };

    return this.drawTool(formattedConfig);
  }

  drawTimeBet(initialOptions: TimeBetToolOptions): string | number | void {
    const anchors: ToolAnchor[] = [
      {
        stamp: initialOptions.startTime,
        offset: 0,
        value: initialOptions.price,
        _index: 0,
        expandable: false,
        expanded: false,
        defaultDirection: "left",
      },
      {
        stamp: initialOptions.startTime + initialOptions.timeRange,
        offset: 0,
        value: initialOptions.price,
        _index: 0,
        expandable: false,
        expanded: false,
        defaultDirection: "right",
      },
    ];

    const formattedConfig: DrawToolConfig = {
      ...initialOptions.config,
      type: "timeBet",
      price: initialOptions.price,
      predictedDirection: initialOptions.predictedDirection,
      reward: initialOptions.reward,
      bet: initialOptions.bet,
      startTime: initialOptions.startTime,
      timeRange: initialOptions.timeRange,
      status: initialOptions.status,
      isWinning: initialOptions.isWinning,
      editable: false,
      width: 1,
      anchors,
    };

    return this.drawTool(formattedConfig);
  }

  drawLongShortPosition(initialOptions: LongShortPositionToolOptions = {}): string | number | void {
    const direction = initialOptions.direction === "SHORT" ? "SHORT" : "LONG";
    const stopPrice = initialOptions.stopPrice ?? 0;
    const targetPrice = initialOptions.targetPrice ?? stopPrice;
    const entryPrice =
      initialOptions.entryPrice ?? (stopPrice + targetPrice) / 2;

    const firstRole =
      direction === "LONG"
        ? stopPrice < entryPrice
          ? "stop"
          : "target"
        : stopPrice > entryPrice
          ? "stop"
          : "target";
    const firstPrice = firstRole === "stop" ? stopPrice : targetPrice;
    const oppositePrice = firstRole === "stop" ? targetPrice : stopPrice;

    const anchors: ToolAnchor[] = [
      {
        stamp: initialOptions.startStamp ?? 0,
        offset: 0,
        value: entryPrice,
        _index: 0,
      },
      {
        stamp: initialOptions.startStamp ?? 0,
        offset: 0,
        value: firstPrice,
        _index: 0,
        expandable: true,
        defaultDirection: "right",
      },
      {
        stamp: initialOptions.endStamp ?? 0,
        offset: 0,
        value: oppositePrice,
        _index: 0,
        expandable: true,
        defaultDirection: "left",
      },
    ];

    const formattedConfig: DrawToolConfig = {
      ...initialOptions.config,
      type: "longShortPosition",
      direction,
      hidden: false,
      _placementStep: 2,
      _firstLevelRole: firstRole,
      stopPrice,
      targetPrice,
      entryPrice,
      accountSize: initialOptions.accountSize ?? 10000,
      riskMode: initialOptions.riskMode ?? "PERCENT",
      riskPercent: initialOptions.riskPercent ?? 1,
      riskAmount: initialOptions.riskAmount ?? 100,
      anchors,
    };

    return this.drawTool(formattedConfig);
  }

  deleteTool(id: string | number): void {
    this.chart.onDelete(id);
  }
}
