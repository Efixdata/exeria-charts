import LIB from "./utils/chartingCommons";

export default class ToolDrawer {
  constructor(chart) {
    this.chart = chart;
  }

  createDefaultToolConfig(toolOptions) {
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

  drawTool(toolConfig) {
    const config = { ...this.createDefaultToolConfig(toolConfig), ...toolConfig };

    this.chart.model.panels[0].objects.push(config);
    return config.id;
  }

  drawTrendLine(initialOptions = {}) {
    const formattedConfig = {
      ...initialOptions.config,
      type: "trendLine",
      anchors: [
        {
          prawilnyStamp: initialOptions.startStamp,
          offset: 0,
          value: initialOptions.startPrice,
          _index: 0,
          expandable: true,
          expanded: false,
          defaultDirection: "left",
        },
        {
          prawilnyStamp: initialOptions.endStamp,
          offset: 0,
          value: initialOptions.endPrice,
          _index: 0,
          expandable: true,
          expanded: false,
          defaultDirection: "right",
        },
      ],
    };

    return this.drawTool(formattedConfig);
  }

  drawTimeRange(initialOptions) {
    const formattedConfig = {
      ...initialOptions.config,
      type: "timeRange",
      text: initialOptions.text,
      startTime: initialOptions.startTime,
      timeRange: initialOptions.timeRange,
    };

    return this.drawTool(formattedConfig);
  }
 
  deleteTool(id) {
    this.chart.onDelete(id);
  }
}
