import { useEffect, useState } from "react";
import WaterMark from "../img/icons/WaterMark.svg"
import useGenerateWatermark from "./useGenerateWatermark";
import type { NullableChartInstance } from "../chartTypes";

export enum ActionEnum {
  copy,
  share,
}

export default function useShareChartImage(chart: NullableChartInstance) {
  const { waterMark64 } = useGenerateWatermark()
  const API_URI = "https://dexer-images.netlify.app/.netlify/functions/api";
  const TEMPLATE_TEXT = `Chart by Dexer.io`;
  const STARTING_POINT = window.location.href;
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

      const watermarkWidth = 240;
      const watermarkHeight = 66;

      const ctx = chart.ctx;
      const positionY = (chart.canvasHeight || 0) / 2 - watermarkHeight / 2;
      const positionX = (chart.canvasWidth || 0) / 2 - watermarkWidth / 2;

      const image = new Image();
      image.onload = setUpWaterMark; 
      image.src = waterMark64;

      function setUpWaterMark() {
        ctx?.drawImage(image, positionX, positionY, watermarkWidth, watermarkHeight);
        return resolve(chart?.canvas?.toDataURL("image/png", 1.0) as string);
      }
    });
  };

  const startSession = async (imageData: string | unknown) => {
    const response = await fetch(`${API_URI}/session/start`, {
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
    text?: string,
  ) => {
    setActionLoading((prev) => ({ ...prev, [socialName]: true }));
    const shareModeIsActive = action === ActionEnum.share;
    text = text || TEMPLATE_TEXT;

    try {
      const imageData = await createWaterMark();
      const callback = await startSession(imageData);
      const redirectURI = callback.redirect_url;
      const intentURI = `${socialURI}?text=${text}&url=${redirectURI}?t=${Date.now()}?point=${STARTING_POINT}`;
      const navigatorURI = `${callback.redirect_url}?t=${Date.now()}?point=${STARTING_POINT}`;
      const generatedURI = shareModeIsActive ? intentURI : navigatorURI;
      if (redirectURI && shareModeIsActive) {
        const windowReference = shareModeIsActive ? window.open('', '_blank') : null;
        if(windowReference){
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
