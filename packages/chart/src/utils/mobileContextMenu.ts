import type { PointerEventLike } from "../internal-types/interactor";

/** Portal target for overlays — stays inside the fullscreen element when active. */
function getOverlayPortalRoot(): HTMLElement {
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

export interface MobileContextMenuItem {
  id: string;
  label: string;
}

/** Viewport coordinates for position:fixed (not pageX/pageY — breaks when the page scrolls). */
export function resolvePointerClientPosition(
  event: PointerEventLike,
  fallbackTarget?: HTMLElement | null,
): { x: number; y: number } | null {
  const center = event.center as { x?: number; y?: number } | undefined;
  if (typeof center?.x === "number" && typeof center?.y === "number") {
    return { x: center.x, y: center.y };
  }

  if (typeof event.clientX === "number" && typeof event.clientY === "number") {
    return { x: event.clientX, y: event.clientY };
  }

  const src = event.srcEvent as
    | (TouchEvent & { clientX?: number; clientY?: number })
    | undefined;
  if (src) {
    if (typeof src.clientX === "number" && typeof src.clientY === "number") {
      return { x: src.clientX, y: src.clientY };
    }

    const touch = src.changedTouches?.[0] ?? src.touches?.[0];
    if (touch && typeof touch.clientX === "number" && typeof touch.clientY === "number") {
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  const pointer = event.pointers?.[0] as { clientX?: number; clientY?: number } | undefined;
  if (pointer && typeof pointer.clientX === "number" && typeof pointer.clientY === "number") {
    return { x: pointer.clientX, y: pointer.clientY };
  }

  const target = (event.target ?? fallbackTarget) as HTMLElement | null;
  const rect = target?.getBoundingClientRect?.();
  if (rect) {
    if (typeof event.offsetX === "number" && typeof event.offsetY === "number") {
      return { x: rect.left + event.offsetX, y: rect.top + event.offsetY };
    }

    if (event._offset) {
      return {
        x: rect.left + event._offset.offsetX,
        y: rect.top + event._offset.offsetY,
      };
    }
  }

  if (typeof event.pageX === "number" && typeof event.pageY === "number" && typeof window !== "undefined") {
    return {
      x: event.pageX - window.scrollX,
      y: event.pageY - window.scrollY,
    };
  }

  return null;
}

let activeMenu: HTMLDivElement | null = null;
let activeDismissHandlers: (() => void) | null = null;
/** Ignore outside-pointer dismiss briefly after open (long-press lift fires synthetic click). */
let menuOpenedAt = 0;
let menuDismissGraceMs = 0;
export const MENU_DISMISS_GRACE_MS = 400;

export function isMobileContextMenuOpen(): boolean {
  return activeMenu != null;
}

export function dismissMobileContextMenu(): void {
  activeDismissHandlers?.();
  activeDismissHandlers = null;

  if (activeMenu) {
    activeMenu.remove();
    activeMenu = null;
  }
}

export function showMobileContextMenu(options: {
  /** Viewport X (clientX / Hammer center.x) */
  x: number;
  /** Viewport Y (clientY / Hammer center.y) */
  y: number;
  items: MobileContextMenuItem[];
  onSelect: (id: string) => void;
  /** Ms to ignore outside-pointer dismiss after open (long-press needs grace; desktop contextmenu does not). */
  dismissGraceMs?: number;
}): void {
  if (typeof document === "undefined" || options.items.length === 0) {
    return;
  }

  dismissMobileContextMenu();

  const menu = document.createElement("div");
  menu.setAttribute("data-mobile-chart-context-menu", "true");
  menu.setAttribute("role", "menu");
  menu.style.cssText = [
    "position:fixed",
    "z-index:10030",
    "min-width:200px",
    "max-width:min(280px,calc(100vw - 16px))",
    "padding:4px 0",
    "border-radius:8px",
    "border:1px solid rgba(127,157,204,0.2)",
    "background:#1e222d",
    "color:#d1d4dc",
    "font:13px/1.3 system-ui,-apple-system,sans-serif",
    "box-shadow:0 8px 24px rgba(0,0,0,0.35)",
    "box-sizing:border-box",
  ].join(";");

  for (const item of options.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.textContent = item.label;
    button.style.cssText = [
      "display:block",
      "width:100%",
      "min-height:40px",
      "padding:0 12px",
      "border:none",
      "background:transparent",
      "color:inherit",
      "font:inherit",
      "text-align:left",
      "cursor:pointer",
      "box-sizing:border-box",
    ].join(";");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      options.onSelect(item.id);
      dismissMobileContextMenu();
    });
    menu.appendChild(button);
  }

  menu.style.left = `${Math.max(8, options.x)}px`;
  menu.style.top = `${Math.max(8, options.y)}px`;
  getOverlayPortalRoot().appendChild(menu);
  activeMenu = menu;
  menuOpenedAt = Date.now();
  menuDismissGraceMs = options.dismissGraceMs ?? MENU_DISMISS_GRACE_MS;

  requestAnimationFrame(() => {
    if (!activeMenu) {
      return;
    }

    const rect = activeMenu.getBoundingClientRect();
    activeMenu.style.left = `${Math.min(
      Math.max(8, options.x),
      window.innerWidth - rect.width - 8,
    )}px`;
    activeMenu.style.top = `${Math.min(
      Math.max(8, options.y),
      window.innerHeight - rect.height - 8,
    )}px`;
  });

  const onPointerDown = (event: Event) => {
    if (menuDismissGraceMs > 0 && Date.now() - menuOpenedAt < menuDismissGraceMs) {
      return;
    }

    const target = event.target as Node;
    if (activeMenu?.contains(target)) {
      return;
    }

    dismissMobileContextMenu();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      dismissMobileContextMenu();
    }
  };

  document.addEventListener("mousedown", onPointerDown, true);
  document.addEventListener("touchstart", onPointerDown, true);
  document.addEventListener("keydown", onKeyDown);

  activeDismissHandlers = () => {
    document.removeEventListener("mousedown", onPointerDown, true);
    document.removeEventListener("touchstart", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown);
  };
}

