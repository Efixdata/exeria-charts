import type { ChartInstance } from "@efixdata/exeria-chart";
import {
  type ThemePreset,
  type ThemeVariant,
  cloneVariantPalette,
  drawPreviewOverlays,
  previewCandles,
  themePresets,
} from "../themeCreator/core";

export type PlaygroundExampleId =
  | "signal-dark"
  | "swipper-tools"
  | "exeria-light"
  | "ocean-indicators"
  | "ember-line"
  | "signal-full";

export type PlaygroundExample = {
  id: PlaygroundExampleId;
  title: string;
  image: string;
  presetId: string;
  themeVariant: ThemeVariant;
  applyScene?: (chart: ChartInstance) => void | Promise<void>;
};

function getPreset(presetId: string): ThemePreset {
  return themePresets.find((preset) => preset.id === presetId) ?? themePresets[0]!;
}

export function createPlaygroundPalette(presetId: string) {
  const preset = getPreset(presetId);
  return {
    chart: cloneVariantPalette(preset.chart),
    ui: cloneVariantPalette(preset.ui),
  };
}

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: "signal-dark",
    title: "Neon momentum",
    image: "/img/playground/example-1.jpg",
    presetId: "signal",
    themeVariant: "dark",
  },
  {
    id: "swipper-tools",
    title: "Drawing tools",
    image: "/img/playground/example-2.jpg",
    presetId: "swipper",
    themeVariant: "dark",
    applyScene: async (chart) => {
      drawPreviewOverlays(chart, previewCandles);
    },
  },
  {
    id: "exeria-light",
    title: "Light workspace",
    image: "/img/playground/example-3.jpg",
    presetId: "exeria",
    themeVariant: "light",
  },
  {
    id: "ocean-indicators",
    title: "RSI + MACD stack",
    image: "/img/playground/example-4.jpg",
    presetId: "ocean",
    themeVariant: "dark",
    applyScene: async (chart) => {
      chart.addScript("RSI");
      chart.addScript("MACD");
    },
  },
  {
    id: "ember-line",
    title: "Line mode",
    image: "/img/playground/example-5.jpg",
    presetId: "ember",
    themeVariant: "dark",
    applyScene: async (chart) => {
      chart.setMainDrawMode("Line");
    },
  },
  {
    id: "signal-full",
    title: "Full chart surface",
    image: "/img/playground/example-6.jpg",
    presetId: "signal",
    themeVariant: "dark",
    applyScene: async (chart) => {
      chart.addScript("EMA");
      drawPreviewOverlays(chart, previewCandles);
    },
  },
];

export function getPlaygroundExample(id: PlaygroundExampleId): PlaygroundExample {
  return playgroundExamples.find((example) => example.id === id) ?? playgroundExamples[0]!;
}
