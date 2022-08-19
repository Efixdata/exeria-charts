import rendererSettings from "./rendererSettings";
import ChartRenderer from "./Renderer";
import model from "./model2";
import theme from "./theme";
import FUSION from "./fusion";
import instrumentsSeries from "./instrumentsSeries";
import data from "./data";
import InteractionsController from "./InteractionsController";
import LIB from "./utils/chartingCommons";

export default class Chart {
  containerId;
  ctx;
  canvas;
  container;
  renderer;
  initialized;

  constructor(options) {
    if (typeof window == undefined) return;
    this.config = {
      mouseWheelZoomEnabled: true,
      multiInstrumentChart: true,
      storageDisabled: true,
    };

    this.model = model;
    this.model.instrumentsSeries = instrumentsSeries;
    this.model.mainSeries = instrumentsSeries[0].seriesId;

    this.container = options.container;
    this.config = { ...this.config, ...options.config };
    this.model = { ...model, ...options.model };
  }

  init() {
    if (!document) return;
    if (this.initialized) return;

    this.canvas = document.createElement("canvas");
    this.overlay = document.createElement("canvas");
    this.container.style.position = "relative";
    this.overlay.style.position = "absolute";
    this.overlay.style.inset = "0 0 0 0";
    this.ctx = this.canvas.getContext("2d");

    this.topLayer = document.createElement("div");
    this.topLayer.style.position = "absolute";
    this.topLayer.style.inset = "0 0 0 0";

    this.container.append(this.canvas, this.overlay, this.topLayer);

    this.objectOnlyOnOverlay = false;
    this.renderer = new ChartRenderer(rendererSettings);

    this.fusion = new FUSION.builder().setModel(this.model).build();

    this.interactor = new InteractionsController(
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

    this.fit();
    this.renderer.render(
      this.ctx,
      this.model,
      theme,
      this.fusion,
      false,
      this.objectOnlyOnOverlay
    );

    const onSizeChange = () => {
      this.fit();
      this.renderer.render(
        this.ctx,
        this.model,
        theme,
        this.fusion,
        false,
        this.objectOnlyOnOverlay
      );
    };

    new ResizeObserver(onSizeChange).observe(this.container);
    this.initialized = true;
  }

  async recalculateScripts() {
    try {
      this.fusion.fullSynchronization();
      this.fusion.configureScripts();
      await this.fusion.initAll();
      this.fusion.calculateAll();
  
      this.rerender();
    } catch (error) {
      console.warn(error);
    }
  }

  rerender() {
    this.fit();
    this.renderOverlay();
    this.render(this.objectOnlyOnOverlay);
  }

  render(objectOnlyOnOverlay) {
    var ctx = this.canvas.getContext("2d");

    if (this.canvasWidth == 0 || this.canvasHeight == 0) {
      return; //chart not visibled
    }
    // TODO: handle invisible wrapper
    // else if(this.options.controller && this.options.controller.wrapper) {
    // 	if (this.options.controller.wrapper.element[0].style.display=='none') {return;}
    // }

    if (!this.isChartEmpty()) {
      this.renderer.render(
        this.ctx,
        this.model,
        theme,
        this.fusion,
        false,
        objectOnlyOnOverlay
      );
    } else this.renderEmpty();

    // if (this.options.loadableHistory) {
    // 	if (this.model._leftIndex < 40)
    // 		this.loadHistoryButton.addClass('visible').removeClass('invisible');
    // 	else
    // 		this.loadHistoryButton.addClass('invisible').removeClass('visible');
    // }

    // this.thumbnail = this.canvas.toDataURL();
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

  isChartEmpty() {
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
      var self = this;
      var r = self.renderer;

      const boundingRect = this.container.getBoundingClientRect();
      this.canvasWidth = boundingRect.width;
      this.canvasHeight = boundingRect.height;
      this.canvas.width = this.canvasWidth;
      this.canvas.height = this.canvasHeight;
      this.overlay.width = this.canvasWidth;
      this.overlay.height = this.canvasHeight;

      // this.model['axisGrid'] = this.mainAxisGrid;
      this.model["_width"] = this.canvasWidth;
      this.model["_height"] = this.canvasHeight;

      this.model["_timeAxisWidth"] =
        this.model._width - this.model.valueAxisWidth;
      this.model["_leftIndex"] = this.renderer.getPointIndex(0, this.model);
      this.model["_rightIndex"] = this.renderer.getPointIndex(
        this.model._timeAxisWidth,
        this.model
      );

      this.model["_midOffset"] = parseInt(this.model.periodWidth / 2);

      var panel = null;
      var offset = 0;

      this.interactor.hideEmptyPanels();
      this.interactor.basisToHeights();

      for (var i = 0; i < this.model.panels.length; i++) {
        panel = this.model.panels[i];
        if (this.model.panels[i]._visible)
          offset += this.fitPanel(panel, i, offset);
      }
    }
  }

  fitAndRepaint() {
    window.cancelAnimationFrame(this.currentAnimationFrame);

    var self = this;

    this.currentAnimationFrame = window.requestAnimationFrame(function () {
      self.fit();
      self.render();
      self.renderOverlay();
    });
  }

  fitPanel(panel, index, offset) {
    if (
      !this.valueConverter ||
      this.valueConverter.mode !== panel.valueAxisMode
    )
      this.valueConverter = new LIB.ValueConverter(panel.valueAxisMode);

    var _minValueHeight = 20;
    var panelsHeight = this.canvasHeight - this.model.timeAxisHeight;
    var extremesOffset = 0;
    var extremesMargin = 0;

    panel["_index"] = index;
    panel["_width"] = this.canvasWidth;
    //panel['_height'] = parseInt ((panel.basis * panelsHeight)/100);
    panel["_offset"] = offset;

    if (index == this.model.panels.length - 1) {
      panel._height =
        this.model._height - this.model.timeAxisHeight - panel._offset;
    }

    if (this.model.autoScale == true && panel.objects.length > 0) {
      var extremes = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };

      for (var i = 0; i < panel.objects.length; i++) {
        if (panel.objects[i]["hidden"] && panel.objects[i]["hidden"] == true)
          continue;

        if (!this.fusion.getMainSeries() || !this.fusion.getMainSeries().data) {
          log.trace(
            "Update extreme on object ommited: main series not loaded yet!",
            panel.objects[i]
          );
          continue;
        }
        var ext = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };
        this.renderer.objects[panel.objects[i].type].updateExtremes(
          panel.objects[i],
          ext,
          this.model,
          this.fusion.getSeriesManager(),
          panel,
          this.renderer
        );

        var fV = LIB.getReferenceValue(
          panel.objects[i],
          this.model,
          this.fusion.getSeriesManager()
        );

        if (
          Math.abs(ext.min) < Number.MAX_VALUE &&
          Math.abs(ext.max) < Number.MAX_VALUE
        ) {
          ext.max = this.valueConverter.realToAxis(ext.max, fV);
          ext.min = this.valueConverter.realToAxis(ext.min, fV);
          if (ext.max > extremes.max) extremes.max = ext.max;
          if (ext.min < extremes.min) extremes.min = ext.min;
        }
      }

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

    return panel["_height"];
  }

