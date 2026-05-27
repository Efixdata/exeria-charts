import styled from "styled-components";

export const DialogPrimaryButton = styled.button.attrs({ type: "button" })`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 12px 28px;
  border: 1px solid ${(props) => props.theme.dialog?.dividerColor || "rgba(255, 255, 255, 0.22)"};
  border-radius: 30px;
  box-sizing: border-box;
  font-family: Mulish, Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  cursor: pointer;
  color: ${(props) => props.theme.dialog?.titleColor || props.theme.dialog?.textColor || "#7f9dcc"};
  background-color: ${(props) => props.theme.inputs?.backgroundColor || "rgba(15, 12, 34, 0.9)"};
  box-shadow: none;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: ${(props) => props.theme.dialog?.textColor || "#ffffff"};
    border-color: ${(props) =>
      props.theme.dialog?.itemHoverBackgroundColor || "rgba(255, 255, 255, 0.28)"};
    background-color: ${(props) =>
      props.theme.dialog?.itemHoverBackgroundColor || "rgba(255, 255, 255, 0.1)"};
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.2);
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.dialog?.titleColor || "#7f9dcc"};
    outline-offset: 2px;
  }
`;
