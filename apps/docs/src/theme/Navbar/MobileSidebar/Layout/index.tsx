import React, { version } from "react";
import clsx from "clsx";
import { useNavbarSecondaryMenu } from "@docusaurus/theme-common/internal";
import { ThemeClassNames } from "@docusaurus/theme-common";

function inertProps(inert: boolean) {
  const isBeforeReact19 = parseInt(version.split(".")[0] ?? "18", 10) < 19;
  if (isBeforeReact19) {
    return { inert: inert ? "" : undefined };
  }
  return { inert };
}

function NavbarMobileSidebarPanel({
  children,
  inert,
}: {
  children: React.ReactNode;
  inert: boolean;
}) {
  return (
    <div
      className={clsx(
        ThemeClassNames.layout.navbar.mobileSidebar.panel,
        "navbar-sidebar__item",
        "menu",
      )}
      {...inertProps(inert)}
    >
      {children}
    </div>
  );
}

export default function NavbarMobileSidebarLayout({
  header,
  primaryMenu,
  secondaryMenu,
}: {
  header: React.ReactNode;
  primaryMenu: React.ReactNode;
  secondaryMenu: React.ReactNode;
}): JSX.Element {
  const { shown: secondaryMenuShown } = useNavbarSecondaryMenu();

  return (
    <div
      className={clsx(ThemeClassNames.layout.navbar.mobileSidebar.container, "navbar-sidebar")}
    >
      {header}
      <div
        className={clsx("navbar-sidebar__items", {
          "navbar-sidebar__items--show-secondary": secondaryMenuShown,
        })}
      >
        <NavbarMobileSidebarPanel inert={secondaryMenuShown}>{primaryMenu}</NavbarMobileSidebarPanel>
        <NavbarMobileSidebarPanel inert={!secondaryMenuShown}>{secondaryMenu}</NavbarMobileSidebarPanel>
      </div>
    </div>
  );
}
