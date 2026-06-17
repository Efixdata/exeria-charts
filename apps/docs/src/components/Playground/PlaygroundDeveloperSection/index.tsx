"use client";

import Link from "@docusaurus/Link";
import { useEffect, useMemo, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval } from "@site/src/components/chartExampleData";
import {
  type ChartColorKey,
  type UiColorKey,
  type ThemeVariant,
  type VariantPalette,
  buildChartTheme,
  buildUiTheme,
  formatApplySnippet,
  formatCodeBlock,
} from "@site/src/components/themeCreator/core";
import {
  buildPlaygroundLiveSnippet,
  formatPlaygroundChartSummary,
  readPlaygroundChartSnapshot,
  type PlaygroundChartSnapshot,
} from "../playgroundChartSnippet";
import styles from "./playgroundDeveloperSection.module.css";

const NPM_INSTALL = "npm install @efixdata/exeria-chart @efixdata/exeria-chart-ui-react";

type ThemeCodeTabId = "full" | "runtime" | "ui";

const THEME_TABS: Array<{ id: ThemeCodeTabId; label: string; hint: string }> = [
  {
    id: "full",
    label: "Full example",
    hint: "Best place to start. Copy this into a new React file after you install the packages.",
  },
  {
    id: "runtime",
    label: "Chart colors",
    hint: "Only the chart surface colors. Pass this into createChart({ theme, themeVariant }).",
  },
  {
    id: "ui",
    label: "Toolbar colors",
    hint: "Colors for buttons, menus, and dialogs. Pass the matching entry into <ChartUI theme={...} />.",
  },
];

const NEXT_STEPS = [
  {
    title: "Vanilla quickstart",
    text: "No React yet? Start with a plain HTML page.",
    to: "/docs/getting-started/vanilla",
  },
  {
    title: "Custom theme tutorial",
    text: "Step-by-step guide for colors and light/dark mode.",
    to: "/docs/tutorials/custom-theme",
  },
  {
    title: "Crypto terminal starter",
    text: "Download a full app with live prices and a trade panel.",
    to: "/starters/crypto-terminal",
  },
  {
    title: "Chart API reference",
    text: "Look up every chart method when you need details.",
    to: "/docs/api-reference/chart-instance",
  },
] as const;

type PlaygroundDeveloperSectionProps = {
  chartColorsByVariant: VariantPalette<ChartColorKey>;
  uiColorsByVariant: VariantPalette<UiColorKey>;
  themeVariant: ThemeVariant;
  chart: ChartInstance | null;
};

