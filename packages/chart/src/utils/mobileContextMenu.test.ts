import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dismissMobileContextMenu,
  isMobileContextMenuOpen,
  resolvePointerClientPosition,
  showMobileContextMenu,
} from "./mobileContextMenu";

describe("resolvePointerClientPosition", () => {
  it("prefers Hammer center viewport coordinates", () => {
    const position = resolvePointerClientPosition({
      center: { x: 120, y: 240 },
      pageX: 999,
      pageY: 999,
    });

    expect(position).toEqual({ x: 120, y: 240 });
  });

  it("uses clientX and clientY when center is missing", () => {
    const position = resolvePointerClientPosition({
      clientX: 80,
      clientY: 160,
      pageX: 400,
      pageY: 900,
    });

    expect(position).toEqual({ x: 80, y: 160 });
  });

  it("reads the first touch from srcEvent", () => {
    const position = resolvePointerClientPosition({
      srcEvent: {
        changedTouches: [{ clientX: 44, clientY: 88 }],
      },
    });

    expect(position).toEqual({ x: 44, y: 88 });
  });

  it("falls back to page coordinates minus scroll offset", () => {
    const previousScrollX = globalThis.window?.scrollX;
    const previousScrollY = globalThis.window?.scrollY;

    Object.defineProperty(globalThis, "window", {
      value: { scrollX: 10, scrollY: 20 },
      configurable: true,
    });

    const position = resolvePointerClientPosition({
      pageX: 110,
      pageY: 220,
    });

    expect(position).toEqual({ x: 100, y: 200 });

    if (previousScrollX !== undefined) {
      Object.defineProperty(globalThis, "window", {
        value: { scrollX: previousScrollX, scrollY: previousScrollY },
        configurable: true,
      });
    }
  });
});

describe("showMobileContextMenu", () => {
  afterEach(() => {
    dismissMobileContextMenu();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stays open through the releasing pointer event after long-press", () => {
    vi.useFakeTimers();
    const body = { appendChild: vi.fn() };
    const pointerDownHandlers: Array<(event: Event) => void> = [];
    const doc = {
      body,
      createElement: () => ({
        setAttribute: vi.fn(),
        style: {},
        appendChild: vi.fn(),
        addEventListener: vi.fn(),
        contains: () => false,
        remove: vi.fn(),
        getBoundingClientRect: () => ({ width: 200, height: 160 }),
      }),
      addEventListener: vi.fn((type: string, handler: (event: Event) => void) => {
        if (type === "mousedown") {
          pointerDownHandlers.push(handler);
        }
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", { innerWidth: 800, innerHeight: 600 });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });

    showMobileContextMenu({
      x: 40,
      y: 40,
      items: [{ id: "goStart", label: "Go to start" }],
      onSelect: () => undefined,
    });

    expect(isMobileContextMenuOpen()).toBe(true);

    pointerDownHandlers[0]?.({ target: body } as unknown as Event);
    expect(isMobileContextMenuOpen()).toBe(true);

    vi.advanceTimersByTime(400);

    pointerDownHandlers[0]?.({ target: body } as unknown as Event);
    expect(isMobileContextMenuOpen()).toBe(false);
  });
});
