export function assertTwelveDataOk(payload: {
  status?: string;
  code?: number;
  message?: string;
}): void {
  if (payload.status === "error" || (payload.code && payload.code >= 400)) {
    throw new Error(payload.message ?? "Twelve Data API error");
  }
}
