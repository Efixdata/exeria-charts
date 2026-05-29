import * as React from "react";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "styled-components";
import {
  DialogBody,
  DialogContainer,
  DialogHeader,
  DialogHeaderActions,
  DialogHeaderTitle,
  Label,
  TextButton,
  TextInput,
} from "ui";
import { Eye, EyeSlash, Lock, LockOpen, X } from "phosphor-react";
import type { ChartDrawingEditConfig, ChartDrawingEditPatch } from "@efixdata/exeria-chart";
import { Icon } from "ui/src/Icon";
import type { NullableChartInstance } from "../../../chartTypes";
import { Remove } from "../../../img/icons";
import { ColorField } from "../ChartSettings/ColorField";
import { LineStyleSelect } from "../Indicators/LineStyleSelect";
import { NumberInput } from "../Indicators/NumberInput";
import {
  getPlotterLineStyleDash,
  getPlotterLineStyleId,
} from "../../../utils/plotterLineStyles";
import { DialogPrimaryButton } from "../ChartSettings/DialogPrimaryButton";
import { dialogFitBodyStyle, dialogFitLayoutStyle } from "../ChartSettings/dialogLayout";
import { useChartTranslate } from "../../../hooks/useChartTranslate";
import { getChartSettingsCssVars } from "../../../utils/dialogThemeVars";
import tabStyles from "../../dialog/dialogTabs.module.css";
import layoutStyles from "../../dialog/dialogLayout.module.css";
import styles from "../ChartSettings/chartSettings.module.css";

interface DrawingSettingsDialogProps {
  chart: NullableChartInstance;
  objectId: string | number;
  onClose: () => void;
}

type ChartWithDrawingActions = NullableChartInstance & {
  removeChartDrawing?: (objectId: string | number) => void;
};

