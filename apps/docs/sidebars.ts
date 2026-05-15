import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/vanilla",
        "getting-started/react",
        "getting-started/vite-react",
        "getting-started/nextjs-app-router",
      ],
    },
    {
      type: "category",
      label: "Core Concepts",
      items: [
        "core-concepts/chart-lifecycle",
        "core-concepts/data-model",
        "core-concepts/rendering-and-scales",
      ],
    },
    {
      type: "category",
      label: "Chart Usage",
      items: [
        "chart-usage/loading-data",
        "chart-usage/realtime-updates",
        "chart-usage/drawing-and-interaction",
      ],
    },
    {
      type: "category",
      label: "Drawing Tools",
      items: [
        "drawing-tools/overview",
        "drawing-tools/catalog",
        "drawing-tools/trend-line",
        "drawing-tools/levels-and-channels",
        "drawing-tools/lines-ranges-and-tags",
        "drawing-tools/shapes-and-annotations",
      ],
    },
    {
      type: "category",
      label: "Advanced Integration",
      items: ["advanced/chart-class-runtime"],
    },
    {
      type: "category",
      label: "API Reference",
      items: ["api-reference/chart-instance"],
    },
    {
      type: "category",
      label: "Indicators, Strategies, and Functions",
      items: [
        "scripts/overview",
        "scripts/programmatic-wiring",
        "scripts/indicators/overview",
        "scripts/indicators/catalog",
        "scripts/indicators/key-indicators",
        "scripts/strategies/overview",
        "scripts/strategies/catalog",
        "scripts/strategies/key-strategies",
        "scripts/functions/overview",
        "scripts/functions/catalog",
        "scripts/functions/key-functions",
      ],
    },
    {
      type: "category",
      label: "Theming",
      items: ["theming/overview", "theming/live-theme-creator"],
    },
    {
      type: "category",
      label: "Guides",
      items: ["guides/choosing-a-package", "guides/licensing"],
    },
  ],
};

export default sidebars;