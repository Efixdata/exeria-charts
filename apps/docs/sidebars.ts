import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      link: { type: "doc", id: "getting-started/index" },
      items: [
        "getting-started/vanilla",
        "getting-started/react",
        "getting-started/vite-react",
        "getting-started/nextjs-app-router",
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      link: { type: "doc", id: "tutorials/index" },
      items: [
        "tutorials/chart-with-your-data",
        "tutorials/live-data-stream",
        "tutorials/add-an-indicator",
        "tutorials/custom-theme",
        "tutorials/drawing-tools-recipes",
        "tutorials/connect-with-data-connector",
        "tutorials/multi-instrument-overlay",
        "tutorials/save-and-restore-settings",
        "tutorials/customize-built-in-indicator",
        "tutorials/trade-from-chart",
        "tutorials/custom-drawing-tool-authoring",
      ],
    },
    {
      type: "category",
      label: "Core Concepts",
      link: { type: "doc", id: "core-concepts/index" },
      items: [
        "core-concepts/chart-lifecycle",
        "core-concepts/data-model",
        "core-concepts/rendering-and-scales",
      ],
    },
    {
      type: "category",
      label: "Chart Usage",
      link: { type: "doc", id: "chart-usage/index" },
      items: [
        "chart-usage/loading-data",
        "chart-usage/realtime-updates",
        "chart-usage/navigation-and-viewport",
        "chart-usage/autoscale-and-value-axis",
        "chart-usage/drawing-and-interaction",
        "chart-usage/multi-instrument-charts",
        "chart-usage/top-toolbar-and-mobile",
        "chart-usage/chart-settings",
      ],
    },
    {
      type: "category",
      label: "Data Connectors",
      link: { type: "doc", id: "data-connectors/index" },
      items: [
        "data-connectors/overview",
        {
          type: "category",
          label: "Binance",
          link: { type: "doc", id: "data-connectors/binance" },
          items: [
            {
              type: "link",
              label: "Binance Live Demo",
              href: "/binance-example",
            },
          ],
        },
        {
          type: "category",
          label: "Bybit",
          link: { type: "doc", id: "data-connectors/bybit" },
          items: [
            {
              type: "link",
              label: "Bybit Live Demo",
              href: "/bybit-example",
            },
          ],
        },
        {
          type: "category",
          label: "OKX",
          link: { type: "doc", id: "data-connectors/okx" },
          items: [
            {
              type: "link",
              label: "OKX Live Demo",
              href: "/okx-example",
            },
          ],
        },
        {
          type: "category",
          label: "Kraken",
          link: { type: "doc", id: "data-connectors/kraken" },
          items: [
            {
              type: "link",
              label: "Kraken Live Demo",
              href: "/kraken-example",
            },
          ],
        },
        {
          type: "category",
          label: "KuCoin",
          link: { type: "doc", id: "data-connectors/kucoin" },
          items: [
            {
              type: "link",
              label: "KuCoin Live Demo",
              href: "/kucoin-example",
            },
          ],
        },
        {
          type: "category",
          label: "Coinbase",
          link: { type: "doc", id: "data-connectors/coinbase" },
          items: [
            {
              type: "link",
              label: "Coinbase Live Demo",
              href: "/coinbase-example",
            },
          ],
        },
        {
          type: "category",
          label: "Gate.io",
          link: { type: "doc", id: "data-connectors/gate" },
          items: [
            {
              type: "link",
              label: "Gate.io Live Demo",
              href: "/gate-example",
            },
          ],
        },
        {
          type: "category",
          label: "CCXT",
          link: { type: "doc", id: "data-connectors/ccxt" },
          items: [
            {
              type: "link",
              label: "CCXT Live Demo",
              href: "/ccxt-example",
            },
          ],
        },
        {
          type: "category",
          label: "Twelve Data",
          link: { type: "doc", id: "data-connectors/twelve-data" },
          items: [
            {
              type: "link",
              label: "Twelve Data Live Demo",
              href: "/twelve-data-example",
            },
          ],
        },
        {
          type: "category",
          label: "Finage",
          link: { type: "doc", id: "data-connectors/finage" },
          items: [
            {
              type: "link",
              label: "Finage Live Demo",
              href: "/finage-example",
            },
          ],
        },
        {
          type: "category",
          label: "Finnhub",
          link: { type: "doc", id: "data-connectors/finnhub" },
          items: [
            {
              type: "link",
              label: "Finnhub Live Demo",
              href: "/finnhub-example",
            },
          ],
        },
        {
          type: "category",
          label: "EODHD",
          link: { type: "doc", id: "data-connectors/eodhd" },
          items: [
            {
              type: "link",
              label: "EODHD Live Demo",
              href: "/eodhd-example",
            },
          ],
        },
        {
          type: "category",
          label: "Massive",
          link: { type: "doc", id: "data-connectors/massive" },
          items: [
            {
              type: "link",
              label: "Massive Live Demo",
              href: "/massive-example",
            },
          ],
        },
        {
          type: "category",
          label: "CoinGecko",
          link: { type: "doc", id: "data-connectors/coingecko" },
          items: [
            {
              type: "link",
              label: "CoinGecko Live Demo",
              href: "/coingecko-example",
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Drawing Tools",
      link: { type: "doc", id: "drawing-tools/index" },
      items: [
        "drawing-tools/overview",
        "drawing-tools/catalog",
        "drawing-tools/tool-reference",
        "drawing-tools/trend-line",
        "drawing-tools/levels-and-channels",
        "drawing-tools/lines-ranges-and-tags",
        "drawing-tools/shapes-and-annotations",
      ],
    },
    {
      type: "category",
      label: "Advanced Integration",
      link: { type: "doc", id: "advanced/index" },
      items: [
        "advanced/chart-class-runtime",
        "advanced/react-ui-integration",
        "advanced/react-ui-toolbar-and-tools",
        "advanced/mobile-and-responsive",
      ],
    },
    {
      type: "category",
      label: "API Reference",
      link: { type: "doc", id: "api-reference/index" },
      items: [
        "api-reference/chart-instance",
        "api-reference/chart-ui",
        "api-reference/chart-environment",
        "api-reference/data-connectors",
      ],
    },
    {
      type: "category",
      label: "Indicators, Strategies, and Functions",
      link: { type: "doc", id: "scripts/index" },
      items: [
        "scripts/overview",
        "scripts/series-and-panels",
        "scripts/programmatic-wiring",
        "scripts/authoring-conventions",
        "scripts/indicators/overview",
        "scripts/indicators/custom-indicators",
        "scripts/indicators/catalog",
        "scripts/indicators/key-indicators",
        "scripts/strategies/overview",
        "scripts/strategies/custom-strategies",
        "scripts/strategies/catalog",
        "scripts/strategies/key-strategies",
        "scripts/functions/overview",
        "scripts/functions/custom-functions",
        "scripts/functions/catalog",
        "scripts/functions/key-functions",
      ],
    },
    {
      type: "category",
      label: "Theming",
      link: { type: "doc", id: "theming/index" },
      items: ["theming/overview", "theming/live-theme-creator"],
    },
    {
      type: "category",
      label: "Guides",
      link: { type: "doc", id: "guides/index" },
      items: [
        "guides/choosing-a-package",
        "guides/playground",
        "guides/faq-and-troubleshooting",
        "guides/licensing",
        "guides/mobile-qa-checklist",
      ],
    },
  ],
};

export default sidebars;
