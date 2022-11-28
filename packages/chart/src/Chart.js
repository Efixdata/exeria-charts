import rendererSettings from "./rendererSettings";
import ChartRenderer from "./Renderer";
import model from "./model";
import FUSION from "./fusion";
import instrumentsSeries from "./instrumentsSeries";
import InteractionsController from "./InteractionsController";
import LIB from "./utils/chartingCommons";
import WEBRCP from "./WebRCP";
import ObjectsManager from "./ObjectsManager";
import SubscriptionManager from "./SubscriptionManager";

export default class Chart {
  containerId;
  ctx;
  octx;
  canvas;
  container;
  renderer;
  initialized;
  instrument;
  objectsManager;
  subscriptionManager;

  constructor(options) {
    if (typeof window == undefined) return;
    this.config = {
      mouseWheelZoomEnabled: true,
      multiInstrumentChart: true,
      storageDisabled: true,
    };

    this.model = model;
    // this.model.instrumentsSeries = instrumentsSeries;
    // this.model.mainSeries = instrumentsSeries[0].seriesId;

    this.container = options.container;
    this.config = { ...this.config, ...options.config };
    this.model = { ...model, ...options.model };
    this.setInstrument(options.instrument);
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
    this.octx = this.overlay.getContext("2d");

    this.topLayer = document.createElement("div");
    this.topLayer.style.position = "absolute";
    this.topLayer.style.inset = "0 0 0 0";

    this.container.append(this.canvas, this.overlay, this.topLayer);

    this.objectOnlyOnOverlay = false;
    this.renderer = new ChartRenderer(rendererSettings, this.ctx, this);
    this.objectsManager = new ObjectsManager(this);
    this.subscriptionManager = new SubscriptionManager(this);

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

    this.addScript("VOLUME");

    this.fit();
    this.renderer.render(
      this.ctx,
      this.model,
      this.fusion,
      false,
      this.objectOnlyOnOverlay
    );

    const onSizeChange = () => {
      this.fit();
      this.renderer.render(
        this.ctx,
        this.model,
        this.fusion,
        false,
        this.objectOnlyOnOverlay
      );
    };

    new ResizeObserver(onSizeChange).observe(this.container);
    this.initialized = true;
  }

  async recalculateScripts({ rerender = true } = {}) {
    try {
      this.fusion.fullSynchronization();
      this.fusion.configureScripts();
      await this.fusion.initAll();
      this.fusion.calculateAll();
  
      if (rerender) this.rerender();
    } catch (error) {
      console.warn(error);
    }
  }

  rerender() {
    if (!this.initialized) return;

    this.fit();
    this.renderOverlay();
    this.render(this.objectOnlyOnOverlay);
  }

