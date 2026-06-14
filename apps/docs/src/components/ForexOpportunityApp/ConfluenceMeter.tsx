import styles from "./forexOpportunityApp.module.css";

type ConfluenceMeterProps = {
  score: number;
  checks: string[];
};

export default function ConfluenceMeter({ score, checks }: ConfluenceMeterProps) {
  const width = Math.max(8, Math.min(100, score));

  return (
    <div className={styles.confluenceMeter}>
      <div className={styles.confluenceHeader}>
        <span>Confluence</span>
        <strong>+{score}</strong>
      </div>
      <div className={styles.confluenceTrack}>
        <div className={styles.confluenceFill} style={{ width: `${width}%` }} />
      </div>
      <ul className={styles.confluenceChecks}>
        {checks.map((check) => (
          <li key={check}>
            <span className={styles.confluenceCheckMark}>✓</span>
            {check}
          </li>
        ))}
      </ul>
    </div>
  );
}
