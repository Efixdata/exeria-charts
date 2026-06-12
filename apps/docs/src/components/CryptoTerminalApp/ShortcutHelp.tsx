import { WORKSPACE_HINTS } from "./constants";
import styles from "./cryptoTerminalApp.module.css";

type ShortcutHelpProps = {
  open: boolean;
  onClose: () => void;
};

export default function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="Close shortcuts"
        onClick={onClose}
      />
      <section className={styles.shortcutCard} aria-label="Keyboard shortcuts">
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Workspace shortcuts</h2>
          <button type="button" className={styles.ghostButton} onClick={onClose}>
            Close
          </button>
        </div>
        <ul className={styles.shortcutList}>
          {WORKSPACE_HINTS.map((hint) => (
            <li key={hint.key} className={styles.shortcutRow}>
              <kbd>{hint.key}</kbd>
              <span>{hint.label}</span>
            </li>
          ))}
          <li className={styles.shortcutRow}>
            <kbd>Esc</kbd>
            <span>Close palette / help</span>
          </li>
        </ul>
      </section>
    </>
  );
}
