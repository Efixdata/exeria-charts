"use client";

import { useMemo, useState } from "react";
import Link from "@docusaurus/Link";
import { STACKBLITZ_STARTER_URL } from "@site/src/components/CryptoTerminalApp/integrationMapData";
import {
  RUN_LOCALLY_STEPS,
  SIGNAL_CODE_TABS,
  buildSignalStarterCode,
  type SignalCodeTabId,
} from "@site/src/components/SignalTerminalApp/signalTerminalStarterCode";
import GettingStartedSteps from "./GettingStartedSteps";
import WhatYouGet from "./WhatYouGet";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const DEFAULT_SYMBOL = "BTCUSDT";

const CODE_TAB_HINTS: Partial<Record<SignalCodeTabId, string>> = {
  chartSignals: "Smallest integration — chart + built-in strategies.",
  chartUi: "Adds toolbar, themes, and drawing tools.",
  signalFeed: "Sidebar pattern for your screener or alert backend.",
};

export default function ScreenerSignalsDeveloperSection() {
  const [activeTab, setActiveTab] = useState<SignalCodeTabId>("chartSignals");
  const [copied, setCopied] = useState(false);

  const snippets = useMemo(() => buildSignalStarterCode(DEFAULT_SYMBOL, "hour"), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[activeTab]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const activeHint = CODE_TAB_HINTS[activeTab];

  return (
    <section className={styles.section} aria-labelledby="screener-signals-developer">
      <div className={styles.inner}>
        <h2 id="screener-signals-developer">For developers</h2>
        <p className={styles.lead}>
          This page is your starting point: try the live screener, copy a React snippet, run it on
          your machine, then connect your signal backend. Follow the steps below and edit one file at
          a time.
        </p>

        <GettingStartedSteps />

        <WhatYouGet />

        <div className={styles.sourcePanel}>
          <div className={styles.sourceHeader}>
            <div>
              <h3>Starter code</h3>
              <p>
                Copy a snippet into your app or open a blank Vite template. Strategies use built-in
                keys (<code>CROSS</code>, <code>EXCEED</code>) — wire your screener feed next.
              </p>
            </div>
            <div className={styles.sourceActions}>
              <button type="button" className={styles.actionButtonPrimary} onClick={() => void handleCopy()}>
                {copied ? "Copied" : "Copy snippet"}
              </button>
              <a
                className={styles.actionButton}
                href={STACKBLITZ_STARTER_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in StackBlitz
              </a>
              <Link className={styles.actionButton} to="/starters/screener-signals/app">
                Open live screener
              </Link>
            </div>
          </div>

          <p className={styles.tabLegend}>Pick one example to view or copy:</p>

          <div className={styles.tabRow} role="tablist" aria-label="Starter examples">
            {SIGNAL_CODE_TABS.map((tab) => (
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

          <p className={styles.stepsIntro}>
            Next:{" "}
            <Link to="/docs/scripts/strategies/key-strategies">Key strategies</Link>
            {" · "}
            <Link to="/docs/tutorials/live-data-stream">Live data stream</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
