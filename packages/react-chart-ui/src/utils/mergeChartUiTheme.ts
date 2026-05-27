import type { ChartUITheme } from "../chartTypes";

function mergeSection<T extends Record<string, unknown>>(
  base?: T,
  patch?: Partial<T>,
): T | undefined {
  if (!patch) {
    return base;
  }

  return { ...(base ?? {}), ...patch } as T;
}

export function mergeChartUiTheme(
  base?: ChartUITheme,
  patch?: Partial<ChartUITheme> | null,
): ChartUITheme | undefined {
  if (!patch) {
    return base;
  }

  if (!base) {
    return patch as ChartUITheme;
  }

  return {
    ...base,
    ...patch,
    border: mergeSection(base.border, patch.border),
    buttons: mergeSection(base.buttons, patch.buttons),
    radioButton: mergeSection(base.radioButton, patch.radioButton),
    toolbar: mergeSection(base.toolbar, patch.toolbar),
    subMenu: mergeSection(base.subMenu, patch.subMenu),
    splitButton: mergeSection(base.splitButton, patch.splitButton),
    dialog: mergeSection(base.dialog, patch.dialog),
    inputs: mergeSection(base.inputs, patch.inputs),
    scrollBar: mergeSection(base.scrollBar, patch.scrollBar),
  };
}