  render(objectOnlyOnOverlay) {

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
      const heightPx = this.canvasHeight + "px"
      
      this.canvas.width = widthWithRatio;
      this.canvas.height = heightWithRatio;
      this.canvas.style.width = widthPx;
      this.canvas.style.height = heightPx;
      this.canvas.getContext("2d").scale(ratio, ratio);

      this.overlay.width = widthWithRatio;
      this.overlay.height = heightWithRatio;
      this.overlay.style.width = widthPx;
      this.overlay.style.height = heightPx;
      this.overlay.getContext("2d").scale(ratio, ratio);

      // this.model['axisGrid'] = this.mainAxisGrid;
      this.model["_width"] = this.canvasWidth;
      this.model["_height"] = this.canvasHeight;

      this.model["_timeAxisWidth"] = this.model._width - this.renderer.getPriceRenderingOptions().valueAxisWidth;
      this.model["_leftIndex"] = this.renderer.getPointIndex(0, this.model);
      this.model["_rightIndex"] = this.renderer.getPointIndex(this.model._timeAxisWidth, this.model);

      this.model["_midOffset"] = parseInt(this.model.periodWidth / 2);

      let panel = null;
      let offset = 0;

      this.interactor.hideEmptyPanels();
      this.interactor.basisToHeights();

      for (var i = 0; i < this.model.panels.length; i++) {
        panel = this.model.panels[i];
        if (this.model.panels[i]._visible) {
          offset += this.fitPanel(panel, i, offset);
        }
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

    if (panel.objects.length > 0) {
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

        if (this.model.autoScale == false) continue;

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

  chartStructureChanged(mode) {
    // if(mode == 'empty')
    // 	WEBRCP.triggerQueueEvent('WEBRCP_ACTIVE_CHART_CHANGED', null);
    // else
    // 	WEBRCP.triggerQueueEvent('WEBRCP_ACTIVE_CHART_CHANGED', this.inspector);
  }

  updateToolsOptions(config) {}

  renderOverlay() {

    if (this.canvasWidth == 0 || this.canvasHeight == 0) {
      return; //chart not visible
    }

    if (!this.isChartEmpty()) {
      this.interactor.clearOverlay();

      this.renderer.renderOverlay(this.octx, this.model, this.fusion);

      if (this.interactor.currentMode.renderOverlay)
        this.interactor.currentMode.renderOverlay(this.octx);

      this.renderer.postRenderOverlay(
        this.octx,
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

  async setMainSeriesData(data, interval) {
    if (!this.fusion) return;

    const mainSeries = this.fusion.getMainSeries();
    if (interval) {
      mainSeries.interval = interval;
      this.model.interval = interval;
    }
    mainSeries.data = data;

    this.renderer.calculatePriceRenderingOptions(mainSeries.data, this.model, mainSeries.instrument.precision);

    try {
      await this.recalculateScripts({ rerender: false });
      this.moveToEnd({ rerender: false });
      this.rerender();
    } catch (error) {
      console.error(error);
    }
    finally {
      setTimeout(() => {
        this.emitEvent({
          topic: 'VALUE_AXIS_WIDTH_CHANGE',
          data: this.renderer.getPriceRenderingOptions().valueAxisWidth
        });

        this.emitEvent({
          topic: 'INTERVAL_CHANGE',
          data: interval
        });
      }, 0);
    }
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
    window.cancelAnimationFrame(this.currentAnimationFrame);
		var self = this;

		this.currentAnimationFrame = window.requestAnimationFrame(function () {
			self.render();
		});
  }

  setAutoScale(autoScale) {
    this.model.autoScale = autoScale;
  }

  addScript(scriptKey) {
		if (scriptKey === "VOLUME") {
			const config = {
				id: null,
				inputs: {
					CLOSE: this.fusion.getMainSeries().seriesId + ":v"
				},
				key: "VOLUME",
				pane: 0,
				userName: "VOLUME",
				visible: true
			};

			this.onScriptEditorApply(config);
		}
	}

  async onScriptEditorApply(config){
		var proto = FUSION.getScript(config.key);

		if(config.id){
			await this.fusion.modifyScript(config);

		}else{
			await this.fusion.addScript(config);

			var pane=this.interactor.getMainPanel();
			if(config.pane){
				if(config.pane=='new'){
					pane = this.addPanelToModel();
					config.pane = pane.id;
					if(proto.centerZero && proto.centerZero==true)
						pane.centerZero = true;
					else
						pane.centerZero = false;
				}else{
					for(var i=0 ; i < this.model.panels.length; i++){
						if(this.model.panels[i].id==config.pane){
							pane = this.model.panels[i];
							break;
						}
					}
				}
			}


			for (var i=0; i<proto.plotters.length; i++) {

				let plotter = JSON.parse(JSON.stringify(proto.plotters[i]));
				plotter['id']=FUSION.uniqueId();
				var link = plotter.dataLink;
				plotter.dataLink = config.outputs[link];
				plotter.reference = config.reference;
				plotter.hidden = !config.visible && proto.permHide;
				pane.objects.push(plotter);
			}
		}

		var s = config;
    const seriesManager = this.fusion.getSeriesManager();
		for (var key in s.outputs) {
			if(seriesManager[s.outputs[key]])
				seriesManager[s.outputs[key]].userName = s.userName;

			for(var pi in this.model.panels){
				for(var oi in this.model.panels[pi].objects){
					var o = this.model.panels[pi].objects[oi];
					if(o.dataLink && o.dataLink == s.outputs[key])
							o.hidden = s.visible==true && !s.permHide ? false : true;
				}
			}
		}

		await this.rerender();
		// this.onResize();
		// if(this.options.controller)
		// 	this.options.controller.chartStructureChanged();
	}

  addPanelToModel () {

		var panel = {
				valueAxisMode: "lin",
				hGrid: true,
				vGrid: true,
				basis: 25,
				vMax: 100,
				vMin: 0,
				precision: options?.instrument?.precision || 4,
				centerZero: false,
				zeroLine: {color: WEBRCP.utils.colorManager.getColor("chartZeroColor"), width: 1, dash: [3, 3]},
				objects: []
		}
		panel.id = LIB.getUniqueId();

		//make room
		var sub = parseInt(25/this.model.panels.length);
		for (var i=0; i<this.model.panels.length; i++){
			if(this.model.panels[i].basis > sub)
				this.model.panels[i].basis-=sub;

			if(this.model.panels[i].basis <0 )
				this.model.panels[i].basis = 25;
		}
		this.model.panels.push(panel);
		return panel;
	}

  moveToEnd({ rerender = true } = {}) {
    if (!this.isChartEmpty()) {
      this.doMoveToEnd = (this.canvasWidth == 0);

      const dataLength = this.fusion.getMainSeries().data.length;
      const valueAxisWidth = this.renderer.getPriceRenderingOptions().valueAxisWidth;

      let vpl = (this.model.periodWidth * dataLength) - (this.canvasWidth - valueAxisWidth) + this.model.endMargin;

      if (vpl < 0) { vpl = 0; }

      this.model.viewportLeft = vpl;

      if (rerender) this.rerender();
    }
	}

  setInstrument(instrument) {
    if (!instrument) return;

    this.model.instrumentsSeries[0].instrument = { ...this.model.instrumentsSeries[0].instrument, ...instrument };
    this.instrument = instrument;
    
    if (instrument.symbol)
      this.model.instrumentsSeries[0].title = instrument.symbol;

    if (instrument.precision)
      this.model.panels[0].precision = instrument.precision;

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
		this.interactor.currentMode.onCancel();
	}

	onDrawingDone() {
    // TODO: fire subscription for
		// this.setActiveTool();
    console.log(this.interactor.model);
	}

  getValueAxisWidth() {
    return this.renderer.getPriceRenderingOptions().valueAxisWidth;
  }

  getCurrency() {
    // console.log("asd", this.fusion.getMainSeries());
    return this.instrument.currency;
  }

  getValueAxisMode() {
    return this.model.panels[0].valueAxisMode;
  }

  setValueAxisMode (mode){
    if (mode === '%') mode = "perc";
    if (this.model.panels[0].valueAxisMode == mode) return;

		if (mode === 'perc') {
      this.model.panels[0].valueAxisMode =  "perc";
    }
			
		else if (mode === 'lin') {
      this.model.panels[0].valueAxisMode =  "lin";
    }
			
		else if (mode === 'log') {
      this.model.panels[0].valueAxisMode =  "log";
    }
    
    this.setAutoScale(true);
    this.rerender();
		// this.refreshTools();
	}

  getAutoScale() {
    return this.model.autoScale;
  }

  setAutoScale (autoScale){
    if (this.model.autoScale == autoScale) return;

		this.model.autoScale = autoScale;
		this.rerender();

    this.emitEvent({
      topic: "AUTOSCALE",
      data: {
        autoScale: autoScale
      }
    });

		// this.refreshTools();
	}

  onDelete(objectId) {
    if (!objectId) return;

    this.objectsManager.detachObject(objectId);
    this.rerender();
  }

  setCursor(mode) {
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

  subscribe(topic, callback) {
    // TOPICS: AUTOSCALE, CURSOR_CHANGE, VALUE_AXIS_WIDTH_CHANGE
    this.subscriptionManager.subscribe(topic, callback);
  }

  emitEvent(event) {
    // event = {
    //   topic: '',
    //   data: any
    // }

    this.subscriptionManager.onEvent(event);
  }

  setMainDrawMode(mode) {
    // mode: OHLC, Bars, Line, Histogram, Line and Histogram
    this.onDrawModeSelected({
      type: mode,
      object: 'main@link',
			selected: false
    })
  }

  onDrawModeSelected(data) {
		var object 		= data.object;
		var drawMode 	= data.type;
		var selected 	= data.selected;

		if (object === 'main@link' || (object && object.id === 'main@link')) {
			var objects = this.model.panels[0].objects;
			var mainInstrumentSeries = this.model.instrumentsSeries[0];
			var length = objects.length,
			i = 0;

			for (var i; i < length; i++) {
				if (objects[i].dataLink === mainInstrumentSeries.seriesId) {
					var object = objects[i];
					break;
				}
			}
		}

		object.renderAs = drawMode;

		if (selected) {
			var mode = (drawMode === 'OHLC' || drawMode === 'Bars')? 'candles' : 'series';
			this.updateToolsOptions({mode: mode, object: object});
		}

		this.rerender();
	}

  onDownload(watermark) {
		var link = document.createElement('a');

    this.ctx.save();
		this.ctx.fillStyle = WEBRCP.utils.colorManager.getColor('primaryTextColor');
		this.ctx.font = WEBRCP.utils.colorManager.getFont("title");
		var title = this.instrument.name + "_" + this.model.interval.symbol;
		this.ctx.fillText(title, this.canvas.width / 2 - this.ctx.measureText(title).width / 2, 60);
    this.ctx.restore();

    if (!watermark) {
      link.href = this.canvas.toDataURL();
			link.download = title + "_" + Date.now() + ".png";
			link.click();
			this.render();
    } else {
      var image = new Image();
      image.src = watermark;
      image.onload = function() {
        image.width = 160;
        image.height = 44;
        this.ctx.drawImage(image, 30, this.canvas.height - image.height - 40, image.width, image.height);
        link.href = this.canvas.toDataURL();
        link.download = title + "_" + Date.now() + ".png";
        link.click();
        this.render();
      }.bind(this);
    }
	}

  getInterval() {
    return this.model.interval;
  }
}
