import { css } from "styled-components";

/**
 * Recolors toolbar SVGs that still hardcode #7F9DCC without breaking:
 * - stroke-only tools (Gann grid/box)
 * - Phosphor icons (brush, regression channel)
 * - multi-color tools (long/short position)
 */
export const toolbarIconSvgStyles = css`
  svg {
    width: var(--ui-toolbar-icon, 20px);
    height: var(--ui-toolbar-icon, 20px);
  }

  [stroke="#7F9DCC"],
  [stroke="#7f9dcc"] {
    stroke: currentColor;
  }

  [fill="#7F9DCC"],
  [fill="#7f9dcc"] {
    fill: currentColor;
  }

  rect[fill="none"],
  path[fill="none"],
  circle[fill="none"] {
    fill: none;
  }

  line {
    stroke: currentColor;
  }
`;
