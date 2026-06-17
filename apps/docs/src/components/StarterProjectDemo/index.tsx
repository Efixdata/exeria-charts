import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import type { StarterProject } from "@site/src/data/starterProjects";
import { getStarterProjectRuntimeTheme } from "@site/src/data/starterProjectScenes";
import { docsInterval } from "../chartExampleData";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import { alignDocsChartViewport } from "../docsChartTheme";
import { docsShowcasePalette } from "../docsShowcasePalette";
import { buildChartTheme } from "../themeCreator/core";

type StarterProjectDemoProps = {
  projectId: StarterProject["id"];
  minHeight?: number;
};

export default function StarterProjectDemo({ projectId, minHeight = 520 }: StarterProjectDemoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scene, preset, instrument } = useMemo(
    () => getStarterProjectRuntimeTheme(projectId),
    [projectId],
  );
  const runtimeTheme = useMemo(() => buildChartTheme(preset.chart), [preset]);

  useEffect(() => {
    let disposed = false;

    const mountChart = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        const chart = chartModule.createChart({
          container,
          instrument,
          theme: runtimeTheme,
          themeVariant: scene.themeVariant,
        });

        chartRef.current = chart;
        chart.init();
        await chart.setMainSeriesData(scene.candles, docsInterval);

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });

        if (scene.applyScene) {
          await scene.applyScene(chart, scene.candles);
        }

        await alignDocsChartViewport(chart);

        if (!disposed) {
          setLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load starter demo");
          setLoading(false);
        }
      }
    };

    void mountChart();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [instrument, runtimeTheme, scene]);

  return (
    <DocChartEmbed
      minHeight={minHeight}
      height={minHeight}
      background={docsShowcasePalette.background}
      loading={loading}
      error={error}
    >
      <div ref={containerRef} className={docChartEmbedStyles.canvas} />
    </DocChartEmbed>
  );
}
