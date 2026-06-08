import React from "react";
import clsx from "clsx";
import { ThemeClassNames, useThemeConfig } from "@docusaurus/theme-common";
import { useHideableNavbar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";

export default function NavbarLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const {
    navbar: { hideOnScroll, style },
  } = useThemeConfig();
  const { navbarRef, isNavbarVisible } = useHideableNavbar(hideOnScroll);

  return (
    <nav
      ref={navbarRef}
      aria-label={translate({
        id: "theme.NavBar.navAriaLabel",
        message: "Main",
        description: "The ARIA label for the main navigation",
      })}
      className={clsx(
        ThemeClassNames.layout.navbar.container,
        "navbar",
        "navbar--fixed-top",
        hideOnScroll && [styles.navbarHideable, !isNavbarVisible && styles.navbarHidden],
        {
          "navbar--dark": style === "dark",
          "navbar--primary": style === "primary",
        },
      )}
    >
      {children}
    </nav>
  );
}
