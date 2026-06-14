"use client";

import { useMemo, useState } from "react";
import {
  GITHUB_VITE_REACT_TEMPLATE_URL,
  STACKBLITZ_STARTER_URL,
} from "@site/src/components/CryptoTerminalApp/integrationMapData";
import {
  FOREX_INTEGRATION_LEVEL_TABS,
  FOREX_SNIPPET_TABS,
  RUN_LOCALLY_STEPS,
  buildForexStarterCode,
  type ForexCodeTabId,
} from "@site/src/components/ForexOpportunityApp/forexOpportunityStarterCode";
import { downloadForexStarterZip } from "@site/src/components/ForexOpportunityApp/forexStarterTemplateExport";
import GettingStartedSteps from "./GettingStartedSteps";
import WhatYouGet from "./WhatYouGet";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const CODE_TAB_HINTS: Partial<Record<ForexCodeTabId, string>> = {
  chartOnly: "Smallest possible FX chart — good first file to read.",
  chartUi: "Chart plus toolbar and NEWSFEED indicator.",
  opportunityShell: "Three-column radar layout (feed · chart · brief).",
  strategies: "CROSS + EXCEED — buy/sell markers on the canvas.",
  publishNews: "Colored news dots and impact overlays.",
  opportunityFeed: "Left-rail pattern for arb, rare setups, and macro events.",
  wireBackend: "Swap static JSON for Kraken or your own APIs.",
  integrationMap: "Where each piece lives in the docs source tree.",
};

export default function ForexOpportunityDeveloperSection() {
  const [activeTab, setActiveTab] = useState<ForexCodeTabId>("chartUi");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const snippets = useMemo(() => buildForexStarterCode(), []);

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
      downloadForexStarterZip();
    } finally {
      window.setTimeout(() => setExporting(false), 600);
    }
  };

  const activeHint = CODE_TAB_HINTS[activeTab];

  return (
    <section className={styles.section} aria-labelledby="forex-opportunity-developer">
      <div className={styles.inner}>
        <h2 id="forex-opportunity-developer">For developers</h2>
        <p className={styles.lead}>
          This page is your starting point: try the demo, download a small React project, run it on
          your machine, then change whatever you want. You do not need to understand the whole
          codebase on day one — follow the steps below and edit one file at a time.
        </p>

        <GettingStartedSteps />

        <WhatYouGet />

        <div className={styles.sourcePanel}>
          <div className={styles.sourceHeader}>
            <div>
              <h3>Starter code</h3>
              <p>
                Download a zip, or copy a snippet into your own app. The zip includes{" "}
                <code>src/App.tsx</code>, bundled EUR/USD candles in <code>public/data/</code>, and
                extra examples in <code>snippets/</code>.
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
            </div>
          </div>

          <p className={styles.tabLegend}>Pick one example to view or copy:</p>

          <div className={styles.tabRow} role="tablist" aria-label="Starter examples">
            {FOREX_INTEGRATION_LEVEL_TABS.map((tab) => (
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
            {FOREX_SNIPPET_TABS.map((tab) => (
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
          <pre className={styles.runSteps}>{RUN_LOCALLY_STEPS}</pre>
        </div>
      </div>
    </section>
  );
}
