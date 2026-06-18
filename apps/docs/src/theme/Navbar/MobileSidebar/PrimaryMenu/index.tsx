import React from "react";
import { useThemeConfig } from "@docusaurus/theme-common";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import NavbarItem from "@theme/NavbarItem";
import type { Props as NavbarItemProps } from "@theme/NavbarItem";
import NavbarColorModeToggle from "@theme/Navbar/ColorModeToggle";
import GitHubNavbarButton from "@site/src/components/GitHubNavbarButton";
import styles from "./styles.module.css";

function useNavbarItems() {
  return useThemeConfig().navbar.items;
}

export default function NavbarMobilePrimaryMenu(): JSX.Element {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();

  return (
    <div className={styles.menu}>
      <ul className={styles.linkList}>
        {items.map((item, i) => (
          <li key={i} className={styles.linkItem}>
            <NavbarItem
              mobile
              {...(item as NavbarItemProps)}
              onClick={() => mobileSidebar.toggle()}
            />
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <span className={styles.footerLabel}>Theme</span>
          <NavbarColorModeToggle className={styles.footerThemeToggle ?? ""} />
        </div>
        <GitHubNavbarButton className={styles.footerGithub} fullWidth />
      </div>
    </div>
  );
}
