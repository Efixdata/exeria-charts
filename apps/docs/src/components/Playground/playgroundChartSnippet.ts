import type { ChartInstance } from "@efixdata/exeria-chart";

export type PlaygroundChartSnapshot = {
  drawMode: string;
  indicators: Array<{ key: string; title: string }>;
  drawingCount: number;
};

export function readPlaygroundChartSnapshot(chart: ChartInstance): PlaygroundChartSnapshot {
  const indicators = chart
    .getChartIndicatorSettings()
    .filter((item) => item.visible)
    .map((item) => ({ key: item.key, title: item.title }));

  return {
    drawMode: chart.getInstrumentDrawMode(),
    indicators,
    drawingCount: chart.getChartDrawingSettings().filter((item) => item.visible).length,
  };
}

export function buildPlaygroundLiveSnippet(snapshot: PlaygroundChartSnapshot | null): string {
  if (!snapshot) {
    return "// Chart is still loading…";
  }

  const lines: string[] = [];

  if (snapshot.drawMode !== "OHLC") {
    lines.push(`chart.setMainDrawMode("${snapshot.drawMode}");`);
  }

  for (const indicator of snapshot.indicators) {
    lines.push(`chart.addScript("${indicator.key}");`);
  }

  if (snapshot.drawingCount > 0) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(
      `// You drew ${snapshot.drawingCount} shape${snapshot.drawingCount === 1 ? "" : "s"} on the chart.`,
    );
    lines.push("// See the drawing tools tutorial to save and restore them in your app.");
  }

  if (lines.length === 0) {
    return [
      "// Nothing extra on the chart yet.",
      "// Add indicators from the toolbar (top of the chart) and this code updates automatically.",
    ].join("\n");
  }

  return lines.join("\n");
}

export function formatPlaygroundChartSummary(snapshot: PlaygroundChartSnapshot | null): string {
  if (!snapshot) {
    return "Loading…";
  }

  const parts: string[] = [];

  parts.push(snapshot.drawMode === "OHLC" ? "Candles" : `${snapshot.drawMode} chart`);

  if (snapshot.indicators.length > 0) {
    parts.push(snapshot.indicators.map((item) => item.title || item.key).join(" · "));
  }

  if (snapshot.drawingCount > 0) {
    parts.push(
      `${snapshot.drawingCount} drawing${snapshot.drawingCount === 1 ? "" : "s"}`,
    );
  }

  return parts.join(" · ");
}
