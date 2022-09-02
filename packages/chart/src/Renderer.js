import WEBRCP from "./WebRCP";
import LIB from "./utils/chartingCommons";
import { Series, SeriesObject, StrategyObject, IndicatorObject, CandlestickPatternStrategyObject, FractalsObject, TradeObject, StopLimitObject,  MovePaneArrows } from "./Objects";
import { Shape, TrendLineObject,  FibonLinesObject, ParallelChannelObject, ArrowObject, HorizontalLineObject, VerticalLineObject, DiNapoliLevels, DiNapoliAbcObject, MultiLineObject, AbcdObject, EllipseObject, HorizontalRangeObject, VerticalRangeObject, CycleObject, TextObject, BoxObject, TriangleObject, PriceTagObject } from "./Objects2"

const Renderer = function (settings) {
	this.settings = settings;
	this.objects	=	new Array();
	this.timeTicks	=	new Array();

	var series = new Series(); //instancja bazowa
	SeriesObject.prototype = series;
	StrategyObject.prototype = series;
	IndicatorObject.prototype = series;

	this.objects['SeriesObject'] = new SeriesObject();
	this.objects['StrategyObject'] = new StrategyObject();
	this.objects['CandlestickPatternStrategyObject'] = new CandlestickPatternStrategyObject();
	this.objects['FractalsObject'] = new FractalsObject();
	this.objects['IndicatorObject'] = new StrategyObject();

	this.objects['TradeObject'] = new TradeObject(this.settings.positions);
	this.objects['StopLimitObject'] = new StopLimitObject(this.settings.positions);
	this.objects['POSITION'] = new TradeObject(this.settings.positions);
	this.objects['TP'] = new TradeObject(this.settings.orders);
	this.objects['SL'] = new TradeObject(this.settings.orders);
	this.objects['BUY LIMIT'] = new TradeObject(this.settings.orders);
	this.objects['BUY STOP'] = new TradeObject(this.settings.orders);
	this.objects['BUY STOP_LIMIT'] = new StopLimitObject(this.settings.orders);
	this.objects['SELL LIMIT'] = new TradeObject(this.settings.orders);
	this.objects['SELL STOP'] = new TradeObject(this.settings.orders);
	this.objects['SELL STOP_LIMIT'] = new StopLimitObject(this.settings.orders);

	this.objects['SELL TRAILING_STOP'] = new TradeObject(this.settings.orders);
	this.objects['BUY TRAILING_STOP'] = new TradeObject(this.settings.orders);
	this.objects['SELL TAKE_PROFIT'] = new TradeObject(this.settings.orders);
	this.objects['BUY TAKE_PROFIT'] = new TradeObject(this.settings.orders);
	this.objects['SELL TAKE_PROFIT_MARKET'] = new TradeObject(this.settings.orders);
	this.objects['BUY TAKE_PROFIT_MARKET'] = new TradeObject(this.settings.orders);
	this.objects['SELL TAKE_PROFIT_LIMIT'] = new StopLimitObject(this.settings.orders);
	this.objects['BUY TAKE_PROFIT_LIMIT'] = new StopLimitObject(this.settings.orders);

	this.objects['MovePaneArrows'] = new MovePaneArrows();

	var shape = new Shape();  //instancja bazowa
		TrendLineObject.prototype = shape;
		ArrowObject.prototype = shape;
		ParallelChannelObject.prototype = shape;
		FibonLinesObject.prototype = shape;
		HorizontalLineObject.prototype = shape;
		VerticalLineObject.prototype = shape;
		MultiLineObject.prototype = shape;
		AbcdObject.prototype = shape;
		EllipseObject.prototype = shape;
		HorizontalRangeObject.prototype = shape;
		VerticalRangeObject.prototype = shape;
		CycleObject.prototype = shape;
		BoxObject.prototype = shape;
		TextObject.prototype = shape;
		TriangleObject.prototype = shape;
		PriceTagObject.prototype = shape;
	
		DiNapoliLevels.prototype = shape;
		DiNapoliAbcObject.prototype = shape;

	this.objects['trendLine'] = new TrendLineObject();
	this.objects['arrow'] = new ArrowObject();
	this.objects['parallelChannel'] = new ParallelChannelObject();
	this.objects['fibonLines'] = new FibonLinesObject();
	this.objects['hLine'] = new HorizontalLineObject();
	this.objects['vLine'] = new VerticalLineObject();
	this.objects['mLine'] = new MultiLineObject();
	this.objects['abcd'] = new AbcdObject();
	this.objects['ellipse'] = new EllipseObject();
	this.objects['box'] = new BoxObject();
	this.objects['hRange'] = new HorizontalRangeObject();
	this.objects['vRange'] = new VerticalRangeObject();
	this.objects['cycle'] = new CycleObject();
	this.objects['textAnnotation'] = new TextObject();
	this.objects['triangle'] = new TriangleObject();
	this.objects['priceTag'] = new PriceTagObject();

	//DiNapoli tools
	this.objects['diNapoliLevels'] = new DiNapoliLevels();
	this.objects['diNapoliAbcd'] = new DiNapoliAbcObject();

	this.validateSeriesBeforeRender = function(series){
		try {
			if (!series.data[0])
				throw {type: "EMPTY_SERIES", message: "Can't render/push/pop on empty data series"}
		} catch(e) {
			throw {type: "EMPTY_SERIES", message: "Can't render/push/pop on empty data series"}
		}
	}

	this.render		=	function (ctx, model, fusion, translate, omitObject) {

		try {
			ctx.translate(0.5, 0.5);
			var seriesManager = fusion.getSeriesManager();
			
			this.validateSeriesBeforeRender(seriesManager[model.mainSeries]);

			ctx.font = WEBRCP.utils.colorManager.getFont("text");

			this.calculateTimeTicks(model, seriesManager);

			//## Render panels
			var panel = null;
			for (var i=0; i<model.panels.length; i++) {
				panel = model.panels[i];
				if(panel._visible)
					this.renderPanel(ctx, model, panel, fusion, omitObject);
			}

			//## Render time axis
			this.renderTimeAxis(ctx, model, this.timeTicks, fusion);

			//## Render handlers
			for (var i=0; i<model.panels.length; i++) {
				panel = model.panels[i];
				if(panel._visible)
					this.renderHandler(ctx, model, panel);
			}

			//## Post rendering - all objects have the possibility to draw something on whole chart after rendering
			for (var i=0; i<model.panels.length; i++) {
				panel = model.panels[i];
				if(panel._visible)
					this.postRenderPlotPane(ctx, model, panel, seriesManager, omitObject);
			}

		} catch(err) {
			if (err.type && err.type === "EMPTY_SERIES")
				console.warn(err.message);
			else
				console.warn(err)
		} finally {
			ctx.translate (-0.5, -0.5);
		}
	};

	this.renderPanel		=	function (ctx, model, panel, fusion, omitObject) {
		const seriesManager = fusion.getSeriesManager();
		const valueTick = this.calculateNiceTick(model, panel);
		
		try { this.validateSeriesBeforeRender(seriesManager[model.mainSeries]); }
		catch(e) { this.onErrorWhileRendering(e) }

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("backgroundColor");
		ctx.fillRect(0, panel._offset, panel._width-model.valueAxisWidth, panel._height);

		if (panel.hGrid) this.renderHGrid (ctx, model, panel, valueTick);
		if (panel.vGrid) this.renderVGrid (ctx, model, panel, this.timeTicks);

		this.renderPlotPane(ctx, model, panel, seriesManager, omitObject);
		this.renderValueAxis(ctx, model, panel, valueTick);

		if (model.mode === 'normal') {
			try { this.renderLegend(ctx, model, panel, fusion); }
			catch(e) { this.onErrorWhileRendering(e) }
		}
	};

	this.renderPlotPane	=	function (ctx, model, panel, seriesManager, omitObject) {
		if (!omitObject) omitObject = { id: 'none' };

		ctx.save();
		ctx.rect(0, panel._offset, panel._width-model.valueAxisWidth, panel._height);
		ctx.clip();
		ctx.font = WEBRCP.utils.colorManager.getFont("text");

		if (panel.zeroLine) {
			var y = this.getValuePoint(0, panel._height, panel.vMin, panel.vMax)+panel._offset;
			ctx.strokeStyle = panel.zeroLine.color;
			ctx.lineWidth = panel.zeroLine.width;
			ctx.setLineDash(panel.zeroLine.dash);
			ctx.beginPath();
			ctx.moveTo(0,y);
			ctx.lineTo(panel._width,y);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.closePath();
		}

		var y = this.getValuePoint(0, panel._height, panel.vMin, panel.vMax)+panel._offset;
		ctx.strokeStyle = panel.zeroLine.color;
		ctx.lineWidth = panel.zeroLine.width;
		ctx.setLineDash(panel.zeroLine.dash);
		ctx.beginPath();
		ctx.moveTo(0,y);
		ctx.lineTo(panel._width,y);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.closePath();

		for (var i = 0; i < panel.objects.length; i++) {
			let object = panel.objects[i];

			if (object.isValid && !object.isValid()) continue;
			if (object.permHide) object.hidden = true;
			if (object.hidden && object.hidden === true) continue;
			if (object.isBeingDragged) continue;

			if (this.objects[object.type] != null && object.id != omitObject.id) {
				try { this.objects[object.type].render(object, ctx, this, model, panel, seriesManager); }
				catch(e) { this.onErrorWhileRendering(e) }
			}
		}

		if (model.orders.visible) {
			if (panel.main == true && model.orders &&  model.orders.list && model.orders.list.length > 0) {
				for (var i = 0; i < model.orders.list.length; i++){
					if (model.orders.list[i] != omitObject && !model.orders.list[i].drag)
						try { this.objects[model.orders.list[i].type].render( model.orders.list[i], ctx, this, model, panel, seriesManager); }
						catch(e) { this.onErrorWhileRendering(e) }
				}
			}
		}

		if (model.positions.visible) {
			if (panel.main == true && model.positions && model.positions.list && model.positions.list.length > 0) {
					for (var i = 0; i < model.positions.list.length; i++){
						if (model.positions.list[i]!=omitObject)
							try { this.objects[model.positions.list[i].type].render(model.positions.list[i], ctx, this, model, panel, seriesManager); }
							catch(e) { this.onErrorWhileRendering(e) }
					}
			}
		}

		try { this.objects.MovePaneArrows.render(null, ctx, this, model, panel, seriesManager); }
		catch(e) { this.onErrorWhileRendering(e) }

		ctx.restore();
	};

	this.onErrorWhileRendering = function(e) {
		if (e.type && e.type === "EMPTY_SERIES") console.warn(e.message);
		else console.warn(e);
	}

	this.postRenderPlotPane		=	function (ctx, model, panel, seriesManager, omitObject) {

		if (model.orders.visible) {
			if (panel.main == true && model.orders && model.orders.list && model.orders.list.length > 0) {
				for (var i = 0; i < model.orders.list.length; i++) {
					if (model.orders.list[i] != omitObject && !model.orders.list[i].drag) try {
						this.objects[model.orders.list[i].type].postRender(model.orders.list[i], ctx, this, model, panel, seriesManager);
					}
					catch(e) { this.onErrorWhileRendering(e) }
				}
			}
		}

		if (model.positions.visible) {
			if (panel.main == true && model.positions && model.positions.list && model.positions.list.length > 0) {
				for (var i = 0; i < model.positions.list.length; i++) {
					if (model.positions.list[i]!=omitObject) try {
						this.objects[model.positions.list[i].type].postRender(model.positions.list[i], ctx, this, model, panel, seriesManager);
					}
					catch(e) { this.onErrorWhileRendering(e) }
				}
			}
		}

		for (var i = 0; i < panel.objects.length; i++) {
			if (panel.objects[i]['hidden'] && panel.objects[i]['hidden'] == true) continue;

			if (this.objects[panel.objects[i].type] != null) try {
				this.objects[panel.objects[i].type].postRender(panel.objects[i], ctx, this, model, panel, seriesManager);
			}
			catch(e) { this.onErrorWhileRendering(e) }
		}
	};

	this.shouldBePanelVisible = function(panel){
		for(var i=0; i< panel.objects.length; i++){
			if(!panel.objects[i].hidden) return true;
		}
		return false;
	}

	this.renderOverlay		=	function (octx, model, fusion) {
		var seriesManager = fusion.getSeriesManager();
		octx.font = WEBRCP.utils.colorManager.getFont("text");

		//## fire render overlay on all objects!
		for (var pi = 0; pi < model.panels.length; pi++) {
			var panel = model.panels[pi];

			try {
				octx.save();
				octx.translate (0.5, 0.5);
				octx.rect(0, panel._offset, panel._width - model.valueAxisWidth, panel._height);
				octx.clip();
				octx.font = WEBRCP.utils.colorManager.getFont("text");

				for (var oi = 0; oi < panel.objects.length; oi++) {
					var o = panel.objects[oi];
					if (o.hidden && o.hidden === true) continue;

					if (this.objects[o.type] != null && this.objects[o.type].renderOverlay) {
						this.objects[o.type].renderOverlay(o, octx, this, model, panel, seriesManager);
					}
				}

				if (model.orders.visible) {
					if (panel.main == true && model.orders &&  model.orders.list && model.orders.list.length > 0) {
						for (var i = 0; i < model.orders.list.length; i++) {
							this.objects[model.orders.list[i].type].renderOverlay(
								model.orders.list[i], 
								octx,
								this,
								model,
								panel,
								seriesManager
							);
						}
					}
				}

				if (model.positions.visible) {
					if (panel.main == true && model.positions && model.positions.list && model.positions.list.length > 0) {
						for (var i = 0; i < model.positions.list.length; i++) {
							this.objects[model.positions.list[i].type].renderOverlay(
								model.positions.list[i], 
								octx,
								this,
								model,
								panel,
								seriesManager
							);
						}
					}
				}
			} catch(e) {
				console.error(e,e.stack)
			} finally {
				//permamently close all earlier paths (some can be unclosed)
				octx.beginPath();
				octx.closePath();
				octx.translate (-0.5, -0.5);
				octx.restore();
			}
		}
	}

	this.postRenderOverlay		=	function (octx, model, seriesManager) {
		//postRenderOverlay
		for (var pi=0; pi<model.panels.length; pi++) {
			var panel = model.panels[pi];

			try{
				octx.save();
				octx.translate (0.5, 0.5);
				octx.rect(0, panel._offset, panel._width, panel._height);
				octx.clip();

				for(var oi=0; oi < panel.objects.length; oi++){
					var o = panel.objects[oi];
					if(o['hidden'] && o['hidden']==true) continue;

					if (this.objects[o.type]!=null && this.objects[o.type].postRenderOverlay) {
						this.objects[o.type].postRenderOverlay(o, octx, this, model, panel, seriesManager);
					}
				}

				if(model.orders.visible){
					if(panel.main == true && model.orders &&  model.orders.list && model.orders.list.length > 0){
						for(var i=0; i<model.orders.list.length;i++){
							this.objects[model.orders.list[i].type].postRenderOverlay(model.orders.list[i], octx, this, model, panel, seriesManager);
						}
					}
				}

				if(model.positions.visible){
					if(panel.main == true && model.positions && model.positions.list && model.positions.list.length > 0){
						for(var i=0; i<model.positions.list.length;i++){
							this.objects[model.positions.list[i].type].postRenderOverlay(model.positions.list[i], octx, this, model, panel, seriesManager);
						}
					}
				}
			}catch(e){
				console.error(e, e.stack)
			}finally{
				//permamently close all earlier paths (some can be unclosed)
				octx.beginPath();
				octx.closePath();
				octx.translate (-0.5, -0.5);
				octx.restore();
			}
		}
	}



	this.renderValueAxis	=	function (ctx, model, panel, tick) {
		var mode = panel.valueAxisMode;
		try{
			ctx.save();
			ctx.fillStyle = WEBRCP.utils.colorManager.getColor("priceAxisBackground");
			ctx.fillRect (panel._width - model.valueAxisWidth, panel._offset, model.valueAxisWidth, panel._height);
			ctx.rect(panel._width - model.valueAxisWidth, panel._offset, model.valueAxisWidth, panel._height);
			ctx.clip();

			var tickValue = tick.niceMin;
			var tickPoint = 0;
			var x = panel._width - model.valueAxisWidth;

			ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
			ctx.fillStyle = WEBRCP.utils.colorManager.getColor("priceAxisTextColor");
			ctx.lineWidth = 1;

			while (tickValue<tick.niceMax) {

				//drawTickValue
				tickValue += tick.tickSpacing;
				tickPoint = this.getValuePoint(tickValue, panel._height, panel.vMin, panel.vMax)+panel._offset;
				if (tickPoint<panel._offset) continue;

				ctx.font = WEBRCP.utils.colorManager.getFont("price");
				var v = tickValue;
				if(mode=='log'){
					v = LIB._converterLog.axisToReal(tickValue,1);
				}
				
				var text =v.toFixed(this.getPrecision(model, panel));
				
				if(v > 999999)	text = LIB.nFormatter(v,this.getPrecision(model, panel));
								
				if(panel.valueAxisMode=="perc")	text +="%";
				
				ctx.fillText(text, x+6, tickPoint+2);

			}

		}catch(e){
			console.error(e, e.stack)
		}finally{
			ctx.restore();
		}
	};



	this.renderHGrid		=	function (ctx, model, panel, tick) {

		var tickValue = tick.niceMin;
		var tickPoint = 0;

		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
		ctx.lineWidth = 1;

		while (tickValue<tick.niceMax) {

			//drawTickValue
			tickValue += tick.tickSpacing;
			tickPoint = this.getValuePoint(tickValue, panel._height, panel.vMin, panel.vMax)+panel._offset;
			if (tickPoint<panel._offset) continue;

			ctx.beginPath();
			ctx.moveTo(0, tickPoint);
			ctx.lineTo(panel._width - model.valueAxisWidth, tickPoint);
			ctx.stroke();
			ctx.closePath();

		}

	};

	this.renderVGrid		=	function (ctx, model, panel, ticks) {

		var tickIndex = 0;
		var tickX = 0;

		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
		ctx.lineWidth = 1;

		for (var i=0; i<ticks.length; i++) {

			//if (i==0) continue;

			tickIndex = ticks[i];
			tickX = this.getIndexPoint(tickIndex, model);

			if (tickX>panel._width) continue;

			ctx.beginPath();
			ctx.moveTo(tickX, 0+panel._offset);
			ctx.lineTo(tickX, panel._offset+panel._height);
			ctx.stroke();
			ctx.closePath();

		}

	};

	this.renderTimeAxis		=	function (ctx, model, ticks, fusion) {

		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("timeAxisBackground");
		ctx.fillRect (0, model._height-model.timeAxisHeight, model._width, model.timeAxisHeight);

		var tickIndex = 0;
		var tickX = 0;
		var tickY = model._height-model.timeAxisHeight;
		var stamp = 0;

		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("gridColor");
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("timeAxisTextColor");
		ctx.lineWidth = 1;
		ctx.font = WEBRCP.utils.colorManager.getFont("time");

		for (var i=0; i<ticks.length; i++) {

			//if (i==0) continue;


			tickIndex = ticks[i];

			if (!fusion.getMainSeries().data || tickIndex > fusion.getMainSeriesLastIndex()) return;

			tickX = this.getIndexPoint(tickIndex, model);
			stamp = fusion.getMainSeries().data[tickIndex].stamp;

			if (tickX>model._width-model.valueAxisWidth) continue;

			ctx.fillText(this.getPrettyDate(stamp), tickX, tickY+12);
		}

	};

	this.renderHandler		=	function (ctx, model, panel) {

		//## Don't draw last one
		if (panel._index == model.panels.length-1) return;

		ctx.beginPath();
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("handlerColor");
		ctx.lineWidth = 1;
		ctx.moveTo(0, panel._height+panel._offset);
		ctx.lineTo(panel._width, panel._height+panel._offset);
		ctx.stroke();
		ctx.closePath();

	};

	this.renderLegend		=	function (ctx, model, panel, fusion) {
		var seriesManager = fusion.getSeriesManager();

		var legendCount = 0;
		var legendsRendered = [];
		var idx = fusion.getMainSeriesLastIndex();

		for (var i=0; i<panel.objects.length; i++) {
			if (panel.objects[i].hidden!=true && panel.objects[i].dataLink) {
				if (this.renderLegendLine (ctx, model, panel, panel.objects[i], legendCount, fusion, legendsRendered)) legendCount++;
			}
		};

	};

	this.renderLegendLine = function (ctx, model, panel, object, count, fusion, legendsRendered) {
		function isThisSeriesOutputOfScript(dataLink) {
			const sm = fusion.getScriptsManager();
			for (const property in sm) {
				if (sm.hasOwnProperty(property)) {
					const script = sm[property];
					const outputs = script.outputs;
					for (const key in outputs) {
						if (outputs.hasOwnProperty(key)) {
							if (outputs[key] === dataLink) {
								return script;
							}
						}
					}
				}
			}
			return null;
		}
		if (object.renderLegend === false) return true;
		const seriesManager = fusion.getSeriesManager();
		const series = seriesManager[object.dataLink];
		const script = isThisSeriesOutputOfScript(object.dataLink);

		this.validateSeriesBeforeRender(series);

		const index = fusion.getMainSeriesLastIndex();

		if (legendsRendered.indexOf(object.dataLink) > -1) return false;
		legendsRendered.push(object.dataLink);
		
		let name = series.userName || WEBRCP.locale.fusion.getMessage(series.title, series.title, true);
		if (series.instrument && series.instrument.relatedKey) {
			name = series.instrument.symbol + "." + series.instrument.name;
		}

		if (script) {
			const formattedInputs = [];
			for (const key in script.inputs) {
				let input = script.inputs[key];
				input = input.slice ? input.slice(0, -2) : null;
				input = input && input.split ? input.split(':')[0] : input;

				if (seriesManager[input]) {
					if (!formattedInputs.includes(seriesManager[input].title))
						formattedInputs.push(WEBRCP.locale.fusion.getMessage(seriesManager[input].title, seriesManager[input].title, true));
				}
				else if (typeof script.inputs[key] === 'string' || typeof script.inputs[key] === 'number') {
					formattedInputs.push(WEBRCP.locale.fusion.getMessage(script.inputs[key].toString(), script.inputs[key].toString(), true));
				}
			}
			name += " (" + formattedInputs.join(", ") + ")";
		}

		let color = object.color;
		if (object.renderAs == "OHLC" && series && series.data && series.data[series.data.length - 1].o) {
			const o = series.data[series.data.length - 1].o;
			const c = series.data[series.data.length - 1].c;
			if (o > c) color = WEBRCP.utils.colorManager.getColor("chartRed");
			else if (o <= c) color = WEBRCP.utils.colorManager.getColor("chartGreen");
		} else if (!color) color = WEBRCP.utils.colorManager.getColor("legendLabelColor");

		let str = name + ': ';

		for (var i = 0; i < series.fields.length; i++) {
			const field = series.data[index][series.fields[i]];
			if (!field) continue;
			var v = LIB.nFormatter(field, this.getPrecision(model, panel));
			var label = WEBRCP.locale.fusion.getMessage(series.labels[i], series.labels[i]) + ': ';
			if (series.fields.length == 1 && series.labels[i] == 'value') label = '';
			str += label + v;
			if (i < series.fields.length - 1) str += ', ';
		};

		var add = 0;

		ctx.fillStyle = color;
		ctx.font = WEBRCP.utils.colorManager.getFont("legend");
		ctx.fillText(str, 12, panel._offset + 24 + add + count * 18);

		return true;
	};

	//------------------------------------------------------------------------------

	this.drawPriceTag = function (ctx, model, panel, y, color, textColor, value, valueType) {
		try {
			ctx.save();
			ctx.beginPath();
			ctx.rect(model._width - model.valueAxisWidth, panel._offset, model.valueAxisWidth, panel._height);
			ctx.clip();

			ctx.fillStyle = color;
			ctx.font = WEBRCP.utils.colorManager.getFont("price");

			ctx.beginPath();
			ctx.moveTo(model._width - model.valueAxisWidth, y);
			ctx.lineTo(model._width - model.valueAxisWidth + 5, y - 10);
			ctx.lineTo(model._width, y - 10);
			ctx.lineTo(model._width, y + 10);
			ctx.lineTo(model._width - model.valueAxisWidth + 5, y + 10);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = textColor;

			var v = value;
			if (v) {
				if (panel.valueAxisMode == 'log' && valueType != 'real') {
					v = LIB._converterLog.axisToReal(value, 1);
				}
				var vs = LIB.nFormatter(v, this.getPrecision(model, panel));
				ctx.fillText(vs, model._width - model.valueAxisWidth + 8, y + 3);
			}
		} catch (e) {
			console.error(e, e.stack);
		} finally {
			ctx.restore();
		}
	};

	this.drawDoublePriceTag		=	function (ctx, model, panel, y1, y2, color, textColor, innerColor, innerTextColor, v1, v2, valueType) {
		try{
			ctx.save();
			ctx.rect(model._width-model.valueAxisWidth, panel._offset, model.valueAxisWidth, panel._height);
			ctx.clip();

			if (y2 < y1) {
				var a = y1;
				y1 = y2;
				y2 = a;
			}

			if (v2 > v1) {
				var b = v1;
				v1 = v2;
				v2 = b;
			}

			var fontSize = parseInt(ctx.font);
			var hMin = 4 * fontSize;
			var h = y2 - y1 - 20;
			var labelY = (y1 + h / 2) + 8;
			var bottomOffset = panel._height - (y2 - panel._offset);

			const x = model._width-model.valueAxisWidth;
			const xL = model._width;

			ctx.fillStyle = color;
			ctx.font = WEBRCP.utils.colorManager.getFont("price");
			ctx.beginPath();
			ctx.moveTo(x, y1);
			ctx.lineTo(x+5, y1-10);
			ctx.lineTo(xL, y1-10);
			ctx.lineTo(xL, y1+10);
			ctx.lineTo(x+5, y1+10);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = textColor;
			const vp1 = v1;
			if (panel.valueAxisMode=='log' && valueType != 'real') vp1 = LIB._converterLog.axisToReal(v1,1);
			var vs1 = LIB.nFormatter(vp1, this.getPrecision(model,panel));
			ctx.fillText(vs1, model._width-model.valueAxisWidth+8, y1+3)

			ctx.fillStyle = innerColor;
			ctx.beginPath();
			ctx.moveTo(x+5, y1+10);

			if (h > hMin) {
				ctx.lineTo(xL, y1+10);
				ctx.lineTo(xL, y2-10);
				ctx.lineTo(x+5, y2-10);
				ctx.lineTo(x+5, y1+10);
			}
			else if (bottomOffset < hMin + 15) {
				ctx.lineTo(x+5, y2-10);
				ctx.lineTo(xL, y2-10);
				ctx.lineTo(xL, y1+10);
				ctx.lineTo(x+5, y1+10);

				ctx.moveTo(x+5, y1-10);

				ctx.lineTo(xL, y1-10);
				ctx.lineTo(xL, y1-10-hMin-5);
				ctx.lineTo(x+5, y1-10-hMin-5);
				ctx.lineTo(x+5, y1-10);

				labelY = y1 - 32 - 5;
			}
			else {
				ctx.lineTo(xL, y1+10);
				ctx.lineTo(xL, y2+10+hMin+5);
				ctx.lineTo(x+5, y2+10+hMin+5);
				ctx.lineTo(x+5, y1+10);

				labelY = y2 + 32;
			}

			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(x, y2);
			ctx.lineTo(x+5, y2-10);
			ctx.lineTo(xL, y2-10);
			ctx.lineTo(xL, y2+10);
			ctx.lineTo(x+5, y2+10);
			ctx.closePath();
			ctx.fill();

			var rv1 = v1;
			var rv2 = v2;
			if(panel.valueAxisMode=='log'){
				rv1 = LIB._converterLog.axisToReal(v1);
				rv2 = LIB._converterLog.axisToReal(v2);
			}

			// arrows

			ctx.beginPath();
			ctx.fillStyle = WEBRCP.utils.colorManager.getColor("buyColor")
			ctx.moveTo(model._width-model.valueAxisWidth+12, labelY - 0.5 * fontSize - 4);
			ctx.lineTo(model._width-model.valueAxisWidth+18, labelY - 0.5 * fontSize - 4);
			ctx.lineTo(model._width-model.valueAxisWidth+15, labelY - 0.5 * fontSize - 8);
			ctx.fill();

			ctx.beginPath();
			ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor")
			ctx.moveTo(model._width-model.valueAxisWidth+12, labelY + 1.5 * fontSize - 4);
			ctx.lineTo(model._width-model.valueAxisWidth+18, labelY + 1.5 * fontSize - 4);
			ctx.lineTo(model._width-model.valueAxisWidth+15, labelY + 1.5 * fontSize);
			ctx.fill();

			// labels

			var labelDn = (Math.abs((rv1-rv2)/v1)*100).toFixed(2)+"%";
			var labelUp = (Math.abs((rv1-rv2)/v2)*100).toFixed(2)+"%";
			var label = (Math.abs(rv1-rv2)).toFixed(this.getPrecision(model, panel));

			const vp2 = v2
			if (panel.valueAxisMode=='log' && valueType != 'real') vp2 = LIB._converterLog.axisToReal(v2,1);
			var vs2 = LIB.nFormatter(vp2, this.getPrecision(model,panel));

			ctx.fillStyle = textColor;
			ctx.fillText(vs2, model._width-model.valueAxisWidth+8, y2+3)

			ctx.fillStyle = innerTextColor;
			ctx.font = WEBRCP.utils.colorManager.getFont("text");
			ctx.fillText(labelUp, model._width-model.valueAxisWidth+23, labelY - 0.5 * fontSize - 2);
			ctx.fillText(label, model._width-model.valueAxisWidth+12, labelY + fontSize / 2);
			ctx.fillText(labelDn, model._width-model.valueAxisWidth+23, labelY + 1.5 * fontSize + 2);

		}catch(e){
			console.error(e, e.stack)
		}finally{
			ctx.restore();
		}
	};

	this.drawTimeTag		=	function (ctx, model, x, color, textColor, fusion) {
		try{
			if (x > model._timeAxisWidth) return;

			ctx.save();
			ctx.rect(0, model._height-model.timeAxisHeight, model._width, model.timeAxisHeight + 10);
			ctx.clip();

			var index = this.getPointIndex(x, model);
			if (!fusion.getMainSeries().data || index > fusion.getMainSeriesLastIndex()) return;

			var stamp = fusion.getMainSeries().data[index].stamp;
			var prettyDate = this.getPrettyDate(stamp);
			var y = model._height-20/2 - 5;
			var yT = model._height-20 - 5;
			var yB = model._height - 5;
			var w = 120;

			ctx.fillStyle = color;

			ctx.beginPath();
			ctx.moveTo(x-10, yT+5);
			ctx.lineTo(x, y);
			ctx.lineTo(x+5, yT);
			ctx.lineTo(x+w-5, yT);
			ctx.lineTo(x+w, y);
			ctx.lineTo(x+w-5, yB);
			ctx.lineTo(x+5, yB);
			ctx.lineTo(x, y);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = textColor;
			ctx.font = WEBRCP.utils.colorManager.getFont("time");

			var tw =  ctx.measureText(prettyDate).width;
			var txtX = x + w/2 -tw/2;
			ctx.fillText(prettyDate, txtX, y+4);
		}catch(e){
			console.error(e, e.stack)
		}finally{
			ctx.restore();
		}

	};

	this.drawDoubleTimeTag		=	function (ctx, model, x1, x2, color, textColor, fusion) {
		try{
			ctx.save();
			ctx.rect(0, model._height-model.timeAxisHeight, model._width, model.timeAxisHeight + 10);
			ctx.clip();

			if (x1 > model._timeAxisWidth) return;
			if (x2 > model._timeAxisWidth) return;
			if(x2 < x1){
				var a = x1;
				x1 = x2;
				x2 = a;
			}
			var withDateDiff = true;
			var index1 = this.getPointIndex(x1, model);
			if (index1 > fusion.getMainSeries().data.length-1) return;
			var index2 = this.getPointIndex(x2, model);
			if (index2 > fusion.getMainSeries().data.length-1){
				withDateDiff = false;
			}

			var y = model._height-20/2 - 5;
			var yT = model._height-20 - 5;
			var yB = model._height - 5;
			var wMin = 150;
			var w = 150;
			if(Math.abs(x2-x1)>w) w= Math.abs(x2-x1);

			ctx.fillStyle = color;

			ctx.beginPath();
			ctx.moveTo(x1-10, yT+5);
			ctx.lineTo(x1, y);
			ctx.lineTo(x1+5, yT);

			if(w > wMin){
				ctx.lineTo(x2-5, yT);
				ctx.lineTo(x2, y);
				ctx.lineTo(x2-5, yB);
			}else{
				ctx.lineTo(x1+w-5, yT);
				ctx.lineTo(x1+w, y);
				ctx.lineTo(x1+w-5, yB);
			}

			ctx.lineTo(x1+5, yB);
			ctx.lineTo(x1, y);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = textColor;
			ctx.font = WEBRCP.utils.colorManager.getFont("time");

			var label="";
			if(withDateDiff){
				var stamp1 = fusion.getMainSeries().data[index1].stamp;
				var stamp2 = fusion.getMainSeries().data[index2].stamp;
				var delta = Math.abs(stamp2 - stamp1)/1000;
				var days = Math.floor(delta / 86400);
				delta -= days * 86400;
				var hours = Math.floor(delta / 3600) % 24;
				delta -= hours * 3600;
				var minutes = Math.floor(delta / 60) % 60;
				delta -= minutes * 60;
				label = days +"d : "+ hours+"h : "+minutes+"m "+(index2-index1)+" periods"
			}else{
				label = (index2-index1)+" periods"
			}
			var tw =  ctx.measureText(label).width;
			var txtX = x1 + w/2 -tw/2;

			ctx.fillText(label, txtX, y+4);
		}catch(e){
			console.error(e, e.stack)
		}finally{
			ctx.restore();
		}
	};

	this.getIndexPoint = function (i, model) {
		return i * model.periodWidth - model.viewportLeft;
	};

	this.getPointIndex = function (x, model) {
		return Math.floor ((x + model.viewportLeft) / model.periodWidth);
	};

	this.getStampPoint = function(s, model, seriesManager){
		var index = this.getStampIndex(s, model, seriesManager);
		return this.getIndexPoint(index, model);
	};

	this.getStampIndex = function(s, model, seriesManager){
		var lastIndex = seriesManager[model.mainSeries].data.length-1;
		
		for (var i=0; i<seriesManager[model.mainSeries].data.length; i++) {
			var stamp = seriesManager[model.mainSeries].data[i].stamp;

			if (stamp==s) return i;

			if(i< lastIndex){
				var nextStamp = seriesManager[model.mainSeries].data[i+1].stamp;
				if(s > stamp && s < nextStamp) return i;
			}

			if(i == lastIndex){
				var intervalInMilis = seriesManager[model.mainSeries].interval.milis;
				if(s > stamp && s < stamp+intervalInMilis) return i;
			}
		}
		return i + Math.round( (s-stamp) / seriesManager[model.mainSeries].interval.milis);
	};


	this.getIndexStamp = function(index, model, seriesManager){
		var seriesLength = seriesManager[model.mainSeries].data.length;
		if(index >= seriesLength){
			let stamp = seriesManager[model.mainSeries].data[seriesLength - 1].stamp;
			let leftOver = (index-seriesLength)*seriesManager[model.mainSeries].interval.milis;
			return stamp + leftOver;
		}
		if(index < 0){
			let stamp = seriesManager[model.mainSeries].data[0].stamp;
			let leftOver = index*seriesManager[model.mainSeries].interval.milis;
			return stamp - leftOver;
		}
		else{
			return seriesManager[model.mainSeries].data[index].stamp
		}
	};

	this.getValuePoint	=	function (rV, vH, vMin, vMax, mode, fV) {
		var len = vMax - vMin;
		var max = vMax;
		var min = vMin;

		var nv	= null;
		if(mode == 'perc')
			nv = LIB._converterPerc.realToAxis(rV, fV);
		else if(mode == 'log')
			nv = LIB._converterLog.realToAxis(rV, fV);
		else
			nv = LIB._converterLin.realToAxis(rV, fV);

		if (vMin<0) {

			min = 0;
			max	+=Math.abs(vMin);
			nv	= parseFloat(nv) + Math.abs(vMin);

		} else {
			nv	-=Math.abs(vMin);
		}

		var yy = (nv * vH) / len;

		return vH - Math.floor(yy);
	};


	this.getPointValue	=	function (p, vH, vMin, vMax, mode, fV) {
		var	len 	= vMax - vMin;
		var point	= vH - p;

		var aV = (point * len) / vH;
		aV+=vMin;

		var nv = null;
		if(mode == 'perc')
			nv = LIB._converterPerc.axisToReal(aV, fV)
		else if(mode == 'log')
			nv = LIB._converterLog.axisToReal(aV, fV)
		else
			nv = LIB._converterLin.axisToReal(aV, fV)

			//return Math.floor(nv*100000)/100000;
			return nv;
	};

	this.calculateTimeTicks	=	function (model, seriesManager) {

		this.timeTicks = new Array();

		var lastIndex = 0;
		var lastIndexPoint = -10;
		var indexPoint = 0;


		for (var i=model['_leftIndex']; i<model['_rightIndex']; i++) {

			indexPoint = this.getIndexPoint(i, model);

			if (indexPoint-lastIndexPoint>=model.minTimeTickWidth) {
				lastIndexPoint = indexPoint;
				this.timeTicks.push(i);
			}


		}



		return this.timeTicks;
	};

	this.calculateNiceTick	=	 function (model, panel) {

		var tick = {};

		tick['maxTicks'] 		= panel._height / model.minValueTickHeight;
		tick['range'] 			= this.niceNum(panel.vMax - panel.vMin, false);
		tick['tickSpacing']		= this.niceNum(tick['range']  / tick['maxTicks'], true);
		tick['niceMin']			= Math.floor(panel.vMin / tick['tickSpacing']) * tick['tickSpacing'];
		tick['niceMax']			= Math.ceil(panel.vMax / tick['tickSpacing']) * tick['tickSpacing'];

		return tick;

	};

	this.niceNum	=	function (range, round) {

		var exponent	=	0;
		var fraction	=	0;
		var niceFraction	=	0;

		exponent = Math.floor(Math.log10(range));
		fraction = range / Math.pow(10, exponent);

		if (round) {
			if (fraction < 1.5)
				niceFraction = 1;
			else if (fraction < 3)
				niceFraction = 2;
			else if (fraction < 7)
				niceFraction = 5;
			else
				niceFraction = 10;
		} else {
			if (fraction <= 1)
				niceFraction = 1;
			else if (fraction <= 2)
				niceFraction = 2;
			else if (fraction <= 5)
				niceFraction = 5;
			else
				niceFraction = 10;
		}

		return niceFraction * Math.pow(10, exponent);
	}

	this.months	= ['JAN', 'FEB', 'MAR', 'APR' , 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
	this.getPrettyDate	=	function (stamp, notime) {

		var date = new Date(stamp);

		var day = date.getDate();
		var mon	= date.getMonth();
		var yer = date.getFullYear();
		var h	= date.getHours();
		var m	= date.getMinutes();
		var str = day+' '+this.months[mon]+' '+yer;

		if (!notime) str += ' | '+this.zeroLead(h)+':'+this.zeroLead(m);

		return str;

	};

	this.zeroLead = function (num) {

		if (num<10) return '0'+num;
		return ''+num;

	};

	this.getPrecision = function(model, panel){
		var p = 5;
		if(panel.valueAxisMode == 'perc'){
			p = 2;
		}else if(model.instrumentsSeries && model.instrumentsSeries.length > 0){
				p = model.instrumentsSeries[0].instrument.precision > 4 ? model.instrumentsSeries[0].instrument.precision : model.instrumentsSeries[0].instrument.precision
		}
		return p;
	}

};

export default Renderer;

//# sourceURL=./platform/components/newchart/js/renderer.js
