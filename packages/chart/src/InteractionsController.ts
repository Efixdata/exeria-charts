import WEBRCP from "./WebRCP";
import FUSION from "./fusion";
import LIB from "./utils/chartingCommons";
import { Shape } from "./Objects2";
import { Series } from "./Objects";
import {
  createFusionUniqueId,
  hideFusionScriptDialog,
  showFusionScriptDialog,
} from "./adapters/fusionUi";
import { isSmallScreen, isTouchDevice, isTouchEnvironment, hitTolerance } from "./utils/environment";
import {
  dismissMobileContextMenu,
  openMobileChartContextMenu,
  resolvePointerClientPosition,
} from "./utils/mobileContextMenu";
import { createGestureManager, HAMMER_DIRECTIONS } from "./adapters/hammer";
import {
  createPropertiesDialogContent,
  showPropertiesDialog,
} from "./adapters/propertiesDialog";
import { renderPriceText, measurePriceTextWidth, roundAndTranslate } from "./utils/objects-lib";
import { runWithChartLocale } from "./chartLocaleRuntime";
import type { ChartConfig } from "./types";
import type { CoreChartController, CoreChartModel } from "./internal-types/chart";
import type { CoreFusionRuntime } from "./internal-types/fusion";
import type {
  CoreInteractor,
  CoreInteractorConstructor,
  CoreInteractionMode,
  InteractorChartHost,
  PointerEventLike,
} from "./internal-types/interactor";
import type { ChartRuntimeObject } from "./internal-types/objects";
import type { CoreRenderer } from "./internal-types/renderer";
import type { RuntimeScriptConfig } from "./internal-types/scripts";
import type { DialogAction, DialogActionHandle } from "./adapters/propertiesDialog";

type TooltipRenderValue = {
  label: string;
  value: unknown;
  precision?: number | null;
};

type TooltipRenderData = {
  title: string;
  date: string;
  values: TooltipRenderValue[];
  precision?: number;
};

type TooltipLayout = {
  offsetX: number;
  offsetY: number;
  offsetBottomMargin: number;
  width: number;
  widthMin: number;
  widthMax: number;
  height: number;
  lineSpacing: number;
  lineHeight: number;
  margin: number;
  valueOffset: number;
};

type TitleDescriptionPayload = {
  title?: string;
  description?: string;
  data?: string;
  thumbnail?: string;
  model?: CoreChartModel;
};

type RelatedOrderRequest = {
  price: number;
  parent: unknown;
  type?: "SL" | "TP";
  title?: "SL" | "TP";
};

type ScrollAccumulatorCallback = (
  this: CoreInteractor,
  index: number,
  dataLength: number,
  xPosition: number,
  canvasWidth: number,
  visibleIndexes: number,
  eventOffset: { offsetX: number; offsetY: number }
) => void;

type InteractionModeConstructor = new (interactor: CoreInteractor) => CoreInteractionMode;
type StageModeConstructor = new (
  interactor: CoreInteractor,
  tool: ChartRuntimeObject,
  onFinished?: () => void
) => CoreInteractionMode;

