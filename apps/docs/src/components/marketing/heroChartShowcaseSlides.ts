export type HeroChartSlide = {
  id: string;
  src: string;
  alt: string;
  /** Show only the upper portion — candlestick area without sub-panes. */
  cropTop?: boolean;
};

/** Simple embed → quant stack, ~3s per beat (15s loop). */
export const heroChartShowcaseSlides: HeroChartSlide[] = [
  {
    id: "candles",
    src: "/img/playground/crypto-trading-terminal.jpg",
    alt: "BTC/USD candlestick chart",
    cropTop: true,
  },
  {
    id: "indicators",
    src: "/img/playground/crypto-trading-terminal.jpg",
    alt: "BTC/USD chart with EMA, RSI, and drawing tools",
  },
  {
    id: "compare",
    src: "/img/playground/editorial-pair-compare.jpg",
    alt: "EUR/USD and GBP/USD indexed compare chart",
  },
  {
    id: "news",
    src: "/img/playground/news-on-chart-rsi.jpg",
    alt: "EUR/USD chart with news callout and RSI pane",
  },
  {
    id: "quant",
    src: "/img/playground/quant-strategy-stack.jpg",
    alt: "Multi-pane quant dashboard with indicators, signals, and equity curve",
  },
];

export const HERO_CHART_SHOWCASE_CYCLE_MS = 15_000;
export const HERO_CHART_SHOWCASE_BEAT_MS = 3_000;
