import { useMemo, useState, type CSSProperties } from "react";
import ChartThemePreview from "../themeCreator/ChartThemePreview";
import {
  type ChartColorKey,
  type UiColorKey,
  type ThemeVariant,
  chartColorControls,
  deriveCandleStrokeColors,
  uiColorControls,
} from "../themeCreator/core";
import {
  getThemePresetPreferredVariant,
  themePresets,
} from "../themeCreator/chartSettingsThemePresets";
import { ColorFieldInput } from "../ColorFieldInput";
import ElementPicker from "./ElementPicker";
import {
  type PlaygroundExampleId,
  createPlaygroundPalette,
  getPlaygroundExample,
  playgroundExamples,
} from "./playgroundExamples";
import styles from "./playground.module.css";

type ColorScope = "chart" | "ui";

const defaultPalette = createPlaygroundPalette("trading-dark");

const chartPickerOptions = chartColorControls.map((control) => ({
  value: control.key,
  label: control.label,
}));

const uiPickerOptions = uiColorControls.map((control) => ({
  value: control.key,
  label: control.label,
}));

const pickerWidthCh =
  Math.max(
    ...chartPickerOptions.map((option) => option.label.length),
    ...uiPickerOptions.map((option) => option.label.length),
  ) + 2;

const pickerWidthStyle = { "--picker-width": `${pickerWidthCh}ch` } as CSSProperties;

