import WEBRCP from "./WebRCP";
import FUSION from "./fusion";
import LIB from "./utils/chartingCommons";
import { between, isPointInCircle, pointsDistance, getLinePointNearestMouse, roundAndTranslate } from './utils/objects-lib';
import { hitTolerance } from "./utils/environment";
import imageCandleChartWhite from "./img/icons/candle_chart_white.svg";

function Series() {
	this.hitTolerance 	= hitTolerance; //2;
	this.getMenuItems = function(){};

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager){};
	this.updateExtremes	=	function (o, extremes, model, seriesManager) {};
	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {};
	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {};
	this.drawSelectionLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {};

	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log('OHLC', 'Mouse Down');
	};

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log('OHLC', 'Mouse Drag');
	};

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log('OHLC', 'Mouse Up');
	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log('OHLC', 'Mouse Out');
	};

	this.clearHits = function(o){
		o._hit=false;
		o._hitAnchor=null;
		o._hitArrow=null;
	};

	this.getToolTip = function(){};
	
	this.getRenderMode = function(o, model){
		return o.renderAs;
	};
}
Series.prototype = {constructor: Series }

function getScriptTitle(o, model, seriesManager, scriptManager) {
	function findRelatedScriptName(o, model, scriptManager){
		var scriptInstance = null;
	
		for (var property in scriptManager) {
			if (scriptManager.hasOwnProperty(property)) {
				var script = scriptManager[property];
				var outputs = script.outputs;
				for (var output in outputs) {
					if (outputs.hasOwnProperty(output)) {
						if(outputs[output] == o.dataLink && o.dataLink){
							scriptInstance = script;
							break;
						}
					}
				}
			}
		}
		
		if (scriptInstance) {
			for(var k in model.scripts){
				if(model.scripts[k].id == scriptInstance.id)
					return model.scripts[k].userName;
			}
		}
		return null;
	}
	
	const userName = findRelatedScriptName(o, model, scriptManager);
	const name = seriesManager[o.dataLink].title;

	const title = userName && userName !== name ? WEBRCP.locale.fusion.getMessage(name, name) + ' (' + userName + ')' : WEBRCP.locale.fusion.getMessage(name, name, true);
	return WEBRCP.locale.fusion.getMessage(title, title, true);
}

