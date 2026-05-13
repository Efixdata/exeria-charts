import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      items: ["getting-started/vanilla", "getting-started/react"],
    },
    {
      type: "category",
      label: "Guides",
      items: ["guides/choosing-a-package", "guides/licensing"],
    },
  ],
};

export default sidebars;