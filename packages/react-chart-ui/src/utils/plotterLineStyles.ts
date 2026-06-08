export type PlotterLineStyle = {
  id: string;
  labelKey: string;
  defaultLabel: string;
  dash: number[];
};

/** Canvas line-dash patterns used by SeriesObject plotters across the chart engine. */
export const PLOTTER_LINE_STYLES: PlotterLineStyle[] = [
  { id: "solid", labelKey: "lineStyleSolid", defaultLabel: "Solid", dash: [] },
  { id: "dashed", labelKey: "lineStyleDashed", defaultLabel: "Dashed", dash: [3, 3] },
  { id: "short-dashed", labelKey: "lineStyleShortDashed", defaultLabel: "Short dashed", dash: [2, 2] },
  { id: "fine-dashed", labelKey: "lineStyleFineDashed", defaultLabel: "Fine dashed", dash: [2, 1] },
  { id: "medium-dashed", labelKey: "lineStyleMediumDashed", defaultLabel: "Medium dashed", dash: [3, 2] },
  { id: "dotted", labelKey: "lineStyleDotted", defaultLabel: "Dotted", dash: [1, 4] },
  { id: "sparse-dotted", labelKey: "lineStyleSparseDotted", defaultLabel: "Sparse dotted", dash: [1, 8] },
  { id: "dense-dotted", labelKey: "lineStyleDenseDotted", defaultLabel: "Dense dotted", dash: [0, 0] },
  { id: "long-dashed", labelKey: "lineStyleLongDashed", defaultLabel: "Long dashed", dash: [8, 4] },
];

export function dashesEqual(a?: number[], b?: number[]): boolean {
  const left = a ?? [];
  const right = b ?? [];

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export function getPlotterLineStyleId(dash?: number[]): string {
  const match = PLOTTER_LINE_STYLES.find((style) => dashesEqual(style.dash, dash));
  return match?.id ?? PLOTTER_LINE_STYLES[0].id;
}

export function getPlotterLineStyleDash(styleId: string): number[] {
  const match = PLOTTER_LINE_STYLES.find((style) => style.id === styleId);
  return match ? [...match.dash] : [];
}

export function buildPlotterDashMap(
  plotters: Array<{ dataField?: string; dash?: number[] }>,
): Record<string, number[]> {
  const plotterDashes: Record<string, number[]> = {};

  for (const plotter of plotters) {
    if (!plotter.dataField || !Array.isArray(plotter.dash)) {
      continue;
    }

    plotterDashes[String(plotter.dataField)] = [...plotter.dash];
  }

  return plotterDashes;
}
