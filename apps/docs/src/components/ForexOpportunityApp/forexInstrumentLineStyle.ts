import type { ChartInstance } from "@efixdata/exeria-chart";

type InstrumentLineStyle = {
  lineColor: string;
  lineFillMode?: "gradient" | "solid";
  fillOpacity?: number;
};

type ChartPlotter = {
  dataLink?: string;
  renderAs?: string;
  color?: string;
  strokeStyle?: string;
  lineFillVisible?: boolean;
  lineFillMode?: string;
  fillGradientColor?: string;
  lineFillGradientOpacity?: number;
};

export function applyInstrumentLineStyle(
  chart: ChartInstance,
  seriesId: string,
  style: InstrumentLineStyle,
): void {
  const host = chart as ChartInstance & {
    model: {
      panels: Array<{
        objects: ChartPlotter[];
      }>;
    };
  };

  const fillMode = style.lineFillMode ?? "gradient";
  const fillOpacity = style.fillOpacity ?? 0.28;

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      if (object.dataLink !== seriesId) {
        continue;
      }

      object.renderAs = "Line";
      object.color = style.lineColor;
      object.strokeStyle = style.lineColor;
      object.lineFillVisible = fillMode === "gradient";
      object.lineFillMode = fillMode;
      object.fillGradientColor = style.lineColor;
      object.lineFillGradientOpacity = fillOpacity;
    }
  }

  chart.setInstrumentDrawMode("Line", seriesId);
}
