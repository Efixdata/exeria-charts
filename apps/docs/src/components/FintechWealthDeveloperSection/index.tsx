"use client";

import { useMemo, useState } from "react";
import {
  INTEGRATION_LEVEL_TABS,
  RUN_LOCALLY_STEPS,
  SNIPPET_TABS,
  buildFintechStarterCode,
  type FintechCodeTabId,
} from "@site/src/components/FintechWealthApp/fintechStarterCode";
import { downloadFintechStarterZip } from "@site/src/components/FintechWealthApp/fintechStarterTemplateExport";
import {
  GITHUB_VITE_REACT_TEMPLATE_URL,
  STACKBLITZ_STARTER_URL,
} from "@site/src/components/FintechWealthApp/fintechIntegrationMapData";
import GettingStartedSteps from "./GettingStartedSteps";
import WhatYouGet from "./WhatYouGet";
import styles from "./fintechWealthDeveloperSection.module.css";

const DEFAULT_PERIOD = "1m" as const;
const DEFAULT_MARKET = "equities" as const;

const CODE_TAB_HINTS: Partial<Record<FintechCodeTabId, string>> = {
  compareChart: "Smallest working compare chart — good first file to read.",
  wealthShell: "Portfolio header, cash row, and period pills.",
  fullApp: "Single-page layout with chart and holdings list.",
  layout: "Where each UI piece lives in the docs source tree.",
  chartSetup: "Multi-overlay compare chart and % axis chrome.",
  equityData: "Load historical bars from static CSV fixtures.",
  portfolio: "Cash + positions × price portfolio model.",
};

export default function FintechWealthDeveloperSection() {
  const [activeTab, setActiveTab] = useState<FintechCodeTabId>("compareChart");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const snippets = useMemo(
    () => buildFintechStarterCode(DEFAULT_PERIOD, DEFAULT_MARKET),
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
    void downloadFintechStarterZip(DEFAULT_PERIOD, DEFAULT_MARKET).finally(() => {
      window.setTimeout(() => setExporting(false), 600);
    });
  };

  const activeHint = CODE_TAB_HINTS[activeTab];

  return (
    <section className={styles.section} aria-labelledby="fintech-wealth-developer">
      <div className={styles.inner}>
        <h2 id="fintech-wealth-developer">For developers</h2>
        <p className={styles.lead}>
          This page is your starting point: try the consumer demo, download a small React project, run
          it on your machine, then change whatever you want. Equities use static CSV fixtures; the
          live demo also supports a Crypto toggle with Binance data.
        </p>

        <GettingStartedSteps />

        <WhatYouGet />

        <div className={styles.sourcePanel}>
          <div className={styles.sourceHeader}>
            <div>
              <h3>Starter code</h3>
              <p>
                Download a zip, or copy a snippet into your own app. The zip includes{" "}
                <code>src/App.tsx</code>, <code>src/equityDataLoader.ts</code>, CSV fixtures in{" "}
                <code>public/data/fintech-equity/</code>, and extra examples in <code>snippets/</code>
                .
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
