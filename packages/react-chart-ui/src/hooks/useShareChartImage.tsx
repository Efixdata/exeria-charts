import { useEffect, useState } from "react";

export default function useShareChartImage(chart:any) {

  const API_URI = "https://dexer-test.netlify.app/.netlify/functions/api";
  const [actionLoading, setActionLoading] = useState(false);

  const shareOnTwitter = async () => {
    setActionLoading(true)
    const canvasToBase64 =  chart?.chart?.canvas?.toDataURL("image/png", 1.0);

    const parsedImageStr = canvasToBase64?.replace(/^data:image\/[a-z]+;base64,/, "");
    try {
      const response = await fetch(`${API_URI}/session/start`, {
        method: "POST",
        body: JSON.stringify({
          binary: parsedImageStr,
          redirect: `${window.location.href}`, //redirect user to the starting point after success
        }),
      });
      const callback = await response.json();
      //open new window in SAFARI browser
      setTimeout(() => {
        window.open(callback.redirect, "_blank");
      }, 0);

    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // shares article with custom text and uri, (image is not included)
  const shareOnTelegram = ()=>{
    const url = window.location.href
    const text = 'Demo text for telegram channel'
    const href = `https://t.me/share/url?url=${url}&text=${text}`
    setTimeout(() => {
        window.open(href, "_blank");
      }, 0); 
  }

  return {shareOnTwitter, shareOnTelegram,  actionLoading}
}
