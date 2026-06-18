import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartInstance, ScriptDefinition } from "@efixdata/exeria-chart";
import { docsCandleCount, docsExampleDatasets, docsInterval } from "../chartExampleData";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import {
  applyDocsChartPreset,
  alignDocsChartViewport,
  docsChartEmbedBackground,
  getDocsChartCreateOptions,
} from "../docsChartTheme";
import showcaseStyles from "../docsShowcase.module.css";

type WiringPresetKey = "emaSmaCross" | "crossToPosition" | "emaDisplace" | "emaVsSmaIf";

interface ScriptWiringShowcaseProps {
  visiblePresets?: WiringPresetKey[];
  initialPreset?: WiringPresetKey;
}

interface WiringPresetDefinition {
  label: string;
  category: "Strategy" | "Function";
  wiringType: string;
  description: string;
  codeHint: string;
  apply(chart: ChartInstance): Promise<void>;
}

const defaultVisiblePresets: WiringPresetKey[] = [
  "emaSmaCross",
  "crossToPosition",
  "emaDisplace",
  "emaVsSmaIf",
];

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

function cloneScript(script: ScriptDefinition): ScriptDefinition {
  return JSON.parse(JSON.stringify(script)) as ScriptDefinition;
}

function getScriptClone(chart: ChartInstance, key: string): ScriptDefinition {
  const script = chart.getScripts()[key];

  if (!script) {
    throw new Error(`Missing script definition for ${key}`);
  }

  return cloneScript(script);
}

function getSeriesReference(chart: ChartInstance, field: string): string {
  const series = Object.values(chart.getSeriesManager()).find(
    (candidate) => candidate.seriesId && candidate.fields.includes(field)
  );

  if (!series?.seriesId) {
    throw new Error(`Series field ${field} not found`);
  }

  return `${series.seriesId}:${field}`;
}

function asConditionalSeries(reference: string) {
  return {
    type: "series",
    value: reference,
  };
}

async function addMovingAveragePair(chart: ChartInstance) {
  const ema = getScriptClone(chart, "EMA");
    // @ts-ignore
  ema.inputs.PERIODS.value = 12;
  await chart.addScript("EMA", ema);

    // @ts-ignore
    // @ts-ignore
  const sma = getScriptClone(chart, "SMA");
    // @ts-ignore
  sma.inputs.PERIODS.value = 34;
  await chart.addScript("SMA", sma);

  await waitForFrame();

  return {
    emaRef: getSeriesReference(chart, "EMA"),
    smaRef: getSeriesReference(chart, "SMAValue"),
  };
}

const definitions: Record<WiringPresetKey, WiringPresetDefinition> = {
  emaSmaCross: {
    label: "EMA vs SMA CROSS",
    category: "Strategy",
    wiringType: "series -> strategy",
    description:
      "Two moving-average outputs are rewired into CROSS so the strategy follows EMA/SMA intersections instead of the default MACD pair.",
    codeHint: 'CROSS.LINE = "seriesId:EMA"; CROSS.SIGNAL = "seriesId:SMA"',
    async apply(chart) {
    // @ts-ignore
      const { emaRef, smaRef } = await addMovingAveragePair(chart);
    // @ts-ignore
    // @ts-ignore

    // @ts-ignore
    // @ts-ignore
      const cross = getScriptClone(chart, "CROSS");
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
      cross.inputs.LINE.value = emaRef;
    // @ts-ignore
      cross.inputs.SIGNAL.value = smaRef;
    // @ts-ignore
      cross.inputs.ONDN.value = "Buy";
    // @ts-ignore
      cross.inputs.ONUP.value = "Sell";

      await chart.addScript("CROSS", cross);
    },
  },
    // @ts-ignore
  crossToPosition: {
    // @ts-ignore
    label: "CROSS into POSITION",
    category: "Strategy",
    wiringType: "strategy -> strategy",
    description:
    // @ts-ignore
      "A custom CROSS stream is used as the STRATEGY input for POSITION, which turns discrete signals into a running position-size pane.",
    // @ts-ignore
    // @ts-ignore
    codeHint: 'POSITION.STRATEGY = "seriesId:CrossValue"',
    // @ts-ignore
    async apply(chart) {
      const { emaRef, smaRef } = await addMovingAveragePair(chart);

      const cross = getScriptClone(chart, "CROSS");
    // @ts-ignore
    // @ts-ignore
      cross.inputs.LINE.value = emaRef;
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
      cross.inputs.SIGNAL.value = smaRef;
      await chart.addScript("CROSS", cross);

      await waitForFrame();
    // @ts-ignore

      const position = getScriptClone(chart, "POSITION");
    // @ts-ignore
      position.inputs.STRATEGY.value = getSeriesReference(chart, "CrossValue");
    // @ts-ignore
      position.inputs.WEIGHT.value = 1;
    // @ts-ignore
    // @ts-ignore
      position.inputs.MULTIPLIER.value = { type: "double", value: 1 };
    // @ts-ignore

      await chart.addScript("POSITION", position);
    // @ts-ignore
    },
  },
  emaDisplace: {
    label: "EMA into DISPLACE",
    category: "Function",
    wiringType: "series -> function",
    // @ts-ignore
    description:
    // @ts-ignore
      "DISPLACE uses the output of an EMA script as its source series, producing a shifted overlay instead of working from raw price data.",
    // @ts-ignore
    codeHint: 'DISPLACE.DSERIES = "seriesId:EMA"',
    async apply(chart) {
    // @ts-ignore
      const ema = getScriptClone(chart, "EMA");
    // @ts-ignore
    // @ts-ignore
      ema.inputs.PERIODS.value = 21;
    // @ts-ignore
      await chart.addScript("EMA", ema);
    // @ts-ignore

      await waitForFrame();

      const displace = getScriptClone(chart, "DISPLACE");
    // @ts-ignore
      displace.inputs.DSERIES.value = getSeriesReference(chart, "EMA");
    // @ts-ignore
      displace.inputs.PERIODS.value = 18;
    // @ts-ignore
      displace.inputs.VALUE.value = 0;
    // @ts-ignore

    // @ts-ignore
      await chart.addScript("DISPLACE", displace);
    // @ts-ignore
    },
    // @ts-ignore
  },
    // @ts-ignore
  emaVsSmaIf: {
    label: "EMA vs SMA IF",
    category: "Function",
    wiringType: "conditional series",
    description:
      "IF switches its conditional inputs into series mode so it can emit a compact regime line based on whether EMA is above, equal to, or below SMA.",
    codeHint: 'IF.VAL_A = { type: "series", value: "seriesId:EMA" }',
    async apply(chart) {
      const { emaRef, smaRef } = await addMovingAveragePair(chart);

      const ifScript = getScriptClone(chart, "IF");
    // @ts-ignore
      ifScript.inputs.VAL_A.value = asConditionalSeries(emaRef);
    // @ts-ignore
      ifScript.inputs.VAL_B.value = asConditionalSeries(smaRef);
    // @ts-ignore
      ifScript.inputs.VAL_X.value = { type: "double", value: 1 };
    // @ts-ignore
      ifScript.inputs.VAL_Y.value = { type: "double", value: 0 };
    // @ts-ignore
      ifScript.inputs.VAL_Z.value = { type: "double", value: -1 };

      await chart.addScript("IF", ifScript);
    },
  },
};