const IconToggle = (props: {
  active: boolean;
  label: string;
  onChange: (next: boolean) => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
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
    {props.active ? props.activeIcon : props.inactiveIcon}
  </button>
);

const IconActionButton = (props: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    aria-label={props.label}
    title={props.label}
    onClick={props.onClick}
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
    {props.children}
  </button>
);

const toNumber = (value: string | number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const DrawingSettingsDialog = (props: DrawingSettingsDialogProps) => {
  const chart = props.chart as ChartWithDrawingActions;
  const themeContext = useContext(ThemeContext);
  const dialogCssVars = getChartSettingsCssVars(themeContext);
  const t = useChartTranslate(chart);
  const [settings, setSettings] = useState<ChartDrawingEditConfig | null>(null);
  const [textDraft, setTextDraft] = useState("");

  useEffect(() => {
    if (!chart?.getDrawingEditConfig) {
      setSettings(null);
      return;
    }

    setSettings(chart.getDrawingEditConfig(props.objectId));
  }, [chart, props.objectId]);

  useEffect(() => {
    if (settings?.supportsText) {
      setTextDraft(settings.text ?? "");
    }
  }, [props.objectId, settings?.supportsText]);

  const applyPatch = (patch: ChartDrawingEditPatch) => {
    if (!chart?.applyDrawingEditSettings || !settings) {
      return;
    }

    chart.applyDrawingEditSettings(props.objectId, patch);
    setSettings(chart.getDrawingEditConfig?.(props.objectId) ?? { ...settings, ...patch });
  };

  const formatMoney = (value: number) => {
    const sign = value >= 0 ? "+" : "−";
    return `${sign}$${Math.abs(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleDelete = () => {
    chart.removeChartDrawing?.(props.objectId);
    props.onClose();
  };

  const handleConfirm = () => {
    if (settings?.supportsText) {
      const nextText = textDraft.trim();
      if (nextText.length > 0) {
        applyPatch({ text: nextText });
      }
    }
    props.onClose();
  };

  if (!settings) {
    return (
      <DialogContainer style={{ ...dialogCssVars, width: 360, maxWidth: "92vw" }}>
        <DialogHeader>
          <DialogHeaderTitle>{t("drawing_settings_title", "Drawing")}</DialogHeaderTitle>
          <DialogHeaderActions>
            <TextButton onClick={props.onClose} ariaLabel={t("dialog_close", "Close")}>
              <X size={18} weight="regular" aria-hidden />
            </TextButton>
          </DialogHeaderActions>
        </DialogHeader>
        <DialogBody>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
            {t("drawing_settings_uneditable", "This drawing can no longer be edited.")}
          </p>
        </DialogBody>
      </DialogContainer>
    );
  }

  const lineStyleId = getPlotterLineStyleId(settings.dash);
  const opacityPercent = Math.round(settings.opacity * 100);
  const backgroundOpacityPercent = Math.round(settings.backgroundOpacity * 100);

  return (
    <DialogContainer
      style={{ ...dialogCssVars, ...dialogFitLayoutStyle, width: 400, maxWidth: "92vw" }}
    >
      <DialogHeader>
        <DialogHeaderTitle>{settings.label}</DialogHeaderTitle>
        <DialogHeaderActions>
          <IconActionButton label={t("drawing_settings_delete", "Delete drawing")} onClick={handleDelete}>
            <Icon themeContext="toolbar">
              <Remove />
            </Icon>
          </IconActionButton>
          <TextButton onClick={props.onClose} ariaLabel={t("dialog_close", "Close")}>
            <X size={18} weight="regular" aria-hidden />
          </TextButton>
        </DialogHeaderActions>
      </DialogHeader>

      <DialogBody style={dialogFitBodyStyle}>
        <div className={layoutStyles.scrollArea}>
          {settings.supportsText ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{t("drawing_settings_label_section", "Label")}</h3>
              </div>
              <div className={styles.sectionBody}>
                <Label name={t("drawing_settings_text", "Text")}>
                  <TextInput
                    value={textDraft}
                    onChange={(event) => setTextDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" || event.key === "Delete") {
                        event.stopPropagation();
                      }
                    }}
                  />
                </Label>
                <Label name={t("drawing_settings_font_size", "Font size")}>
                  <NumberInput
                    value={settings.fontSize}
                    min={8}
                    max={48}
                    step={1}
                    integer
                    allowEmpty={false}
                    onChange={(fontSize) => {
                      const parsed = toNumber(fontSize);
                      if (parsed != null) {
                        applyPatch({
                          fontSize: Math.min(48, Math.max(8, Math.round(parsed))),
                        });
                      }
                    }}
                  />
                </Label>
              </div>
            </section>
          ) : null}

          {settings.supportsPosition ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  {t("drawing_settings_position_section", "Position")}
                </h3>
                <p className={styles.sectionHint}>
                  {t("drawing_settings_position_hint", "Entry, stop loss and take profit levels")}
                </p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>
                      {t("drawing_settings_direction", "Direction")}
                    </span>
                    <span className={styles.toggleHint}>
                      {settings.direction === "SHORT"
                        ? t(
                            "drawing_settings_direction_short_hint",
                            "Short profits when price falls",
                          )
                        : t(
                            "drawing_settings_direction_long_hint",
                            "Long profits when price rises",
                          )}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={`${tabStyles.tab} ${settings.direction === "LONG" ? tabStyles.tabActive : ""}`}
                      onClick={() => applyPatch({ direction: "LONG" })}
                    >
                      {t("drawing_settings_long", "Long")}
                    </button>
                    <button
                      type="button"
                      className={`${tabStyles.tab} ${settings.direction === "SHORT" ? tabStyles.tabActive : ""}`}
                      onClick={() => applyPatch({ direction: "SHORT" })}
                    >
                      {t("drawing_settings_short", "Short")}
                    </button>
                  </div>
                </div>
                <Label name={t("drawing_settings_take_profit", "Take profit")}>
                  <NumberInput
                    value={settings.targetPrice}
                    step={0.01}
                    allowEmpty={false}
                    onChange={(value) => {
                      const parsed = toNumber(value);
                      if (parsed != null) {
                        applyPatch({ targetPrice: parsed });
                      }
                    }}
                  />
                </Label>
                <Label name={t("drawing_settings_entry", "Entry")}>
                  <NumberInput
                    value={settings.entryPrice}
                    step={0.01}
                    allowEmpty={false}
                    onChange={(value) => {
                      const parsed = toNumber(value);
                      if (parsed != null) {
                        applyPatch({ entryPrice: parsed });
                      }
                    }}
                  />
                </Label>
                <Label name={t("drawing_settings_stop_loss", "Stop loss")}>
                  <NumberInput
                    value={settings.stopPrice}
                    step={0.01}
                    allowEmpty={false}
                    onChange={(value) => {
                      const parsed = toNumber(value);
                      if (parsed != null) {
                        applyPatch({ stopPrice: parsed });
                      }
                    }}
                  />
                </Label>
                <ColorField
                  label={t("drawing_settings_profit_zone", "Profit zone")}
                  value={settings.profitColor}
                  onChange={(profitColor) => applyPatch({ profitColor })}
                />
                <ColorField
                  label={t("drawing_settings_loss_zone", "Loss zone")}
                  value={settings.lossColor}
                  onChange={(lossColor) => applyPatch({ lossColor })}
                />
              </div>
            </section>
          ) : null}

          {settings.supportsPosition ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{t("drawing_settings_pnl_section", "P&L")}</h3>
                <p className={styles.sectionHint}>
                  {t(
                    "drawing_settings_pnl_hint",
                    "Position size from risk; projected balance at take profit and stop loss",
                  )}
                </p>
              </div>
              <div className={styles.sectionBody}>
                <Label name={t("drawing_settings_account_size", "Account size")}>
                  <NumberInput
                    value={settings.accountSize}
                    min={1}
                    step={100}
                    allowEmpty={false}
                    onChange={(value) => {
                      const parsed = toNumber(value);
                      if (parsed != null) {
                        applyPatch({ accountSize: parsed });
                      }
                    }}
                  />
                </Label>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>
                      {t("drawing_settings_risk_sizing", "Risk sizing")}
                    </span>
                    <span className={styles.toggleHint}>
                      {t(
                        "drawing_settings_risk_sizing_hint",
                        "Fixed amount or percent of account",
                      )}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={`${tabStyles.tab} ${settings.riskMode === "AMOUNT" ? tabStyles.tabActive : ""}`}
                      onClick={() => applyPatch({ riskMode: "AMOUNT" })}
                    >
                      {t("drawing_settings_amount", "Amount")}
                    </button>
                    <button
                      type="button"
                      className={`${tabStyles.tab} ${settings.riskMode === "PERCENT" ? tabStyles.tabActive : ""}`}
                      onClick={() => applyPatch({ riskMode: "PERCENT" })}
                    >
                      {t("drawing_settings_percent", "Percent")}
                    </button>
                  </div>
                </div>
                {settings.riskMode === "PERCENT" ? (
                  <Label name={t("drawing_settings_risk_percent", "Risk per trade (%)")}>
                    <NumberInput
                      value={settings.riskPercent}
                      min={0.01}
                      max={100}
                      step={0.1}
                      allowEmpty={false}
                      onChange={(value) => {
                        const parsed = toNumber(value);
                        if (parsed != null) {
                          applyPatch({ riskPercent: parsed });
                        }
                      }}
                    />
                  </Label>
                ) : (
                  <Label name={t("drawing_settings_risk_amount", "Risk per trade ($)")}>
                    <NumberInput
                      value={settings.riskAmount}
                      min={1}
                      step={10}
                      allowEmpty={false}
                      onChange={(value) => {
                        const parsed = toNumber(value);
                        if (parsed != null) {
                          applyPatch({ riskAmount: parsed });
                        }
                      }}
                    />
                  </Label>
                )}
                <Label name={t("drawing_settings_position_size", "Position size (qty)")}>
                  <NumberInput
                    value={settings.quantity}
                    min={0}
                    step={0.01}
                    allowEmpty={false}
                    onChange={(value) => {
                      const parsed = toNumber(value);
                      if (parsed != null) {
                        applyPatch({ quantity: parsed });
                      }
                    }}
                  />
                </Label>
                <p className={styles.sectionHint} style={{ margin: 0 }}>
                  {t(
                    "drawing_settings_qty_recalc_hint",
                    "Qty is recalculated from risk and entry–stop distance when levels change.",
                  )}
                </p>
                <div className={styles.pnlTable}>
                  <div className={styles.pnlTableHeader}>
                    <span>{t("drawing_settings_pnl_summary", "P&L summary")}</span>
                    <span>{t("drawing_settings_pnl_value", "Value")}</span>
                  </div>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>
                      {t("drawing_settings_profit_at_target", "Profit at target")}
                    </span>
                    <span
                      className={`${styles.pnlValue} ${
                        settings.profitAtTarget > 0 ? styles.pnlValueProfit : styles.pnlValueMuted
                      }`}
                    >
                      {formatMoney(settings.profitAtTarget)}
                    </span>
                  </div>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>
                      {t("drawing_settings_pnl_at_stop", "P&L at stop")}
                    </span>
                    <span
                      className={`${styles.pnlValue} ${
                        settings.pnlAtStop > 0
                          ? styles.pnlValueProfit
                          : settings.pnlAtStop < 0
                            ? styles.pnlValueLoss
                            : styles.pnlValueMuted
                      }`}
                    >
                      {formatMoney(settings.pnlAtStop)}
                    </span>
                  </div>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>
                      {t("drawing_settings_balance_tp", "Balance if TP hit")}
                    </span>
                    <span className={styles.pnlValue}>
                      ${settings.balanceAtTarget.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>
                      {t("drawing_settings_balance_sl", "Balance if SL hit")}
                    </span>
                    <span className={styles.pnlValue}>
                      ${settings.balanceAtStop.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {settings.riskRewardRatio != null ? (
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>
                        {t("drawing_settings_risk_reward", "Risk / reward")}
                      </span>
                      <span className={styles.pnlValue}>
                        1 : {settings.riskRewardRatio.toFixed(2)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                {t("drawing_settings_appearance", "Appearance")}
              </h3>
              <p className={styles.sectionHint}>
                {settings.supportsPosition
                  ? t(
                      "drawing_settings_appearance_border_hint",
                      "Border color and stroke",
                    )
                  : settings.supportsColor
                    ? t("drawing_settings_appearance_line_hint", "Line color and stroke")
                    : t("drawing_settings_appearance_stroke_hint", "Line stroke")}
              </p>
            </div>
            <div className={styles.sectionBody}>
              {settings.supportsColor ? (
                <ColorField
                  label={t("drawing_settings_color", "Color")}
                  value={settings.color}
                  onChange={(color) => applyPatch({ color })}
                />
              ) : null}
              <Label name={t("drawing_settings_line_style", "Line style")}>
                <LineStyleSelect
                  value={lineStyleId}
                  lineColor={settings.supportsColor ? settings.color : "#7F9DCC"}
                  onChange={(styleId) => applyPatch({ dash: getPlotterLineStyleDash(styleId) })}
                  getOptionLabel={(style) => style.defaultLabel}
                  ariaLabel={t("drawing_settings_line_style", "Line style")}
                />
              </Label>
              <Label name={t("drawing_settings_line_width", "Line width")}>
                <NumberInput
                  value={settings.width}
                  min={1}
                  max={8}
                  step={1}
                  onChange={(width) => {
                    const parsed = toNumber(width);
                    if (parsed != null) {
                      applyPatch({ width: parsed });
                    }
                  }}
                />
              </Label>
              <Label name={t("drawing_settings_opacity", "Opacity")}>
                <NumberInput
                  value={opacityPercent}
                  min={10}
                  max={100}
                  step={5}
                  onChange={(opacity) => {
                    const parsed = toNumber(opacity);
                    if (parsed != null) {
                      applyPatch({ opacity: parsed / 100 });
                    }
                  }}
                />
              </Label>
            </div>
          </section>

          {settings.supportsBackground && settings.fillVisible ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  {t("drawing_settings_background", "Background")}
                </h3>
                <p className={styles.sectionHint}>
                  {t(
                    "drawing_settings_background_hint",
                    "Closed area between the first and last anchor points",
                  )}
                </p>
              </div>
              <div className={styles.sectionBody}>
                <ColorField
                  label={t("drawing_settings_background_color", "Background color")}
                  value={settings.backgroundColor}
                  onChange={(backgroundColor) => applyPatch({ backgroundColor })}
                />
                <Label name={t("drawing_settings_background_opacity", "Background opacity")}>
                  <NumberInput
                    value={backgroundOpacityPercent}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(opacity) => {
                      const parsed = toNumber(opacity);
                      if (parsed != null) {
                        applyPatch({ backgroundOpacity: parsed / 100 });
                      }
                    }}
                  />
                </Label>
              </div>
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                {t("drawing_settings_visibility_lock", "Visibility & lock")}
              </h3>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>
                    {t("drawing_settings_show_on_chart", "Show on chart")}
                  </span>
                  <span className={styles.toggleHint}>
                    {t("drawing_settings_show_hint", "Hide without deleting the drawing")}
                  </span>
                </div>
                <IconToggle
                  active={settings.visible}
                  label={
                    settings.visible
                      ? t("drawing_settings_hide_drawing", "Hide drawing")
                      : t("drawing_settings_show_drawing", "Show drawing")
                  }
                  onChange={(visible) => applyPatch({ visible })}
                  activeIcon={<Eye size={18} weight="regular" />}
                  inactiveIcon={<EyeSlash size={18} weight="regular" />}
                />
              </div>
              {settings.supportsFill ? (
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>
                      {settings.supportsBackground
                        ? t("drawing_settings_background_fill", "Background fill")
                        : t("drawing_settings_fill_area", "Fill area")}
                    </span>
                    <span className={styles.toggleHint}>
                      {settings.supportsBackground
                        ? t(
                            "drawing_settings_fill_hint_brush",
                            "Fill the closed area inside the brush stroke",
                          )
                        : t(
                            "drawing_settings_fill_hint_shape",
                            "Shaded region inside the shape",
                          )}
                    </span>
                  </div>
                  <IconToggle
                    active={settings.fillVisible}
                    label={
                      settings.fillVisible
                        ? t("drawing_settings_hide_fill", "Hide fill")
                        : t("drawing_settings_show_fill", "Show fill")
                    }
                    onChange={(fillVisible) => applyPatch({ fillVisible })}
                    activeIcon={<Eye size={18} weight="regular" />}
                    inactiveIcon={<EyeSlash size={18} weight="regular" />}
                  />
                </div>
              ) : null}
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>
                    {t("drawing_settings_lock_position", "Lock position")}
                  </span>
                  <span className={styles.toggleHint}>
                    {t(
                      "drawing_settings_lock_position_hint",
                      "Prevent moving or resizing on the chart",
                    )}
                  </span>
                </div>
                <IconToggle
                  active={settings.locked}
                  label={
                    settings.locked
                      ? t("drawing_settings_unlock_drawing", "Unlock drawing")
                      : t("drawing_settings_lock_drawing", "Lock drawing")
                  }
                  onChange={(locked) => applyPatch({ locked })}
                  activeIcon={<Lock size={18} weight="regular" />}
                  inactiveIcon={<LockOpen size={18} weight="regular" />}
                />
              </div>
            </div>
          </section>
        </div>
      </DialogBody>

      <div className={layoutStyles.dialogPrimaryFooter}>
        <DialogPrimaryButton onClick={handleConfirm}>
          {t("drawing_settings_done", "Done")}
        </DialogPrimaryButton>
      </div>
    </DialogContainer>
  );
};
