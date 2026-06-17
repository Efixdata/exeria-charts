import type { EodhdErrorResponse } from "./types";

export function assertEodhdOk(payload: unknown): void {
  if (!payload || typeof payload !== "object") {
    return;
  }

  const record = payload as EodhdErrorResponse;

  if (record.error) {
    throw new Error(record.error);
  }

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    throw new Error(record.errors.join("; "));
  }
}
