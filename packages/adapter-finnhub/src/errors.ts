export function assertFinnhubOk(payload: { error?: string }): void {
  if (payload.error) {
    throw new Error(payload.error);
  }
}