  chartStructureChanged(mode) {
    // if(mode == 'empty')
    // 	WEBRCP.triggerQueueEvent('WEBRCP_ACTIVE_CHART_CHANGED', null);
    // else
    // 	WEBRCP.triggerQueueEvent('WEBRCP_ACTIVE_CHART_CHANGED', this.inspector);
  }

  updateToolsOptions(config) {}

  renderOverlay() {
    var octx = this.overlay.getContext("2d");

    if (this.canvasWidth == 0 || this.canvasHeight == 0) {
      return; //chart not visible
    }

    if (!this.isChartEmpty()) {
      this.interactor.clearOverlay();

      this.renderer.renderOverlay(octx, this.model, this.fusion);

      if (this.interactor.currentMode.renderOverlay)
        this.interactor.currentMode.renderOverlay(octx);

      this.renderer.postRenderOverlay(
        octx,
        this.model,
        this.fusion.getSeriesManager()
      );
    }
  }

  calculateAll() {
    if (this.fusion) {
      this.fusion.initAll();
      this.fusion.calculateAll();
    }
  }

  doFrame(callback) {
    var self = this;

    window.cancelAnimationFrame(this.currentAnimationFrame);
    this.currentAnimationFrame = window.requestAnimationFrame(function () {
      callback.call(self);
    });
  }

  setMainSeriesData(data) {
    if (!this.fusion) return;
    const mainSeries = this.fusion.getMainSeries();
    mainSeries.data = data;
    try {
      this.recalculateScripts();
    } catch (_) {}
  }

  appendMainSeriesData(data) {
    if (!this.fusion) return;
    const mainSeries = this.fusion.getMainSeries();
    mainSeries.data = mainSeries.data.concat(data);

    try {
      this.recalculateScripts();
    } catch (_) {}
  }

  appendTick(tick) {
    const newCandleAdded = LIB.getOHLCSeriesWrapper(
      this.fusion.getMainSeries()
    ).update(tick);

    try {
      // TODO: short synchronization instead of full
      this.recalculateScripts();
    } catch (_) {}

    return newCandleAdded;
  }

  prependMainSeriesData(data) {
    // this.model.instrumentsSeries[0].data = data.append(this.model.instrumentsSeries[0].data);
    // this.calculateAll();
    // this.rerender();
  }

  onCrosshair() {
	var v = false;
		if (this.interactor.currentMode.symbol == 'CROSSHAIR') {
			this.interactor.setMode('DEFAULT');
			v = false;
		}
		else {
			this.interactor.setMode('CROSSHAIR');
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
    // window.cancelAnimationFrame(this.currentAnimationFrame);
		// var self = this;

		// this.currentAnimationFrame = window.requestAnimationFrame(function () {
		// 	if (!self.isChartEmpty()) {
		// 		self.renderNotEmpty();
		// 	}else{
		// 		self.renderEmpty();
		// 	}
		// });
  }
}
