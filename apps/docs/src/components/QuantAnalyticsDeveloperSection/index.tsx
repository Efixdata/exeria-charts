"use client";

import { useMemo, useState } from "react";
import {
  GITHUB_VITE_REACT_TEMPLATE_URL,
  STACKBLITZ_STARTER_URL,
} from "@site/src/components/CryptoTerminalApp/integrationMapData";
import {
  QUANT_INTEGRATION_LEVEL_TABS,
  QUANT_SNIPPET_TABS,
  RUN_LOCALLY_STEPS,
  buildQuantStarterCode,
  type QuantCodeTabId,
} from "@site/src/components/QuantAnalyticsApp/quantStarterCode";
import { downloadQuantStarterZip } from "@site/src/components/QuantAnalyticsApp/quantStarterTemplateExport";
import GettingStartedSteps from "./GettingStartedSteps";
import WhatYouGet from "./WhatYouGet";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const CODE_TAB_HINTS: Partial<Record<QuantCodeTabId, string>> = {
  chartOnly: "Smallest possible FX chart — good first file to read.",
  chartUi: "Chart plus toolbar and the default WMA/EMA composite preset.",
  quantShell: "Sidebar with strategy presets and a full-height chart area.",
  wmaEmaComposite: "Full wiring: WMA, EMA, filters, Cross, Join, and equity curve.",
  bollingerBreakout: "BBAND + EXCEED — signals when price closes outside the bands.",
  meanReversion: "BBAND + REBOUND — signals when price returns inside the bands.",
  equityCurve: "Attach the EQUITY script to any strategy output.",
  programmaticWiring: "How to clone scripts, set inputs, and reference series.",
  integrationMap: "Where each piece lives in the docs source tree.",
};

export default function QuantAnalyticsDeveloperSection() {
  const [activeTab, setActiveTab] = useState<QuantCodeTabId>("chartUi");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const snippets = useMemo(() => buildQuantStarterCode(), []);

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
      downloadQuantStarterZip();
    } finally {
      window.setTimeout(() => setExporting(false), 600);
    }
  };

  const activeHint = CODE_TAB_HINTS[activeTab];

  return (
    <section className={styles.section} aria-labelledby="quant-analytics-developer">
      <div className={styles.inner}>
        <h2 id="quant-analytics-developer">For developers</h2>
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
                <code>src/App.tsx</code>, strategy wiring in <code>src/mountQuantDashboard.ts</code>,
                bundled EUR/USD candles in <code>public/data/</code>, and extra examples in{" "}
                <code>snippets/</code>.
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
            {QUANT_INTEGRATION_LEVEL_TABS.map((tab) => (
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
            {QUANT_SNIPPET_TABS.map((tab) => (
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
