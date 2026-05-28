import rendererSettings from "./rendererSettings";
import ChartRenderer from "./Renderer";
import model from "./model";
import FUSION from "./fusion";
import InteractionsController from "./InteractionsController";
import LIB from "./utils/chartingCommons";
import WEBRCP from "./WebRCP";
import { runWithChartLocale } from "./chartLocaleRuntime";
import ObjectsManager from "./ObjectsManager";
import SubscriptionManager from "./SubscriptionManager";
import ToolDrawer from "./ToolDrawer";
import {
  applyChartAppearanceSettings,
  applyChartVolumeSettings,
  exportChartSettingsTemplate,
  getChartAppearanceSettings,
  getChartDrawingSettings,
  getChartIndicatorSettings,
  getChartFunctionSettings,
  getChartStrategySettings,
  getChartVolumeSettings,
  importChartSettingsTemplate,
  removeChartDrawing,
  removeChartFunction,
  removeChartIndicator,
  removeChartStrategy,
  setChartDrawingVisibility,
  setChartFunctionPriceTagVisibility,
  setChartFunctionVisibility,
  setChartIndicatorPriceTagVisibility,
  setChartIndicatorVisibility,
  setChartStrategyVisibility,
} from "./chartSettings";
import {
  applyDrawingEditSettings,
  getDrawingEditConfig,
  type ChartDrawingEditConfig,
  type ChartDrawingEditPatch,
} from "./drawingEdit";
import {
  getAllDrawingsLocked,
  setAllDrawingsLocked,
} from "./drawingWorkflow";
import type {
  ChartAppearanceSettings,
  ChartDrawingSettingsItem,
  ChartFunctionSettingsItem,
  ChartIndicatorSettingsItem,
  ChartSettingsTemplate,
  ChartStrategySettingsItem,
  ChartVolumeSettings,
} from "./chartSettings";
import type {
  ChartConfig,
  ChartEventPayloads,
  ChartOptions,
  ChartTheme,
  DrawMode,
  Instrument,
  Interval,
  ScriptDefinition,
  ValueAxisMode,
} from "./types";
import type {
  ChartEventEnvelope,
  ChartMarginInfo,
  ChartRecalculateOptions,
  CoreChartController,
  CoreChartModel,
  CoreChartPanel,
} from "./internal-types/chart";
import type { CoreFusionRuntime } from "./internal-types/fusion";
import type {
  CoreInteractor,
  CoreInteractorConstructor,
  InteractorChartHost,
} from "./internal-types/interactor";
import type { ChartRuntimeObject } from "./internal-types/objects";
import type {
  CoreRenderer,
  CoreRendererConstructor,
  ValueConverterLike,
} from "./internal-types/renderer";
import type {
  RuntimeScriptConfig,
  RuntimeScriptDefinition,
  RuntimeScriptInput,
} from "./internal-types/scripts";
import type { OhlcvCandle, TickLike } from "./internal-types/series";
import type { UnknownFn } from "./internal-types/shared";
import {
  DEFAULT_LOCALE_ID,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocaleId,
  type LocaleId,
} from "./locale";
import { createLocaleMessages, type ChartLocaleMessages } from "./locale/messages";
import { createCatalogTranslator } from "./locale/catalogTranslator";

export default class Chart implements CoreChartController {
  [key: string]: any;

  containerId?: string;
  ctx!: CanvasRenderingContext2D;
  octx!: CanvasRenderingContext2D;
  canvas!: HTMLCanvasElement;
  overlay!: HTMLCanvasElement;
  topLayer!: HTMLDivElement;
  container!: HTMLElement;
  renderer!: CoreRenderer;
  initialized = false;
  instrument?: Instrument;
  objectsManager!: ObjectsManager;
  subscriptionManager!: SubscriptionManager;
  theme?: unknown;
  toolDrawer!: ToolDrawer;
  config!: ChartConfig;
  model!: CoreChartModel;
  fusion!: CoreFusionRuntime;
  interactor!: CoreInteractor;
  objectOnlyOnOverlay = false;
  canvasWidth = 0;
  canvasHeight = 0;
  currentAnimationFrame?: number;
  resizeObserver?: ResizeObserver;
  containerPositionBeforeInit = "";
  valueConverter?: ValueConverterLike;
  private chartAppearanceTheme?: ChartTheme;
  private localeId: LocaleId = DEFAULT_LOCALE_ID;
  private messageOverrides?: Record<string, unknown>;
  private localeMessages: ChartLocaleMessages = createLocaleMessages(DEFAULT_LOCALE_ID);
  private englishLocaleMessages: ChartLocaleMessages = createLocaleMessages(DEFAULT_LOCALE_ID);
  private catalogTranslator = createCatalogTranslator(
    createLocaleMessages(DEFAULT_LOCALE_ID),
    createLocaleMessages(DEFAULT_LOCALE_ID),
  );

  constructor(options: ChartOptions) {
    if (typeof window === "undefined") return;
    this.config = {
      mouseWheelZoomEnabled: true,
      multiInstrumentChart: true,
      storageDisabled: true,
    };

    this.model = model as CoreChartModel;

    this.container = options.container;
    this.config = { ...this.config, ...options.config };
    this.model = {
      ...(model as CoreChartModel),
      ...((options.model as Partial<CoreChartModel> | undefined) ?? {}),
    } as CoreChartModel;
    this.setInstrument(options.instrument);
    this.toolDrawer = new ToolDrawer(this);

    if (options.theme) {
      this.chartAppearanceTheme = options.theme as ChartTheme;
      WEBRCP.utils.colorManager.setTheme(options.theme, options?.themeVariant);
    }

    const storedLocale =
      typeof localStorage !== "undefined" ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    const initialLocale = options.locale ?? storedLocale ?? DEFAULT_LOCALE_ID;
    this.localeId = normalizeLocaleId(initialLocale);
    this.messageOverrides = options.messages as Record<string, unknown> | undefined;
    this.rebuildLocaleMessages();
    this.syncContainerLocale();
  }

  private syncContainerLocale(): void {
    if (!this.container) {
      return;
    }

    const host = this.container as InteractorChartHost;
    const noop = () => {};

    if (!host.options) {
      host.options = {
        locale: { getMessage: () => "" },
        doClosePositionCallback: noop,
        doDeleteOrderCallback: noop,
        doModifyOrderCallback: noop,
        doAddRelatedOrder: noop,
        openAddSLWidget: noop,
        openAddTPWidget: noop,
      };
    }

    const messages = this.localeMessages;
    host.options.locale = {
      getMessage: (key: string, fallback?: string): string => {
        const translated = messages.getMessage(key, fallback ?? key);
        return typeof translated === "string" ? translated : String(fallback ?? key);
      },
    };
  }

  private rebuildLocaleMessages(): void {
    this.localeMessages = createLocaleMessages(this.localeId, this.messageOverrides);
    this.englishLocaleMessages = createLocaleMessages("en-US");
    this.catalogTranslator = createCatalogTranslator(
      this.localeMessages,
      this.englishLocaleMessages,
    );
    this.syncContainerLocale();
  }

