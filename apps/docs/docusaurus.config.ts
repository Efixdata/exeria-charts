import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "Exeria Charts",
  tagline: "Customizable financial charts for web apps, dashboards, and trading surfaces.",
  favicon: "img/favicon.ico",
  url: "https://exeriacharts.dev",
  baseUrl: "/",
  organizationName: "Efixdata",
  projectName: "exeria-charts",
  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "docs",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    image: "img/social-card.jpg",
    navbar: {
      title: "Exeria Charts",
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/docs/getting-started/vanilla",
          label: "Getting Started",
          position: "left",
        },
        {
          href: "https://github.com/Efixdata/exeria-charts",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Overview",
              to: "/docs/intro",
            },
            {
              label: "Vanilla Quickstart",
              to: "/docs/getting-started/vanilla",
            },
            {
              label: "React Quickstart",
              to: "/docs/getting-started/react",
            },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "License",
              to: "/docs/guides/licensing",
            },
            {
              label: "GitHub",
              href: "https://github.com/Efixdata/exeria-charts",
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Efix Data Sp. z o. o.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;