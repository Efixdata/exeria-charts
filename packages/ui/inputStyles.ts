import { css } from "styled-components";
import { UI_INPUT } from "./designTokens";

export const inputControlHeight = UI_INPUT.height;

const focusAccent = (props: { theme: { accentColor?: string } }) =>
  props.theme.accentColor ?? "#2962FF";

/** Visible keyboard focus ring using design tokens. */
export const inputFocusVisibleStyles = css`
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-visible {
    outline: none;
    border-color: ${focusAccent};
    box-shadow: 0 0 0 var(--ui-focus-ring-width, ${UI_INPUT.focusRingWidth})
      ${focusAccent};
  }
`;

export const inputFocusWithinStyles = css`
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    outline: none;
    border-color: ${focusAccent};
    box-shadow: 0 0 0 var(--ui-focus-ring-width, ${UI_INPUT.focusRingWidth})
      ${focusAccent};
  }
`;

/** Menu/list options: inset ring instead of outline. */
export const menuOptionFocusVisibleStyles = css`
  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 var(--ui-focus-ring-width, ${UI_INPUT.focusRingWidth})
      ${focusAccent};
  }
`;
