import * as React from "react";
import type { ReactNode } from "react";
import styles from "./dialogSections.module.css";

type DialogSectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export function DialogSection({ title, hint, children }: DialogSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {hint ? <p className={styles.sectionHint}>{hint}</p> : null}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export { default as dialogSectionStyles } from "./dialogSections.module.css";
