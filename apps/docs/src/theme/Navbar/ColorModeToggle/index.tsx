import React from "react";
import clsx from "clsx";
import { useColorMode, useThemeConfig } from "@docusaurus/theme-common";
import { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";

function SunIcon(): JSX.Element {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

export default function NavbarColorModeToggle({
  className,
}: {
  className?: string;
}): JSX.Element | null {
  const { disableSwitch } = useThemeConfig().colorMode;
  const { colorMode, setColorMode } = useColorMode();

  if (disableSwitch) {
    return null;
  }

  const nextMode = colorMode === "dark" ? "light" : "dark";
  const label = translate({
    message: "Switch between dark and light mode",
    id: "theme.exeria.colorToggle.ariaLabel",
    description: "ARIA label for the Exeria navbar color mode toggle",
  });

  return (
    <button
      type="button"
      className={clsx(styles.themeToggle, className)}
      onClick={() => setColorMode(nextMode)}
      aria-label={label}
      title={label}
    >
      <span className={styles.iconSun}>
        <SunIcon />
      </span>
      <span className={styles.iconMoon}>
        <MoonIcon />
      </span>
    </button>
  );
}
