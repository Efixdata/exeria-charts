import type { ChartInstance } from "@efixdata/exeria-chart";
import {
  type ThemePreset,
  type ThemeVariant,
  cloneVariantPalette,
} from "../themeCreator/core";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import {
  playgroundSceneApplyHandlers,
  type PlaygroundSceneId,
} from "./playgroundScenes";

export type PlaygroundExampleId = PlaygroundSceneId;

export type PlaygroundExample = {
  id: PlaygroundExampleId;
  title: string;
  image: string;
  imageAlt: string;
  presetId: string;
  themeVariant: ThemeVariant;
  starterPath: string;
  applyScene: (chart: ChartInstance) => void | Promise<void>;
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
    id: "crypto-terminal",
    title: "Crypto trading terminal",
    image: "/img/playground/crypto-trading-terminal.jpg",
    imageAlt: "BTC/USD candlesticks with EMA 21, RSI, and drawing tools",
    presetId: "trading-dark",
    themeVariant: "dark",
    starterPath: "/starters/crypto-terminal",
    applyScene: playgroundSceneApplyHandlers["crypto-terminal"],
  },
  {
    id: "market-compare-duo",
    title: "Editorial pair compare",
    image: "/img/playground/editorial-pair-compare.jpg",
    imageAlt: "Light indexed compare chart for EUR/USD and GBP/USD with gradient fills",
    presetId: "onyx",
    themeVariant: "light",
    starterPath: "/starters/market-news",
    applyScene: playgroundSceneApplyHandlers["market-compare-duo"],
  },
  {
    id: "fx-signal-line",
    title: "FX signal publisher",
    image: "/img/playground/fx-signal-publisher.jpg",
    imageAlt: "EUR/USD 15m chart with SMA 14 cross signals and equity pane",
    presetId: "carbon",
    themeVariant: "dark",
    starterPath: "/starters/forex-platforms",
    applyScene: playgroundSceneApplyHandlers["fx-signal-line"],
  },
  {
    id: "news-rsi",
    title: "News on chart + RSI",
    image: "/img/playground/news-on-chart-rsi.jpg",
    imageAlt: "Dark EUR/USD line chart with headline callout and RSI sub-pane",
    presetId: "carbon",
    themeVariant: "dark",
    starterPath: "/starters/market-news",
    applyScene: playgroundSceneApplyHandlers["news-rsi"],
  },
  {
    id: "quant-reversion",
    title: "Mean reversion lab",
    image: "/img/playground/mean-reversion-lab.jpg",
    imageAlt: "Light EUR/USD chart with Bollinger rebound signals and equity curve",
    presetId: "paper",
    themeVariant: "light",
    starterPath: "/starters/quant-analytics",
    applyScene: playgroundSceneApplyHandlers["quant-reversion"],
  },
  {
    id: "quant-composite",
    title: "Quant strategy stack",
    image: "/img/playground/quant-strategy-stack.jpg",
    imageAlt: "Multi-pane quant dashboard with WMA, EMA, signal rows, and equity curve",
    presetId: "midnight",
    themeVariant: "dark",
    starterPath: "/starters/quant-analytics",
    applyScene: playgroundSceneApplyHandlers["quant-composite"],
  },
  {
    id: "quant-bollinger",
    title: "Bollinger breakout desk",
    image: "/img/playground/bollinger-breakout-desk.jpg",
    imageAlt: "Dark EUR/USD chart with Bollinger bands, exceed signals, and equity pane",
    presetId: "midnight",
    themeVariant: "dark",
    starterPath: "/starters/quant-analytics",
    applyScene: playgroundSceneApplyHandlers["quant-bollinger"],
  },
  {
    id: "market-compare-trio",
    title: "Triangular FX compare",
    image: "/img/playground/triangular-fx-compare.jpg",
    imageAlt: "Light chart comparing EUR/USD, GBP/USD, and EUR/GBP on a percentage axis",
    presetId: "onyx",
    themeVariant: "light",
    starterPath: "/starters/forex-platforms",
    applyScene: playgroundSceneApplyHandlers["market-compare-trio"],
  },
  {
    id: "fintech-compare",
    title: "Portfolio compare",
    image: "/img/playground/portfolio-compare.jpg",
    imageAlt: "Dark consumer chart comparing three crypto assets on a percentage scale",
    presetId: "trading-dark",
    themeVariant: "dark",
    starterPath: "/starters/fintech-integration",
    applyScene: playgroundSceneApplyHandlers["fintech-compare"],
  },
];

export function getPlaygroundExample(id: PlaygroundExampleId): PlaygroundExample {
  return playgroundExamples.find((example) => example.id === id) ?? playgroundExamples[0]!;
}

export const defaultPlaygroundExample = playgroundExamples[0]!;