var InteractionsController: CoreInteractorConstructor = function (
  this: CoreInteractor,
  chart: InteractorChartHost,
  canvas: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  model: CoreChartModel,
  renderer: CoreRenderer,
  topLayer: HTMLDivElement,
  config: ChartConfig,
  fusion: CoreFusionRuntime,
  controller: CoreChartController
) {
  var self = this;
  this.chart = chart;
  this.currentMode = new (DefaultTool as unknown as InteractionModeConstructor)(this);
  this.topLayer = topLayer;
  this.config = config;
  this.fusion = fusion;
  this.controller = controller;

  this.currentViewportLeft = 0;
  this.initialMouseEvent = null;
  this.isMouseDown = false;
  this.isRightButton = false;

  this.allowContextMenu = true;
  this.currentHandler = -1;
  this.initialOffsets = [];

  this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  this.octx = overlay.getContext("2d") as CanvasRenderingContext2D;
  this.body = document.getElementsByTagName("body")[0] as HTMLBodyElement;

  this.currentHitObject = null;
  this.currentPanel = null;
  this.currentAnchor = null;
  this.currentSelectedObject = null;
  this.valueAxisClicked = false;
  this.currentStagingObject = null;
  this.suppressDrawingEditDoubleClick = false;
  this.model = model;
  this.renderer = renderer;
  this.isObjectSelectionAllowed = true;
  this.drawingMagnetEnabled = false;

  this.pinch = { trackedIndex: null, leftGrabbedIndex: null, rightGrabbedIndex: null };
  this.pinchFramePending = false;
  this.swipe = {
    configuration: {
      velocity: {
        multiplier: 20,
        minValue: 0.01,
        dampingFactor: 0.03,
      },
    },
    hook: null,
  };

  this.doFrame = function (callback) {
    var self = this;

    window.cancelAnimationFrame(this.currentAnimationFrame);
    this.currentAnimationFrame = window.requestAnimationFrame(function () {
      callback.call(self);
    });
  };

  function bindDomEvents() {
    self.preventContextMenu = function (evt: Event) {
      evt.preventDefault();
      return true;
    };
    self.onHammerPress = self.onContextMenu;
    self.onHammerSwipe = self.onSwipe;
    self.onBodyKeyUp = function (event: KeyboardEvent) {
      self.onKeyUp(event);
    };
    self.onBodyKeyDown = function (event: KeyboardEvent) {
      self.onKeyDown(event);
    };

    self.topLayer.addEventListener("wheel", self.triggerWheelCallback);
    self.topLayer.classList.add("context-menu-topLayer"); //this class is base to bind CONTEXT MENU

    if (isTouchDevice()) {
      self.topLayer.addEventListener("touchstart", self.onTouchEvent);
      self.topLayer.addEventListener("touchend", self.onTouchEvent);
      self.topLayer.addEventListener("touchcancel", self.onTouchEvent);

      self.hammer = createGestureManager(self.topLayer);

      self.hammer.get("press").set({ time: 500 });
      self.hammer.on("press", self.onHammerPress);

      self.hammer.on("touch", self.onTouchEvent);

      self.hammer.get("pan").set({ direction: HAMMER_DIRECTIONS.all });
      self.hammer.on("pan", self.onTouchEvent);

      self.hammer.get("pinch").set({ enable: true });
      self.hammer.on("pinch pinchstart pinchend", self.onPinch);

      self.hammer.on("swipe", self.onHammerSwipe);
      self.hammer.get("doubletap")?.set?.({ enable: true, taps: 2, interval: 320, posThreshold: 30 });
      self.hammer.on("doubletap", self.onTouchDoubleTap);
    }

    self.topLayer.addEventListener("dblclick", self.onDoubleClick);

    if (!isTouchDevice()) {
      self.topLayer.addEventListener("mousedown", self.onMouseDown);
      self.topLayer.addEventListener("mouseup", self.onMouseLeftUp);

      self.body.addEventListener("mouseup", self.onBodyMouseUp);
      self.body.addEventListener("mouseout", self.onBodyMouseOut);
      self.body.addEventListener("mousemove", self.onBodyMouseMove);

      self.topLayer.addEventListener("contextmenu", self.preventContextMenu);

      self.hammer = createGestureManager(self.topLayer);
      self.hammer.on("swipe", self.onHammerSwipe);
    }

    self.body.addEventListener("keyup", self.onBodyKeyUp);

    self.body.addEventListener("keydown", self.onBodyKeyDown);

    // $(document).keydown(function(e){
    // 	self.onKeyDown(e);
    // });
  }

  this.offDOMEvents = function () {
    self.topLayer.removeEventListener("wheel", self.triggerWheelCallback);
    self.topLayer.classList.remove("context-menu-topLayer");
    self.topLayer.removeEventListener("contextmenu", self.preventContextMenu);
    self.body.removeEventListener("keyup", self.onBodyKeyUp);
    self.body.removeEventListener("keydown", self.onBodyKeyDown);

    if (!isTouchDevice()) {
      self.topLayer.removeEventListener("mousedown", self.onMouseDown);
      self.topLayer.removeEventListener("mouseup", self.onMouseLeftUp);

      self.body.removeEventListener("mouseup", self.onBodyMouseUp);
      self.body.removeEventListener("mouseout", self.onBodyMouseOut);
      self.body.removeEventListener("mousemove", self.onBodyMouseMove);
    }

    self.topLayer.removeEventListener("dblclick", self.onDoubleClick);

    if (isTouchDevice()) {
      self.topLayer.removeEventListener("touchstart", self.onTouchEvent);
      self.topLayer.removeEventListener("touchend", self.onTouchEvent);
      self.topLayer.removeEventListener("touchcancel", self.onTouchEvent);

      self.hammer.off("press", self.onHammerPress);
      self.hammer.off("touch", self.onTouchEvent);
      self.hammer.off("pan", self.onTouchEvent);
      self.hammer.off("pinch pinchstart pinchend", self.onPinch);
      self.hammer.off("swipe", self.onHammerSwipe);
      self.hammer.off("doubletap", self.onTouchDoubleTap);
    } else if (self.hammer) {
      self.hammer.off("swipe", self.onHammerSwipe);
    }

    if (self.hammer?.destroy) {
      self.hammer.destroy();
    }
    self.hammer = null;
  };

  this.onTouchEvent = function (evt) {
    self.body.click();

    const touches = evt.changedTouches ? evt.changedTouches : evt.changedPointers;
    let touchEvent;

    if (touches.length > 0) {
      const activeTouch = touches[0];
      const clientX = activeTouch.clientX ?? activeTouch.pageX - window.scrollX;
      const clientY = activeTouch.clientY ?? activeTouch.pageY - window.scrollY;
      // identifier on ios safari has different values like -871896472
      let which = evt.changedPointers ? evt.changedPointers[0].pointerId : activeTouch.identifier;

      const rect = self.topLayer.getBoundingClientRect();
      touchEvent = {
        clientX,
        clientY,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        button: 0,
        which: which,
        isPrimary:
          activeTouch.isPrimary || activeTouch.identifier === self.initialMouseEvent?.which,
      };
    }

    switch (evt.type) {
      case "touchstart": // previously mousedown
        self.onMouseDown(touchEvent);
        break;
      case "pan": // previously mousemove
        self.onMouseMove(touchEvent, evt);
        break;
      case "touchend": // previously mouseup
        self.onMouseUp(touchEvent, evt);
        self.body.click();
        break;
      case "touchcancel": // previously mouseout
        self.onMouseOut(touchEvent);
        break;
    }

    evt.preventDefault();
  };

  this.registerObjectAsIdicator = function (o) {
    void o;
    var scriptKey = "OBJECT";
    var os = this.chart.getObjectsForIndicator();
    var panels = false;
    showFusionScriptDialog(
      { key: scriptKey, config: null },
      onApply,
      onCancel,
      this.fusion,
      panels,
      os,
      this.chart.getLocaleMessages?.() ?? WEBRCP.locale.fusion,
    );
    function onCancel() {
      hideFusionScriptDialog();
    }
    function onApply(scriptConfig: RuntimeScriptConfig) {
      chart.onScriptEditorApply(scriptConfig);
      hideFusionScriptDialog();
    }
  };

  this.unregisterObjectAsIdicator = function (o) {
    var scriptKey = "OBJECT";

    for (var i in this.model.scripts) {
      var script = this.model.scripts[i];
      if (script["key"] == scriptKey) {
        const objectInput = (script.inputs?.["OBJECT"] ?? undefined) as
          | { id?: string | number }
          | undefined;
        if (o.id == objectInput?.id && script.id !== undefined) {
          var ps = LIB.getPlottersForScriptByScriptId(this.model, script.id);
          this.chart.detachObject(ps[0].id);
          var objectRef = LIB.getObjectById(this.model, o.id);
          if (objectRef) objectRef.isIndicator = false;
        }
      }
    }
    self.controller.chartStructureChanged();
  };

  this.onPinch = function (event) {
    self.body.click();
    dismissMobileContextMenu();
    if (self.controller.isChartEmpty(self.chart)) return;
    event.preventDefault();
    if (self.currentHitObject) self.currentHitObject.isBeingDragged = false;
    self.isMouseDown = false;
    self.deselectAll();
    self.initialMouseEvent = null;
    self.startEvent = null;

    if (self.swipe.hook != null) clearInterval(self.swipe.hook);

    var rect = event.target.getBoundingClientRect();
    event.center["offsetX"] = event.center.x - rect.left;
    event.center["offsetY"] = event.center.y - rect.top;

    let startEvent, endEvent;
    if (event.pointers[0].pageX <= event.pointers[1].pageX) {
      startEvent = event.pointers[0];
      endEvent = event.pointers[1];
    } else {
      startEvent = event.pointers[1];
      endEvent = event.pointers[0];
    }

    const leftGrabbed = {
      offsetX: startEvent.pageX - rect.left,
      offsetY: startEvent.pageY - rect.top,
      pageX: startEvent.pageX,
      pageY: startEvent.pageY,
    };

    const rightGrabbed = {
      offsetX: endEvent.pageX - rect.left,
      offsetY: endEvent.pageY - rect.top,
      pageX: endEvent.pageX,
      pageY: endEvent.pageY,
    };

    if (event.type == "pinch") {
      if (self.pinchFramePending) {
        return;
      }

      self.pinchFramePending = true;
      self.controller.doFrame(() => {
        self.pinchFramePending = false;

        const minPeriodWidth = self.getMinPeriodWidth();
        const maxPeriodWidth = self.model._width / 2;

        const trackedPoint = event.center.offsetX;
        if (self.pinch.trackedIndex == null)
          self.pinch.trackedIndex = self.renderer.getPointIndex(trackedPoint, self.model);
        if (self.pinch.leftGrabbedIndex == null)
          self.pinch.leftGrabbedIndex = self.renderer.getPointIndex(
            leftGrabbed.offsetX,
            self.model
          );
        if (self.pinch.rightGrabbedIndex == null)
          self.pinch.rightGrabbedIndex = self.renderer.getPointIndex(
            rightGrabbed.offsetX,
            self.model
          );
        const leftGrabbedIndex = self.pinch.leftGrabbedIndex;
        const rightGrabbedIndex = self.pinch.rightGrabbedIndex;
        const trackedIndex = self.pinch.trackedIndex;
        if (
          leftGrabbedIndex == null ||
          rightGrabbedIndex == null ||
          trackedIndex == null
        )
          return;

        const grabbedCandlesCount = Math.max(1, rightGrabbedIndex - leftGrabbedIndex);

        const grabbedWidth = rightGrabbed.pageX - leftGrabbed.pageX;
        const newPeriodWidth = grabbedWidth / grabbedCandlesCount;

        if (newPeriodWidth >= minPeriodWidth && newPeriodWidth <= maxPeriodWidth)
          self.model.periodWidth = newPeriodWidth;
        if (newPeriodWidth < minPeriodWidth) self.model.periodWidth = minPeriodWidth;
        if (newPeriodWidth > maxPeriodWidth) self.model.periodWidth = maxPeriodWidth;

        self.moveIndexToPoint(trackedIndex, trackedPoint);

        self.controller.rerender();
      });
    }

    if (event.type == "pinchstart") {
      self.pinch.trackedIndex = null;
      self.pinch.leftGrabbedIndex = null;
      self.pinch.rightGrabbedIndex = null;
      self.pinchFramePending = false;
    }

    if (event.type == "pinchend") {
      self.deselectAll();
      self.clearOverlay();
    }
  };

  this.onSwipe = function (event) {
    self.body.click();
    if (self.swipe.hook != null) clearInterval(self.swipe.hook);

    if (self.currentHitObject) self.currentHitObject.isBeingDragged = false;
    self.isMouseDown = false;
    self.deselectAll();
    self.initialMouseEvent = null;
    self.startEvent = null;

    if (!self.currentMode.allowSwipe || self.model.periodWidth < 2) return;

    self.currentViewportLeft = self.model.viewportLeft;

    var pointer = event.pointers[0];

    var initialX = pointer.pageX;
    var velocityX = event.velocityX;
    var currentX = calculateOffset(initialX, velocityX);

    self.swipe.hook = setInterval(frame, 50);
    function frame() {
      var seriesLength = 0;
      if (
        self.model.instrumentsSeries.length > 0 &&
        self.model.instrumentsSeries[0] &&
        self.fusion.getSeriesManager()[self.model.instrumentsSeries[0].seriesId].data
      ) {
        seriesLength =
          self.fusion.getSeriesManager()[self.model.instrumentsSeries[0].seriesId].data.length;
      }

      if (
        seriesLength == 0 ||
        Math.abs(velocityX) < self.swipe.configuration.velocity.minValue ||
        self.model._leftIndex <= 0 ||
        self.model._leftIndex >= seriesLength - 2
      ) {
        if (self.swipe.hook) clearInterval(self.swipe.hook);
      } else {
        var currentOffset = currentX - initialX;
        var offset = 0;

        if (
          self.currentViewportLeft - currentOffset <= self.model.periodWidth * (seriesLength - 1) &&
          self.currentViewportLeft - currentOffset > 0
        ) {
          offset = currentOffset;
          self.model.viewportLeft = self.currentViewportLeft - offset;
        }

        recalculateVelocity();
        currentX = calculateOffset(currentX, velocityX);

        self.controller.fitAndRepaint();
      }
    }

    function calculateOffset(xPos: number, xVelocity: number) {
      return xPos + self.swipe.configuration.velocity.multiplier * xVelocity;
    }

    function recalculateVelocity() {
      velocityX *= 1.0 - self.swipe.configuration.velocity.dampingFactor;
    }
  };

  this.moveIndexToPoint = function (index, x) {
    // index - candle index, x - canvas index from left
    // TODO: model manipulation here, we should refactor it
    var vpl = this.model.periodWidth * index - x;
    if (vpl < 0) vpl = 0;
    this.model.viewportLeft = vpl;
  };

  this.onContextMenu = function (e) {
    self.body.click();
    dismissMobileContextMenu();

    if (self.controller.isChartEmpty(self.chart)) return;
    if (self.model.mode == "plain") return;
    if (self.currentStagingObject) return;

    if (!isTouchEnvironment()) {
      if (e.preventDefault) e.preventDefault();
      return;
    }

    if (e.preventDefault) e.preventDefault();

    const anchor = resolvePointerClientPosition(e, self.topLayer);
    if (!anchor) {
      return;
    }

    openMobileChartContextMenu(
      self.controller as unknown as Parameters<typeof openMobileChartContextMenu>[0],
      anchor.x,
      anchor.y,
    );
  };

  // this.buildContextMenu = function(e){
  // 	$.contextMenu('destroy', '.context-menu-topLayer');

  // 	var self = this;
  // 	var eo = this.getEventOffset(e);

  // 	var panel = this.getPanel(eo.offsetY);
  // 	if(!panel) return;

  // 	var seriesId = self.model.instrumentsSeries[0].seriesId;

  // 	const panelProps = {
  // 		panelHeight: panel._height,
  // 		minValue: panel.vMin,
  // 		maxValue: panel.vMax,
  // 		valueAxisMode: panel.valueAxisMode,fV
  // 	}

  // 	var idx = self.fusion.getSeriesManager()[seriesId].data.length-1;
  // 	var fV = LIB.getFirstAvailableValue(self.model, self.fusion.getSeriesManager()[seriesId].data, 'c');
  // 	var closeY 	= self.renderer.getYCoordinateForPrice(self.fusion.getSeriesManager()[seriesId].data[idx]['c'], panelProps) + panel._offset;
  // 	var valueY = self.renderer.getPriceForYCoordinate(eo.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,valueAxisMode:  panel.valueAxisMode, fV});

  // 	var zone = null;
  // 	if(eo.offsetY > closeY){
  // 		zone = "abovePrice";
  // 	}else if(eo.offsetY < closeY){
  // 		zone = "belowPrice";
  // 	}

  // 	function openNewOrderWidged(o){
  // 		if (self.chart.options.openNewOrderWidget) {
  // 			const instrument = self.model.instrumentsSeries[0].instrument;
  // 			const roundedPrice = WEBRCP.utils.roundPrice(valueY, instrument.priceChangeStep, instrument.precision);
  // 			// o.onCreate = createOrderFromDialog; // showing unchecked orders on chart, not supported
  // 			self.chart.options.openNewOrderWidget({
  // 				instrument: instrument,
  // 				stopPrice: roundedPrice,
  // 				limitPrice: roundedPrice
  // 			});
  // 		}
  // 	}

  // 	function onPositionMenuCallback(o){
  // 		if(o.type == 'close')
  // 			//self.doClosePosition(o.position);
  // 			self.chart.options.doClosePositionCallback(o.position.object);
  // 		else if(o.type == 'addSL'){
  // 			self.chart.options.openAddSLWidget({parent: o.position, onCreate: createOrderFromDialog});
  // 		}else if(o.type == 'addTP'){
  // 			self.chart.options.openAddTPWidget({parent: o.position, onCreate: createOrderFromDialog});
  // 		}
  // 	}

  // 	function onOrderMenuCallback(o){
  // 		if (o.type == 'deleteOrder')
  // 			self.doCloseTradeObject(o.order);

  // 		else if (o.type == 'modifyOrder'){
  // 			self.chart.options.openModifyOrderWidget(o.order.object);
  // 		}
  // 	}

  // 	function createOrderFromDialog(order, price, type) {
  // 		var getType = function(type) {
  // 			if (type === 'Buy' || type === 'Sell') {  return 'POSITION'; }
  // 			return type.toUpperCase();
  // 		}

  // 		var getTitle = function(title) {
  // 			if (type === 'tp' || type === 'sl') { return title.toUpperCase(); }
  // 			return title;
  // 		}

  // 		var orderCandidate = {
  // 			id: "empty",
  // 			price: price * 1,
  // 			instrument: order.instrument || order.object.intrument,
  // 			parentId: order.id || null,
  // 			selected: true,
  // 			modified: true,
  // 			title: getTitle(type),
  // 			type: getType(type)
  // 		}
  // 		self.model.orders.list.push(orderCandidate);
  // 	};

  // 	function getParent(order){
  // 		for(var i in self.model.positions.list){
  // 			var p = self.model.positions.list[i];
  // 			if(p.id == order.parentId) return p;
  // 		}

  // 		for(var i in self.model.orders.list){
  // 			var p = self.model.orders.list[i];
  // 			if(p.id == order.parentId) return p;
  // 		}

  // 		return null;
  // 	}

  // 	function getTpForPosition(p, model){
  // 		for(var i in model.orders.list){
  // 			if(model.orders.list[i].parentId == p.id && model.orders.list[i].type == 'TP')
  // 				return model.orders.list[i];
  // 		}
  // 		return null;
  // 	}

  // 	function getSlForPosition(p, model){
  // 		for(var i in model.orders.list){
  // 			if(model.orders.list[i].parentId == p.id && model.orders.list[i].type == 'SL')
  // 				return model.orders.list[i];
  // 		}
  // 		return null;
  // 	}

  // 	function checkIfHasIcons(items) {
  // 		for (var i in items) {
  // 			if (items[i].icon) return 'webrcp-has-icons';
  // 		}

  // 		return false;
  // 	}

  // 	var items = {};
  // 	if(!this.currentSelectedObject){
  // 		var builder = new ContextMenuBuilder();

  // 		if(self.trading==true){
  // 			builder
  // 				.addTradeMenu(self.chart, zone, openNewOrderWidged)
  // 				.addShowPositionsAndOrders(self.chart)
  // 		}

  // 		builder
  // 			.addShowGrid(self.chart, panel)
  // 			.addAutoScale(self.chart)
  // 			.addCrosshair(self.chart)
  // 			.addScaleMode(self.chart)
  // 			.addRefresh(self.chart);

  // 		if (isSmallScreen) {
  // 			builder
  // 				.addGoToHome(self.chart)
  // 				.addGoToEnd(self.chart);
  // 		}

  // 		if(self.config.multiInstrumentChart){
  // 			builder
  // 			.addSeparator()
  // 			.addNewInstrument(chart);
  // 		}

  // 		if(		self.fusion.getMainSeries().instrument.related &&
  // 				Array.isArray(self.chart.fusion.getMainSeries().instrument.related) &&
  // 				self.fusion.getMainSeries().instrument.related.length > 0 ){

  // 			builder.addRelatedInstrument(chart);
  // 		}

  // 		builder.addSeparator();

  // 		if(!self.config.storageDisabled){
  // 			builder.addExportChartMenu(self.chart);
  // 		}

  // 		builder
  // 			.addDeleteObjectsMenu(self.chart)
  // 			.addDeleteScriptsAndObjectsMenu(self.chart)
  // 			.addSeparator()
  // 			.addToolboxLayoutPosition(self.chart);

  // 		items = builder.build();

  // 	}else{

  // 		var builder = new ContextMenuBuilder();
  // 		builder
  // 		.addSelectedObjectSubMenus(self.chart)
  // 		.addPositionMenu(self.chart, onPositionMenuCallback)
  // 		.addOrdersMenu(self.chart, onOrderMenuCallback)
  // 		.addMoveToPanelMenu(self.chart, panel)
  // 		.addScriptConfigMenu(self.chart);

  // 		if(!self.config.storageDisabled){
  // 			builder.addScriptExportMenu(self.chart);
  // 		}

  // 		builder.addDeleteSelectedObjectMenu(self.chart);

  // 		builder
  // 			.addSeparator()
  // 			.addToolboxLayoutPosition(self.chart);

  // 		items = builder.build();

  // 		this.currentSelectedObject._hit = false;
  // 	}

  // 	$.contextMenu({
  // 		selector: '.context-menu-topLayer',
  // 		className: checkIfHasIcons(items),
  // 		position: (WEBRCP.platformManifest.AccountType == 'anonymous') ? function(opt,b,c) {
  // 			var offset = $('#' + Efix.options.parentId).offset();
  // 			opt.$menu.css({top: c - offset.top, left: b - offset.left})
  // 		} : undefined,
  // 		appendTo: '.chart-context-menu-layer',
  // 		trigger: 'none',
  // 		build: function($trigger, e) {
  // 			return {
  // 				callback: function(key, options) {
  // 					var m = "clicked: " + key;
  // 				},
  // 				items: items
  // 			};
  // 		},
  // 		events: {
  // 			show: function(opt) {
  // 				var $this = this;
  // 				//nope
  // 			},
  // 			hide: function(opt) {
  // 				self.clearOverlay()
  // 				self.controller.fit();
  // 				self.controller.render()
  // 				$('.chart-context-menu-layer').empty();
  // 			}
  // 		}
  // 	});

  // 	this.topLayer.addClass("context-menu-topLayer");
  // }

  this.requestChartTitleAndShareChart = function (chart) {
    var self = this;
    var content = createPropertiesDialogContent({
      properties: { Title: "", Description: "" },
      locale: {
        Title: self.chart.options.locale.getMessage("title"),
        Description: self.chart.options.locale.getMessage("description"),
      },
      inputClass: "webrcp-input-big webrcp-input-darkblue",
    });
    var actions: DialogAction[] = [
      {
        myClass: isSmallScreen()
          ? "webrcp-icon-arrow_back webrcp-dark-white webrcp-light-white"
          : "webrcp-dark-white webrcp-light-white webrcp-icon-close",
        title: "",
        callback: function (this: DialogActionHandle) {
          this.dismiss();
        },
      },
      {
        title: self.chart.options.locale.getMessage("OK"),
        callback: function (this: DialogActionHandle) {
          var props = content.simplePropertiesEditor("getValues");
          var data: TitleDescriptionPayload = { model: chart.model };
          data.thumbnail = chart.canvas.toDataURL();
          if (props["Title"]) data.title = props["Title"];
          if (props["Description"]) data.description = props["Description"];
          this.dismiss(true);
          WEBRCP.triggerQueueEvent("WEBRCP_SHARE_TO_SOCIAL_NETWORK", {
            content: data,
            type: "chart",
          });
        },
      },
    ];
    showPropertiesDialog({
      content,
      title: self.chart.options.locale.getMessage("menu_share_chart"),
      actions,
      dialogClass: "webrcp-simple-edit-dialog",
      onShown: () => {
        content.simplePropertiesEditor("focus");
      },
    });
  };

  this.requestChartTitleAndExportChart = function (chart) {
    var self = this;
    var content = createPropertiesDialogContent({
      properties: { Title: "", Description: "" },
      locale: {
        Title: self.chart.options.locale.getMessage("title"),
        Description: self.chart.options.locale.getMessage("description"),
      },
      inputClass: "webrcp-input-big webrcp-input-darkblue",
    });
    var actions: DialogAction[] = [
      {
        myClass: isSmallScreen()
          ? "webrcp-icon-arrow_back webrcp-dark-white webrcp-light-white"
          : "webrcp-dark-white webrcp-light-white webrcp-icon-close",
        title: "",
        callback: function (this: DialogActionHandle) {
          this.dismiss();
        },
      },
      {
        title: self.chart.options.locale.getMessage("OK"),
        callback: function (this: DialogActionHandle) {
          var props = content.simplePropertiesEditor("getValues");
          var data: TitleDescriptionPayload = { data: JSON.stringify(chart.model) };
          data.thumbnail = chart.canvas.toDataURL();
          if (props["Title"]) data.title = props["Title"];
          if (props["Description"]) data.description = props["Description"];
          // SERVICES.charts.sendChart(SERVICES.token, data,
          // 		function(rsp){
          // },
          // function(errorMessage){
          // 	console.error(errorMessage);
          // });
          this.dismiss();
        },
      },
    ];
    showPropertiesDialog({
      content,
      title: self.chart.options.locale.getMessage("menu_exportChart"),
      actions,
      dialogClass: "webrcp-simple-edit-dialog",
      onShown: () => {
        content.simplePropertiesEditor("focus");
      },
    });
  };

  this.requestTitleAndDescription = function (callback, quickHide) {
    quickHide === true ? (quickHide = true) : (quickHide = false);

    var self = this;
    var content = createPropertiesDialogContent({
      properties: { Title: "", Description: "" },
      inputClass: "webrcp-input-big webrcp-input-darkblue",
      locale: {
        Title: self.chart.options.locale.getMessage("title"),
        Description: self.chart.options.locale.getMessage("description"),
      },
    });
    var actions: DialogAction[] = [
      {
        myClass: isSmallScreen()
          ? "webrcp-icon-arrow_back webrcp-dark-white webrcp-light-white"
          : "webrcp-dark-white webrcp-light-white webrcp-icon-close",
        title: "",
        callback: function (this: DialogActionHandle) {
          this.dismiss();
        },
      },
      {
        title: self.chart.options.locale.getMessage("OK"),
        callback: function (this: DialogActionHandle) {
          var props = content.simplePropertiesEditor("getValues");
          var data: TitleDescriptionPayload = {};
          if (props["Title"]) data.title = props["Title"];
          if (props["Description"]) data.description = props["Description"];
          this.dismiss(quickHide);
          callback(data);
        },
      },
    ];
    showPropertiesDialog({
      content,
      title: self.chart.options.locale.getMessage("menu_export_strategy"),
      actions,
      dialogClass: "webrcp-simple-edit-dialog",
      onShown: () => {
        content.simplePropertiesEditor("focus");
      },
    });
  };

  this.requestStrategyTitleAndExportStrategy = function (strategy) {
    var sendStrategy = function (titleAndDescObject: TitleDescriptionPayload) {
      titleAndDescObject.data = JSON.stringify(strategy);
      // SERVICES.strategies.sendStrategy(SERVICES.token, titleAndDescObject,
      // 	function (data) {
      // 	},
      // 	function (errorMessage) {
      // 		console.error(errorMessage);
      // 	});
    };
    this.requestTitleAndDescription(sendStrategy);
  };

  this.exportStrategyToMarket = function (strategy) {
    WEBRCP.triggerQueueEvent("WEBRCP_ADD_ENTITY_TO_MARKET", strategy);
  };

  this.requestChartTitleAndExportChartToMarket = function (chartModel) {
    WEBRCP.triggerQueueEvent("WEBRCP_ADD_ENTITY_TO_MARKET", chartModel);
  };

  this.getSelectedTags = function (tagSettings) {
    var selectedTags = [];
    for (var t in tagSettings) {
      if (tagSettings[t]) selectedTags.push(t);
    }
    return selectedTags;
  };

  this.onMouseDown = function (e) {
    if (self.initialMouseEvent && !self.isMouseDown) {
      self.initialMouseEvent = null;
    }
    if (self.initialMouseEvent) return;
    if (self.controller.isChartEmpty(self.chart)) return;
    if (e.preventDefault) e.preventDefault();

    if (e.which === 2) {
      self.controller.onCrosshair();
      self.currentMode.onMouseMove(e);
      self.controller.renderOverlay();
      return;
    }

    e._offset = self.getEventOffset(e);

    if (self.swipe.hook != null) clearInterval(self.swipe.hook);

    WEBRCP.newChartLastFocus = self.chart;
    if (isTouchDevice()) {
      self.currentHandler = self.isOverHandler(e);
      if (self.currentHandler == -1)
        self.currentHitObject = self.getCurrentHitObject(e._offset.offsetX, e._offset.offsetY);
    }

    self.isMouseDown = true;
    self.isRightButton = self.isRightMouseButton(e);

    self.initialMouseEvent = e;
    self.currentViewportLeft = self.model.viewportLeft;
    self.initialOffsets = self.getOffsets();
    self.initialMinMax = null;

    var panel = self.getPanel(e._offset.offsetY);

    if (panel)
      self.initialMinMax = {
        max: panel.vMax,
        min: panel.vMin,
      };

    if (self.controller) self.controller.chartStructureChanged();

    if (self.isAboveValueAxis(e)) self.valueAxisClicked = true;
    else {
      self.valueAxisClicked = false;

      if (self.currentMode.symbol === "DEFAULT") {
        const legendHit = self.renderer.getLegendHit(
          e._offset.offsetX,
          e._offset.offsetY,
        );
        if (legendHit) {
          self.controller.objectsManager.detachScript(legendHit.scriptId);
          self.controller.rerender();
          return;
        }
      }

      self.currentMode.onMouseDown(e);
      self.controller.renderOverlay();
    }
  };

  this.isRightMouseButton = function (e) {
    var isRight = false;
    if ("which" in e)
      // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
      isRight = e.which == 3;
    else if ("button" in e)
      // IE, Opera
      isRight = e.button == 2;
    return isRight;
  };

  this.onMouseLeftUp = function (e) {
    const isRightButton = e.which === 3 || e.button === 2;
    if (isRightButton) {
      return;
    }

    e.preventDefault();
    self.onMouseUp(e);
  };

  this.onTouchDoubleTap = function (evt: {
    srcEvent?: TouchEvent;
    center?: { x: number; y: number };
  }) {
    const center = evt.center;
    const touch = evt.srcEvent?.changedTouches?.[0];
    if (!touch && !center) {
      return;
    }

    const rect = self.topLayer.getBoundingClientRect();
    const clientX = touch?.clientX ?? center?.x ?? 0;
    const clientY = touch?.clientY ?? center?.y ?? 0;

    self.onDoubleClick({
      clientX,
      clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      button: 0,
      preventDefault: () => undefined,
      stopPropagation: () => undefined,
    } as MouseEvent);
  };

  this.onDoubleClick = function (e: MouseEvent) {
    if (self.controller.isChartEmpty(self.chart)) return;

    const eo = self.getEventOffset(e);
    const priceAxisWidth = self.controller.renderer.getPriceRenderingOptions().valueAxisWidth;

    if (eo.offsetX >= self.model._width - priceAxisWidth) {
      self.model._priceAxisExpanded = self.model._priceAxisExpanded !== true;
      const mainSeries = self.fusion.getMainSeries();
      self.controller.renderer.calculatePriceRenderingOptions(
        mainSeries.data,
        self.model,
        mainSeries.instrument?.precision ?? self.controller.instrument?.precision ?? 0,
      );
      self.controller.fit();
      self.controller.render();
      self.controller.renderOverlay();
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (self.currentMode.symbol === "STAGING") {
      const staging = self.currentStagingObject;
      if (staging?.type === "mLine" && Array.isArray(staging.anchors) && staging.anchors.length >= 2) {
        self.suppressDrawingEditDoubleClick = true;
        self.completeStagingDrawing();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    if (self.currentMode.symbol !== "DEFAULT") return;

    if (self.suppressDrawingEditDoubleClick) {
      self.suppressDrawingEditDoubleClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const hitObject = self.getCurrentHitObject(eo.offsetX, eo.offsetY);

    if (!hitObject?.id || !hitObject.type) {
      return;
    }

    const shapeRenderer = self.controller.renderer.objects[hitObject.type];
    if (shapeRenderer && typeof shapeRenderer.renderAnchorsOverlay === "function") {
      self.controller.emitEvent({
        topic: "DRAWING_EDIT_REQUEST",
        data: { objectId: hitObject.id },
      });

      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const scriptPlotterTypes = [
      "SeriesObject",
      "StrategyObject",
      "CandlestickPatternStrategyObject",
      "FractalsObject",
    ];
    if (!hitObject.dataLink || !scriptPlotterTypes.includes(String(hitObject.type))) {
      return;
    }

    const scriptController = self.controller.objectsManager.isThisSeriesOutputOfScript(
      String(hitObject.dataLink),
    );
    if (!scriptController?.id) {
      return;
    }

    const modelScript = self.controller.objectsManager.getScriptModelById(scriptController.id);
    if (modelScript?.locked === true) {
      return;
    }

    const scriptKey = modelScript?.key;
    if (typeof scriptKey !== "string" || scriptKey === "VOLUME") {
      return;
    }

    const template = FUSION.getScript(scriptKey);
    if (!template || !["indicators", "functions", "strategies"].includes(String(template.type))) {
      return;
    }

    self.controller.emitEvent({
      topic: "INDICATOR_EDIT_REQUEST",
      data: { scriptId: scriptController.id },
    });

    e.preventDefault();
    e.stopPropagation();
  };

  this.onBodyMouseUp = function (evt) {
    if (evt.which === 3 || evt.button === 2) {
      return;
    }

    const eventElement = evt.target as Element | null;
    if (
      eventElement?.closest?.(".webrcp-chart-tools, .chart-watermark")
    ) {
      return;
    }

    self.onMouseUp(evt);
  };

  this.onMouseUp = function (e, evt) {
    const isStagingPlacement =
      self.currentMode.symbol === "STAGING" && self.currentStagingObject != null;

    if (!self.isMouseDown && !isStagingPlacement) {
      return;
    }

    if (isTouchDevice()) {
      const touches = evt.changedTouches ? evt.changedTouches : evt.changedPointers;
      let resume = false;

      for (let i = 0; i < touches.length; ++i) {
        const which = touches[i].pointerId || touches[i].identifier || 0;
        if (self.initialMouseEvent && self.initialMouseEvent?.which == which) resume = true;
      }

      if (!resume) return;
    }
    if (self.controller.isChartEmpty(self.chart)) return;
    if (self.currentHitObject) self.currentHitObject.isBeingDragged = false;

    if (e.which === 2) {
      self.controller.onCrosshair();
      self.currentMode.onMouseUp(e);
      self.controller.renderOverlay();
      return;
    }

    e._offset = self.getEventOffset(e);

    self.initialMouseEvent = null;
    self.isRightButton = false;
    self.isRightButtonDrag = false;
    self.isMouseDown = false;

    self.currentMode.onMouseUp(e);
    self.controller.renderOverlay();
    self.controller.render();

    // if (ctxMenu && self.allowContextMenu === true)
    // 	self.onContextMenu(e);

    self.controller.saveInstance();
  };

  this.onBodyMouseOut = function (evt) {
    var eventElement = evt.toElement || evt.target;

    // TODO: check if following code works properly
    if (eventElement.closest(".webrcp-chart-tools, .webrcp-new-chart, .chart-watermark")) return;
    self.onMouseOut(evt);
  };

  this.onMouseOut = function (e) {
    if (self.controller.isChartEmpty(self.chart)) return;
    if (self.currentHitObject) self.currentHitObject.isBeingDragged = false;

    e._offset = self.getEventOffset(e);

    self.initialMouseEvent = null;
    self.isMouseDown = false;
    self.isRightButton = false;
    self.isRightButtonDrag = false;

    //if(self.controller)
    //	self.controller.loadOrdersAndPositions();

    self.currentMode.onMouseOut(e);
    self.controller.renderOverlay();
    self.controller.render();
  };

  this.onBodyMouseMove = function (evt) {
    var eventElement = evt.toElement || evt.target;
    // TODO: check if following code works properly
    if (eventElement.closest(".webrcp-chart-tools, .webrcp-new-chart, .chart-watermark")) return;
    self.onMouseMove(evt);
  };

  this.onMouseMove = function (e, evt) {
    if (e.isPrimary === false) return;
    if (this.controller.isChartEmpty(this.chart)) {
      this.chart.repaint();
      return;
    }

    e._offset = this.getEventOffset(e);
    if (this.isMouseDown && this.isRightButton === false) {
      return this.onMouseDrag(e, evt);
    }
    if (this.isMouseDown && this.isRightButton) return this.onRightMouseDrag(e);

    const path = e.path || (e.composedPath && e.composedPath());
    if (!path || !path[0] || path[0] !== this.topLayer) return;

    this.currentHandler = this.isOverHandler(e);

    if (this.currentHandler > -1 && !this.currentStagingObject) {
      if (this.chart.style.cursor !== "row-resize") {
        this.chart.style.cursor = "row-resize";
        this.clearOverlay();
      }
      return;
    }

    this.currentMode.onMouseMove(e);
    this.controller.renderOverlay();
  };

  this.onMouseDrag = function (e) {
    if (this.controller.isChartEmpty(this.chart)) return;
    this.currentMode.onMouseDrag(e);
    this.controller.renderOverlay();
  };

  this.onRightMouseDrag = function (e) {
    this.isRightButtonDrag = true;

    if (this.initialMouseEvent && checkDragTolerance(this.initialMouseEvent, e, 3)) {
      this.allowContextMenu = false;
    }

    this.currentMode.onRightMouseDrag(e);
    this.controller.renderOverlay();
  };

  function checkDragTolerance(e1: PointerEventLike, e2: PointerEventLike, tolerance: number) {
    return (
      Math.abs((e1.clientX ?? 0) - (e2.clientX ?? 0)) >= tolerance ||
      Math.abs((e1.clientY ?? 0) - (e2.clientY ?? 0)) >= tolerance
    );
  }

  this.onDragObject = function (e) {
    const object = this.currentHitObject;
    if (!object) return;
    if (object.locked === true) return;
    object.isBeingDragged = true;

    this.renderer.objects[object.type].mouseDrag(
      e,
      object,
      this.renderer,
      this,
      this.model,
      this.currentPanel,
      this.fusion.getSeriesManager()
    );
  };

  this.onPan = function (event, initialEvent, initialXValue, currentXValue) {
    if (event.isPrimary === false) return;
    if (!this.initialMouseEvent) return;
    if (this.chart.style.cursor != this.currentMode.cursorOnDrag) {
      this.chart.style.cursor = this.currentMode.cursorOnDrag ?? "default";
    }

    const io = this.getEventOffset(initialEvent || this.initialMouseEvent);
    const eo = this.getEventOffset(event);

    const initialX = initialXValue !== undefined ? initialXValue : io.offsetX;
    const currentX = currentXValue !== undefined ? currentXValue : eo.offsetX;

    const currentOffset = currentX - initialX;

    if (
      this.model.instrumentsSeries[0] &&
      this.fusion.getSeriesManager()[this.model.instrumentsSeries[0].seriesId].data
    ) {
      const sl =
        this.fusion.getSeriesManager()[this.model.instrumentsSeries[0].seriesId].data.length;
      const newOffset = this.currentViewportLeft - currentOffset;

      if (newOffset <= this.model.periodWidth * (sl - 1)) {
        if (newOffset < 0) {
          this.model.viewportLeft = 0;
        } else if (this.model.viewportLeft !== newOffset) {
          this.model.viewportLeft = newOffset;
        }
      }

      const panel = this.getPanel(io.offsetY);
      if (!panel) return;

      const isAboveValueAxis = this.isAboveValueAxis(event);

      if (isAboveValueAxis && this.valueAxisClicked) {
        if (this.model.autoScale == true) this.controller.setAutoScale(false);
        this.chart.style.cursor = "ns-resize";
      }

      if (this.model.autoScale == false) {
        const panel2 = this.getPanel(eo.offsetY);
        if (!panel2) return;

        if (panel == panel2 && this.initialMinMax) {
          const panelOptions = {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
          };

          if (!this.initialMinMax.value) {
            this.initialMinMax.value = this.renderer.getPriceForYCoordinate(
              io.offsetY - panel._offset,
              panelOptions
            );
          }

          if (
            (this.isMouseDown && this.isRightButton === true) ||
            (isAboveValueAxis && this.valueAxisClicked)
          ) {
            const valueY1 = this.initialMinMax.value;
            const valueY2 = this.renderer.getPriceForYCoordinate(
              eo.offsetY - panel._offset,
              panelOptions
            );
            const delta = valueY1 - valueY2;

            if (
              delta > 0 ||
              (delta < 0 &&
                Math.abs(this.initialMinMax.max + delta - this.initialMinMax.min - delta) >
                  0.000000000000000001)
            ) {
              panel.vMax = this.initialMinMax.max + delta;
              panel.vMin = this.initialMinMax.min - delta;
            }
          } else if (this.isMouseDown && this.isRightButton === false) {
            const valueY1 = this.renderer.getPriceForYCoordinate(
              io.offsetY - panel._offset,
              panelOptions
            );
            const valueY2 = this.renderer.getPriceForYCoordinate(
              eo.offsetY - panel._offset,
              panelOptions
            );
            const delta = valueY2 - valueY1;

            panel.vMax = this.initialMinMax.max - delta;
            panel.vMin = this.initialMinMax.min - delta;
          }
        }
      }
    }

    this.controller.fitAndRepaint();

    return true;
  };

  this.onDragHandler = function (e) {
    var self = this;
    var io = this.getEventOffset(this.initialMouseEvent);
    var eo = this.getEventOffset(e);

    var offset = eo.offsetY - io.offsetY;
    var next = getIndexOfNextVisiblePanel(this.currentHandler);
    if (!next) return;

    var h1h2 = this.model.panels[this.currentHandler]._height + this.model.panels[next]._height;
    var nh_1 = this.initialOffsets[this.currentHandler].height + offset;
    var nh_2 = h1h2 - nh_1;

    if (nh_1 < this.model.minPanelHeight || nh_2 < this.model.minPanelHeight) return false;

    this.model.panels[this.currentHandler]._height = nh_1;
    this.model.panels[next]._height = nh_2;

    this.heightsToBasis();

    this.controller.fitAndRepaint();

    return true;

    function getIndexOfNextVisiblePanel(index: number) {
      var i = index + 1;
      while (i <= self.model.panels.length - 1) {
        if (self.model.panels[i]._visible == true) return i;
        i++;
      }
    }
  };

  this.heightsToBasis = function () {
    var H = this.model._height - this.model.timeAxisHeight;
    var B = 0;

    for (var i = 0; i < this.model.panels.length; i++) {
      if (this.model.panels[i]._visible) {
        var b = (100 * this.model.panels[i]._height) / H;
        B += b;
        this.model.panels[i].basis = b;
      }
    }

    var offset = 100 - B;
    if (offset > 0) this.model.panels[0].basis += offset;
  };

  this.basisToHeights = function () {
    const panels = this.model.panels;
    const length = this.model.panels.length;
    const fullHeight = this.model._height - this.model.timeAxisHeight;
    let basis = 0;

    for (var i = 0; i < length; i++) {
      const panel = panels[i];

      if (panel._visible) {
        basis += panel.basis;
      }
    }

    for (var i = 0; i < length; i++) {
      const panel = panels[i];

      panel._height = panel._visible ? Math.round((fullHeight * panel.basis) / basis) : 0;
    }
  };

  this.triggerWheelCallback = (function () {
    const wheelUpDelta = { v: 0 };
    const wheelDownDelta = { v: 0 };

    return function (event: WheelEvent | PointerEventLike) {
      self.currentViewportLeft = self.model.viewportLeft;

      if (self.config.mouseWheelZoomEnabled === false) return;
      if (self.controller.isChartEmpty(self.chart)) return;

      event.preventDefault?.();
      if (self.swipe.hook != null) clearInterval(self.swipe.hook);

      const deltaY = event.deltaY ?? 0;
      const deltaX = event.deltaX ?? 0;

      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        triggerPan.call(self, event);
      } else {
        if (deltaY < 0) {
          // scrolling up
          wheelDownDelta.v = 0;
          accumulateAndTriggerScroll.call(self, wheelUpDelta, event, onMouseWheelUp);
        } else {
          // scrolling down
          wheelUpDelta.v = 0;
          accumulateAndTriggerScroll.call(self, wheelDownDelta, event, onMouseWheelDown);
        }
      }
    };

    function triggerPan(this: CoreInteractor, event: WheelEvent | PointerEventLike) {
      const deltaX = event.deltaX ?? 0;
      if (Math.abs(deltaX) > 0) {
        let delta = 0;

        if (deltaX < 0) {
          delta = 15;
        } else {
          delta = -15;
        }

        this.doFrame(() => {
          const eventLike = event as PointerEventLike;
          eventLike._offset = this.getEventOffset(eventLike);
          this.onPan.call(this, eventLike, eventLike, 0, delta);
        });
      }
    }

    function accumulateAndTriggerScroll(
      this: CoreInteractor,
      currentDelta: { v: number },
      event: WheelEvent | PointerEventLike,
      callback: ScrollAccumulatorCallback
    ) {
      currentDelta.v += event.deltaY ?? 0;

      if (Math.abs(currentDelta.v) >= 5) {
        this.doFrame(() => {
          const eventOffset = this.getEventOffset(event);
          const index = this.renderer.getPointIndex(eventOffset.offsetX, this.model);
          const dataLength = this.fusion.getMainSeries().data.length;
          const xPosition = this.renderer.getIndexPoint(dataLength - 1, this.model);
          const canvasWidth =
            this.model._width - this.controller.renderer.getPriceRenderingOptions().valueAxisWidth;
          const visibleIndexes = this.model._rightIndex - this.model._leftIndex;

          callback.call(
            this,
            index,
            dataLength,
            xPosition,
            canvasWidth,
            visibleIndexes,
            eventOffset
          );

          self.controller.rerender();
        });

        currentDelta.v = 0;
      }
    }

    function onMouseWheelDown(
      this: CoreInteractor,
      index: number,
      dataLength: number,
      xPosition: number,
      canvasWidth: number,
      visibleIndexes: number,
      eventOffset: { offsetX: number; offsetY: number }
    ) {
      let periodWidth;

      const minPeriodWidth = this.getMinPeriodWidth();
      const _d = Math.round(visibleIndexes * 1.05);

      if (canvasWidth / _d > 5) {
        periodWidth = Math.round(canvasWidth / _d);

        let factor = 0.95;
        while (periodWidth >= this.model.periodWidth) {
          periodWidth = Math.round(periodWidth * factor);
          factor -= 0.1;
        }
      } else {
        periodWidth = canvasWidth / _d;
      }

      if (periodWidth < minPeriodWidth) periodWidth = minPeriodWidth;

      if (this.model.periodWidth == minPeriodWidth) {
        //don't zoom out but move right
        if (this.model._leftIndex > 0) {
          const leftIndex = this.model._leftIndex - _d > 0 ? this.model._leftIndex - _d : 0;
          this.moveIndexToPoint(leftIndex, this.model.periodWidth / 2);
        }
      } else {
        this.model.periodWidth = periodWidth;

        if (index > dataLength - 1) {
          this.moveIndexToPoint(dataLength - 1, xPosition);
        } else {
          this.moveIndexToPoint(index, eventOffset.offsetX);
        }
      }
    }

    function onMouseWheelUp(
      this: CoreInteractor,
      index: number,
      dataLength: number,
      xPosition: number,
      canvasWidth: number,
      visibleIndexes: number,
      eventOffset: { offsetX: number; offsetY: number }
    ) {
      var _d = Math.round(visibleIndexes * 0.95); // new amount of candles
      if (_d < 6) return; // if less than 6 candles, abort

      if (canvasWidth / _d > 5) {
        // candle width > 1px
        var _pw = Math.round(canvasWidth / _d);
      } else {
        var _pw = canvasWidth / _d;
      }

      if (_pw <= this.model.periodWidth) _pw = _pw + 2;

      if (_pw < 0.01) _pw = 0.01;

      this.model.periodWidth = _pw;

      if (index > dataLength - 1) {
        if (this.model._leftIndex > 0) this.moveIndexToPoint(dataLength - 1, xPosition);
      } else this.moveIndexToPoint(index, eventOffset.offsetX);
    }
  })();

  this.getMinPeriodWidth = function () {
    const dataLength = this.fusion.getMainSeries().data.length;
    const canvasWidth =
      this.model._width - this.controller.renderer.getPriceRenderingOptions().valueAxisWidth;
    const minPeriodWidth = (canvasWidth * 0.9) / dataLength;

    return minPeriodWidth;
  };

  this.onKeyUp = function (e) {
    if (this.controller.isChartEmpty(this.chart)) return;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement.isContentEditable
      ) {
        return;
      }

      if (activeElement.closest('[role="dialog"]')) {
        return;
      }
    }

    switch (e.key) {
      case "Backspace":
      case "Delete":
        if (!this.currentSelectedObject) break;

        this.controller.onDelete(this.currentSelectedObject.id);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        break;

      case "Home":
        this.moveIndexToPoint(0, 0);
        this.controller.rerender();
        break;

      case "End":
        this.controller.moveToEnd();
        this.controller.rerender();
        break;
    }
  };

  this.onKeyDown = function (e) {
    if (this.controller.isChartEmpty(this.chart)) return;

    if (WEBRCP.newChartLastFocus === this.chart) {
      const activeElement = document.activeElement;
      if (
        !(activeElement instanceof HTMLElement) ||
        !activeElement.className.startsWith("webrcp-new-chart-top-layer")
      )
        return;

      switch (e.key) {
        case "Control":
          this.currentMode.keyDown(e.key);
          break;
      }
    }
  };

  this.clearOverlay = function () {
    // self.octx.setTransform(1, 0, 0, 1, 0, 0);
    self.octx.clearRect(-1, -1, self.model._width + 2, self.model._height + 2);
  };

  this.hideEmptyPanels = function () {
    for (var i = 0; i < this.model.panels.length; i++) {
      this.model.panels[i]._visible = this.renderer.shouldBePanelVisible(this.model.panels[i]);
    }
  };

  this.getOffsets = function () {
    var offsets = [];

    for (var i = 0; i < this.model.panels.length; i++) {
      offsets.push({ height: this.model.panels[i]._height, offset: this.model.panels[i]._offset });
    }

    return offsets;
  };

  this.isOverHandler = function (e) {
    var eo = this.getEventOffset(e);

    if (this.model.panels.length < 2) return -1;
    for (var i = 0; i < this.model.panels.length - 1; i++) {
      if (
        this.isOver(
          0,
          eo.offsetY,
          0,
          this.model.panels[i]._offset + this.model.panels[i]._height,
          hitTolerance
        )
      )
        return i;
    }

    return -1;
  };

  this.isOver = function (x1, y1, x2, y2, precision) {
    if (x1 - precision < x2 && x1 + precision > x2 && y1 - precision < y2 && y1 + precision > y2)
      return true;

    return false;
  };

  this.getCurrentHitObject = function (x, y) {
    this.currentPanel = this.getPanel(y);

    if (this.currentPanel == null) return null;

    //arrows?
    var arrow = this.renderer.objects["MovePaneArrows"].hit(
      x,
      y,
      null as unknown as ChartRuntimeObject,
      this.renderer,
      this,
      this.model,
      this.currentPanel,
      this.fusion.getSeriesManager()
    );
    if (arrow) {
      return arrow as ChartRuntimeObject;
    }

    //clear all previous hits
    for (var i = 0; i < this.currentPanel.objects.length; i++) {
      const objectRenderer = this.renderer.objects[this.currentPanel.objects[i].type];
      if (objectRenderer.clearHits) objectRenderer.clearHits(this.currentPanel.objects[i]);
    }

    if (this.currentPanel.main == true) {
      if (this.model.positions.visible && this.model.positions.list) {
        for (var i = 0; i < this.model.positions.list.length; i++) {
          if (
            this.renderer.objects["TradeObject"].hit(
              x,
              y,
              this.model.positions.list[i],
              this.renderer,
              this,
              this.model,
              this.currentPanel,
              this.fusion.getSeriesManager()
            )
          )
            return this.model.positions.list[i];
        }
      }

      const orders = this.model.orders.list;
      const areOrdersVisible = this.model.orders.visible && orders;

      if (areOrdersVisible) {
        for (var i = 0; i < orders.length; i++) {
          if (orders[i].object?.price && orders[i].object?.stopPrice) {
            if (
              this.renderer.objects["StopLimitObject"].hit(
                x,
                y,
                orders[i],
                this.renderer,
                this,
                this.model,
                this.currentPanel,
                this.fusion.getSeriesManager()
              )
            )
              return orders[i];
          } else {
            if (
              this.renderer.objects["TradeObject"].hit(
                x,
                y,
                orders[i],
                this.renderer,
                this,
                this.model,
                this.currentPanel,
                this.fusion.getSeriesManager()
              )
            )
              return orders[i];
          }
        }
      }
    }

    if (!this.isObjectSelectionAllowed) return null;

    var lastObjectIndex = this.currentPanel.objects.length - 1;
    for (var i = lastObjectIndex; i > -1; --i) {
      if (this.hit(x, y, this.currentPanel.objects[i])) return this.currentPanel.objects[i];
    }

    return null;
  };

  this.getPanel = function (y) {
    for (var i = this.model.panels.length - 1; i > -1; i--) {
      if (
        y > this.model.panels[i]._offset &&
        y < this.model.panels[i]._offset + this.model.panels[i]._height
      )
        return this.model.panels[i];
    }

    return null;
  };

  this.getMainPanel = function () {
    for (var i = 0; i < this.model.panels.length; i++) {
      if (this.model.panels[i].main == true) return this.model.panels[i];
    }
    return null;
  };

  this.getMainInstrumentPlotter = function () {
    var panel = this.getMainPanel();
    if (!panel) return null;
    if (this.model.instrumentsSeries && this.model.instrumentsSeries.length > 0) {
      for (var i = 0; i < panel.objects.length; i++) {
        if (panel.objects[i].id == this.model.instrumentsSeries[0].seriesId)
          return panel.objects[i];
      }
    }
    return null;
  };

  this.hit = function (x, y, o) {
    return this.renderer.objects[o.type].hit(
      x,
      y,
      o,
      this.renderer,
      this,
      this.model,
      this.currentPanel,
      this.fusion.getSeriesManager()
    );
  };

  this.deselectAll = function () {
    for (let i = 0; i < this.model.panels.length; i++) {
      for (let j = 0; j < this.model.panels[i].objects.length; j++) {
        this.model.panels[i].objects[j]["selected"] = false;
      }
    }
    //deselect positions
    if (this.model.positions) {
      this.model.positions.selected = false;
      for (let i in this.model.positions.list) {
        delete this.model.positions.list[i].selected;
      }
    }
    //deselect orders
    if (this.model.orders) {
      this.model.orders.selected = false;
      for (let i in this.model.orders.list) {
        delete this.model.orders.list[i].selected;
      }
    }

    this.currentSelectedObject = null;
    this.controller.updateToolsOptions({ mode: "chart", interactor: this });
  };

  this.completeStagingDrawing = function () {
    if (this.currentMode.symbol !== "STAGING" || !this.currentStagingObject) {
      return false;
    }

    if (!this.currentPanel) {
      const mainPanel = this.model.panels.find((panel) => panel.main === true);
      this.currentPanel = mainPanel ?? this.model.panels[0] ?? null;
    }

    if (!this.currentPanel) {
      return false;
    }

    const completed = this.currentStagingObject;
    if (!Array.isArray(completed.anchors) || completed.anchors.length < 2) {
      return false;
    }

    if (completed.type === "mLine" && completed.anchors.length >= 2) {
      const last = completed.anchors[completed.anchors.length - 1];
      const previous = completed.anchors[completed.anchors.length - 2];
      const panelPrecision =
        typeof this.currentPanel?.precision === "number" ? this.currentPanel.precision : 4;
      const epsilon = Math.pow(10, -panelPrecision);

      if (
        last._index === previous._index &&
        Math.abs(last.value - previous.value) <= epsilon
      ) {
        completed.anchors.pop();
      }
    }

    if (completed.anchors.length < 2) {
      return false;
    }

    delete completed._isStaging;
    completed.hidden = false;

    const alreadyOnPanel = this.currentPanel.objects.some((object) => object.id === completed.id);
    if (!alreadyOnPanel) {
      this.currentPanel.objects.push(completed);
    }

    const completedRenderer = this.controller.renderer.objects[completed.type];
    if (completedRenderer?.push) {
      completedRenderer.push(
        completed,
        this.controller.renderer,
        this.model,
        this.fusion.getSeriesManager(),
        this,
      );
    }

    const finishCallback = (this.currentMode as { onFinished?: () => void }).onFinished;

    if (completed.type === "mLine") {
      this.suppressDrawingEditDoubleClick = true;
    }

    this.currentStagingObject = null;
    this.currentAnchor = null;
    this.select(completed);
    this.setMode("DEFAULT");
    this.controller.onDrawingDone();
    this.controller.render();
    this.controller.renderOverlay();

    if (typeof finishCallback === "function") {
      finishCallback();
    }

    return true;
  };

  this.select = function (o) {
    var self = this;
    this.deselectAll();
    o.selected = true;
    selectOrderPosition();
    this.currentSelectedObject = o;

    const shapeRenderer = this.renderer.objects[o.type] as unknown as Shape | undefined;
    if (
      o._isStaging !== true &&
      shapeRenderer &&
      typeof shapeRenderer.pop === "function"
    ) {
      shapeRenderer.pop(o, this.renderer, this.model, this.fusion.getSeriesManager(), this);
    }

    if (shapeRenderer && typeof shapeRenderer.renderAnchorsOverlay === "function") {
      this.controller.updateToolsOptions({ mode: "object", interactor: this, object: o });
    } else if (
      this.renderer.objects[o.type] instanceof Series &&
      o.renderAs !== "OHLC" &&
      o.renderAs !== "Bars"
    ) {
      this.controller.updateToolsOptions({ mode: "series", interactor: this, object: o });
    } else if (
      this.renderer.objects[o.type] instanceof Series &&
      (o.renderAs === "OHLC" || o.renderAs == "Bars")
    ) {
      this.controller.updateToolsOptions({ mode: "candles", interactor: this, object: o });
    } else {
      this.controller.updateToolsOptions({ mode: "chart", interactor: this, object: o });
    }

    function selectOrderPosition() {
      if (o.list) {
        for (var i in o.list) {
          if (o.list[i].hover) {
            o.list[i].selected = true;
            if (o.list[i].objType == "ORDER") selectRelatedPosition(o.list[i].parentId);
            else if (o.list[i].objType == "POSITION") selectRelatedOrders(o.list[i].id);
          }
        }
      }
    }

    function selectRelatedPosition(id: string | number) {
      for (var i in self.model.positions.list) {
        if (self.model.positions.list[i].id == id) {
          self.model.positions.list[i].selected = true;
        }
      }
    }

    function selectRelatedOrders(id: string | number) {
      for (var i in self.model.orders.list) {
        if (self.model.orders.list[i].parentId == id) {
          self.model.orders.list[i].selected = true;
        }
      }
    }

    this.controller.renderOverlay();
  };

  this.pushPanel = function (r, o, panel) {
    void panel;
    this.controller.render(o);
  };

  this.popPanel = function (r, o, panel) {
    void panel;
    if (o.canBeIndicator == true) {
      this.controller.calculateAll();
      this.controller.fit();
    }

    this.controller.render();
    this.controller.renderOverlay();
  };

  this.pushIndexes = function () {
    for (var i = 0; i < this.model.panels.length; i++) {
      for (var j = 0; j < this.model.panels[i].objects.length; j++) {
        var o = this.model.panels[i].objects[j];
        var r = this.renderer.objects[o.type];
        if (r.push) r.push(o, this.renderer, this.model, this.fusion.getSeriesManager(), this);
      }
    }
  };

  this.popIndexes = function () {
    for (var i = 0; i < this.model.panels.length; i++) {
      for (var j = 0; j < this.model.panels[i].objects.length; j++) {
        var o = this.model.panels[i].objects[j];
        var r = this.renderer.objects[o.type];
        if (r.pop) r.pop(o, this.renderer, this.model, this.fusion.getSeriesManager(), this);
      }
    }
  };

  this.renderOverlayedObject = function (r, o, panel) {
    var self = this;
    try {
      self.octx.save();
      self.octx.rect(
        0,
        panel._offset,
        panel._width - self.controller.renderer.getPriceRenderingOptions().valueAxisWidth,
        panel._height
      );
      self.octx.clip();

      self.clearOverlay();
      // self.octx.translate (0.5, 0.5);
      r.render(o, self.octx, self.renderer, self.model, panel, self.fusion.getSeriesManager());
      r.postRender(o, self.octx, self.renderer, self.model, panel, self.fusion.getSeriesManager());
    } catch (e: any) {
      console.error(e, e.stack);
    } finally {
      // self.octx.translate (-0.5, -0.5);
      self.octx.restore();
    }
  };

  this.init = function () {
    this.popIndexes();
  };

  this.initAnchor = function (a) {
    a._index = this.getStampIndex(a.referenceStamp) + a.offset;
  };

  this.getStampIndex = function (s) {
    var lastIndex = this.fusion.getSeriesManager()[this.model.mainSeries].data.length - 1;

    for (var i = 0; i < this.fusion.getSeriesManager()[this.model.mainSeries].data.length; i++) {
      var stamp = this.fusion.getSeriesManager()[this.model.mainSeries].data[i].stamp;

      if (stamp == s) return i;

      if (i < lastIndex) {
        var nextStamp = this.fusion.getSeriesManager()[this.model.mainSeries].data[i + 1].stamp;
        if (s > stamp && s < nextStamp) return i;
      }

      if (i == lastIndex) {
        var intervalInMilis = this.fusion.getSeriesManager()[this.model.mainSeries].interval.milis;
        if (s > stamp && s < stamp + intervalInMilis) return i;
      }
    }
    return -1;
  };

  this.doCloseTradeObject = function (o) {
    if (o.type == "POSITION") {
      this.chart.options.doClosePositionCallback(o.object);
    } else {
      this.chart.options.doDeleteOrderCallback(
        this.getOriginalOrder(JSON.parse(JSON.stringify(o.object)))
      );
    }
  };

  this.doModifyTradeObject = function (o, parent) {
    var req = JSON.parse(JSON.stringify(o.object));

    req.stopPrice = o.stopPrice;
    req.limitPrice = o.limitPrice;
    if (o.type.includes("TRAILING_STOP")) {
      req.trailingStop = true;
      var mainSeriesCandles = this.fusion.getMainSeries().data;
      req.stopPrice -= mainSeriesCandles[mainSeriesCandles.length - 1].c;
    }
    if (!parent && o.type == "POSITION") req.isMarket = true;
    else if (parent && parent.type == "POSITION") req.isMarket = true;
    else req.isMarket = false;

    this.chart.options.doModifyOrderCallback(req);
  };

  this.getOriginalOrder = function (order) {
    if (order.parentOrder) {
      for (const i in order.parentOrder.legs) {
        if (order.parentOrder.legs[i].id === order.id) {
          order.parentOrder.legs[i] = order;
          return order.parentOrder;
        }
      }
    }

    return order;
  };

  this.doAddTradeObject = function (o) {
    var mode = "silent"; //ask, dialog
    var orderRequest: RelatedOrderRequest = { price: o.related.price, parent: o.object };
    if (o.operation == "SELL" && o.related.price > o.price) orderRequest.type = "SL";
    if (o.operation == "SELL" && o.related.price < o.price) orderRequest.type = "TP";
    if (o.operation == "BUY" && o.related.price > o.price) orderRequest.type = "TP";
    if (o.operation == "BUY" && o.related.price < o.price) orderRequest.type = "SL";
    orderRequest.title = orderRequest.type;

    if (mode == "silent") {
      self.chart.options.doAddRelatedOrder(orderRequest);
    } else if (mode == "dialog") {
      if (orderRequest.type == "SL") {
        self.chart.options.openAddSLWidget(orderRequest);
      }
      if (orderRequest.type == "TP") {
        self.chart.options.openAddTPWidget(orderRequest);
      }
    }
  };

  this.setMode = function (symbol, o, onFinished) {
    this.clearOverlay();

    switch (symbol) {
      case "CROSSHAIR":
        this.currentMode = new (CrosshairTool as unknown as InteractionModeConstructor)(this);
        break;
      case "ZOOMBOX":
        this.currentMode = new (ZoomBoxTool as unknown as InteractionModeConstructor)(this);
        break;
      case "STAGE":
        if (!o) {
          this.currentMode = new (DefaultTool as unknown as InteractionModeConstructor)(this);
          break;
        }
        this.currentMode = new (StageTool as unknown as StageModeConstructor)(this, o, onFinished);
        break;
      case "ERASER":
        this.currentMode = new (EraserTool as unknown as InteractionModeConstructor)(this);
        break;
      default:
        this.currentMode = new (DefaultTool as unknown as InteractionModeConstructor)(this);
    }

    this.controller.emitEvent({
      topic: "CURSOR_CHANGE",
      data: {
        cursor: symbol,
      },
    });
  };

  this.movePanelUpDn = function (panel, o) {
    var panels = this.model.panels;
    for (var i in panels) {
      panels[i].sortNb = i;
    }

    if (o.arrow == "up") panel.sortNb = panel.sortNb - 2;
    if (o.arrow == "dn") panel.sortNb = panel.sortNb + 2;
    panels.sort(function (p1, p2) {
      return Number(p1.sortNb) - Number(p2.sortNb);
    });
    // this.chart.fit();
    // this.controller.render();
    // this.chart.saveInstance();
    self.controller.rerender();
  };

  this.getEventOffset = function (e) {
    if (!e) return { offsetX: 0, offsetY: 0 };

    var targetRect = this.topLayer.getBoundingClientRect();
    var clientX = e.clientX ?? e.deltaX ?? 0;
    var clientY = e.clientY ?? e.deltaY ?? 0;
    var x = clientX - targetRect.left;
    var y = clientY - targetRect.top;

    return { offsetX: x, offsetY: y };
  };

  this.isAboveValueAxis = function (e) {
    if (this.currentPanel)
      return (
        e._offset.offsetX >
        this.currentPanel._width -
          this.controller.renderer.getPriceRenderingOptions().valueAxisWidth
      );
    return false;
  };

  this.setObjectSelectionAllowed = (isObjectSelectionAllowed) => {
    this.isObjectSelectionAllowed = isObjectSelectionAllowed;
    this.controller.emitEvent({
      topic: "OBJECT_SELECTION_ALLOWED_CHANGE",
      data: isObjectSelectionAllowed,
    });
  };

  bindDomEvents();
} as unknown as CoreInteractorConstructor;

// **************************************************** //
// ******************* DEFAULT TOOL ******************* //
// **************************************************** //

function DefaultTool(this: CoreInteractionMode, interactor: CoreInteractor) {
  this.symbol = "DEFAULT";
  this.interactor = interactor;
  this.color = WEBRCP.utils.colorManager.getColor("defaultToolColor");
  this.textColor = WEBRCP.utils.colorManager.getColor("defaultToolTextColor");
  this.toolTipShowDelay = 600;

  this.cursor = "default";
  this.cursorOverObject = "pointer";
  this.cursorOnDrag = "default";
  this.cursorOnCopyMode = "copy";

  this.allowSwipe = true;

  this.onMouseDown = function (e) {
    this.startEvent = e;
    this.finishEvent = null;
    this.copyMode = false;

    const eventOffset = this.interactor.getEventOffset(e);
    if (!this.interactor.isAboveValueAxis(e)) {
      this.interactor.currentHitObject = this.interactor.getCurrentHitObject(
        eventOffset.offsetX,
        eventOffset.offsetY,
      );
    }

    if (this.interactor.currentHitObject != null) {
      const hitObject = this.interactor.currentHitObject;
      this.interactor.select(hitObject);

      if (hitObject.locked === true) {
        return;
      }

      if (e.ctrlKey && this.canBeCloned?.(hitObject)) {
        this.copyMode = true;
        var clone = this.interactor.controller.objectsManager.cloneObject(hitObject);
        this.interactor.currentHitObject = clone;
      }

      this.interactor.pushPanel(this, this.interactor.currentHitObject, this.interactor.currentPanel);

      this.interactor.currentAnchor = this.interactor.controller.renderer.objects[
        this.interactor.currentHitObject.type
      ].mouseDown(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      ) as CoreInteractor["currentAnchor"];
    } else {
      this.interactor.deselectAll();
    }
  };

  this.onMouseUp = function (e) {
    this.finishEvent = null;

    if (this.interactor.currentHitObject != null) {
      this.interactor.popPanel(
        this,
        this.interactor.currentHitObject,
        this.interactor.currentPanel
      );
      this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    } else {
      this.interactor.chart.style.cursor = this.cursor;
    }
  };

  this.onMouseMove = function (e) {
    this.finishEvent = e;
    var eo = this.interactor.getEventOffset(e);

    this.interactor.currentHitObject = this.interactor.getCurrentHitObject(eo.offsetX, eo.offsetY);

    if (this.interactor.isAboveValueAxis(e)) {
      this.interactor.currentHitObject = null;
      this.interactor.chart.style.cursor = "ns-resize";
    } else if (this.interactor.currentHitObject != null && this.interactor.currentHitObject._hit) {
      if (e.ctrlKey && this.canBeCloned?.(this.interactor.currentHitObject)) {
        if (this.interactor.chart.style.cursor != this.cursorOnCopyMode) {
          this.interactor.chart.style.cursor = this.cursorOnCopyMode;
        }
      } else {
        if (this.interactor.chart.style.cursor != this.interactor.currentMode.cursorOverObject) {
          this.interactor.chart.style.cursor = this.interactor.currentMode.cursorOverObject;
        }
      }

      if (
        this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove
      ) {
        this.interactor.controller.renderer.objects[
          this.interactor.currentHitObject.type
        ].mouseMove(
          e,
          this.interactor.currentHitObject,
          this.interactor.controller.renderer,
          this.interactor,
          this.interactor.model,
          this.interactor.currentPanel,
          this.interactor.fusion.getSeriesManager()
        );
      }
    } else if (
      !this.interactor.currentHitObject &&
      this.interactor.controller.renderer.getLegendHit(eo.offsetX, eo.offsetY)
    ) {
      if (this.interactor.chart.style.cursor != this.cursorOverObject) {
        this.interactor.chart.style.cursor = this.cursorOverObject;
      }
    } else if (this.interactor.chart.style.cursor != this.cursor) {
      this.interactor.chart.style.cursor = this.cursor;
    }
  };

  this.onMouseDrag = function (e) {
    const interactor = this.interactor;

    this.startEvent = interactor.initialMouseEvent;
    this.finishEvent = e;

    if (interactor.currentHandler > -1) return this.interactor.onDragHandler(e);

    const hitObject = interactor.currentHitObject;
    if (
      hitObject != null &&
      hitObject.locked !== true &&
      interactor.controller.renderer.objects[hitObject.type].isDraggable !== false
    )
      return interactor.onDragObject(e);

    return interactor.onPan(e);
  };

  this.onRightMouseDrag = function (e) {
    this.startEvent = this.interactor.initialMouseEvent;
    this.finishEvent = e;
    return this.interactor.onPan(e);
    //this.interactor.clearOverlay();
    //this.interactor.currentMode.render(this.interactor.octx, this.interactor.initialMouseEvent, e);
  };

  this.onMouseOut = function (e) {
    if (this.interactor.currentHitObject != null) {
      this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseOut(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    }
  };

  this.keyDown = function (key) {
    if (key == "Control" && this.canBeCloned?.(this.interactor.currentHitObject)) {
      if (this.interactor.currentHitObject != null && this.interactor.currentHitObject._hit) {
        if (this.interactor.chart.style.cursor != this.cursorOnCopyMode) {
          this.interactor.chart.style.cursor = this.cursorOnCopyMode;
        }
      }
    }
  };

  this.canBeCloned = function (o) {
    if (o != null && this.interactor.controller.renderer.objects[o.type] instanceof Shape)
      return true;
    return false;
  };

  this.render = function (ctx) {
    void ctx;
  };

  this.renderOverlay = function (octx) {
    var self = this;
    if (this.startEvent && this.interactor.currentHitObject && this.interactor.isMouseDown) {
      const startEventOffset = this.interactor.getEventOffset(this.startEvent);
      var panel = this.interactor.getPanel(startEventOffset.offsetY);
      //render only on chart surface (without axis)
      try {
        octx.save();
        // octx.translate (0.5, 0.5);
        octx.rect(
          0,
          panel._offset,
          panel._width -
            this.interactor.controller.renderer.getPriceRenderingOptions().valueAxisWidth,
          panel._height
        );
        octx.clip();

        var o = this.interactor.currentHitObject;
        var r = this.interactor.controller.renderer.objects[o.type];
        r.render(
          o,
          octx,
          this.interactor.controller.renderer,
          this.interactor.model,
          panel,
          this.interactor.fusion.getSeriesManager()
        );
      } catch (e: any) {
        console.error(e, e.stack);
      } finally {
        // octx.translate (-0.5, -0.5);
        octx.restore();
      }

      //post render on whole octx
      try {
        octx.save();
        // octx.translate (0.5, 0.5);
        octx.rect(0, panel._offset, panel._width, panel._height);
        octx.clip();

        var o = this.interactor.currentHitObject;
        var r = this.interactor.controller.renderer.objects[o.type];
        r.postRender(
          o,
          octx,
          this.interactor.controller.renderer,
          this.interactor.model,
          panel,
          this.interactor.fusion.getSeriesManager()
        );
      } catch (e: any) {
        console.error(e, e.stack);
      } finally {
        // octx.translate (-0.5, -0.5);
        octx.restore();
      }
    }

    if (this.interactor.currentHitObject) {
      if (this.tipTimeout) clearTimeout(this.tipTimeout);

      if (this.currentTip) showTip();
      else this.tipTimeout = setTimeout(showTip, this.toolTipShowDelay);

      function showTip() {
        runWithChartLocale(self.interactor.controller, () => {
          var hitObject = self.interactor.currentHitObject;

          if (
            hitObject &&
            hitObject._hit &&
            hitObject._hit.x &&
            hitObject._hit.y &&
            hitObject.dataLink &&
            self.interactor.fusion.getSeriesManager()[hitObject.dataLink]
          ) {
            var object = self.interactor.controller.renderer.objects[hitObject.type];
            var index = self.interactor.controller.renderer.getPointIndex(
              hitObject._hit.x,
              self.interactor.model
            );

            if (
              index >
              self.interactor.fusion.getSeriesManager()[hitObject.dataLink].data.length - 1
            ) {
              return;
            }

            if (!object.getToolTip) return;

            var tip = object.getToolTip(
              self.interactor.currentHitObject,
              index,
              self.interactor.model,
              self.interactor.fusion.getSeriesManager(),
              self.interactor.fusion.getScriptsManager()
            );

            try {
              octx.save();
              // octx.translate (0.5, 0.5);
              tip.date = WEBRCP.utils.dateTimeFormatter.stamp(tip.stamp).toDateTimeString();
              tip.precision = self.interactor.model.instrumentsSeries[0].instrument.precision;
              self.currentTip = tip;
              drawTip(
                tip,
                hitObject._hit.x,
                hitObject._hit.y,
                octx,
                self.interactor.model,
                self.interactor.controller
              );
            } catch (e: any) {
              console.error(e, e.stack);
            } finally {
              // octx.translate (-0.5, -0.5);
              octx.restore();
            }
          }
        });
      }
    } else {
      clearTimeout(this.tipTimeout);
      this.currentTip = null;
      this.tipTimeout = null;
    }
  };

  function fillRoundedTooltipRect(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    width: number,
    height: number,
    radius: number,
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(left, top, width, height, r);
      return;
    }

    ctx.moveTo(left + r, top);
    ctx.lineTo(left + width - r, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + r);
    ctx.lineTo(left + width, top + height - r);
    ctx.quadraticCurveTo(left + width, top + height, left + width - r, top + height);
    ctx.lineTo(left + r, top + height);
    ctx.quadraticCurveTo(left, top + height, left, top + height - r);
    ctx.lineTo(left, top + r);
    ctx.quadraticCurveTo(left, top, left + r, top);
    ctx.closePath();
  }

  function strokeTooltipDivider(
    ctx: CanvasRenderingContext2D,
    startX: number,
    y: number,
    endX: number,
    color: string,
  ) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  function drawTip(
    tip: TooltipRenderData,
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
    model: CoreChartModel,
    controller: CoreChartController
  ) {
    const getValue = (value: unknown, precision?: number | null): string => {
      if (value !== undefined && value !== null) {
        let newValue: string | number = String(value);
        if (typeof value === "number") {
          newValue = formatNumber(value, precision);
        }
        return String(newValue);
      } else {
        return "-";
      }
    };

    var cfg: TooltipLayout = {
      offsetX: 10,
      offsetY: 10,
      offsetBottomMargin: 50,

      width: 120,
      widthMin: 120,
      widthMax: 200,

      height: 184,

      lineSpacing: 6,
      lineHeight: 18,

      margin: 12,

      valueOffset: 50,
    };
    ctx.font = WEBRCP.utils.colorManager.getFont("title");
    var fontSize = /(\d*)px/.exec(ctx.font)?.[1] ?? "14";
    cfg.lineHeight = parseInt(String(fontSize), 10);
    var lc = tip.values.length;
    cfg.height =
      2 * cfg.margin +
      lc * (cfg.lineHeight + cfg.lineSpacing) +
      3 * cfg.lineHeight +
      3 * cfg.lineSpacing;

    var titleSize = ctx.measureText(tip.title).width;
    cfg.width = newSize(titleSize + 2 * cfg.margin, cfg.width, cfg.widthMax);

    var dateSize = ctx.measureText(tip.date).width;
    cfg.width = newSize(dateSize + 2 * cfg.margin, cfg.width, cfg.widthMax);

    var lw = 0;
    var vw = 0;
    for (var i in tip.values) {
      const rowValue = tip.values[i].value;
      const hasInlineValue =
        rowValue !== null && rowValue !== undefined && String(rowValue).length > 0;

      if (!hasInlineValue) {
        const inlineWidth = ctx.measureText(String(tip.values[i].label)).width;
        lw = inlineWidth > lw ? inlineWidth : lw;
        continue;
      }

      var _lw = ctx.measureText(tip.values[i].label).width;
      lw = _lw > lw ? _lw : lw;
      var v = getValue(rowValue, tip.values[i].precision);

      var _vw = measurePriceTextWidth({
        text: v,
        ctx,
        zerosToReduce: controller.renderer.getPriceRenderingOptions().zerosToReduce,
      });
      vw = _vw > vw ? _vw : vw;
    }
    var valueWidth = vw > 0 ? lw + ctx.measureText(" : ").width + vw : lw;
    cfg.width = newSize(valueWidth + 2 * cfg.margin, cfg.width, cfg.widthMax);
    cfg.valueOffset = lw + ctx.measureText(" : ").width;
    //cfg.valueOffset = cfg.valueOffset < (cfg.width/2-cfg.margin) ? cfg.width/2-cfg.margin :  cfg.valueOffset;

    //set valid position for new dimension
    calculateOffset(x, y, cfg, model);

    const colorManager = WEBRCP.utils.colorManager;
    const tipBackground = colorManager.getColor("tipBackground");
    const tipBorder = colorManager.getColor("tipBorder", colorManager.getColor("gridColor"));
    const tipShadow = colorManager.getColor("tipShadow", "rgba(0, 0, 0, 0.35)");
    const tipTitleColor = colorManager.getColor("tipTitleColor", colorManager.getColor("tipTextColor"));
    const tipTextColor = colorManager.getColor("tipTextColor");
    const tipLabelColor = colorManager.getColor("tipLabelColor", tipTextColor);
    const tipUnderlineColor = colorManager.getColor("tipUnderline");

    const boxX = x + cfg.offsetX;
    const boxY = y + cfg.offsetY;

    ctx.save();
    ctx.shadowColor = tipShadow;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    fillRoundedTooltipRect(ctx, boxX, boxY, cfg.width, cfg.height, 6);
    ctx.fillStyle = tipBackground;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = tipBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    let txtX = boxX + cfg.margin;
    let txtY = boxY + cfg.margin + cfg.lineHeight;

    ctx.font = colorManager.getFont("title");
    ctx.fillStyle = tipTitleColor;
    ctx.fillText(tip.title, txtX, txtY);

    ctx.font = colorManager.getFont("text");
    ctx.fillStyle = tipTextColor;

    txtY += cfg.lineSpacing + cfg.lineHeight / 2;
    strokeTooltipDivider(ctx, txtX, txtY, boxX + cfg.width - cfg.margin, tipUnderlineColor);
    txtY += cfg.lineSpacing + cfg.lineHeight;
    ctx.fillText(tip.date, txtX, txtY);

    txtY += cfg.lineSpacing + cfg.lineHeight / 2;
    strokeTooltipDivider(ctx, txtX, txtY, boxX + cfg.width - cfg.margin, tipUnderlineColor);

    for (var i in tip.values) {
      ctx.font = colorManager.getFont("text");
      txtY += cfg.lineSpacing + cfg.lineHeight;

      const rowValue = tip.values[i].value;
      const rowLabel = tip.values[i].label;
      const hasInlineValue =
        rowValue !== null && rowValue !== undefined && String(rowValue).length > 0;

      if (!hasInlineValue) {
        ctx.fillStyle = tipLabelColor;
        ctx.fillText(String(rowLabel), txtX, txtY);
        continue;
      }

      ctx.fillStyle = tipLabelColor;
      ctx.fillText(rowLabel + " : ", txtX, txtY);
      let zerosToReduce = controller.renderer.getPriceRenderingOptions().zerosToReduce;
      const precision = tip.values[i].precision;

      if (precision !== null && precision !== undefined) {
        zerosToReduce = 0;
      }

      var v = getValue(rowValue, precision);
      var valueX =
        txtX +
        cfg.width -
        2 * cfg.margin -
        measurePriceTextWidth({
          text: v,
          ctx,
          zerosToReduce: controller.renderer.getPriceRenderingOptions().zerosToReduce,
        });
      ctx.fillStyle = tipTextColor;
      renderPriceText({ text: v, ctx, x: valueX, y: txtY, zerosToReduce: zerosToReduce });
    }

    function calculateOffset(x: number, y: number, cfg: TooltipLayout, model: CoreChartModel) {
      var dY = model._height - cfg.offsetBottomMargin - (y + cfg.offsetY + cfg.height);
      if (dY < 0) cfg.offsetY += dY;

      var dX = model._width - (x + cfg.offsetX + cfg.width);
      if (dX < 0) cfg.offsetX += dX;
    }

    function newSize(w: number, min: number, max: number) {
      if (w < min) return min;
      if (w < max) return w;
      return max;
    }

    function formatNumber(n: number, precision?: number | null) {
      if (precision == null || precision === undefined) {
        precision = tip.precision;
      }
      if (n == 0) return "0";

      if (n > 999999) return LIB.nFormatter(n, precision ?? tip.precision ?? 0);
      else return n.toFixed(precision ?? tip.precision ?? 0);
    }
  }
}

// ****************************************************** //
// ******************* CROSSHAIR TOOL ******************* //
// ****************************************************** //

function CrosshairTool(this: CoreInteractionMode, interactor: CoreInteractor) {
  this.symbol = "CROSSHAIR";
  this.interactor = interactor;
  this.color = WEBRCP.utils.colorManager.getColor("crosshairColor");
  this.textColor = WEBRCP.utils.colorManager.getColor("crosshairTextColor");
  this.innerTextColor = WEBRCP.utils.colorManager.getColor("crosshairInnerTextColor");
  this.innerColor = WEBRCP.utils.colorManager.getColor("crosshairInnerColor");
  this.allowSwipe = false;

  this.cursor = "crosshair";
  this.cursorOverObject = "pointer";
  this.cursorOnDrag = "crosshair";

  this.onMouseDown = function (e) {
    this.startEvent = e;
    this.finishEvent = null;

    const eventOffset = this.interactor.getEventOffset(e);
    if (!this.interactor.isAboveValueAxis(e)) {
      this.interactor.currentHitObject = this.interactor.getCurrentHitObject(
        eventOffset.offsetX,
        eventOffset.offsetY,
      );
    }

    if (this.interactor.currentHitObject != null) {
      this.interactor.select(this.interactor.currentHitObject);
      this.interactor.currentAnchor = this.interactor.controller.renderer.objects[
        this.interactor.currentHitObject.type
      ].mouseDown(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
      if (this.interactor.currentAnchor == null) {
        this.interactor.controller.repaint();
      }
    } else {
      this.interactor.deselectAll();
      this.interactor.controller.repaint(false);
    }
  };

  this.onMouseUp = function (e) {
    if (isTouchEnvironment()) {
      this.finishEvent = e;

      if (this.interactor.currentHitObject != null) {
        this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(
          e,
          this.interactor.currentHitObject,
          this.interactor.controller.renderer,
          this.interactor,
          this.interactor.model,
          this.interactor.currentPanel,
          this.interactor.fusion.getSeriesManager()
        );
      }

      this.interactor.controller.renderOverlay();
      return;
    }

    this.finishEvent = null;

    if (this.interactor.currentHitObject != null) {
      this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    } else {
      this.interactor.chart.style.cursor = "";
    }
  };

  this.onMouseMove = function (e) {
    this.finishEvent = e;
    var eo = this.interactor.getEventOffset(e);

    this.interactor.currentHitObject = this.interactor.getCurrentHitObject(eo.offsetX, eo.offsetY);
    if (this.interactor.currentHitObject != null) {
      if (this.interactor.chart.style.cursor != this.interactor.currentMode.cursorOverObject) {
        this.interactor.chart.style.cursor = this.interactor.currentMode.cursorOverObject;
      }

      if (
        this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove
      ) {
        this.interactor.controller.renderer.objects[
          this.interactor.currentHitObject.type
        ].mouseMove(
          e,
          this.interactor.currentHitObject,
          this.interactor.controller.renderer,
          this.interactor,
          this.interactor.model,
          this.interactor.currentPanel,
          this.interactor.fusion.getSeriesManager()
        );
      }
    } else {
      if (this.interactor.chart.style.cursor != this.cursor) {
        this.interactor.chart.style.cursor = this.cursor;
      }
    }
  };

  this.onMouseDrag = function (e) {
    this.startEvent = this.interactor.initialMouseEvent;
    this.finishEvent = e;
  };

  this.onRightMouseDrag = function (e) {
    this.startEvent = this.interactor.initialMouseEvent;
    this.finishEvent = e;
  };

  this.onMouseOut = function (e) {
    if (isTouchEnvironment()) {
      return;
    }

    if (this.interactor.currentHitObject != null) {
      this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseOut(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    }
  };

  this.keyDown = function (key) {
    void key;
  };

  this.render = function (ctx) {
    void ctx;
  };

  this.renderOverlay = function (octx) {
    if (
      (this.interactor.isMouseDown == true || this.interactor.isRightButtonDrag == true) &&
      this.renderDn &&
      this.startEvent &&
      this.finishEvent
    )
      this.renderDn(octx, this.startEvent, this.finishEvent);
    else if (this.renderUp && this.finishEvent) this.renderUp(octx, this.finishEvent);
  };

  this.renderUp = function (ctx, e) {
    if (!e) return;

    const self = this;
    const panel = this.interactor.getPanel(e.offsetY);
    const model = this.interactor.model;
    const eventOffset = this.interactor.getEventOffset(e);
    const y = roundAndTranslate(eventOffset.offsetY);
    const x = roundAndTranslate(eventOffset.offsetX);
    let valueY = undefined;

    if (panel) {
      valueY = this.interactor.controller.renderer.getPriceForYCoordinate(y - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      });
    }

    ctx.save();
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("accent");
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    ctx.moveTo(0, y);
    ctx.lineTo(
      model._width - this.interactor.controller.renderer.getPriceRenderingOptions().valueAxisWidth,
      y
    );
    ctx.moveTo(x, 0);
    ctx.lineTo(x, model._height - model.timeAxisHeight);
    ctx.stroke();

    ctx.restore();

    if (panel && valueY && y) {
      self.interactor.controller.renderer.drawPriceTag(
        ctx,
        self.interactor.model,
        panel,
        y,
        self.color,
        self.textColor,
        valueY
      );
    }

    self.interactor.controller.renderer.drawTimeTag(
      ctx,
      self.interactor.model,
      x,
      self.color,
      self.textColor,
      self.interactor.fusion
    );
  };

  this.renderDn = function (ctx, i, e) {
    if (!i || !e) return;

    var io = this.interactor.getEventOffset(i);
    var eo = this.interactor.getEventOffset(e);

    var self = this;
    var panel = this.interactor.getPanel(io.offsetY);
    var panel2 = this.interactor.getPanel(eo.offsetY);
    var model = this.interactor.model;
    var v1 = undefined;
    var v2 = undefined;
    var y1 = io.offsetY;
    var y2 = eo.offsetY;

    const valueAxisWidth =
      this.interactor.controller.renderer.getPriceRenderingOptions().valueAxisWidth;

    if (panel && panel2 && panel.id == panel2.id) {
      v1 = this.interactor.controller.renderer.getPriceForYCoordinate(io.offsetY - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      });
      v2 = this.interactor.controller.renderer.getPriceForYCoordinate(eo.offsetY - panel._offset, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      });
    }

    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("accent");
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    ctx.moveTo(0, eo.offsetY);
    ctx.lineTo(model._width - valueAxisWidth, eo.offsetY);
    ctx.moveTo(eo.offsetX, 0);
    ctx.lineTo(eo.offsetX, model._height - model.timeAxisHeight);

    ctx.moveTo(0, io.offsetY);
    ctx.lineTo(model._width - valueAxisWidth, io.offsetY);
    ctx.moveTo(io.offsetX, 0);
    ctx.lineTo(io.offsetX, model._height - model.timeAxisHeight);
    ctx.stroke();

    // ctx.drawImage(self.vCross[0], 0, 0, 1, model._height - model.timeAxisHeight + 8, io.offsetX, 0, 1, model._height - model.timeAxisHeight/2 - 2);
    // ctx.drawImage(self.hCross[0], 0, io.offsetY);
    // ctx.drawImage(self.vCross[0], 0, 0, 1, model._height - model.timeAxisHeight + 8, eo.offsetX, 0, 1, model._height - model.timeAxisHeight/2 - 2);
    // ctx.drawImage(self.hCross[0], 0, eo.offsetY);
    if (panel && panel2 && panel.id == panel2.id && y1 && y2 && v1 && v2) {
      self.interactor.controller.renderer.drawDoublePriceTag(
        ctx,
        model,
        panel,
        y1,
        y2,
        self.color,
        self.textColor,
        self.innerColor,
        self.innerTextColor,
        v1,
        v2
      );
    }
    self.interactor.controller.renderer.drawDoubleTimeTag(
      ctx,
      model,
      io.offsetX,
      eo.offsetX,
      self.color,
      self.textColor,
      self.interactor.fusion
    );
  };
}

// **************************************************** //
// ******************* ZOOMBOX TOOL ******************* //
// **************************************************** //

function ZoomBoxTool(this: CoreInteractionMode, interactor: CoreInteractor) {
  this.symbol = "ZOOMBOX";
  this.interactor = interactor;
  this.color = WEBRCP.utils.colorManager.getColor("defaultToolColor");
  this.textColor = WEBRCP.utils.colorManager.getColor("defaultToolTextColor");

  this.cursor = "zoom-in";
  this.cursorOverObject = "zoom-in";
  this.cursorOnDrag = "crosshair";

  this.startEvent = null;
  this.finishEvent = null;

  this.allowSwipe = false;

  this.onMouseDown = function (e) {
    this.startEvent = e;
    this.finishEvent = null;
  };

  this.onMouseUp = function (e) {
    void e;
    this.interactor.clearOverlay();

    var startEventO = this.interactor.getEventOffset(this.startEvent);
    var finishEventO = this.interactor.getEventOffset(this.finishEvent);

    var p1 = { x: startEventO.offsetX, y: startEventO.offsetY };
    var p2 = { x: finishEventO.offsetX, y: finishEventO.offsetY };

    zoomIn(this.interactor, p1, p2);
    this.finishEvent = null;

    this.interactor.setMode("DEFAULT");

    function zoomIn(
      interactor: CoreInteractor,
      p1: { x: number; y: number },
      p2: { x: number; y: number }
    ) {
      var index1 = interactor.controller.renderer.getPointIndex(p1.x, interactor.chart.model);
      var index2 = interactor.controller.renderer.getPointIndex(p2.x, interactor.chart.model);
      if (index1 < index2) interactor.chart.setLeftRightIndex(index1, index2);
      else if (index1 > index2) interactor.chart.setLeftRightIndex(index2, index1);

      interactor.chart.fit();
      interactor.controller.render();
    }
  };

  this.onMouseMove = function (e) {
    void e;
    if (this.interactor.chart.style.cursor != this.cursor) {
      this.interactor.chart.style.cursor = this.cursor;
    }
  };

  this.onMouseDrag = function (e) {
    this.finishEvent = e;
    this.interactor.currentMode.render(this.interactor.octx, this.interactor.initialMouseEvent, e);
  };

  this.onRightMouseDrag = function (e) {
    this.finishEvent = e;
    this.interactor.currentMode.render(this.interactor.octx, this.interactor.initialMouseEvent, e);
  };

  this.onMouseOut = function (e) {
    void e;
  };

  this.keyDown = function (key) {
    void key;
  };

  this.render = function (ctx) {
    void ctx;
  };

  this.renderOverlay = function (ctx) {
    var self = this;

    this.interactor.controller.doFrame(function () {
      if (self.startEvent && self.finishEvent) {
        var startEventO = self.interactor.getEventOffset(self.startEvent);
        var finishEventO = self.interactor.getEventOffset(self.finishEvent);

        self.interactor.clearOverlay();
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = self.color;
        ctx.rect(
          startEventO.offsetX,
          startEventO.offsetY,
          finishEventO.offsetX - startEventO.offsetX,
          finishEventO.offsetY - startEventO.offsetY
        );
        ctx.stroke();
      }
    });
  };
}

// ************************************************** //
// ******************* STAGE TOOL ******************* //
// ************************************************** //

function StageTool(
  this: CoreInteractionMode,
  interactor: CoreInteractor,
  tool: ChartRuntimeObject,
  onFinished?: () => void
) {
  this.symbol = "STAGING";
  this.cursor = "pointer";
  this.cursorOverObject = "crosshair";
  this.cursorOnDrag = "crosshair";
  this.allowSwipe = false;
  this.color = WEBRCP.utils.colorManager.getColor("defaultToolColor");
  this.textColor = WEBRCP.utils.colorManager.getColor("defaultToolTextColor");

  this.interactor = interactor;
  this.renderer = this.interactor.controller.renderer;
  this.model = this.interactor.model;
  this.tool = this.renderer.objects[tool.type];
  this.onFinished = onFinished;
  this.currentStep = 0;

  this.interactor.currentStagingObject = JSON.parse(JSON.stringify(tool));
  this.interactor.currentStagingObject.id = createFusionUniqueId();
  if (this.interactor.currentStagingObject.type === "longShortPosition") {
    const staging = this.interactor.currentStagingObject;
    staging._placementStep = 0;
    if (!Array.isArray(staging.anchors)) {
      staging.anchors = [];
    }
    const anchorDefaults = [
      { stamp: 0, offset: 0, value: 0, _index: 0 },
      {
        stamp: 0,
        offset: 0,
        value: 0,
        _index: 0,
        expandable: true,
        defaultDirection: "right",
      },
      {
        stamp: 0,
        offset: 0,
        value: 0,
        _index: 0,
        expandable: true,
        defaultDirection: "left",
      },
    ];
    for (let index = 0; index < 3; index += 1) {
      if (!staging.anchors[index]) {
        staging.anchors[index] = anchorDefaults[index];
      }
    }
  }
  this.interactor.currentStagingObject._isStaging = true;
  this.interactor.currentAnchor = null;
  this.interactor.deselectAll();
  this.interactor.currentSelectedObject = this.interactor.currentStagingObject;
  this.interactor.currentStagingObject.selected = true;

  if (tool.type === "brush") {
    this.cursor = "crosshair";
    this.cursorOverObject = "crosshair";
    this.cursorOnDrag = "crosshair";
  }

  // ************************************************** //

  this.onCancel = function () {
    this.cancelled = true;
    this.currentStep = 0;

    this.interactor.currentStagingObject = null;
    this.interactor.currentAnchor = null;
    this.interactor.setMode("DEFAULT");
  };

  this.finalizeStagingPlacement = function (e) {
    if (this.cancelled) return false;
    if (!this.interactor.currentStagingObject) return false;
    if (!this.tool?.stageUp) return false;

    const isStageCompleted = this.tool.stageUp(
      e,
      this.interactor.currentStagingObject,
      this.renderer,
      this.interactor,
      this.model,
      this.interactor.currentPanel,
      this.interactor.fusion.getSeriesManager(),
    ) as boolean | void;

    if (!isStageCompleted) return false;

    const completed = this.interactor.currentStagingObject;
    delete completed._isStaging;

    const eventOffset = this.interactor.getEventOffset(e);
    const targetPanel =
      this.interactor.currentPanel ??
      this.interactor.getPanel(eventOffset.offsetY) ??
      this.interactor.getMainPanel();

    if (!targetPanel) {
      this.interactor.currentStagingObject = null;
      this.currentStep = 0;
      this.interactor.setMode("DEFAULT");
      return false;
    }

    this.interactor.currentPanel = targetPanel;
    targetPanel.objects.push(completed);

    const completedRenderer = this.renderer.objects[completed.type];
    if (completedRenderer?.push) {
      completedRenderer.push(
        completed,
        this.renderer,
        this.model,
        this.interactor.fusion.getSeriesManager(),
      );
    }

    if (completed.type === "mLine") {
      this.interactor.suppressDrawingEditDoubleClick = true;
    }

    this.interactor.currentStagingObject = null;
    this.currentAnchor = null;
    this.currentStep = 0;
    this.interactor.select(completed);
    this.interactor.setMode("DEFAULT");
    this.interactor.controller.onDrawingDone();

    if (typeof this.onFinished === "function") {
      this.onFinished();
    }

    this.interactor.controller.render();
    this.interactor.controller.renderOverlay();
    return true;
  };

  this.onMouseDown = function (e) {
    if (this.cancelled) return;
    this.interactor.setObjectSelectionAllowed(true);

    const eventOffset = this.interactor.getEventOffset(e);
    const resolvedPanel =
      this.interactor.getPanel(eventOffset.offsetY) ?? this.interactor.currentPanel;

    if (resolvedPanel) {
      this.interactor.currentPanel = resolvedPanel;
    }

    if (this.tool && this.tool.stageDown) {
      this.currentStep++;

      this.interactor.currentAnchor = this.tool.stageDown(
        e,
        this.interactor.currentStagingObject,
        this.renderer,
        this.interactor,
        this.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager(),
      ) as CoreInteractor["currentAnchor"];
    }
  };

  this.onMouseUp = function (e) {
    if (this.cancelled) return;
    if (!this.interactor.currentStagingObject) return;

    if (this.interactor.isRightMouseButton(e)) this.interactor.allowContextMenu = false;

    this.finalizeStagingPlacement(e);
  };

  this.onMouseMove = function (e) {
    if (this.cancelled) return;

    if (this.tool && this.tool.stageMove) {
      this.tool.stageMove(
        e,
        this.interactor.currentStagingObject,
        this.renderer,
        this.interactor,
        this.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    }
  };

  this.onMouseDrag = function (e) {
    if (this.cancelled) return;

    if (this.tool && this.tool.stageDrag) {
      this.tool.stageDrag(
        e,
        this.interactor.currentStagingObject,
        this.renderer,
        this.interactor,
        this.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    }
  };

  this.onMouseOut = function (e) {
    if (this.cancelled) return;

    if (this.tool && this.tool.stageOut) {
      this.tool.stageOut(
        e,
        this.interactor.currentStagingObject,
        this.renderer,
        this.interactor,
        this.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    }
  };

  this.renderOverlay = function (context) {
    if (!this.tool || !this.interactor.currentStagingObject) return;

    const stagingObject = this.interactor.currentStagingObject;
    const panel = this.interactor.currentPanel;
    const seriesManager = this.interactor.fusion.getSeriesManager();

    this.tool.render(stagingObject, context, this.renderer, this.model, panel, seriesManager);

    if (this.tool.renderOverlay) {
      this.tool.renderOverlay(
        stagingObject,
        context,
        this.renderer,
        this.model,
        panel,
        seriesManager,
      );
    }
  };

  this.keyDown = function (key) {
    void key;
  };
  this.onRightMouseDrag = function (e) {
    void e;
  };
  this.render = function (ctx) {
    void ctx;
  };
}

// ****************************************************** //
// ******************* ERASER TOOL ********************** //
// ****************************************************** //

function EraserTool(this: CoreInteractionMode, interactor: CoreInteractor) {
  this.symbol = "ERASER";
  this.interactor = interactor;
  this.allowSwipe = true;

  this.cursor = "no-drop";
  this.cursorOverObject = "pointer";
  this.cursorOnDrag = "no-drop";

  this.onMouseDown = function (e) {
    this.startEvent = e;
    this.finishEvent = null;

    if (this.interactor.currentHitObject != null) {
      this.interactor.controller.onDelete(this.interactor.currentHitObject.id);
      // this.interactor.select(this.interactor.currentHitObject);
      // this.interactor.currentAnchor = this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseDown(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
      // if (this.interactor.currentAnchor==null) {
      // 	this.interactor.controller.repaint();
      // }
    } else {
      this.interactor.deselectAll();
      this.interactor.controller.repaint(false);
    }
  };

  this.onMouseUp = function (e) {
    this.finishEvent = null;

    if (this.interactor.currentHitObject != null) {
      this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    } else {
      this.interactor.chart.style.cursor = "";
    }
  };

  this.onMouseMove = function (e) {
    this.finishEvent = e;
    var eo = this.interactor.getEventOffset(e);

    this.interactor.currentHitObject = this.interactor.getCurrentHitObject(eo.offsetX, eo.offsetY);
    if (this.interactor.isAboveValueAxis(e)) {
      this.interactor.currentHitObject = null;
      this.interactor.chart.style.cursor = "ns-resize";
    } else if (this.interactor.currentHitObject != null) {
      if (this.interactor.chart.style.cursor != this.interactor.currentMode.cursorOverObject) {
        this.interactor.chart.style.cursor = this.interactor.currentMode.cursorOverObject;
      }

      if (
        this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove
      ) {
        this.interactor.controller.renderer.objects[
          this.interactor.currentHitObject.type
        ].mouseMove(
          e,
          this.interactor.currentHitObject,
          this.interactor.controller.renderer,
          this.interactor,
          this.interactor.model,
          this.interactor.currentPanel,
          this.interactor.fusion.getSeriesManager()
        );
      }
    } else {
      if (this.interactor.chart.style.cursor != this.cursor) {
        this.interactor.chart.style.cursor = this.cursor;
      }
    }
  };

  this.onMouseDrag = function (e) {
    this.startEvent = this.interactor.initialMouseEvent;
    this.finishEvent = e;

    if (this.interactor.currentHandler > -1) return this.interactor.onDragHandler(e);
    if (this.interactor.currentHitObject != null) return this.interactor.onDragObject(e);

    return this.interactor.onPan(e);
  };

  this.onRightMouseDrag = function (e) {
    this.startEvent = this.interactor.initialMouseEvent;
    this.finishEvent = e;
  };

  this.onMouseOut = function (e) {
    if (this.interactor.currentHitObject != null) {
      this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseOut(
        e,
        this.interactor.currentHitObject,
        this.interactor.controller.renderer,
        this.interactor,
        this.interactor.model,
        this.interactor.currentPanel,
        this.interactor.fusion.getSeriesManager()
      );
    }
  };

  this.keyDown = function (key) {
    void key;
  };
  this.render = function (ctx) {
    void ctx;
  };
  this.renderOverlay = function (octx) {
    void octx;
  };
  this.renderUp = function (ctx, e) {
    void ctx;
    void e;
  };
  this.renderDn = function (ctx, i, e) {
    void ctx;
    void i;
    void e;
  };
}

export default InteractionsController;

//# sourceURL=./platform/components/newchart/js/interactions.js
