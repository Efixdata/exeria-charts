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
  plugins: [require("./chartUiMonorepoPlugin")],
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
      logo: {
        alt: "Exeria",
        src: "img/exeria.svg",
        srcDark: "img/exeria-dark.svg",
        height: 28,
      },
      items: [
        {
          to: "/docs/getting-started/vanilla",
          label: "Getting started",
          position: "left",
        },
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/#features",
          label: "Features",
          position: "left",
        },
        {
          to: "/#case-studies",
          label: "Case studies",
          position: "left",
        },
        {
          to: "/playground",
          label: "Playground",
          position: "left",
        },
      ],
    },
    footer: {
      style: "dark",
      logo: {
        alt: "Exeria",
        src: "img/exeria.svg",
        srcDark: "img/exeria-dark.svg",
        href: "/",
        width: 111,
        height: 28,
      },
      links: [
        {
          title: "Product",
          items: [
            { label: "Overview", to: "/" },
            {
              label: "GitHub Repo",
              href: "https://github.com/Efixdata/exeria-charts",
            },
            { label: "Pro Plugins", to: "/#pricing" },
            { label: "Case studies", to: "/#case-studies" },
            { label: "Playground", to: "/playground" },
          ],
        },
        {
          title: "Resources",
          items: [
            { label: "Documentation", to: "/docs/intro" },
            { label: "Vanilla Quickstart", to: "/docs/getting-started/vanilla" },
            { label: "React Quickstart", to: "/docs/getting-started/react" },
            {
              label: "NPM Package",
              href: "https://www.npmjs.com/package/@efixdata/exeria-chart",
            },
          ],
        },
        {
          title: "Legal",
          items: [
            { label: "Contact Us", to: "/docs/guides/licensing#commercial-license" },
            {
              label: "AGPL v3 License",
              href: "https://www.gnu.org/licenses/agpl-3.0.html",
            },
            {
              label: "Commercial EULA",
              href: "https://github.com/Efixdata/exeria-charts/blob/main/LICENSING.md",
            },
            {
              label: "Privacy Policy",
              href: "https://exeriacharts.dev/privacy-policy",
            },
          ],
        },
      ],
      copyright: "Copyright © 2026 Exeria. Built for developers.",
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;