import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval } from "../chartExampleData";
import {
  type ChartColorKey,
  type UiColorKey,
  type ThemeVariant,
  type VariantPalette,
  buildChartTheme,
  buildUiTheme,
  previewCandles,
  previewInstrument,
} from "./core";
import styles from "./ChartThemePreview.module.css";
import { loadChartUI } from "@site/src/utils/loadChartUI";

export type ChartSceneAction = (chart: ChartInstance) => void | Promise<void>;

type ChartThemePreviewProps = {
  chartColorsByVariant: VariantPalette<ChartColorKey>;
  uiColorsByVariant: VariantPalette<UiColorKey>;
  themeVariant: ThemeVariant;
  sceneKey: string;
  onChartReady?: ChartSceneAction;
  minHeight?: number;
  className?: string;
};

export default function ChartThemePreview({
  chartColorsByVariant,
  uiColorsByVariant,
  themeVariant,
  sceneKey,
  onChartReady,
  minHeight = 520,
  className,
}: ChartThemePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChartReadyRef = useRef(onChartReady);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<any> | null>(null);

  const chartColors = chartColorsByVariant[themeVariant];
  const runtimeTheme = useMemo(() => buildChartTheme(chartColorsByVariant), [chartColorsByVariant]);
  const uiThemes = useMemo(
    () => ({
      dark: buildUiTheme(uiColorsByVariant.dark, "dark"),
      light: buildUiTheme(uiColorsByVariant.light, "light"),
    }),
    [uiColorsByVariant],
  );
  const activeUiTheme = uiThemes[themeVariant];
  const previewThemeKey = useMemo(
    () => JSON.stringify({ runtimeTheme, themeVariant, sceneKey }),
    [runtimeTheme, themeVariant, sceneKey],
  );

  useEffect(() => {
    onChartReadyRef.current = onChartReady;
  }, [onChartReady]);

  useEffect(() => {
    let disposed = false;

    loadChartUI()
      .then((ChartUI) => {
        if (!disposed) {
          setChartUIComponent(() => ChartUI as ComponentType<any>);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load ChartUI", error);
        if (!disposed) {
          setPreviewError("Failed to load the React UI preview component.");
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const mountChart = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setPreviewError(null);
      setChart(null);

      const chartModule = await import("@efixdata/exeria-chart");
      if (disposed) {
        return;
      }

      const chartInstance = chartModule.createChart({
        container,
        instrument: previewInstrument,
        theme: runtimeTheme,
        themeVariant,
      });

      try {
        chartInstance.init();
        await chartInstance.setMainSeriesData(previewCandles, docsInterval);
        chartInstance.setMainDrawMode("OHLC");

        if (onChartReadyRef.current) {
          await onChartReadyRef.current(chartInstance);
        }

        if (disposed) {
          chartInstance.destroy();
          return;
        }

        setChart(chartInstance);
      } catch (error) {
        chartInstance.destroy();

        if (!disposed) {
          setPreviewError(
            error instanceof Error ? error.message : "Failed to initialize the live chart preview.",
          );
        }
      }
    };

    void mountChart();

    return () => {
      disposed = true;
      setChart((currentChart) => {
        currentChart?.destroy();
        return null;
      });
    };
  }, [previewThemeKey, ChartUIComponent]);

  const ChartUIPreview = ChartUIComponent;

  return (
    <div
      className={[styles.shell, className].filter(Boolean).join(" ")}
      style={{
        minHeight,
        height: minHeight,
        overflow: "hidden",
        borderRadius: "var(--doc-radius-lg)",
        border: "1px solid var(--doc-border)",
        background: chartColors.background,
        position: "relative",
      }}
    >
      {previewError ? (
        <div
          style={{
            position: "absolute",
            inset: 16,
            zIndex: 2,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(209, 46, 89, 0.28)",
            background: "rgba(209, 46, 89, 0.08)",
            color: "var(--doc-text)",
            fontSize: 14,
          }}
        >
          {previewError}
        </div>
      ) : null}

      {ChartUIPreview ? (
        <ChartUIPreview chart={chart} theme={activeUiTheme}>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 0,
              position: "relative",
            }}
          />
        </ChartUIPreview>
      ) : (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: "100%",
            height: "100%",
            color: "var(--doc-text-secondary)",
            fontSize: 14,
          }}
        >
          Loading chart…
        </div>
      )}
    </div>
  );
}
