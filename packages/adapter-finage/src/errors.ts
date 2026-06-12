export function assertFinageOk(payload: {
  error?: string;
  message?: string;
}): void {
  if (payload.error) {
    throw new Error(payload.error);
  }

  if (payload.message && /error|invalid|unauthorized/i.test(payload.message)) {
    throw new Error(payload.message);
  }
}
