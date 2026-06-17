import { useEffect } from "react";
import styles from "./cryptoTerminalApp.module.css";

export type TourStepId = "symbol" | "indicator" | "order" | "source";

export type TourStep = {
  id: TourStepId;
  title: string;
  body: string;
  target: string;
};

export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: "symbol",
    title: "Pick a market",
    body: "Choose a symbol from the watchlist or press ⌘K. Prices stream live from Binance.",
    target: "[data-tour='watchlist']",
  },
  {
    id: "indicator",
    title: "Explore the chart",
    body: "Use the ChartUI toolbar to add indicators, drawing tools, or change timeframe.",
    target: "[data-tour='chart']",
  },
  {
    id: "order",
    title: "Trade from chart",
    body: "Click the chart to set a limit price, then place a simulated order. A line appears on the chart.",
    target: "[data-tour='trade-dock']",
  },
  {
    id: "source",
    title: "Copy the starter",
    body: "Open Source for layout map, integration snippets, and a Vite + StackBlitz path.",
    target: "[data-tour='source-button']",
  },
];

type OnboardingTourProps = {
  open: boolean;
  stepIndex: number;
  onNext: () => void;
  onDismiss: () => void;
};

export default function OnboardingTour({ open, stepIndex, onNext, onDismiss }: OnboardingTourProps) {
  const step = ONBOARDING_STEPS[stepIndex];

  useEffect(() => {
    if (!open || !step) {
      return undefined;
    }

    const target = document.querySelector(step.target);
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    return undefined;
  }, [open, step]);

  if (!open || !step) {
    return null;
  }

  const isLast = stepIndex >= ONBOARDING_STEPS.length - 1;

  return (
    <>
      <button
        type="button"
        className={styles.tourBackdrop}
        aria-label="Dismiss tour"
        onClick={onDismiss}
      />
      <section className={styles.tourCard} aria-live="polite">
        <p className={styles.tourProgress}>
          Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
        </p>
        <h2 className={styles.tourTitle}>{step.title}</h2>
        <p className={styles.tourBody}>{step.body}</p>
        <div className={styles.tourActions}>
          <button type="button" className={styles.ghostButton} onClick={onDismiss}>
            Skip tour
          </button>
          <button type="button" className={styles.primaryButton} onClick={isLast ? onDismiss : onNext}>
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </section>
    </>
  );
}
