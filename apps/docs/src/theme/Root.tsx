import { useEffect, type ComponentProps } from "react";
import { useLocation } from "@docusaurus/router";
import Root from "@theme-original/Root";
import skipLinkStyles from "./skipLink.module.css";

const NAVBAR_SCROLL_OFFSET = 88;

function scrollToHash(hash: string): void {
  const id = hash.replace(/^#/, "");
  if (!id) {
    return;
  }

  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export default function RootWrapper(props: ComponentProps<typeof Root>): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToHash(location.hash);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return (
    <>
      <a href="#__docusaurus_skipToContent_fallback" className={skipLinkStyles.skipLink}>
        Skip to main content
      </a>
      <Root {...props} />
    </>
  );
}
