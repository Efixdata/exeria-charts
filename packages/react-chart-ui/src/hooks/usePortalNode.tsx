export const usePortalNode = (document: any) => {
    if (!document) return null;

    if (document.fullscreenElement) return document.fullscreenElement;
    if (document.webkitFullscreenElement) return document.webkitFullscreenElement;
    if (document.mozFullScreenElement) return document.mozFullScreenElement;
    if (document.msFullscreenElement) return document.msFullscreenElement;

    return null;
  };