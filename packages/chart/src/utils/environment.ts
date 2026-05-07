let touchDevice: boolean | undefined;
let smallScreen: boolean | undefined;

export let hitTolerance = 4;

export function isTouchDevice(): boolean {
  if (touchDevice !== undefined) {
    return touchDevice;
  }

  if (typeof document !== "undefined" && document.documentElement) {
    touchDevice = "ontouchstart" in document.documentElement;
    if (touchDevice) {
      hitTolerance = 15;
    }
    return touchDevice;
  }

  console.warn('getting "touchDevice" before initialization');
  return false;
}

export function isSmallScreen(): boolean {
  if (smallScreen !== undefined) {
    return smallScreen;
  }

  if (typeof window !== "undefined" && "matchMedia" in window) {
    smallScreen = window.matchMedia("(max-device-width: 640px)").matches;
    return smallScreen;
  }

  console.warn('getting "smallScreen" before initialization');
  return false;
}