  private persistLocalePreference(): void {
    if (typeof localStorage === "undefined") {
      return;
    }

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, this.localeId);
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }

  init() {
    if (typeof document === "undefined") return;
    if (this.initialized) return;

    this.canvas = document.createElement("canvas");
    this.overlay = document.createElement("canvas");
    this.containerPositionBeforeInit = this.container.style.position;
    this.container.style.position = "relative";
    this.overlay.style.position = "absolute";
    this.overlay.style.inset = "0 0 0 0";
    const ctx = this.canvas.getContext("2d");
    const octx = this.overlay.getContext("2d");
    if (!ctx || !octx) return;
    this.ctx = ctx;
    this.octx = octx;

    this.topLayer = document.createElement("div");
    this.topLayer.style.position = "absolute";
    this.topLayer.style.inset = "0 0 0 0";

    this.container.append(this.canvas, this.overlay, this.topLayer);

    this.objectOnlyOnOverlay = false;
    this.renderer = new (ChartRenderer as unknown as CoreRendererConstructor)(
      rendererSettings,
      this.ctx,
      this
    );
    this.objectsManager = new ObjectsManager(this);
    this.subscriptionManager = new SubscriptionManager(this);

    const FusionBuilder = FUSION.builder;
    this.fusion = new FusionBuilder().setModel(this.model).build();

    this.interactor = new (InteractionsController as unknown as CoreInteractorConstructor)(
      this.container,
      this.canvas,
      this.overlay,
      this.model,
      this.renderer,
      this.topLayer,
      this.config,
      this.fusion,
      this
    );

    this.addScript("VOLUME");

    this.fit();
    this.renderer.render(this.ctx, this.model, this.fusion, false, this.objectOnlyOnOverlay);

    const onSizeChange = () => {
      this.fit();
      this.renderer.render(this.ctx, this.model, this.fusion, false, this.objectOnlyOnOverlay);
    };

    this.resizeObserver = new ResizeObserver(onSizeChange);
    this.resizeObserver.observe(this.container);
    this.initialized = true;
  }

  destroy() {
    if (typeof window === "undefined") return;

    this.currentAnimationFrame !== undefined &&
      window.cancelAnimationFrame(this.currentAnimationFrame);
    this.currentAnimationFrame = undefined;

    if (this.interactor?.currentAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.interactor.currentAnimationFrame);
    }

    if (this.interactor?.swipe?.hook) {
      clearInterval(this.interactor.swipe.hook);
      this.interactor.swipe.hook = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    this.interactor?.currentMode?.onCancel?.();
    this.interactor?.offDOMEvents?.();
    this.subscriptionManager?.clear?.();

    this.topLayer?.remove();
    this.overlay?.remove();
    this.canvas?.remove();

    if (this.container) {
      this.container.style.position = this.containerPositionBeforeInit;
    }

    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.objectOnlyOnOverlay = false;
    this.valueConverter = undefined;
    this.initialized = false;
  }

  async recalculateScripts({
    rerender = true,
    shortSynchronization = false,
  }: ChartRecalculateOptions = {}) {
    try {
      if (shortSynchronization) {
        this.fusion.shortSynchronization();
      } else {
        this.fusion.fullSynchronization();
        this.fusion.configureScripts();
        await this.fusion.initAll();
      }

      this.fusion.calculateAll();

      if (rerender) this.rerender();
    } catch (error) {
      console.warn(error);
    }
  }

  rerender() {
    if (!this.initialized) return;

    this.fit();

    this.render(this.objectOnlyOnOverlay);
    this.renderOverlay();
  }

  render(objectOnlyOnOverlay?: ChartRuntimeObject | boolean | null) {
    if (this.canvasWidth == 0 || this.canvasHeight == 0) {
      return; //chart not visibled
    }

    runWithChartLocale(this, () => {
      if (!this.isChartEmpty()) {
        this.renderer.render(this.ctx, this.model, this.fusion, false, objectOnlyOnOverlay);
      } else {
        this.renderEmpty();
      }
    });

    // this.thumbnail = this.canvas.toDataURL();
  }

  renderEmpty() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.octx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  saveInstance() {
    // TODO: save instance
    // if (this.content){
    // 	//this.interactor.pushIndexes();
    // 	var modelCopy = JSON.parse(JSON.stringify(this.content.newChart('getModel')));
    // 	modelCopy.positions.list = [];
    // 	modelCopy.orders.list = [];
    // 	this.wrapper.getStorage()['model'] = modelCopy;
    // 	this.wrapper.saveInstance();
    // }
  }

  isChartEmpty(_chart?: unknown) {
    void _chart;
    // TODO: check if chart is not empty
    if (this.model.mainSeries) return false;

    return true;
  }

  fit() {
    if (
      this.fusion.getMainSeries() &&
      this.fusion.getMainSeries().data &&
      this.fusion.getMainSeries().data.length > 0
    ) {
      let ratio = 1;

      if (window) {
        ratio = window.devicePixelRatio;
      }

      const boundingRect = this.container.getBoundingClientRect();

      this.canvasWidth = boundingRect.width;
      this.canvasHeight = boundingRect.height;
      const widthWithRatio = this.canvasWidth * ratio;
      const widthPx = this.canvasWidth + "px";
      const heightWithRatio = this.canvasHeight * ratio;
      const heightPx = this.canvasHeight + "px";

      this.canvas.width = widthWithRatio;
      this.canvas.height = heightWithRatio;
      this.canvas.style.width = widthPx;
      this.canvas.style.height = heightPx;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      this.overlay.width = widthWithRatio;
      this.overlay.height = heightWithRatio;
      this.overlay.style.width = widthPx;
      this.overlay.style.height = heightPx;
      this.octx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // this.model['axisGrid'] = this.mainAxisGrid;
      this.model["_width"] = this.canvasWidth;
      this.model["_height"] = this.canvasHeight;

      this.model["_timeAxisWidth"] =
        this.model._width - this.renderer.getPriceRenderingOptions().valueAxisWidth;
      this.model["_leftIndex"] = this.renderer.getPointIndex(0, this.model);
      this.model["_rightIndex"] = this.renderer.getPointIndex(
        this.model._timeAxisWidth,
        this.model
      );

      this.model["_midOffset"] = Math.trunc(this.model.periodWidth / 2);

      let panel = null;
      let offset = 0;

      this.interactor.hideEmptyPanels();
      this.interactor.basisToHeights();

      let lastVisiblePanelIndex = -1;
      for (var panelIndex = 0; panelIndex < this.model.panels.length; panelIndex++) {
        if (this.model.panels[panelIndex]._visible) {
          lastVisiblePanelIndex = panelIndex;
        }
      }

      for (var i = 0; i < this.model.panels.length; i++) {
        panel = this.model.panels[i];
        if (this.model.panels[i]._visible) {
          offset += this.fitPanel(panel, i, offset, lastVisiblePanelIndex);
        }
      }

      if (this.fusion.isDerivedSeriesOutOfSync()) {
        const needRecalculate = this.fusion.hasDerivedSeriesLengthMismatch();
        this.fusion.resyncDerivedSeriesToMain();
        if (needRecalculate) {
          this.fusion.calculateAll();
        }
      }
    }
  }

  fitAndRepaint() {
    if (this.currentAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.currentAnimationFrame);
    }

    var self = this;

    this.currentAnimationFrame = window.requestAnimationFrame(function () {
      self.fit();
      self.render();
      self.renderOverlay();
    });
  }

  fitPanel(panel: CoreChartPanel, index: number, offset: number, lastVisiblePanelIndex = -1) {
    if (!this.valueConverter || this.valueConverter.mode !== panel.valueAxisMode)
      this.valueConverter = new LIB.ValueConverter(panel.valueAxisMode);

    var extremesOffset = 0;
    var extremesMargin = 0;

    panel["_index"] = index;
    panel["_width"] = this.canvasWidth;
    //panel['_height'] = parseInt ((panel.basis * panelsHeight)/100);
    panel["_offset"] = offset;

    const timeAxisHeight = this.model.timeAxisHeight > 0 ? this.model.timeAxisHeight : 24;
    const bottomPanelIndex =
      lastVisiblePanelIndex >= 0 ? lastVisiblePanelIndex : this.model.panels.length - 1;

    if (index === bottomPanelIndex) {
      const remainingHeight = this.model._height - timeAxisHeight - panel._offset;
      panel._height = Math.max(this.model.minPanelHeight || 24, remainingHeight);
    }

    if (panel.objects.length > 0) {
      var extremes = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };

      for (var i = 0; i < panel.objects.length; i++) {
        if (panel.objects[i]["hidden"] && panel.objects[i]["hidden"] == true) continue;

        if (!this.fusion.getMainSeries() || !this.fusion.getMainSeries().data) {
          continue;
        }
        var ext = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };
        this.renderer.objects[panel.objects[i].type]?.updateExtremes?.(
          panel.objects[i],
          ext,
          this.model,
          this.fusion.getSeriesManager(),
          panel,
          this.renderer
        );

        if (this.model.autoScale == false) continue;

        var fV = LIB.getReferenceValue(
          panel.objects[i],
          this.model,
          this.fusion.getSeriesManager()
        );

        if (Math.abs(ext.min) < Number.MAX_VALUE && Math.abs(ext.max) < Number.MAX_VALUE) {
          ext.max = this.valueConverter.realToAxis(ext.max, fV);
          ext.min = this.valueConverter.realToAxis(ext.min, fV);
          if (ext.max > extremes.max) extremes.max = ext.max;
          if (ext.min < extremes.min) extremes.min = ext.min;
        }
      }

      if (this.model.autoScale == true) {
        if (
          Math.abs(extremes.max) == Number.MAX_VALUE &&
          Math.abs(extremes.min) == Number.MAX_VALUE
        ) {
          //wtf? no extremes?
          extremes.max = 1;
          extremes.min = -1;
        }

        if (extremes.max == extremes.min) {
          extremes.max += 1;
          extremes.min -= 1;
        }

        extremesOffset = extremes.max - extremes.min;
        extremesMargin = extremesOffset * this.model.extremesMargin;

        if (panel.centerZero == true) {
          var range = Math.abs(extremes.max + extremesMargin);
          if (Math.abs(extremes.min - extremesMargin) > range)
            range = Math.abs(extremes.min - extremesMargin);
          panel.vMax = range;
          panel.vMin = -range;
        } else {
          panel.vMax = extremes.max + extremesMargin;
          panel.vMin = extremes.min - extremesMargin;
        }
      }
    }

    return panel["_height"];
  }

  chartStructureChanged(mode?: unknown) {
    void mode;
    // if(mode == 'empty')
    // 	WEBRCP.triggerQueueEvent('WEBRCP_ACTIVE_CHART_CHANGED', null);
    // else
    // 	WEBRCP.triggerQueueEvent('WEBRCP_ACTIVE_CHART_CHANGED', this.inspector);
  }

  updateToolsOptions(config: Record<string, unknown>) {
    void config;
  }

  renderOverlay() {
    if (this.canvasWidth == 0 || this.canvasHeight == 0) {
      return; //chart not visible
    }

    runWithChartLocale(this, () => {
      if (!this.isChartEmpty()) {
        this.interactor.clearOverlay();

        const selected = this.interactor.currentSelectedObject as ChartRuntimeObject | null;
        if (selected?.id) {
          selected.selected = true;
          for (const panel of this.model.panels) {
            for (const object of panel.objects) {
              if (object.id === selected.id) {
                object.selected = true;
              }
            }
          }
        }

        this.renderer.renderOverlay(this.octx, this.model, this.fusion);

        if (this.interactor.currentMode.renderOverlay)
          this.interactor.currentMode.renderOverlay(this.octx);

        this.renderer.postRenderOverlay(this.octx, this.model, this.fusion.getSeriesManager());

        if (selected?.id) {
          this.renderer.renderSelectionHandles(this.octx, this.model, this.fusion, selected);
        }
      }
    });
  }

  calculateAll() {
    if (this.fusion) {
      this.fusion.initAll();
      this.fusion.calculateAll();
    }
  }

  doFrame(callback: UnknownFn) {
    var self = this;

    if (this.currentAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.currentAnimationFrame);
    }
    this.currentAnimationFrame = window.requestAnimationFrame(function () {
      callback.call(self);
    });
  }

  async setMainSeriesData(data: OhlcvCandle[], interval?: Interval, moveToEnd = true) {
    if (!this.fusion) return;

    const mainSeries = this.fusion.getMainSeries();
    if (interval) {
      mainSeries.interval = interval;
      mainSeries.instrument.interval = interval;
      this.model.interval = interval;
    }
    mainSeries.data = data;

    this.renderer.calculatePriceRenderingOptions(
      mainSeries.data,
      this.model,
      mainSeries.instrument.precision ?? this.instrument?.precision ?? 0
    );

    try {
      await this.recalculateScripts({ rerender: false });
      if (moveToEnd) this.moveToEnd({ rerender: false });
      this.rerender();
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        this.emitEvent({
          topic: "VALUE_AXIS_WIDTH_CHANGE",
          data: this.renderer.getPriceRenderingOptions().valueAxisWidth,
        });

        if (interval) {
          this.emitEvent({
            topic: "INTERVAL_CHANGE",
            data: interval,
          });
        }
      }, 0);
    }
  }

  appendMainSeriesData(data: OhlcvCandle[]) {
    if (!this.fusion) return;
    const mainSeries = this.fusion.getMainSeries();
    mainSeries.data = mainSeries.data.concat(data);

    try {
      this.recalculateScripts();
    } catch (_) {}
  }

  appendTick(tick: TickLike, recalculate = true) {
    const newCandleAdded = LIB.getOHLCSeriesWrapper(this.fusion.getMainSeries()).update(tick);

    if (newCandleAdded) this.moveChartAfterNewCandle();

    try {
      if (recalculate) this.recalculateScripts({ shortSynchronization: true });
    } catch (_) {}

    return newCandleAdded;
  }

  appendTicks(ticks: TickLike[], recalculate = true) {
    const mainSeries = LIB.getOHLCSeriesWrapper(this.fusion.getMainSeries());
    let newCandleAdded = false;

    for (let i in ticks) {
      const tick = ticks[i];
      if (mainSeries.update(tick)) newCandleAdded = true;
    }

    if (newCandleAdded) this.moveChartAfterNewCandle();

    try {
      if (recalculate) this.recalculateScripts({ shortSynchronization: true });
    } catch (_) {}

    return newCandleAdded;
  }

  upsertCandle(candle: OhlcvCandle, recalculate = true) {
    const newCandleAdded = LIB.getOHLCSeriesWrapper(this.fusion.getMainSeries()).upsertCandle(
      candle
    );

    try {
      if (newCandleAdded) this.moveChartAfterNewCandle();
      if (recalculate) this.recalculateScripts({ shortSynchronization: true });
    } catch (_) {}

    return newCandleAdded;
  }

  moveChartAfterNewCandle() {
    const margin = this.checkMargin();
    if (margin) {
      this.moveIndexToPoint(
        margin.i,
        this.model._width - this.model.valueAxisWidth - this.model.endMargin
      );
    }
  }

  checkMargin(): ChartMarginInfo | null {
    const lastIndex =
      this.fusion.getMainSeries().data.length > 0 ? this.fusion.getMainSeries().data.length - 1 : 0;
    const lastIndexPoint = this.renderer.getIndexPoint(lastIndex, this.model);
    if (
      lastIndexPoint >= this.model._width - this.model.valueAxisWidth - this.model.endMargin &&
      lastIndexPoint < this.model._width - this.model.valueAxisWidth
    )
      return { i: lastIndex, x: lastIndexPoint };
    else return null;
  }

  moveIndexToPoint(index: number, x: number) {
    var vpl = this.model.periodWidth * index - x;
    if (vpl < 0) vpl = 0;
    this.model.viewportLeft = vpl;
  }

  prependMainSeriesData(_data: OhlcvCandle[]) {
    void _data;
    // this.model.instrumentsSeries[0].data = data.append(this.model.instrumentsSeries[0].data);
    // this.calculateAll();
    // this.rerender();
  }

  onCrosshair() {
    var v = false;
    if (this.interactor.currentMode.symbol == "CROSSHAIR") {
      this.interactor.setMode("DEFAULT");
      v = false;
    } else {
      this.interactor.setMode("CROSSHAIR");
      v = true;
    }
    this.refreshTools();
    return v;
  }

  refreshTools() {
    // if (this.layout.menuLayout === 'fixed') if (this.fixedTools) this.fixedTools.fixedChartTools('doRefresh', this);
    // 	else if (this.smartTools) this.smartTools.smartChartTools('refreshBottomTools', this);
  }

  repaint() {
    if (this.currentAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.currentAnimationFrame);
    }
    var self = this;

    this.currentAnimationFrame = window.requestAnimationFrame(function () {
      self.render();
    });
  }

  addScript(scriptKey: string): void;
  addScript(scriptKey: string, proto?: ScriptDefinition): void;
  addScript(scriptKey: string, proto?: ScriptDefinition) {
    this.onScriptEditorApply(this.createScriptConfig(scriptKey, proto));
  }

  private resolveScriptProto(scriptKey: string, proto?: ScriptDefinition): RuntimeScriptDefinition {
    const template = FUSION.getScript(scriptKey) as RuntimeScriptDefinition;
    if (!proto) {
      return template;
    }

    const protoPlotters = (proto as RuntimeScriptDefinition).plotters;
    const mergedInputs: Record<string, RuntimeScriptInput> = {};

    for (const key of Object.keys(template.inputs)) {
      const templateInput = template.inputs[key];
      const protoInput = proto.inputs?.[key] as RuntimeScriptInput | undefined;
      const protoValue = protoInput?.value;

      mergedInputs[key] = {
        ...templateInput,
        ...protoInput,
        value:
          protoValue !== undefined && protoValue !== null ? protoValue : templateInput.value,
      };
    }

    const sanitizedProto = Object.fromEntries(
      Object.entries(proto).filter(([, value]) => value !== undefined),
    ) as ScriptDefinition;

    return {
      ...template,
      ...sanitizedProto,
      inputs: mergedInputs,
      plotters: Array.isArray(protoPlotters) ? protoPlotters : template.plotters,
    };
  }

  private resolveScriptPane(
    scriptKey: string,
    resolvedProto: RuntimeScriptDefinition,
    proto?: ScriptDefinition,
  ) {
    const explicitPane = (proto as RuntimeScriptConfig | undefined)?.pane;
    if (explicitPane != null && explicitPane !== "") {
      return String(explicitPane);
    }

    const template = FUSION.getScript(scriptKey) as RuntimeScriptDefinition;
    const useNewPane = resolvedProto.newPane ?? template.newPane ?? false;

    if (useNewPane) {
      return "new";
    }

    const mainPanel = this.interactor.getMainPanel();
    return mainPanel?.id != null ? String(mainPanel.id) : "1";
  }

  private applyPlotterStyleOverrides(
    plotter: ChartRuntimeObject,
    sourcePlotters: ChartRuntimeObject[],
    sourceIndex: number,
    plotterColors?: Record<string, string>,
    plotterDashes?: Record<string, number[]>,
  ) {
    const source =
      sourcePlotters[sourceIndex] ??
      sourcePlotters.find((candidate) => candidate.dataField === plotter.dataField);

    if (typeof source?.color === "string" && source.color.length > 0) {
      plotter.color = source.color;
    }

    if (Array.isArray(source?.dash)) {
      plotter.dash = [...source.dash];
    }

    if (typeof source?.buyColor === "string" && source.buyColor.length > 0) {
      plotter.buyColor = source.buyColor;
    }

    if (typeof source?.sellColor === "string" && source.sellColor.length > 0) {
      plotter.sellColor = source.sellColor;
    }

    const fieldKey = plotter.dataField ? String(plotter.dataField) : undefined;
    if (fieldKey && plotterColors?.[fieldKey]) {
      plotter.color = plotterColors[fieldKey];
    }

    if (fieldKey && plotterDashes?.[fieldKey]) {
      plotter.dash = [...plotterDashes[fieldKey]];
    }
  }

  private updateScriptPlotterStyles(config: RuntimeScriptConfig) {
    const sourcePlotters = Array.isArray(config.plotters)
      ? (config.plotters as ChartRuntimeObject[])
      : [];
    const plotterColors = config.plotterColors as Record<string, string> | undefined;
    const plotterDashes = config.plotterDashes as Record<string, number[]> | undefined;
    const outputIds = new Set(Object.values(config.outputs || {}));
    const strategyPlotterTypes = new Set([
      "StrategyObject",
      "CandlestickPatternStrategyObject",
      "FractalsObject",
    ]);

    for (const panel of this.model.panels) {
      for (const object of panel.objects) {
        if (!object.dataLink || !outputIds.has(String(object.dataLink))) {
          continue;
        }

        const isSeriesPlotter = object.type === "SeriesObject";
        const isStrategyPlotter =
          object.type != null && strategyPlotterTypes.has(String(object.type));

        if (!isSeriesPlotter && !isStrategyPlotter) {
          continue;
        }

        const sourceIndex = sourcePlotters.findIndex(
          (candidate) => candidate.dataField === object.dataField,
        );

        this.applyPlotterStyleOverrides(
          object,
          sourcePlotters,
          sourceIndex >= 0 ? sourceIndex : 0,
          plotterColors,
          plotterDashes,
        );
      }
    }
  }

  createScriptConfig(scriptKey: string, proto?: ScriptDefinition) {
    const resolvedProto = this.resolveScriptProto(scriptKey, proto);
    const scriptCfg: RuntimeScriptConfig = {
      id: undefined,
      inputs: {},
      outputs: {},
      key: scriptKey,
      pane: this.resolveScriptPane(scriptKey, resolvedProto, proto),
      userName: scriptKey,
      visible: true,
    };

    const getDefaultSeries = (input: RuntimeScriptDefinition["inputs"][string]) => {
      for (var key in this.fusion.getSeriesManager()) {
        const series = this.fusion.getSeriesManager()[key];

        for (var i = 0; i < series.fields.length; i++) {
          if (input.properties?.def === series.fields[i]) {
            return series.seriesId + ":" + series.fields[i];
          }
        }
      }

      return undefined;
    };

    Object.keys(resolvedProto.inputs).forEach((k) => {
      const input = resolvedProto.inputs[k];

      if (input.type == "series" && !input.value) {
        scriptCfg.inputs[k] = getDefaultSeries(input);
      } else {
        scriptCfg.inputs[k] = input.value;
      }
    });

    if (Array.isArray(resolvedProto.plotters)) {
      scriptCfg.plotters = JSON.parse(JSON.stringify(resolvedProto.plotters));
    }

    const plotterColors = (proto as { plotterColors?: Record<string, string> } | undefined)
      ?.plotterColors;
    if (plotterColors) {
      scriptCfg.plotterColors = { ...plotterColors };
    }

    const plotterDashes = (proto as { plotterDashes?: Record<string, number[]> } | undefined)
      ?.plotterDashes;
    if (plotterDashes) {
      scriptCfg.plotterDashes = JSON.parse(JSON.stringify(plotterDashes));
    }

    return scriptCfg;
  }

  getChartPanels() {
    return this.model.panels.map((panel, index) => ({
      id: String(panel.id),
      label: panel.main
        ? this.translate("mainChartPanel")
        : `${this.translate("fusion_dialog_panel_selector_panel")} ${index + 1}`,
      main: panel.main === true,
    }));
  }

  private resolvePlotterColorForUi(color: unknown): string | undefined {
    if (typeof color !== "string" || color.length === 0) {
      return undefined;
    }

    if (/^#[0-9A-Fa-f]{6}$/i.test(color)) {
      return color.toUpperCase();
    }

    return WEBRCP.utils.colorManager.getColor(color, color);
  }

  getIndicatorEditConfig(scriptId: string | number): ScriptDefinition | null {
    const modelScript = this.objectsManager.getScriptModelById(scriptId) as
      | RuntimeScriptConfig
      | undefined;
    if (!modelScript?.key || modelScript.key === "VOLUME") {
      return null;
    }

    const template = FUSION.getScript(modelScript.key) as RuntimeScriptDefinition;
    if (!template || !["indicators", "functions", "strategies"].includes(String(template.type))) {
      return null;
    }

    const catalog = this.getScripts();
    const catalogEntry = catalog[modelScript.key];
    const panePlotters = LIB.getPlottersForScriptByScriptId(this.model, scriptId);
    const templatePlotters = Array.isArray(template.plotters) ? template.plotters : [];
    const plotters: ChartRuntimeObject[] = [];
    const scriptOutputs = modelScript.outputs || {};

    const findPanePlotter = (
      symbolicDataLink: string | undefined,
      dataField: string | undefined,
    ): ChartRuntimeObject | undefined => {
      const runtimeDataLink = symbolicDataLink ? scriptOutputs[symbolicDataLink] : undefined;

      if (runtimeDataLink && dataField) {
        const byLinkAndField = panePlotters.find(
          (candidate) =>
            candidate.dataLink === runtimeDataLink && candidate.dataField === dataField,
        );
        if (byLinkAndField) {
          return byLinkAndField as ChartRuntimeObject;
        }
      }

      if (dataField) {
        const byField = panePlotters.find((candidate) => candidate.dataField === dataField);
        return byField ? (byField as ChartRuntimeObject) : undefined;
      }

      if (runtimeDataLink) {
        const byLink = panePlotters.find((candidate) => candidate.dataLink === runtimeDataLink);
        return byLink ? (byLink as ChartRuntimeObject) : undefined;
      }

      return undefined;
    };

    const pushPlotterFromSources = (
      templatePlotter: ChartRuntimeObject,
      paneObject?: ChartRuntimeObject,
    ) => {
      const resolvedColor =
        this.resolvePlotterColorForUi(paneObject?.color) ??
        this.resolvePlotterColorForUi(templatePlotter.color) ??
        this.resolvePlotterColorForUi("chartLine");
      const resolvedBuyColor =
        this.resolvePlotterColorForUi(paneObject?.buyColor) ??
        this.resolvePlotterColorForUi(templatePlotter.buyColor) ??
        this.resolvePlotterColorForUi("buyColor");
      const resolvedSellColor =
        this.resolvePlotterColorForUi(paneObject?.sellColor) ??
        this.resolvePlotterColorForUi(templatePlotter.sellColor) ??
        this.resolvePlotterColorForUi("sellColor");

      plotters.push({
        ...JSON.parse(JSON.stringify(templatePlotter)),
        type: paneObject?.type ?? templatePlotter.type,
        dataLink: templatePlotter.dataLink,
        dataField: templatePlotter.dataField ?? paneObject?.dataField,
        color: resolvedColor,
        buyColor: resolvedBuyColor,
        sellColor: resolvedSellColor,
        dash: Array.isArray(paneObject?.dash)
          ? [...(paneObject?.dash as number[])]
          : Array.isArray(templatePlotter.dash)
            ? [...templatePlotter.dash]
            : [],
        width: paneObject?.width ?? templatePlotter.width,
        renderAs: paneObject?.renderAs ?? templatePlotter.renderAs,
      } as ChartRuntimeObject);
    };

    if (templatePlotters.length > 0) {
      for (const templatePlotter of templatePlotters) {
        const symbolicDataLink =
          typeof templatePlotter.dataLink === "string" ? templatePlotter.dataLink : undefined;
        const dataField =
          typeof templatePlotter.dataField === "string" ? templatePlotter.dataField : undefined;
        pushPlotterFromSources(templatePlotter, findPanePlotter(symbolicDataLink, dataField));
      }
    } else {
      for (const paneObject of panePlotters) {
        let symbolicDataLink: string | undefined;
        for (const outputKey of Object.keys(scriptOutputs)) {
          if (scriptOutputs[outputKey] === paneObject.dataLink) {
            symbolicDataLink = outputKey;
            break;
          }
        }

        pushPlotterFromSources(
          {
            type: paneObject.type,
            dataLink: symbolicDataLink,
            dataField: paneObject.dataField,
            color: paneObject.color,
            buyColor: paneObject.buyColor,
            sellColor: paneObject.sellColor,
            dash: paneObject.dash,
            width: paneObject.width,
            renderAs: paneObject.renderAs,
          } as ChartRuntimeObject,
          paneObject as ChartRuntimeObject,
        );
      }
    }

    const inputs: Record<string, RuntimeScriptInput> = {};
    for (const inputKey of Object.keys(template.inputs)) {
      const templateInput = template.inputs[inputKey];
      const modelValue = modelScript.inputs[inputKey];

      inputs[inputKey] = {
        ...JSON.parse(JSON.stringify(templateInput)),
        value:
          modelValue !== undefined && modelValue !== null ? modelValue : templateInput.value,
      };
    }

    return {
      key: modelScript.key,
      title: catalogEntry?.title || modelScript.key,
      id: scriptId,
      pane: modelScript.pane,
      inputs,
      plotters,
      outputs: template.outputs,
    } as ScriptDefinition;
  }

  updateIndicator(scriptId: string | number, proto?: ScriptDefinition) {
    const existing = this.objectsManager.getScriptModelById(scriptId) as
      | RuntimeScriptConfig
      | undefined;
    if (!existing?.key) {
      return;
    }

    const resolvedProto = this.resolveScriptProto(existing.key, proto);
    const explicitPane = (proto as RuntimeScriptConfig | undefined)?.pane;
    const config: RuntimeScriptConfig = {
      id: scriptId,
      key: existing.key,
      outputs: { ...(existing.outputs as Record<string, string>) },
      pane:
        explicitPane != null && explicitPane !== ""
          ? String(explicitPane)
          : existing.pane,
      userName: existing.userName ?? existing.key,
      visible:
        typeof (proto as { visible?: boolean } | undefined)?.visible === "boolean"
          ? Boolean((proto as { visible?: boolean }).visible)
          : existing.visible !== false,
      inputs: {},
    };

    for (const inputKey of Object.keys(resolvedProto.inputs)) {
      const input = resolvedProto.inputs[inputKey];
      const value = input.value;

      config.inputs[inputKey] =
        value !== undefined && value !== null ? value : existing.inputs[inputKey];
    }

    if (Array.isArray(resolvedProto.plotters)) {
      config.plotters = JSON.parse(JSON.stringify(resolvedProto.plotters));
    }

    const plotterColors = (proto as { plotterColors?: Record<string, string> } | undefined)
      ?.plotterColors;
    if (plotterColors) {
      config.plotterColors = { ...plotterColors };
    }

    const plotterDashes = (proto as { plotterDashes?: Record<string, number[]> } | undefined)
      ?.plotterDashes;
    if (plotterDashes) {
      config.plotterDashes = JSON.parse(JSON.stringify(plotterDashes));
    }

    void this.onScriptEditorApply(config);
  }

  private relocateScriptToPane(config: RuntimeScriptConfig, proto: RuntimeScriptDefinition) {
    if (!config.id || config.pane == null || config.pane === "") {
      return;
    }

    const plotters = LIB.getPlottersForScriptByScriptId(this.model, config.id);
    if (plotters.length === 0) {
      return;
    }

    const currentPanel = this.objectsManager.getPanelForObject(plotters[0] as ChartRuntimeObject);
    let targetPaneId = String(config.pane);

    if (targetPaneId === "new") {
      const newPanel = this.addPanelToModel();
      if (proto.centerZero === true) {
        newPanel.centerZero = true;
      } else {
        newPanel.centerZero = false;
      }
      targetPaneId = String(newPanel.id);
      config.pane = targetPaneId;
    }

    if (currentPanel?.id != null && String(currentPanel.id) === targetPaneId) {
      return;
    }

    const targetPanel = this.objectsManager.getPanelById(targetPaneId);
    if (!targetPanel) {
      return;
    }

    for (const plotter of plotters) {
      this.objectsManager.moveObjectToPanel(plotter as ChartRuntimeObject, targetPaneId);
    }

    this.objectsManager.removeEmptyPanels();
  }

  async onScriptEditorApply(config: RuntimeScriptConfig) {
    const proto = FUSION.getScript(config.key);

    if (config.id) {
      await this.fusion.modifyScript(config);
      this.relocateScriptToPane(config, proto);
      if (config.plotters || config.plotterColors || config.plotterDashes) {
        this.updateScriptPlotterStyles(config);
      }
    } else {
      await this.fusion.addScript(config);

      let pane = this.interactor.getMainPanel() as CoreChartPanel;
      if (config.pane) {
        if (config.pane == "new") {
          pane = this.addPanelToModel();
          config.pane = pane.id;
          if (proto.centerZero && proto.centerZero == true) pane.centerZero = true;
          else pane.centerZero = false;
        } else {
          for (var i = 0; i < this.model.panels.length; i++) {
            if (this.model.panels[i].id == config.pane) {
              pane = this.model.panels[i];
              break;
            }
          }
        }
      }

      const sourcePlotters = Array.isArray(config.plotters)
        ? (config.plotters as ChartRuntimeObject[])
        : [];
      const plotters =
        sourcePlotters.length > 0 ? sourcePlotters : proto.plotters ?? [];
      const plotterColors = config.plotterColors as Record<string, string> | undefined;
      const plotterDashes = config.plotterDashes as Record<string, number[]> | undefined;

      for (var i = 0; i < plotters.length; i++) {
        const plotter = JSON.parse(JSON.stringify(plotters[i])) as ChartRuntimeObject;
        this.applyPlotterStyleOverrides(
          plotter,
          sourcePlotters,
          i,
          plotterColors,
          plotterDashes,
        );
        plotter["id"] = FUSION.uniqueId();
        var link = plotter.dataLink;
        plotter.dataLink = config.outputs[link as string];
        plotter.reference = config.reference;
        plotter.hidden = !config.visible && proto.permHide;
        pane.objects.push(plotter);
      }
    }

    const s = config;
    const seriesManager = this.fusion.getSeriesManager();
    for (var key in s.outputs) {
      if (seriesManager[s.outputs[key]]) seriesManager[s.outputs[key]].userName = s.userName;

      for (var pi in this.model.panels) {
        for (var oi in this.model.panels[pi].objects) {
          var o = this.model.panels[pi].objects[oi];
          if (o.dataLink && o.dataLink == s.outputs[key])
            o.hidden = s.visible == true && !s.permHide ? false : true;
        }
      }
    }

    this.recalculateScripts();
    await this.rerender();
    // this.onResize();
    // if(this.options.controller)
    // 	this.options.controller.chartStructureChanged();
  }

  addPanelToModel(): CoreChartPanel {
    const panel = {
      id: LIB.getUniqueId(),
      valueAxisMode: "lin",
      hGrid: true,
      vGrid: true,
      basis: 25,
      vMax: 100,
      vMin: 0,
      precision: this.instrument?.precision || 4,
      centerZero: false,
      zeroLine: {
        color: WEBRCP.utils.colorManager.getColor("chartZeroColor"),
        width: 1,
        dash: [3, 3],
      },
      objects: [],
      _visible: true,
      _width: this.canvasWidth,
      _height: 0,
      _offset: 0,
    } as CoreChartPanel;

    //make room
    var sub = Math.trunc(25 / this.model.panels.length);
    for (var i = 0; i < this.model.panels.length; i++) {
      if (this.model.panels[i].basis > sub) this.model.panels[i].basis -= sub;

      if (this.model.panels[i].basis < 0) this.model.panels[i].basis = 25;
    }
    this.model.panels.push(panel);
    return panel;
  }

  moveToEnd({ rerender = true }: { rerender?: boolean } = {}) {
    if (!this.isChartEmpty()) {
      this.doMoveToEnd = this.canvasWidth == 0;

      const dataLength = this.fusion.getMainSeries().data.length;
      const valueAxisWidth = this.renderer.getPriceRenderingOptions().valueAxisWidth;

      let vpl =
        this.model.periodWidth * dataLength -
        (this.canvasWidth - valueAxisWidth) +
        this.model.endMargin;

      if (vpl < 0) {
        vpl = 0;
      }

      this.model.viewportLeft = vpl;

      if (rerender) this.rerender();
    }
  }

  moveToStamp(stamp: number) {
    if (!this.isChartEmpty()) {
      const index = this.renderer.getStampIndex(stamp, this.model, this.getSeriesManager());
      const valueAxisWidth = this.renderer.getPriceRenderingOptions().valueAxisWidth;

      let vpl =
        this.model.periodWidth * index - (this.canvasWidth - valueAxisWidth) + this.model.endMargin;

      if (vpl < 0) {
        vpl = 0;
      }

      this.model.viewportLeft = vpl;
      this.rerender();
    }
  }

  setInstrument(instrument?: Instrument) {
    if (!instrument) return;

    this.model.instrumentsSeries[0].instrument = {
      ...this.model.instrumentsSeries[0].instrument,
      ...instrument,
    };
    this.instrument = instrument;

    if (instrument.symbol) this.model.instrumentsSeries[0].title = instrument.symbol;

    if (instrument.precision) this.model.panels[0].precision = instrument.precision;

    if (!this.fusion) return;

    const mainSeries = this.fusion.getMainSeries();
    mainSeries.instrument = { ...mainSeries.instrument, ...instrument };
    mainSeries.title = instrument.symbol;
  }

  getInstrument() {
    return this.instrument;
  }

  getInteractor() {
    return this.interactor;
  }

  onCancelTool() {
    this.interactor.currentMode.onCancel?.();
  }

  onDrawingDone() {
    // TODO: fire subscription for
    // this.setActiveTool();
    // console.log(this.interactor.model);
  }

  getValueAxisWidth() {
    return this.renderer.getPriceRenderingOptions().valueAxisWidth;
  }

  getCurrency() {
    // console.log("asd", this.fusion.getMainSeries());
    return this.instrument?.currency;
  }

  getValueAxisMode(): ValueAxisMode {
    return this.model.panels[0].valueAxisMode as ValueAxisMode;
  }

  setValueAxisMode(mode: ValueAxisMode) {
    if (mode === "%") mode = "perc";
    if (this.model.panels[0].valueAxisMode == mode) return;

    if (mode === "perc") {
      this.model.panels[0].valueAxisMode = "perc";
    } else if (mode === "lin") {
      this.model.panels[0].valueAxisMode = "lin";
    } else if (mode === "log") {
      this.model.panels[0].valueAxisMode = "log";
    }

    this.setAutoScale(true);
    this.rerender();
    // this.refreshTools();
  }

  getAutoScale() {
    return this.model.autoScale;
  }

  setAutoScale(autoScale: boolean) {
    if (this.model.autoScale == autoScale) return;

    this.model.autoScale = autoScale;
    this.rerender();

    this.emitEvent({
      topic: "AUTOSCALE",
      data: {
        autoScale: autoScale,
      },
    });

    // this.refreshTools();
  }

  onDelete(objectId?: string | number) {
    if (!objectId) return;

    this.objectsManager.detachObject(objectId);
    this.rerender();
  }

  setCursor(mode: string) {
    if (this.interactor.currentMode.symbol === mode) return;

    this.interactor.setMode(mode);
    // this.refreshTools();
  }

  getScriptsManager() {
    return this.fusion.getScriptsManager();
  }

  getSeriesManager() {
    return this.fusion.getSeriesManager();
  }

  subscribe<TTopic extends keyof ChartEventPayloads>(
    topic: TTopic,
    callback: (data: ChartEventPayloads[TTopic]) => void
  ) {
    // TOPICS: AUTOSCALE, CURSOR_CHANGE, VALUE_AXIS_WIDTH_CHANGE
    this.subscriptionManager.subscribe(topic, callback);
  }

  emitEvent<TTopic extends keyof ChartEventPayloads>(event: ChartEventEnvelope<TTopic>) {
    // event = {
    //   topic: '',
    //   data: any
    // }

    this.subscriptionManager.onEvent(event);
  }

  setMainDrawMode(mode: DrawMode) {
    // mode: OHLC, Bars, Line, Histogram, Line and Histogram
    this.onDrawModeSelected({
      type: mode,
      object: "main@link",
      selected: false,
    });
  }

  onDrawModeSelected(data: {
    object?: ChartRuntimeObject | string;
    type?: DrawMode | string;
    selected?: boolean;
    [key: string]: unknown;
  }) {
    let object = data.object;
    const drawMode = data.type;
    const selected = data.selected;

    if (
      object === "main@link" ||
      (object && typeof object !== "string" && object.id === "main@link")
    ) {
      var objects = this.model.panels[0].objects;
      var mainInstrumentSeries = this.model.instrumentsSeries[0];
      var length = objects.length;

      for (let index = 0; index < length; index++) {
        if (objects[index].dataLink === mainInstrumentSeries.seriesId) {
          object = objects[index];
          break;
        }
      }
    }

    if (!object || typeof object === "string" || !drawMode) return;

    object.renderAs = drawMode;

    if (selected) {
      var mode = drawMode === "OHLC" || drawMode === "Bars" ? "candles" : "series";
      this.updateToolsOptions({ mode: mode, object: object });
    }

    this.rerender();
  }

  onDownload(watermark?: string, watermarkWidth = 0, watermarkHeight = 0) {
    var link = document.createElement("a");
    const positionY = this.canvasHeight / 2 - watermarkHeight / 2;
    const positionX = this.canvasWidth / 2 - watermarkWidth / 2;
    const title = `${this.instrument?.name ?? "chart"}_${this.model.interval?.symbol ?? ""}`;

    if (!watermark) {
      link.href = this.canvas.toDataURL();
      link.download = title + "_" + Date.now() + ".png";
      link.click();
      this.render();
    } else {
      var image = new Image();
      image.src = watermark;
      image.onload = () => {
        image.width = watermarkWidth;
        image.height = watermarkHeight;
        this.ctx.drawImage(image, positionX, positionY, watermarkWidth, watermarkHeight);
        link.href = this.canvas.toDataURL();
        link.download = title + "_" + Date.now() + ".png";
        link.click();
        this.render();
      };
    }
  }

  getInterval() {
    return this.model.interval;
  }

  private getChartSettingsHost() {
    return this as unknown as Parameters<typeof getChartAppearanceSettings>[0];
  }

  getChartAppearanceSettings(): ChartAppearanceSettings {
    return getChartAppearanceSettings(this.getChartSettingsHost(), this.chartAppearanceTheme);
  }

  applyChartAppearanceSettings(settings: ChartAppearanceSettings): void {
    this.chartAppearanceTheme = applyChartAppearanceSettings(
      this.getChartSettingsHost(),
      settings,
      this.chartAppearanceTheme,
    );
  }

  getChartIndicatorSettings(): ChartIndicatorSettingsItem[] {
    return getChartIndicatorSettings(this.getChartSettingsHost());
  }

  setChartIndicatorVisibility(scriptId: string | number, visible: boolean): void {
    setChartIndicatorVisibility(this.getChartSettingsHost(), scriptId, visible);
  }

  setChartIndicatorPriceTagVisibility(scriptId: string | number, visible: boolean): void {
    setChartIndicatorPriceTagVisibility(this.getChartSettingsHost(), scriptId, visible);
  }

  removeChartIndicator(scriptId: string | number): void {
    removeChartIndicator(this.getChartSettingsHost(), scriptId);
  }

  getChartFunctionSettings(): ChartFunctionSettingsItem[] {
    return getChartFunctionSettings(this.getChartSettingsHost());
  }

  setChartFunctionVisibility(scriptId: string | number, visible: boolean): void {
    setChartFunctionVisibility(this.getChartSettingsHost(), scriptId, visible);
  }

  setChartFunctionPriceTagVisibility(scriptId: string | number, visible: boolean): void {
    setChartFunctionPriceTagVisibility(this.getChartSettingsHost(), scriptId, visible);
  }

  removeChartFunction(scriptId: string | number): void {
    removeChartFunction(this.getChartSettingsHost(), scriptId);
  }

  getChartDrawingSettings(): ChartDrawingSettingsItem[] {
    return getChartDrawingSettings(this.getChartSettingsHost());
  }

  setChartDrawingVisibility(objectId: string | number, visible: boolean): void {
    setChartDrawingVisibility(this.getChartSettingsHost(), objectId, visible);
  }

  removeChartDrawing(objectId: string | number): void {
    removeChartDrawing(this.getChartSettingsHost(), objectId);
  }

  getDrawingEditConfig(objectId: string | number): ChartDrawingEditConfig | null {
    return getDrawingEditConfig(this.getChartSettingsHost(), objectId);
  }

  applyDrawingEditSettings(objectId: string | number, patch: ChartDrawingEditPatch): void {
    applyDrawingEditSettings(this.getChartSettingsHost(), objectId, patch);

    if (typeof patch.locked === "boolean") {
      this.emitEvent({
        topic: "DRAWINGS_LOCK_CHANGE",
        data: { allLocked: this.getAllDrawingsLocked() },
      });
    }
  }

  getChartVolumeSettings(): ChartVolumeSettings {
    return getChartVolumeSettings(this.getChartSettingsHost());
  }

  applyChartVolumeSettings(settings: ChartVolumeSettings): void {
    applyChartVolumeSettings(this.getChartSettingsHost(), settings);
  }

  getChartStrategySettings(): ChartStrategySettingsItem[] {
    return getChartStrategySettings(this.getChartSettingsHost());
  }

  setChartStrategyVisibility(scriptId: string | number, visible: boolean): void {
    setChartStrategyVisibility(this.getChartSettingsHost(), scriptId, visible);
  }

  removeChartStrategy(scriptId: string | number): void {
    removeChartStrategy(this.getChartSettingsHost(), scriptId);
  }

  exportChartSettingsTemplate(name?: string): ChartSettingsTemplate {
    return exportChartSettingsTemplate(
      this.getChartSettingsHost(),
      this.chartAppearanceTheme,
      name,
    );
  }

  importChartSettingsTemplate(template: ChartSettingsTemplate): void {
    this.chartAppearanceTheme = importChartSettingsTemplate(
      this.getChartSettingsHost(),
      template,
      this.chartAppearanceTheme,
    );
  }

  getScripts() {
    const scripts = JSON.parse(JSON.stringify(FUSION.getFreeScripts())) as Record<
      string,
      RuntimeScriptDefinition
    >;

    for (const key in scripts) {
      scripts[key] = this.catalogTranslator.translateCatalogScript(scripts[key]);
    }

    return scripts;
  }

  translate(text: string) {
    return this.localeMessages.getMessage(text, text);
  }

  translateCatalog(text: string, catalogType?: string) {
    return this.catalogTranslator.translateCatalogMessage(text, catalogType, text);
  }

  getLocaleMessages(): ChartLocaleMessages {
    return this.localeMessages;
  }

  getLocale(): string {
    return this.localeId;
  }

  setLocale(locale: string, messageOverrides?: Record<string, unknown>): void {
    this.localeId = normalizeLocaleId(locale);

    if (messageOverrides) {
      this.messageOverrides = {
        ...(this.messageOverrides ?? {}),
        ...messageOverrides,
      };
    }

    this.rebuildLocaleMessages();
    this.persistLocalePreference();
    this.emitEvent({ topic: "LOCALE_CHANGE", data: { locale: this.localeId } });
    this.rerender();
  }

  getSupportedLocales(): Array<{ id: string; label: string }> {
    return SUPPORTED_LOCALES.map(({ id, labelKey }) => ({
      id,
      label: this.translate(labelKey),
    }));
  }

  removePanelFromModel(panel: CoreChartPanel) {
    var basis = panel.basis;

    for (var i = 0; i < this.model.panels.length; i++) {
      if (panel.id === this.model.panels[i].id) {
        this.model.panels[i].objects.forEach((e) => {
          this.objectsManager.detachObject(e.id);
        });

        this.model.panels.splice(i, 1);
        break;
      }
    }

    var sub = Math.trunc(basis / this.model.panels.length);

    for (var i = 0; i < this.model.panels.length; i++) {
      this.model.panels[i].basis += sub;
    }
  }

  setObjectSelectionAllowed(isAllowed: boolean) {
    this.interactor.setObjectSelectionAllowed(isAllowed);
  }

  getDrawingMagnetEnabled(): boolean {
    return this.interactor.drawingMagnetEnabled === true;
  }

  setDrawingMagnetEnabled(enabled: boolean) {
    if (this.interactor.drawingMagnetEnabled === enabled) return;

    this.interactor.drawingMagnetEnabled = enabled;
    this.emitEvent({
      topic: "DRAWING_MAGNET_CHANGE",
      data: { enabled },
    });
  }

  getAllDrawingsLocked(): boolean {
    return getAllDrawingsLocked(this.getChartSettingsHost());
  }

  lockAllDrawings() {
    setAllDrawingsLocked(this.getChartSettingsHost(), true);
    this.emitEvent({
      topic: "DRAWINGS_LOCK_CHANGE",
      data: { allLocked: true },
    });
  }

  unlockAllDrawings() {
    setAllDrawingsLocked(this.getChartSettingsHost(), false);
    this.emitEvent({
      topic: "DRAWINGS_LOCK_CHANGE",
      data: { allLocked: false },
    });
  }
}
