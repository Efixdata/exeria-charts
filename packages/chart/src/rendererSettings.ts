import type { RendererSettings } from "./internal-types/renderer";

const rendererSettings: RendererSettings = {
  orders: {
    bar: {
      color: "#FF8D02",
      text_color: "#ffffff",
      x: 0,
      w: 110,
      h: 14,
      r: 5,
      spacing: 5,
      closeBtn: { x: 5, w: 7 },
      dragTpSlHandler: { x: 68, w: 7 },
    },
    line: { color: "#FF8D02", w: 1, dash: [3, 3] },
    connections: { color: "#FF8D02", alpha: 0.5, w: 1, dash: [3, 3] },
    runnerMarker: {
      x: 68,
      w: 12,
      activeBg: "#36a6ff",
      color: "#FFFFFF",
      inactiveBg: "#4b4b4b",
    },
    relatedBar: {
      alpha: 1,
      color: "#FF8D02",
    },
  },
  positions: {
    bar: {
      color: "#7f8182",
      text_color: "#ffffff",
      x: 0,
      w: 80,
      h: 14,
      r: 5,
      spacing: 5,
      closeBtn: { x: 5, w: 7 },
      dragTpSlHandler: { x: 68, w: 7 },
    },
    line: { color: "#7f8182", w: 1, dash: [3, 3] },
    connections: { color: "#FF8D02", alpha: 0.5, w: 1, dash: [3, 3] },
    runnerMarker: {
      x: 68,
      w: 12,
      activeBg: "#36a6ff",
      color: "#FFFFFF",
      inactiveBg: "#4b4b4b",
    },
    relatedBar: {
      alpha: 1,
      color: "#FF8D02",
    },
  },
};

export default rendererSettings;