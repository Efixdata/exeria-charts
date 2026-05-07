import WEBRCP from "../../WebRCP";
import FUSION from "../../fusion";
import LIB from "../../utils/chartingCommons";
import { between, isPointInCircle, pointsDistance, getLinePointNearestMouse, roundAndTranslate } from '../../utils/objects-lib';
import imageCandleChartWhite from "../../img/icons/candle_chart_white.svg";
import { Series } from "../../objectRuntimeBases";
import { getScriptTitle } from "./_sharedTypes";
import type { SeriesRuntime, PatternStrategyRuntime } from "./_sharedTypes";

var SeriesObject	=	function (this: SeriesRuntime) {
	this.getMenuItems	=	function (o, chart) {
		var object = o;
		if(o.renderAs == 'Band') return null;

		var menuItems: any	=	{
				radio1: {
					name: chart.options.locale.getMessage('candles'),
					icon: function($element: any, key: any, item: any){
						if(o['renderAs'] == "OHLC"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key: any, options: any){
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
					icon: function($element: any, key: any, item: any){
						if(o['renderAs'] == "Line"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key: any, options: any){
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
					icon: function($element: any, key: any, item: any){
						if(o['renderAs'] == "Line and Histogram"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key: any, options: any){
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
					icon: function($element: any, key: any, item: any){
						if(o['renderAs'] == "Histogram"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key: any, options: any){
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
					icon: function($element: any, key: any, item: any){
						if(o['renderAs'] == "Bars"){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon';
					},
					callback: function(key: any, options: any){
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
					icon: function($element: any, key: any, item: any){
						if(o['priceTag'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key: any, options: any){
						o['priceTag'] = !o['priceTag'];
						return true;
					}
				},
				priceLine: {
					name: chart.options.locale.getMessage('show_price_line', "Show price line"),
					icon: function($element: any, key: any, item: any){
						if(o['priceLine'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key: any, options: any){
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

		const getColor = (i: number) => {
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
				var volumeY = panel._height + panel._offset - 10;
				renderPoint(ctx, x, volumeY, r);
			}

		} catch (e) {
			console.log("Cant render series hit point", e, index);
		}

		function renderPoint(ctx: CanvasRenderingContext2D, x: number, y: number ,r: number , color?: string){
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

		var indexX = 0; var valueY = 0; var midX = 0;

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

		ctx.save();
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

		ctx.restore();

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

		ctx.save();
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
		ctx.restore();
		return true;
	}

	
	this.renderAsChartShape	=	function (o, ctx, renderer, model, panel, seriesManager, forceField) {
		let indexX = 0; var valueY = 0; var midX = 0; var lastX = 0;
		let field = o.closeDataField ? o.closeDataField : o.dataField;
		const data = seriesManager[o.dataLink].data;

		if (forceField) field = forceField;

		ctx.save();

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

		function getFirstValueBeforeStart(leftIndex: number, data: any[], field: string) {
			let start = leftIndex;

			if (!data[leftIndex] || !data[leftIndex][field]) {
				for (let i = leftIndex; i >= 0; i--) {
					if (data[i] && data[i][field]) start = i;
				}
			}
			
			if (start > 0) start -= 1;
			return start;
		}

		function getFirstValueAfterEnd(rightIndex: number, data: any[], field: string) {
			let end = rightIndex;

			if (!data[rightIndex] || !data[rightIndex][field]) {
				for (let i = rightIndex; i <= data.length; i++) {
					if (data[i] && data[i][field]) end = i;
				}
			}
			
			if (end < data.length - 1) end += 1;
			return end;
		}

		ctx.restore();
	}

	this.renderPriceLine = function(options) {
		const {ctx, panel, model, y, value, green, red, open} = options;
		const roundedY = roundAndTranslate(y);

		if (open) {
			ctx.strokeStyle = (value - open > 0) ? green : red;
		}

		ctx.save();
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.setLineDash([5, 5]);
		ctx.moveTo(0, roundedY);
		ctx.lineTo(panel._width, roundedY);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.closePath();
		ctx.restore();
	}

	this.updateExtremes	=	function (o, extremes, model, seriesManager) {
		if(!seriesManager[o.dataLink] || !seriesManager[o.dataLink].data || seriesManager[o.dataLink].data.length == 0) return;

		if (this.getRenderMode(o, model)=='OHLC' || this.getRenderMode(o, model)=='Bars') return this.updateExtremesOHLC(o, extremes, model, seriesManager);
		return this.updateExtremesLine(o, extremes, model, seriesManager);
	}

	this.updateExtremesOHLC	=	function (o, extremes, model, seriesManager) {

		// var dfH = o.highDataField ? o.highDataField : o.dataField;
		// var dfL = o.lowDataField ? o.lowDataField : o.dataField;
		var dfH, dfL;
		var dfO = o.openDataField ? o.openDataField : o.dataField;
		var dfC = o.closeDataField ? o.closeDataField : o.dataField;

		if (dfO >= dfC) {
			dfH = dfO;
			dfL = dfC;
		} else {
			dfH = dfC;
			dfL = dfO;
		}

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
		const precisions = seriesManager[o.dataLink].precisions;

		for (var f in fields) {
			const value: any = {
				label: WEBRCP.locale.fusion.getMessage(labels[f], labels[f]),
				value: seriesManager[o.dataLink].data[index][fields[f]]
			};

			if (precisions && precisions[f]) {
				value.precision = precisions[f];
			}

			values.push(value);
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
		if (this.isHitEmpty.apply(this, Array.from(arguments))) return false;

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
		if (this.isHitEmpty.apply(this, Array.from(arguments))) return false;

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
		if (this.isHitEmpty.apply(this, Array.from(arguments))) return false;
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
		if (this.isHitEmpty.apply(this, Array.from(arguments))) return false;

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
		if (this.isHitEmpty.apply(this, Array.from(arguments))) return false;

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

const SeriesObjectCtor: new (...args: any[]) => any = SeriesObject as any;
export { SeriesObjectCtor as SeriesObject };
