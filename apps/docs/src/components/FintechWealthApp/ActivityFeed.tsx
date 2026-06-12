import type { ActivityEvent } from "./wealthAnalytics";
import styles from "./fintechWealthApp.module.css";

type ActivityFeedProps = {
  events: ActivityEvent[];
  loading: boolean;
  balanceHidden?: boolean;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativeTime(timestamp: number): string {
  const days = Math.max(1, Math.round((Date.now() - timestamp) / (24 * 60 * 60 * 1000)));
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  if (days < 30) {
    return `${Math.round(days / 7)}w ago`;
  }
  return `${Math.round(days / 30)}mo ago`;
}

const EVENT_ICON: Record<ActivityEvent["type"], string> = {
  deposit: "↓",
  buy: "+",
  dividend: "€",
};

export default function ActivityFeed({ events, loading, balanceHidden = false }: ActivityFeedProps) {
  if (loading && events.length === 0) {
    return (
      <section className={styles.activitySection} aria-label="Recent activity">
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>Activity</h2>
        </div>
        <div className={styles.activityFeed}>
          {[0, 1, 2].map((index) => (
            <div key={index} className={styles.activityRow} data-loading="true" aria-hidden />
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className={styles.activitySection} aria-label="Recent activity">
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Activity</h2>
        <span className={styles.sectionHint}>Last 30 days</span>
      </div>
      <div className={styles.activityFeed}>
        {events.map((event) => (
          <article key={event.id} className={styles.activityRow} data-type={event.type}>
            <span className={styles.activityIcon} aria-hidden>
              {EVENT_ICON[event.type]}
            </span>
            <div className={styles.activityCopy}>
              <strong>{event.title}</strong>
              <span>
                {event.subtitle} · {formatRelativeTime(event.timestamp)}
              </span>
            </div>
            <span className={styles.activityAmount} aria-hidden={balanceHidden}>
              {balanceHidden ? "••••" : `+${formatCurrency(event.amountEur)}`}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
