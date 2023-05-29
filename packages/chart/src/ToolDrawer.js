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

  drawTrendLine(stamp1, stamp2, price1, price2, options = {}) {
    const config = {
      type: "trendLine",
      anchors: [
        {
          prawilnyStamp: stamp2,
          offset: 0,
          value: price2,
          _index: 0,
          expandable: true,
          expanded: false,
          defaultDirection: "left",
        },
        {
          prawilnyStamp: stamp1,
          offset: 0,
          value: price1,
          _index: 0,
          expandable: true,
          expanded: false,
          defaultDirection: "right",
        },
      ],
    };

    return this.drawTool({ ...config, ...options });
  }

  drawTimeRange(stamp1, stamp2, options) {
    const config = {
      type: "timeRange",
      anchors: [
        {
          prawilnyStamp: stamp1,
        },
        {
          prawilnyStamp: stamp2,
        },
      ],
    };

    return this.drawTool({ ...config, ...options });
  }

  drawFutureTimeRange(period, options) {
    const config = {
      type: "futureTimeRange",
      period: period
    };

    return this.drawTool({ ...config, ...options });
  }

  deleteTool(id) {
    this.chart.onDelete(id);
  }
}
