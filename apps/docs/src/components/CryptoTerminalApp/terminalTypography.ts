import { getUILayoutCssVars } from "../../../../../packages/ui/designTokens";
import { UI_FONT_FAMILY } from "../../../../../packages/ui/theme";

/** ChartUI / chart canvas font stack (Inter). */
export const TERMINAL_FONT_FAMILY = UI_FONT_FAMILY;

/** Injected on `.shell` so terminal chrome shares ChartUI font-size tokens. */
export const TERMINAL_UI_FONT_VARS = getUILayoutCssVars();
