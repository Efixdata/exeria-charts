"use client";

import { useMemo, useState } from "react";
import Link from "@docusaurus/Link";
import {
  GITHUB_VITE_REACT_TEMPLATE_URL,
  STACKBLITZ_STARTER_URL,
} from "@site/src/components/CryptoTerminalApp/integrationMapData";
import { downloadMarketNewsStarterZip } from "@site/src/components/MarketNewsApp/marketNewsStarterExport";
import {
  MARKET_NEWS_INTEGRATION_TABS,
  MARKET_NEWS_RUN_LOCALLY_STEPS,
  MARKET_NEWS_SNIPPET_TABS,
  buildMarketNewsStarterCode,
  type MarketNewsCodeTabId,
} from "@site/src/components/MarketNewsApp/marketNewsStarterCode";
import GettingStartedSteps from "./GettingStartedSteps";
import WhatYouGet from "./WhatYouGet";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const CODE_TAB_HINTS: Partial<Record<MarketNewsCodeTabId, string>> = {
  embedChart: "Smallest possible chart — one div, one line series.",
  multiInstrument: "Two FX pairs on one axis, indexed to 100.",
  newsFeed: "Macro headlines as dots on the canvas.",
  articleShell: "HTML figure + caption pattern for any CMS.",
  articleApp: "Full React article — this is what ships in the ZIP as src/App.tsx.",
};

export default function MarketNewsDeveloperSection() {
  const [activeTab, setActiveTab] = useState<MarketNewsCodeTabId>("embedChart");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const snippets = useMemo(() => buildMarketNewsStarterCode(), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[activeTab]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadZip = () => {
    setExporting(true);
    try {
      downloadMarketNewsStarterZip();
    } finally {
      window.setTimeout(() => setExporting(false), 600);
    }
  };

  const activeHint = CODE_TAB_HINTS[activeTab];

  return (
    <section className={styles.section} aria-labelledby="market-news-developer">
      <div className={styles.inner}>
        <h2 id="market-news-developer">For developers</h2>
        <p className={styles.lead}>
          This page is your starting point: try the article demo, download a small React project,
          run it locally, then drop charts into your CMS. You do not need the whole Exeria codebase —
          follow the steps below and edit one file at a time (perfect for vibe coding in Cursor).
        </p>

        <GettingStartedSteps />

        <WhatYouGet />

        <div className={styles.sourcePanel}>
          <div className={styles.sourceHeader}>
            <div>
              <h3>Starter code</h3>
              <p>
                Download a zip with sample FX JSON, or copy a snippet into your own app. The zip
                includes <code>src/App.tsx</code> plus smaller examples in <code>snippets/</code>.
              </p>
            </div>
            <div className={styles.sourceActions}>
              <button type="button" className={styles.actionButtonPrimary} onClick={handleDownloadZip}>
                {exporting ? "Preparing…" : "Download ZIP"}
              </button>
              <a
                className={styles.actionButton}
                href={STACKBLITZ_STARTER_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in StackBlitz
              </a>
              <a
                className={styles.actionButton}
                href={GITHUB_VITE_REACT_TEMPLATE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Blank Vite template
              </a>
              <button type="button" className={styles.actionButton} onClick={() => void handleCopy()}>
                {copied ? "Copied" : "Copy snippet"}
              </button>
              <Link className={styles.actionButton ?? ""} to="/starters/market-news/app">
                Open live article
              </Link>
            </div>
          </div>

          <p className={styles.tabLegend}>Pick one example to view or copy:</p>

          <div className={styles.tabRow} role="tablist" aria-label="Starter examples">
            {MARKET_NEWS_INTEGRATION_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={[styles.tab, activeTab === tab.id ? styles.tabActive : undefined]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            {MARKET_NEWS_SNIPPET_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={[styles.tab, activeTab === tab.id ? styles.tabActive : undefined]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeHint ? <p className={styles.tabHint}>{activeHint}</p> : null}

          <pre className={styles.codeBlock}>
            <code>{snippets[activeTab]}</code>
          </pre>

          <h4 className={styles.runHeading}>Commands to run in your terminal</h4>
          <pre className={styles.runSteps}>{MARKET_NEWS_RUN_LOCALLY_STEPS}</pre>
        </div>
      </div>
    </section>
  );
}
