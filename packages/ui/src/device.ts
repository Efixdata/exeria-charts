/** Portal target for overlays — stays inside the fullscreen element when active. */
export function getOverlayPortalRoot(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("getOverlayPortalRoot requires document");
  }

  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };

  const fullscreen =
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement;

  return (fullscreen as HTMLElement | null) ?? doc.body;
}

/** True when hover tooltips would be redundant or sticky (touch / coarse pointer). */
export function isTooltipEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  if (typeof window.matchMedia === "function") {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return false;
    }
    if (window.matchMedia("(hover: none)").matches) {
      return false;
    }
  }

  if (typeof document !== "undefined" && document.documentElement) {
    if ("ontouchstart" in document.documentElement) {
      return false;
    }
  }

  return true;
}