export default function Playground() {
  const [presetId, setPresetId] = useState("trading-dark");
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>("dark");
  const [chartColorsByVariant, setChartColorsByVariant] = useState(defaultPalette.chart);
  const [uiColorsByVariant, setUiColorsByVariant] = useState(defaultPalette.ui);
  const [colorScope, setColorScope] = useState<ColorScope>("chart");
  const [selectedChartKey, setSelectedChartKey] = useState<ChartColorKey>("background");
  const [selectedUiKey, setSelectedUiKey] = useState<UiColorKey>("toolbarBackground");
  const [activeExampleId, setActiveExampleId] = useState<PlaygroundExampleId>("trading-dark-scene");
  const [sceneVersion, setSceneVersion] = useState(0);
  const [usePresetOnly, setUsePresetOnly] = useState(true);

  const activeExample = useMemo(
    () => getPlaygroundExample(activeExampleId),
    [activeExampleId],
  );

  const sceneApplyKey = useMemo(
    () => (usePresetOnly ? null : `${activeExampleId}:${sceneVersion}`),
    [activeExampleId, sceneVersion, usePresetOnly],
  );

  const chartSceneAction = useMemo(
    () => (usePresetOnly ? undefined : activeExample.applyScene),
    [activeExample, usePresetOnly],
  );

  const handlePresetChange = (nextPresetId: string) => {
    const palette = createPlaygroundPalette(nextPresetId);
    setPresetId(nextPresetId);
    setThemeVariant(getThemePresetPreferredVariant(nextPresetId));
    setChartColorsByVariant(palette.chart);
    setUiColorsByVariant(palette.ui);
    setUsePresetOnly(true);
  };

  const handleExampleSelect = (exampleId: PlaygroundExampleId) => {
    const example = getPlaygroundExample(exampleId);
    const palette = createPlaygroundPalette(example.presetId);

    setActiveExampleId(example.id);
    setPresetId(example.presetId);
    setThemeVariant(example.themeVariant);
    setChartColorsByVariant(palette.chart);
    setUiColorsByVariant(palette.ui);
    setUsePresetOnly(false);
    setSceneVersion((value) => value + 1);

    document.getElementById("playground-chart")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleChartColorChange = (key: ChartColorKey, value: string) => {
    setUsePresetOnly(false);
    setChartColorsByVariant((current) => {
      const nextVariantColors = {
        ...current[themeVariant],
        [key]: value,
      };

      if (key === "candleUp" || key === "candleDown" || key === "background") {
        Object.assign(nextVariantColors, deriveCandleStrokeColors(nextVariantColors, themeVariant));
      }

      return {
        ...current,
        [themeVariant]: nextVariantColors,
      };
    });
    setSceneVersion((value) => value + 1);
  };

  const handleUiColorChange = (key: UiColorKey, value: string) => {
    setUsePresetOnly(false);
    setUiColorsByVariant((current) => ({
      ...current,
      [themeVariant]: {
        ...current[themeVariant],
        [key]: value,
      },
    }));
    setSceneVersion((value) => value + 1);
  };

  const selectedChartColor = chartColorsByVariant[themeVariant][selectedChartKey];
  const selectedUiColor = uiColorsByVariant[themeVariant][selectedUiKey];
  const activeChartHint =
    chartColorControls.find((control) => control.key === selectedChartKey)?.description ?? "";
  const activeUiHint =
    uiColorControls.find((control) => control.key === selectedUiKey)?.description ?? "";

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Let&apos;s play with Exeria charts</h1>
        <p className={styles.lead}>
          Tune colors, switch themes, and explore the live chart—updates apply instantly.
        </p>
      </header>

      <div className={styles.workspace}>
        <div className={styles.controlsPanel} aria-label="Playground controls">
          <ol className={styles.steps}>
            <li className={`${styles.stepRow} ${styles.stepRowInline}`}>
              <span className={styles.stepNumber} aria-hidden>
                1
              </span>
              <div className={styles.stepBody}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Choose the preset colors</h2>
                  <div className={styles.presetRow}>
                    {themePresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={
                          preset.id === presetId ? styles.presetButtonActive : styles.presetButton
                        }
                        onClick={() => handlePresetChange(preset.id)}
                        aria-pressed={preset.id === presetId}
                        title={preset.description ?? preset.label}
                      >
                        <span
                          className={styles.presetSwatch}
                          style={{ background: preset.chipColor }}
                        />
                        {preset.chipLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </li>

            <li className={`${styles.stepRow} ${styles.stepRowInline}`}>
              <span className={styles.stepNumber} aria-hidden>
                2
              </span>
              <div className={styles.stepBody}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Switch between light and dark</h2>
                  <div className={styles.variantRow}>
                  {(["dark", "light"] as ThemeVariant[]).map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      className={
                        variant === themeVariant ? styles.variantButtonActive : styles.variantButton
                      }
                      onClick={() => {
                        setThemeVariant(variant);
                        setUsePresetOnly(false);
                      }}
                      aria-pressed={variant === themeVariant}
                    >
                      {variant === "dark" ? "Dark" : "Light"}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            </li>

            <li className={`${styles.stepRow} ${styles.stepRowInline}`}>
              <span className={styles.stepNumber} aria-hidden>
                3
              </span>
              <div className={styles.stepBody}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Customize your chart</h2>
                  <div className={styles.scopeTabs}>
                    <button
                      type="button"
                      className={colorScope === "chart" ? styles.scopeTabActive : styles.scopeTab}
                      onClick={() => setColorScope("chart")}
                      aria-pressed={colorScope === "chart"}
                    >
                      Chart runtime
                    </button>
                    <button
                      type="button"
                      className={colorScope === "ui" ? styles.scopeTabActive : styles.scopeTab}
                      onClick={() => setColorScope("ui")}
                      aria-pressed={colorScope === "ui"}
                    >
                      React UI
                    </button>
                  </div>
                </div>

                <div className={styles.customizePanel}>
                  {colorScope === "chart" ? (
                    <div className={styles.colorEditor}>
                      <span className={styles.colorEditorLabel}>Chart element</span>
                      <div className={styles.colorEditorRow} style={pickerWidthStyle}>
                        <ElementPicker
                          hideLabel
                          label="Chart element"
                          value={selectedChartKey}
                          options={chartPickerOptions}
                          onChange={setSelectedChartKey}
                        />

                        <ColorFieldInput
                          className={styles.colorInputs}
                          value={selectedChartColor}
                          onChange={(nextValue) =>
                            handleChartColorChange(selectedChartKey, nextValue)
                          }
                          swatchClassName={styles.colorPicker}
                          hexClassName={styles.colorValue}
                          swatchAriaLabel="Chart color"
                          hexAriaLabel="Chart color hex value"
                        />
                      </div>
                      <p className={styles.controlHint}>{activeChartHint}</p>
                    </div>
                  ) : (
                    <div className={styles.colorEditor}>
                      <span className={styles.colorEditorLabel}>UI element</span>
                      <div className={styles.colorEditorRow} style={pickerWidthStyle}>
                        <ElementPicker
                          hideLabel
                          label="UI element"
                          value={selectedUiKey}
                          options={uiPickerOptions}
                          onChange={setSelectedUiKey}
                        />

                        <ColorFieldInput
                          className={styles.colorInputs}
                          value={selectedUiColor}
                          onChange={(nextValue) => handleUiColorChange(selectedUiKey, nextValue)}
                          swatchClassName={styles.colorPicker}
                          hexClassName={styles.colorValue}
                          swatchAriaLabel="UI color"
                          hexAriaLabel="UI color hex value"
                        />
                      </div>
                      <p className={styles.controlHint}>{activeUiHint}</p>
                    </div>
                  )}
                </div>
              </div>
            </li>

            <li className={styles.stepRow}>
              <span className={styles.stepNumber} aria-hidden>
                4
              </span>
              <div className={styles.stepBody}>
                <h2 className={styles.stepTitle}>Play with the chart</h2>
                <p className={styles.stepText}>
                  Add indicators, try drawing tools, and open full-screen mode from the toolbar.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <section id="playground-chart" className={styles.chartSection}>
          <ChartThemePreview
            chartColorsByVariant={chartColorsByVariant}
            uiColorsByVariant={uiColorsByVariant}
            themeVariant={themeVariant}
            presetId={presetId}
            usePresetTemplate={usePresetOnly}
            sceneApplyKey={sceneApplyKey}
            onChartReady={chartSceneAction}
            minHeight={560}
            className={styles.chartPreview}
          />
        </section>
      </div>

      <section className={styles.examplesSection}>
        <div className={styles.examplesHeader}>
          <h2 className={styles.examplesTitle}>Examples and ideas</h2>
          <p className={styles.examplesLead}>
            Click a scene to load its colors, tools, and indicators into the live chart above.
          </p>
        </div>

        <div className={styles.examplesGrid}>
          {playgroundExamples.map((example) => (
            <button
              key={example.id}
              type="button"
              className={
                example.id === activeExampleId ? styles.exampleCardActive : styles.exampleCard
              }
              onClick={() => handleExampleSelect(example.id)}
              aria-pressed={example.id === activeExampleId}
            >
              <img
                src={example.image}
                alt={example.title}
                className={styles.exampleImage}
                loading="lazy"
              />
              <span className={styles.exampleTitle}>{example.title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
