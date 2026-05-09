import type { CoreFusionStatic } from "../../internal-types/fusion";

export function resolveStrategySignal(
  FUSION: CoreFusionStatic,
  signalName: unknown,
  fallback: number = FUSION.DO_NOTHING
): number {
  if (typeof signalName !== "string") {
    return fallback;
  }

  const signalValue = FUSION.signalNameToValue(signalName);

  return typeof signalValue === "number" ? signalValue : fallback;
}

export function setSignalOutput(
  signalSeries: any,
  outputSeries: any,
  index: number,
  signal: number,
  single: boolean
): void {
  signalSeries.setValue(index, signal);

  if (single === true && index > 0) {
    if (signalSeries.getValue(index - 1) !== signal) {
      outputSeries.setValue(index, signal);
    }
    return;
  }

  outputSeries.setValue(index, signal);
}