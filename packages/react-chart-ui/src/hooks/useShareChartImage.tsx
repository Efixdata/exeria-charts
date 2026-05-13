import { useState } from "react";
import useGenerateWatermark, {
  DEFAULT_WATERMARK_HEIGHT,
  DEFAULT_WATERMARK_WIDTH,
} from "./useGenerateWatermark";
import type { NullableChartInstance, ShareConfig } from "../chartTypes";

export enum ActionEnum {
  copy,
  share,
}

export default function useShareChartImage(chart: NullableChartInstance, shareConfig?: ShareConfig) {
  const { waterMark64 } = useGenerateWatermark(shareConfig?.watermarkSvg);
  const apiUri = shareConfig?.apiUri || "/api/share-image";
  const templateText = shareConfig?.templateText || "Chart snapshot";
  const sourceUrl = shareConfig?.sourceUrl || window.location.href;
  const watermark = shareConfig?.watermarkDataUrl || waterMark64;
  const [actionLoading, setActionLoading] = useState({
    twitter: false,
    telegram: false,
    copyImage: false,
  });

  const createWaterMark = async () => {
    return new Promise((resolve, reject) => {
      if (!chart?.canvas || !chart.ctx) {
        reject(new Error("Chart is not ready"));
        return;
      }

      const watermarkWidth = DEFAULT_WATERMARK_WIDTH;
      const watermarkHeight = DEFAULT_WATERMARK_HEIGHT;

      const ctx = chart.ctx;
      const positionY = (chart.canvasHeight || 0) / 2 - watermarkHeight / 2;
      const positionX = (chart.canvasWidth || 0) / 2 - watermarkWidth / 2;

      const image = new Image();
      image.onload = setUpWaterMark;
      image.src = watermark;

      function setUpWaterMark() {
        ctx?.drawImage(image, positionX, positionY, watermarkWidth, watermarkHeight);
        return resolve(chart?.canvas?.toDataURL("image/png", 1.0) as string);
      }
    });
  };

  const startSession = async (imageData: string | unknown) => {
    const response = await fetch(`${apiUri}/session/start`, {
      method: "POST",
      body: JSON.stringify({
        binary: imageData,
      }),
    });
    return await response.json();
  };

  const shareImage = async (
    socialName: string,
    action: ActionEnum,
    socialURI?: string,
    text?: string
  ) => {
    setActionLoading((prev) => ({ ...prev, [socialName]: true }));
    const shareModeIsActive = action === ActionEnum.share;
    text = text || templateText;

    try {
      const imageData = await createWaterMark();
      const callback = await startSession(imageData);
      const redirectURI = callback.redirect_url;
      const intentURI = `${socialURI}?text=${text}&url=${redirectURI}?t=${Date.now()}?point=${sourceUrl}`;
      const navigatorURI = `${callback.redirect_url}?t=${Date.now()}?point=${sourceUrl}`;
      const generatedURI = shareModeIsActive ? intentURI : navigatorURI;
      if (redirectURI && shareModeIsActive) {
        const windowReference = shareModeIsActive ? window.open("", "_blank") : null;
        if (windowReference) {
          windowReference.location = generatedURI;
        }
      } else {
        await navigator.clipboard.writeText(generatedURI);
      }
    } catch (err) {
      console.error("error", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [socialName]: false }));
    }
  };

  return { actionLoading, shareImage };
}