var SeriesObject	=	function () {
	this.getMenuItems	=	function (o, chart) {
		var object = o;
		if(o.renderAs == 'Band') return null;

		var menuItems	=	{
				radio1: {
					name: chart.options.locale.getMessage('candles'),
					icon: function($element, key, item){
						if(o['renderAs'] == "OHLC"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						chart.onDrawModeSelected({
							type: 'OHLC',
							object: o,
							selected: true
						})
						return true;
					}
				},
				radio2: {
					name: chart.options.locale.getMessage('line'),
					icon: function($element, key, item){
						if(o['renderAs'] == "Line"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						chart.onDrawModeSelected({
							type: 'Line',
							object: o,
							selected: true
						})
						return true;
					}
				},
				radio3: {
					name: chart.options.locale.getMessage('line_and_histogram',"Line and Histogram"),
					icon: function($element, key, item){
						if(o['renderAs'] == "Line and Histogram"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						chart.onDrawModeSelected({
							type: 'Line and Histogram',
							object: o,
							selected: true
						})
						return true;
					}
				},
				radio4: {
					name: chart.options.locale.getMessage('histogram', "Histogram"),
					icon: function($element, key, item){
						if(o['renderAs'] == "Histogram"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						chart.onDrawModeSelected({
							type: 'Histogram',
							object: o,
							selected: true
						})
						return true;
					}
				},
				radio5: {
					name: chart.options.locale.getMessage('bars', "Bars"),
					icon: function($element, key, item){
						if(o['renderAs'] == "Bars"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						chart.onDrawModeSelected({
							type: 'Bars',
							object: o,
							selected: true
						})
						return true;
					}
				},
				"sep1": "---------",
				priceMarker: {
					name: chart.options.locale.getMessage('show_price_marker', "Show price marker"),
					icon: function($element, key, item){
						if(o['priceTag'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key, options){
						o['priceTag'] = !o['priceTag'];
						return true;
					}
				},
				priceLine: {
					name: chart.options.locale.getMessage('show_price_line', "Show price line"),
					icon: function($element, key, item){
						if(o['priceLine'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key, options){
						o['priceLine'] = !o['priceLine'];
						return true;
					}
				},

		}
		return menuItems;
	};


	this.getRenderMode = function(o, model){
		if (model.periodWidth < 1) {
			switch (o.renderAs.toLowerCase()) {
				case 'histogram':
					return 'Histogram';
					break;
				case 'volume histogram':
					return 'Volume Histogram';
					break;
				case 'line and histogram':
					return 'ChartShape';
					break;
				case 'band':
					return 'Band';
					break;
				default:
					return 'Line';
			}
		} else return o.renderAs;
	}

	this.render	=	function (o, ctx, renderer, model, panel, seriesManager) {
		renderer.validateSeriesBeforeRender(seriesManager[o.dataLink]);
		
		if (model._leftIndex >= seriesManager[o.dataLink].data.length) return;

		o.strokeStyle = o.color;
		const renderMode = this.getRenderMode(o, model).toLowerCase();

		if (renderMode === 'ohlc') return this.renderAsOHLC(o, ctx, renderer, model, panel, seriesManager);
		if (renderMode === 'bars') return this.renderAsBars(o, ctx, renderer, model, panel, seriesManager);
		if (renderMode === 'line') return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
		if (renderMode === 'chartshape') return this.renderAsChartShape(o, ctx, renderer, model, panel, seriesManager);
		if (renderMode === 'histogram') return this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
		if (renderMode === 'volume histogram') return this.renderAsVolumeHistogram(o, ctx, renderer, model, panel, seriesManager);
		if (renderMode === 'line and histogram') {
			this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
			this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
			return;
		}
		if (renderMode === 'band') {
			this.renderAsBand(o, ctx, renderer, model, panel, seriesManager);
			this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
			this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
			return;
		}

		//default
		return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
	}


	this.renderOverlay	=	function (o, ctx, renderer, model, panel, seriesManager) {
		if (o.selected) {
			if (this.getRenderMode(o, model)=='Line' || this.getRenderMode(o, model)=='ChartShape') this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager); 
			else if (this.getRenderMode(o, model)=='Band') {
					this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
					this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
				} else 	if (this.getRenderMode(o, model)=='OHLC' || this.getRenderMode(o, model)=='Bars') {
						this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.highDataField);
						this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.lowDataField);
					} else
						if (this.getRenderMode(o, model)=='Line and Histogram' || this.getRenderMode(o, model)=='Histogram' || this.getRenderMode(o, model) == 'Volume Histogram') {
							this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
						}
		}

		if (o._hit && o._hit.x && o._hit.y)
			this.drawHit(o, ctx, renderer, model, panel, seriesManager);

	}

	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {
		if (o.priceTag && seriesManager[o.dataLink].data.length > 0) this.renderPriceTag(o, ctx, renderer, model, panel, seriesManager);
	}

	this.renderPriceTag	=	function (o, ctx, renderer, model, panel, seriesManager) {
		if(!seriesManager[o.dataLink]) return;

		var value = 0;
		var open = 0;
		var valueY = 0;
		var color =  WEBRCP.utils.colorManager.getColor(o.color, o.color);
		var textColor = WEBRCP.utils.getContrastColor(o.color);

		var dfO = o.openDataField ? o.openDataField : o.dataField;
		var dfC = o.closeDataField ? o.closeDataField : o.dataField;

		if (this.getRenderMode(o, model)=='Line' || this.getRenderMode(o, model)== "Line and Histogram"  || this.getRenderMode(o, model)=='Histogram'){
			var data = seriesManager[o.dataLink].data;
			value = data[data.length-1][o.dataField];
		}

		if (this.getRenderMode(o, model)=='OHLC' || this.getRenderMode(o, model)=='Bars') {
			value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length-1][dfC];
			open = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length-1][dfO];

			if (value - open > 0) {
				color = WEBRCP.utils.colorManager.getColor("chartGreenBackground");
			} else {
				color = WEBRCP.utils.colorManager.getColor("chartRed");
			}
		}

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		valueY = renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		renderer.drawPriceTag (ctx, model, panel, valueY, color, textColor, value, 'real');
	}

	this.renderAsHistogram	= function (o, ctx, renderer, model, panel, seriesManager) {

		var indexX = 0; var valueY = 0; var midX = 0; var zeroY = 0;

		var stroke = o.color;

		ctx.strokeStyle = stroke;
		ctx.lineWidth = o.width;

		var field = o.dataField;
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		zeroY = renderer.getYCoordinateForPrice(0, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;

		for (var i=model._leftIndex; i<=model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (seriesManager[o.dataLink].data[i][o.dataField] === null) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {

				midX = indexX;

			} else {

				midX = indexX+parseInt(model._midOffset);

			}

			ctx.beginPath();
			ctx.moveTo(midX, zeroY);
			ctx.lineTo(midX, valueY);
			ctx.stroke();
			ctx.closePath();
		}

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][o.dataField];

			this.renderPriceLine({
				ctx, panel, model, value,
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset
			});
		}

		return true;
	}

	this.renderAsVolumeHistogram = function (o, ctx, renderer, model, panel, seriesManager) {
		if (o.localExtremes.max == 0) return;

		var indexX = 0; var valueY = 0;

		const getColor = (i) => {
			const close = seriesManager[model.mainSeries].data[i]["c"];
			const open = seriesManager[model.mainSeries].data[i]["o"];
			if(close > open)
				return WEBRCP.utils.colorManager.getColor("chartGreen");
			else if(close == open)
				return WEBRCP.utils.colorManager.getColor("exitAllColor");
			else
				return WEBRCP.utils.colorManager.getColor("chartRed");
		}

		ctx.globalAlpha = 0.2;
		const maxHeight = Math.round(panel._height * 0.25);

		var field = o.dataField;
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		for (var i=model._leftIndex; i<=model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;

			let value = seriesManager[o.dataLink].data[i][o.dataField];
			if (value === null) continue;
		
			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			let width = 1;

			if (model.periodWidth > 2) {
				width = model.periodWidth - 2;
				indexX += 1;
			}

			ctx.fillStyle = getColor(i);
			ctx.beginPath();
			
			ctx.rect(indexX, panel._height, width, value / o.localExtremes.max * maxHeight * (-1));
			ctx.fill();
			ctx.closePath();
		}

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][o.dataField];

			this.renderPriceLine({
				ctx, panel, model, value,
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset,
			});
		}

		ctx.globalAlpha = 1;
		return true;
	}

	this.renderAsBand	=	function (o, ctx, renderer, model, panel, seriesManager) {

		var indexX = 0; var valueY = 0; var midX = 0;

		var fill = o.color;


		ctx.fillStyle = fill;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash || []);
		ctx.beginPath();
		ctx.globalAlpha = 0.3;

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		var start = model._leftIndex;
		var end = model._rightIndex;
		if (start > 0) start -= 1;
		if (end < seriesManager[o.dataLink].data.length - 1) end += 1;
		var firstRender = true;

		for (var i = start; i <= end; i++) {
			if (
				i > seriesManager[o.dataLink].data.length - 1 ||
				seriesManager[o.dataLink].data[i] === null ||
				seriesManager[o.dataLink].data[i][o.upperField] === null
			) {
				continue;
			};

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.upperField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {
				midX = indexX;
			} else {
					midX = indexX+parseInt(model._midOffset);
			}

			if (firstRender) {
				ctx.moveTo (midX, valueY);
				firstRender = false;
			} else {
				ctx.lineTo (midX, valueY);
			}

		}

		for (i = end; i >= start - 1; i--) {
			if (
				i > seriesManager[o.dataLink].data.length - 1 ||
				i < 0 ||
				seriesManager[o.dataLink].data[i] === null ||
				seriesManager[o.dataLink].data[i][o.lowerField] === null
			) {
				continue;
			}

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.lowerField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {
				midX = indexX;
			} else {
					midX = indexX+parseInt(model._midOffset);
			}

			ctx.lineTo (midX, valueY);

		}

		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
		return true;
	}

	this.drawSelectionLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {
		var indexX = 0;
		var valueY = 0;
		var midX = 0;

		const field = forceField || o.dataField;
		const fV = LIB.getReferenceValue(o, model, seriesManager);
		const data = seriesManager[o.dataLink].data;

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor('accent');

		for (let i = model._leftIndex; i <= model._rightIndex; i++) {

			if (i > data.length - 1) break;
			if (data[i][field] === null) continue;

			const d = Math.round(50 / model.periodWidth < 1 ? 1 : 50 / model.periodWidth);
			const mod = i % d;

			if (mod == 0) {
				indexX = renderer.getIndexPoint(i, model);
				valueY = renderer.getYCoordinateForPrice(data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset;

				if (this.getRenderMode(o, model) == 'Volume Histogram') {
					if (!data[i][field]) continue;
					valueY = panel._height + panel._offset - 10;
				}

				if (model.periodWidth == 1) {
					midX = indexX;
				} else {
					midX = indexX+parseInt(model._midOffset);
				}

				ctx.beginPath();
				ctx.arc(midX, valueY, 3, 0, 2 * Math.PI, false);
				ctx.fill();
			}
		}
	}

	this.drawHit	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		try {

			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var index = renderer.getPointIndex(o._hit.x, model);
			var x = renderer.getIndexPoint(index, model) + model.periodWidth/ 2;
			var r = 5;
			var field = forceField || o.dataField;

			if (!seriesManager[o.dataLink].data[index]) return;

			if (this.getRenderMode(o, model) == 'Line' || this.getRenderMode(o, model) == 'ChartShape' || this.getRenderMode(o, model) == 'Line and Histogram' || this.getRenderMode(o, model) == 'Histogram') {
				var y = renderer.getYCoordinateForPrice(
						seriesManager[o.dataLink].data[index][field],
						{panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,
						valueAxisMode: panel.valueAxisMode, fV})
						+ panel._offset;
				renderPoint(ctx, x, y, r);
			} else if (this.getRenderMode(o, model) == 'Band') {
				var yUp = renderer.getYCoordinateForPrice(
						seriesManager[o.dataLink].data[index][o.upperField],
						{panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,
						valueAxisMode: panel.valueAxisMode, fV})
						+ panel._offset;
				var yDn = renderer.getYCoordinateForPrice(
						seriesManager[o.dataLink].data[index][o.lowerField],
						{panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,
						valueAxisMode: panel.valueAxisMode, fV})
						+ panel._offset;
				renderPoint(ctx, x, yUp, r);
				renderPoint(ctx, x, yDn, r);
			} else if (this.getRenderMode(o, model) == 'OHLC' || this.getRenderMode(o, model) == 'Bars') {
				var yC = renderer.getYCoordinateForPrice(
						seriesManager[o.dataLink].data[index][o.closeDataField],
						{panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,
						valueAxisMode: panel.valueAxisMode, fV})
						+ panel._offset;
				var yO = renderer.getYCoordinateForPrice(
						seriesManager[o.dataLink].data[index][o.openDataField],
						{panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax,
						valueAxisMode: panel.valueAxisMode, fV})
						+ panel._offset;

				renderPoint(ctx, x, (yC + yO) / 2, r);
			} else if (this.getRenderMode(o, model) == 'Volume Histogram') {
				var y = panel._height + panel._offset - 10;
				renderPoint(ctx, x, y, r);
			}

		} catch (e) {
			console.log("Cant render series hit point", e, index);
		}

		function renderPoint(ctx, x, y ,r , color){
			ctx.beginPath();
			ctx.strokeStyle = WEBRCP.utils.colorManager.getColor('hitColor');
			ctx.arc(x, y, r, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();
		}
	}

	this.getStartIndex = function (start, data, field) {
		for (let i = start - 1; i > 0; --i) {
			if (data[i][field] !== null) return i;
		}
		return 0;
	};

	this.getEndIndex = function (end, data, field) {
		for (let i = end + 1; i < data.length - 1; ++i) {
			if (data[i][field] !== null) return i;
		}
		return data.length - 1;
	};

	this.renderAsLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		var indexX = 0; var valueY = 0; var midX = 0; var lastX = 0; let value = 0;

		var stroke = o.color;

		if (!seriesManager[o.dataLink]) return true;

		if (this.getRenderMode(o, model) === 'Line' && o.dash) { ctx.setLineDash(o.dash || []); }

		ctx.strokeStyle = stroke;
		ctx.lineWidth = o.width;
		ctx.beginPath();

		var link = o.dataLink;
		var field = o.dataField;
		if (forceField) field = forceField;

		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var start = model._leftIndex;
		var end = model._rightIndex;
		if (start > 0) start = this.getStartIndex(start, seriesManager[link].data, field);
		if (end < seriesManager[link].data.length - 1) end = this.getEndIndex(end, seriesManager[link].data, field);
		var firstRender = true;
		for (var i = start; i <= end; i++) {
			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (seriesManager[link].data[i] === null || seriesManager[link].data[i][field] === null) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[link].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {
				midX = indexX;
			} else {
					midX = indexX + parseInt(model._midOffset);
			}

			if (firstRender) {
				ctx.moveTo (midX, valueY);
				firstRender = false;
			} else {
				ctx.lineTo (midX, valueY);
			}


			lastX = indexX;

		}

		ctx.stroke();
		ctx.closePath();

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[link].data.length - 1][field];

			this.renderPriceLine({
				ctx, panel, model, value,
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset,
			});
		}

		return true;
	}

	this.renderAsOHLC	=	function (o, ctx, renderer, model, panel, seriesManager) {
		let startX = 0; var highY = 0; var lowY = 0; var openY = 0; var closeY = 0;

		const redFillColor = WEBRCP.utils.colorManager.getColor("chartRed");
		const greenFillColor = WEBRCP.utils.colorManager.getColor("chartGreen");
		const grayFillColor = WEBRCP.utils.colorManager.getColor("chartGray");
		
		const redStrokeColor = WEBRCP.utils.colorManager.getColor("chartRedStroke");
		const greenStrokeColor = WEBRCP.utils.colorManager.getColor("chartGreenStroke");
		const grayStrokeColor = WEBRCP.utils.colorManager.getColor("chartGray");

		let color = redFillColor;
		let stroke = redStrokeColor;

		ctx.lineWidth = 1;

		let dfH = o.highDataField ? o.highDataField : o.dataField;
		let dfL = o.lowDataField ? o.lowDataField : o.dataField;
		let dfO = o.openDataField ? o.openDataField : o.dataField;
		let dfC = o.closeDataField ? o.closeDataField : o.dataField;

		const roundedPeriodWidth = Math.round(model.periodWidth);
		const data = seriesManager[o.dataLink].data;
		const panelOffset = panel._offset;
		const panelProps = {
			panelHeight: panel._height,
			minValue: panel.vMin,
			maxValue: panel.vMax,
			valueAxisMode: panel.valueAxisMode,
			fV: LIB.getFirstAvailableValue(model, data, dfC)
		};

		for (var i = model._leftIndex; i <= model._rightIndex; i++) {
			const dataPrice = data[i];

			if (i > data.length - 1) continue;
			if (dataPrice[dfH] === null) continue;

			startX = roundAndTranslate(renderer.getIndexPoint(i, model));
			highY = Math.round(renderer.getYCoordinateForPrice(dataPrice[dfH], panelProps) + panelOffset);
			lowY = Math.round(renderer.getYCoordinateForPrice(dataPrice[dfL], panelProps) + panelOffset);
			openY = roundAndTranslate(renderer.getYCoordinateForPrice(dataPrice[dfO], panelProps) + panelOffset);
			closeY = Math.round(renderer.getYCoordinateForPrice(dataPrice[dfC], panelProps) + panelOffset);

			const rightX = startX + roundedPeriodWidth;
			const midX = roundAndTranslate(rightX - roundedPeriodWidth / 2);

			const change = dataPrice[dfC] - dataPrice[dfO];

			if (change > 0) {
				color = greenFillColor;
				stroke = greenStrokeColor;
			} else if (change < 0) {
				color = redFillColor;
				stroke = redStrokeColor;
			} else {
				color = grayFillColor;
				stroke = grayStrokeColor;
			}

			ctx.strokeStyle = stroke;
			ctx.fillStyle = color;
			ctx.strokeWidth = 1;

			ctx.beginPath();
			ctx.moveTo(midX, highY);
			ctx.lineTo(midX, lowY);
			ctx.stroke();
			ctx.closePath();

			if (roundedPeriodWidth > 3) {
				ctx.beginPath()
				ctx.rect(startX + 1, openY, roundedPeriodWidth - 2, closeY - openY)
				ctx.fill();
				ctx.stroke();
				ctx.closePath();
			}
		}

		if (o.priceLine) {
			const value = data[data.length - 1][dfC];

			this.renderPriceLine({
				ctx, panel, model, value, green: greenFillColor, red: redFillColor,
				open: data[data.length - 1][dfO],
				y: renderer.getYCoordinateForPrice(value, panelProps) + panelOffset
			});
		}

		return true;
	}


	this.renderAsBars	=	function (o, ctx, renderer, model, panel, seriesManager) {

		var indexX = 0; var highY = 0; var lowY = 0; var openY = 0; var closeY = 0;

		var red = WEBRCP.utils.colorManager.getColor("chartRed");
		var green = WEBRCP.utils.colorManager.getColor("chartGreen");
		var gray = WEBRCP.utils.colorManager.getColor("chartGray");
		var redStroke = WEBRCP.utils.colorManager.getColor("chartRedStroke");
		var greenStroke = WEBRCP.utils.colorManager.getColor("chartGreenStroke");
		var color = red;
		var stroke = redStroke;
		var grayStroke = WEBRCP.utils.colorManager.getColor("chartGray");
		var rightX = 0; var midX = 0;


		ctx.lineWidth = 1;

		var dfH = o.highDataField ? o.highDataField : o.dataField;
		var dfL = o.lowDataField ? o.lowDataField : o.dataField;
		var dfO = o.openDataField ? o.openDataField : o.dataField;
		var dfC = o.closeDataField ? o.closeDataField : o.dataField;

		var fV = LIB.getFirstAvailableValue(model, seriesManager[o.dataLink].data, dfC);

		for (var i=model._leftIndex; i<=model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (seriesManager[o.dataLink].data[i][dfH] === null) continue;

			const dataPrice = seriesManager[o.dataLink].data[i];
			const panelProps = {
				panelHeight: panel._height,
				minValue: panel.vMin,
				maxValue: panel.vMax,
				valueAxisMode: panel.valueAxisMode,
				fV
			};

			indexX 	= renderer.getIndexPoint(i, model);
			highY 	= renderer.getYCoordinateForPrice(dataPrice[dfH], panelProps)+panel._offset;
			lowY 	= renderer.getYCoordinateForPrice(dataPrice[dfL], panelProps)+panel._offset;
			openY 	= renderer.getYCoordinateForPrice(dataPrice[dfO], panelProps)+panel._offset;
			closeY 	= renderer.getYCoordinateForPrice(dataPrice[dfC], panelProps)+panel._offset;

			if (model.periodWidth==1) {
				rightX = indexX;
				midX = indexX;
			} else
				if (model.periodWidth==2) {
					rightX = indexX;
					midX = indexX;
				} else
					if (model.periodWidth==3) {
						rightX = indexX+1;
						midX = indexX+1;
						indexX = indexX+1;
					} else
						if (model.periodWidth==4) {
							rightX = indexX+2;
							midX = indexX+1;
						} else
							if (model.periodWidth==5) {
								rightX = indexX+3;
								midX = indexX+1;
							} else
								if (model.periodWidth==6) {
									rightX = indexX+4;
									midX = indexX+2;
								} else
									if (model.periodWidth>6) {

										midX = indexX+parseInt(model._midOffset);
										rightX = indexX+model.periodWidth-2;
										indexX = indexX+1;

									} else {
										midX = indexX+parseInt(model._midOffset);
										rightX = indexX+model.periodWidth-1;
									}

			if (seriesManager[o.dataLink].data[i][dfC]-seriesManager[o.dataLink].data[i][dfO]>0) {

				color = green;
				stroke = greenStroke;

			} else if (seriesManager[o.dataLink].data[i][dfC]-seriesManager[o.dataLink].data[i][dfO]<0) {

				color = red;
				stroke = redStroke;

			} else{
				color = gray;
				stroke = grayStroke;
			}

			if (model.periodWidth<3) {

				ctx.strokeStyle = stroke;
				ctx.beginPath();
				ctx.moveTo(midX, highY);
				ctx.lineTo(midX, lowY);
				ctx.stroke();

			} else {

				ctx.strokeStyle = stroke;//grayStroke;
				ctx.beginPath();
				ctx.moveTo(midX, highY);
				ctx.lineTo(midX, lowY);
				ctx.moveTo(indexX, openY);
				ctx.lineTo(midX, openY);
				ctx.moveTo(rightX, closeY);
				ctx.lineTo(midX, closeY);
				ctx.stroke();
				ctx.closePath();
				ctx.beginPath();
				ctx.closePath();
			}

		}

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][dfC];

			this.renderPriceLine({
				ctx, panel, model, value, green, red,
				open: seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][dfO],
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset,
			});
		}

		return true;
	}

	
	this.renderAsChartShape	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {
		let indexX = 0; var valueY = 0; var midX = 0; var lastX = 0;
		let field = o.closeDataField ? o.closeDataField : o.dataField;
		const data = seriesManager[o.dataLink].data;

		if (forceField) field = forceField;

		ctx.strokeStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('chartStroke');
		ctx.fillStyle = o.color ? o.color : WEBRCP.utils.colorManager.getColor('chartFill');
		ctx.lineWidth = o.width ? o.width : 1;
		ctx.beginPath();

		const zeroY = renderer.getYCoordinateForPrice(0, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
		const fV = LIB.getFirstAvailableValue(model, data, field);
		const start = getFirstValueBeforeStart(model._leftIndex, data, field);
		const end = getFirstValueAfterEnd(model._rightIndex, data, field);
		
		let firstRender = true;
		let firstX = -5;

		for (var i = 0; i <= data.length - 1; i++) {
			if (i > data.length - 1) continue;
			if ((data[i] === null || data[i][field] === null) && i !== end && i !== data.length - 1) continue;

			indexX = renderer.getIndexPoint(i, model);
			valueY = renderer.getYCoordinateForPrice(data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset;

			if (model.periodWidth == 1) {
				midX = indexX;
			} else {
				midX = indexX+parseInt(model._midOffset);
			}

			if (firstRender) {
				ctx.moveTo(midX, valueY);
				firstRender = false;
				firstX = midX;
			} else {
				ctx.lineTo (midX, valueY);
			}

			if (i === end) {
				ctx.lineTo(panel._width, valueY || zeroY);
				ctx.stroke();
				ctx.lineTo(panel._width, zeroY);
				ctx.lineTo(firstX, zeroY);
			}

			if (i == data.length - 1) {
				ctx.stroke();
				ctx.lineTo(midX, zeroY);
				ctx.lineTo(firstX, zeroY);
			}

			lastX = indexX;
		}
		ctx.closePath();
		ctx.fill();

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][field];

			this.renderPriceLine({
				ctx, panel, model, value,
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax}) + panel._offset
			});
		}

		function getFirstValueBeforeStart(leftIndex, data, field) {
			let start = leftIndex;

			if (!data[leftIndex] || !data[leftIndex][field]) {
				for (let i = leftIndex; i >= 0; i--) {
					if (data[i] && data[i][field]) start = i;
				}
			}
			
			if (start > 0) start -= 1;
			return start;
		}

		function getFirstValueAfterEnd(rightIndex, data, field) {
			let end = rightIndex;

			if (!data[rightIndex] || !data[rightIndex][field]) {
				for (let i = rightIndex; i <= data.length; i++) {
					if (data[i] && data[i][field]) end = i;
				}
			}
			
			if (end < data.length - 1) end += 1;
			return end;
		}
	}

	this.renderPriceLine = function(options) {
		const {ctx, panel, model, y, value, green, red, open} = options;
		const roundedY = roundAndTranslate(y);

		if (open) {
			ctx.strokeStyle = (value - open > 0) ? green : red;
		}

		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.setLineDash([5, 5]);
		ctx.moveTo(0, roundedY);
		ctx.lineTo(panel._width - model.valueAxisWidth, roundedY);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.closePath();
	}

	this.updateExtremes	=	function (o, extremes, model, seriesManager) {
		if(!seriesManager[o.dataLink] || !seriesManager[o.dataLink].data || seriesManager[o.dataLink].data.length == 0) return;

		if (this.getRenderMode(o, model)=='OHLC' || this.getRenderMode(o, model)=='Bars') return this.updateExtremesOHLC(o, extremes, model, seriesManager);
		return this.updateExtremesLine(o, extremes, model, seriesManager);
	}

	this.updateExtremesOHLC	=	function (o, extremes, model, seriesManager) {

		var dfH = o.highDataField ? o.highDataField : o.dataField;
		var dfL = o.lowDataField ? o.lowDataField : o.dataField;
		var dfO = o.openDataField ? o.openDataField : o.dataField;
		var dfC = o.closeDataField ? o.closeDataField : o.dataField;

		for (var i=model._leftIndex; i<model._rightIndex; i++) {
			if (i>seriesManager[o.dataLink].data.length-1) return;
			
			if (seriesManager[o.dataLink].data[i][dfH] !== null && seriesManager[o.dataLink].data[i][dfH]>extremes.max) extremes.max = seriesManager[o.dataLink].data[i][dfH];
			if (seriesManager[o.dataLink].data[i][dfL] !== null && seriesManager[o.dataLink].data[i][dfL]<extremes.min) extremes.min = seriesManager[o.dataLink].data[i][dfL];
		}

	}

	this.updateExtremesLine	=	function (o, extremes, model, seriesManager) {
		const renderMode = this.getRenderMode(o, model).toLowerCase();

		if (renderMode == "volume histogram") {
			const localExtremes = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };
			
			for (var i=model._leftIndex; i<model._rightIndex; i++) {
				if (seriesManager[o.dataLink]==undefined || i>seriesManager[o.dataLink].data.length-1) {
					o.localExtremes = localExtremes;
					return;
				}
				if (seriesManager[o.dataLink].data[i][o.dataField] === null) continue;

				if (seriesManager[o.dataLink].data[i][o.dataField]>localExtremes.max) localExtremes.max = seriesManager[o.dataLink].data[i][o.dataField];
				if (seriesManager[o.dataLink].data[i][o.dataField]<localExtremes.min) localExtremes.min = seriesManager[o.dataLink].data[i][o.dataField];
			}

			o.localExtremes = localExtremes;
		} else {
			for (var i=model._leftIndex; i<model._rightIndex; i++) {
				if (seriesManager[o.dataLink]==undefined || i>seriesManager[o.dataLink].data.length-1) {
					return;
				}
				if (seriesManager[o.dataLink].data[i][o.dataField] === null) continue;

				if (seriesManager[o.dataLink].data[i][o.dataField]>extremes.max) extremes.max = seriesManager[o.dataLink].data[i][o.dataField];
				if (seriesManager[o.dataLink].data[i][o.dataField]<extremes.min) extremes.min = seriesManager[o.dataLink].data[i][o.dataField];
			}
		}
	}

	this.getToolTip = function(o, index, model, seriesManager, scriptManager){
		const values = [];
		const fields = seriesManager[o.dataLink].fields;
		const labels = seriesManager[o.dataLink].labels;

		for (var f in fields) {
			values.push({
				label: WEBRCP.locale.fusion.getMessage(labels[f], labels[f]),
				value: seriesManager[o.dataLink].data[index][fields[f]]
			});
		}

		const data = {
			title: getScriptTitle(o, model, seriesManager, scriptManager),
			stamp: seriesManager[o.dataLink].data[index].stamp,
			values: values
		};

		return data;
	};

	this.tmpIndex	=	0;
	this.tmpValue	=	0;
	this.tmpPoint	=	0;

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		this.clearHits(o);

		if(o.hidden == true) return false;

		const renderMode = this.getRenderMode(o, model).toLowerCase();

		if (renderMode=='ohlc') return this.hitOHLC (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='line') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='bars') return this.hitBars (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='chartshape') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='band') return this.hitBand (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='line and histogram') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='histogram') return this.hitHistogram (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (renderMode=='volume histogram') return this.hitVolumeHistogram (x, y, o, renderer, interactor, model, panel, seriesManager);

		return false;
	}

	this.isHitEmpty = function(pointX, pointY, o, renderer, interactor, model, panel, seriesManager) {
		const index = renderer.getPointIndex(pointX, model);
		const value = seriesManager[o.dataLink];

		if (!value || !value.data || index > value.data.length - 1) return true;

		let allValuesEmpty = true;
		let field = null;

		for (field in value.fields) {
			if (index == NaN || !value.data[index]) return true;
			const fieldValue = value.data[index][value.fields[field]];
			if (
				fieldValue !== null &&
				fieldValue !== undefined
			) {
				allValuesEmpty = false;
			}
		}

		return allValuesEmpty;
	};

	this.hitOHLC	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if (this.isHitEmpty.apply(this, arguments)) return false;

		this.tmpIndex = renderer.getPointIndex(x, model);
		
		var hitResult = false;
		var dfH = o.highDataField ? o.highDataField : o.dataField;
		var dfL = o.lowDataField ? o.lowDataField : o.dataField;

		var valueH = seriesManager[o.dataLink].data[this.tmpIndex][dfH];
		var valueL = seriesManager[o.dataLink].data[this.tmpIndex][dfL];

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		this.tmpValue = renderer.getPriceForYCoordinate(y-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV});
		if (this.tmpValue<=valueH&&this.tmpValue>=valueL){
			hitResult = true;
		}else{
			var pointH = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][dfH], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			var pointL = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][dfL], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			if(pointH==pointL){
				hitResult = isPointInCircle({x:x, y:pointH,r:4+this.hitTolerance },x,y);
			}
		}
		o._hit = hitResult==true ? {x:x, y:y} : false;
		return hitResult;
	}
	
	this.hitBars	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if (this.isHitEmpty.apply(this, arguments)) return false;

		var hitResult = false;
		var dfH = o.highDataField ? o.highDataField : o.dataField;
		var dfL = o.lowDataField ? o.lowDataField : o.dataField;

		var index = renderer.getPointIndex(x, model);

		var valueH = seriesManager[o.dataLink].data[index][dfH];
		var valueL = seriesManager[o.dataLink].data[index][dfL];
		var indexX = renderer.getIndexPoint(index, model)+model.periodWidth/2;

		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var indexY = renderer.getPriceForYCoordinate(y-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV});
		var indexH = renderer.getYCoordinateForPrice(valueH, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var indexL = renderer.getYCoordinateForPrice(valueL, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		

		if( between(indexX-1, x, indexX+1, this.hitTolerance) 
			&&
			between(indexH, y, indexL, this.hitTolerance)
		){
			hitResult = true;
		}

		o._hit = hitResult==true ? {x:x, y:y} : false;
		return hitResult;
	}

	this.getLineHitResult = function (x, y, o, renderer, interactor, model, panel, seriesManager, dataField) {
		if (this.isHitEmpty.apply(this, arguments)) return false;
		var index = renderer.getPointIndex(x, model);
		if (!seriesManager[o.dataLink]) return false;
		if (index > seriesManager[o.dataLink].data.length - 1) return false;
		var closestRightIndex = this.getEndIndex(index, seriesManager[o.dataLink].data, dataField);
		var closestLeftIndex = this.getStartIndex(index, seriesManager[o.dataLink].data, dataField);
		if (seriesManager[o.dataLink].data[index][dataField] === null) index = closestLeftIndex;

		var hitResult = false;
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		var indexY = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[index][dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset;
		//var indexX = Math.round(renderer.getIndexPoint(index, model)+model.periodWidth/2);
		var indexX = renderer.getIndexPoint(index, model) + model.periodWidth / 2;

		if (x > Math.round(indexX) && closestRightIndex < seriesManager[o.dataLink].data.length) {
			var _y = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[closestRightIndex][dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset;
			var _x = renderer.getIndexPoint(closestRightIndex, model) + model.periodWidth / 2;;
			if (between(indexY, y, _y, this.hitTolerance)) {
				var nlp1 = getLinePointNearestMouse({ x0: indexX, y0: indexY, x1: _x, y1: _y }, x, y);
				var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
				if (distance < this.hitTolerance) {
					hitResult = true;
				}
			}
		} else if (x < Math.round(indexX) && closestLeftIndex >= 0) {
			var _y = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[closestLeftIndex][dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset;
			var _x = renderer.getIndexPoint(closestLeftIndex, model) + model.periodWidth / 2;
			if (between(indexY, y, _y, this.hitTolerance)) {
				var nlp1 = getLinePointNearestMouse({ x0: indexX, y0: indexY, x1: _x, y1: _y }, x, y);
				var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });
				if (distance < this.hitTolerance) {
					hitResult = true;
				}
			}

		} else {
			hitResult = interactor.isOver(x, y, x, indexY, 4);
		}

		o._hit = hitResult == true ? { x: x, y: y } : false;
		return hitResult;
	};

	this.hitLine = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		return this.getLineHitResult(x, y, o, renderer, interactor, model, panel, seriesManager, o.dataField);
	};

this.hitHistogram	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if (this.isHitEmpty.apply(this, arguments)) return false;

		var index = renderer.getPointIndex(x, model);

		var hitResult =  false;
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		var indexY = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[index][o.dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var indexX = renderer.getIndexPoint(index, model)+model.periodWidth/2;

		if( between(indexX-1, x, indexX+1, this.hitTolerance) &&
			between(indexY, y, model._height, this.hitTolerance)
		){
				hitResult = true;
		}

		o._hit = hitResult==true ? {x:x, y:y} : false;
		return hitResult;

	}

	this.hitVolumeHistogram	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if (this.isHitEmpty.apply(this, arguments)) return false;

		var index = renderer.getPointIndex(x, model);

		var hitResult =  false;
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		// var indexY = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[index][o.dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		const maxHeight = Math.round(panel._height * 0.25);
		var indexY = panel._height + panel._offset - seriesManager[o.dataLink].data[index][o.dataField] / o.localExtremes.max * maxHeight;
		var indexX = renderer.getIndexPoint(index, model);

		if (between(indexX, x, indexX + model.periodWidth, this.hitTolerance) && 
			between(indexY, y, panel._height + panel._offset, this.hitTolerance)) {
			hitResult = true;
			console.log("hit");
		}

		o._hit = hitResult==true ? {x:x, y:y} : false;
		return hitResult;
	}


	this.hitBand	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		const upperHitResult = this.getLineHitResult(x, y, o, renderer, interactor, model, panel, seriesManager, o.upperField);
		if (upperHitResult) return upperHitResult;

		const lowerHitResult = this.getLineHitResult(x, y, o, renderer, interactor, model, panel, seriesManager, o.lowerField);
		if (lowerHitResult) return lowerHitResult;

		return false;
	};

	this.getMin 	=		function(index, o, seriesManager){
		var min = Number.MAX_VALUE;
		var data = seriesManager[o['dataLink']].data;
		var fields = seriesManager[o['dataLink']].fields;
		for(var i =0; i< fields.length;i++){
			if(fields[i]!='v' && fields[i]!='i'){
				if(data[index][fields[i]] < min)
					min = data[index][fields[i]];
			}
		}
		return min;
	}

	this.getMax 	=		function(index, o, seriesManager){
		var max = - Number.MAX_VALUE;
		var data = seriesManager[o['dataLink']].data;
		var fields = seriesManager[o['dataLink']].fields;
		for(var i =0; i< fields.length;i++){
			if(fields[i]!='v' && fields[i]!='i'){
				if(data[index][fields[i]] > max)
					max = data[index][fields[i]];
			}
		}
		return max;
	}


}


