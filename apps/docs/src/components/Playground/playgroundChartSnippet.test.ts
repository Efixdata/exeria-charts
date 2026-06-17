import { describe, expect, it } from "vitest";
import {
  buildPlaygroundLiveSnippet,
  formatPlaygroundChartSummary,
  type PlaygroundChartSnapshot,
} from "./playgroundChartSnippet";

describe("playgroundChartSnippet", () => {
  it("returns a beginner hint when the chart is empty", () => {
    const snapshot: PlaygroundChartSnapshot = {
      drawMode: "OHLC",
      indicators: [],
      drawingCount: 0,
    };

    expect(buildPlaygroundLiveSnippet(snapshot)).toContain("Nothing extra on the chart yet");
    expect(formatPlaygroundChartSummary(snapshot)).toBe("Candles");
  });

  it("builds indicator and draw mode lines", () => {
    const snapshot: PlaygroundChartSnapshot = {
      drawMode: "Line",
      indicators: [{ key: "RSI", title: "RSI" }],
      drawingCount: 2,
    };

    expect(buildPlaygroundLiveSnippet(snapshot)).toContain('chart.setMainDrawMode("Line");');
    expect(buildPlaygroundLiveSnippet(snapshot)).toContain('chart.addScript("RSI");');
    expect(buildPlaygroundLiveSnippet(snapshot)).toContain("2 shapes");
    expect(formatPlaygroundChartSummary(snapshot)).toContain("RSI");
  });
});
