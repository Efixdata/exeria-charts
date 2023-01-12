// @ts-nocheck
import * as React from "react";
import styled from "styled-components";
import { IconButton, Loading } from "ui";
import { selectButton } from "ui/theme";
import useGenerateWatermark from "../hooks/useGenerateWatermark";
import useShareChartImage, { ActionEnum } from "../hooks/useShareChartImage";

import { Camera, Download, Copy } from "../img/icons";

const SaveImageButtonWrapper = styled.div`
  position: relative;
  &.active {
    background-color: ${selectButton.backgroundActiveColor};
    border-radius: ${selectButton.borderRadius}px ${selectButton.borderRadius}px
      0px 0px;
  }
`;

const OptionsContainer = styled.div`
  box-sizing: border-box;
  border-radius: ${selectButton.borderRadius}px 0px
    ${selectButton.borderRadius}px ${selectButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${selectButton.backgroundActiveColor};
  padding: 4px 0;
  position: absolute;
  top: 26px;
  left: -132px;
  z-index: 1;
  min-width: 158px;
`;

const OptionValue = styled.span`
  display: flex;
  cursor: pointer;
  align-items: center;
  padding: 8px 18px 5px 8px;
  grid-gap: 8px;
  color: #fff;
  opacity: 0.7;
  &:hover {
    background-color: #7f9dcc26;
  }
`;


export const SaveChartImageButton = (props) => {
  const { waterMark64 } = useGenerateWatermark()
  const { shareImage, actionLoading} =
    useShareChartImage(props);
   
  const dropDownRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const onClick = () => {
    
    props.chart.onDownload(waterMark64, true)
  };

  const handleClickOutside = (e: SyntheticEvent) => {
    if (!dropDownRef.current?.contains(e.target)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <SaveImageButtonWrapper
      ref={dropDownRef}
      className={isOpen ? "active" : null}
    >
      <IconButton onClick={() => setIsOpen((prev) => !prev)}>
        <Camera />
      </IconButton>
      {isOpen && (
        <OptionsContainer>
          <OptionValue onClick={()=> shareImage('copyImage', '', ActionEnum.copy)}>
            {actionLoading.copyImage ? <Loading /> : <Copy />}
            Copy chart image
          </OptionValue>
          <OptionValue onClick={onClick}>
            <Download />
            Save chart image
          </OptionValue>
        </OptionsContainer>
      )}
    </SaveImageButtonWrapper>
  );
};
