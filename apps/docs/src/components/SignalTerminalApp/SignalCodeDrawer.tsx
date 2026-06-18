import { useMemo, useState } from "react";
import Link from "@docusaurus/Link";
import { STACKBLITZ_STARTER_URL } from "../CryptoTerminalApp/integrationMapData";
import {
  RUN_LOCALLY_STEPS,
  SIGNAL_CODE_TABS,
  buildSignalStarterCode,
  type SignalCodeTabId,
} from "./signalTerminalStarterCode";
import type { TimeframeId } from "./constants";
import styles from "./signalTerminalApp.module.css";

const TAB_HINTS: Partial<Record<SignalCodeTabId, string>> = {
  chartSignals: "Smallest integration — chart + built-in strategies.",
  chartUi: "Adds toolbar, themes, and drawing tools.",
  signalFeed: "Sidebar pattern for your screener or alert backend.",
};

type SignalCodeDrawerProps = {
  open: boolean;
  symbol: string;
  timeframeId: TimeframeId;
  onClose: () => void;
};

export default function SignalCodeDrawer({
  open,
  symbol,
  timeframeId,
  onClose,
}: SignalCodeDrawerProps) {
  const [activeTab, setActiveTab] = useState<SignalCodeTabId>("chartSignals");
  const [copied, setCopied] = useState(false);

  const snippets = useMemo(
    () => buildSignalStarterCode(symbol, timeframeId),
    [symbol, timeframeId],
  );

  if (!open) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[activeTab]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="Close source panel"
        onClick={onClose}
      />
      <section className={styles.drawer} aria-label="Starter source code">
        <div className={styles.drawerHeader}>
          <div>
            <h2 className={styles.drawerTitle}>Start building your signal terminal</h2>
            <p className={styles.drawerLead}>
              Copy a snippet, scaffold with Vite, or open a blank template. Strategies use built-in
              keys (<code>CROSS</code>, <code>EXCEED</code>) — wire your screener feed next.
            </p>
          </div>
          <div className={styles.drawerActions}>
            <button type="button" className={styles.primaryButton} onClick={() => void handleCopy()}>
              {copied ? "Copied" : "Copy snippet"}
            </button>
            <a
              className={styles.ghostButton}
              href={STACKBLITZ_STARTER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in StackBlitz
            </a>
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Close
            </button>
          </div>
        </div>

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

        {TAB_HINTS[activeTab] ? <p className={styles.tabHint}>{TAB_HINTS[activeTab]}</p> : null}

        <pre className={styles.codeBlock}>
          <code>{snippets[activeTab]}</code>
        </pre>

        <h3 className={styles.runHeading}>Run locally</h3>
        <pre className={styles.runSteps}>{RUN_LOCALLY_STEPS}</pre>

        <p className={styles.drawerFooter}>
          Next:{" "}
          <Link to="/docs/scripts/strategies/key-strategies">Key strategies</Link>
          {" · "}
          <Link to="/docs/tutorials/live-data-stream">Live data stream</Link>
          {" · "}
          <Link to="/starters/screener-signals">Case study</Link>
        </p>
      </section>
    </>
  );
}
