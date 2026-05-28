import type { CSSProperties, ReactNode } from "react";
import styles from "./docChartEmbed.module.css";

export type DocChartEmbedProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  minHeight?: number;
  height?: number | string;
  background?: string;
  /** Adds padding around ChartUI toolbars (`.UI-container`). */
  padded?: boolean;
  /** Fills a parent frame without its own border or radius (e.g. homepage case cards). */
  nested?: boolean;
  loading?: boolean;
  error?: string | null;
  loadingLabel?: string;
};

export default function DocChartEmbed({
  children,
  className,
  style,
  minHeight,
  height,
  background,
  padded = false,
  nested = false,
  loading = false,
  error = null,
  loadingLabel = "Loading chart…",
}: DocChartEmbedProps) {
  const showLoading = loading && !error;

  return (
    <div
      className={[
        styles.embed,
        padded ? styles.padded : undefined,
        nested ? styles.nested : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        minHeight,
        height,
        background,
        ...style,
      }}
    >
      {showLoading ? (
        <div className={styles.loading} aria-live="polite">
          {loadingLabel}
        </div>
      ) : null}
      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export { default as docChartEmbedStyles } from "./docChartEmbed.module.css";
