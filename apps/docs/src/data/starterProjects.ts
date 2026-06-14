export type StarterProject = {
  id: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  demoPath: string;
  /** Optional full-screen live app (outside docs layout). */
  liveAppPath?: string;
  /** Optional copy for the live-app callout (defaults to generic text). */
  liveAppBlurb?: string;
  /** Static 16:9 preview instead of an embedded chart demo. */
  previewImage?: { src: string; alt: string };
  /** Homepage case-study card copy (defaults to title, body, image). */
  caseStudy?: {
    title: string;
    body: string;
    image?: string;
    imageAlt?: string;
  };
  stack: string[];
  highlights: string[];
  relatedDocs: Array<{ label: string; href: string }>;
};

export const starterProjects: StarterProject[] = [
  {
    id: "crypto-terminal",
    title: "Crypto Terminal Starter",
    body: "A trading-style layout you can run locally in minutes: live Binance chart, markets sidebar, depth book, and a trade panel. Download the zip, edit React files, and grow it into your own product.",
    image: "/img/case-studies/crypto-terminal.jpg",
    imageAlt: "Crypto exchange terminal with neon candlesticks, volume profile, and Fibonacci grid",
    demoPath: "/starters/crypto-terminal",
    liveAppPath: "/starters/crypto-terminal/app",
    liveAppBlurb:
      "Try the finished UI first — same layout you get in the downloadable starter. Orders are simulated; market data is live.",
    previewImage: {
      src: "/img/starters/crypto-terminal-hero.jpg",
      alt: "Crypto Terminal Pro with live chart, markets watchlist, depth book, and trade panel",
    },
    caseStudy: {
      title: "The Ultimate Crypto Terminal",
      body: "Deliver the institutional-grade trading experience. Seamlessly handle millions of simultaneous tick streams and execute trades at ultra-low latency. Perfect for centralized exchanges and high-performance DEXs.",
      image: "/img/starters/crypto-terminal-hero.jpg",
      imageAlt: "Crypto Terminal Pro with live chart, markets watchlist, depth book, and trade panel",
    },
    stack: ["Vite + React", "ChartUI", "Binance (public API)", "Copy-paste starter zip"],
    highlights: [
      "Run locally with npm install && npm run dev",
      "Live candles, depth, and tape — no API keys",
      "Paper trading for safe UI experiments",
      "Step-by-step guide in the For developers section",
    ],
    relatedDocs: [
      { label: "Binance Data Connector", href: "/docs/data-connectors/binance" },
      { label: "Realtime updates", href: "/docs/chart-usage/realtime-updates" },
      { label: "Trade from chart", href: "/docs/tutorials/trade-from-chart" },
    ],
  },
  {
    id: "forex-platforms",
    title: "FX Opportunity Radar",
    body: "An opportunity radar you can run locally in minutes: FX chart, discovery feed, strategy markers, and news dots on the canvas. Download the zip, edit React files, and grow it into your own platform.",
    image: "/img/starters/forex-opportunity-hero.jpg",
    imageAlt:
      "FX Opportunity Radar with opportunity feed, multi-line arb chart, news callout, and signal brief",
    demoPath: "/starters/forex-platforms",
    liveAppPath: "/starters/forex-platforms/app",
    liveAppBlurb:
      "Try the finished UI first — same patterns you get in the downloadable starter. Opportunities and news are demo data; candles ship as static fixtures.",
    previewImage: {
      src: "/img/starters/forex-opportunity-hero.jpg",
      alt: "FX Opportunity Radar with opportunity feed, multi-line arb chart, news callout, and signal brief",
    },
    caseStudy: {
      title: "FX Opportunity Radar",
      body: "Surface triangular mispricings, rare setups, strategy markers, and macro news dots on one canvas — then download the starter and wire your own opportunity feed.",
      image: "/img/starters/forex-opportunity-hero.jpg",
      imageAlt:
        "FX Opportunity Radar with opportunity feed, multi-line arb chart, news callout, and signal brief",
    },
    stack: ["Vite + React", "ChartUI", "Static FX bundles", "Copy-paste starter zip"],
    highlights: [
      "Run locally with npm install && npm run dev",
      "Bundled EUR/USD candles — no API keys to start",
      "Opportunity feed + news-on-chart patterns",
      "Step-by-step guide in the For developers section",
    ],
    relatedDocs: [
      { label: "Strategies overview", href: "/docs/scripts/strategies/overview" },
      { label: "Loading your data", href: "/docs/tutorials/chart-with-your-data" },
      { label: "Kraken connector", href: "/docs/data-connectors/kraken" },
    ],
  },
  {
    id: "fintech-integration",
    title: "Consumer-Ready Fintech Integration",
    body: "Embed stunning, minimalist charts directly into your banking or wealth management app. Designed for simplicity, our touch-first, lightweight charts provide a flawless mobile experience for retail investors.",
    image: "/img/starters/fintech-integration-hero.jpeg",
    imageAlt: "Nova Wealth consumer fintech app with portfolio charts in light and dark themes",
    previewImage: {
      src: "/img/starters/fintech-integration-hero.jpeg",
      alt: "Nova Wealth consumer fintech app with portfolio charts in light and dark themes",
    },
    demoPath: "/starters/fintech-integration",
    liveAppPath: "/starters/fintech-integration/app",
    liveAppBlurb:
      "Full-screen wealth app — compare chart, allocation ring, watchlist sparklines. Also try the light banking route at /starters/fintech-integration/app-bank.",
    stack: ["React", "Core chart runtime", "Multi-instrument compare", "Touch-first mobile shell"],
    highlights: [
      "Download ZIP — Vite + React wealth starter with equity CSV fixtures",
      "Crypto / Equities toggle in the live consumer demo",
      "Portfolio from positions × price + cash row",
      "For developers section with snippets and run locally steps",
    ],
    relatedDocs: [
      { label: "Next.js quickstart", href: "/docs/getting-started/nextjs-app-router" },
      { label: "Mobile and responsive", href: "/docs/advanced/mobile-and-responsive" },
      { label: "Custom theme", href: "/docs/tutorials/custom-theme" },
    ],
  },
  {
    id: "quant-analytics",
    title: "Quant Analytics Dashboard",
    body: "Visualize complex backtest results, equity curves, and proprietary algorithmic indicators over millions of historical ticks. Experience sub-millisecond rendering speed without a hint of browser lag.",
    image: "/img/case-studies/quant-analytics.jpg",
    imageAlt: "Quant dashboard with trade markers and equity curve panel",
    demoPath: "/starters/quant-analytics",
    stack: ["Vanilla JS or React", "Core runtime", "Strategies", "Multi-pane scripts"],
    highlights: [
      "Strategy overlays and signal markers",
      "Custom indicator wiring",
      "Large historical datasets with client-side merge",
      "Equity curve in a secondary pane",
    ],
    relatedDocs: [
      { label: "Strategies overview", href: "/docs/scripts/strategies/overview" },
      { label: "Programmatic wiring", href: "/docs/scripts/programmatic-wiring" },
      { label: "Loading data", href: "/docs/tutorials/chart-with-your-data" },
    ],
  },
  {
    id: "market-news",
    title: "Interactive Market News",
    body: "Keep your readers engaged with dynamic, embeddable charts. Showcase comparative asset performance, historical trends, and live quotes inside your articles with a minimal footprint and maximum clarity.",
    image: "/img/case-studies/market-news.jpg",
    imageAlt: "Comparison chart showing asset performance against a benchmark index",
    demoPath: "/starters/market-news",
    stack: ["Vanilla JS embed", "Multi-instrument", "Lightweight mount"],
    highlights: [
      "Multiple symbols on one chart",
      "Small embed footprint without ChartUI",
      "Static or slow-refresh data from your CMS",
      "Share and export snapshots",
    ],
    relatedDocs: [
      { label: "Multi-instrument charts", href: "/docs/chart-usage/multi-instrument-charts" },
      { label: "Vanilla quickstart", href: "/docs/getting-started/vanilla" },
      { label: "Theming overview", href: "/docs/theming/overview" },
    ],
  },
  {
    id: "screener-signals",
    title: "Real-Time Alert & Signal Terminal",
    body: "Transform market noise into actionable intelligence. Generate real-time trade signals, visualize alert triggers with clarity, and display complex technical strategies instantly.",
    image: "/img/starters/screener-signals-hero.jpg",
    imageAlt: "Signal screener with filters, expandable chart analysis, and trade panel",
    previewImage: {
      src: "/img/starters/screener-signals-hero.jpg",
      alt: "Signal screener with filters, expandable chart analysis, and trade panel",
    },
    demoPath: "/starters/screener-signals",
    liveAppPath: "/starters/screener-signals/app",
    liveAppBlurb:
      "Signal screener with filters, mini charts, expandable analysis, trade panel, and alert/automation settings.",
    stack: ["React", "ChartUI", "Strategies", "Realtime updates"],
    highlights: [
      "Built-in strategy scripts (CROSS, EXCEED, MIX)",
      "Signal markers on the main series",
      "Streaming updates with script recalculation",
      "Step-by-step guide in the For developers section",
    ],
    relatedDocs: [
      { label: "Key strategies", href: "/docs/scripts/strategies/key-strategies" },
      { label: "Live data stream", href: "/docs/tutorials/live-data-stream" },
      { label: "Add an indicator", href: "/docs/tutorials/add-an-indicator" },
    ],
  },
];

export function getStarterProjectById(id: string): StarterProject | undefined {
  return starterProjects.find((project) => project.id === id);
}