export default function ScriptWiringShowcase({
  visiblePresets = defaultVisiblePresets,
  initialPreset,
}: ScriptWiringShowcaseProps) {
  const availablePresets = useMemo(() => {
    return visiblePresets.filter((preset) => definitions[preset]);
  }, [visiblePresets]);
  const [activePresetKey, setActivePresetKey] = useState<WiringPresetKey>(
    initialPreset && definitions[initialPreset] ? initialPreset : availablePresets[0] ?? "emaSmaCross"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  const activePreset = definitions[activePresetKey];
  const candles = docsExampleDatasets.trend.candles;

  useEffect(() => {
    let disposed = false;

    const mountChart = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        const chart = chartModule.createChart({
          container,
          ...getDocsChartCreateOptions(),
        });
        chartRef.current = chart;

        chart.init();
        await chart.setMainSeriesData(candles, docsInterval, false);
        applyDocsChartPreset(chart);
        chart.setMainDrawMode("OHLC");
        await activePreset.apply(chart);
        chart.setAutoScale(true);
        await alignDocsChartViewport(chart);

        if (!disposed) {
          setLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load script example");
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
  }, [activePreset, candles]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        <div>
          <span style={styles.controlLabel}>Preset</span>
          <div style={styles.buttonRow}>
            {availablePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setActivePresetKey(preset)}
                style={preset === activePresetKey ? styles.activeButton : styles.button}
              >
                {definitions[preset].label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.descriptionBlock}>
          <span style={styles.controlLabel}>What it wires</span>
          <p style={styles.description}>{activePreset.description}</p>
          <div className={showcaseStyles.codeHint}>{activePreset.codeHint}</div>
        </div>
      </div>

      <div style={styles.metaRow}>
        <span style={styles.metaTag}>Live MDX example</span>
        <span className={showcaseStyles.metaChip}>{activePreset.category}</span>
        <span className={showcaseStyles.metaChip}>{activePreset.wiringType}</span>
        <span className={showcaseStyles.metaChip}>{docsCandleCount} candles</span>
        <span className={showcaseStyles.metaChip}>BTC/USD fixture</span>
      </div>

      <DocChartEmbed
        minHeight={460}
        height={460}
        background={docsChartEmbedBackground}
        loading={loading}
        error={error}
      >
        <div ref={containerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>
    </div>
  );
}

const baseButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid var(--doc-border)",
  background: "transparent",
  color: "var(--doc-text)",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: 20,
  },
  controls: {
    display: "grid",
    gap: 24,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    padding: 24,
    borderRadius: 20,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  controlLabel: {
    display: "block",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--doc-text-secondary)",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  button: baseButtonStyle,
  activeButton: {
    ...baseButtonStyle,
    border: "1px solid transparent",
    background: "var(--doc-text)",
    color: "var(--doc-bg)",
  },
  descriptionBlock: {
    display: "grid",
    gap: 12,
    alignContent: "start",
  },
  description: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 15,
    lineHeight: 1.65,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  metaTag: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--doc-warning-muted-bg)",
    border: "1px solid var(--doc-warning-muted-border)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid var(--doc-danger-border)",
    background: "var(--doc-danger-bg)",
    color: "var(--doc-text)",
    fontSize: 14,
  },
};