export default function PlaygroundDeveloperSection({
  chartColorsByVariant,
  uiColorsByVariant,
  themeVariant,
  chart,
}: PlaygroundDeveloperSectionProps) {
  const [activeThemeTab, setActiveThemeTab] = useState<ThemeCodeTabId>("full");
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [chartSnapshot, setChartSnapshot] = useState<PlaygroundChartSnapshot | null>(null);

  const runtimeTheme = useMemo(
    () => buildChartTheme(chartColorsByVariant),
    [chartColorsByVariant],
  );
  const uiThemes = useMemo(
    () => ({
      dark: buildUiTheme(uiColorsByVariant.dark, "dark", chartColorsByVariant.dark.accent),
      light: buildUiTheme(uiColorsByVariant.light, "light", chartColorsByVariant.light.accent),
    }),
    [chartColorsByVariant, uiColorsByVariant],
  );

  const themeSnippets = useMemo(
    () => ({
      full: formatApplySnippet(runtimeTheme, uiThemes, docsInterval, themeVariant),
      runtime: formatCodeBlock("runtimeTheme", runtimeTheme),
      ui: formatCodeBlock("uiThemes", uiThemes),
    }),
    [runtimeTheme, themeVariant, uiThemes],
  );

  const liveSnippet = useMemo(
    () => buildPlaygroundLiveSnippet(chartSnapshot),
    [chartSnapshot],
  );

  const chartSummary = useMemo(
    () => formatPlaygroundChartSummary(chartSnapshot),
    [chartSnapshot],
  );

  useEffect(() => {
    if (!chart) {
      setChartSnapshot(null);
      return undefined;
    }

    const refreshSnapshot = () => {
      setChartSnapshot(readPlaygroundChartSnapshot(chart));
    };

    refreshSnapshot();
    const intervalId = window.setInterval(refreshSnapshot, 1500);

    return () => window.clearInterval(intervalId);
  }, [chart]);

  useEffect(() => {
    if (!copiedLabel) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopiedLabel(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copiedLabel]);

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
    } catch {
      setCopiedLabel("Copy failed");
    }
  };

  const activeThemeHint =
    THEME_TABS.find((tab) => tab.id === activeThemeTab)?.hint ?? THEME_TABS[0]!.hint;
  const activeThemeCode = themeSnippets[activeThemeTab];

  return (
    <section
      id="playground-developer"
      className={styles.section}
      aria-labelledby="playground-developer-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="playground-developer-title" className={styles.title}>
            Use this chart in your app
          </h2>
          <p className={styles.lead}>
            You do not need to understand every line below. Tune the chart above, then copy the
            code into your own project.
          </p>
        </header>

        <div className={styles.stepBlock}>
          <div className={styles.stepHeading}>
            <span className={styles.stepNumber} aria-hidden>
              1
            </span>
            <div>
              <h3 className={styles.stepTitle}>Install the packages</h3>
              <p className={styles.stepText}>
                Open your terminal, go to your project folder, and run this command. You need{" "}
                <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">
                  Node.js 18+
                </a>
                .
              </p>
            </div>
          </div>

          <div className={styles.installRow}>
            <pre className={styles.installCode}>
              <code>{NPM_INSTALL}</code>
            </pre>
            <button
              type="button"
              className={styles.copyButtonPrimary}
              onClick={() => void copyText("Install command", NPM_INSTALL)}
            >
              Copy command
            </button>
          </div>
        </div>

        <div className={styles.stepBlock}>
          <div className={styles.stepHeading}>
            <span className={styles.stepNumber} aria-hidden>
              2
            </span>
            <div>
              <h3 className={styles.stepTitle}>Copy the theme code</h3>
              <p className={styles.stepText}>
                This matches the colors you picked in the panel on the left. Start with{" "}
                <strong>Full example</strong> if you are new to coding.
              </p>
            </div>
          </div>

          <div className={styles.tabRow} role="tablist" aria-label="Theme code snippets">
            {THEME_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeThemeTab === tab.id}
                className={activeThemeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => setActiveThemeTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className={styles.tabHint}>{activeThemeHint}</p>

          <div className={styles.codeHeader}>
            <span className={styles.copyStatus}>
              {copiedLabel ? `${copiedLabel} copied` : ""}
            </span>
            <button
              type="button"
              className={styles.copyButtonPrimary}
              onClick={() => void copyText("Theme code", activeThemeCode)}
            >
              Copy code
            </button>
          </div>

          <pre className={styles.codeBlock}>
            <code>{activeThemeCode}</code>
          </pre>
        </div>

        <div className={styles.stepBlock}>
          <div className={styles.stepHeading}>
            <span className={styles.stepNumber} aria-hidden>
              3
            </span>
            <div>
              <h3 className={styles.stepTitle}>Match what is on your chart</h3>
              <p className={styles.stepText}>
                Add indicators or switch to line mode in the chart toolbar. The code below updates
                automatically so you can copy the same setup into your app.
              </p>
            </div>
          </div>

          <p className={styles.chartSummary}>On your chart now: {chartSummary}</p>

          <div className={styles.codeHeader}>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => void copyText("Chart setup", liveSnippet)}
            >
              Copy chart setup
            </button>
          </div>

          <pre className={styles.codeBlock}>
            <code>{liveSnippet}</code>
          </pre>
        </div>

        <div className={styles.nextSteps}>
          <div className={styles.stepHeading}>
            <span className={styles.stepNumber} aria-hidden>
              →
            </span>
            <div>
              <h3 className={styles.stepTitle}>Where to go next</h3>
              <p className={styles.stepText}>
                The playground is for trying things out. When you are ready to build a real app,
                pick one of these pages.
              </p>
            </div>
          </div>

          <div className={styles.nextGrid}>
            {NEXT_STEPS.map((item) => (
              <Link key={item.to} to={item.to} className={styles.nextLink}>
                <span className={styles.nextLinkTitle}>{item.title}</span>
                <span className={styles.nextLinkText}>{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
