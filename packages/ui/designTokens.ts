export const UI_FONT_SIZE = {
  helper: "11px",
  label: "12px",
  body: "13px",
  title: "14px",
} as const;

export const UI_SPACE = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
} as const;

export const UI_RADIUS = {
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "10px",
} as const;

export const UI_INPUT = {
  height: "36px",
  paddingX: "12px",
  paddingY: "4px",
  focusRingWidth: "2px",
  focusRingOffset: "2px",
} as const;

export const UI_TOOLBAR = {
  touchTarget: "40px",
  iconSize: "20px",
  groupGap: "12px",
  iconGap: "8px",
  mobileBreakpoint: "600px",
  leftMenuWidth: "44px",
} as const;

export function getUILayoutCssVars(): Record<string, string> {
  return {
    "--ui-font-helper": UI_FONT_SIZE.helper,
    "--ui-font-label": UI_FONT_SIZE.label,
    "--ui-font-body": UI_FONT_SIZE.body,
    "--ui-font-title": UI_FONT_SIZE.title,
    "--ui-space-1": UI_SPACE[1],
    "--ui-space-2": UI_SPACE[2],
    "--ui-space-3": UI_SPACE[3],
    "--ui-space-4": UI_SPACE[4],
    "--ui-space-5": UI_SPACE[5],
    "--ui-space-6": UI_SPACE[6],
    "--ui-radius-sm": UI_RADIUS.sm,
    "--ui-radius-md": UI_RADIUS.md,
    "--ui-radius-lg": UI_RADIUS.lg,
    "--ui-radius-xl": UI_RADIUS.xl,
    "--ui-input-height": UI_INPUT.height,
    "--ui-focus-ring-width": UI_INPUT.focusRingWidth,
    "--ui-focus-ring-offset": UI_INPUT.focusRingOffset,
    "--ui-toolbar-touch": UI_TOOLBAR.touchTarget,
    "--ui-toolbar-icon": UI_TOOLBAR.iconSize,
    "--ui-toolbar-group-gap": UI_TOOLBAR.groupGap,
    "--ui-toolbar-icon-gap": UI_TOOLBAR.iconGap,
    "--ui-left-menu-width": UI_TOOLBAR.leftMenuWidth,
  };
}
