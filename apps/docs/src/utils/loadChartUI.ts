import type { ComponentType } from "react";

type ChartUIModule = {
  ChartUI?: ComponentType<unknown>;
  default?: ComponentType<unknown> | { ChartUI?: ComponentType<unknown> };
};

export async function loadChartUI(): Promise<ComponentType<unknown>> {
  const module = (await import(
    "@efixdata/exeria-chart-ui-react"
  )) as ChartUIModule;

  const ChartUI =
    module.ChartUI ??
    (typeof module.default === "function"
      ? module.default
      : module.default?.ChartUI);

  if (!ChartUI) {
    throw new Error("ChartUI export is missing from @efixdata/exeria-chart-ui-react.");
  }

  return ChartUI;
}
