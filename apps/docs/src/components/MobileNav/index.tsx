import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import { useThemeConfig } from "@docusaurus/theme-common";
import { useLocation } from "@docusaurus/router";
import { useNavbarSecondaryMenu } from "@docusaurus/theme-common/internal";
import NavbarColorModeToggle from "@theme/Navbar/ColorModeToggle";
import GitHubNavbarButton from "@site/src/components/GitHubNavbarButton";
import DocsSidebarSearch from "@site/src/components/DocsSidebarSearch";
import styles from "./styles.module.css";

type NavLink = {
  label: string;
  href: string;
};

function useNavLinks(): NavLink[] {
  const { navbar } = useThemeConfig();

  return navbar.items.flatMap((item) => {
    const label = "label" in item && item.label ? item.label : "Link";

    if ("href" in item && typeof item.href === "string") {
      return [{ label, href: item.href }];
    }
    if ("to" in item && typeof item.to === "string") {
      return [{ label, href: item.to }];
    }
    if (item.type === "docSidebar") {
      return [{ label: item.label ?? "Docs", href: "/docs/intro" }];
    }
    return [];
  });
}

function MenuIcon(): JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon(): JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MobileNavClient(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const links = useNavLinks();
  const location = useLocation();
  const isDocsRoute = location.pathname.startsWith("/docs");
  const secondaryMenu = useNavbarSecondaryMenu();

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close]);

  return (
    <>
      <button
        type="button"
        className={styles.menuToggle}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        onClick={toggle}
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {createPortal(
        <div
          className={clsx(styles.overlay, isOpen && styles.overlayOpen)}
          style={{ display: isOpen ? "block" : "none" }}
          aria-hidden={!isOpen}
        >
          <button type="button" className={styles.backdrop} aria-label="Close menu" onClick={close} />

          <aside
            className={clsx(styles.drawer, isOpen && styles.drawerOpen)}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <header className={styles.header}>
              <span className={styles.headerTitle}>Menu</span>
              <button type="button" className={styles.closeBtn} aria-label="Close menu" onClick={close}>
                <CloseIcon />
              </button>
            </header>

            {isDocsRoute && (
              <div className={styles.searchSection}>
                <DocsSidebarSearch />
              </div>
            )}

            <div className={styles.scrollableContent}>
              {isDocsRoute && secondaryMenu.content && (
                <div className={styles.docsSidebarSection}>
                  {secondaryMenu.content}
                </div>
              )}

              <nav className={styles.links} aria-label="Mobile navigation">
                {links.map((link) => (
                  <Link key={link.href} to={link.href} className={styles.link ?? ""} onClick={close}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <footer className={styles.footer}>
              <div className={styles.footerRow}>
                <span className={styles.footerLabel}>Theme</span>
                <NavbarColorModeToggle />
              </div>
              <GitHubNavbarButton fullWidth />
            </footer>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}

export default function MobileNav(): JSX.Element {
  return (
    <BrowserOnly fallback={<div className={styles.menuTogglePlaceholder} aria-hidden />}>
      {() => <MobileNavClient />}
    </BrowserOnly>
  );
}
