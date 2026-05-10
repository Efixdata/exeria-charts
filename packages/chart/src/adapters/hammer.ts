import Hammer from "../lib/hammer.min.js";
import type { PointerEventLike } from "../internal-types/interactor";

export interface GestureRecognizer {
  set(options: Record<string, unknown>): void;
}

export type GestureHandler = (event: PointerEventLike) => void;

export interface GestureManager {
  get(name: string): GestureRecognizer;
  on(events: string, handler: GestureHandler): void;
  off(events: string, handler: GestureHandler): void;
  destroy(): void;
}

type HammerStatic = {
  new (element: HTMLElement, options: Record<string, unknown>): GestureManager;
  DIRECTION_ALL: number;
};

const HAMMER = Hammer as unknown as HammerStatic;

export const HAMMER_DIRECTIONS = {
  all: HAMMER.DIRECTION_ALL,
} as const;

export function createGestureManager(element: HTMLElement): GestureManager {
  return new HAMMER(element, {});
}