/*
 * Próba wydzielenia z SeriesObjecta oddzielnego renderera dla seri wskaźników
 * - sporo przeróbek w fusion - narazie ostawione na bok
 */
var IndicatorObject	=	function () {
	this.getMenuItems	=	function (o, chart) {
		var object = o;
		if(o.renderAs == 'Band') return null;

		var menuItems	=	{
				radio1: {
					name: chart.options.locale.getMessage('line'),
					icon: function($element, key, item){
						if(o['renderAs'] == "Line"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						o['renderAs'] = "Line";
						return true;
					}
				},
				radio2: {
					name: chart.options.locale.getMessage('line_and_histogram',"Line and Histogram"),
					icon: function($element, key, item){
						if(o['renderAs'] == "Line and Histogram"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						o['renderAs'] = "Line and Histogram";
						return true;
					}
				},
				radio3: {
					name: chart.options.locale.getMessage('histogram', "Histogram"),
					icon: function($element, key, item){
						if(o['renderAs'] == "Histogram"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key, options){
						o['renderAs'] = "Histogram";
						return true;
					}
				},
				"sep1": "---------",

				priceMarker: {
					name: chart.options.locale.getMessage('show_price_marker'),
					icon: function($element, key, item){
						if(o['priceTag'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key, options){
						o['priceTag'] = !o['priceTag'];
						o['priceLine'] = o['priceTag'];
						return true;
					}
				},

		}
		return menuItems;
	};

	this.render	=	function (o, ctx, renderer, model, panel, seriesManager) {
		if(model._leftIndex >= seriesManager[o.dataLink].data.length) return;

		if (o.renderAs=='Line') return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
		if (o.renderAs=='Histogram') return this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
		if (o.renderAs=='Line and Histogram') {
			this.renderAsHistogram(o, ctx, renderer, model, panel, seriesManager);
			this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
			return;
		}
		if (o.renderAs=='Band') {
			this.renderAsBand(o, ctx, renderer, model, panel, seriesManager);
			this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
			this.renderAsLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
			return;
		}

		//default
		return this.renderAsLine(o, ctx, renderer, model, panel, seriesManager);
	}

	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {

		//#draw a closing line

		if (o.priceTag) this.renderPriceTag(o, ctx, renderer, model, panel, seriesManager);

		if (o.selected) {
			if (o.renderAs=='Line' || o.renderAs=='ChartShape') this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager); else
				if (o.renderAs=='Band') {
					this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.upperField);
					this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager, o.lowerField);
				} else if (o.renderAs=='Line and Histogram' || o.renderAs=='Histogram' || o.renderAs == 'Volume Histogram') {
					this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
				} 
		}

	}

	this.renderPriceTag	=	function (o, ctx, renderer, model, panel, seriesManager) {
		if(!seriesManager[o.dataLink]) return;

		var value = 0;
		var open = 0;
		var valueY = 0;
		var color = o.color;
		var textColor = '#ffffff';
		var red = WEBRCP.utils.colorManager.getColor("chartRed");
		var green = WEBRCP.utils.colorManager.getColor("chartGreen");

		var dfO = o.openDataField ? o.openDataField : o.dataField;
		var dfC = o.closeDataField ? o.closeDataField : o.dataField;

		if (o.renderAs=='Line'){
			var data = seriesManager[o.dataLink].data;
			value = data[data.length-1][o.dataField];
		}

		if (o.renderAs=='OHLC' || o.renderAs=='Bars') {
			value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length-1][dfC];
			open = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length-1][dfO];

			if (value-open>0) {
				color = green;
			} else {
				color = red;
			}
		}

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		valueY = renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		renderer.drawPriceTag (ctx, model, panel, valueY, color, textColor, value, 'real');

	}

	this.renderAsHistogram	= function (o, ctx, renderer, model, panel, seriesManager) {

		var indexX = 0; var valueY = 0; var midX = 0; var zeroY = 0;

		var stroke = o.color;

		ctx.strokeStyle = stroke;
		ctx.lineWidth = o.width;

		var field = o.dataField;
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		zeroY = renderer.getYCoordinateForPrice(0, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;

		for (var i=model._leftIndex; i<=model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {

				midX = indexX;

			} else {

				midX = indexX+parseInt(model._midOffset);

			}

			ctx.beginPath();
			ctx.moveTo(midX, zeroY);
			ctx.lineTo(midX, valueY);
			ctx.stroke();

		}

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[o.dataLink].data.length - 1][o.dataField];
			
			this.renderPriceLine({
				ctx, panel, model, value,
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset
			});
		}

		return true;
	}

	this.renderAsBand	=	function (o, ctx, renderer, model, panel, seriesManager) {

		var indexX = 0; var valueY = 0; var midX = 0;

		var fill = o.color;


		ctx.fillStyle = fill;
		ctx.lineWidth = o.width;
		ctx.beginPath();
		ctx.globalAlpha = 0.3;

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		for (var i = model._leftIndex; i <= model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (seriesManager[o.dataLink].data[i][o.upperField] === null) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.upperField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {

				midX = indexX;

			} else {
				if(i == model._leftIndex)
					midX = 0;
				else if(i == model._rightIndex)
					midX = model._width;
				else if(i == seriesManager[o.dataLink].data.length-1 )
					midX = indexX+parseInt(model._midOffset*2);
				else
					midX = indexX+parseInt(model._midOffset);

			}

			if (i == model._leftIndex) {
				ctx.moveTo (midX, valueY);
			} else {
				ctx.lineTo (midX, valueY);
			}

		}

		for (var i=model._rightIndex; i>=model._leftIndex-1; i--) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (i<0) continue;
			if (seriesManager[o.dataLink].data[i][o.lowerField] === null) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][o.lowerField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {

				midX = indexX;

			} else {
				if(i == model._leftIndex)
					midX = 0;
				else if(i == model._rightIndex)
					midX = model._width;
				else if(i == seriesManager[o.dataLink].data.length-1 )
					midX = indexX+parseInt(model._midOffset*2);
				else
					midX = indexX+parseInt(model._midOffset);

			}

			ctx.lineTo (midX, valueY);

		}

		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
		return true;
	}

	this.drawSelectionLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		var indexX = 0; var valueY = 0; var midX = 0; var lastX = 0;

		var field = o.dataField;
		if (forceField) field = forceField;

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		for (var i=model._leftIndex; i<=model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (seriesManager[o.dataLink].data[i][field] === null) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {

				midX = indexX;

			} else {

				midX = indexX+parseInt(model._midOffset);

			}
			
			
			if (midX-lastX>=50) {
				if(i == seriesManager[link].data.length-1 )
					midX = indexX+parseInt(model._midOffset*2);

					ctx.beginPath();
					ctx.arc(midX, valueY, 3, 0, 2 * Math.PI, false);
					ctx.fill();
					lastX = midX;			
			}
		}
	}

	this.renderAsLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		var indexX = 0; var valueY = 0; var midX = 0; var lastX = 0;

		var stroke = o.color;
		ctx.strokeStyle = stroke;
		ctx.lineWidth = o.width;
		ctx.beginPath();

		if(!seriesManager[o.dataLink]) return true;

		var link = o.dataLink;
		var field = o.dataField;
		if (forceField) field = forceField;

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		for (var i=model._leftIndex; i<=model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;
			if (seriesManager[link].data[i][field] === null) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			valueY 	= renderer.getYCoordinateForPrice(seriesManager[link].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if (model.periodWidth==1) {

				midX = indexX;

			} else {
				if(i == model._leftIndex)
					midX = 0;
				else if(i == model._rightIndex)
					midX = model._width;
				else if(i == seriesManager[link].data.length-1 )
					midX = indexX+parseInt(model._midOffset*2);
				else
					midX = indexX+parseInt(model._midOffset);
			}

			if (i==model._leftIndex) {
				ctx.moveTo (midX, valueY);
			} else {
				ctx.lineTo (midX, valueY);
			}


			lastX = indexX;

		}

		ctx.stroke();

		if (o.priceLine) {
			const value = seriesManager[o.dataLink].data[seriesManager[link].data.length - 1][field];
			
			this.renderPriceLine({
				ctx, panel, model, value,
				y: renderer.getYCoordinateForPrice(value, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset
			});
		}

		return true;
	}

	this.updateExtremes	=	function (o, extremes, model, seriesManager) {
		return this.updateExtremesLine(o, extremes, model, seriesManager);
	}

	this.updateExtremesLine	=	function (o, extremes, model, seriesManager) {
		for (var i=model._leftIndex; i<model._rightIndex; i++) {
			if (seriesManager[o.dataLink]==undefined || i>seriesManager[o.dataLink].data.length-1) {

				return;
			}
			if (seriesManager[o.dataLink].data[i][o.dataField]>extremes.max) extremes.max = seriesManager[o.dataLink].data[i][o.dataField];
			if (seriesManager[o.dataLink].data[i][o.dataField]<extremes.min) extremes.min = seriesManager[o.dataLink].data[i][o.dataField];
		}
	}

	this.tmpIndex	=	0;
	this.tmpValue	=	0;
	this.tmpPoint	=	0;

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if(o.hidden == true) return false;
		if (o.renderAs=='Line') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (o.renderAs=='ChartShape') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (o.renderAs=='Band') return this.hitBand (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (o.renderAs=='Line and Histogram') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);
		if (o.renderAs=='Histogram') return this.hitLine (x, y, o, renderer, interactor, model, panel, seriesManager);

		return false;
	}

	this.hitLine	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {

		this.tmpIndex = renderer.getPointIndex(x, model);

		if(! seriesManager[o.dataLink]) return false;

		if (this.tmpIndex>seriesManager[o.dataLink].data.length-1) return false;

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		this.tmpPoint = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][o.dataField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

		return interactor.isOver(x, y, x, this.tmpPoint, 4);

	}

	this.hitBand	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {

		this.tmpIndex = renderer.getPointIndex(x, model);
		if (this.tmpIndex>seriesManager[o.dataLink].data.length-1) return false;

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		this.tmpPoint = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][o.upperField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		if (interactor.isOver(x, y, x, this.tmpPoint, 4)) return true;
		this.tmpPoint = renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[this.tmpIndex][o.lowerField], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		if (interactor.isOver(x, y, x, this.tmpPoint, 4)) return true;

		return false;

	}

	this.getMin = function(index, o, seriesManager) {
    var min = Number.MAX_VALUE;
    var data = seriesManager[o["dataLink"]].data;
    var fields = seriesManager[o["dataLink"]].fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] != "v" && fields[i] != "i") {
				var value = data[index][fields[i]];
        if (value !== null && value < min) min = data[index][fields[i]];
      }
		}
    return min;
  };

	this.getMax = function(index, o, seriesManager) {
    var max = -Number.MAX_VALUE;
    var data = seriesManager[o["dataLink"]].data;
    var fields = seriesManager[o["dataLink"]].fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] != "v" && fields[i] != "i") {
				var value = data[index][fields[i]]
        if (value !== null && value > max) max = data[index][fields[i]];
      }
		}
    return max;
  };


}



