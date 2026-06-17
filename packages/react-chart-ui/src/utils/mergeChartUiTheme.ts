import type { ChartUITheme } from "../chartTypes";

type ButtonState = NonNullable<ChartUITheme["buttons"]>;

function mergeSection<T extends Record<string, unknown>>(
  base?: T,
  patch?: Partial<T>,
): T | undefined {
  if (!patch) {
    return base;
  }

  return { ...(base ?? {}), ...patch } as T;
}

function mergeButtons(base?: ButtonState, patch?: Partial<ButtonState>): ButtonState | undefined {
  if (!patch) {
    return base;
  }

  return { ...(base ?? {}), ...patch };
}

function mergeToolbarSection(
  base?: ChartUITheme["toolbar"],
  patch?: Partial<ChartUITheme["toolbar"]>,
): ChartUITheme["toolbar"] | undefined {
  const merged = mergeSection(base, patch);
  if (!merged) {
    return merged;
  }

  return {
    ...merged,
    buttons: mergeButtons(base?.buttons, patch?.buttons),
  };
}

function mergeSubMenuSection(
  base?: ChartUITheme["subMenu"],
  patch?: Partial<ChartUITheme["subMenu"]>,
): ChartUITheme["subMenu"] | undefined {
  const merged = mergeSection(base, patch);
  if (!merged) {
    return merged;
  }

  return {
    ...merged,
    buttons: mergeButtons(base?.buttons, patch?.buttons),
  };
}

function mergeRadioButtonSection(
  base?: ChartUITheme["radioButton"],
  patch?: Partial<ChartUITheme["radioButton"]>,
): ChartUITheme["radioButton"] | undefined {
  const merged = mergeSection(base, patch);
  if (!merged) {
    return merged;
  }

  return {
    ...merged,
    buttons: mergeButtons(base?.buttons, patch?.buttons),
  };
}

export function mergeChartUiTheme(
  base?: Partial<ChartUITheme>,
  patch?: Partial<ChartUITheme> | null,
): Partial<ChartUITheme> | undefined {
  if (!patch) {
    return base;
  }

  if (!base) {
    return patch;
  }

  return {
    ...base,
    ...patch,
    border: mergeSection(base.border, patch.border),
    buttons: mergeButtons(base.buttons, patch.buttons),
    radioButton: mergeRadioButtonSection(base.radioButton, patch.radioButton),
    toolbar: mergeToolbarSection(base.toolbar, patch.toolbar),
    subMenu: mergeSubMenuSection(base.subMenu, patch.subMenu),
    splitButton: mergeSection(base.splitButton, patch.splitButton),
    dialog: mergeSection(base.dialog, patch.dialog),
    inputs: mergeSection(base.inputs, patch.inputs),
    scrollBar: mergeSection(base.scrollBar, patch.scrollBar),
  };
}
