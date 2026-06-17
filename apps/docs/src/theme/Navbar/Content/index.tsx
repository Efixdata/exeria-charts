import React from "react";
import { useThemeConfig, ErrorCauseBoundary } from "@docusaurus/theme-common";
import { splitNavbarItems } from "@docusaurus/theme-common/internal";
import NavbarItem from "@theme/NavbarItem";
import type { Props as NavbarItemProps } from "@theme/NavbarItem";
import NavbarColorModeToggle from "@theme/Navbar/ColorModeToggle";
import NavbarLogo from "@theme/Navbar/Logo";
import GitHubNavbarButton from "@site/src/components/GitHubNavbarButton";
import MobileNav from "@site/src/components/MobileNav";
import styles from "./styles.module.css";

function useNavbarItems() {
  return useThemeConfig().navbar.items;
}

function NavbarItems({ items }: { items: ReturnType<typeof useNavbarItems> }) {
  return (
    <>
      {items.map((item, i) => (
        <ErrorCauseBoundary
          key={i}
          onError={(error) =>
            new Error(
              `A theme navbar item failed to render.
Please double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:
${JSON.stringify(item, null, 2)}`,
              { cause: error },
            )
          }
        >
          <NavbarItem {...(item as NavbarItemProps)} />
        </ErrorCauseBoundary>
      ))}
    </>
  );
}

type NavbarContentLayoutProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  mobileRight: React.ReactNode;
};

function NavbarContentLayout({
  left,
  center,
  right,
  mobileRight,
}: NavbarContentLayoutProps) {
  return (
    <div className="navbar__inner">
      <div className={styles.navContainer}>
        <div className={styles.navStart}>{left}</div>
        <nav className={styles.navLinks} aria-label="Main navigation">
          {center}
        </nav>
        <div className={styles.navActions}>{right}</div>
        <div className={styles.navActionsMobile}>{mobileRight}</div>
      </div>
    </div>
  );
}

export default function NavbarContent(): JSX.Element {
  const items = useNavbarItems().filter((item) => item.type !== "search");
  const [leftItems, rightItems] = splitNavbarItems(items);

  return (
    <NavbarContentLayout
      left={<NavbarLogo />}
      center={<NavbarItems items={leftItems} />}
      right={
        <>
          <NavbarColorModeToggle className={styles.colorModeToggle ?? ""} />
          <GitHubNavbarButton />
          <NavbarItems items={rightItems} />
        </>
      }
      mobileRight={
        <>
          <NavbarColorModeToggle className={styles.colorModeToggle ?? ""} />
          <GitHubNavbarButton compact />
          <MobileNav />
        </>
      }
    />
  );
}