export type ChartContextMenuPointer = {
  clientX: number;
  clientY: number;
};

export function handleMobileChartContextAction(
  actionId: string,
  controller: {
    model: { viewportLeft: number };
    getAutoScale: () => boolean;
    setAutoScale: (value: boolean) => void;
    moveToEnd: (options?: { rerender?: boolean }) => void;
    onCrosshair: () => boolean;
    rerender: () => void;
    renderOverlay: () => void;
    options?: {
      placeOrderFromChartCallback?: (pointer: ChartContextMenuPointer) => void;
    };
  },
  pointer?: ChartContextMenuPointer,
): void {
  switch (actionId) {
    case "goStart":
      controller.model.viewportLeft = 0;
      controller.rerender();
      break;
    case "goEnd":
      controller.moveToEnd();
      break;
    case "autoscale":
      controller.setAutoScale(!controller.getAutoScale());
      controller.rerender();
      break;
    case "crosshair":
      controller.onCrosshair();
      controller.renderOverlay();
      break;
    case "placeOrder":
      if (pointer) {
        controller.options?.placeOrderFromChartCallback?.(pointer);
      }
      break;
    default:
      break;
  }
}

export function openMobileChartContextMenu(
  controller: {
    translate: (key: string) => string;
    model: { viewportLeft: number; mode?: string };
    getAutoScale: () => boolean;
    setAutoScale: (value: boolean) => void;
    moveToEnd: (options?: { rerender?: boolean }) => void;
    onCrosshair: () => boolean;
    rerender: () => void;
    renderOverlay: () => void;
    options?: {
      placeOrderFromChartCallback?: (pointer: ChartContextMenuPointer) => void;
    };
  },
  clientX: number,
  clientY: number,
  dismissGraceMs: number = MENU_DISMISS_GRACE_MS,
): void {
  const items: MobileContextMenuItem[] = [
    {
      id: "goStart",
      label: controller.translate("context_go_to_start"),
    },
    {
      id: "goEnd",
      label: controller.translate("context_go_to_end"),
    },
    {
      id: "autoscale",
      label: controller.translate("context_toggle_autoscale"),
    },
    {
      id: "crosshair",
      label: controller.translate("context_toggle_crosshair"),
    },
  ];

  if (controller.options?.placeOrderFromChartCallback) {
    items.push({
      id: "placeOrder",
      label: controller.translate("context_place_order"),
    });
  }

  const pointer: ChartContextMenuPointer = { clientX, clientY };

  showMobileContextMenu({
    x: clientX,
    y: clientY,
    items,
    onSelect: (id) => handleMobileChartContextAction(id, controller, pointer),
    dismissGraceMs,
  });
}
