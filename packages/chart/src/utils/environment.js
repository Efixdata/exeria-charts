let touchDevice;
let smallScreen;
export let hitTolerance = 4;

export function isTouchDevice() {
        if (touchDevice !== undefined) {
            return touchDevice;
        } else if (document.documentElement) {
            touchDevice = 'ontouchstart' in document.documentElement;
            if (touchDevice) { hitTolerance = 15; }
            return touchDevice;
        } else {
            console.warn('getting "touchDevice" before initialization');
            return false;
        }
};

export function isSmallScreen() {
    if (smallScreen !== undefined) {
        return smallScreen
    } else if ('matchMedia' in window) {
        smallScreen = window.matchMedia('(max-device-width: 640px)');
        return smallScreen;
    } else {
        console.warn('getting "smallScreen" before initialization');
        return false;
    }
}