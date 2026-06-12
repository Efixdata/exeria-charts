"use client";

import { useMemo, useState } from "react";
import {
  INTEGRATION_LEVEL_TABS,
  RUN_LOCALLY_STEPS,
  SNIPPET_TABS,
  buildStarterCode,
  type CodeTabId,
} from "@site/src/components/CryptoTerminalApp/cryptoTerminalStarterCode";
import {
  GITHUB_VITE_REACT_TEMPLATE_URL,
  STACKBLITZ_STARTER_URL,
} from "@site/src/components/CryptoTerminalApp/integrationMapData";
import { downloadStarterZip } from "@site/src/components/CryptoTerminalApp/starterTemplateExport";
import type { TimeframeId } from "@site/src/components/CryptoTerminalApp/constants";
import GettingStartedSteps from "./GettingStartedSteps";
import WhatYouGet from "./WhatYouGet";
import styles from "./cryptoTerminalDeveloperSection.module.css";

const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_TIMEFRAME: TimeframeId = "hour";

const CODE_TAB_HINTS: Partial<Record<CodeTabId, string>> = {
  chartOnly: "Smallest possible chart — good first file to read.",
  chartUi: "Chart plus toolbar, themes, and drawing tools.",
  fullTerminal: "Closer to the live terminal layout (multi-panel shell).",
  layout: "Where each UI piece lives in the docs source tree.",
  chart: "How the chart is created and destroyed in React.",
  data: "Binance adapter and live candle streaming.",
  trade: "Click chart → set price, simulated order lines.",
};

export default function CryptoTerminalDeveloperSection() {
  const [activeTab, setActiveTab] = useState<CodeTabId>("chartUi");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const snippets = useMemo(
    () => buildStarterCode(DEFAULT_SYMBOL, DEFAULT_TIMEFRAME),
    [],
  );

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
      downloadStarterZip(DEFAULT_SYMBOL, DEFAULT_TIMEFRAME);
    } finally {
      window.setTimeout(() => setExporting(false), 600);
    }
  };

  const activeHint = CODE_TAB_HINTS[activeTab];

  return (
    <section className={styles.section} aria-labelledby="crypto-terminal-developer">
      <div className={styles.inner}>
        <h2 id="crypto-terminal-developer">For developers</h2>
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
                <code>src/App.tsx</code> plus extra examples in <code>snippets/</code>.
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
            {INTEGRATION_LEVEL_TABS.map((tab) => (
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
            {SNIPPET_TABS.map((tab) => (
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
