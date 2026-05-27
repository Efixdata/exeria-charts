import * as React from "react";
import { useEffect, useState } from "react";
import { DialogBody, DialogContainer, DialogHeader, Label, TextButton, TextInput } from "ui";
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
  const [settings, setSettings] = useState<ChartDrawingEditConfig | null>(null);

  useEffect(() => {
    if (!chart?.getDrawingEditConfig) {
      setSettings(null);
      return;
    }

    setSettings(chart.getDrawingEditConfig(props.objectId));
  }, [chart, props.objectId]);

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

  if (!settings) {
    return (
      <DialogContainer style={{ width: 360, maxWidth: "92vw" }}>
        <DialogHeader>
          <span>Drawing</span>
          <TextButton onClick={props.onClose} style={{ marginLeft: "auto" }}>
            <X size={18} weight="regular" />
          </TextButton>
        </DialogHeader>
        <DialogBody>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>This drawing can no longer be edited.</p>
        </DialogBody>
      </DialogContainer>
    );
  }

  const lineStyleId = getPlotterLineStyleId(settings.dash);
  const opacityPercent = Math.round(settings.opacity * 100);

  return (
    <DialogContainer
      style={{ ...dialogFitLayoutStyle, width: 400, maxWidth: "92vw" }}
    >
      <DialogHeader>
        <span>{settings.label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <IconActionButton label="Delete drawing" onClick={handleDelete}>
            <Icon themeContext="toolbar">
              <Remove />
            </Icon>
          </IconActionButton>
          <TextButton onClick={props.onClose}>
            <X size={18} weight="regular" />
          </TextButton>
        </div>
      </DialogHeader>

      <DialogBody style={dialogFitBodyStyle}>
        <div className={styles.scrollArea}>
          {settings.supportsText ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Label</h3>
              </div>
              <div className={styles.sectionBody}>
                <Label name="Text">
                  <TextInput
                    value={settings.text}
                    onChange={(event) => applyPatch({ text: event.target.value })}
                  />
                </Label>
                <Label name="Font size">
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
                <h3 className={styles.sectionTitle}>Position</h3>
                <p className={styles.sectionHint}>Entry, stop loss and take profit levels</p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>Direction</span>
                    <span className={styles.toggleHint}>Long profits when price rises</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={`${styles.layersTab} ${settings.direction === "LONG" ? styles.layersTabActive : ""}`}
                      onClick={() => applyPatch({ direction: "LONG" })}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      className={`${styles.layersTab} ${settings.direction === "SHORT" ? styles.layersTabActive : ""}`}
                      onClick={() => applyPatch({ direction: "SHORT" })}
                    >
                      Short
                    </button>
                  </div>
                </div>
                <Label name="Take profit">
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
                <Label name="Entry">
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
                <Label name="Stop loss">
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
                  label="Profit zone"
                  value={settings.profitColor}
                  onChange={(profitColor) => applyPatch({ profitColor })}
                />
                <ColorField
                  label="Loss zone"
                  value={settings.lossColor}
                  onChange={(lossColor) => applyPatch({ lossColor })}
                />
              </div>
            </section>
          ) : null}

          {settings.supportsPosition ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>P&amp;L</h3>
                <p className={styles.sectionHint}>
                  Position size from risk; projected balance at take profit and stop loss
                </p>
              </div>
              <div className={styles.sectionBody}>
                <Label name="Account size">
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
                    <span className={styles.toggleLabel}>Risk sizing</span>
                    <span className={styles.toggleHint}>Fixed amount or percent of account</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={`${styles.layersTab} ${settings.riskMode === "AMOUNT" ? styles.layersTabActive : ""}`}
                      onClick={() => applyPatch({ riskMode: "AMOUNT" })}
                    >
                      Amount
                    </button>
                    <button
                      type="button"
                      className={`${styles.layersTab} ${settings.riskMode === "PERCENT" ? styles.layersTabActive : ""}`}
                      onClick={() => applyPatch({ riskMode: "PERCENT" })}
                    >
                      Percent
                    </button>
                  </div>
                </div>
                {settings.riskMode === "PERCENT" ? (
                  <Label name="Risk per trade (%)">
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
                  <Label name="Risk per trade ($)">
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
                <Label name="Position size (qty)">
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
                  Qty is recalculated from risk and entry–stop distance when levels change.
                </p>
                <div className={styles.pnlTable}>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>Profit at target</span>
                    <span
                      className={`${styles.pnlValue} ${
                        settings.profitAtTarget > 0 ? styles.pnlValueProfit : styles.pnlValueMuted
                      }`}
                    >
                      {formatMoney(settings.profitAtTarget)}
                    </span>
                  </div>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>P&L at stop</span>
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
                    <span className={styles.pnlLabel}>Balance if TP hit</span>
                    <span className={styles.pnlValue}>
                      ${settings.balanceAtTarget.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.pnlRow}>
                    <span className={styles.pnlLabel}>Balance if SL hit</span>
                    <span className={styles.pnlValue}>
                      ${settings.balanceAtStop.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {settings.riskRewardRatio != null ? (
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Risk / reward</span>
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
              <h3 className={styles.sectionTitle}>Appearance</h3>
              <p className={styles.sectionHint}>
                {settings.supportsPosition ? "Border color and stroke" : "Line color and stroke"}
              </p>
            </div>
            <div className={styles.sectionBody}>
              <ColorField
                label="Color"
                value={settings.color}
                onChange={(color) => applyPatch({ color })}
              />
              <Label name="Line style">
                <LineStyleSelect
                  value={lineStyleId}
                  lineColor={settings.color}
                  onChange={(styleId) => applyPatch({ dash: getPlotterLineStyleDash(styleId) })}
                  getOptionLabel={(style) => style.defaultLabel}
                  ariaLabel="Line style"
                />
              </Label>
              <Label name="Line width">
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
              <Label name="Opacity">
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Visibility & lock</h3>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>Show on chart</span>
                  <span className={styles.toggleHint}>Hide without deleting the drawing</span>
                </div>
                <IconToggle
                  active={settings.visible}
                  label={settings.visible ? "Hide drawing" : "Show drawing"}
                  onChange={(visible) => applyPatch({ visible })}
                  activeIcon={<Eye size={18} weight="regular" />}
                  inactiveIcon={<EyeSlash size={18} weight="regular" />}
                />
              </div>
              {settings.supportsFill ? (
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>Fill area</span>
                    <span className={styles.toggleHint}>Shaded region inside the shape</span>
                  </div>
                  <IconToggle
                    active={settings.fillVisible}
                    label={settings.fillVisible ? "Hide fill" : "Show fill"}
                    onChange={(fillVisible) => applyPatch({ fillVisible })}
                    activeIcon={<Eye size={18} weight="regular" />}
                    inactiveIcon={<EyeSlash size={18} weight="regular" />}
                  />
                </div>
              ) : null}
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>Lock position</span>
                  <span className={styles.toggleHint}>Prevent moving or resizing on the chart</span>
                </div>
                <IconToggle
                  active={settings.locked}
                  label={settings.locked ? "Unlock drawing" : "Lock drawing"}
                  onChange={(locked) => applyPatch({ locked })}
                  activeIcon={<Lock size={18} weight="regular" />}
                  inactiveIcon={<LockOpen size={18} weight="regular" />}
                />
              </div>
            </div>
          </section>
        </div>
      </DialogBody>

      <div className={styles.dialogPrimaryFooter}>
        <DialogPrimaryButton onClick={props.onClose}>Done</DialogPrimaryButton>
      </div>
    </DialogContainer>
  );
};
