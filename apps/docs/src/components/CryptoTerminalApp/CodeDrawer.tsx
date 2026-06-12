import { useMemo, useState } from "react";
import {
  INTEGRATION_LEVEL_TABS,
  RUN_LOCALLY_STEPS,
  SNIPPET_TABS,
  buildStarterCode,
  type CodeTabId,
  type IntegrationLevelId,
} from "./cryptoTerminalStarterCode";
import { GITHUB_VITE_REACT_TEMPLATE_URL, STACKBLITZ_STARTER_URL } from "./integrationMapData";
import { downloadStarterZip } from "./starterTemplateExport";
import type { TimeframeId } from "./constants";
import styles from "./cryptoTerminalApp.module.css";

type CodeDrawerProps = {
  open: boolean;
  symbol: string;
  timeframeId: TimeframeId;
  onClose: () => void;
};

function isIntegrationTab(id: CodeTabId): id is IntegrationLevelId {
  return id === "chartOnly" || id === "chartUi" || id === "fullTerminal";
}

export default function CodeDrawer({ open, symbol, timeframeId, onClose }: CodeDrawerProps) {
  const [activeTab, setActiveTab] = useState<CodeTabId>("chartUi");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const snippets = useMemo(
    () => buildStarterCode(symbol, timeframeId),
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

  const handleDownloadZip = () => {
    setExporting(true);
    try {
      downloadStarterZip(symbol, timeframeId);
    } finally {
      window.setTimeout(() => setExporting(false), 600);
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
          <h2 className={styles.drawerTitle}>Starter source — pro workspace</h2>
          <div className={styles.drawerActions}>
            <button type="button" className={styles.ghostButton} onClick={handleDownloadZip}>
              {exporting ? "Preparing…" : "Download ZIP"}
            </button>
            <a
              className={styles.ghostButton}
              href={STACKBLITZ_STARTER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              StackBlitz
            </a>
            <a
              className={styles.ghostButton}
              href={GITHUB_VITE_REACT_TEMPLATE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub template
            </a>
            <button type="button" className={styles.ghostButton} onClick={() => void handleCopy()}>
              {copied ? "Copied" : "Copy tab"}
            </button>
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className={styles.drawerSectionLabel}>Integration level</div>
        <div className={styles.tabRow} role="tablist" aria-label="Integration levels">
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
        </div>

        <div className={styles.drawerSectionLabel}>Snippets</div>
        <div className={styles.tabRow} role="tablist" aria-label="Code snippets">
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

        <div className={styles.codeBlockWrap}>
          <pre className={styles.codeBlock}>
            <code>{snippets[activeTab]}</code>
          </pre>
        </div>

        <p className={styles.stackBlitzNote}>
          <strong>Download ZIP</strong> ships a Vite + React + TS project with snippets. StackBlitz
          and GitHub template are alternative starting points — paste the Chart + ChartUI tab if
          needed, then <code>npm install</code> and <code>npm run dev</code>.
        </p>

        <pre className={styles.runSteps}>{RUN_LOCALLY_STEPS}</pre>
      </section>
    </>
  );
}
