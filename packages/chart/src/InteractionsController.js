import WEBRCP from "./WebRCP";
import FUSION from "./fusion";
import LIB from "./utils/chartingCommons";
import { Shape } from './Objects2'
import { Series } from './Objects'
import { isSmallScreen, isTouchDevice, hitTolerance } from "./utils/environment";
import Hammer from "./lib/hammer.min.js"
import { renderPriceText, measurePriceTextWidth, roundAndTranslate } from "./utils/objects-lib";

var InteractionsController	=	function (chart, canvas, overlay, model, renderer, topLayer, config, fusion, controller) {
	var self = this;
	this.chart = chart;
	this.currentMode = new DefaultTool(this);
	this.topLayer = topLayer;
	this.config = config;
	this.fusion = fusion;
	this.controller = controller;

	this.currentViewportLeft = 0;
	this.initialMouseEvent = 0;
	this.isMouseDown = false;
	this.isRightButton = false;

	this.allowContextMenu = true;
	this.currentHandler = -1;
	this.initialOffsets = [];

	this.ctx = canvas.getContext('2d');
	this.octx = overlay.getContext('2d');
	this.body = document.getElementsByTagName('body')[0];

	this.currentHitObject = null;
	this.currentPanel = null;
	this.currentAnchor = null;
	this.currentSelectedObject = null;
	this.valueAxisClicked = false;
	this.currentStagingObject = null;
	this.model = model;
	this.renderer = renderer;
	this.isObjectSelectionAllowed = true;

	this.pinch = { trackedIndex: null, leftGrabbedIndex: null, rightGrabbedIndex: null };
	this.swipe = {
			configuration: {
				velocity: {
					multiplier: 20,
					minValue: 0.01,
					dampingFactor: 0.03
				}
			},
			hook: {}
	};

	this.doFrame = function (callback) {
		var self = this;

		window.cancelAnimationFrame(this.currentAnimationFrame);
		this.currentAnimationFrame = window.requestAnimationFrame(function () {
			callback.call(self);
		});
	}
	
	function bindDomEvents(){
		self.topLayer.addEventListener('wheel', self.triggerWheelCallback)
		self.topLayer.classList.add("context-menu-topLayer"); //this class is base to bind CONTEXT MENU

		if (isTouchDevice()) {
			self.topLayer.addEventListener('touchstart', self.onTouchEvent);
			self.topLayer.addEventListener('touchend', self.onTouchEvent);
			self.topLayer.addEventListener('touchcancel', self.onTouchEvent);

			self.hammer = new Hammer(self.topLayer, {});

			self.hammer.get('press').set({ time: 500 });
			self.hammer.on('press', function (evt) {
				self.onContextMenu(evt);
			});

			self.hammer.on('touch', self.onTouchEvent);

			self.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
			self.hammer.on('pan', self.onTouchEvent);

			self.hammer.get('pinch').set({ enable: true });
			self.hammer.on('pinch pinchstart pinchend', self.onPinch);

			self.hammer.on('swipe', self.onSwipe);
		}

		if (!isTouchDevice()) {
			self.topLayer.addEventListener('mousedown', self.onMouseDown);
			self.topLayer.addEventListener('mouseup', self.onMouseLeftUp);

			self.body.addEventListener('mouseup', self.onBodyMouseUp);
			self.body.addEventListener('mouseout', self.onBodyMouseOut);
			self.body.addEventListener('mousemove', self.onBodyMouseMove);

			self.topLayer.addEventListener('contextmenu', function (evt) {evt.preventDefault(); return true;});

			self.hammer = new Hammer(self.topLayer, {});
			self.hammer.on('swipe', function (evt) {
				self.onSwipe(evt);
			});
		}

		self.body.addEventListener("keyup", (event) => {
			self.onKeyUp(event);
		});

		self.body.addEventListener("keydown", (event) => {
			self.onKeyDown(event);
		});

		// $(document).keydown(function(e){
		// 	self.onKeyDown(e);
		// });
	};

	this.offDOMEvents = function(){
		self.topLayer.removeEventListener('wheel', self.triggerWheelCallback)

		if (!isTouchDevice()) {
			self.topLayer.removeEventListener('mouseDown', self.onMouseDown);
			self.topLayer.removeEventListener('mouseUp', self.onMouseLeftUp);

			self.body.removeEventListener('mouseup', self.onBodyMouseUp);
			self.body.removeEventListener('mouseout', self.onBodyMouseOut);
			self.body.removeEventListener('mousemove', self.onBodyMouseMove);
		}

		if (isTouchDevice()) {
			self.topLayer.removeEventListener('touchstart', self.onTouchEvent);
			self.topLayer.removeEventListener('touchend', self.onTouchEvent);
			self.topLayer.removeEventListener('touchcancel', self.onTouchEvent);

			self.hammer.off('touch', self.onTouchEvent);
			self.hammer.off('pan', self.onTouchEvent);
			self.hammer.off('pinch pinchstart pinchend', self.onPinch);
			self.hammer.off('swipe', self.onSwipe);
		}
	};

	this.onTouchEvent =	function (evt) {
		self.body.click();

		const touches = evt.changedTouches ? evt.changedTouches : evt.changedPointers;
		let touchEvent;

		if (touches.length > 0) {
			const ox = touches[0].pageX - window.scrollX;
			const oy = touches[0].pageY - window.scrollY;
			// identifier on ios safari has different values like -871896472
			let which = evt.changedPointers ? evt.changedPointers[0].pointerId : touches[0].identifier;

			touchEvent = {
				clientX: ox,
				clientY: oy,
				offsetX: ox,
				offsetY: oy,
				which: which,
				isPrimary: touches[0].isPrimary || touches[0].identifier === self.initialMouseEvent?.which
			}
		}

		switch (evt.type) {
			case 'touchstart': // previously mousedown
				self.onMouseDown(touchEvent);
				break;
			case 'pan': // previously mousemove
				self.onMouseMove(touchEvent, evt);
				break;
			case 'touchend': // previously mouseup
				self.onMouseUp(touchEvent, evt);
				self.body.click();
				break;
			case 'touchcancel': // previously mouseout
				self.onMouseOut(touchEvent);
				break;
		}

		evt.preventDefault();
	};

	this.registerObjectAsIdicator = function(o){
		var scriptKey = 'OBJECT';
		var script = FUSION.getScript('OBJECT');
		var os =this.chart. getObjectsForIndicator();
		var panels = false
		FUSION.dialogs.script.show({key: scriptKey, config: null}, onApply, onCancel, this.fusion, panels, os, WEBRCP.locale.fusion);
		function onCancel(){
			FUSION.dialogs.script.hide();
		}
		function onApply(scriptConfig){
			chart.onScriptEditorApply(scriptConfig);
			FUSION.dialogs.script.hide();
		}
	};

	this.unregisterObjectAsIdicator = function(o){
		var scriptKey = 'OBJECT';

		for(var i in this.model.scripts){
			var script  =  this.model.scripts[i];
			if(script['key'] == scriptKey){
				if(o.id == script.inputs['OBJECT'].id){
					var ps = LIB.getPlottersForScriptByScriptId(this.model, script.id);
					this.chart.detachObject(ps[0].id);
					var o = LIB.getObjectById(this.model, o.id);
					o.isIndicator = false;
				}
			}
		}
		self.controller.chartStructureChanged();
	};

	this.onPinch = function (event) {
		self.body.click()
		if (self.controller.isChartEmpty(self.chart)) return;
		event.preventDefault();
		if (self.currentHitObject) self.currentHitObject.isBeingDragged = false;
		self.isMouseDown = false;
		self.deselectAll();
		self.initialMouseEvent = null;
		self.startEvent = null;
		
		clearInterval(self.swipe.hook);

		var rect = event.target.getBoundingClientRect();
		event.center['offsetX'] = event.center.x - rect.left;
		event.center['offsetY'] = event.center.y - rect.top;

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
			pageY: startEvent.pageY
		}

		const rightGrabbed = {
			offsetX: endEvent.pageX - rect.left,
			offsetY: endEvent.pageY - rect.top,
			pageX: endEvent.pageX,
			pageY: endEvent.pageY
		}

		if (event.type == 'pinch') {
			self.controller.doFrame(function () {
				// this refers to chart
				const minPeriodWidth = this.getMinPeriodWidth();
				const maxPeriodWidth = this.model._width / 2;

				const trackedPoint = event.center.offsetX;
				if (self.pinch.trackedIndex == null)
					self.pinch.trackedIndex = this.renderer.getPointIndex(trackedPoint, this.model);
				if (self.pinch.leftGrabbedIndex == null)
					self.pinch.leftGrabbedIndex = this.renderer.getPointIndex(leftGrabbed.offsetX, this.model);
				if (self.pinch.rightGrabbedIndex == null)
					self.pinch.rightGrabbedIndex = this.renderer.getPointIndex(rightGrabbed.offsetX, this.model);
				const grabbedCandlesCount = self.pinch.rightGrabbedIndex - self.pinch.leftGrabbedIndex;

				const grabbedWidth = rightGrabbed.pageX - leftGrabbed.pageX;
				const newPeriodWidth = (grabbedWidth / grabbedCandlesCount);

				if (newPeriodWidth >= minPeriodWidth && newPeriodWidth <= maxPeriodWidth)
					this.model.periodWidth = newPeriodWidth;
				if (newPeriodWidth < minPeriodWidth)
					this.model.periodWidth = minPeriodWidth;
				if (newPeriodWidth > maxPeriodWidth)
					this.model.periodWidth = maxPeriodWidth;

				this.moveIndexToPoint(self.pinch.trackedIndex, trackedPoint);

				self.controller.rerender();
				// this.fit();
				// this.renderOverlay();
				// this.render();
			}.bind(self));
		}

		if (event.type == 'pinchstart') {
			self.pinch.trackedIndex = null;
			self.pinch.leftGrabbedIndex = null;
			self.pinch.rightGrabbedIndex = null;
		}

		if (event.type == 'pinchend') {
			self.deselectAll();
			self.clearOverlay();
		}
	};
	
	this.onSwipe = function (event) {
		self.body.click()
		clearInterval(self.swipe.hook);

		if (self.currentHitObject) self.currentHitObject.isBeingDragged = false;
		self.isMouseDown = false;
		self.deselectAll();
		self.initialMouseEvent = null;
		self.startEvent = null;
		

		if(!self.currentMode.allowSwipe || self.model.periodWidth < 2) return;

		self.currentViewportLeft = self.model.viewportLeft;

		var pointer = event.pointers[0];

		var initialX = pointer.pageX;
		var velocityX = event.velocityX;
		var preCurrentX = initialX;
		var currentX = calculateOffset(initialX, velocityX);


		self.swipe.hook = setInterval(frame, 50);
		function frame() {

			var seriesLength = 0;
			if(
				self.model.instrumentsSeries.length >0 &&
				self.model.instrumentsSeries[0] &&
				self.fusion.getSeriesManager()[self.model.instrumentsSeries[0].seriesId].data
			){
				seriesLength = self.fusion.getSeriesManager()[self.model.instrumentsSeries[0].seriesId].data.length;
			}


			if (
				seriesLength == 0 ||
				Math.abs(velocityX) < self.swipe.configuration.velocity.minValue ||
				self.model._leftIndex <=0 ||
				self.model._leftIndex >= seriesLength-2
			){
				if(self.swipe.hook) clearInterval(self.swipe.hook);

			}else {

				var currentOffset = currentX - initialX;
				var offset = 0;

				if((self.currentViewportLeft-currentOffset) <= self.model.periodWidth*(seriesLength-1) &&
					(self.currentViewportLeft-currentOffset) > 0){

					offset = currentOffset;
					self.model.viewportLeft=self.currentViewportLeft-offset;
				}

				recalculateVelocity();
				preCurrentX = currentX;
				currentX = calculateOffset(currentX, velocityX);

				self.controller.fitAndRepaint();
			}
		}

		function calculateOffset(xPos, xVelocity) {
			return xPos + self.swipe.configuration.velocity.multiplier * xVelocity;
		}

		function recalculateVelocity() {
			velocityX *= (1.0 - self.swipe.configuration.velocity.dampingFactor);
		}
	};

	this.moveIndexToPoint =	function (index, x) { // index - candle index, x - canvas index from left
		// TODO: model manipulation here, we should refactor it
		var vpl = (this.model.periodWidth * index)-x; if (vpl<0) vpl = 0;
		this.model.viewportLeft = vpl;
	};

	this.onContextMenu		=	function (e) {
		return;
		self.body.click()
		if (!isTouchDevice()) e.preventDefault();
		if (this.model.mode=='plain') return;
		if (this.currentStagingObject) return;

		if (isTouchDevice()) {
			if (!e.pageX) {
				var touches = e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.changedPointers;
				e['pageX'] = touches[0].pageX;
				e['pageY'] = touches[0].pageY;

				var rect = e.srcEvent.target.getBoundingClientRect();
				var touch = touches[0];

				var ox = touch.pageX - rect.left;
				var oy = touch.pageY - rect.top;

				e['offsetX'] = ox;
				e['offsetY'] = oy;
			}
		}

		this.isRightButton = isTouchDevice() ? true : this.isRightMouseButton(e);

		if (this.allowContextMenu || isTouchDevice()) {
			// this.buildContextMenu(e);
			// this.topLayer.contextMenu({x: e.pageX, y: e.pageY});
		} else this.allowContextMenu = true;

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

	this.requestChartTitleAndShareChart = function(chart){
		var self = this;
		var content = $('<div></div>').simplePropertiesEditor({
			properties: {Title: "", Description: ""},
			locale: {Title: self.chart.options.locale.getMessage('title'), Description: self.chart.options.locale.getMessage('description')},
			inputClass: 'webrcp-input-big webrcp-input-darkblue'
		});
		var actions = [
			{
				myClass: (isSmallScreen) ? "webrcp-icon-arrow_back webrcp-dark-white webrcp-light-white" : "webrcp-dark-white webrcp-light-white webrcp-icon-close",
				title: '',
				callback: function() {
					this.dismiss();
				}
			},
			{
				title: self.chart.options.locale.getMessage('OK'),
				callback: function () {
					var props = content.simplePropertiesEditor('getValues');
					var data = {model: chart.model};
					data.thumbnail = chart.canvas.toDataURL();
					if(props['Title']) data.title = props['Title'];
					if(props['Description']) data.description = props['Description'];
					this.dismiss(true);
					WEBRCP.triggerQueueEvent("WEBRCP_SHARE_TO_SOCIAL_NETWORK", {content: data, type: 'chart'});
				}
			}
		];
		$('<div></div>')
			.addClass('webrcp-simple-edit-dialog')
			.rcpDialog({ 
				content: content,
				title: self.chart.options.locale.getMessage('menu_share_chart'),
				actions: actions,
				onShown: () => {
					content.simplePropertiesEditor('focus');
				}
			})
			.rcpDialog('showDialog', false);
	}

	this.requestChartTitleAndExportChart = function(chart){
		var self = this;
		var content = $('<div></div>').simplePropertiesEditor(
				{
					properties: {Title: "", Description: ""},
					locale: {Title: self.chart.options.locale.getMessage('title'), Description: self.chart.options.locale.getMessage('description')},
					inputClass: 'webrcp-input-big webrcp-input-darkblue'
				});
		var actions = 	[
		              		{
								myClass: (isSmallScreen) ? "webrcp-icon-arrow_back webrcp-dark-white webrcp-light-white" : "webrcp-dark-white webrcp-light-white webrcp-icon-close",
								title: '',
								callback: function() {
									this.dismiss();
								}
		              		},
		              		{
								title:self.chart.options.locale.getMessage('OK'),
								callback: function() {
									var props = content.simplePropertiesEditor('getValues');
									var data = {data: JSON.stringify(chart.model)};
									data.thumbnail = chart.canvas.toDataURL();
									if(props['Title']) data.title = props['Title'];
									if(props['Description']) data.description = props['Description'];
									// SERVICES.charts.sendChart(SERVICES.token, data,
									// 		function(rsp){
									// },
									// function(errorMessage){
									// 	console.error(errorMessage);
									// });
									this.dismiss();
								}
		              		}
		              	]
		var dialog = $('<div></div>')
			.addClass('webrcp-simple-edit-dialog')
			.rcpDialog({
				content: content,
				title: self.chart.options.locale.getMessage('menu_exportChart'),
				actions: actions,
				onShown: () => {
					content.simplePropertiesEditor('focus');
				}
			})
			.rcpDialog('showDialog', false);
	};

	this.requestTitleAndDescription = function (callback, quickHide) {
		quickHide === true ? quickHide = true : quickHide = false;

		var self = this;
		var content = $('<div></div>').simplePropertiesEditor(
			{
				properties: { Title: '', Description: '' },
				inputClass: 'webrcp-input-big webrcp-input-darkblue',
				locale: { Title: self.chart.options.locale.getMessage('title'), Description: self.chart.options.locale.getMessage('description') }
			});
		var actions = [
			{
				myClass: (isSmallScreen) ? "webrcp-icon-arrow_back webrcp-dark-white webrcp-light-white" : "webrcp-dark-white webrcp-light-white webrcp-icon-close",
				title: '',
				callback: function () {
					this.dismiss();
				}
			},
			{
				title: self.chart.options.locale.getMessage('OK'),
				callback: function () {
					var props = content.simplePropertiesEditor('getValues');
					var data = {};
					if (props['Title']) data.title = props['Title'];
					if (props['Description']) data.description = props['Description'];			
					this.dismiss(quickHide);
					callback(data);
				}
			}
		]
		var dialog = $('<div></div>')
			.addClass('webrcp-simple-edit-dialog')
			.rcpDialog({
				content: content,
				title: self.chart.options.locale.getMessage('menu_export_strategy'),
				actions: actions,
				onShown: () => {
					content.simplePropertiesEditor('focus');
				}
			});
		dialog.rcpDialog('showDialog', false);
	};

	this.requestStrategyTitleAndExportStrategy = function (strategy) {
		var sendStrategy = function (titleAndDescObject) {
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

		clearInterval(self.swipe.hook);

		WEBRCP.newChartLastFocus = self.chart;
		if (isTouchDevice()) {
			self.currentHandler = self.isOverHandler(e);
			if (self.currentHandler == -1) self.currentHitObject = self.getCurrentHitObject(e._offset.offsetX, e._offset.offsetY);
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
				min: panel.vMin
			};

		if (self.controller) self.controller.chartStructureChanged();

		if (self.isAboveValueAxis(e)) self.valueAxisClicked = true;
		else {
			self.valueAxisClicked = false;
			self.currentMode.onMouseDown(e);
			self.controller.renderOverlay();
		}
	};


	this.isRightMouseButton = function(e){
		var isRight = false;
		if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
			isRight = e.which == 3;
		else if ("button" in e)  // IE, Opera
			isRight = e.button == 2;
		return isRight;
	}

	this.onMouseLeftUp = function(e) {
		if (e.which === 2) { // left mouse key
			e.preventDefault();
			self.onMouseUp(e);
		}
	}

	this.onBodyMouseUp = function(evt) {
		if(evt.which !== 2){
			var eventElement = evt.toElement || evt.target || evt.target;

			// TODO: check if following code works properly
			if (eventElement.closest('.webrcp-chart-tools, .webrcp-new-chart, .exeria-watermark')) return;
			self.onMouseUp(evt);
		}
	}

	this.onMouseUp = function (e, evt) {
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

		if(e.which === 2){
			self.controller.onCrosshair();
			self.currentMode.onMouseUp(e);
			self.controller.renderOverlay();
			return;
		}

		e._offset = self.getEventOffset(e);

		var ctxMenu = self.isRightButton;

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

	this.onBodyMouseOut = function(evt) {
		var eventElement = evt.toElement || evt.target;

		// TODO: check if following code works properly
		if (eventElement.closest('.webrcp-chart-tools, .webrcp-new-chart, .exeria-watermark')) return;
		self.onMouseOut(evt);
	}

	this.onMouseOut			=	function (e) {
		if(self.controller.isChartEmpty(self.chart)) return;
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

	this.onBodyMouseMove = function(evt) {
		var eventElement = evt.toElement || evt.target;
		// TODO: check if following code works properly
		if (eventElement.closest('.webrcp-chart-tools, .webrcp-new-chart, .exeria-watermark')) return;
		self.onMouseMove(evt);
	}

	this.onMouseMove = function (e, evt) {
		if (e.isPrimary === false) return;
		if (this.controller.isChartEmpty(this.chart)) {
			this.chart.repaint(); 
			return;
		};

		e._offset = this.getEventOffset(e);
		if (this.isMouseDown && (this.isRightButton === false)) {
			return this.onMouseDrag(e, evt);
		}
		if (this.isMouseDown && this.isRightButton) return this.onRightMouseDrag(e);

		const path = e.path || (e.composedPath && e.composedPath());
		if (!path || !path[0] || path[0] !== this.topLayer) return;

		this.currentHandler = this.isOverHandler(e);

		if (this.currentHandler >- 1 && !this.currentStagingObject) {
			if (this.chart.style.cursor !== 'row-resize') {
				this.chart.style.cursor = 'row-resize';
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
		this.controller.renderOverlay()
	};

	this.onRightMouseDrag	=	function (e) {
		this.isRightButtonDrag = true;

		if (checkDragTolerance(this.initialMouseEvent, e, 3)) {
			this.allowContextMenu = false;
		}

		this.currentMode.onRightMouseDrag(e);
		this.controller.renderOverlay()
	};

	function checkDragTolerance(e1, e2, tolerance){
		return	Math.abs(e1.clientX - e2.clientX) >= tolerance || Math.abs(e1.clientY - e2.clientY) >= tolerance;
	}

	this.onDragObject		=	function(e) {
		const object = this.currentHitObject;
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
			this.chart.style.cursor = this.currentMode.cursorOnDrag;
		}
		
		const io = this.getEventOffset(initialEvent || this.initialMouseEvent);
		const eo = this.getEventOffset(event);
		
		const initialX = initialXValue !== undefined ? initialXValue : io.offsetX;
		const currentX = currentXValue !== undefined ? currentXValue : eo.offsetX;

		const currentOffset = currentX - initialX;

		if (this.model.instrumentsSeries[0] &&  this.fusion.getSeriesManager()[this.model.instrumentsSeries[0].seriesId].data) {
			const sl = this.fusion.getSeriesManager()[this.model.instrumentsSeries[0].seriesId].data.length;
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

				if (panel == panel2 && this.initialMinMax){
					const panelOptions = {
						panelHeight: panel._height,
						minValue: panel.vMin,
						maxValue: panel.vMax
					};

					if (!this.initialMinMax.value) {
						this.initialMinMax.value =  this.renderer.getPriceForYCoordinate(io.offsetY - panel._offset, panelOptions);
					}

					if ((this.isMouseDown && this.isRightButton === true) || (isAboveValueAxis && this.valueAxisClicked)){
						const valueY1 = this.initialMinMax.value;
						const valueY2 = this.renderer.getPriceForYCoordinate(eo.offsetY - panel._offset, panelOptions);
						const delta = valueY1 - valueY2;

						if (delta > 0 || (delta < 0 && Math.abs(this.initialMinMax.max + delta - this.initialMinMax.min - delta) > 0.000000000000000001)){
							panel.vMax = this.initialMinMax.max + delta;
							panel.vMin = this.initialMinMax.min - delta;
						}
					} else if (this.isMouseDown && this.isRightButton === false) {
						const valueY1 = this.renderer.getPriceForYCoordinate(io.offsetY - panel._offset, panelOptions);
						const valueY2 = this.renderer.getPriceForYCoordinate(eo.offsetY - panel._offset, panelOptions);
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
		if(!next) return;

		var h1h2 = this.model.panels[this.currentHandler]._height + this.model.panels[next]._height;
		var nh_1	=	this.initialOffsets[this.currentHandler].height+offset;
		var nh_2	=	h1h2 - nh_1;

		if (nh_1 <	this.model.minPanelHeight || nh_2 < this.model.minPanelHeight) return false;

		this.model.panels[this.currentHandler]._height=nh_1;
		this.model.panels[next]._height=nh_2;

		this.heightsToBasis();

		this.controller.fitAndRepaint();

		return true;

		function getIndexOfNextVisiblePanel(index){
			var i = index+1;
			while(i <= self.model.panels.length - 1){
				if(self.model.panels[i]._visible == true)
					return i;
				i++;
			}
		}

	};

	this.heightsToBasis	=	function () {

		var H = this.model._height-this.model.timeAxisHeight;
		var B = 0;

		for (var i=0; i<this.model.panels.length; i++) {
			if(this.model.panels[i]._visible){
				var b = 100* this.model.panels[i]._height/H;
				B +=b;
				this.model.panels[i].basis = b;
			}
		}

		var offset = 100-B;
		if(offset>0)
			this.model.panels[0].basis+=offset;

	}

	this.basisToHeights = function(){
		const panels = this.model.panels;
		const length = this.model.panels.length
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

			panel._height = panel._visible ? Math.round(fullHeight * panel.basis / basis) : 0;
		}
	}

	this.triggerWheelCallback = (function() {
		const wheelUpDelta = {v:0};
		const wheelDownDelta = {v:0};

		return function(event) {
			self.currentViewportLeft = self.model.viewportLeft;

			if (self.config.mouseWheelZoomEnabled === false) return;
			if (self.controller.isChartEmpty(self.chart)) return;

			event.preventDefault();
			clearInterval(self.swipe.hook);

			const deltaY = event.deltaY;
			const deltaX = event.deltaX;

			if (Math.abs(deltaX) >= Math.abs(deltaY)) {
				triggerPan.call(self, event);
			} else {
				if (event.deltaY < 0) { // scrolling up
					wheelDownDelta.v = 0;
					accumulateAndTriggerScroll.call(self, wheelUpDelta, event, onMouseWheelUp);
				} else { // scrolling down
					wheelUpDelta.v = 0;
					accumulateAndTriggerScroll.call(self, wheelDownDelta, event, onMouseWheelDown);
				}
			}
		}

		function triggerPan(event) {
			if (Math.abs(event.deltaX) > 0) {
				let delta;

				if (event.deltaX < 0) { delta = 15; }
				else { delta = -15; }

				this.doFrame(() => {
					event._offset = this.getEventOffset(event);
					this.onPan.call(this, event, event, 0, delta);
				})
			}
		}

		function accumulateAndTriggerScroll(currentDelta, event, callback) {
			currentDelta.v += event.deltaY;

			if (Math.abs(currentDelta.v) >= 5) {
				this.doFrame(() => {
					const eventOffset = this.getEventOffset(event);
					const index = this.renderer.getPointIndex(eventOffset.offsetX, this.model);
					const dataLength = this.fusion.getMainSeries().data.length;
					const xPosition = this.renderer.getIndexPoint(dataLength - 1, this.model);
					const canvasWidth = this.model._width - this.controller.renderer.getPriceRenderingOptions().valueAxisWidth;
					const visibleIndexes = this.model._rightIndex - this.model._leftIndex;
	
					callback.call(this, index, dataLength, xPosition, canvasWidth, visibleIndexes, eventOffset);

					self.controller.rerender();
				})

				currentDelta.v = 0;
			}
		}

		function onMouseWheelDown(index, dataLength, xPosition, canvasWidth, visibleIndexes, eventOffset) {
			let periodWidth;

			const minPeriodWidth = this.getMinPeriodWidth();
			const _d = Math.round(visibleIndexes * 1.05);

			if (canvasWidth / _d > 5) {
				periodWidth = Math.round(canvasWidth / _d);

				let factor = 0.95
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

		function onMouseWheelUp(index, dataLength, xPosition, canvasWidth, visibleIndexes, eventOffset) {
			var _d = Math.round(visibleIndexes * 0.95); // new amount of candles
			if (_d < 6) return; // if less than 6 candles, abort

			if (canvasWidth/_d > 5) { // candle width > 1px
				var _pw =  Math.round(canvasWidth/_d);
			} else {
				var _pw = canvasWidth/_d;
			}
			
			if (_pw <= this.model.periodWidth)
				_pw = _pw + 2;

			if (_pw < 0.01) _pw = 0.01;

			this.model.periodWidth = _pw;

			if (index > dataLength - 1) {
				if (this.model._leftIndex > 0)
					this.moveIndexToPoint(dataLength - 1, xPosition);
			} else
				this.moveIndexToPoint(index, eventOffset.offsetX);
		}
	}())

	this.getMinPeriodWidth = function () {
		const dataLength = this.fusion.getMainSeries().data.length;
		const canvasWidth = this.model._width - this.controller.renderer.getPriceRenderingOptions().valueAxisWidth;
		const minPeriodWidth = canvasWidth * 0.9 / dataLength;
		
		return minPeriodWidth;
	}

	this.onKeyUp	=	function (e) {
		if(this.controller.isChartEmpty(this.chart)) return;

		// if(WEBRCP.newChartLastFocus === this.chart) {
		// 	if(!document.activeElement.className.startsWith("webrcp-new-chart-top-layer"))
		// 		return;
				
			switch (e.key) {
			
				case "Backspace":
				case "Delete":
					if (!this.currentSelectedObject) break;

					this.controller.onDelete(this.currentSelectedObject.id);
					break;

				case "Home":
					this.moveIndexToPoint(0,0);
					this.controller.rerender();
					break;

				case "End":
					this.controller.moveToEnd();
					this.controller.rerender();
					break;
			}
	};

	this.onKeyDown	=	function (e) {
		if(this.controller.isChartEmpty(this.chart)) return;

		if(WEBRCP.newChartLastFocus === this.chart) {
			if(!document.activeElement.className.startsWith("webrcp-new-chart-top-layer"))
				return;

			switch (e.key)
			{
			case "Control":
				this.currentMode.keyDown(e.key);
				break;
			}
		};
	};


	this.clearOverlay		=	function () {
		// self.octx.setTransform(1, 0, 0, 1, 0, 0);
		self.octx.clearRect(-1,-1,self.model._width+2, self.model._height+2);
	};



	this.hideEmptyPanels = function(){
		for (var i=0; i<this.model.panels.length; i++) {
			this.model.panels[i]._visible = this.renderer.shouldBePanelVisible(this.model.panels[i])
		}
	}

	this.getOffsets		=	function () {

		var offsets = new Array();

		for (var i=0; i<this.model.panels.length; i++) {
			offsets.push({height: this.model.panels[i]._height, offset: this.model.panels[i]._offset});
		}

		return offsets;
	};

	this.isOverHandler		=	function (e) {

		var eo = this.getEventOffset(e);
		
		if (this.model.panels.length < 2) return -1;
		for (var i = 0; i < this.model.panels.length - 1; i++) {
			if (this.isOver(
				0, eo.offsetY, 0, 
				this.model.panels[i]._offset + this.model.panels[i]._height, 
				hitTolerance
			)) return i;
		}

		return -1;
	};

	this.isOver = function (x1, y1, x2, y2, precision) {
		if (
			x1 - precision < x2 &&
			x1 + precision > x2 &&
			y1 - precision < y2 &&
			y1 + precision > y2
		) return true;

		return false;
	};

	this.getCurrentHitObject	=	function (x, y) {

		this.currentPanel = this.getPanel(y);

		if (this.currentPanel==null) return null;

		//arrows?
		var arrow = this.renderer.objects['MovePaneArrows'].hit(x, y, null, this.renderer, this, this.model, this.currentPanel, this.fusion.getSeriesManager());
		if(arrow){
			return arrow;
		}

		//clear all previous hits
		for (var i=0; i<this.currentPanel.objects.length; i++) {
			if(this.renderer.objects[this.currentPanel.objects[i].type].clearHits)
				this.renderer.objects[this.currentPanel.objects[i].type].clearHits(this.currentPanel.objects[i]);
		}

		if(this.currentPanel.main == true){
			if(this.model.positions.visible && this.model.positions.list){
				for(var i=0; i<this.model.positions.list.length;i++){
					if(this.renderer.objects['TradeObject'].hit(x, y, this.model.positions.list[i], this.renderer, this, this.model, this.currentPanel, this.fusion.getSeriesManager()))
						return this.model.positions.list[i];
				}
			}

			const orders = this.model.orders.list;
			const areOrdersVisible = this.model.orders.visible && orders;
			
			if (areOrdersVisible ) {
				for (var i = 0; i < orders.length; i++) {
					if (orders[i].object.price && orders[i].object.stopPrice){
						if (this.renderer.objects['StopLimitObject'].hit(x, y, orders[i], this.renderer, this, this.model, this.currentPanel, this.fusion.getSeriesManager()))
							return orders[i];
					} else {
						if (this.renderer.objects['TradeObject'].hit(x, y, orders[i], this.renderer, this, this.model, this.currentPanel, this.fusion.getSeriesManager()))
							return orders[i];
					}
				}
			}
		}

		if (!this.isObjectSelectionAllowed) return null;

		var lastObjectIndex = this.currentPanel.objects.length - 1;
		for(var i = lastObjectIndex; i > -1; --i){
			if (this.hit(x, y, this.currentPanel.objects[i]))
				return this.currentPanel.objects[i];
		}

		return null;
	};

	this.getPanel				=	function (y) {

		for (var i=this.model.panels.length-1; i>-1; i--) {

			if (y>this.model.panels[i]._offset&&y<this.model.panels[i]._offset+this.model.panels[i]._height)
				return this.model.panels[i];

		}

		return null;

	};

	this.getMainPanel				=	function () {
		for (var i=0; i<this.model.panels.length;  i++) {
			if(this.model.panels[i].main == true)
				return this.model.panels[i]
		}
		return null;
	};

	this.getMainInstrumentPlotter		=	function () {
		var panel = this.getMainPanel();
		if(this.model.instrumentsSeries && this.model.instrumentsSeries.length > 0){
			for (var i=0; i<panel.objects.length;  i++) {
				if(panel.objects[i].id == this.model.instrumentsSeries[0].seriesId)
					return panel.objects[i]
			}
		}
		return null;
	};


	this.hit					=	function (x, y, o) {

		return this.renderer.objects[o.type].hit(x, y, o, this.renderer, this, this.model, this.currentPanel, this.fusion.getSeriesManager());

	};

	this.deselectAll			=	function () {
		for (let i = 0; i < this.model.panels.length; i++) {
			for (let j = 0; j < this.model.panels[i].objects.length; j++) {
				this.model.panels[i].objects[j]['selected'] = false;
			}
		}
		//deselect positions
		if (this.model.positions){
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
		this.controller.updateToolsOptions({mode: 'chart', interactor: this});
	};

	this.select					=	function (o) {
		var self = this;
		this.deselectAll();
		o.selected = true;
		selectOrderPosition();
		this.currentSelectedObject = o;

		if (this.renderer.objects[o.type] instanceof Shape){
			this.controller.updateToolsOptions({mode: 'object', interactor: this, object: o});
		}
		else if (this.renderer.objects[o.type] instanceof Series && (o.renderAs !== 'OHLC' && o.renderAs !== 'Bars')) {
			this.controller.updateToolsOptions({mode: 'series', interactor: this, object: o});
		}
		else if (this.renderer.objects[o.type] instanceof Series && (o.renderAs === 'OHLC' || o.renderAs == 'Bars')) {
			this.controller.updateToolsOptions({mode: 'candles', interactor: this, object: o});
		}
		else {
			this.controller.updateToolsOptions({mode: 'chart', interactor: this, object: o});
		}

		function selectOrderPosition(){
			if(o.list){
				for(var i in o.list){
					if(o.list[i].hover){
						o.list[i].selected = true;
						if(o.list[i].objType == 'ORDER')
							selectRelatedPosition(o.list[i].parentId);
						else if(o.list[i].objType == 'POSITION')
							selectRelatedOrders(o.list[i].id)
					}
				}
			}
		}

		function selectRelatedPosition(id){
			for(var i in self.model.positions.list){
				if(self.model.positions.list[i].id == id){
					self.model.positions.list[i].selected = true;
				}
			}
		}

		function selectRelatedOrders(id){
			for(var i in self.model.orders.list){
				if(self.model.orders.list[i].parentId == id){
					self.model.orders.list[i].selected = true;
				}
			}
		}

		function isInstrumentPlotter(o, chart){
			var series = chart.model.instrumentsSeries;
			for(var i in series){
				if(series[i].seriesId == o.dataLink){
					return true;
				}
			}
			return false;
		}
	}

	this.pushPanel = function (r, o, panel) {
		this.controller.render(o);
	}

	this.popPanel				=	function (r, o, panel) {
		if (o.canBeIndicator==true) {
			this.controller.calculateAll();
			this.controller.fit();
		}

		this.controller.render();
		this.controller.renderOverlay();
	}

	this.pushIndexes = function(){
		for(var i=0; i< this.model.panels.length; i++){
			for(var j=0; j< this.model.panels[i].objects.length; j++){
				var o = this.model.panels[i].objects[j];
				var r = this.renderer.objects[o.type];
				if(r.push)
					r.push(o, this.renderer, this.model, this.fusion.getSeriesManager(), this);
			}
		}
	}

	this.popIndexes = function(){
		for(var i=0; i< this.model.panels.length; i++){
			for(var j=0; j< this.model.panels[i].objects.length; j++){
				var o = this.model.panels[i].objects[j];
				var r = this.renderer.objects[o.type]
				if(r.pop)
					r.pop(o,this.renderer, this.model, this.fusion.getSeriesManager(), this);
			}
		}
	}

	this.renderOverlayedObject	=	function (r, o, panel) {
		var self = this;
		try{
			self.octx.save();
			self.octx.rect(0, panel._offset, panel._width - self.controller.renderer.getPriceRenderingOptions().valueAxisWidth, panel._height);
			self.octx.clip();

			self.clearOverlay();
			// self.octx.translate (0.5, 0.5);
			r.render(o, self.octx, self.renderer, self.model, panel, self.fusion.getSeriesManager());
			r.postRender(o, self.octx, self.renderer, self.model, panel, self.fusion.getSeriesManager());
		}catch(e){
			console.error(e,e.stack)
		}finally{
			// self.octx.translate (-0.5, -0.5);
			self.octx.restore();
		}
	}

	this.init					=	function () {
		this.popIndexes();
	}

	this.initAnchor				=	function (a) {

		a._index = this.getStampIndex(a.stamp) + a.offset;

	}

	this.getStampIndex			=	function (s) {
		var lastIndex = this.fusion.getSeriesManager()[this.model.mainSeries].data.length-1;

		for (var i=0; i<this.fusion.getSeriesManager()[this.model.mainSeries].data.length; i++) {
			var stamp = this.fusion.getSeriesManager()[this.model.mainSeries].data[i].stamp;

			if (stamp==s) return i;

			if(i< lastIndex){
				var nextStamp = this.fusion.getSeriesManager()[this.model.mainSeries].data[i+1].stamp;
				if(s > stamp && s < nextStamp) return i;
			}

			if(i == lastIndex){
				var intervalInMilis = this.fusion.getSeriesManager()[this.model.mainSeries].interval.milis;
				if(s > stamp && s < stamp+intervalInMilis) return i;
			}
		}
		return -1;
	}

	this.doCloseTradeObject = function(o){
			if (o.type == 'POSITION') {
				this.chart.options.doClosePositionCallback(o.object);
			} else {
				this.chart.options.doDeleteOrderCallback(this.getOriginalOrder(JSON.parse(JSON.stringify(o.object))));
			}
	}

	this.doModifyTradeObject = function (o, parent) {
		var req = JSON.parse(JSON.stringify(o.object));

		req.stopPrice = o.stopPrice;
		req.limitPrice = o.limitPrice;
		if (o.type.includes('TRAILING_STOP')) {
			req.trailingStop = true;
			var mainSeriesCandles = this.fusion.getMainSeries().data;
			req.stopPrice -= mainSeriesCandles[mainSeriesCandles.length - 1].c;
		}
		if (!parent && o.type == 'POSITION') req.isMarket = true;
		else if (parent && parent.type == 'POSITION') req.isMarket = true;
		else req.isMarket = false;

		this.chart.options.doModifyOrderCallback(req);
	}

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

	this.doAddTradeObject = function(o){
		var mode = 'silent'; //ask, dialog
		var orderRequest = {price: o.related.price, parent: o.object}
		if(o.operation == 'SELL' && o.related.price > o.price) orderRequest.type = 'SL';
		if(o.operation == 'SELL' && o.related.price < o.price) orderRequest.type = 'TP';
		if(o.operation == 'BUY' && o.related.price > o.price) orderRequest.type = 'TP';
		if(o.operation == 'BUY' && o.related.price < o.price) orderRequest.type = 'SL';
		orderRequest.title = orderRequest.type;

		if(mode == 'silent'){
			self.chart.options.doAddRelatedOrder(orderRequest);
		}else if(mode == 'dialog'){
			if(orderRequest.type == 'SL'){
				self.chart.options.openAddSLWidget(orderRequest);
			}
			if(orderRequest.type == 'TP'){
				self.chart.options.openAddTPWidget(orderRequest);
			}
		}
	}

	this.setMode = function(symbol, o, onFinished){
		this.clearOverlay();

		switch(symbol) {
			case 'CROSSHAIR':
				this.currentMode = new CrosshairTool(this);
				break;
			case 'ZOOMBOX':
				this.currentMode = new ZoomBoxTool(this);
				break;
			case 'STAGE':
				this.currentMode = new StageTool(this, o, onFinished);
				break;
			case 'ERASER':
				this.currentMode = new EraserTool(this);
				break;
			default:
				this.currentMode = new DefaultTool(this);
		}

		this.controller.emitEvent({
			topic: "CURSOR_CHANGE",
			data: {
				cursor: symbol
			}
		})
	}

	this.movePanelUpDn = function(panel, o){
		var panels = this.model.panels;
		for(var i in panels){
			panels[i].sortNb = i;
		}

		if(o.arrow == 'up') panel.sortNb = panel.sortNb -2;
		if(o.arrow == 'dn') panel.sortNb = panel.sortNb +2;
		panels.sort( function(p1, p2){ return p1.sortNb - p2.sortNb; });
		// this.chart.fit();
		// this.controller.render();
		// this.chart.saveInstance();
		self.controller.rerender();
	}
	
	this.getEventOffset = function(e) {
		var targetRect = this.topLayer.getBoundingClientRect();
		var clientX = e.clientX || e.deltaX;
		var clientY = e.clientY || e.deltaY;
		var x = clientX - targetRect.left;
		var y = clientY - targetRect.top;

		return {offsetX: x, offsetY: y}
	}

	this.isAboveValueAxis = function(e) {
		if (this.currentPanel)
			return e._offset.offsetX > (this.currentPanel._width - this.controller.renderer.getPriceRenderingOptions().valueAxisWidth);
		return false;
	}

	this.setObjectSelectionAllowed = (isObjectSelectionAllowed) => {
		this.isObjectSelectionAllowed = isObjectSelectionAllowed;
		this.controller.emitEvent({
			topic: 'OBJECT_SELECTION_ALLOWED_CHANGE',
			data: isObjectSelectionAllowed
		  });
	}

	bindDomEvents();
};


// **************************************************** //
// ******************* DEFAULT TOOL ******************* //
// **************************************************** //


function DefaultTool(interactor){
	this.symbol = 'DEFAULT';
	this.interactor = interactor;
	this.color = WEBRCP.utils.colorManager.getColor("defaultToolColor");
	this.textColor = WEBRCP.utils.colorManager.getColor("defaultToolTextColor");
	this.toolTipShowDelay= 600;

	this.cursor = 'default';
	this.cursorOverObject = 'pointer';
	this.cursorOnDrag = 'default';
	this.cursorOnCopyMode = 'copy';

	this.allowSwipe = true;

	this.onMouseDown = function(e){
		this.startEvent = e;
		this.finishEvent = null;
		this.copyMode = false;

		if (this.interactor.currentHitObject != null) {
			if (e.ctrlKey && this.canBeCloned(this.interactor.currentHitObject)){
				this.copyMode = true;
				var clone = this.interactor.chart.objectsManager.cloneObject(this.interactor.currentHitObject);
				this.interactor.currentHitObject = clone;
			}

			this.interactor.pushPanel(this, this.interactor.currentHitObject, this.interactor.currentPanel);

			this.interactor.select(this.interactor.currentHitObject);

			this.interactor.currentAnchor = this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseDown(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());

		} else {
			this.interactor.deselectAll();
		}
	}

	this.onMouseUp = function(e){
		this.finishEvent = null;

		if (this.interactor.currentHitObject!=null) {
			this.interactor.popPanel(this, this.interactor.currentHitObject, this.interactor.currentPanel);
			this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
		} else {
			this.interactor.chart.style.cursor = this.cursor;
		}

	}

	this.onMouseMove = function(e){
		this.finishEvent = e;
		var eo = this.interactor.getEventOffset(e);
		
		this.interactor.currentHitObject = this.interactor.getCurrentHitObject(eo.offsetX, eo.offsetY);
		
		if (this.interactor.isAboveValueAxis(e)) {
			this.interactor.currentHitObject = null;
			this.interactor.chart.style.cursor = "ns-resize";
		}
		else if (this.interactor.currentHitObject!=null && this.interactor.currentHitObject._hit) {

			if (e.ctrlKey && this.canBeCloned(this.interactor.currentHitObject)) {
				if (this.interactor.chart.style.cursor!= this.cursorOnCopyMode) {
					this.interactor.chart.style.cursor = this.cursorOnCopyMode;
				}
			}else{
				if (this.interactor.chart.style.cursor!= this.interactor.currentMode.cursorOverObject) {
					this.interactor.chart.style.cursor = this.interactor.currentMode.cursorOverObject;
				}
			}

			if (this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove) {
				this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
			}
		}
		else if (this.interactor.chart.style.cursor!=this.cursor) {
			this.interactor.chart.style.cursor = this.cursor;
		}
	}

	this.onMouseDrag = function (e) {
		const interactor = this.interactor

		this.startEvent = interactor.initialMouseEvent;
		this.finishEvent = e;

		if (interactor.currentHandler > -1) return this.interactor.onDragHandler(e);

		const hitObject = interactor.currentHitObject
		if (hitObject != null && interactor.controller.renderer.objects[hitObject.type].isDraggable !== false) return interactor.onDragObject(e);

		return interactor.onPan(e);
	};

	this.onRightMouseDrag	=	function (e) {
		this.startEvent = this.interactor.initialMouseEvent;
		this.finishEvent = e;
		return this.interactor.onPan(e);
		//this.interactor.clearOverlay();
		//this.interactor.currentMode.render(this.interactor.octx, this.interactor.initialMouseEvent, e);
	};

	this.onMouseOut = function(e){
			if (this.interactor.currentHitObject!=null) {
				this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseOut(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
			}
	};

	this.keyDown = function(key){
		if (key == "Control" && this.canBeCloned(this.interactor.currentHitObject)) {
			if (this.interactor.currentHitObject!=null && this.interactor.currentHitObject._hit) {
				if (this.interactor.chart.style.cursor!= this.cursorOnCopyMode) {
					this.interactor.chart.style.cursor = this.cursorOnCopyMode;
				}
			}
		}
	}

	this.canBeCloned = function(o){
		if(o!=null && this.interactor.controller.renderer.objects[o.type] instanceof Shape)
			return true;
		return false;
	}

	this.render	=	function (ctx) {};

	this.renderOverlay	=	function (octx) {
		var self = this;
		if (this.startEvent && this.interactor.currentHitObject && this.interactor.isMouseDown) {
			const startEventOffset = this.interactor.getEventOffset(this.startEvent);
			var panel = this.interactor.getPanel(startEventOffset.offsetY);
			//render only on chart surface (without axis)
			try{
				octx.save();
				// octx.translate (0.5, 0.5);
				octx.rect(0, panel._offset, panel._width-this.interactor.controller.renderer.getPriceRenderingOptions().valueAxisWidth, panel._height);
				octx.clip();

				var o = this.interactor.currentHitObject;
				var r = this.interactor.controller.renderer.objects[o.type];
				r.render(o, octx, this.interactor.controller.renderer, this.interactor.model, panel, this.interactor.fusion.getSeriesManager());
			}catch(e){
				console.error(e,e.stack)
			}finally{
				// octx.translate (-0.5, -0.5);
				octx.restore();
			}

			//post render on whole octx
			try{
				octx.save();
				// octx.translate (0.5, 0.5);
				octx.rect(0, panel._offset, panel._width, panel._height);
				octx.clip();

				var o = this.interactor.currentHitObject;
				var r = this.interactor.controller.renderer.objects[o.type];
				r.postRender(o, octx, this.interactor.controller.renderer, this.interactor.model, panel, this.interactor.fusion.getSeriesManager());
			}catch(e){
				console.error(e,e.stack)
			}finally{
				// octx.translate (-0.5, -0.5);
				octx.restore();
			}
		}

		if(this.interactor.currentHitObject){
			if(this.tipTimeOut) clearTimeout(this.tipTimeout);

			if(this.currentTip)
				showTip();
			else
				this.tipTimeout = setTimeout(showTip, this.toolTipShowDelay);

			function showTip(){
				var hitObject = self.interactor.currentHitObject;

				if (hitObject && hitObject._hit && hitObject._hit.x && hitObject._hit.y && hitObject.dataLink && self.interactor.fusion.getSeriesManager()[hitObject.dataLink]){
					var object = self.interactor.controller.renderer.objects[hitObject.type];
					var index = self.interactor.controller.renderer.getPointIndex(hitObject._hit.x, self.interactor.model);

					if(index > self.interactor.fusion.getSeriesManager()[hitObject.dataLink].data.length-1) return;

					var tip = object.getToolTip(self.interactor.currentHitObject, index, self.interactor.model, self.interactor.fusion.getSeriesManager(), self.interactor.fusion.getScriptsManager());

					try {
						octx.save();
						// octx.translate (0.5, 0.5);
						tip.date = WEBRCP.utils.dateTimeFormatter.stamp(tip.stamp).toDateTimeString();
						tip.precision = self.interactor.model.instrumentsSeries[0].instrument.precision;
						self.currentTip = tip;
						drawTip(tip, hitObject._hit.x, hitObject._hit.y, octx, self.interactor.model, self.interactor.controller);

					} catch(e) {
						console.error(e,e.stack)
					} finally {
						// octx.translate (-0.5, -0.5);
						octx.restore();
					}
				}
			}
		} else {
			clearTimeout(this.tipTimeout);
			this.currentTip = null;
			this.tipTimeout = null;
		}
	}

	function drawTip(tip, x, y, ctx, model, controller) {
		const getValue = (value, precision) => {
			if (value !== undefined && value !== null) {
				let newValue = value;
				if (value.toFixed) {
					newValue = formatNumber(newValue, precision);
				}
				return newValue;
			} else {
				return "-";
			}
		};
		
		var cfg = {
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

			valueOffset: 50
		}
		ctx.font = WEBRCP.utils.colorManager.getFont("title");
		var fontSize = /(\d*)px/.exec(ctx.font) ? /(\d*)px/.exec(ctx.font)[1]:14;
		cfg.lineHeight = parseInt(fontSize);
		var lc = tip.values.length;
		cfg.height = 2*cfg.margin + lc*(cfg.lineHeight+cfg.lineSpacing) + 3*cfg.lineHeight+ 3*cfg.lineSpacing;

		var titleSize = ctx.measureText(tip.title).width;
		cfg.width = newSize(titleSize+2*cfg.margin, cfg.width, cfg.widthMax);

		var dateSize = ctx.measureText(tip.date).width;
		cfg.width = newSize(dateSize+2*cfg.margin, cfg.width, cfg.widthMax);

		var lw = 0;
		var vw = 0;
		for(var i in tip.values){
			var _lw = ctx.measureText(tip.values[i].label).width;
			lw = _lw > lw ? _lw : lw;
			var v = getValue(tip.values[i].value, tip.values[i].precision);

			var _vw = measurePriceTextWidth({text: v, ctx, zerosToReduce: controller.renderer.getPriceRenderingOptions().zerosToReduce});
			vw = _vw > vw ? _vw : vw;
		}
		var valueWidth = lw + ctx.measureText(" : ").width+vw;
		cfg.width = newSize(valueWidth+2*cfg.margin, cfg.width, cfg.widthMax);
		cfg.valueOffset = lw + ctx.measureText(" : ").width;
		//cfg.valueOffset = cfg.valueOffset < (cfg.width/2-cfg.margin) ? cfg.width/2-cfg.margin :  cfg.valueOffset;

		//set valid position for new dimension
		calculateOffset(x, y, cfg, model);

		var tipTextColor = WEBRCP.utils.colorManager.getColor("tipTextColor");
		var tipUnderlineColor = WEBRCP.utils.colorManager.getColor("tipUnderline");

		ctx.beginPath();
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("tipBackground");//'#246FAF';
		ctx.fillRect(x+cfg.offsetX,y+cfg.offsetY,cfg.width,cfg.height);
		ctx.fillStyle = 'white';
		ctx.lineWidth = 1;
		ctx.strokeStyle = tipTextColor;

		var txtX = x+cfg.offsetX+cfg.margin;
		var txtY = y+cfg.offsetY+cfg.margin+cfg.lineHeight ;
		ctx.fillText(tip.title, txtX, txtY);
		ctx.fillStyle = tipTextColor
		ctx.font = WEBRCP.utils.colorManager.getFont("text");

		txtY += cfg.lineSpacing+cfg.lineHeight/2;
		ctx.moveTo(txtX, txtY);
		ctx.strokeStyle = tipUnderlineColor;
		ctx.lineTo(x+cfg.offsetX+cfg.width-cfg.margin, txtY);
		ctx.stroke();
		ctx.strokeStyle = tipTextColor;
		txtY += cfg.lineSpacing+cfg.lineHeight;
		ctx.fillText(tip.date,  txtX, txtY);

		txtY += cfg.lineSpacing+cfg.lineHeight/2;
		ctx.moveTo(txtX, txtY);
		ctx.strokeStyle = tipUnderlineColor;
		ctx.lineTo(x+cfg.offsetX+cfg.width-cfg.margin, txtY);
		ctx.stroke();
		ctx.strokeStyle = tipTextColor;

		for(var i in tip.values){
			ctx.font = WEBRCP.utils.colorManager.getFont("text");
			txtY += cfg.lineSpacing+cfg.lineHeight;
			ctx.fillText(tip.values[i].label+" : ",  txtX, txtY);
			let zerosToReduce = controller.renderer.getPriceRenderingOptions().zerosToReduce;
			const precision = tip.values[i].precision;

			if (precision !== null && precision !== undefined) {
				zerosToReduce = 0;
			}
			
			var v = getValue(tip.values[i].value, precision);
			var x = txtX+cfg.width-2*cfg.margin-measurePriceTextWidth({text:v, ctx, zerosToReduce: controller.renderer.getPriceRenderingOptions().zerosToReduce});
			renderPriceText({text: v, ctx, x, y: txtY, zerosToReduce: zerosToReduce});
		}

		ctx.closePath();

		function calculateOffset(x,y,cfg, model){
			var dY = (model._height-cfg.offsetBottomMargin) - (y+cfg.offsetY+cfg.height);
			if(dY < 0)
				cfg.offsetY += dY;

			var dX = model._width - (x+cfg.offsetX+cfg.width);
			if(dX < 0)
				cfg.offsetX +=dX;

		}

		function newSize(w, min, max){
			if(w < min) return min;
			if(w < max) return w;
			return max;
		}

		function formatNumber(n, precision){
			if (precision == null || precision === undefined) {
				precision = tip.precision;
			}
			if(n==0) return "0";

			if(n > 999999)
				return LIB.nFormatter(tip.values[i].value, precision);
			else
				return n.toFixed(precision);
		}
	}
}


// ****************************************************** //
// ******************* CROSSHAIR TOOL ******************* //
// ****************************************************** //


function CrosshairTool(interactor){
	this.symbol = 'CROSSHAIR';
	this.interactor = interactor;
	this.color = WEBRCP.utils.colorManager.getColor("crosshairColor");
	this.textColor = WEBRCP.utils.colorManager.getColor("crosshairTextColor");
	this.innerTextColor = WEBRCP.utils.colorManager.getColor("crosshairInnerTextColor");
	this.innerColor = WEBRCP.utils.colorManager.getColor("crosshairInnerColor");
	this.allowSwipe = false;

	this.cursor = 'crosshair';
	this.cursorOverObject = 'pointer';
	this.cursorOnDrag = 'crosshair';

	this.onMouseDown = function(e){
		this.startEvent = e;
		this.finishEvent = null;

		if (this.interactor.currentHitObject!=null) {
			this.interactor.select(this.interactor.currentHitObject);
			this.interactor.currentAnchor = this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseDown(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
			if (this.interactor.currentAnchor==null) {
				this.interactor.controller.repaint();
			}
		} else {
			this.interactor.deselectAll();
			this.interactor.controller.repaint(false);
		}
	}

	this.onMouseUp = function(e){
		this.finishEvent = null;

		if (this.interactor.currentHitObject!=null) {
			this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
		} else {
			this.interactor.chart.style.cursor = '';
		}
	}

	this.onMouseMove = function(e){
		this.finishEvent = e;
		var eo = this.interactor.getEventOffset(e);
		
		this.interactor.currentHitObject = this.interactor.getCurrentHitObject(eo.offsetX, eo.offsetY);
		if (this.interactor.currentHitObject!=null) {

			if (this.interactor.chart.style.cursor!= this.interactor.currentMode.cursorOverObject) {
				this.interactor.chart.style.cursor = this.interactor.currentMode.cursorOverObject;
			}

			if (this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove) {
				this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
			}
		}else{
			if (this.interactor.chart.style.cursor!=this.cursor) {
				this.interactor.chart.style.cursor = this.cursor;
			}
		}
	}

	this.onMouseDrag	=	function (e) {
		this.startEvent = this.interactor.initialMouseEvent;
		this.finishEvent = e;
	};


	this.onRightMouseDrag	=	function (e) {
		this.startEvent = this.interactor.initialMouseEvent;
		this.finishEvent = e;
	};

	this.onMouseOut = function(e){
		if (this.interactor.currentHitObject!=null) {
			this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseOut(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
		}
	};

	this.keyDown = function(key){}

	this.render	=	function (ctx) {};

	this.renderOverlay	=	function (octx) {
		if(this.interactor.isMouseDown==true ||this.interactor.isRightButtonDrag==true)
			this.renderDn(octx,this.startEvent, this.finishEvent);
		else
			this.renderUp(octx,this.finishEvent);
	};

	this.renderUp = function(ctx, e){
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
				maxValue: panel.vMax
			});
		}
		
		ctx.save();
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor('accent');
		ctx.setLineDash([5, 5]);
		ctx.lineWidth = 1;

		ctx.moveTo(0, y);
		ctx.lineTo(model._width - this.interactor.controller.renderer.getPriceRenderingOptions().valueAxisWidth, y);
		ctx.moveTo(x, 0);
		ctx.lineTo(x, model._height - model.timeAxisHeight);
		ctx.stroke();

		ctx.restore();

		if (panel && valueY && y) {
			self.interactor.controller.renderer.drawPriceTag(ctx, self.interactor.model, panel, y, self.color, self.textColor, valueY);
		}

		self.interactor.controller.renderer.drawTimeTag(ctx, self.interactor.model, x, self.color, self.textColor, self.interactor.fusion);
	}

	this.renderDn = function(ctx, i, e) {
		if(!i || !e) return;
		
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

		const valueAxisWidth = this.interactor.controller.renderer.getPriceRenderingOptions().valueAxisWidth;

		if(panel && panel2 && panel.id==panel2.id){
			v1 = this.interactor.controller.renderer.getPriceForYCoordinate(io.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax});
			v2 = this.interactor.controller.renderer.getPriceForYCoordinate(eo.offsetY-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax});
		}

		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor('accent');
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
		if(panel && panel2 && panel.id==panel2.id && y1 && y2 && v1 && v2){
			self.interactor.controller.renderer.drawDoublePriceTag (ctx, model, panel, y1, y2, self.color, self.textColor, self.innerColor, self.innerTextColor, v1, v2);
		}
		self.interactor.controller.renderer.drawDoubleTimeTag(ctx, model, io.offsetX, eo.offsetX, self.color,self.textColor, self.interactor.fusion);

	};
}


// **************************************************** //
// ******************* ZOOMBOX TOOL ******************* //
// **************************************************** //


function ZoomBoxTool(interactor){
	this.symbol = 'ZOOMBOX';
	this.interactor = interactor;
	this.color = WEBRCP.utils.colorManager.getColor("defaultToolColor");
	this.textColor = WEBRCP.utils.colorManager.getColor("defaultToolTextColor");

	this.cursor = 'zoom-in';
	this.cursorOverObject = 'zoom-in';
	this.cursorOnDrag = 'crosshair';

	this.startEvent = null;
	this.finishEvent = null;

	this.allowSwipe = false;

	this.onMouseDown = function(e){
		this.startEvent = e;
		this.finishEvent = null;
	}

	this.onMouseUp = function(e){
		this.interactor.clearOverlay();
		
		var startEventO = this.interactor.getEventOffset(this.startEvent);
		var finishEventO = this.interactor.getEventOffset(this.finishEvent);
		
		var p1 = {x: startEventO.offsetX, y: startEventO.offsetY};
		var p2 = {x: finishEventO.offsetX, y: finishEventO.offsetY};

		zoomIn(this.interactor, p1, p2);
		this.finishEvent = null;

		this.interactor.setMode('DEFAULT');

		function zoomIn(interactor, p1, p2){
			var index1 = interactor.controller.renderer.getPointIndex(p1.x, interactor.chart.model);
			var index2 = interactor.controller.renderer.getPointIndex(p2.x, interactor.chart.model);
			if(index1 < index2)
				interactor.chart.setLeftRightIndex(index1, index2);
			else if(index1 > index2)
				interactor.chart.setLeftRightIndex(index2, index1);

			interactor.chart.fit();
			interactor.controller.render();
		}
	}

	this.onMouseMove = function(e){
		var eo = this.interactor.getEventOffset(e);
		
		var index = this.interactor.controller.renderer.getPointIndex(eo.offsetX, this.interactor.model);
		if (this.interactor.chart.style.cursor!=this.cursor) {
			this.interactor.chart.style.cursor = this.cursor;
		}
	}

	this.onMouseDrag		=	function (e) {
		this.finishEvent = e;
		this.interactor.currentMode.render(this.interactor.octx, this.interactor.initialMouseEvent, e);
	};

	this.onRightMouseDrag	=	function (e) {
		this.finishEvent = e;
		this.interactor.currentMode.render(this.interactor.octx, this.interactor.initialMouseEvent, e);
	};

	this.onMouseOut = function(e){};

	this.keyDown = function(key){}

	this.render	=	function (ctx) {};

	this.renderOverlay	=	function (ctx) {
		var self = this;

		this.interactor.controller.doFrame(function () {
			if(self.startEvent && self.finishEvent){
				var startEventO = self.interactor.getEventOffset(self.startEvent);
				var finishEventO = self.interactor.getEventOffset(self.finishEvent);
				
				self.interactor.clearOverlay();
				ctx.beginPath();
				ctx.lineWidth="1";
				ctx.strokeStyle=self.color;
				ctx.rect(startEventO.offsetX,startEventO.offsetY,finishEventO.offsetX-startEventO.offsetX,finishEventO.offsetY-startEventO.offsetY);
				ctx.stroke();
			}
		});
	};

}


// ************************************************** //
// ******************* STAGE TOOL ******************* //
// ************************************************** //


function StageTool (interactor, tool, onFinished) {
	this.symbol = 'STAGING';
	this.cursor = 'pointer';
	this.cursorOverObject = 'crosshair';
	this.cursorOnDrag = 'crosshair';
	this.allowSwipe = false;
	this.color = WEBRCP.utils.colorManager.getColor("defaultToolColor");
	this.textColor = WEBRCP.utils.colorManager.getColor("defaultToolTextColor");

	this.interactor = interactor;
	this.renderer = this.interactor.controller.renderer;
	this.model = this.interactor.model;
	this.tool = this.renderer.objects[tool.type];
	this.currentStep = 0

	this.interactor.currentStagingObject = JSON.parse(JSON.stringify(tool));
	this.interactor.currentStagingObject.id = FUSION.uniqueId();
	this.interactor.currentAnchor = null;
	this.interactor.select(this.interactor.currentStagingObject);

	// ************************************************** //
	
	this.onCancel = function() {
		this.cancelled = true;
		this.currentStep = 0;

		this.interactor.currentStagingObject = null;
		this.interactor.currentAnchor = null;
		this.interactor.setMode('DEFAULT');
	};

	this.onMouseDown = function(e) {
		if (this.cancelled) return;
		this.interactor.setObjectSelectionAllowed(true);

		if (this.currentStep === 0) {
			const eventOffset = this.interactor.getEventOffset(e).offsetY;
			this.interactor.currentPanel = this.interactor.getPanel(eventOffset);
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
				this.interactor.fusion.getSeriesManager()
			);
		}
	}

	this.onMouseUp = function(e) {
		if (this.cancelled) return;

		if (this.interactor.isRightMouseButton(e))
			this.interactor.allowContextMenu = false;

		if (this.tool && this.tool.stageUp) {
			const isStageCompleted = this.tool.stageUp(
				e, 
				this.interactor.currentStagingObject, 
				this.renderer, 
				this.interactor, 
				this.model, 
				this.interactor.currentPanel, 
				this.interactor.fusion.getSeriesManager()
			);
		
			if (isStageCompleted) {
				this.interactor.currentPanel.objects.push(this.interactor.currentStagingObject);
				this.interactor.currentStagingObject = null;
				this.currentStep = 0;
				this.interactor.setMode('DEFAULT');
				this.interactor.controller.onDrawingDone();
				if (onFinished) onFinished();
			};
		}
		
		this.interactor.controller.render();
	}

	this.onMouseMove = function(e){
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
	}

	this.onMouseDrag = function(e) {
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

	this.onMouseOut = function(e) {
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

	this.renderOverlay = function(context) {
		if (!this.tool) return;
		this.tool.render(
			this.interactor.currentStagingObject,
			context,
			this.renderer,
			this.model,
			this.interactor.currentPanel,
			this.interactor.fusion.getSeriesManager()
		);
	};

	this.keyDown = function(key) {}
	this.onRightMouseDrag	=	function(e) {};
	this.render	=	function(ctx) {};
}

// ****************************************************** //
// ******************* ERASER TOOL ********************** //
// ****************************************************** //


function EraserTool(interactor){
	this.symbol = 'ERASER';
	this.interactor = interactor;
	this.allowSwipe = true;

	this.cursor = 'no-drop';
	this.cursorOverObject = 'pointer';
	this.cursorOnDrag = 'no-drop';

	this.onMouseDown = function(e){
		this.startEvent = e;
		this.finishEvent = null;

		if (this.interactor.currentHitObject!=null) {
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
	}

	this.onMouseUp = function(e){
		this.finishEvent = null;

		if (this.interactor.currentHitObject!=null) {
			this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseUp(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
		} else {
			this.interactor.chart.style.cursor = '';
		}
	}

	this.onMouseMove = function(e){
		this.finishEvent = e;
		var eo = this.interactor.getEventOffset(e);
		
		this.interactor.currentHitObject = this.interactor.getCurrentHitObject(eo.offsetX, eo.offsetY);
		if (this.interactor.isAboveValueAxis(e)) {
			this.interactor.currentHitObject = null;
			this.interactor.chart.style.cursor = "ns-resize";
		} else if (this.interactor.currentHitObject!=null) {

			if (this.interactor.chart.style.cursor!= this.interactor.currentMode.cursorOverObject) {
				this.interactor.chart.style.cursor = this.interactor.currentMode.cursorOverObject;
			}

			if (this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove) {
				this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseMove(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
			}
		} else {
			if (this.interactor.chart.style.cursor!=this.cursor) {
				this.interactor.chart.style.cursor = this.cursor;
			}
		}
	}

	this.onMouseDrag	=	function (e) {
		this.startEvent = this.interactor.initialMouseEvent;
		this.finishEvent = e;


		if (this.interactor.currentHandler >-1) return this.interactor.onDragHandler(e);
		if (this.interactor.currentHitObject != null) return this.interactor.onDragObject(e);

		return this.interactor.onPan(e);
	};


	this.onRightMouseDrag	=	function (e) {
		this.startEvent = this.interactor.initialMouseEvent;
		this.finishEvent = e;
	};

	this.onMouseOut = function(e){
		if (this.interactor.currentHitObject!=null) {
			this.interactor.controller.renderer.objects[this.interactor.currentHitObject.type].mouseOut(e, this.interactor.currentHitObject, this.interactor.controller.renderer, this.interactor, this.interactor.model, this.interactor.currentPanel, this.interactor.fusion.getSeriesManager());
		}
	};

	this.keyDown = function(key){}
	this.render	=	function (ctx) {};
	this.renderOverlay	=	function (octx) {};
	this.renderUp = function(ctx, e){}
	this.renderDn = function(ctx, i, e) {};
}


export default InteractionsController;

//# sourceURL=./platform/components/newchart/js/interactions.js
