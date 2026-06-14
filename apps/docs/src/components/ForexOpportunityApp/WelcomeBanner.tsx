import Link from "@docusaurus/Link";
import styles from "./forexOpportunityApp.module.css";

const STEPS = [
  { step: 1, text: "Pick an opportunity in the left feed — chart syncs pair and timeframe." },
  { step: 2, text: "Click a colored news dot on the chart — see release line, impact zone, and pip move." },
  {
    step: 3,
    text: (
      <>
        When you are ready to build, open the{" "}
        <Link to="/starters/forex-platforms">starter page</Link> — download the zip or copy snippets,
        then wire your own feed.
      </>
    ),
  },
];

type WelcomeBannerProps = {
  onDismiss: () => void;
};

export default function WelcomeBanner({ onDismiss }: WelcomeBannerProps) {
  return (
    <section className={styles.welcomeBanner} aria-label="Welcome">
      <div className={styles.welcomeCopy}>
        <p className={styles.welcomeEyebrow}>FX Opportunity Radar · starter</p>
        <h2 className={styles.welcomeTitle}>The chart publishes opportunities — not just prices</h2>
        <p className={styles.welcomeLead}>
          Arb zones, strategy markers, and macro news dots on one canvas. Explore the flow, then wire
          your own feed when you ship.
        </p>
        <ol className={styles.welcomeSteps}>
          {STEPS.map((item) => (
            <li key={item.step}>
              <span className={styles.welcomeStepNum}>{item.step}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.welcomeActions}>
        <button type="button" className={styles.primaryButton} onClick={onDismiss}>
          Explore radar
        </button>
        <Link className={styles.ghostButton} to="/starters/forex-platforms">
          Download starter
        </Link>
      </div>
    </section>
  );
}
