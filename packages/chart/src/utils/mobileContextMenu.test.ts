import { describe, expect, it } from "vitest";
import { resolvePointerClientPosition } from "./mobileContextMenu";

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
