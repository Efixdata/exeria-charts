import styled from "styled-components";

const Footer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #7F9DCC;
    font-size: 14px;
    margin-top: auto;
`

interface DialogFooterProps {
  children?: JSX.Element|JSX.Element[]|string;
}

export const DialogFooter = (props: DialogFooterProps) => {
  return (
        <Footer>{props.children}</Footer>
  );
};
