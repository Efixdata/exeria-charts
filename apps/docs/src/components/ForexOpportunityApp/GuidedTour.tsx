import { useEffect } from "react";
import styles from "./forexOpportunityApp.module.css";

export type TourStepId = "feed" | "chart" | "news" | "brief";

export const TOUR_STEPS: Array<{ id: TourStepId; title: string; body: string; target: string }> = [
  {
    id: "feed",
    title: "Opportunity feed",
    body: "Arb, rare setups, signals, and macro events. Selecting one syncs the chart instrument.",
    target: "[data-tour='opportunity-feed']",
  },
  {
    id: "chart",
    title: "Chart canvas",
    body: "Strategy markers (CROSS, EXCEED) and overlays prove each opportunity.",
    target: "[data-tour='chart']",
  },
  {
    id: "news",
    title: "News dots",
    body: "Green / red / blue dots on the timeline. Click to expand impact on the chart.",
    target: "[data-tour='chart']",
  },
  {
    id: "brief",
    title: "Signal brief",
    body: "Why this is unusual, confluence checks, arb math, and reaction playbook.",
    target: "[data-tour='signal-brief']",
  },
];

type GuidedTourProps = {
  open: boolean;
  stepIndex: number;
  onNext: () => void;
  onDismiss: () => void;
};

export default function GuidedTour({ open, stepIndex, onNext, onDismiss }: GuidedTourProps) {
  const step = TOUR_STEPS[stepIndex];

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

  const isLast = stepIndex >= TOUR_STEPS.length - 1;

  return (
    <div className={styles.tourOverlay} role="dialog" aria-label="Guided tour">
      <div className={styles.tourCard}>
        <p className={styles.tourMeta}>
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </p>
        <h3 className={styles.tourTitle}>{step.title}</h3>
        <p className={styles.tourBody}>{step.body}</p>
        <div className={styles.tourActions}>
          <button type="button" className={styles.ghostButton} onClick={onDismiss}>
            Skip
          </button>
          <button type="button" className={styles.primaryButton} onClick={isLast ? onDismiss : onNext}>
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