var StrategyObject	=	function () {
	this.downRenderedValues = [1,2,-3];
	this.upperRenderedValues = [-1,-2,-3];

	this.getMenuItems	=	function (o, chart) {
		return null;
	};

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		renderer.validateSeriesBeforeRender(seriesManager[o.dataLink]);

		var indexX = 0; var valueY = 0; var midX = 0; var lastX = 0;

		var stroke = o.color;
		var field = o.dataField;
		if (forceField) field = forceField;

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		ctx.strokeStyle = stroke;
		ctx.lineWidth = o.width;

		for (var i=model._leftIndex; i<model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;

			var strategyValue = seriesManager[o.dataLink].data[i][field];
			if(strategyValue==FUSION.DO_NOTHING) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			//valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
			const valuesY 	= this.getPointY4StrategyValue(o, i, strategyValue, panel, renderer, model, seriesManager);

			if (model.periodWidth==1) {
				midX = indexX;
			} else {
				midX = indexX+parseInt(model._midOffset);
			}

			if(strategyValue==FUSION.BUY)
				this.drawBuy(ctx,midX,valuesY.dn);
			else if(strategyValue==FUSION.SELL)
				this.drawSell(ctx,midX,valuesY.up);
			else if(strategyValue==FUSION.EXIT_LONG)
				drawExitLong(ctx,midX,valuesY.dn);
			else if(strategyValue==FUSION.EXIT_SHORT)
				drawExitShort(ctx,midX,valuesY.up);
			else if(strategyValue==FUSION.EXIT_ALL){
				this.drawExitAll(ctx,midX,valuesY.up, "up");
				this.drawExitAll(ctx,midX,valuesY.dn, "down");
			}
			lastX = indexX;

		}
		//ctx.globalAlpha = 1;
		return true;
	}

	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {}

	this.renderOverlay	=	function (o, ctx, renderer, model, panel, seriesManager) {
		if (o.selected) {
			this.drawSelectionLine(o, ctx, renderer, model, panel, seriesManager);
		}

		if (o._hit && o._hit.x && o._hit.y)
			this.drawHit(o, ctx, renderer, model, panel, seriesManager);
	}

	this.renderPriceTag	=	function (o, ctx, renderer, model, panel, seriesManager) {}

	this.getToolTip = function(o, index, model, seriesManager, scriptManager) {
			const values = [];
			const fields = seriesManager[o.dataLink].fields;
			const labels = seriesManager[o.dataLink].labels;

			for(var f in fields){
				var v = valToString(seriesManager[o.dataLink].data[index][fields[f]])+" ("+seriesManager[o.dataLink].data[index].strength+")";
				values.push({
					label: WEBRCP.locale.fusion.getMessage(labels[f], labels[f]),
					value: v
				})
			}

			var data = {
					title: getScriptTitle(o, model, seriesManager, scriptManager),
					stamp: seriesManager[o.dataLink].data[index].stamp,
					values: values
				}

			return data;

			function valToString(v){
				switch(v){
					case 1: return "BUY";
					case -1: return "SELL";
					case 2: return "EXIT LONG";
					case -2: return "EXIT SHORT";
					case -3: return "EXIT ALL";
					default: return v;
				}
			}
		}

	this.drawSelectionLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		var indexX = 0;
		var valuesY = {};
		var midX = 0;
		var lastX = 0;

		var field = o.dataField;
		if (forceField) field = forceField;

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

		for (var i=model._leftIndex; i<model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;

			var strategyValue = seriesManager[o.dataLink].data[i][field];
			if(strategyValue==FUSION.DO_NOTHING) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			//valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
			valuesY 	= this.getPointY4StrategyValue(o, i, strategyValue, panel, renderer, model, seriesManager);

			if (model.periodWidth==1) {
				midX = indexX;

			} else {
				midX = indexX+parseInt(model._midOffset);
			}

			ctx.beginPath();
			if(strategyValue==FUSION.BUY)
				ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
			else if(strategyValue==FUSION.SELL)
				ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
			else if(strategyValue==FUSION.EXIT_LONG)
				ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
			else if(strategyValue==FUSION.EXIT_SHORT)
				ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
			else if(strategyValue==FUSION.EXIT_ALL){
				ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
				ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
			}
			ctx.fill();
			lastX = midX;
		}
	}

	this.drawHit	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {

		try {

			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var index = renderer.getPointIndex(o._hit.x, model);
			var x = renderer.getIndexPoint(index, model) + model.periodWidth/ 2;
			var r = 5;
			var field = forceField || o.dataField;

			var strategyValue = seriesManager[o.dataLink].data[index][field];
			var valuesY 	= this.getPointY4StrategyValue(o, index, strategyValue, panel, renderer, model, seriesManager);

			if(this.downRenderedValues.indexOf(strategyValue) >= 0 )
				renderPoint(ctx, x, valuesY.dn, r);

			if(this.upperRenderedValues.indexOf(strategyValue) >= 0 )
				renderPoint(ctx, x, valuesY.up, r);

		} catch (e) {
			console.log("Cant render series hit point", e);
		}

		function renderPoint(ctx, x, y ,r , color){
			ctx.beginPath();
			ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("hitColor");
			ctx.globalAlpha = 0.7;
			ctx.arc(x, y, r, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();
		}
	}


	this.updateExtremes	=	function (o, extremes, model, seriesManager, panel, renderer) {

		return null;

//		var updateMax = extremes.max;
//		var updateMin = extremes.min;
//		if(o._lastExtremes)
//			if(o._lastExtremes.up == updateMax || o._lastExtremes.dn == updateMin)
//				o._lastExtremes = null;
//
//		for (var i=model._leftIndex; i<model._rightIndex; i++) {
//			if (seriesManager[o.dataLink]==undefined || i>seriesManager[o.dataLink].data.length-1) {
//				continue;
//			}
//
//			var strategyValue = seriesManager[o.dataLink].data[i][o.dataField];
//			if(strategyValue==FUSION.DO_NOTHING) continue;
//
//			var vs = getValuesY4StrategyValue(o, i, strategyValue, panel, renderer, model,seriesManager)
//			if(updateMax < vs.up) updateMax = vs.up;
//			if(updateMin > vs.dn) updateMin = vs.dn;
//		}
//		if(o._lastExtremes){
//			var p = model.instrumentsSeries[0].instrument.precision;
//			if(Math.abs(Math.abs(o._lastExtremes.up)-Math.abs(extremes.max)) > 1/Math.pow(10,p)){
//				extremes.max = updateMax;
//				o._lastExtremes.up = updateMax;
//			}
//			if(Math.abs(Math.abs(o._lastExtremes.dn)-Math.abs(extremes.min)) > 1/Math.pow(10,p)){
//				extremes.min = updateMin;
//				o._lastExtremes.dn = updateMin;
//			}
//		}else{
//			o._lastExtremes = {up: updateMax, dn: updateMin};
//			extremes.max = updateMax;
//			extremes.min = updateMin;
//		}

	}




	this.getValuesY4StrategyValue = function(o, index, strategyValue, panel, renderer, model, seriesManager){
		var sv = {up:Number.MIN_VALUE, dn:Number.MAX_VALUE};
		var o = null;
		if(panel){
			for(var i=0; i<panel.objects.length;i++){
				if(panel.objects[i].type && panel.objects[i].type=="SeriesObject" && seriesManager[panel.objects[i]['dataLink']].data[index]){
					o = panel.objects[i];
					break;
				}
			}
		}

		if(o){
			var seriesObject = renderer.objects['SeriesObject'];
			var max = seriesObject.getMax(index,o,seriesManager);
			var min = seriesObject.getMin(index,o,seriesManager);

			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var vup	= renderer.getYCoordinateForPrice(max, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			var vdn	= renderer.getYCoordinateForPrice(min, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

			if(strategyValue == FUSION.BUY || strategyValue==FUSION.SELL){
				vup-=10;
				vdn+=10;
			}else if(strategyValue == FUSION.EXIT_LONG || strategyValue==FUSION.EXIT_SHORT){
				vup-=22;
				vdn+=22;
			}else{
				vup-=36;
				vdn+=36;
			}
			max = renderer.getPriceForYCoordinate(vup-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV});

			min = renderer.getPriceForYCoordinate(vdn-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV});

			sv = {up:max,dn:min}
		}else{
			sv = {up:1, dn:-1};
		}
		return sv;
	}



	this.getPointY4StrategyValue = function(o, index, strategyValue, panel, renderer, model, seriesManager){
		var sv = this.getValuesY4StrategyValue(o, index, strategyValue, panel, renderer, model, seriesManager);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var vup	= renderer.getYCoordinateForPrice(sv.up, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var vdn	= renderer.getYCoordinateForPrice(sv.dn, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		return {up:vup, dn:vdn};
	}


	this.drawBuy = function(ctx, midX, valueY){
		var self = this;
		var offset = 0;
		ctx.globalAlpha = 1;
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("buyColor");

		// #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
		midX -= 0.5;
		valueY -= 0.5;

		ctx.beginPath();
		ctx.moveTo(midX-5, valueY+4+offset);
		ctx.lineTo(midX+5, valueY+4+offset);
		ctx.lineTo(midX, valueY-4+offset);
		ctx.lineTo(midX-5, valueY+4+offset);
		ctx.fill();
		ctx.closePath();
	}

	this.drawSell = function(ctx, midX, valueY){
		var self = this;
		var offset = 0;
		ctx.globalAlpha = 1;
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");

		// #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
		midX -= 0.5;
		valueY -= 0.5;

		ctx.beginPath();
		ctx.moveTo(midX-5, valueY-4+offset);
		ctx.lineTo(midX+5, valueY-4+offset);
		ctx.lineTo(midX, valueY+4+offset);
		ctx.lineTo(midX-5, valueY-4+offset);
		ctx.fill();
		ctx.closePath();
	}

	function drawExitShort(ctx, midX, valueY){
		var self = this;
		ctx.globalAlpha = 1;
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("sellColor");
		ctx.beginPath();
		var offset = -2;
		ctx.moveTo(midX-4, valueY+4+offset);
		ctx.lineTo(midX, valueY+offset);
		ctx.lineTo(midX+4, valueY+6+offset);
		ctx.lineTo(midX, valueY+6+offset);
		ctx.moveTo(midX+4, valueY+6+offset);
		ctx.lineTo(midX+4, valueY+2+offset);
		ctx.stroke();
		ctx.closePath();
	}

	function drawExitLong(ctx, midX, valueY){
		var self = this;
		ctx.globalAlpha = 1;
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("buyColor");
		ctx.beginPath();
		var offset = +2;
		ctx.moveTo(midX-4, valueY-4+offset);
		ctx.lineTo(midX, valueY+offset);
		ctx.lineTo(midX+4, valueY-6+offset);
		ctx.lineTo(midX, valueY-6+offset);
		ctx.moveTo(midX+4, valueY-6+offset);
		ctx.lineTo(midX+4, valueY-2+offset);
		ctx.stroke();
		ctx.closePath();
	}

	this.drawExitAll = function(ctx, midX, valueY) {
		var self = this;
		ctx.globalAlpha = 1;
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("exitAllColor");
		ctx.beginPath();
		var offset = 0;
		ctx.moveTo(midX-3, valueY-3+offset);
		ctx.lineTo(midX+3, valueY+3+offset);
		ctx.moveTo(midX-3, valueY+3+offset);
		ctx.lineTo(midX+3, valueY-3+offset);
		ctx.stroke();
		ctx.closePath();
	}



	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if(o.hidden == true) return false;

		this.clearHits(o);

		var self = this;
		var hitResult = false;
		var index = renderer.getPointIndex(x, model);

		if (index>seriesManager[o.dataLink].data.length-1) return false;

		var strategyValue = seriesManager[o.dataLink].data[index][o.dataField];
		if(strategyValue==FUSION.DO_NOTHING) return false;

		var pointX = renderer.getIndexPoint(index, model)+parseInt(model._midOffset);
		var pointsY = this.getPointY4StrategyValue(o, index, strategyValue, panel, renderer, model, seriesManager);

		if(this.downRenderedValues.indexOf(strategyValue) >= 0 ){
			hitResult = isPointInCircle({x:pointX, y:pointsY.dn,r:4+self.hitTolerance },x,y);
		}

		if(!hitResult && this.upperRenderedValues.indexOf(strategyValue) >= 0 ){
			hitResult = isPointInCircle({x:pointX, y:pointsY.up,r:4+self.hitTolerance },x,y);
		}

		o._hit = hitResult ? {x:x, y:y} : false;
		return hitResult;
	}
}

var CandlestickPatternStrategyObject = function() {
	var candleStickPatternStrategyObject = new StrategyObject();
	candleStickPatternStrategyObject.candleChartImage = new Image();
	candleStickPatternStrategyObject.candleChartImage.src = imageCandleChartWhite.src;
	candleStickPatternStrategyObject.candleChartImage.onload = function() {
		candleStickPatternStrategyObject.candleChartImage.width = 18;
		candleStickPatternStrategyObject.candleChartImage.height = 18;
	}
	candleStickPatternStrategyObject.getToolTip = function(o, index, model, seriesManager, scriptManager) {
		const values = [];
		for(var tooltip in seriesManager[o.dataLink].data[index].tooltips){
			values.push({
				label: WEBRCP.locale.fusion.getMessage(tooltip, tooltip).toUpperCase(),
				value: valToString(seriesManager[o.dataLink].data[index].tooltips[tooltip])
			})
		}

		var data = {
			title: getScriptTitle(o, model, seriesManager, scriptManager),
			stamp: seriesManager[o.dataLink].data[index].stamp,
			values: values
		}

		return data;

		function valToString(v){
			switch(v){
				case 1: return "BUY";
				case -1: return "SELL";
				case 2: return "EXIT LONG";
				case -2: return "EXIT SHORT";
				case -3: return "EXIT ALL";
				default: return v;
			}
		}
	}

	candleStickPatternStrategyObject.drawSell = function(ctx, midX, valueY){
		var self = this;
		var offset = 0;
		ctx.globalAlpha = 1;
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("sellColor");

		// #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
		midX -= 0.5;
		valueY -= 0.5;

		ctx.beginPath();
		ctx.moveTo(midX-5, valueY-4+offset);
		ctx.lineTo(midX+5, valueY-4+offset);
		ctx.lineTo(midX, valueY+4+offset);
		ctx.lineTo(midX-5, valueY-4+offset);
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
		ctx.beginPath();
		ctx.arc(midX,valueY-24,12,0,2*Math.PI);
		ctx.fill();
		ctx.globalAlpha = 0.87;
		ctx.drawImage(this.candleChartImage, midX-9, valueY-33, this.candleChartImage.width, this.candleChartImage.height);
		ctx.globalAlpha = 1;
	}

	candleStickPatternStrategyObject.drawBuy = function(ctx, midX, valueY){
		var self = this;
		var offset = 0;
		ctx.globalAlpha = 1;
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("buyColor");
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("buyColor");

		// #ZACIEMKA PRZESUNIĘCIE O 0.5 PIKSLA BO SIĘ ZAMAZUJE
		midX -= 0.5;
		valueY -= 0.5;

		ctx.beginPath();
		ctx.moveTo(midX-5, valueY+4+offset);
		ctx.lineTo(midX+5, valueY+4+offset);
		ctx.lineTo(midX, valueY-4+offset);
		ctx.lineTo(midX-5, valueY+4+offset);
		ctx.fill();
		ctx.closePath();
		
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("indicatorMarker");
		ctx.beginPath();
		ctx.arc(midX,valueY+24,12,0,2*Math.PI);
		ctx.fill();
		ctx.globalAlpha = 0.87;
		ctx.drawImage(this.candleChartImage, midX-9, valueY+15, this.candleChartImage.width, this.candleChartImage.height);
		ctx.globalAlpha = 1;
	}

	candleStickPatternStrategyObject.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if(o.hidden == true) return false;
		this.clearHits(o);

		var self = this;
		var hitResult = false;
		var index = renderer.getPointIndex(x, model);

		if (index>seriesManager[o.dataLink].data.length-1) return false;

		var strategyValue = seriesManager[o.dataLink].data[index][o.dataField];
		if(strategyValue==FUSION.DO_NOTHING) return false;

		var pointX = renderer.getIndexPoint(index, model)+parseInt(model._midOffset);
		var pointsY = this.getPointY4StrategyValue(o, index, strategyValue, panel, renderer, model, seriesManager);

		if(this.downRenderedValues.indexOf(strategyValue) >= 0 ){
			hitResult = isPointInCircle({x:pointX, y:pointsY.dn,r:4+self.hitTolerance },x,y) ||
						isPointInCircle({x:pointX, y:pointsY.dn+24,r:12+self.hitTolerance },x,y);
		}

		if(!hitResult && this.upperRenderedValues.indexOf(strategyValue) >= 0 ){
			hitResult = isPointInCircle({x:pointX, y:pointsY.up,r:4+self.hitTolerance },x,y) ||
						isPointInCircle({x:pointX, y:pointsY.up-24,r:12+self.hitTolerance },x,y);
		}

		o._hit = hitResult ? {x:x, y:y} : false;
		return hitResult;
	}

	return candleStickPatternStrategyObject;
};

