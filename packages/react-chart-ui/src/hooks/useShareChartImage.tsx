import { useEffect, useState } from "react";
import Mark from "../img/icons/mark.svg";

export default function useShareChartImage(chart: any) {
  const TWITTER_INTENT_URI = "https://twitter.com/intent/tweet";
  const TELEGRAM_INTENT_URI = "https://t.me/share/url";
  const API_URI = "https://dexer-images.netlify.app/.netlify/functions/api";
  const TEMPLATE_TEXT = `Check chart now 🚀🚀🚀🚀`;
  const STARTING_POINT = window.location.href;
  const [actionLoading, setActionLoading] = useState({
    twitter: false,
    telegram: false,
    copyImage: false,
  });

  const createWaterMark = async () => {
    return new Promise((resolve, reject) => {
      const ctx = chart.chart.ctx;
      const positionY = chart.chart?.canvasHeight / 2;
      const positionX = chart.chart?.canvasWidth / 3;
      const image = new Image();
      image.onload = setUpWaterMark; // Draw when image has loaded
      image.src = Mark.src;
      function setUpWaterMark() {
        ctx?.drawImage(image, positionX, positionY, 260, 80);
        return resolve(
          chart?.chart?.canvas?.toDataURL("image/png", 1.0) as string
        );
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

  const shareOnTwitter = async () => {
    setActionLoading((prev) => ({ ...prev, twitter: true }));
    try {
      const imageData = await createWaterMark();
      if (imageData) {
        const callback = await startSession(imageData);
        const redirectURI = callback.redirect_url;
        const twitterIntentURI = `${TWITTER_INTENT_URI}?text=${TEMPLATE_TEXT}&url=${redirectURI}?t=${Date.now()}?point=${STARTING_POINT}`;

        //open new window in SAFARI browser
        if (redirectURI) {
          setTimeout(() => {
            window.open(twitterIntentURI, "_blank");
          }, 0);
        }
      }
    } catch (err) {
      console.error("error", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, twitter: false }));
    }
  };

  const shareOnTelegram = async () => {
    setActionLoading((prev) => ({ ...prev, telegram: true }));
    try {
      const imageData = await createWaterMark();
      if (imageData) {
        const callback = await startSession(imageData);
        const redirectURI = callback.redirect_url;
        if (redirectURI) {
          const href = `${TELEGRAM_INTENT_URI}?url=${redirectURI}?t=${Date.now()}?point=${STARTING_POINT}&text=${TEMPLATE_TEXT}`;
          setTimeout(() => {
            window.open(href, "_blank");
          }, 0);
        }
      }
    } catch (err) {
      console.error("error", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, telegram: false }));
    }
  };

  const copyImageURL = async () => {
    setActionLoading((prev) => ({ ...prev, copyImage: true }));
    try {
      const imageData = await createWaterMark();
      if (imageData) {
        const callback = await startSession(imageData);
        const redirectURI = `${
          callback.redirect_url
        }?t=${Date.now()}?point=${STARTING_POINT}`;
        if (redirectURI) {
          await navigator.clipboard.writeText(redirectURI);
        }
      }
    } catch (err) {
      console.error("error", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, copyImage: false }));
    }
  };

  return { shareOnTwitter, shareOnTelegram, actionLoading, copyImageURL };
}
