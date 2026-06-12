import { TRY_THESE_STEPS } from "./constants";
import styles from "./signalTerminalApp.module.css";

type WelcomeBannerProps = {
  onDismiss: () => void;
  onOpenCode: () => void;
};

export default function WelcomeBanner({ onDismiss, onOpenCode }: WelcomeBannerProps) {
  return (
    <section className={styles.welcomeBanner} aria-label="Welcome">
      <div className={styles.welcomeCopy}>
        <p className={styles.welcomeEyebrow}>Signal terminal · starter layout</p>
        <h2 className={styles.welcomeTitle}>
          This is what your users see — screener, thesis, chart proof
        </h2>
        <p className={styles.welcomeLead}>
          Successful signal products (Finviz, Fillipio, AKIRON) combine ranked alerts, plain-language
          reasoning, and a chart that proves the call. Explore the flow below, then open{" "}
          <button type="button" className={styles.inlineLink} onClick={onOpenCode}>
            For developers
          </button>{" "}
          to copy the implementation.
        </p>
        <ol className={styles.welcomeSteps}>
          {TRY_THESE_STEPS.map((item) => (
            <li key={item.step}>
              <span className={styles.welcomeStepNum}>{item.step}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.welcomeActions}>
        <button type="button" className={styles.primaryButton} onClick={onDismiss}>
          Explore signals
        </button>
        <button type="button" className={styles.ghostButton} onClick={onOpenCode}>
          For developers
        </button>
      </div>
    </section>
  );
}
