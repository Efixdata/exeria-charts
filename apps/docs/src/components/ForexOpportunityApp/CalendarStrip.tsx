import type { ChartNewsEvent } from "./chartNews";
import { formatNewsTime } from "./chartNews";
import { SENTIMENT_COLORS } from "./chartNews";
import styles from "./forexOpportunityApp.module.css";

type CalendarStripProps = {
  events: ChartNewsEvent[];
  selectedNewsId: string | null;
  onSelectNews: (newsId: string) => void;
};

export default function CalendarStrip({ events, selectedNewsId, onSelectNews }: CalendarStripProps) {
  const upcoming = [...events].sort((a, b) => b.stamp - a.stamp);

  return (
    <div className={styles.calendarStrip} data-tour="calendar-strip">
      {upcoming.map((event) => {
        const active = event.id === selectedNewsId;
        const color = SENTIMENT_COLORS[event.sentiment];

        return (
          <button
            key={event.id}
            type="button"
            className={[styles.calendarItem, active ? styles.calendarItemActive : undefined]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectNews(event.id)}
            style={{ borderColor: active ? color : undefined }}
          >
            <span className={styles.calendarDot} style={{ backgroundColor: color }} />
            <span className={styles.calendarTitle}>{event.headline}</span>
            <span className={styles.calendarTime}>{formatNewsTime(event.stamp)}</span>
          </button>
        );
      })}
    </div>
  );
}
