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

  const buttons = mergeButtons(base?.buttons, patch?.buttons);
  return {
    ...merged,
    ...(buttons !== undefined ? { buttons } : {}),
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

  const buttons = mergeButtons(base?.buttons, patch?.buttons);
  return {
    ...merged,
    ...(buttons !== undefined ? { buttons } : {}),
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

  const buttons = mergeButtons(base?.buttons, patch?.buttons);
  return {
    ...merged,
    ...(buttons !== undefined ? { buttons } : {}),
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

  const border = mergeSection(base.border, patch.border);
  const buttons = mergeButtons(base.buttons, patch.buttons);
  const radioButton = mergeRadioButtonSection(base.radioButton, patch.radioButton);
  const toolbar = mergeToolbarSection(base.toolbar, patch.toolbar);
  const subMenu = mergeSubMenuSection(base.subMenu, patch.subMenu);
  const splitButton = mergeSection(base.splitButton, patch.splitButton);
  const dialog = mergeSection(base.dialog, patch.dialog);
  const inputs = mergeSection(base.inputs, patch.inputs);
  const scrollBar = mergeSection(base.scrollBar, patch.scrollBar);

  return {
    ...base,
    ...patch,
    ...(border !== undefined ? { border } : {}),
    ...(buttons !== undefined ? { buttons } : {}),
    ...(radioButton !== undefined ? { radioButton } : {}),
    ...(toolbar !== undefined ? { toolbar } : {}),
    ...(subMenu !== undefined ? { subMenu } : {}),
    ...(splitButton !== undefined ? { splitButton } : {}),
    ...(dialog !== undefined ? { dialog } : {}),
    ...(inputs !== undefined ? { inputs } : {}),
    ...(scrollBar !== undefined ? { scrollBar } : {}),
  };
}
