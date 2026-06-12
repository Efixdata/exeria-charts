import type { ChartInstance } from "@exeria/charts";
import {
  type ThemePreset,
  type ThemeVariant,
  cloneVariantPalette,
  drawPreviewOverlays,
  previewCandles,
} from "../themeCreator/core";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";

export type PlaygroundExampleId =
  | "trading-dark-scene"
  | "carbon-tools"
  | "day-light"
  | "midnight-indicators"
  | "onyx-line"
  | "paper-full";

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
    id: "trading-dark-scene",
    title: "Trading dark momentum",
    image: "/img/playground/example-1.jpg",
    presetId: "trading-dark",
    themeVariant: "dark",
  },
  {
    id: "carbon-tools",
    title: "Drawing tools",
    image: "/img/playground/example-2.jpg",
    presetId: "carbon",
    themeVariant: "dark",
    applyScene: async (chart) => {
      drawPreviewOverlays(chart, previewCandles);
    },
  },
  {
    id: "day-light",
    title: "Day light workspace",
    image: "/img/playground/example-3.jpg",
    presetId: "day",
    themeVariant: "light",
  },
  {
    id: "midnight-indicators",
    title: "RSI + MACD stack",
    image: "/img/playground/example-4.jpg",
    presetId: "midnight",
    themeVariant: "dark",
    applyScene: async (chart) => {
      chart.addScript("RSI");
      chart.addScript("MACD");
    },
  },
  {
    id: "onyx-line",
    title: "Line mode",
    image: "/img/playground/example-5.jpg",
    presetId: "onyx",
    themeVariant: "light",
    applyScene: async (chart) => {
      chart.setMainDrawMode("Line");
    },
  },
  {
    id: "paper-full",
    title: "Full chart surface",
    image: "/img/playground/example-6.jpg",
    presetId: "paper",
    themeVariant: "light",
    applyScene: async (chart) => {
      chart.addScript("EMA");
      drawPreviewOverlays(chart, previewCandles);
    },
  },
];

export function getPlaygroundExample(id: PlaygroundExampleId): PlaygroundExample {
  return playgroundExamples.find((example) => example.id === id) ?? playgroundExamples[0]!;
}