var FractalsObject = function() {
	var self = this;
	var fractalsObject = new StrategyObject();

	fractalsObject.getToolTip = function(o, index, model, seriesManager, scriptManager) {
		values = [];
		const fields = seriesManager[o.dataLink].fields;
		const labels = seriesManager[o.dataLink].labels;

		for(var f in fields){
			var v = valToString(seriesManager[o.dataLink].data[index][fields[f]]);
			values.push({
				label: WEBRCP.locale.fusion.getMessage(labels[f], labels[f]),
				value: v
			})
		}

		var data = {
				title: getScriptTitle(o, model, seriesManager, scriptManager),
				stamp: seriesManager[o.dataLink].data[index].stamp,
				values: values
			}

		return data;

		function valToString(v){
			switch(v){
				case 1: return "DOWN";
				case -1: return "UP";
				case -3: return "UP AND DOWN";
				default: return v;
			}
		}
	}

	fractalsObject.drawSell = function(ctx, midX, valueY){
		var offset = -4;
		ctx.globalAlpha = 1;
		ctx.fillStyle = "#009688";
		ctx.strokeStyle = "#009688";

		midX -= 0.5;
		valueY -= 0.5;

		ctx.beginPath();
		ctx.moveTo(midX-10, valueY+offset);
		ctx.lineTo(midX, valueY-4+offset);
		ctx.lineTo(midX+10, valueY+offset);
		ctx.lineTo(midX, valueY-16+offset);
		ctx.lineTo(midX-10, valueY+offset);
		ctx.fill();
		ctx.closePath();
	}

	fractalsObject.drawBuy = function(ctx, midX, valueY){
		var offset = 4;
		ctx.globalAlpha = 1;
		ctx.fillStyle = "#e91e63";
		ctx.strokeStyle = "#e91e63";
		
		midX -= 0.5;
		valueY -= 0.5;

		ctx.beginPath();
		ctx.moveTo(midX-10, valueY+offset);
		ctx.lineTo(midX, valueY+4+offset);
		ctx.lineTo(midX+10, valueY+offset);
		ctx.lineTo(midX, valueY+16+offset);
		ctx.lineTo(midX-10, valueY+offset);
		ctx.fill();
		ctx.closePath();
	}

	fractalsObject.drawExitAll = function (ctx, midX, valueY, position) {
		if (position == "up") {
			fractalsObject.drawSell(ctx, midX, valueY + 26);
		} else {
			fractalsObject.drawBuy(ctx, midX, valueY - 26);
		}
	}

	fractalsObject.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		if(o.hidden == true) return false;

		this.clearHits(o);

		var self = this;
		var hitResult = false;
		var index = renderer.getPointIndex(x, model);

		if (index>seriesManager[o.dataLink].data.length-1) return false;

		var strategyValue = seriesManager[o.dataLink].data[index][o.dataField];
		if(strategyValue==FUSION.DO_NOTHING) return false;

		var pointX = renderer.getIndexPoint(index, model)+parseInt(model._midOffset);
		var pointsY = this.getPointY4StrategyValue(o, index, strategyValue, panel, renderer, model, seriesManager);
		pointsY.up -= 12;
		pointsY.dn += 12;
		
		if (strategyValue==FUSION.EXIT_ALL) {
			pointsY.up += 26;
			pointsY.dn -= 26;
		}

		if(this.downRenderedValues.indexOf(strategyValue) >= 0 ){
			hitResult = isPointInCircle({x:pointX, y:pointsY.dn,r:8+self.hitTolerance },x,y);
		}

		if(!hitResult && this.upperRenderedValues.indexOf(strategyValue) >= 0 ){
			hitResult = isPointInCircle({x:pointX, y:pointsY.up,r:8+self.hitTolerance },x,y);
		}

		o._hit = hitResult ? {x:x, y:y} : false;
		return hitResult;
	}

	fractalsObject.drawSelectionLine	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {
		var indexX = 0;
		var valuesY = {};
		var midX = 0;

		var field = o.dataField;
		if (forceField) field = forceField;

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("accent");

		for (var i=model._leftIndex; i<model._rightIndex; i++) {

			if (i>seriesManager[o.dataLink].data.length-1) continue;

			var strategyValue = seriesManager[o.dataLink].data[i][field];
			if(strategyValue==FUSION.DO_NOTHING) continue;

			indexX 	= renderer.getIndexPoint(i, model);
			//valueY 	= renderer.getYCoordinateForPrice(seriesManager[o.dataLink].data[i][field], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax})+panel._offset;
			valuesY 	= this.getPointY4StrategyValue(o, i, strategyValue, panel, renderer, model, seriesManager);
			valuesY.up -= 12;
			valuesY.dn += 10;

			if (strategyValue==FUSION.EXIT_ALL) {
				valuesY.up += 26;
				valuesY.dn -= 26;
			}

			if (model.periodWidth==1) {
				midX = indexX;

			} else {
				midX = indexX+parseInt(model._midOffset);
			}

			ctx.beginPath();

			if(strategyValue==FUSION.BUY)
				ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
			else if(strategyValue==FUSION.SELL)
				ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
			else if(strategyValue==FUSION.EXIT_ALL) {
				ctx.arc(midX, valuesY.dn, 3, 0, 2 * Math.PI, false);
				ctx.arc(midX, valuesY.up, 3, 0, 2 * Math.PI, false);
			}

			ctx.fill();
			lastX = midX;
		}
	}

	fractalsObject.drawHit	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {
		try {
			var index = renderer.getPointIndex(o._hit.x, model);
			var x = renderer.getIndexPoint(index, model) + model.periodWidth/ 2;
			var r = 5;
			var field = forceField || o.dataField;

			var strategyValue = seriesManager[o.dataLink].data[index][field];
			var valuesY 	= this.getPointY4StrategyValue(o, index, strategyValue, panel, renderer, model, seriesManager);
			valuesY.up -= 12;
			valuesY.dn += 10;

			if (strategyValue==FUSION.EXIT_ALL) {
				valuesY.up += 26;
				valuesY.dn -= 26;
			}

			if(this.downRenderedValues.indexOf(strategyValue) >= 0 )
				renderPoint(ctx, x, valuesY.dn, r);

			if(this.upperRenderedValues.indexOf(strategyValue) >= 0 )
				renderPoint(ctx, x, valuesY.up, r);

		} catch (e) {
			console.log("Cant render series hit point", e);
		}

		function renderPoint(ctx, x, y ,r , color){
			ctx.beginPath();
			ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("hitColor");
			ctx.globalAlpha = 0.7;
			ctx.arc(x, y, r, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();
		}
	}

	return fractalsObject;
};

