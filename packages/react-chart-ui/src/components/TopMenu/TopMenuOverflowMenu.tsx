import * as React from "react";
import { createPortal } from "react-dom";
import { CaretDown, DotsThree } from "phosphor-react";
import { useTheme } from "styled-components";
import { getOverlayPortalRoot, IconButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";
import styles from "./topMenuOverflow.module.css";

export interface TopMenuOverflowSubmenuOption {
  id: string;
  label: string;
}

export interface TopMenuOverflowItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  active?: boolean;
  /** Toggle row — keeps menu open and sets aria-pressed. */
  toggle?: boolean;
  /** Display-only row (no click handler). */
  readonly?: boolean;
  onSelect?: () => void;
  submenu?: TopMenuOverflowSubmenuOption[];
  selectedSubmenuId?: string;
  onSubmenuSelect?: (id: string) => void;
}

interface TopMenuOverflowMenuProps {
  chart: NullableChartInstance;
  items: TopMenuOverflowItem[];
  portalContainer?: React.RefObject<HTMLElement | null>;
}

export const TopMenuOverflowMenu = (props: TopMenuOverflowMenuProps) => {
  const t = useChartTranslate(props.chart);
  const theme = useTheme() as {
    subMenu?: {
      background?: string;
      buttons?: {
        color?: string;
        hoverBackground?: string;
        activeBackground?: string;
      };
    };
    toolbar?: { buttons?: { color?: string } };
  };
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [expandedSubmenuId, setExpandedSubmenuId] = React.useState<string | null>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [useFixedPosition, setUseFixedPosition] = React.useState(false);

  const getTriggerRect = React.useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return null;
    }

    const button = wrap.querySelector("button");
    return (button ?? wrap).getBoundingClientRect();
  }, []);

  const updatePosition = React.useCallback(() => {
    const rect = getTriggerRect();
    if (!rect) {
      return;
    }

    const menuWidth = 260;
    const gap = 4;
    const portalTarget = props.portalContainer?.current;

    if (portalTarget) {
      const portalRect = portalTarget.getBoundingClientRect();
      setUseFixedPosition(false);
      setPosition({
        top: rect.bottom - portalRect.top + gap,
        left: Math.min(
          Math.max(8, rect.right - portalRect.left - menuWidth),
          Math.max(8, portalRect.width - menuWidth - 8),
        ),
      });
      return;
    }

    setUseFixedPosition(true);
    setPosition({
      top: rect.bottom + gap,
      left: Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8),
    });
  }, [getTriggerRect, props.portalContainer]);

  React.useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const isInsideOverlay = React.useCallback((target: Node) => {
    const element = target as Element;
    if (!element.closest) {
      return false;
    }

    return Boolean(element.closest('[data-topmenu-overflow="true"]'));
  }, []);

  React.useEffect(() => {
    if (!open) {
      setExpandedSubmenuId(null);
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      if (isInsideOverlay(target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isInsideOverlay]);

  const menuBackground = theme?.subMenu?.background ?? "#1e222d";
  const menuTextColor = theme?.subMenu?.buttons?.color ?? theme?.toolbar?.buttons?.color ?? "#d1d4dc";
  const menuHover = theme?.subMenu?.buttons?.hoverBackground ?? "rgba(127, 157, 204, 0.12)";
  const menuActiveBg = theme?.subMenu?.buttons?.activeBackground ?? "rgba(127, 157, 204, 0.16)";
  const menuActiveColor =
    theme?.subMenu?.buttons?.activeColor ?? theme?.toolbar?.buttons?.activeColor ?? "#2962ff";

  const handleItemClick = (item: TopMenuOverflowItem) => {
    if (item.submenu?.length) {
      setExpandedSubmenuId((current) => (current === item.id ? null : item.id));
      return;
    }

    item.onSelect?.();

    if (!item.toggle) {
      setOpen(false);
    }
  };

  const portalTarget =
    typeof document !== "undefined"
      ? (props.portalContainer?.current ?? getOverlayPortalRoot())
      : null;

  const menuPanelStyle: React.CSSProperties & {
    "--overflow-menu-hover"?: string;
    "--overflow-menu-active-bg"?: string;
    "--overflow-menu-active-color"?: string;
  } = {
    top: position.top,
    left: position.left,
    position: useFixedPosition ? "fixed" : "absolute",
    background: menuBackground,
    color: menuTextColor,
    "--overflow-menu-hover": menuHover,
    "--overflow-menu-active-bg": menuActiveBg,
    "--overflow-menu-active-color": menuActiveColor,
  };

  const menu =
    open && portalTarget
      ? createPortal(
          <div
            ref={menuRef}
            className={styles.menuPanel}
            data-topmenu-overflow="true"
            role="menu"
            style={menuPanelStyle}
          >
            {props.items.map((item) => {
              if (item.readonly) {
                return (
                  <div key={item.id} className={styles.menuItemInfo} role="presentation">
                    {item.icon ? <span className={styles.menuItemIcon}>{item.icon}</span> : null}
                    <span className={styles.menuItemLabel}>{item.label}</span>
                    {item.trailing ? (
                      <span className={styles.menuItemTrailing}>{item.trailing}</span>
                    ) : null}
                  </div>
                );
              }

              return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  className={[
                    styles.menuItem,
                    item.active === true ? styles.menuItemActive : "",
                    item.toggle && !item.active ? styles.menuItemInactive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="menuitem"
                  aria-pressed={item.toggle ? item.active === true : undefined}
                  aria-expanded={item.submenu ? expandedSubmenuId === item.id : undefined}
                  onClick={() => handleItemClick(item)}
                >
                  {item.icon ? <span className={styles.menuItemIcon}>{item.icon}</span> : null}
                  <span className={styles.menuItemLabel}>{item.label}</span>
                  {item.trailing ? (
                    <span className={styles.menuItemTrailing}>{item.trailing}</span>
                  ) : item.submenu?.length ? (
                    <span className={styles.menuItemTrailing} aria-hidden>
                      <CaretDown
                        size={14}
                        weight="bold"
                        style={{
                          transform: expandedSubmenuId === item.id ? "rotate(180deg)" : undefined,
                        }}
                      />
                    </span>
                  ) : null}
                </button>
                {item.submenu?.length && expandedSubmenuId === item.id ? (
                  <div className={styles.submenu} role="group" aria-label={item.label}>
                    {item.submenu.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.submenuItem}${
                          item.selectedSubmenuId === option.id ? ` ${styles.submenuItemActive}` : ""
                        }`}
                        role="menuitem"
                        onClick={() => {
                          item.onSubmenuSelect?.(option.id);
                          setOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </React.Fragment>
              );
            })}
          </div>,
          portalTarget,
        )
      : null;

  const label = t("toolbar_more_actions", "More chart actions");

  return (
    <div className={styles.menuWrap} ref={wrapRef}>
      <IconButton
        themeContext="toolbar"
        title={label}
        ariaLabel={label}
        ariaExpanded={open}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
      >
        <DotsThree size={20} weight="bold" aria-hidden />
      </IconButton>
      {menu}
    </div>
  );
};
