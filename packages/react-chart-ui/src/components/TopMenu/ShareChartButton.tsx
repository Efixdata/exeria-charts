import * as React from "react";
import styled from "styled-components";
import { IconButton, Loading } from "ui";
import { selectButton } from "ui/theme";
import useShareChartImage, { ActionEnum } from "../../hooks/useShareChartImage";
import { Share, Twitter, Telegram, Copy, Download } from "../../img/icons";
import useGenerateWatermark from "../../hooks/useGenerateWatermark";
import type { NullableChartInstance, ShareConfig } from "../../chartTypes";

interface ShareChartButtonProps {
  chart: NullableChartInstance;
  shareConfig?: ShareConfig | undefined;
}

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

export const ShareChartButton = (props: ShareChartButtonProps) => {
  const { waterMark64 } = useGenerateWatermark(props.shareConfig?.watermarkSvg);
  const { shareImage, actionLoading } = useShareChartImage(props.chart, props.shareConfig);
  const dropDownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const instrumentSymbol = props.chart?.getInstrument()?.symbol || "";
  const twitterText =
    props.shareConfig?.twitterTextTemplate ||
    (instrumentSymbol ? `$${instrumentSymbol} chart snapshot` : "Chart snapshot");
  const telegramText =
    props.shareConfig?.telegramTextTemplate ||
    (instrumentSymbol ? `${instrumentSymbol} chart snapshot` : "Chart snapshot");

  const renderOptions = () => {
    return options.map((option, i) => {
      if (option.type === "divider") {
        return <OptionsHeader key={i} style={{ padding: 0, margin: "8px 8px" }} />;
      }
      return (
        <OptionValue key={i} onClick={option.action}>
          {option.loading ? <Loading /> : option.logo}
          {option.social}
        </OptionValue>
      );
    });
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (dropDownRef.current && !dropDownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    {
      social: "Twitter",
      logo: <Twitter height={18} width={18} fill="#fff" />,
      action: () =>
        shareImage(
          "twitter",
          ActionEnum.share,
          "https://twitter.com/intent/tweet",
          twitterText
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
          telegramText
        ),
      loading: actionLoading.telegram,
    },
    {
      type: "divider",
    },
    {
      social: "Copy image link",
      logo: <Copy height={24} width={24} fill="#fff" />,
      action: () => shareImage("copyImage", ActionEnum.copy, "", "Copy to clipboard"),
      loading: actionLoading.copyImage,
    },
    {
      social: "Download image",
      logo: <Download height={24} width={24} fill="#fff" />,
      action: () => props.chart?.onDownload(props.shareConfig?.watermarkDataUrl || waterMark64, 240, 66),
    },
  ];

  return (
    <ShareButtonWrapper ref={dropDownRef} className={isOpen ? "active" : undefined}>
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