var TradeObject = class TradeObject {
	constructor(settings){
		var self = this;
		this.settings = settings;
		this.hitTolerance = 2;
	}
	
	getMenuItems(o, chart) {
		return null;
	};

	render(o, ctx, renderer, model, panel, seriesManager) {
		this.drawTradeObject(o, ctx, renderer, model, panel, seriesManager);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var line_y = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

		if (this.isDragHandlerAllowedForObject(o, model)) this.drawDragHandler(line_y, ctx);
		
		const runnerMarker = this.prepareRunnerMarker(o); 
		if (runnerMarker) this.drawRunnerMarker(line_y, ctx, runnerMarker);
	};

	drawTradeObject(o, ctx, renderer, model, panel, seriesManager){
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var line_y = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var line_x = this.settings.bar.x+this.settings.bar.w;
		var line_w =  model._timeAxisWidth;

		if (o.modified) {
			ctx.globalAlpha = 0.5;
		} else if (WEBRCP.utils.isOrderWaiting(o.object)) {
			ctx.globalAlpha = 0.5;
		} else {
			ctx.globalAlpha = 1;
		}

		this.drawLine(line_x, line_y, line_w, this.settings.line.color,ctx);
		this.drawBar(o.title, line_y, this.settings.bar.color, ctx);
	}
	
	isDragHandlerAllowedForObject(o, model){
		if (o.object.instrument.type !== "OTC") return false;
		if(o.relatedAllowed && !o.modified && !o.object.runner){
			var tp = this.getTpForPosition(o, model);
			var sl = this.getSlForPosition(o, model);
			if(!tp || !sl)
				return true;
		}
		return false;
	}
	
	prepareRunnerMarker(o){
		if(o.object && o.object.runner){
			var marker = {
				bg: this.settings.runnerMarker.activeBg,
				color: this.settings.runnerMarker.color,
				text: o.object.runner.name.substring(0,1).toUpperCase()
			} 
			return marker;
		} else 	if(o.object && o.object.portfolio){
			var marker = {
				bg: this.settings.runnerMarker.activeBg,
				color: this.settings.runnerMarker.color,
				text: o.object.portfolio.name.substring(0,1).toUpperCase()
			} 
			return marker;
		}
		
		return null;	
	}
	
	
	

	postRender (o, ctx, renderer, model, panel, seriesManager) {
		this.drawPriceTag(o, ctx, renderer, model, panel, seriesManager);
	};

	drawPriceTag(o, ctx, renderer, model, panel, seriesManager){
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var valueY = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		renderer.drawPriceTag (ctx, model, panel, valueY, this.settings.bar.color, this.settings.bar.text_color, o.price, 'real');
	};

	renderOverlay (o, octx, renderer, model, panel, seriesManager) {
		if(o.related){
			var fV = LIB.getReferenceValue(o.related, model, seriesManager);
			var line_y = renderer.getYCoordinateForPrice(o.related.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			var line_x = this.settings.bar.x+this.settings.bar.w;
			var line_w =  model._timeAxisWidth;
			octx.globalAlpha = this.settings.relatedBar.alpha;
			this.drawLine(line_x, line_y, line_w, this.settings.relatedBar.color, octx);
			this.drawBar(o.related.title, line_y, this.settings.relatedBar.color, octx);
			var tp = this.getTpForPosition(o, model);
			var sl = this.getSlForPosition(o, model);
			if(o.modifyAllowed && !o.modified && (!tp || !sl))
				this.drawDragHandler(line_y, octx);
		}

		if(o._hit){
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var line_y = null
			var tp_y = null;
			var sl_y = null;

			//"o" is related?
			if(o.parentId){
				var parent = this.getTradeObjectById(o.parentId, model);
				if(parent){
					line_y = renderer.getYCoordinateForPrice(parent.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
					var tp = this.getTpForPosition(parent, model);
					if(tp) tp_y = renderer.getYCoordinateForPrice(tp.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

					var sl = this.getSlForPosition(parent, model);
					if(sl) sl_y = renderer.getYCoordinateForPrice(sl.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
				}
			}
			//or not ....
			else{
				line_y = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

				var tp = this.getTpForPosition(o, model);
				if(tp) tp_y = renderer.getYCoordinateForPrice(tp.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

				var sl = this.getSlForPosition(o, model);
				if(sl) sl_y = renderer.getYCoordinateForPrice(sl.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			}

			if (tp_y || sl_y)
				this.drawRelations(line_y, tp_y, sl_y, octx, renderer, model, panel, seriesManager);

			if (o.priceConnections && o.priceConnections.length > 0) {
				line_y = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;

				for (const i in o.priceConnections) {
					const connectedPriceY = renderer.getYCoordinateForPrice(o.priceConnections[i], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}) + panel._offset;
					this.drawRelations(line_y, connectedPriceY, null, octx, renderer, model, panel, seriesManager);
				}
			}
				
		}
	};

	postRenderOverlay (o, octx, renderer, model, panel, seriesManager) {
		if(o.related){
			var fV = LIB.getReferenceValue(o.related, model, seriesManager);
			var line_y = renderer.getYCoordinateForPrice(o.related.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			var line_x = this.settings.bar.x+this.settings.bar.w;
			var line_w =  model._timeAxisWidth;
			octx.globalAlpha = 1;
			renderer.drawPriceTag (octx, model, panel, line_y, this.settings.relatedBar.color, this.settings.bar.text_color, o.related.price, 'real');
		}
	};

	updateExtremes(o, extremes, model, seriesManager, panel, renderer) {};

	hit	(x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var hitResult = false;

		if(o.hidden == true) return false;
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			if(o.stop){
				var valueY = renderer.getYCoordinateForPrice(o.stopPrice, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
				o.hitStop = true;
			}else{
				var valueY = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
			}
			o._hit = null;
			o._hitCloseButton = null;
			o._hitDragHandler = null;

			//hit?
			if(between(valueY-1, y, valueY+1, self.hitTolerance) && between(0, x, model._timeAxisWidth, self.hitTolerance)){
				o._hit = true;
				hitResult = true;
				console.log("Trade object hit", o);
				if(between(this.settings.bar.closeBtn.x, x, this.settings.bar.closeBtn.x+this.settings.bar.closeBtn.w, 0)){
					o._hitCloseButton = true;
					console.log("Trade object hit close button", o);
				}
				if(o.relatedAllowed && between(this.settings.bar.dragTpSlHandler.x, x, this.settings.bar.dragTpSlHandler.x+this.settings.bar.dragTpSlHandler.w, 0)){

					if(this.isDragHandlerAllowedForObject(o, model)){
					//var tp = getTpForPosition(o, model);
					//var sl = getSlForPosition(o, model);
					//if(!o.modified && (!tp || !sl)){
						o._hitDragHandler = true;
						console.log("Trade object hit drag handler", o);	
					}
				}
			}
		return hitResult;
	};


	mouseDown (e, o, renderer, interactor, model, panel, seriesManager) {
		if (o._hitDragHandler) o.related = null;

		var offset = interactor.chart.topLayer[0].getBoundingClientRect();
		
		self.relativeOffset = {
			x: offset.left,
			y: offset.top
		}
	}

	mouseUp	(e, o, renderer, interactor, model, panel, seriesManager) {

		if(o._hitCloseButton){
			o.modified = true;
			interactor.doCloseTradeObject(o);

		}else if(o.modified){
			if (o.parentId) var p = getTradeObjectById(o.parentId, model);
			interactor.doModifyTradeObject(o, p);

		}else if(o.relatedAllowed && o.related){
			interactor.doAddTradeObject(o);
			var orderCandidate = { //temporary add to chart model
					id: "empty",
					price: o.related.price,
					instrument: o.object.instrument,
					parentId: o.id,
					selected:true,
					title:o.related.title,
					type: o.related.type
			}
			model.orders.list.push(orderCandidate);
			o.related = null;
		}
	}

	

	mouseDrag (e, o, renderer, interactor, model, panel, seriesManager) {
		var dragPrice = this.getDragPrice(e, o, renderer, interactor, model, panel, seriesManager);
		const stopTypes = ["BUY STOP", "SELL STOP", "BUY TRAILING_STOP", "SELL TRAILING_STOP", "BUY TAKE_PROFIT", "SELL TAKE_PROFIT", "BUY TAKE_PROFIT_MARKET", "SELL TAKE_PROFIT_MARKET"];
		const limitTypes = ["BUY LIMIT", "SELL LIMIT", "BUY TAKE_PROFIT_LIMIT", "SELL TAKE_PROFIT_LIMIT"];
		//drag object
		if(o.modifyAllowed && !o._hitCloseButton && !o._hitDragHandler){
			o.modified = true;
			if(stopTypes.includes(o.type))  o.stopPrice = o.price = dragPrice;
			else if(limitTypes.includes(o.type)) o.limitPrice = o.price = dragPrice;
			else o.modified = false;
		}
	}

	mouseOut (e, o, renderer, interactor, model, panel, seriesManager) {
		o.related = null;
		o.modified = false;
	}

	getDragPrice(e, o, renderer, interactor, model, panel, seriesManager) {
		const instrument = model.instrumentsSeries[0].instrument;
		const offset = getOffset(e).offsetY;
		
		const fV = this.getReferenceValue(e, o, renderer, interactor, model, panel, seriesManager);
		const dragPrice = parseFloat(renderer.getPriceForYCoordinate(offset-panel._offset, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV}).toFixed(instrument.precision));
		
		return WEBRCP.utils.roundPrice(dragPrice, instrument.priceChangeStep, instrument.precision);

		function getOffset(e) {
			var x = e.pageX - self.relativeOffset.x;
			var y = e.pageY - self.relativeOffset.y;
			return {
				offsetX: x,
				offsetY: y
			}
		}
	}

	getReferenceValue(e, o, renderer, interactor, model, panel, seriesManager) {
		return LIB.getReferenceValue(o, model, seriesManager);
	}


	drawLine(x, y, w, color, ctx){
		ctx.setLineDash(this.settings.line.dash || []);
		ctx.lineWidth = this.settings.line.w;
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.lineTo(x+w, y);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.closePath();
	}

	drawBar(title, y, color, ctx){
		var x = this.settings.bar.x;
		var close_x = this.settings.bar.closeBtn.x;
		//bar
		ctx.beginPath();
		ctx.setLineDash([]);
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.moveTo(x,y-this.settings.bar.h/2);
		ctx.rectRound(-10,y-this.settings.bar.h/2, this.settings.bar.w+10, this.settings.bar.h,4,4,0,0);
		ctx.fill();

		ctx.beginPath();
		ctx.strokeStyle = this.settings.bar.text_color;
		ctx.moveTo(close_x, y-this.settings.bar.closeBtn.w/2);
		ctx.lineTo(close_x+this.settings.bar.closeBtn.w, y+this.settings.bar.closeBtn.w/2);
		ctx.moveTo(close_x, y+this.settings.bar.closeBtn.w/2);
		ctx.lineTo(close_x+this.settings.bar.closeBtn.w, y-this.settings.bar.closeBtn.w/2);
		ctx.closePath();
		ctx.stroke();

		//text
		var label_x = this.settings.bar.closeBtn.x + this.settings.bar.closeBtn.w + this.settings.bar.spacing;
		ctx.fillStyle = this.settings.bar.text_color;
		ctx.fillText(title, label_x, y+3);
	}

	drawRect(y1, y2, ctx, color){
		ctx.fillStyle = color;
		ctx.globalAlpha = 0.05;
		ctx.fillRect(0, y1, ctx.canvas.width, y2-y1);
		ctx.globalAlpha = 1;
		
	}

	drawDragHandler(y, ctx){
		ctx.fillStyle = this.settings.bar.text_color;
		ctx.strokeStyle = this.settings.bar.text_color;
		ctx.beginPath();
		ctx.moveTo(this.settings.bar.dragTpSlHandler.x,y);
		ctx.lineTo(this.settings.bar.dragTpSlHandler.x+this.settings.bar.dragTpSlHandler.w,y);
		ctx.moveTo(this.settings.bar.dragTpSlHandler.x+this.settings.bar.dragTpSlHandler.w/2,y-this.settings.bar.dragTpSlHandler.w/2);
		ctx.lineTo(this.settings.bar.dragTpSlHandler.x+this.settings.bar.dragTpSlHandler.w/2,y+this.settings.bar.dragTpSlHandler.w/2);
		ctx.stroke();
		ctx.closePath();
	}
	
	drawRunnerMarker(y, ctx, marker){
		ctx.fillStyle = marker.bg;
		ctx.strokeStyle = this.settings.bar.color;
		ctx.beginPath();
		ctx.rectRound(this.settings.runnerMarker.x,y-this.settings.bar.h/2, this.settings.runnerMarker.w, this.settings.bar.h,4,4,0,0);
		ctx.fill();
		ctx.fillStyle =marker.color;
		ctx.fillText(marker.text.substring(0,1).toUpperCase(), this.settings.runnerMarker.x+2 , y+3);
		ctx.closePath();
	}

	drawRelations(y, y1, y2, ctx, renderer, model, panel, seriesManager){
		var r = 9;

		if(y1){
			var yS = y > y1 ? y : y1;
			var yE = y < y1 ? y : y1;

			ctx.lineWidth = this.settings.connections.w;
			ctx.strokeStyle = this.settings.connections.color;
			ctx.beginPath();
			ctx.moveTo(this.settings.bar.x+this.settings.bar.w,yS);
			ctx.lineTo(this.settings.bar.x+this.settings.bar.w+r, yS);
			ctx.arc(
				this.settings.bar.x+this.settings.bar.w+r,
				yS-r,
				r,0.5*Math.PI, 0 * Math.PI, true);
			ctx.lineTo(this.settings.bar.x+this.settings.bar.w+r*2, yE+r);
			ctx.arc(
				this.settings.bar.x+this.settings.bar.w+r,
				yE+r,
				r,0*Math.PI, 1.5 * Math.PI, true);
			ctx.lineTo(this.settings.bar.x+this.settings.bar.w, yE);
			ctx.stroke();
			ctx.closePath();

		}

		if(y2){
			var yS = y > y2 ? y : y2;
			var yE = y < y2 ? y : y2;

			ctx.lineWidth = this.settings.connections.w;
			ctx.strokeStyle = this.settings.connections.color;
			ctx.beginPath();
			ctx.moveTo(this.settings.bar.x+this.settings.bar.w,yS);
			ctx.lineTo(this.settings.bar.x+this.settings.bar.w+r, yS);
			ctx.arc(
				this.settings.bar.x+this.settings.bar.w+r,
				yS-r,
				r,0.5*Math.PI, 0 * Math.PI, true);
			ctx.lineTo(this.settings.bar.x+this.settings.bar.w+r*2, yE+r);
			ctx.arc(
				this.settings.bar.x+this.settings.bar.w+r,
				yE+r,
				r,0*Math.PI, 1.5 * Math.PI, true);
			ctx.lineTo(this.settings.bar.x+this.settings.bar.w, yE);
			ctx.stroke();
			ctx.closePath();
		}
	}

	getTpForPosition(p, model){
		for(var i in model.orders.list){
			if(model.orders.list[i].parentId == p.id && model.orders.list[i].type == 'TP')
				return model.orders.list[i];
		}
		return null;
	}

	getSlForPosition(p, model){
		for(var i in model.orders.list){
			if(model.orders.list[i].parentId == p.id && model.orders.list[i].type == 'SL')
				return model.orders.list[i];
		}
		return null;
	}

	getTradeObjectById(id, model){
		for(var i in model.orders.list){
			if(model.orders.list[i].id == id)
				return model.orders.list[i];
		}
		for(var i in model.positions.list){
			if(model.positions.list[i].id == id)
				return model.positions.list[i];
		}
		return null;
	}
}

var StopLimitObject = class StopLimitObject extends TradeObject{

	constructor(settings){
		super(settings);
		this.settings = settings;
		this.hitTolerance = 2;
	}

	getOperationTitle(operation) {
		return WEBRCP.locale.fusion.getMessage(operation, operation);
	};

	render (o, ctx, renderer, model, panel, seriesManager) {
		this.drawFieldBetweenTrades(o, ctx, model, panel, seriesManager, renderer);
		let orderTypeText = ' Limit';
		if (o.type.includes("TAKE_PROFIT")) orderTypeText = ' TP' + orderTypeText;
		o.title = this.getOperationTitle(o.operation) + orderTypeText + ' ' + (o.object.classification !== 'DEFAULT' ? o.object.classification : '');
		this.drawTradeObject(o, ctx, renderer, model, panel, seriesManager)
		this.drawTradeObject(this.makeStopObject(o), ctx, renderer, model, panel, seriesManager);
	}

	drawFieldBetweenTrades(o, ctx, model, panel, seriesManager, renderer){
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var lineY = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var fV = LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
		var lineStopY = renderer.getYCoordinateForPrice(o.stopPrice, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV})+panel._offset;
		var color = this.settings.line.color;
		if (o.type.includes('BUY')) this.drawRect(lineY, lineStopY, ctx, color);
		else this.drawRect(lineStopY, lineY, ctx, color);
	}

	makeStopObject(o){
		var stopObject = $.extend(true,{},o);
		let orderTypeText = ' Stop';
		if (o.type.includes("TAKE_PROFIT")) orderTypeText = ' TP' + orderTypeText;
		stopObject.title = this.getOperationTitle(o.operation) + orderTypeText + ' ' + (o.object.classification !== 'DEFAULT' ? o.object.classification : '');;
		stopObject.price = o.stopPrice;
		stopObject.object.price = o.object.stopPrice
		return(stopObject);
	}

	hit (x, y, o, renderer, interactor, model, panel, seriesManager) {
		o.stop = false;
		if(super.hit(x, y, o, renderer, interactor, model, panel, seriesManager)){
			o.hitStop = false;
			return o._hit;
		} else {
			o.stop = true;
			super.hit(x, y, o, renderer, interactor, model, panel, seriesManager)
			o.stop = false;
			return o._hit;
		}
	}

	postRender (o, ctx, renderer, model, panel, seriesManager){
		this.drawPriceTag(o, ctx, renderer, model, panel, seriesManager);
		this.drawPriceTag(this.makeStopObject(o), ctx, renderer, model, panel, seriesManager);
	}

	renderOverlay (o, octx, renderer, model, panel, seriesManager) {
		if (o._hit) {
			var fVLimit = LIB.getReferenceValue(o, model, seriesManager);
			var lineLimit = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVLimit})+panel._offset;
			var fVStop = LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
			var lineStop = renderer.getYCoordinateForPrice(o.stopPrice, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVStop})+panel._offset;
			super.drawRelations(lineLimit, lineStop, null, octx, renderer, model, panel, seriesManager);

			if (o.priceConnections && o.priceConnections.length > 0) {
				for (const i in o.priceConnections) {
					const connectedPriceLimitY = renderer.getYCoordinateForPrice(o.priceConnections[i], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVLimit}) + panel._offset;
					const connectedPriceStopY = renderer.getYCoordinateForPrice(o.priceConnections[i], {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV: fVStop}) + panel._offset;
					this.drawRelations(lineLimit, connectedPriceLimitY, null, octx, renderer, model, panel, seriesManager);
					this.drawRelations(lineStop, connectedPriceStopY, null, octx, renderer, model, panel, seriesManager);
				}
			}
		}		
	};

	mouseUp	(e, o, renderer, interactor, model, panel, seriesManager) {
		super.mouseUp(e, o, renderer, interactor, model, panel, seriesManager);
		o.drag = false;
	}

	mouseDrag (e, o, renderer, interactor, model, panel, seriesManager) {
		var dragPrice = this.getDragPrice(e, o, renderer, interactor, model, panel, seriesManager);

		const candles = seriesManager[model.instrumentsSeries[0].seriesId].data;
		const lastClose = candles[candles.length - 1].c;
		const isBuy = o.type === "BUY TAKE_PROFIT_LIMIT" || o.type === "BUY STOP_LIMIT";
		const isSell = o.type === "SELL TAKE_PROFIT_LIMIT" || o.type === "SELL STOP_LIMIT";
		//drag object
		if (o.modifyAllowed && !o._hitCloseButton && !o._hitDragHandler) {
			o.modified = true;
			if (isBuy && o.hitStop) {
					o.stopPrice = dragPrice;
			} else if (isSell && o.hitStop) {
					o.stopPrice = dragPrice;
			} else if (isBuy && !o.hitStop) {
				o.limitPrice = o.price = dragPrice;
			} else if (isSell && !o.hitStop) {
				o.limitPrice = o.price = dragPrice;
			} else {
				o.modified = false;
			}
		}
		o.drag = true;
	}

	getReferenceValue(e, o, renderer, interactor, model, panel, seriesManager) {
		if (o.limitPrice && o.stopPrice && o.hitStop) 
			return LIB.getReferenceValue(this.makeStopObject(o), model, seriesManager);
		else 
			return LIB.getReferenceValue(o, model, seriesManager);
	}

	mouseOut (e, o, renderer, interactor, model, panel, seriesManager) {
		super.mouseOut(e, o, renderer, interactor, model, panel, seriesManager);
		o.drag = false;
		o.stopPrice = o.object.stopPrice;
		o.limitPrice = o.object.limitPrice;
	}
}


var MovePaneArrows	=	function () {
	this.opts = {
			color: WEBRCP.utils.colorManager.getColor("iconColor"),
			alpha: 0.54,
			width: 8,
			height: 6,
			offsetY: 12,
			offsetX: 8, //-w*2-spacing
			spacing:8
	}

	this.getMenuItems	=	function (o, chart) {
		return null;
	};

	this.hitTolerance = 2;

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {
		var color = WEBRCP.utils.colorManager.getColor("iconColor");
		//ctx.fillStyle = this.opts.color;
		//ctx.strokeStyle = this.opts.color;
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.globalAlpha   = this.opts.alpha;



		var arrowDn = createArrowDn(panel, model, this.opts);
		var arrowUp = createArrowUp(panel, model, this.opts);

		drawArrow(ctx,arrowUp);
		drawArrow(ctx,arrowDn);
		ctx.globalAlpha   = 1;
	}

	function createArrowDn(panel, model,opts){
		var arrowDn = {
				x: [
				             	panel._width-model.valueAxisWidth-opts.offsetX-opts.width,
				             	panel._width-model.valueAxisWidth-opts.offsetX,
				             	panel._width-model.valueAxisWidth-opts.offsetX-Math.floor(opts.width/2),
				             	panel._width-model.valueAxisWidth-opts.offsetX-Math.floor(opts.width/2)-1,
				   ],
				y: [
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY+opts.height,
				             	panel._offset+opts.offsetY+opts.height,
				   ]
				}
		return arrowDn;
	}

	function createArrowUp(panel, model, opts){
		var arrowUp = {
				x: [
				             	panel._width-model.valueAxisWidth-opts.offsetX-opts.width*2-opts.spacing,
				             	panel._width-model.valueAxisWidth-opts.offsetX-Math.floor(opts.width*1.5)-1-opts.spacing,
				             	panel._width-model.valueAxisWidth-opts.offsetX-Math.floor(opts.width*1.5)-opts.spacing,
				             	panel._width-model.valueAxisWidth-opts.offsetX-opts.width-opts.spacing,
				   ],
				y: [
				             	panel._offset+opts.offsetY+opts.height,
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY,
				             	panel._offset+opts.offsetY+opts.height,
				   ]
				}
		return arrowUp;
	}

	function drawArrow(ctx,a){
		ctx.beginPath();
		ctx.moveTo(a.x[0], a.y[0]);
		ctx.lineTo(a.x[1], a.y[1]);
		ctx.lineTo(a.x[2], a.y[2]);
		ctx.lineTo(a.x[3], a.y[3]);
		ctx.lineTo(a.x[0], a.y[0]);
		ctx.fill();
		//ctx.stroke();
	}

	this.init = function(){}

	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {}
	this.updateExtremes	=	function (o, extremes, model, seriesManager, panel, renderer) {}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var hitResult = false;

		var x1 = panel._width-model.valueAxisWidth-this.opts.offsetX-this.opts.width*2-this.opts.spacing;
		var x2 = panel._width-model.valueAxisWidth-this.opts.offsetX-this.opts.width;

		var y1 = panel._offset+this.opts.offsetY;
		var y2 = panel._offset+this.opts.offsetY+this.opts.height;


		if(between(y1, y, y2, self.hitTolerance)){
			//upper arrow
			if(between(x1, x, x1+this.opts.width, self.hitTolerance)){
				hitResult = {type: 'MovePaneArrows', arrow: 'up'};
				interactor.octx.globalAlpha   = 1;
				interactor.octx.fillStyle   = this.opts.color;
				interactor.octx.strokeStyle = this.opts.color;
				var arrowUp = createArrowUp(panel, model, this.opts);
				drawArrow(interactor.octx,arrowUp);
			}
			//down arrow
			else if(between(x2, x, x2+this.opts.width, self.hitTolerance)){
				hitResult = {type: 'MovePaneArrows', arrow: 'dn'};
				interactor.octx.globalAlpha   = 1;
				interactor.octx.fillStyle   = this.opts.color;
				interactor.octx.strokeStyle = this.opts.color;
				var arrowDn = createArrowDn(panel, model, this.opts);
				drawArrow(interactor.octx,arrowDn);
			}
		}
		return hitResult;
	}

	function getHoveredArrow(o){
		return null;
	}

	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {}

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.movePanelUpDn(panel, o);
	}

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {}

}


export { Series, SeriesObject, StrategyObject, IndicatorObject, CandlestickPatternStrategyObject, FractalsObject, TradeObject, StopLimitObject,  MovePaneArrows}

//# sourceURL=./platform/components/newchart/js/objects.js
