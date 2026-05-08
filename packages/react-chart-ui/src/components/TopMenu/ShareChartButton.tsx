// @ts-nocheck
import * as React from "react";
import styled from "styled-components";
import { IconButton, Loading } from "ui";
import { buttonOption, selectButton } from "ui/theme";
import useShareChartImage, { ActionEnum } from "../../hooks/useShareChartImage";
import { Share, Twitter, Telegram, Copy, Download } from "../../img/icons";
import useGenerateWatermark from "../../hooks/useGenerateWatermark";

const ShareButtonWrapper = styled.div`
  position: relative;
  &.active {
    background-color: ${selectButton.backgroundActiveColor};
    border-radius: ${selectButton.borderRadius}px ${selectButton.borderRadius}px 0px 0px;
  }
`;

const OptionsContainer = styled.div`
  box-sizing: border-box;
  border-radius: ${selectButton.borderRadius}px 0 ${selectButton.borderRadius}px
    ${selectButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${selectButton.backgroundActiveColor};
  padding: 4px 0;
  position: absolute;
  top: 26px;
  right: 0;
  z-index: 1;
  min-width: 160px;
`;

const OptionValue = styled.span`
  display: flex;
  cursor: pointer;
  align-items: center;
  padding: 8px 18px 8px 8px;
  grid-gap: 8px;
  color: #fff;
  opacity: 0.7;
  &:hover {
    background-color: #7f9dcc26;
  }
`;

const OptionsHeader = styled.div`
  border-bottom: 1px solid #ffffff1a;
  padding: 8px;
  text-transform: uppercase;
  text-align: center;
  color: #7f9dcc;
  font-size: 14px;
`;

export const ShareChartButton = (props) => {
  const { waterMark64 } = useGenerateWatermark();
  const { shareImage, actionLoading } = useShareChartImage(props.chart);
  const dropDownRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const instrumentSymbol = props.chart?.getInstrument()?.symbol || "";

  const renderOptions = () => {
    return options.map((option, i) => {
      if (option.type === "divider") {
        return <OptionsHeader style={{ padding: 0, margin: "8px 8px" }} />;
      }
      return (
        <OptionValue key={i} onClick={option.action}>
          {option.loading ? <Loading /> : option.logo}
          {option.social}
        </OptionValue>
      );
    });
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  const handleClickOutside = (e: SyntheticEvent) => {
    if (!dropDownRef.current?.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const options = [
    {
      social: "Twitter",
      logo: <Twitter height={18} width={18} fill="#fff" />,
      action: () =>
        shareImage(
          "twitter",
          ActionEnum.share,
          "https://twitter.com/intent/tweet",
          `$${instrumentSymbol} chart from @Dexer_io`
        ),
      loading: actionLoading.twitter,
    },
    {
      social: "Telegram",
      logo: <Telegram height={18} width={18} fill="#fff" />,
      action: () =>
        shareImage(
          "telegram",
          ActionEnum.share,
          "https://t.me/share/url",
          `${instrumentSymbol} chart from Dexer.io`
        ),
      loading: actionLoading.telegram,
    },
    {
      type: "divider",
    },
    {
      social: "Copy image link",
      logo: <Copy height={24} width={24} fill="#fff" />,
      action: () => shareImage("copyImage", ActionEnum.copy, "", ActionEnum.copy),
      loading: actionLoading.copyImage,
    },
    {
      social: "Download image",
      logo: <Download height={24} width={24} fill="#fff" />,
      action: () => props.chart.onDownload(waterMark64, 240, 66),
    },
  ];

  return (
    <ShareButtonWrapper ref={dropDownRef} className={isOpen && "active"}>
      <IconButton onClick={() => setIsOpen((prev) => !prev)}>
        <Share />
      </IconButton>
      {isOpen && (
        <OptionsContainer>
          <OptionsHeader>share chart</OptionsHeader>
          {renderOptions()}
        </OptionsContainer>
      )}
    </ShareButtonWrapper>
  );
};
