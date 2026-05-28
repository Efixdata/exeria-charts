import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval } from "../chartExampleData";
import {
  type ChartColorKey,
  type UiColorKey,
  type ThemePreset,
  type ThemeVariant,
  type VariantPalette,
  themeVariants,
  chartColorControls,
  uiColorControls,
  cloneVariantPalette,
  buildChartTheme,
  buildUiTheme,
  formatCodeBlock,
  formatApplySnippet,
  capitalizeThemeVariant,
  drawPreviewOverlays,
  previewCandles,
  previewInstrument,
} from "../themeCreator/core";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import showcaseStyles from "../docsShowcase.module.css";
import { loadChartUI } from "@site/src/utils/loadChartUI";

export default function LiveThemeCreator() {
  const defaultPreset = themePresets[0];
  const [presetId, setPresetId] = useState(defaultPreset?.id ?? "trading-dark");
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>("dark");
  const [chartColorsByVariant, setChartColorsByVariant] = useState<VariantPalette<ChartColorKey>>(
    cloneVariantPalette(defaultPreset?.chart ?? themePresets[0]!.chart)
  );
  const [uiColorsByVariant, setUiColorsByVariant] = useState<VariantPalette<UiColorKey>>(
    cloneVariantPalette(defaultPreset?.ui ?? themePresets[0]!.ui)
  );
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [chartUiLoading, setChartUiLoading] = useState(true);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<any> | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const chartColors = chartColorsByVariant[themeVariant];
  const uiColors = uiColorsByVariant[themeVariant];
  const runtimeTheme = useMemo(() => buildChartTheme(chartColorsByVariant), [chartColorsByVariant]);
  const uiThemes = useMemo(
    () => ({
      dark: buildUiTheme(uiColorsByVariant.dark, "dark", chartColorsByVariant.dark.accent),
      light: buildUiTheme(uiColorsByVariant.light, "light", chartColorsByVariant.light.accent),
    }),
    [chartColorsByVariant, uiColorsByVariant]
  );
  const activeUiTheme = uiThemes[themeVariant];

  const runtimeThemeCode = useMemo(() => formatCodeBlock("runtimeTheme", runtimeTheme), [runtimeTheme]);
  const uiThemeCode = useMemo(() => formatCodeBlock("uiThemes", uiThemes), [uiThemes]);
  const applyCode = useMemo(
    () => formatApplySnippet(runtimeTheme, uiThemes, docsInterval, themeVariant),
    [runtimeTheme, themeVariant, uiThemes]
  );

  const previewThemeKey = useMemo(
    () => JSON.stringify({ runtimeTheme, themeVariant }),
    [runtimeTheme, themeVariant]
  );

  useEffect(() => {
    let disposed = false;

    loadChartUI()
      .then((ChartUI) => {
        if (!disposed) {
          setChartUIComponent(() => ChartUI as ComponentType<any>);
          setChartUiLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load ChartUI", error);
        if (!disposed) {
          setPreviewError("Failed to load the React UI preview component.");
          setChartUiLoading(false);
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
        drawPreviewOverlays(chartInstance, previewCandles);

        if (disposed) {
          chartInstance.destroy();
          return;
        }

        setChart(chartInstance);
      } catch (error) {
        chartInstance.destroy();

        if (!disposed) {
          setPreviewError(
            error instanceof Error ? error.message : "Failed to initialize the live chart preview."
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

  useEffect(() => {
    if (!copiedLabel) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedLabel(null);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copiedLabel]);

  const handlePresetChange = (preset: ThemePreset) => {
    setPresetId(preset.id);
    setChartColorsByVariant(cloneVariantPalette(preset.chart));
    setUiColorsByVariant(cloneVariantPalette(preset.ui));
  };

  const handleChartColorChange = (key: ChartColorKey, value: string) => {
    setChartColorsByVariant((current) => ({
      ...current,
      [themeVariant]: {
        ...current[themeVariant],
        [key]: value,
      },
    }));
  };

  const handleUiColorChange = (key: UiColorKey, value: string) => {
    setUiColorsByVariant((current) => ({
      ...current,
      [themeVariant]: {
        ...current[themeVariant],
        [key]: value,
      },
    }));
  };

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
    } catch (error) {
      console.error("Failed to copy theme code", error);
      setCopiedLabel("Copy failed");
    }
  };

  const ChartUIPreview = ChartUIComponent;
  const isChartLoading = chartUiLoading || (!!ChartUIPreview && !chart && !previewError);

  return (
    <div style={styles.wrapper}>
      <section style={styles.presetSection}>
        <div>
          <span style={styles.eyebrow}>Start from a preset</span>
          <h2 style={styles.sectionTitle}>Theme direction</h2>
          <p style={styles.sectionText}>
            Each preset seeds both the chart runtime palette and the React UI chrome. After that,
            tweak the chart and UI sections independently.
          </p>
        </div>

        <div style={styles.presetRow}>
          {themePresets.map((preset) => {
            const isActive = preset.id === presetId;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset)}
                style={isActive ? styles.activePresetButton : styles.presetButton}
              >
                <span
                  style={{
                    ...styles.presetSwatch,
                    background: `linear-gradient(135deg, ${preset.chart[themeVariant].accent}, ${preset.ui[themeVariant].accent})`,
                  }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>

        <div style={styles.variantSection}>
          <span style={styles.variantLabel}>Preview and code variant</span>

          <div style={styles.variantButtons}>
            {themeVariants.map((variant) => {
              const isActive = variant === themeVariant;

              return (
                <button
                  key={variant}
                  type="button"
                  onClick={() => setThemeVariant(variant)}
                  style={isActive ? styles.activeVariantButton : styles.variantButton}
                >
                  {capitalizeThemeVariant(variant)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div style={styles.mainGrid}>
        <section style={styles.controlsColumn}>
          <div style={styles.controlPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTag}>Chart Runtime</span>
              <h3 style={styles.panelTitle}>Chart-surface colors</h3>
              <p style={styles.panelText}>
                These tokens style the chart itself: candles, axes, grid, crosshair, and default
                drawing-tool colors.
              </p>
            </div>

            <div style={styles.controlGrid}>
              {chartColorControls.map((control) => (
                <ColorControlRow
                  key={control.key}
                  label={control.label}
                  description={control.description}
                  value={chartColors[control.key]}
                  onChange={(value) => handleChartColorChange(control.key, value)}
                />
              ))}
            </div>
          </div>

          <div style={styles.controlPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTag}>React UI</span>
              <h3 style={styles.panelTitle}>Toolbar and menu colors</h3>
              <p style={styles.panelText}>
                These tokens style the embedded React UI layer: toolbar, left menu, dialogs,
                inputs, borders, and control surfaces.
              </p>
            </div>

            <div style={styles.controlGrid}>
              {uiColorControls.map((control) => (
                <ColorControlRow
                  key={control.key}
                  label={control.label}
                  description={control.description}
                  value={uiColors[control.key]}
                  onChange={(value) => handleUiColorChange(control.key, value)}
                />
              ))}
            </div>
          </div>
        </section>

        <section style={styles.previewColumn}>
          <div style={styles.previewPanel}>
            <div style={styles.previewHeader}>
              <div>
                <span style={styles.eyebrow}>Live preview</span>
                <h3 style={styles.previewTitle}>Chart + React UI embedded</h3>
              </div>
              <div style={styles.previewMetaRow}>
                <span className={showcaseStyles.metaChip} style={styles.metaChip}>
                  {themeVariant} variant
                </span>
                <span className={showcaseStyles.metaChip} style={styles.metaChip}>BTC/USD fixture</span>
              </div>
            </div>

            <DocChartEmbed
              minHeight={540}
              height={540}
              background={chartColors.background}
              padded
              loading={isChartLoading}
              error={previewError}
              loadingLabel="Loading preview UI…"
            >
              {ChartUIPreview ? (
                <ChartUIPreview chart={chart} theme={activeUiTheme}>
                  <div ref={containerRef} className={docChartEmbedStyles.canvas} />
                </ChartUIPreview>
              ) : (
                <div ref={containerRef} className={docChartEmbedStyles.canvas} />
              )}
            </DocChartEmbed>
          </div>

          <div style={styles.codePanel}>
            <div style={styles.codeHeader}>
              <div>
                <span style={styles.eyebrow}>Copy code</span>
                <h3 style={styles.previewTitle}>Generated theme objects</h3>
              </div>
              <span style={styles.copyStatus}>{copiedLabel ? `${copiedLabel} copied` : ""}</span>
            </div>

            <CodeCard
              title="Chart runtime theme"
              description="Pass this into createChart({ theme, themeVariant }) to switch between the light and dark variants."
              code={runtimeThemeCode}
              onCopy={() => copyText("Chart theme", runtimeThemeCode)}
            />

            <CodeCard
              title="React UI themes"
              description="Pick uiThemes[themeVariant] and pass that active entry into the ChartUI theme prop."
              code={uiThemeCode}
              onCopy={() => copyText("UI themes", uiThemeCode)}
            />

            <CodeCard
              title="Apply snippet"
              description="Copy the full example when you want the runtime theme and the React UI wrapper wired together."
              code={applyCode}
              onCopy={() => copyText("Apply snippet", applyCode)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorControlRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.controlRow}>
      <div style={styles.controlCopy}>
        <span style={styles.controlTitle}>{label}</span>
        <span style={styles.controlDescription}>{description}</span>
      </div>

      <div style={styles.controlInputs}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          style={styles.colorPicker}
          aria-label={label}
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={styles.colorValueInput}
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function CodeCard({
  title,
  description,
  code,
  onCopy,
}: {
  title: string;
  description: string;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div style={styles.codeCard}>
      <div style={styles.codeCardHeader}>
        <div>
          <h4 style={styles.codeCardTitle}>{title}</h4>
          <p style={styles.codeCardDescription}>{description}</p>
        </div>

        <button type="button" onClick={onCopy} style={styles.copyButton}>
          Copy
        </button>
      </div>

      <pre style={styles.codeBlock}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: 24,
  },
  presetSection: {
    display: "grid",
    gap: 16,
    padding: 24,
    borderRadius: "var(--doc-radius-lg)",
    border: "1px solid var(--doc-border)",
    background: "var(--doc-spotlight-gradient)",
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--doc-text-secondary)",
  },
  sectionTitle: {
    margin: 0,
    color: "var(--doc-spotlight-title)",
    fontSize: 28,
    lineHeight: 1.1,
  },
  sectionText: {
    margin: "10px 0 0",
    maxWidth: 720,
    color: "var(--doc-spotlight-text)",
    fontSize: 15,
    lineHeight: 1.7,
  },
  presetRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  variantSection: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  variantLabel: {
    color: "var(--doc-spotlight-text)",
    fontSize: 13,
    fontWeight: 600,
  },
  variantButtons: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 10,
    padding: 6,
    borderRadius: 999,
    border: "1px solid var(--doc-elevated-border)",
    background: "var(--doc-elevated-overlay)",
  },
  variantButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--doc-spotlight-text)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  activeVariantButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid var(--doc-elevated-border)",
    background: "var(--doc-inverse-surface)",
    color: "var(--doc-inverse-text)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  presetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid var(--doc-elevated-border)",
    background: "var(--doc-elevated-overlay)",
    color: "var(--doc-spotlight-title)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  activePresetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid var(--doc-elevated-border)",
    background: "var(--doc-inverse-surface)",
    color: "var(--doc-inverse-text)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  presetSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: "1px solid var(--doc-elevated-border)",
  },
  mainGrid: {
    display: "grid",
    gap: 24,
    gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
  },
  controlsColumn: {
    display: "grid",
    gap: 20,
    alignContent: "start",
  },
  previewColumn: {
    display: "grid",
    gap: 20,
    alignContent: "start",
  },
  controlPanel: {
    display: "grid",
    gap: 18,
    padding: 22,
    borderRadius: 22,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  panelHeader: {
    display: "grid",
    gap: 8,
  },
  panelTag: {
    display: "inline-flex",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--doc-accent-muted-bg)",
    border: "1px solid var(--doc-accent-muted-border)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: 0,
    fontSize: 22,
    color: "var(--doc-text)",
  },
  panelText: {
    margin: 0,
    color: "var(--doc-text-secondary)",
    fontSize: 14,
    lineHeight: 1.65,
  },
  controlGrid: {
    display: "grid",
    gap: 12,
  },
  controlRow: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    border: "1px solid var(--doc-elevated-border)",
    background: "var(--doc-elevated-overlay)",
  },
  controlCopy: {
    display: "grid",
    gap: 4,
  },
  controlTitle: {
    color: "var(--doc-text)",
    fontSize: 14,
    fontWeight: 700,
  },
  controlDescription: {
    color: "var(--doc-text-secondary)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  controlInputs: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  colorPicker: {
    width: 42,
    height: 42,
    padding: 0,
    border: "none",
    borderRadius: 10,
    background: "transparent",
    cursor: "pointer",
  },
  colorValueInput: {
    width: 110,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-code-bg)",
    color: "var(--doc-code-text)",
    fontSize: 13,
    fontFamily: "var(--ifm-font-family-monospace)",
  },
  previewPanel: {
    display: "grid",
    gap: 16,
    padding: 22,
    borderRadius: 22,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  previewHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },
  previewTitle: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 22,
  },
  previewMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
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
  codePanel: {
    display: "grid",
    gap: 16,
    padding: 22,
    borderRadius: 22,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  codeHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  copyStatus: {
    minHeight: 18,
    color: "var(--doc-text-secondary)",
    fontSize: 13,
    fontWeight: 600,
  },
  codeCard: {
    display: "grid",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    border: "1px solid var(--doc-elevated-border)",
    background: "var(--doc-elevated-overlay)",
  },
  codeCardHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  codeCardTitle: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 16,
  },
  codeCardDescription: {
    margin: "4px 0 0",
    color: "var(--doc-text-secondary)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  copyButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid var(--doc-border)",
    background: "transparent",
    color: "var(--doc-text)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  codeBlock: {
    margin: 0,
    padding: 16,
    borderRadius: 16,
    overflowX: "auto",
    background: "var(--doc-code-bg)",
    color: "var(--doc-code-text)",
    fontSize: 13,
    lineHeight: 1.6,
    fontFamily: "var(--ifm-font-family-monospace)",
  },
};