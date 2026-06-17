type InteractionDebugGlobal = typeof globalThis & {
  __EXERIA_CHART_DEBUG_INTERACTIONS__?: boolean;
};

export function isChartInteractionDebugEnabled(): boolean {
  return (globalThis as InteractionDebugGlobal).__EXERIA_CHART_DEBUG_INTERACTIONS__ === true;
}

export function logChartInteraction(message: string, data?: Record<string, unknown>): void {
  if (!isChartInteractionDebugEnabled()) {
    return;
  }

  if (data) {
    console.info(`[exeria-chart:interaction] ${message}`, data);
  } else {
    console.info(`[exeria-chart:interaction] ${message}`);
  }
}
