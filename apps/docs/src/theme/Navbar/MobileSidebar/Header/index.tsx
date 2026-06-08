import React from "react";
import clsx from "clsx";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";

function CloseIcon(): JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function NavbarMobileSidebarHeader(): JSX.Element {
  const mobileSidebar = useNavbarMobileSidebar();

  return (
    <div className={styles.header}>
      <span className={styles.title}>Menu</span>
      <button
        type="button"
        aria-label={translate({
          id: "theme.exeria.mobileNav.close",
          message: "Close navigation menu",
          description: "ARIA label for the mobile navigation close button",
        })}
        className={clsx("clean-btn", styles.closeButton)}
        onClick={() => mobileSidebar.toggle()}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
