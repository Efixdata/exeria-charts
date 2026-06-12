import { useRef } from "react";

let nextId = 0;

/** React 17-compatible substitute for `useId`. */
export function useStableId(prefix = "id"): string {
  const idRef = useRef<string>();

  if (!idRef.current) {
    nextId += 1;
    idRef.current = `${prefix}-${nextId}`;
  }

  return idRef.current;
}
