import * as React from "react";
import { ShareNetwork } from "phosphor-react";
import useShareChartImage, { ActionEnum } from "../../hooks/useShareChartImage";
import useGenerateWatermark, {
  DEFAULT_WATERMARK_HEIGHT,
  DEFAULT_WATERMARK_WIDTH,
} from "../../hooks/useGenerateWatermark";
import type { NullableChartInstance, ShareConfig } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";
import type { TopMenuOverflowItem } from "./TopMenuOverflowMenu";

interface UseShareOverflowMenuItemOptions {
  chart: NullableChartInstance;
  shareConfig?: ShareConfig;
  enabled?: boolean;
}

export function useShareOverflowMenuItem(
  options: UseShareOverflowMenuItemOptions,
): TopMenuOverflowItem | null {
  const { chart, shareConfig, enabled = true } = options;
  const t = useChartTranslate(chart);
  const { waterMark64 } = useGenerateWatermark(shareConfig?.watermarkSvg);
  const { shareImage } = useShareChartImage(chart, shareConfig);

  if (!enabled) {
    return null;
  }

  const instrumentSymbol = chart?.getInstrument()?.symbol || "";
  const snapshotWithSymbol = (templateKey: string, fallback: string) => {
    if (!instrumentSymbol) {
      return t("share_snapshot_default", "Chart snapshot");
    }

    const template = t(templateKey, fallback);
    return template.replace("{symbol}", instrumentSymbol).replace("${symbol}", instrumentSymbol);
  };

  const twitterText =
    shareConfig?.twitterTextTemplate ||
    snapshotWithSymbol("share_snapshot_twitter_with_symbol", "${symbol} chart snapshot");
  const telegramText =
    shareConfig?.telegramTextTemplate ||
    snapshotWithSymbol("share_snapshot_with_symbol", "{symbol} chart snapshot");

  return {
    id: "share",
    label: t("toolbar_share_chart", "Share Chart"),
    icon: <ShareNetwork size={20} weight="regular" aria-hidden />,
    submenu: [
      { id: "twitter", label: "Twitter" },
      { id: "telegram", label: "Telegram" },
      { id: "copy", label: t("share_copy_link", "Copy image link") },
      { id: "download", label: t("share_download", "Download image") },
    ],
    onSubmenuSelect: (id) => {
      if (id === "twitter") {
        shareImage("twitter", ActionEnum.share, "https://twitter.com/intent/tweet", twitterText);
        return;
      }

      if (id === "telegram") {
        shareImage("telegram", ActionEnum.share, "https://t.me/share/url", telegramText);
        return;
      }

      if (id === "copy") {
        shareImage("copyImage", ActionEnum.copy, "", t("share_copy_clipboard", "Copy to clipboard"));
        return;
      }

      if (id === "download") {
        chart?.onDownload(
          shareConfig?.watermarkDataUrl || waterMark64,
          DEFAULT_WATERMARK_WIDTH,
          DEFAULT_WATERMARK_HEIGHT,
        );
      }
    },
  };
}
