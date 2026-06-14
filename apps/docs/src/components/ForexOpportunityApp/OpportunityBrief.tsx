import type { ArbMetrics } from "@exeria/charts";
import type { ChartNewsEvent } from "./chartNews";
import { formatNewsTime, formatPips } from "./chartNews";
import type { ArbSignalRecord } from "@exeria/charts";
import ConfluenceMeter from "./ConfluenceMeter";
import styles from "./forexOpportunityApp.module.css";

type OpportunityBriefProps = {
  opportunity: ArbSignalRecord | null;
  linkedNews: ChartNewsEvent | null;
  onSaveAlert?: () => void;
};

export default function OpportunityBrief({
  opportunity,
  linkedNews,
  onSaveAlert,
}: OpportunityBriefProps) {
  if (!opportunity) {
    return (
      <aside className={styles.briefPanel} data-tour="signal-brief">
        <p className={styles.briefEmpty}>Select an opportunity to see why it is unusual.</p>
      </aside>
    );
  }

  const checks =
    opportunity.confluenceChecks ??
    opportunity.brief.unusualBecause.slice(0, 3);

  return (
    <aside className={styles.briefPanel} aria-label="Signal brief" data-tour="signal-brief">
      <p className={styles.briefEyebrow}>Unusual because</p>
      <ul className={styles.briefList}>
        {opportunity.brief.unusualBecause.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {opportunity.brief.confluence !== undefined ? (
        <ConfluenceMeter score={opportunity.brief.confluence} checks={checks} />
      ) : null}

      {opportunity.lastSeenDays !== undefined ? (
        <p className={styles.briefLastSeen}>
          Last similar setup: <strong>{opportunity.lastSeenDays} sessions ago</strong>
        </p>
      ) : null}

      <div className={styles.briefThesis}>
        <p className={styles.briefEyebrow}>Thesis</p>
        <p>{opportunity.brief.thesis}</p>
      </div>

      {opportunity.playbook ? (
        <div className={styles.briefPlaybook}>
          <p className={styles.briefEyebrow}>Reaction playbook</p>
          <p>{opportunity.playbook}</p>
        </div>
      ) : null}

      {opportunity.category === "arb" && opportunity.arbMetrics ? (
        <ArbMetricsPanel metrics={opportunity.arbMetrics} />
      ) : null}

      {linkedNews ? (
        <div className={styles.briefNews}>
          <p className={styles.briefEyebrow}>On chart</p>
          <strong>{linkedNews.headline}</strong>
          <dl className={styles.briefNewsMeta}>
            <div>
              <dt>Released</dt>
              <dd>{formatNewsTime(linkedNews.stamp)}</dd>
            </div>
            <div>
              <dt>15m move</dt>
              <dd>{formatPips(linkedNews.impact.pips15m)}</dd>
            </div>
            <div>
              <dt>1h move</dt>
              <dd>{formatPips(linkedNews.impact.pips1h)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {onSaveAlert ? (
        <button type="button" className={styles.alertPreviewButton} onClick={onSaveAlert}>
          Save alert (preview)
        </button>
      ) : null}
    </aside>
  );
}

function ArbMetricsPanel({ metrics }: { metrics: ArbMetrics }) {
  const hasTriangular =
    metrics.impliedEurGbp != null &&
    metrics.quotedEurGbp != null &&
    metrics.impliedEurGbp > 0;

  return (
    <div className={styles.arbCalculator}>
      <p className={styles.briefEyebrow}>
        {metrics.label ?? "Arb calculator"}
      </p>
      <dl>
        {hasTriangular ? (
          <>
            <div>
              <dt>Implied EUR/GBP</dt>
              <dd>{metrics.impliedEurGbp!.toFixed(5)}</dd>
            </div>
            <div>
              <dt>Quoted EUR/GBP</dt>
              <dd>{metrics.quotedEurGbp!.toFixed(5)}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>Edge</dt>
          <dd>{formatPips(metrics.edgePips)}</dd>
        </div>
      </dl>
    </div>
  );
}
