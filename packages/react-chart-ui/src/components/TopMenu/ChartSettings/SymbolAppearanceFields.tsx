import * as React from "react";
import type { ChartInstrumentSymbolAppearance, ChartLineFillMode, DrawMode } from "@efixdata/exeria-chart";
import { Eye, EyeSlash } from "phosphor-react";
import { Label } from "ui";
import { DialogSelect, type DialogSelectOption } from "../Indicators/DialogSelect";
import { LineStyleSelect } from "../Indicators/LineStyleSelect";
import {
  getPlotterLineStyleDash,
  getPlotterLineStyleId,
  type PlotterLineStyle,
} from "../../../utils/plotterLineStyles";
import { ColorField } from "./ColorField";
import { ChartTypeSelect } from "./ChartTypeSelect";
import styles from "./chartSettings.module.css";

export type SymbolAppearanceFieldValues = ChartInstrumentSymbolAppearance & {
  lineColor: string;
  lineDash: number[];
  drawMode?: DrawMode;
};

type SymbolAppearanceFieldsProps = {
  values: SymbolAppearanceFieldValues;
  onChange: (patch: Partial<SymbolAppearanceFieldValues>) => void;
  lineFillModeOptions: DialogSelectOption[];
  getLineStyleOptionLabel: (style: PlotterLineStyle) => string;
  getChartTypeOptionLabel: (drawMode: DrawMode) => string;
  t: (key: string, fallback?: string) => string;
  showChartType?: boolean;
  showLineStyle?: boolean;
  symbolLabel?: string;
};

const VisibilityToggle = (props: {
  active: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    aria-label={props.label}
    title={props.label}
    onClick={() => props.onChange(!props.active)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      padding: 0,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "inherit",
    }}
  >
    {props.active ? <Eye size={18} weight="regular" /> : <EyeSlash size={18} weight="regular" />}
  </button>
);

export const SymbolAppearanceFields = (props: SymbolAppearanceFieldsProps) => {
  const { values, onChange, t, symbolLabel } = props;
  const lineStyleAriaLabel = symbolLabel
    ? `${symbolLabel} ${t("chart_settings_line_style")}`
    : t("chart_settings_line_style");
  const chartTypeAriaLabel = symbolLabel
    ? `${symbolLabel} ${t("chart_settings_chart_type", "Chart type")}`
    : t("chart_settings_chart_type", "Chart type");

  return (
    <>
      {props.showChartType && values.drawMode ? (
        <div className={styles.fieldRow}>
          <Label name={t("chart_settings_chart_type", "Chart type")}>
            <ChartTypeSelect
              value={values.drawMode}
              onChange={(drawMode) => onChange({ drawMode })}
              getOptionLabel={props.getChartTypeOptionLabel}
              ariaLabel={chartTypeAriaLabel}
            />
          </Label>
        </div>
      ) : null}

      <div className={styles.colorGrid}>
        <ColorField
          label={t("chart_settings_chart_line")}
          value={values.lineColor}
          onChange={(lineColor) => onChange({ lineColor })}
        />
        {props.showLineStyle !== false ? (
          <Label name={t("chart_settings_line_style")}>
            <LineStyleSelect
              value={getPlotterLineStyleId(values.lineDash)}
              lineColor={values.lineColor}
              onChange={(styleId) => onChange({ lineDash: getPlotterLineStyleDash(styleId) })}
              getOptionLabel={props.getLineStyleOptionLabel}
              ariaLabel={lineStyleAriaLabel}
            />
          </Label>
        ) : null}
        <div className={styles.colorFieldWithToggle}>
          <div className={styles.fieldRow}>
            <ColorField
              label={t("chart_settings_line_fill")}
              value={values.chartFillColor}
              onChange={(chartFillColor) => onChange({ chartFillColor })}
            />
            <div className={styles.gradientFillColumn}>
              <ColorField
                label={t("chart_settings_line_fill_gradient")}
                value={values.chartFillGradientColor}
                onChange={(chartFillGradientColor) => onChange({ chartFillGradientColor })}
              />
              <Label
                name={`${t("chart_settings_opacity")} · ${Math.round(values.chartFillGradientOpacity * 100)}%`}
              >
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={5}
                  max={100}
                  step={5}
                  value={Math.round(values.chartFillGradientOpacity * 100)}
                  onChange={(event) =>
                    onChange({
                      chartFillGradientOpacity: Number(event.target.value) / 100,
                    })
                  }
                />
              </Label>
            </div>
          </div>
          <div className={styles.colorFieldWithToggleRow}>
            <Label name={t("chart_settings_line_fill_mode")}>
              <DialogSelect
                value={values.chartLineFillMode}
                options={props.lineFillModeOptions}
                onChange={(value) =>
                  onChange({ chartLineFillMode: value as ChartLineFillMode })
                }
                ariaLabel={t("chart_settings_line_fill_mode")}
              />
            </Label>
            <VisibilityToggle
              active={values.chartLineFillVisible}
              label={
                values.chartLineFillVisible
                  ? t("chart_settings_hide_area_under_line")
                  : t("chart_settings_show_area_under_line")
              }
              onChange={(chartLineFillVisible) => onChange({ chartLineFillVisible })}
            />
          </div>
        </div>
        <ColorField
          label={t("chart_settings_candle_up")}
          value={values.candleUpColor}
          onChange={(candleUpColor) => onChange({ candleUpColor })}
        />
        <ColorField
          label={t("chart_settings_candle_down")}
          value={values.candleDownColor}
          onChange={(candleDownColor) => onChange({ candleDownColor })}
        />
        <ColorField
          label={t("chart_settings_up_stroke")}
          value={values.candleUpStrokeColor}
          onChange={(candleUpStrokeColor) => onChange({ candleUpStrokeColor })}
        />
        <ColorField
          label={t("chart_settings_down_stroke")}
          value={values.candleDownStrokeColor}
          onChange={(candleDownStrokeColor) => onChange({ candleDownStrokeColor })}
        />
      </div>
    </>
  );
};
