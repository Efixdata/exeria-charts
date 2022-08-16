import WEBRCP from "./WebRCP";
import LIB from "./utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from './utils/objects-lib';
import { isTouchDevice } from "./utils/environment";

//obiekt bazowy
function Shape(){
	this.anchorPointSize = 3;
	this.anchorPointDistanceToArrow = 10;
	this.anchorPointArrowSize = 6;
	this.anchorColor = WEBRCP.utils.colorManager.getColor('accent');
	this.anchorColorHover = WEBRCP.utils.colorManager.getColor('chartZeroColor');
	this.defaultFont = '11px Roboto';
	this.allowedStickyKeys = {'o': true, 'h': true, 'l': true, 'c': true};
	this.hitTolerance = 5;

	if (isTouchDevice()) {
		this.anchorPointSize = 15;
		this.hitTolerance = 15;
	}

	this.getPoints = function (o, renderer, panel, model, seriesManager) {
		const anchors = o.anchors;
		const pts = [];
		const fV = LIB.getReferenceValue(o, model, seriesManager);
		let expandableCnt = 0;
		
		for (var i = 0; i < anchors.length; i++) {
			const index = renderer.getStampIndex(anchors[i].prawilnyStamp, model, seriesManager);
			const value = anchors[i].value;
			const x = renderer.getIndexPoint(index, model) + model._midOffset;
			const y = renderer.getValuePoint(anchors[i].value, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) + panel._offset;

			const point = {
				x: x,
				y: y,
				index: index,
				value: value
			};

			if (anchors[i].expandable === true) {
				point.expandable = true;
				expandableCnt++;

				if (expandableCnt == 2) {
					if (point.x < pts[0].x) { //check direction and flip if needed
						point['dir'] = (anchors[i]['defaultDirection']=='right')? 'left' : 'right';
						pts[0]['dir'] = (point['dir']=='right')? 'left' : 'right';
					}
				} else {
					point['dir'] = anchors[i]['defaultDirection'];
				}

				if (anchors[i].expanded === true)
					point['expanded'] = true;
				else
					point['expanded'] = false;
			}

			pts.push(point);
		}

		return pts;
	};

	this.push			=	function (o, renderer, model, seriesManager, interactor){
		var lastStamp = seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length-1]['stamp'];
		var lastIndex = seriesManager[model.mainSeries].data.length-1;
		o.anchors.forEach(function(a){
			//console.log("ANCHOR BEFORE PUSH:", a);
			var stamp = null;
			a.stamp = lastStamp

			if(a._index > lastIndex){
				stamp = lastStamp + (a._index-lastIndex)*seriesManager[model.mainSeries].interval.milis;
			}else if(a._index < 0){
				stamp = -1;
			}else{
				stamp = seriesManager[model.mainSeries].data[Math.floor(a._index)].stamp;
			}

			a.offset = lastStamp - stamp;
			//console.log("ANCHOR AFTER PUSH:", a, " offset "+ (a.offset/60000)+ "min from date:" + (new Date(a.stamp)));
		});
	};

	this.pop	=	function (o, renderer, model, seriesManager, interactor){
		var lastStamp = seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length-1]['stamp'];
		var lastIndex = seriesManager[model.mainSeries].data.length-1;
		o.anchors.forEach(function(a){
			//console.log("ANCHOR BEFORE POP:", a);
			var stamp = a.stamp - a.offset;

			if(stamp > lastStamp){
				var offsetIndex = (a.offset/seriesManager[model.mainSeries].interval.milis);
				a._index = Math.round(lastIndex-offsetIndex);
			}else if(stamp < 0){
				a._index = -1;
			}else{
				a._index = interactor.getStampIndex(stamp);
			}

			//console.log("ANCHOR AFTER POP:", a);
		});
	};

	this.render		=	function (o, ctx, renderer, model, panel, seriesManager) {
		//override this method in child object!!!!
	};
	this.postRender		=	function (o, ctx, renderer, model, panel, seriesManager) {
		ctx.font = this.defaultFont;
	};

	this.updateExtremes	=	function (o, extremes, model, seriesManager) {

	};

	this.getMenuItems	=	function (o, chart) {
		var object = o;

		var menuItems	=	{};

		if(o.userName){
			menuItems.showName = {
					name: o.userName,
					icon: false,
					callback: function(){return true;},
					disabled: true
			}
			menuItems['sep'+'-1'] = "---------";
		}

		menuItems.setName = {
				name: chart.options.locale.getMessage('set_name', "Set name"),
				icon: false,
				callback: function(key, options){
					if(!o.userName) o.userName = null;
					chart.requestObjectText(o, 'userName', o.userName, chart.options.locale.getMessage('set_name', "Set name"));
					if(!o.userName || o.userName.trim().length == 0) o.userName = null;
					return true;
				}
		}

		if(o.text !=undefined){
			menuItems.text = {
					name: chart.options.locale.getMessage('set_text', "Set text"),
					icon: false,
					callback: function(key, options){
						if(o.text || o.text==""){
							chart.requestObjectText(o, 'text', o.text);
						}
						return true;
					}
			}
		}

		if(o.setAnchorValue){
			menuItems.setValue = {
				name: chart.options.locale.getMessage('set_value', "Set value"),
				icon: false,
				callback: function(key, options){
					if(o.setAnchorValue){
						chart.requestObjectAnchorValue(o);
					}
					return true;
				}
			}
		}

		if(o.values !=undefined && o.valuesState != undefined){
			menuItems.setValues = {
					name: chart.options.locale.getMessage('set_values', "Set values"),
					icon: false,
					callback: function(key, options){
						if(o.values){
							chart.requestObjectValues(o, 'values', o.values);
						}
						return true;
					}
			}
		}

		if(o.flipped !== undefined){
			menuItems.flip = {
					name: chart.options.locale.getMessage('flip', "Flip"),
					icon: false,
					callback: function(key, options){
						if(o.flipped !== undefined){
							o.flipped = !o.flipped;
						}
						return true;
					}
			}
		}

		if(o.fillBg !== undefined){
			menuItems.fill = {
					name: chart.options.locale.getMessage('fill', "Fill"),
					icon: function($element, key, item){
						if(o['fillBg'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key, options){
						if(o.fillBg !== undefined){
							o.fillBg = !o.fillBg;
						}
						return true;
					}
			}
			menuItems.fill.disabled = o.isIndicator;
		}

		if (o.priceMarker) {
			menuItems.priceMarker = {
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
			};
		}

		if(o.canBeIndicator == true){
			menuItems.registerAsSeries = {
					name: chart.options.locale.getMessage('register_as_indicator', "Register as indicator"),
					icon: function($element, key, item){
						if(o['isIndicator'] == true){
							return 'context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white';
						}
						return 'context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white';
					},
					callback: function(key, options){
						if(o['isIndicator']==true)
							chart.interactor.unregisterObjectAsIdicator(o);
						else
							chart.interactor.registerObjectAsIdicator(o);
						return true;
					}
			}
		}

		return menuItems;
	};

	this.expandAnchor = function(anchor){
		if(anchor.expandable)
			anchor.expanded = !anchor.expanded;
	};

	this.isValid = function(){
		for(var k in o.anchors){
			if(o.anchors[k]._index < 0) return false;
			if(o.anchors[k].stamp - o.anchors[k].offset <= 0) return false;
		}
	};

	this.clearHits = function(o){
		o._hit=false;
		o._hitAnchor=null;
		o._hitArrow=null;
	};

	this.getCurrentCandles = function(index, model, seriesManager){
		var candles = [];
		for(var i in model.instrumentsSeries){
			var seriesId = model.instrumentsSeries[i].seriesId;
			var series = seriesManager[seriesId];
			if(index < series.data.length)
				candles.push(series.data[index]);
		}
		return candles;
	};

	this.getLastCandlePoint = function (renderer, model, seriesManager) {
		const seriesId = model.instrumentsSeries[0].seriesId;
		const series = seriesManager[seriesId];

		return renderer.getIndexPoint(series.data.length, model) + 10;
	};

	this.stickToCandlePoint = function(e, panel, renderer, fV, candles, point){
		//renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
		var offset = 20, minDifference = 999999, closestPoint = 0, candle = null, difference = 99999;
		var allowedKeys = this.allowedStickyKeys;
		var candlePoint = point;
		for(var i in candles){
			candle = candles[i];
			for(var j in candle){ // j is every key of every candle
				if(!(allowedKeys[j])) continue;

				candlePoint = renderer.getValuePoint(candle[j], panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)+panel._offset;
				difference = Math.abs(candlePoint - point);
				if(difference < minDifference){
					minDifference = difference;
					closestPoint = candlePoint;
				}
			}			
		}
		if(minDifference < offset)
			return closestPoint;
		else
			return point;
	};

	this.stickToCandleValue = function(point, candles, panel, renderer, fV){
		var offset = 20, minDifference = 999999, closestPoint = 0, closestValue =0, candle = null, difference = 99999;
		var allowedKeys = this.allowedStickyKeys;
		var pointValue = renderer.getPointValue(point, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
		for(var i in candles){
			candle = candles[i];
			for(var j in candle){ // j is every key of every candle
				if(!(allowedKeys[j])) continue;
				var candlePoint = renderer.getValuePoint(candle[j], panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)+panel._offset;
				difference = Math.abs(candlePoint - point);
				if(difference < minDifference){
					minDifference = difference;
					closestPoint = candlePoint;
					closestValue = candle[j];
				}
			}			
		}
		if(minDifference < offset)
			return closestValue;
		else
			return pointValue;
	};


	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);
	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);
	};

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		
		var idx = interactor.currentAnchor.selected;	
		var yValue = e._offset.offsetY-panel._offset;
		var baseAnchors = interactor.currentAnchor.anchors;
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		

		if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

		if(idx!=null){
			let index = renderer.getStampIndex(baseAnchors[idx].prawilnyStamp, model, seriesManager) + xOffset;
			if(o.sticky){		
				var candles = this.getCurrentCandles(index, model, seriesManager);
				var v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
			}
			else{
				var v = baseAnchors[idx].value+yOffset;
			}		
			o.anchors[idx]._index = index;
			o.anchors[idx].value = LIB.round(v,renderer.getPrecision(model,panel));
			o.anchors[idx].prawilnyStamp = renderer.getIndexStamp(o.anchors[idx]._index, model, seriesManager);
		}else{
			for(var i=0; i< o.anchors.length ;i++){

				let index = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
				
				o.anchors[i]._index = index+xOffset;
				o.anchors[i].value = baseAnchors[i].value+yOffset;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};

	this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		const fV = LIB.getReferenceValue(o, model, seriesManager);
		const idx = renderer.getPointIndex (e._offset.offsetX, model);
		const yValue = e._offset.offsetY-panel._offset;
		const currentAnchor = interactor.currentAnchor ? interactor.currentAnchor.selected : 0;
		let v;

		if (o.sticky) {
			const candles = this.getCurrentCandles(idx, model, seriesManager);
			v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
		}
		else
			v = renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);		
			
		if (!interactor.currentAnchor) {
			for (var i in o.anchors) {
				o.anchors[i]._index = idx;
				o.anchors[i].value = LIB.round(v,renderer.getPrecision(model, panel));
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
		else {
			interactor.pushPanel(this, o, panel);

			o.anchors[currentAnchor]._index = idx;
			o.anchors[currentAnchor].value = LIB.round(v,renderer.getPrecision(model, panel));
			o.anchors[currentAnchor].prawilnyStamp = renderer.getIndexStamp(o.anchors[currentAnchor]._index, model, seriesManager);
		}

		return {
			selected: currentAnchor + 1, 
			anchors: JSON.parse(JSON.stringify(o.anchors))
		};
	};

	this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		if (interactor.currentAnchor) {
			var i = interactor.currentAnchor.selected;
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			var yValue = e._offset.offsetY-panel._offset;

			if (o.sticky) {
				var candles = this.getCurrentCandles(idx, model, seriesManager);
				var v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
			}
			else
				var v = renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
			
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].value = LIB.round(v,renderer.getPrecision(model,panel));
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
				console.log("stage move",i, o.anchors[i]);
			}
		}
	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		const xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		const yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;

		if (Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance) {
			interactor.currentAnchor.drag = true;
		}

		this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);
		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}
	};

}

Shape.prototype = new Shape();//{	constructor: Shape }

function TrendLineObject(){

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var fV = LIB.getReferenceValue(o, model, seriesManager);

		var line = calcLine({x:pts[0].index, y:pts[0].value},{x:pts[1].index, y:pts[1].value});
		
		var lPoint = pts[0].x < pts[1].x ? pts[0] : pts[1];
		var rPoint = pts[0].x > pts[1].x ? pts[0] : pts[1];

		ctx.beginPath();
		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();

		var startI = lPoint.expanded == true ? 0 : lPoint.index;
		var endI = rPoint.expanded == true ? model._rightIndex : rPoint.index;
		if (pts[0].x == pts[1].x) {
			var uPoint = pts[0].y < pts[1].y ? pts[0] : pts[1];
			var dPoint = pts[0].y > pts[1].y ? pts[0] : pts[1];

			if(uPoint.expanded==true)
				ctx.moveTo(pts[0].x, 0);
			else
				ctx.moveTo(pts[0].x, uPoint.y);
			
			if(dPoint.expanded==true)
				ctx.lineTo(pts[0].x, model._height);
			else
				ctx.lineTo(pts[0].x, dPoint.y);
				
		} else {

			if (panel.valueAxisMode == "lin") {
				let x1 = renderer.getIndexPoint(startI, model) + parseInt(model._midOffset);
				let x2 = renderer.getIndexPoint(endI, model) + parseInt(model._midOffset);
				let y1 = renderer.getValuePoint(line.a * startI + line.b, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) + panel._offset;
				let y2 = renderer.getValuePoint(line.a * endI + line.b, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) + panel._offset;
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
			} else {
				for (var i = startI; i <= endI; i++) {
					var lineValue = line.a * i + line.b;
					let x = renderer.getIndexPoint(i, model) + parseInt(model._midOffset);
					let y = renderer.getValuePoint(lineValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) + panel._offset;

					if (i == model._leftIndex)
						ctx.moveTo(x, y);
					else
						ctx.lineTo(x, y);
				}
			}
		}

		ctx.stroke();
		ctx.closePath();

		if(o.isIndicator && o.canBeIndicator){
			var pt = pts[0];
			if(pts[1].x < pts[0].x) pt = pts[1];
			drawIndicatorMarker(ctx, panel, pt, 13, WEBRCP.utils.colorManager.getColor("indicatorMarker"), 0.9 );
		}

	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		var fV = LIB.getReferenceValue(o, model, seriesManager);

		if ((between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
			between(pts[0].y, y, pts[1].y, self.hitTolerance + self.anchorPointDistanceToArrow)
		)
			|| (
				o.anchors[0].expanded == true &&
				between(pts[0].x < pts[1].x ? 0 : pts[0].x, x, pts[0].x < pts[1].x ? pts[1].x : panel._width - model.valueAxisWidth, self.hitTolerance)
			)
			|| (
				o.anchors[1].expanded == true &&
				between(pts[1].x < pts[0].x ? 0 : pts[1].x, x, pts[1].x < pts[0].x ? pts[0].x : panel._width - model.valueAxisWidth, self.hitTolerance)
			)
		) {


			if (pts[0].x == pts[1].x) {  //vertical line
				var hDistance = pointsDistance({ x: x, y: y }, { x: pts[0].x, y: y });
				if (hDistance < self.hitTolerance) {
					hitResult = true;
					o._hit = true;
					var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
					if (p) {
						o._hitAnchor = { x: p.x, y: p.y };
					}
					var uPoint = pts[0].y < pts[1].y ? pts[0] : pts[1];
					var dPoint = pts[0].y > pts[1].y ? pts[0] : pts[1];
					var a = findAnchorPointArrowForXY(pts, x, y, self.anchorPointDistanceToArrow, self.hitTolerance);
					if (a && o.selected) {
						o._hitArrow = { x: a.x, y: a.y };
					}
				}


			} else {
				var line = calcLine({ x: pts[0].index, y: pts[0].value }, { x: pts[1].index, y: pts[1].value });

				var lIndex1 = renderer.getPointIndex(x, model);
				var lIndex2 = lIndex1 >= 1 ? lIndex1 - 1 : lIndex1 + 1;

				let lx1 = renderer.getIndexPoint(lIndex1, model) + parseInt(model._midOffset);
				let ly1 = renderer.getValuePoint(line.a * lIndex1 + line.b, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) + panel._offset;
				let lx2 = renderer.getIndexPoint(lIndex2, model) + parseInt(model._midOffset);
				let ly2 = renderer.getValuePoint(line.a * lIndex2 + line.b, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) + panel._offset;

				var nlp1 = getLinePointNearestMouse({ x0: lx1, y0: ly1, x1: lx2, y1: ly2 }, x, y);
				var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y });

				if (distance < self.hitTolerance + self.anchorPointDistanceToArrow) {
					if (distance < self.hitTolerance) {
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if (p) {
							o._hitAnchor = { x: p.x, y: p.y };
						}
					} 
					var p = findAnchorPointArrowForXY(pts, x, y, self.anchorPointDistanceToArrow, self.hitTolerance);
					if (p && o.selected) {
						hitResult = true;
						o._hit = true;
						o._hitArrow = { x: p.x, y: p.y };
					}
					
				}

			}


		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		this.wasDrag = false;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);

		for(var i =0; i<pts.length;i++){
			//is on anchor?
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	o._hitAnchor=null;
	// 	o._hitArrow=null;

	// 	var idx = interactor.currentAnchor.selected;
	// 	var baseAnchors = interactor.currentAnchor.anchors;
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));

	// 	if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

	// 	if(idx!=null){
	// 		if(idx===0){
	// 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
	// 			o.anchors[0].value = baseAnchors[0].value+yOffset;
	// 		}else if(idx===1){
	// 			o.anchors[1]._index = baseAnchors[1]._index+xOffset;
	// 			o.anchors[1].value = baseAnchors[1].value+yOffset;
	// 		}
	// 	}else{
	// 		for(var i=0; i< o.anchors.length ;i++){
	// 			o.anchors[i]._index = baseAnchors[i]._index+xOffset;
	// 			o.anchors[i].value = baseAnchors[i].value+yOffset;
	// 		}
	// 	}
	// };

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);

		if(!this.wasDrag && o._hitArrow){
			for(var i =0; i<pts.length;i++){
				if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
					console.log("Clicked arrow :",i,pts[i]);
					this.expandAnchor(o.anchors[i]);
				}
			}
		}

		interactor.popPanel(this, o, panel);


	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		o._hit = false;
		o._hitAnchor=null;
		o._hitArrow=null;

		this.wasDrag = false;
		interactor.popPanel(this, o, panel);

	};


	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("TRENDLINE stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 	if(interactor.currentAnchor==null){
	// 		o.anchors[0].value = v;
	// 		o.anchors[0]._index = idx;
	// 		o.anchors[1].value = v;
	// 		o.anchors[1]._index = idx;
	// 		//panel.objects.push(o);
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("TRENDLINE stage down start", ca);
	// 		return ca;
	// 	}
	// 	interactor.pushPanel(this, o, panel);
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("TRENDLINE long drag ");
	// 		interactor.currentAnchor.drag = true;
	// 		var i = interactor.currentAnchor.selected;
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("TRENDLINE after drag",i, o.anchors[i]);
	// 		}
	// 	}
	// 	interactor.renderOverlayedObject (this, o, panel);
	// };

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor!==null && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("TRENDLINE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("TRENDLINE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("TRENDLINE stage move",i, o.anchors);
	// 		}
	// 	}
	// };

}

var FibonLinesObject	=	function () {

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var distance = Math.abs(pts[0].y-pts[1].y);
		//calc line values
		var valuesPoints = [];
		for(var i =0; i< o.values.length;i++){
			if(o.valuesState[i]==true){
				var p = pts[1];
				var y = p.y;
				if(p.y>pts[0].y)
					y = y-distance*o.values[i]/100;
				else
					y = y+distance*o.values[i]/100;
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var v = renderer.getPointValue(y, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)+panel._offset;
				valuesPoints.push({y:y, v:v, p:o.values[i]});
			}
		}

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		//fill
		ctx.fillStyle = o.color;
		if(o.fillBg && o.color!==null && o.color!==undefined){
			for(var i =0; i< valuesPoints.length-1;i++){
				var vp = valuesPoints[i];
				var vp2 = valuesPoints[i+1];
				ctx.beginPath();
				ctx.globalAlpha = 0.05+i*0.03;
				ctx.moveTo(pts[0].x, vp.y);
				ctx.lineTo(pts[1].x, vp.y);
				ctx.lineTo(pts[1].x, vp2.y);
				ctx.lineTo(pts[0].x, vp2.y);
				ctx.lineTo(pts[0].x, vp.y);
				ctx.fill();
				ctx.closePath();
			}
			ctx.globalAlpha = 1;
		}

		//draw lines
		ctx.beginPath();
		for(var i =0; i< valuesPoints.length;i++){
			var lineFrom = pts[0].x;
			var lineTo = pts[1].x;

			if(o.anchors[0].expanded == true){
				if(pts[0].x > pts[1].x){
					lineTo = model._timeAxisWidth;
				}else{
					lineFrom = 0;
				}

			}
			if(o.anchors[1].expanded == true){
				if(pts[1].x < pts[0].x){
					lineFrom = 0;
				}else{
					lineTo = model._timeAxisWidth;
				}

			}


			ctx.moveTo(lineFrom, valuesPoints[i].y);
			ctx.lineTo(lineTo, valuesPoints[i].y);
		}
		ctx.stroke();
		//draw diagonal
		//ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracementLine");
		ctx.moveTo(pts[0].x,pts[0].y);
		ctx.lineTo(pts[1].x,pts[1].y);
		ctx.stroke();
		ctx.setLineDash([]);

		//draw labels
		ctx.font = this.defaultFont;
		for(var i =0; i< valuesPoints.length;i++){
			var vp = valuesPoints[i];
			ctx.fillText(vp.v.toFixed(panel.precision)+" ("+vp.p+"%)",pts[0].x,vp.y-5);
		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(	(	between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
				between(pts[0].y, y, pts[1].y, self.hitTolerance+self.anchorPointDistanceToArrow)
		)
		|| (
				o.anchors[0].expanded == true &&
				between(pts[0].x < pts[1].x ? 0 : pts[0].x, x , pts[0].x < pts[1].x ? pts[1].x : panel._width - model.valueAxisWidth, self.hitTolerance)
			)
		|| (
				o.anchors[1].expanded == true &&
				between(pts[1].x < pts[0].x ? 0 : pts[1].x, x , pts[1].x < pts[0].x ? pts[0].x : panel._width - model.valueAxisWidth, self.hitTolerance)
			)
		){
			//line 1
			var nlp1 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[0].y}, x, y);
			var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
			if(distance<self.hitTolerance){
				hitResult = true;
				o._hit = true;
			}

			if(!hitResult){ //line 2
				var nlp2 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[1].y, x1:pts[1].x, y1:pts[1].y}, x, y);
				var distance=pointsDistance({x:x,y:y},{x:nlp2.x, y:nlp2.y})
				if(distance< self.hitTolerance){
					hitResult = true;
					o._hit = true;
				}
			}

			if(!hitResult){//diagonal
				var nlp2 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[1].y}, x, y);
				var distance=pointsDistance({x:x,y:y},{x:nlp2.x, y:nlp2.y})
				if(distance< self.hitTolerance){
					hitResult = true;
					o._hit = true;
				}
			}

			if(hitResult){
				var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
				if(p){
					o._hitAnchor = {x:p.x, y:p.y};
				}
			}else{
				//arrows
				var p = findAnchorPointArrowForXY(pts, x,y,self.anchorPointDistanceToArrow,self.hitTolerance);
				if(p && o.selected){
					hitResult = true;
					o._hit=true;
					o._hitArrow = {x:p.x, y:p.y};
				}
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		this.wasDrag = false;

		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var idx = interactor.currentAnchor.selected;
	// 	var baseAnchors = interactor.currentAnchor.anchors;
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);

	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));

	// 	if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

	// 	if(idx!=null){
	// 		if(idx===0){
	// 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
	// 			o.anchors[0].value = baseAnchors[0].value+yOffset;
	// 		}else if(idx===1){
	// 			o.anchors[1]._index = baseAnchors[1]._index+xOffset;
	// 			o.anchors[1].value = baseAnchors[1].value+yOffset;
	// 		}
	// 	}else{
	// 		for(var i=0; i< o.anchors.length ;i++){
	// 			o.anchors[i]._index = baseAnchors[i]._index+xOffset;
	// 			o.anchors[i].value = baseAnchors[i].value+yOffset;
	// 		}
	// 	}
	// };

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		if(!this.wasDrag){
			var pts = this.getPoints(o, renderer, panel, model, seriesManager);
			for(var i =0; i<pts.length;i++){
				if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
					console.log("Clicked arrow :",i,pts[i]);
					this.expandAnchor(o.anchors[i]);
				}
			}
		}

		interactor.popPanel(this, o, panel);

	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);

	};


	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 	if(interactor.currentAnchor==null){
	// 		o.anchors[0].value = v;
	// 		o.anchors[0]._index = idx;
	// 		o.anchors[1].value = v;
	// 		o.anchors[1]._index = idx;
	// 		//panel.objects.push(o);
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("stage down start", ca);
	// 		return ca;
	// 	}
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("start drag ");
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("real drag ");
	// 		interactor.currentAnchor.drag = true;
	// 	}
	// 	this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
	// };

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("stage up", interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("stage out");
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("stage move",i, o.anchors[i]);
	// 		}
	// 	}
	// };
}


var ParallelChannelObject	=	function () {

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var mid = findMidPoint(pts[0], pts[1]);
		var hh = pointsDistance(mid,pts[2]);
		var h = pts[2].y-mid.y;

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		var line1 = calcLine(pts[0], pts[1]);
		var line2 = calcLine({x: pts[0].x, y: pts[0].y+h}, {x: pts[1].x, y: pts[1].y+h});
		var p1 = pts[0];
		var p2 = pts[1];
		var p3 = {x: pts[0].x, y: pts[0].y+h, expanded: pts[0].expanded};
		var p4 = {x: pts[1].x, y: pts[1].y+h, expanded: pts[1].expanded};

		if(p1.expanded == true){
			var d = (p2.x > p1.x) ?  - panel._width : panel._width;
			var p1 = movePointByDistance(p1,d, line1);
			var p3 = movePointByDistance(p3,d, line1);
		}

		if(p2.expanded == true){
			var d = (p2.x > p1.x) ?  panel._width : - panel._width;
			var p2 = movePointByDistance(p2,d, line1);
			var p4 = movePointByDistance(p4,d, line1);
		}



		if(o.color){
			ctx.beginPath();
			ctx.fillStyle = o.color;
			ctx.globalAlpha = 0.2
			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.lineTo(p4.x, p4.y);
			ctx.lineTo(p3.x, p3.y);
			ctx.lineTo(p1.x, p1.y);
			if(o.fillBg== true)
				ctx.fill();
			ctx.globalAlpha = 1;
		}
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.moveTo(p3.x, p3.y);
		ctx.lineTo(p4.x, p4.y);
		ctx.stroke();

		console.log("CHANNEL RENDER ANCHORS:", o.anchors);
		console.log("CHANNEL RENDER PANE:", panel);
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}

	}

	this.getPoints		=	function (o, renderer, panel, model, seriesManager) {
		var pts = ParallelChannelObject.prototype.getPoints.call(this , o, renderer, panel, model, seriesManager);
		var idx = Math.round((o.anchors[0]._index+o.anchors[1]._index)/2);
		var x = renderer.getIndexPoint(idx, model)+model._midOffset;
		pts[2].x = x;
		return pts;
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var mid = findMidPoint(pts[0], pts[1]);
		var h =pts[2].y-mid.y;
		var hitResult = false;
		this.clearHits(o);

		if(	between(pts[0].x, x, pts[1].x, self.hitTolerance)
		|| (
				o.anchors[0].expanded == true &&
				between(pts[0].x < pts[1].x ? 0 : pts[0].x, x , pts[0].x < pts[1].x ? pts[1].x : panel._width - model.valueAxisWidth, self.hitTolerance)
			)
		|| (
				o.anchors[1].expanded == true &&
				between(pts[1].x < pts[0].x ? 0 : pts[1].x, x , pts[1].x < pts[0].x ? pts[0].x : panel._width - model.valueAxisWidth, self.hitTolerance)
			)
		){

			var nlp1 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[1].y}, x, y);
			var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
			if(distance<self.hitTolerance){
				hitResult = true;
				o._hit = true;
			}

			if(!hitResult){ //line 2
				var nlp2 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y+h, x1:pts[1].x, y1:pts[1].y+h}, x, y);
				var distance=pointsDistance({x:x,y:y},{x:nlp2.x, y:nlp2.y})
				if(distance< self.hitTolerance){
					hitResult = true;
					o._hit = true;
				}
			}

			if(hitResult){
				drawAnchors(interactor.octx, panel, pts, self.anchorPointSize, this.anchorColor, 0.5 );
				var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
				if(p){
					o._hitAnchor = {x:p.x, y:p.y};
				}
			}else{ // arrows??
				var p = findAnchorPointArrowForXY(pts, x,y,self.anchorPointDistanceToArrow,self.hitTolerance);
				if(p && o.selected){
					hitResult = true;
					o._hit=true;
					o._hitArrow = {x:p.x, y:p.y};
				}
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		this.wasDrag = false;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var i = interactor.currentAnchor.selected;
		if(i === 2){
			var baseAnchors = interactor.currentAnchor.anchors;
			var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
			o.anchors[2].value = baseAnchors[2].value+yOffset;
		}
		else{
			Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
		}

		// if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

		console.log("TRENDLINE mouse drag start :", xOffset, yOffset, this.hitTolerance);
		// if(i!=null){
		// 	if(i===0 || i == 1){
		// 		let index = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
		// 		o.anchors[i]._index = index+xOffset;
		// 		o.anchors[i].value = baseAnchors[i].value+yOffset;
		// 		o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
		// 		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		// 		var mid = findMidPoint(pts[0], pts[1]);
		// 		var h = pts[2].y-mid.y;
		// 		o.anchors[2]._index = Math.round((o.anchors[0]._index + o.anchors[1]._index)/2);
		// 		o.anchors[2]._value = renderer.getPointValue(mid.y+h, panel._height, panel.vMin, panel.vMax)+panel._offset;
		// 		o.anchors[2].prawilnyStamp = renderer.getIndexStamp(o.anchors[2]._index, model, seriesManager);
		// 	}else if(i===2){
		// 		o.anchors[2].value = baseAnchors[2].value+yOffset;
		// 	}
		// }else{
		// 	for(var j=0; j< o.anchors.length ;j++){
		// 		let index = renderer.getStampIndex(baseAnchors[j].prawilnyStamp, model, seriesManager);
		// 		o.anchors[j]._index = index+xOffset;
		// 		o.anchors[j].value = baseAnchors[j].value+yOffset;
		// 		o.anchors[j].prawilnyStamp = renderer.getIndexStamp(o.anchors[j]._index, model, seriesManager);
		// 	}
		// }
	};

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		if(!this.wasDrag){
			for(var i =0; i<pts.length;i++){
				if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
					console.log("Clicked arrow :",i,pts[i]);
					this.expandAnchor(o.anchors[i]);
				}
			}
		}
		interactor.popPanel(this, o, panel);

	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.wasDrag = false;
		interactor.popPanel(this, o, panel);

	};

	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model)
	// 	if(interactor.currentAnchor==null){
	// 		o.anchors[0].value = v;
	// 		o.anchors[0]._index = idx;
	// 		o.anchors[1].value = v;
	// 		o.anchors[1]._index = idx;
	// 		o.anchors[2].value = v;
	// 		o.anchors[2]._index = idx;
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("stage down start", ca);
	// 		return ca;
	// 	}
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("start drag ");
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			console.log("real drag ");
			interactor.currentAnchor.drag = true;
		}
		this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("stage up", interactor.currentAnchor);
		console.log("stage up2", o.anchors);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("stage out");
	};

	this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {

		if(interactor.currentAnchor){
			if(interactor.currentAnchor.selected===2){
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
				o.anchors[2].value = v;
			}
			else{
				Shape.prototype.stageMove.call(this, e, o, renderer, interactor, model, panel, seriesManager);
			}
		}
		// var self = this;
		// if(panel === null )return;
		console.log("stage move", interactor.currentAnchor);
		// if(interactor.currentAnchor){
		// 	var i = interactor.currentAnchor.selected;
		// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
		// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
		// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);

		// 	if(i!=null){
		// 		if(i===0 || i == 1){
		// 			o.anchors[i]._index = idx;
		// 			o.anchors[i].value = v;
		// 			o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
		// 			var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		// 			var mid = findMidPoint(pts[0], pts[1]);
		// 			var h = pts[2].y-mid.y;
		// 			var newIndex = (interactor.currentAnchor.anchors[0]._index + interactor.currentAnchor.anchors[1]._index)/2;
		// 			o.anchors[2]._index = newIndex;
		// 			o.anchors[2].value = renderer.getPointValue(mid.y-panel._offset, panel._height, panel.vMin, panel.vMax);
		// 			o.anchors[2].prawilnyStamp = renderer.getIndexStamp(newIndex, model, seriesManager);
		// 			console.log("MID: ", mid.y, o.anchors[2].value);
		// 		}else if(i===2){
		// 			o.anchors[2].value = v;
		// 		}
		// 		console.log("stage move",i, o.anchors[i]);
		// 	}
		// }
	};
}

var ArrowObject	=	function () {

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var baseLine = calcLine(pts[0], pts[1]);
		var distance = pointsDistance(pts[0],pts[1]);
		var midPoint = findMidPoint(pts[0], pts[1]);

		var drawPoints = [];
		drawPoints.push(pts[0]);
		drawPoints.push(calcPointOnPerpendicularLine(baseLine,pts[0], -distance/4));
		drawPoints.push(calcPointOnPerpendicularLine(baseLine,midPoint, -distance/4));
		drawPoints.push(calcPointOnPerpendicularLine(baseLine,midPoint, -distance/2));
		drawPoints.push(pts[1]);
		drawPoints.push(calcPointOnPerpendicularLine(baseLine,midPoint, distance/2));
		drawPoints.push(calcPointOnPerpendicularLine(baseLine,midPoint, distance/4));
		drawPoints.push(calcPointOnPerpendicularLine(baseLine,pts[0], distance/4));
		drawPoints.push(pts[0]);

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(drawPoints[0].x,drawPoints[0].y);
		for(var i=0; i< drawPoints.length;i++){
			ctx.lineTo(drawPoints[i].x,drawPoints[i].y);
		}

		ctx.fillStyle = o.color;
		ctx.globalAlpha = 0.2;
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.stroke();

		if (o.selected) {
			drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var hitResult = false;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var mid = findMidPoint(pts[0], pts[1]);
		var d =  pointsDistance(pts[0], pts[1]);

		this.clearHits(o);

		hitResult = isPointInCircle({x:mid.x, y:mid.y,r:d/2+self.hitTolerance },x,y);
		if(hitResult){
			o._hit = true;
			drawAnchors(interactor.octx, panel, pts, self.anchorPointSize, this.anchorColor, 0.5 );
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ARROW stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);

	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 	if(interactor.currentAnchor==null){
	// 		o.anchors[0].value = v;
	// 		o.anchors[0]._index = idx;
	// 		o.anchors[1].value = v;
	// 		o.anchors[1]._index = idx;
	// 		//panel.objects.push(o);
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("ARROW stage down start", ca);
	// 		return ca;
	// 	}
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ARROW start drag ");
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){			console.log("ARROW real drag ");
	// 	interactor.currentAnchor.drag = true;
	// 	}
	// 	this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
	// };

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("ARROW stage up", interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("ARROW stage out");
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ARROW stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("ARROW stage move",i, o.anchors[i]);
	// 		}
	// 	}
	// };

}

function HorizontalLineObject(){
	//override pop
	this.pop	=	function (o, renderer, model, seriesManager, interactor){
		var lastStamp = seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length-1]['stamp'];
		var lastIndex = seriesManager[model.mainSeries].data.length-1;
		o.anchors[0].stamp = lastStamp;
		o.anchors[0].offset = 0;
		o.anchors[0]._index = lastIndex;
	}
	//override push
	this.push	=	function (o, renderer, model, seriesManager, interactor){
		var lastStamp = seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length-1]['stamp'];
		var lastIndex = seriesManager[model.mainSeries].data.length-1;
		o.anchors[0].stamp = lastStamp;
		o.anchors[0].offset = 0;
		o.anchors[0]._index = lastIndex;
	}
	//override get points
	this.getPoints = function(o, renderer, panel, model,seriesManager){
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var y = renderer.getValuePoint(o.anchors[0].value, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)+panel._offset;
		return [{x:0+this.anchorPointSize, y:y},{x:model._timeAxisWidth-this.anchorPointSize,y:y}];
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(pts[0].x - this.anchorPointSize, pts[0].y);
		ctx.lineTo(pts[1].x + this.anchorPointSize, pts[1].y);
		ctx.stroke();

		if (o.selected) {
			drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if(o.isIndicator && o.canBeIndicator){
			var pt = pts[0];
			drawIndicatorMarker(ctx, panel, pt, 13, WEBRCP.utils.colorManager.getColor("indicatorMarker"), 0.9 );
		}

	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.postRenderOverlay = function (o, ctx, renderer, model, panel, seriesManager) {
		if (o.priceTag) {
			var pts = this.getPoints(o, renderer, panel, model, seriesManager);
			var textColor = WEBRCP.utils.getContrastColor(o.color);
			renderer.drawPriceTag(ctx, model, panel, pts[0].y, o.color, textColor, o.anchors[0].value, 'real');
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(between(pts[0].y-1, y, pts[1].y+1, self.hitTolerance)){
			hitResult = true;
			o._hit = true;
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		
		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yValue = e._offset.offsetY-panel._offset;
		var yOffset = parseFloat((renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)));

		for(var i=0; i< o.anchors.length ;i++){
			var index = renderer.getPointIndex(e.offsetX, model);
			if(o.sticky){		
				var candles = this.getCurrentCandles(index, model, seriesManager);
				var v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
			}
			else{
				var v = baseAnchors[idx].value+yOffset;
			}
			o.anchors[i].value = LIB.round(v,renderer.getPrecision(model,panel));
		}
	};

	/*
	 * STAGE
	 */


	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			interactor.currentAnchor.drag = true;
		}
		this.mouseDrag(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" HORIZONTALLINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("HORIZONTALLINE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};
}


function VerticalLineObject(){
	this.getPoints = function(o, renderer, panel, model, seriesManager){
		var index = renderer.getStampIndex(o.anchors[0].prawilnyStamp, model, seriesManager);
		var x = renderer.getIndexPoint(index, model)+ model._midOffset;
		//var x = renderer.getIndexPoint(o.anchors[0]._index, model)+ model._midOffset;
		return [{x:x, y:panel._offset+this.anchorPointSize},{x:x,y:panel._height+panel._offset}];
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);
		ctx.lineTo(pts[1].x, pts[1].y);
		ctx.stroke();

		if (o.selected) {
			drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(between(pts[0].x-1, x, pts[1].x+1, self.hitTolerance)){
			hitResult = true;
			o._hit = true;
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var idx = interactor.currentAnchor.selected;
	// 	var baseAnchors = interactor.currentAnchor.anchors;
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	for(var i=0; i< o.anchors.length ;i++){
	// 		o.anchors[0]._index = baseAnchors[0]._index+xOffset;
	// 		o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
	// 	}
	// };

	/*
	 * STAGE
	 */

	this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("VERTICALLINE stage down start", interactor.currentAnchor);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);

		var idx = renderer.getPointIndex (e._offset.offsetX, model);
		if(interactor.currentAnchor==null){
			o.anchors[0].value = v;
			o.anchors[0]._index = idx;
			o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
			//panel.objects.push(o);
			var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
			console.log("VERTICALLINE stage down start", ca);
			return ca;
		}
		interactor.pushPanel(this, o, panel);
		return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			console.log("VERTICALLINE long drag ");
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			o.anchors[0]._index = idx;
			o.anchors[0].value = v;
			o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
			console.log("VERTICALLINE after drag",i, o.anchors[0]);
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" VERTICALLINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("VERTICALLINE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("VERTICALLINE stage move", interactor.currentAnchor);
		if(interactor.currentAnchor!==null){
			var i = interactor.currentAnchor.selected;
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].value = v;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
				console.log("VERTICALLINE stage move",i, o.anchors);
			}
		}
	};
}

function DiNapoliLevels(){
	this.subscriptionPack = 'diNapoliTools';

	this.lineWidth = 100;
	this.margin = 20;

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		for (var i = 0; i < pts.length; i++) {
			const circleRadius = 6;
			ctx.beginPath();
			ctx.moveTo(pts[i].x + circleRadius, pts[i].y);
			ctx.arc(pts[i].x, pts[i].y, circleRadius, 0, 2 * Math.PI);

			if (i > 0 && !this.isHighestDifference(pts[0], pts[i], model, seriesManager)) {
				ctx.fillStyle = WEBRCP.utils.colorManager.getColor("sellColor");
				ctx.fill();
			}

			ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
			ctx.stroke();
		}

		for(var i=1; i<pts.length; ++i){
			var fibonPoints = [pts[0], pts[i]];
			this.drawLevels(i-1, fibonPoints, o, ctx, renderer, model, panel, seriesManager);
		}
		
		if (o.selected) {
			drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}
	}

	this.drawLevels =	function (index, pts, o, ctx, renderer, model, panel, seriesManager) {
		var distance = Math.abs(pts[0].y-pts[1].y);
		var valueDistance = Math.abs(pts[0].value-pts[1].value);
		//calc line values
		var valuesPoints = [];
		for(var i =0; i< o.values.length;i++){
				var p = pts[0];
				var y = p.y;
				var v;
				if(p.y>pts[1].y) {
					y = y-distance*o.values[i]/100;
					v = p.value+valueDistance*o.values[i]/100;
				}
				else {
					y = y+distance*o.values[i]/100;
					v = p.value-valueDistance*o.values[i]/100;
				}
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				valuesPoints.push({y:y, v:v, p:o.values[i]});
		}

		ctx.strokeStyle = o.color;
		ctx.fillStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		//draw lines
		
		ctx.font = this.defaultFont;
		var lastIndex = valuesPoints.length-1;
		const lastCandlePoint = this.getLastCandlePoint(renderer, model, seriesManager);
		for(var i = 0; i<=lastIndex;i++){
			
			if(i == lastIndex){
				var lineTo = lastCandlePoint + index*this.lineWidth + this.lineWidth - this.margin;//pts[0].x;
				var lineFrom = pts[1].x;			
			}
			else{
				var lineFrom = lastCandlePoint + index*this.lineWidth;
				var lineTo = lineFrom + this.lineWidth - this.margin;
			}
			if(i==0){
				ctx.fillStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement1");
				ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement1");
			}
			else if(i==1){
				ctx.fillStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement2");
				ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("fibonacciRetracement2");
			} 
			else{
				ctx.fillStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
				ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
				var lineFrom = pts[1].x + 6;
				var lineTo = lastCandlePoint + index*this.lineWidth + this.lineWidth - this.margin;
			}

			ctx.beginPath();
			ctx.moveTo(lineFrom, valuesPoints[i].y);
			ctx.lineTo(lineTo, valuesPoints[i].y);
			ctx.stroke();
			//draw label
			var vp = valuesPoints[i];
			var x = lastCandlePoint + index*this.lineWidth;
			ctx.fillText(vp.v.toFixed(panel.precision), x, vp.y - 4);
			ctx.fillText((vp.p / 100).toFixed(3), x, vp.y + 12);

			if(i>0){
				ctx.beginPath();
				var x = lastCandlePoint + index*this.lineWidth + this.lineWidth - this.margin;
				//ctx.lineTo(x, valuesPoints[0].y);
				var radiusY = (valuesPoints[i].y - valuesPoints[i-1].y)/2;
				var yCenter = valuesPoints[i].y - radiusY;		
				radiusY = Math.abs(radiusY);
				ctx.ellipse(x, yCenter, 20, radiusY, 0, -90*Math.PI/180, 90*Math.PI/180, false);
				ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("disabledTextColor");
				ctx.setLineDash([4, 4]);
				ctx.stroke();
				ctx.setLineDash([]);
			}
		}
	}

	this.isHighestDifference = function (rootPoint, point, model, seriesManager) {
		if (rootPoint.index < point.index) return false;
		
		const seriesId = model.instrumentsSeries[0].seriesId;
		const series = seriesManager[seriesId];
		const priceDifference = Math.abs(rootPoint.value - point.value);
		
		for (let i = rootPoint.index; i >= point.index; --i) {
			if (!series.data[i]) return false;
			if (Math.abs(rootPoint.value - series.data[i].h) > priceDifference) return false;
			if (Math.abs(rootPoint.value - series.data[i].l) > priceDifference) return false;
		}

		return true;
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}


	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);
		const lastCandlePoint = this.getLastCandlePoint(renderer, model, seriesManager);
		if (pts.length >= 2) {
			for(var i = 0; i< pts.length; i++){
				var horizontalLineStart = lastCandlePoint + i * (this.lineWidth - this.margin) + (i - 1) * this.margin;
				if(between(horizontalLineStart, x, pts[i].x, self.hitTolerance)){
					var distance=Math.abs(y - pts[i].y);
					if(distance<self.hitTolerance){
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if(p){
							o._hitAnchor = {x:p.x, y:p.y};
						} else if (i === 0) {
							hitResult = false;
							o._hit = false;
						}
						break;
					}
				}
			}
	}	
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};
	}

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);
	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);
	};

	this.mouseDrag = function (e, o, renderer, interactor, model, panel, seriesManager) {
		if (interactor.currentAnchor.selected === 0 ) {
			this.allowedStickyKeys = {'h': true, 'l': true};
		} else {
			var pts = this.getPoints(o, renderer, panel, model,seriesManager);
			var yValue = e._offset.offsetY-panel._offset;
	
			if (yValue < pts[0].y) this.allowedStickyKeys = {'h': true};
			else this.allowedStickyKeys = {'l': true};
		}

		Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	}

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" MULTILINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			if(e.button == 0){
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
				var idx = renderer.getPointIndex (e._offset.offsetX, model);
				o.anchors.push( {stamp: 0, offset: 0, value: v, _index: idx} );
				return false;
			}else{
				o.hidden=false;
				interactor.currentAnchor = null;
				return true;
			}
		}
	};
	
	this.stageDrag = function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);

		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var idx = renderer.getPointIndex (e._offset.offsetX, model);
		var yValue = e._offset.offsetY-panel._offset;

		if(o.sticky){
			var candles = this.getCurrentCandles(idx, model, seriesManager);
			var v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
		}
		else
			var v = renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);

		var i = interactor.currentAnchor.selected - 1;
		o.anchors[i].value = LIB.round(v,renderer.getPrecision(model,panel));
		o.anchors[i]._index = idx;
		o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("MULTILINE stage out");
		// this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};
}

function MultiLineObject(){
	this.render = function (o, ctx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);

		for (var i = 1; i < pts.length; i++) {
			ctx.lineTo(pts[i].x, pts[i].y);
		}
		ctx.stroke();

		if (o.selected) {
			drawAnchors(ctx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}


	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(pts.length >=2)
			for(var i = 1; i< pts.length;i++){

				if(between(pts[i-1].x, x, pts[i].x, self.hitTolerance)){
					var nlp1 = getLinePointNearestMouse({x0:pts[i-1].x, y0:pts[i-1].y, x1:pts[i].x, y1:pts[i].y}, x, y);
					var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
					if(distance<self.hitTolerance){
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if(p){
							o._hitAnchor = {x:p.x, y:p.y};
						}
						break;
					}
				}
			}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	/*
	 * STAGE
	 */

	// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	o.hidden=true;
	// 	console.log("MULTILINE stage down start", interactor.currentAnchor);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);

	// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 	if(interactor.currentAnchor==null){
	// 		for(var i in o.anchors){
	// 			o.anchors[i].value = v;
	// 			o.anchors[i]._index = idx;
	// 		}
	// 		//panel.objects.push(o);
	// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// 		console.log("MULTILINE stage down start", ca);
	// 		return ca;
	// 	}
	// 	interactor.pushPanel(this, o, panel);
	// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	// };

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("MULTILINE long drag ");
	// 		interactor.currentAnchor.drag = true;
	// 		var i = interactor.currentAnchor.selected;
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("MULTILINE after drag",i, o.anchors[i]);
	// 		}
	// 	}
	// };

	this.stageDrag = function (e, o, renderer, interactor, model, panel, seriesManager) {
		this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);

		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var idx = renderer.getPointIndex (e._offset.offsetX, model);
		var yValue = e._offset.offsetY-panel._offset;

		if(o.sticky){
			var candles = this.getCurrentCandles(idx, model, seriesManager);
			var v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
		}
		else
			var v = renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);

		var i = interactor.currentAnchor.selected - 1;
		o.anchors[i].value = LIB.round(v,renderer.getPrecision(model,panel));
		o.anchors[i]._index = idx;
		o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" MULTILINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			if(e.button == 0){
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
				var idx = renderer.getPointIndex (e._offset.offsetX, model);
				o.anchors.push( {stamp: 0, offset: 0, value: v, _index: idx} );
				return false;
			}else{
				o.hidden=false;
				interactor.currentAnchor = null;
				return true;
			}
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {

	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("MULTILINE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("MULTILINE stage move",i, o.anchors);
	// 		}
	// 	}
	// };

}

function AbcdObject(){
	this.getPoints = function(o, renderer, panel, model, seriesManager){
		var pts = AbcdObject.prototype.getPoints.call(this,o, renderer, panel, model,seriesManager);
		
		var xLength = pts[0].x - pts[1].x;
		var yLength = pts[0].y - pts[1].y;
		var x = (pts[2].x - xLength * o.values[o.values.length-1]/100);
		var y = (pts[2].y - yLength * o.values[o.values.length-1]/100);
		var index = renderer.getPointIndex(x, model);
		pts.push({
			x: x,
			y: y,
			prawilnyStamp: renderer.getIndexStamp(index, model, seriesManager),
			expandable:true,
			expanded:pts[2].expanded
		});

		pts[2].expandable = false;
		pts[2].expanded = false;
		return pts;
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color;
		ctx.fillStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);
		for(var i=1; i<pts.length;i++){
			ctx.lineTo(pts[i].x, pts[i].y);
		}
		ctx.stroke();

		this.drawLevelPoints(pts, o, ctx, renderer, model, panel, seriesManager);
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.drawLevelPoints = function(pts, o, ctx, renderer, model, panel, seriesManager){
		var xLength = pts[0].x - pts[1].x;
		var yLength = pts[0].y - pts[1].y;

		var p = 2
		if(model.instrumentsSeries[0] && model.instrumentsSeries[0].instrument && model.instrumentsSeries[0].instrument.precision){
			p = model.instrumentsSeries[0].instrument.precision;
		}

		var expanded = o.anchors[2].expanded;

		for (var i = 0; i < o.values.length; i++) {

			var level = o.values[i];
			var enabled = o.valuesState[i];
			if(enabled == true){
			var levelX = (pts[2].x - xLength * level/100);
			var levelY = (pts[2].y - yLength * level/100);

			var fV = LIB.getReferenceValue(o, model, seriesManager);
			var y = renderer.getPointValue(levelY, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)+panel._offset;
			var text = level + "% (" + y.toFixed(p)+ ")";

			if (i == o.values.length - 1){
				ctx.moveTo(pts[2].x, pts[2].y);
				ctx.lineTo(levelX, levelY);
			}

			ctx.beginPath()
			ctx.moveTo(levelX - 5, levelY);
			if(!expanded)
				ctx.lineTo(levelX + 5, levelY);
			else{
				ctx.setLineDash([3,3]);
				ctx.lineTo(model._width, levelY);
			}
			ctx.stroke();
			ctx.setLineDash([]);

			var textHeight = 12;
			var textWidth = 100;

			ctx.fillText(text, levelX + 7, levelY -2);
			}
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(pts.length >=2)
			for(var i = 1; i< pts.length;i++){

				if(between(pts[i-1].x, x, pts[i].x, self.hitTolerance+self.anchorPointDistanceToArrow) &&
						between(pts[i-1].y, y, pts[i].y, self.hitTolerance+self.anchorPointDistanceToArrow)){

					var nlp1 = getLinePointNearestMouse({x0:pts[i-1].x, y0:pts[i-1].y, x1:pts[i].x, y1:pts[i].y}, x, y);
					var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})

					if(distance<self.hitTolerance && between(pts[i-1].x, x, pts[i].x, self.hitTolerance) && between(pts[i-1].y, y, pts[i].y, self.hitTolerance)){
							hitResult = true;
							o._hit = true;
							var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
							if(p){
								o._hitAnchor = {x:p.x, y:p.y};
							}
							break;
					}else{
						var p = findAnchorPointArrowForXY(pts, x,y,self.anchorPointDistanceToArrow,self.hitTolerance);
						if(p && o.selected){
							hitResult = true;
							o._hit=true;
							o._hitArrow = {x:p.x, y:p.y};
						}
					}
				}
			}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		this.wasDrag = false;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		if(interactor.currentAnchor.selected === 3 ) interactor.currentAnchor.selected = null;
		// SUPER COULD BE CALLED HERE
		Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		if(!this.wasDrag){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[3].x, pts[3].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
				console.log("Clicked arrow :",pts[3]);
				this.expandAnchor(o.anchors[2]);
			}
		}
		interactor.popPanel(this, o, panel);

	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			console.log("ABCD long drag ");
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].value = v;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(idx, model, seriesManager);
				console.log("ABCD after drag",i, o.anchors[i]);

				for(var ii=i+1; ii< o.anchors.length; ii++){
					o.anchors[ii].value = v;
					o.anchors[ii]._index = idx;
					o.anchors[i].prawilnyStamp = renderer.getIndexStamp(idx, model, seriesManager);
				}

			}
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" ABCD stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			o.hidden=false;
			interactor.currentAnchor = null;
			return true;
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("ABCD stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ABCD stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("ABCD stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}

function DiNapoliAbcObject(){
	this.subscriptionPack = 'diNapoliTools';
	
	this.getPoints = function(o, renderer, panel, model, seriesManager){
		var pts = DiNapoliAbcObject.prototype.getPoints.call(this,o, renderer, panel, model,seriesManager);
		
		// var xLength = pts[0].x - pts[1].x;
		// var yLength = pts[0].y - pts[1].y;
		// var x = (pts[2].x - xLength * o.values[o.values.length-1]/100);
		// var y = (pts[2].y - yLength * o.values[o.values.length-1]/100);
		// var index = renderer.getPointIndex(x, model);
		// pts.push({
		// 	x: x,
		// 	y: y,
		// 	prawilnyStamp: renderer.getIndexStamp(index, model, seriesManager),
		// 	expandable:true,
		// 	expanded:pts[2].expanded
		// });

		// pts[2].expandable = false;
		// pts[2].expanded = false;
		return pts;
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");
		ctx.fillStyle = WEBRCP.utils.colorManager.getColor("primaryTextColor");

		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.beginPath();

		for(var i=0; i<pts.length;i++){
			var fV = LIB.getReferenceValue(o, model, seriesManager);
			this.drawPoint(ctx, pts, i, pts[i].value.toFixed(this.getPrecision(model)));
		}
		ctx.stroke();

		this.drawLevelPoints(pts, o, ctx, renderer, model, panel, seriesManager);
	}

	this.drawPoint = function (ctx, pts, i, price) {
		const circleRadius = 6;
		const text = this.getIndexName(i) + price;
		ctx.moveTo(pts[i].x + circleRadius, pts[i].y);
		ctx.arc(pts[i].x, pts[i].y, circleRadius, 0, 2 * Math.PI);
		ctx.lineTo(pts[i].x + 100, pts[i].y);
		ctx.moveTo(pts[i].x + circleRadius, pts[i].y + 12);

		ctx.fillText(text, pts[i].x + circleRadius + 4, pts[i].y - 4);
	}

	this.getIndexName = function (index) {
		if (index === 0) return "A ";
		else if (index === 1) return "B ";
		else if (index === 2) return "C ";
		else return "";
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchorsArrow(octx, panel, pts, this.anchorPointArrowSize, this.anchorPointDistanceToArrow, this.anchorColor, 1);
		}
	}

	this.getPrecision = function (model) {
		let p = 2
		if(model.instrumentsSeries[0] && model.instrumentsSeries[0].instrument && model.instrumentsSeries[0].instrument.precision){
			p = model.instrumentsSeries[0].instrument.precision;
		}

		return p;
	}

	this.drawLevelPoints = function(pts, o, ctx, renderer, model, panel, seriesManager){
		var yLength = pts[0].y - pts[1].y;
		var valueDistance = pts[0].value - pts[1].value;

		const p = this.getPrecision(model);

		var expanded = o.anchors[2].expanded;

		for (var i = 0; i < o.values.length; i++) {

			var level = o.values[i];
			var enabled = o.valuesState[i];
			if(enabled == true){
				var levelX = (pts[2].x);
				var levelY = (pts[2].y - yLength * level/100);

				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var y = renderer.getPointValue(levelY, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)+panel._offset;
				
				var valueText = (pts[2].value - valueDistance * level/100).toFixed(p);
				var levelText = (level / 100).toFixed(3);

				if (i == o.values.length - 1){
					ctx.moveTo(pts[2].x, pts[2].y);
					ctx.lineTo(levelX, levelY);
				}

				
				ctx.beginPath()
				ctx.fillStyle = this.getValueColor(level);
				ctx.strokeStyle = this.getValueColor(level);
				ctx.moveTo(levelX + 30, levelY);
				if(!expanded)
					ctx.lineTo(levelX + 130, levelY);
				else{
					ctx.fillStyle = this.getValueColor(level);
					ctx.setLineDash([3,3]);
					ctx.lineTo(model._width, levelY);
				}
				ctx.stroke();

				var textHeight = 12;
				var textWidth = 100;

				ctx.fillText(this.getValueName(level), levelX, levelY + 3);

				ctx.fillText(valueText, levelX + 30, levelY - 4);
				ctx.fillText(levelText, levelX + 30, levelY + 12);
			}
			
			ctx.setLineDash(o.dash ? o.dash : []);
		}
	}

	this.getValueColor = function (value) {
		if (value === 61.8) return WEBRCP.utils.colorManager.getColor("accent");
		else if (value === 100) return WEBRCP.utils.colorManager.getColor("buyColor");
		else if(value === 161.8) return WEBRCP.utils.colorManager.getColor("sellColor");
		else return WEBRCP.utils.colorManager.getColor("primaryTextColor");
	}

	this.getValueName = function (value) {
		if (value === 61.8) return "COP";
		else if (value === 100) return "OP";
		else if(value === 161.8) return "XOP";
		else return "";
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if (pts.length >= 2) {
			for (var i = 0; i < pts.length; i++) {

				if (between(pts[i].x, x, pts[i].x + 100, self.hitTolerance + self.anchorPointDistanceToArrow) &&
					between(pts[i].y, y, pts[i].y, self.hitTolerance + self.anchorPointDistanceToArrow)) {

					var nlp1 = getLinePointNearestMouse({ x0: pts[i].x, y0: pts[i].y, x1: pts[i].x + 100, y1: pts[i].y }, x, y);
					var distance = pointsDistance({ x: x, y: y }, { x: nlp1.x, y: nlp1.y })

					if (distance < self.hitTolerance && between(pts[i].x, x, pts[i].x + 100, self.hitTolerance) && between(pts[i].y, y, pts[i].y, self.hitTolerance)) {
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if (p) {
							o._hitAnchor = { x: p.x, y: p.y };
						}
						break;
					} else {
						var p = findAnchorPointArrowForXY(pts, x, y, self.anchorPointDistanceToArrow, self.hitTolerance);
						if (p && o.selected) {
							hitResult = true;
							o._hit = true;
							o._hitArrow = { x: p.x, y: p.y };
						}
					}
				}
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		this.wasDrag = false;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		if(interactor.currentAnchor.selected === 3 ) interactor.currentAnchor.selected = null;
		// SUPER COULD BE CALLED HERE
		Shape.prototype.mouseDrag.call(this, e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		if(!this.wasDrag){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[2].x, pts[2].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
				console.log("Clicked arrow :",pts[3]);
				this.expandAnchor(o.anchors[2]);
			}
		}
		interactor.popPanel(this, o, panel);

	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			console.log("ABCD long drag ");
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].value = v;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(idx, model, seriesManager);
				console.log("ABCD after drag",i, o.anchors[i]);

				for(var ii=i+1; ii< o.anchors.length; ii++){
					o.anchors[ii].value = v;
					o.anchors[ii]._index = idx;
					o.anchors[i].prawilnyStamp = renderer.getIndexStamp(idx, model, seriesManager);
				}

			}
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" ABCD stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			o.hidden=false;
			interactor.currentAnchor = null;
			return true;
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("ABCD stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ABCD stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("ABCD stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}

function EllipseObject(){

	this.render = function (o, ctx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		var r1 = (pts[1].x - pts[0].x) / 2;
		var r2 = (pts[1].y - pts[0].y) / 2;
		var ellipseX = pts[0].x + r1;
		var ellipseY = pts[0].y + r2;

		ctx.beginPath();
		ctx.ellipse(ellipseX, ellipseY, Math.abs(r1), Math.abs(r2), 1 * Math.PI/180, 0, 2 * Math.PI);

		if (o.fillBg==true) {
			ctx.fillStyle = o.color;
			ctx.globalAlpha = 0.2;
			ctx.fill();
		}

		ctx.globalAlpha = 1;
		ctx.stroke();
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawDiagonal(o, octx, pts);
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}


		function drawDiagonal(o, ctx, pts){
			ctx.strokeStyle = o.color;
			ctx.beginPath();
			ctx.moveTo(pts[0].x, pts[0].y);
			ctx.setLineDash([2,5]);
			ctx.lineTo(pts[1].x, pts[1].y);
			ctx.stroke();
			ctx.setLineDash([1]);
			ctx.closePath();
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		if(between(pts[0].x, x, pts[1].x, self.hitTolerance) && between(pts[0].y, y, pts[1].y, self.hitTolerance)){

			var nlp1 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[1].y}, x, y);
			var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
			if(distance<self.hitTolerance){
				hitResult = true;
				o._hit = true;
				var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
				if(p){
					o._hitAnchor = {x:p.x, y:p.y};
				}
			}

			var r1 = (pts[1].x - pts[0].x)/2;
			var r2 = (pts[1].y - pts[0].y)/2;
			var ellipseX = pts[0].x+ r1;
			var ellipseY = pts[0].y+r2;
			var xx = x-ellipseX;
			var ey1 = ellipseY+ Math.abs(r2) * Math.sqrt(1 - xx*xx / (r1*r1));
			var ey2 = ellipseY- Math.abs(r2) * Math.sqrt(1 - xx*xx / (r1*r1));

			if(Math.abs(ey1 -y) <=self.hitTolerance){
				hitResult = true;
				o._hit = true;
			}

			if(Math.abs(ey2-y) <=self.hitTolerance){
				o._hit = true;
				hitResult = true;
			}
			console.log("Ellipse: ", x, y, ey1, ey2);
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		const pts = this.getPoints(o, renderer, panel, model, seriesManager);

		interactor.pushPanel(this, o, panel);

		for (var i = 0; i < pts.length; i++) {
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, this.hitTolerance)) {
				console.log("Clicked point :", i, pts[i]);
				return {
					selected: i, 
					anchors: JSON.parse(JSON.stringify(o.anchors))
				};
			}
		}

		return {
			selected: null, 
			anchors: JSON.parse(JSON.stringify(o.anchors))
		};
	}

	/*
	 * STAGE
	 */

	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("ELLIPSE long drag ");
	// 		interactor.currentAnchor.drag = true;
	// 		var i = interactor.currentAnchor.selected;
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("ELLIPSE after drag",i, o.anchors[i]);
	// 		}
	// 	}
	// };
	// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
	// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
	// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
	// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
	// 		console.log("ELLIPSE long drag ");
	// 		interactor.currentAnchor.drag = true;
	// 		var i = interactor.currentAnchor.selected;
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("ELLIPSE after drag",i, o.anchors[i]);
	// 		}
	// 	}
	// };

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" ELLIPSE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);

		if (interactor.currentAnchor && interactor.currentAnchor.drag) {
			interactor.currentAnchor.selected++;
		}

		const isDrawingDone = (
			interactor.currentAnchor !== null && 
			interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length
		);

		if (isDrawingDone){
			interactor.currentAnchor = null;
			return true;
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("ELLIPSE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("ELLIPSE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("TRENDLINE stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}

function HorizontalRangeObject(){

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		var x1 = pts[0].x;
		var x2 = pts[1].x
		var xMid = (x1+x2)/2;
		var y = pts[0].y;
		var off = -6;
		var off2 = 0;

		ctx.strokeStyle = o.color;
		ctx.fillStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		if(!o.flipped){
			ctx.beginPath();
			ctx.bezierCurveTo(x1+1,y+4+off,x1+4,y+off, x1+7, y+off);
			ctx.lineTo(xMid-7,y+off);
			ctx.bezierCurveTo(xMid-7+3,y+off, xMid-7+6,y-2+off,xMid-7+7,y-6+off);
			ctx.bezierCurveTo(xMid+1,y+off-2, xMid+4,y+off,xMid+7,y+off);
			ctx.lineTo(x2-7,y+off);
			ctx.bezierCurveTo(x2-7+3,y+off, x2-7+6, y+2+off, x2, y+6+off);
			ctx.stroke();
			ctx.closePath();
			if(o.text)
				ctx.fillText(o.text, xMid-ctx.measureText(o.text).width/2, y-20);
		}else{
			ctx.beginPath();
			ctx.bezierCurveTo(x1+1,y+4+off2,x1+4,y+6+off2, x1+7, y+6+off2);
			ctx.lineTo(xMid-7,y+6+off2);
			ctx.bezierCurveTo(xMid-7+3,y+6+off2, xMid-7+6,y+8+off2,xMid-7+7,y+12+off2);
			ctx.bezierCurveTo(xMid+1,y+8+off2, xMid+4,y+6+off2,xMid+7,y+6+off2);
			ctx.lineTo(x2-7,y+6+off2);
			ctx.bezierCurveTo(x2-7+3,y+6+off2, x2-7+6, y+4+off2, x2, y+off2);

			ctx.stroke();
			ctx.closePath();
			if(o.text)
				ctx.fillText(o.text, xMid-ctx.measureText(o.text).width/2, y+26+off2);

		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var x1 = pts[0].x;
		var x2 = pts[1].x;
		var y = pts[0].y;
		var off = -6;
		var off2 = 0;

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
			octx.setLineDash([2,5]);
			octx.strokeStyle = o.color;
			if(!o.flipped){
				octx.beginPath();
				octx.moveTo(x1,y);
				octx.lineTo(x1, panel._height+panel._offset);
				octx.moveTo(x2,y);
				octx.lineTo(x2, panel._height+panel._offset);
				octx.stroke();
				octx.closePath();
			}else{
				octx.beginPath();
				octx.moveTo(x1,y);
				octx.lineTo(x1, 0);
				octx.moveTo(x2,y);
				octx.lineTo(x2, 0);
				octx.stroke();
				octx.closePath();
			}
			octx.setLineDash([1]);
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;
		this.clearHits(o);

		var off = -6;
		if(o.flipped) off =0;

		if(between(pts[0].x, x, pts[1].x, self.hitTolerance) && between(pts[0].y-1+off, y, pts[1].y+1+off, self.hitTolerance)){
			hitResult = true;
			o._hit = true;
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}
	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));

		if(idx!=null){
			let index = renderer.getStampIndex(baseAnchors[idx].prawilnyStamp, model, seriesManager);
			o.anchors[idx]._index = index+xOffset;
			o.anchors[idx].prawilnyStamp = renderer.getIndexStamp(o.anchors[idx]._index, model, seriesManager);
		}else{
			for(var i=0; i< o.anchors.length ;i++){
				let index = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
				o.anchors[i]._index = index+xOffset;
				o.anchors[i].value = baseAnchors[i].value+yOffset;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			console.log("HRANGE long drag ");
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				o.anchors[i]._index = idx;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
				console.log("HRANGE after drag",i, o.anchors[i]);
			}
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" HRANGE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("HRANGE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("HRANGE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			console.log("HRANGE stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}

function VerticalRangeObject(){
	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		ctx.strokeStyle = o.color;
		ctx.fillStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		var x = pts[0].x;
		var y1 = pts[0].y;
		var y2 = pts[1].y;
		if(y2<y1){
			var tmp = y1;
			y1 = y2;
			y2=tmp;
		}
		var yMid = (pts[0].y+pts[1].y)/2;

		if(!o.flipped){
			ctx.beginPath();
			ctx.bezierCurveTo(x - 4, y1 + 1, x - 6, y1 + 4, x - 6, y1 + 7);
			ctx.lineTo(x - 6, yMid - 7);
			ctx.bezierCurveTo(x - 6, yMid - 7 + 3, x - 8, yMid - 7 + 6, x - 12, yMid - 7 + 7);
			ctx.bezierCurveTo(x - 8, yMid + 7 - 6, x - 6, yMid + 7 - 3, x - 6, yMid + 7);
			ctx.lineTo(x - 6, y2 - 7);
			ctx.bezierCurveTo(x - 6, y2 - 4, x - 4, y2 - 1, x, y2);
			ctx.stroke();

			if(o.text)
				ctx.fillText(o.text, x-20 -ctx.measureText(o.text).width, yMid);

		}else{
			ctx.beginPath();
			ctx.bezierCurveTo(x + 4, y1 + 1, x + 6, y1 + 4, x + 6, y1 + 7);
			ctx.lineTo(x + 6, yMid - 7);
			ctx.bezierCurveTo(x + 6, yMid - 7 + 3, x + 8, yMid - 7 + 6, x + 12, yMid - 7 + 7);
			ctx.bezierCurveTo(x + 8, yMid + 7 - 6, x + 6, yMid + 7 - 3, x + 6, yMid + 7);
			ctx.lineTo(x + 6, y2 - 7);
			ctx.bezierCurveTo(x + 6, y2 - 4, x + 4, y2 - 1, x, y2);
			ctx.stroke();

			if(o.text)
				ctx.fillText(o.text, x+20, yMid);

		}
	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var x = pts[0].x;
		var y1 = pts[0].y;
		var y2 = pts[1].y;

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			octx.setLineDash([2,5]);
			octx.strokeStyle = o.color;
			if(!o.flipped){
				octx.beginPath();
				octx.moveTo(x,y1);
				octx.lineTo(panel._width , y1);
				octx.moveTo(x,y2);
				octx.lineTo(panel._width, y2);
				octx.stroke();
				octx.setLineDash([1,1]);
				octx.closePath();
			}else{
				octx.beginPath();
				octx.moveTo(0,y1);
				octx.lineTo(x, y1);
				octx.moveTo(0,y2);
				octx.lineTo(x, y2);
				octx.stroke();
				octx.setLineDash([1,1]);
				octx.closePath();
			}
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}

	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);

		var off = o.flipped ? 6 : -6;

		if(between(pts[0].x-1+off, x, pts[1].x+1+off, self.hitTolerance) && between(pts[0].y, y, pts[1].y, self.hitTolerance)){
			hitResult = true;
			o._hit = true;
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}
		return hitResult;
	}

	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));

		if(idx!=null){
			if(idx===0){
				//o.anchors[0]._index = baseAnchors[0]._index+xOffset;
				o.anchors[0].value = baseAnchors[0].value+yOffset;
			}else if(idx===1){
				//o.anchors[1]._index = baseAnchors[1]._index+xOffset;
				o.anchors[1].value = baseAnchors[1].value+yOffset;
			}
		}else{
			for(var i=0; i< o.anchors.length ;i++){
				let index = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
				o.anchors[i]._index = index+xOffset;
				o.anchors[i].value = baseAnchors[i].value+yOffset;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
			}
		}
	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
		var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
		if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			console.log("TRENDLINE long drag ");
			interactor.currentAnchor.drag = true;
			var i = interactor.currentAnchor.selected;
			var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
			var idx = renderer.getPointIndex (e._offset.offsetX, model);
			if(i!=null && i < o.anchors.length){
				//o.anchors[i]._index = idx;
				o.anchors[i].value = v;
				console.log("TRENDLINE after drag",i, o.anchors[i]);
			}
		}
	};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" TRENDLINE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("TRENDLINE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};
	
	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	console.log("TRENDLINE stage move", interactor.currentAnchor);
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			//o.anchors[i]._index = idx;
	// 			o.anchors[i].value = v;
	// 			console.log("TRENDLINE stage move",i, o.anchors);
	// 		}
	// 	}
	// };
}

function CycleObject(){

	function getCycleValues(x1, x2, panel){
		var values = [];
		var delta = Math.abs(x1-x2);
		if(delta < 1){
			values.push(x1);
			return values;
		}
		for(var x=x1; x >0; x = x-delta){
			values.push(x);
		}
		for(var x=x2; x < panel._width; x = x+delta){
			values.push(x);
		}
		values.sort(function(a,b){return a-b;});
		return values;
	}

	this.getPoints		=	function (o, renderer, panel, model, seriesManager) {
		var pts = CycleObject.prototype.getPoints.call(this , o, renderer, panel, model, seriesManager);
		var x1 = pts[0].x;
		var x2 = pts[1].x
		var vals = getCycleValues(x1,x2,panel);
		var pts2 = [];
		for(var i in vals){
			pts2.push({x:vals[i], y:this.anchorPointSize+1});
			pts2.push({x:vals[i], y: panel._height+panel._offset-this.anchorPointSize-1});
		}
		return pts2;
	}

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		var x1 = pts[0].x;
		var x2 = pts[1].x
		var y1 = pts[0].y;
		var y2 = pts[1].y

		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);

		ctx.beginPath();
		ctx.moveTo(x1,0);
		ctx.lineTo(x1, panel._height+panel._offset);
		ctx.moveTo(x2,0);
		ctx.lineTo(x2, panel._height+panel._offset);
		ctx.stroke();

		for(var i=0; i< pts.length; i++){
			ctx.beginPath();
			ctx.moveTo(pts[i].x, 0);
			ctx.lineTo(pts[i].x, panel._height+panel._offset-this.anchorPointSize);
			ctx.stroke();
		}
	}
	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var self = this;
		var hitResult = false;
		this.clearHits(o);

		for(var i=0; i< pts.length; i++){
			if(between(pts[i].x-1, x, pts[i].x+1, self.hitTolerance)){
				hitResult = true;
				o._hit = true;
				var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
				if(p){
					o._hitAnchor = {x:p.x, y:p.y};
				}
				break;
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;

		var baseMouseIndex = renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var currentMouseIndex = renderer.getPointIndex(e._offset.offsetX, model);

		var xOffset = currentMouseIndex - baseMouseIndex;

		let index1 = renderer.getStampIndex(baseAnchors[1].prawilnyStamp, model, seriesManager);
		let index0 = renderer.getStampIndex(baseAnchors[0].prawilnyStamp, model, seriesManager);
		var oldPeriods = Math.abs(index1 - index0);

		if(idx!=null){
			if(xOffset < 0){
				o.anchors[0]._index = baseMouseIndex - oldPeriods;
				o.anchors[1]._index = baseMouseIndex +xOffset;
				o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
				o.anchors[1].prawilnyStamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
			}else if(xOffset > 0){
				o.anchors[0]._index = baseMouseIndex +xOffset;
				o.anchors[1]._index = baseMouseIndex - oldPeriods;
				o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
				o.anchors[1].prawilnyStamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
			}
		}else{
			for(var i=0; i< o.anchors.length ;i++){
				let index = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
				o.anchors[i]._index = index+xOffset;
				o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);			}
		}
	};


	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		//console.log(" HRANGE stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);

		if (interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		const isDrawingDone = (
			interactor.currentAnchor !== null && 
			interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length
		);

		if (isDrawingDone) {
			interactor.currentAnchor = null;
			return true;
		}
	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("HRANGE stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

}

function TextObject(){
	this.cfg = {

		offsetX: 0,
		offsetY: 0,

		widthMin: 100,
		widthMax: 240,

		heightMin: 24,

		margin: 10,

		lineSpacing: 5,
		lineHeight: 14,
		lineMultiplier: 1.3,
		fontSize: 12
	}

	this.getPoints =	function (o, renderer, panel, model, seriesManager) {
		if (!o.anchors[1].dragged) {
			var fV = LIB.getReferenceValue(o, model, seriesManager);		
			var p0 = renderer.getValuePoint(o.anchors[0].value, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
			var p1 = p0+o._height;
			var v = parseFloat(renderer.getPointValue(p1, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV));
			o.anchors[1].value = v;
		}
		var pts = TextObject.prototype.getPoints.call(this , o, renderer, panel, model, seriesManager);
		return pts;
	}

	this.render	=	function(o, ctx, renderer, model, panel, seriesManager) {
		o._width = this.cfg.widthMin;
		o._height = this.cfg.heightMin;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		
		var x = pts[0].x;
		var y = pts[0].y;

		this.font = (o.fontSize || this.cfg.fontSize) + 'px Roboto';
		this.lineHeight = o.fontSize ? o.fontSize * this.cfg.lineMultiplier : this.cfg.lineHeight;

		ctx.fillStyle = o.color;
		ctx.font = this.font;

		var w = ctx.measureText(o.text).width;
		var wrapped = wrap(o.text, this.cfg.widthMax-2*this.cfg.margin, ctx);
		o._width = wrapped.width + 2 * this.cfg.margin;
		o._height = wrapped.text.length * this.lineHeight + this.cfg.margin * 1.5;

		if(o.fillBg){
			ctx.beginPath();
			if(o.anchors[1].dragged){
				ctx.moveTo(x-this.cfg.offsetX, y-this.cfg.offsetY);

				if(pts[1].y < pts[0].y){
					ctx.lineTo(x-this.cfg.offsetX+o._width/2-10, y-this.cfg.offsetY);
					ctx.lineTo(pts[1].x, pts[1].y);
					ctx.lineTo(x-this.cfg.offsetX+o._width/2+10, y-this.cfg.offsetY);
					ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY);
					ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY+o._height);
					ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY+o._height);

				}else if(pts[1].y > pts[0].y+o._height){

					ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY);
					ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY+o._height);
					ctx.lineTo(x-this.cfg.offsetX+o._width/2+10, y-this.cfg.offsetY+o._height);
					ctx.lineTo(pts[1].x, pts[1].y);
					ctx.lineTo(x-this.cfg.offsetX+o._width/2-10, y-this.cfg.offsetY+o._height);
					ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY+o._height);

				}else{
					if(pts[1].x > pts[0].x+o._width){
						ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY);
						ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY+o._height/2-10);
						ctx.lineTo(pts[1].x, pts[1].y);
						ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY+o._height/2+10);
						ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY+o._height);
						ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY+o._height);


					}else if(pts[1].x < pts[0].x){
						ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY);
						ctx.lineTo(x-this.cfg.offsetX+o._width, y-this.cfg.offsetY+o._height);
						ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY+o._height);
						ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY+o._height/2+10);
						ctx.lineTo(pts[1].x, pts[1].y);
						ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY+o._height/2-10);
					}else{
						ctx.rect(x-this.cfg.offsetX, y-this.cfg.offsetY, o._width,o._height);
					}

				}
				ctx.lineTo(x-this.cfg.offsetX, y-this.cfg.offsetY);
			}else{
				ctx.rect(x-this.cfg.offsetX, y-this.cfg.offsetY, o._width,o._height);
			}
			ctx.fill();
		}

		ctx.fillStyle = o.fillBg ? WEBRCP.utils.getContrastColor(o.color, WEBRCP.utils.colorManager.getColor("darkTextColor"), '#ffffff') : o.color;

		for (var i in wrapped.text) {
			ctx.fillText(
				wrapped.text[i], 
				x + this.cfg.offsetX + this.cfg.margin, 
				y + this.cfg.offsetY + this.cfg.margin + ((i * 1 + 1) * (this.lineHeight) - (o.fontSize || this.cfg.fontSize) / 2)
			);
		}
		ctx.closePath();

		function wrap(text, maxWidth, ctx) {
			var wrapped = [];
			var width = 0;

			var words = text.split("\n").join(" \n").split(' ');
	        var line = '';

	        for(var n = 0; n < words.length; n++) {
	        	if(words[n].startsWith("\n") || words[n].startsWith("\r")){
	        		words[n] = words[n].replace('\n', '').replace('\r', '');
	        		wrapped.push(line);
	        		var lw = ctx.measureText(line).width;
	        		width = lw > width ? lw : width;
	        		line = "";
	        		var newParagraph = true;
	        	}
	        	var testLine = line + words[n] + ' ';
	        	var testWidth = ctx.measureText(testLine).width;

	        	if ((testWidth > maxWidth && n > 0)) {
	        		wrapped.push(line);
	        		var lw = ctx.measureText(line).width;
	        		width = lw > width ? lw : width;
	        		line = words[n].replace("\n","").replace("\r","") + ' ';
	        	}else {
	        		width = testWidth > width ? testWidth : width;
	        		line = testLine;
	        	}
	        }
	        if(line.length > 0) wrapped.push(line);
	        var lw = ctx.measureText(line).width;
    		width = lw > width ? lw : width;
	        return {text: wrapped, width: width};
		}

		function newSize(w, min, max){
			if(w < min) return min;
			if(w < max) return w;
			return max;
		}

		this.postRender(o, ctx, renderer, model, panel, seriesManager);
	}

	this.renderOverlay = function (o, ctx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					if((i == 1 && o.fillBg) || i==0)
						drawAnchor(ctx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if (o._hit) {
			drawAnchor(ctx, panel, pts[0], this.anchorPointSize, this.anchorColor, 1 );
			if(o.fillBg)
				drawAnchor(ctx, panel, pts[1], this.anchorPointSize, this.anchorColor, 1 );
		}

		if (o.selected) {
			drawAnchor(ctx, panel, pts[0], this.anchorPointSize, this.anchorColor, 1 );
			if(o.fillBg)
				drawAnchor(ctx, panel, pts[1], this.anchorPointSize, this.anchorColor, 1 );
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;
		var w = interactor.ctx.measureText(o.text).width;

		if(between(pts[0].x, x, pts[0].x+o._width, self.hitTolerance) && between(pts[0].y, y, pts[0].y+o._height, self.hitTolerance)){
			hitResult = true;
			o._hit = {x:x, y:y};
			var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
			if(p){
				o._hitAnchor = {x:p.x, y:p.y};
			}
		}

		if(between(pts[1].x-1, x, pts[1].x+1, self.hitTolerance) && between(pts[1].y-1, y, pts[1].y+1, self.hitTolerance)){
			hitResult = true;
			o._hit = {x:x, y:y};
			o._hitAnchor = {x:pts[1].x, y:pts[1].y};
		}
		return hitResult;
	}

	this.lastClickStamp = 0;
	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {

		if($.now() < this.lastClickStamp + 600){
			this.lastClickStamp = 0;
			interactor.chart.requestObjectText(o, 'text', o.text);
		}
		else
			this.lastClickStamp = $.now();

		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		interactor.pushPanel(this, o, panel);
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("Clicked point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var idx = interactor.currentAnchor.selected;
		var baseAnchors = interactor.currentAnchor.anchors;
		var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));

		if(idx==0){
			var index0 = renderer.getStampIndex(baseAnchors[0].prawilnyStamp, model, seriesManager);
			o.anchors[0]._index = index0+xOffset;
			o.anchors[0].value = baseAnchors[0].value+yOffset;
			o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
			if(!o.anchors[1].dragged){
				var index1 = renderer.getStampIndex(baseAnchors[1].prawilnyStamp, model, seriesManager);
				o.anchors[1]._index = index1+xOffset;
				o.anchors[1].value = baseAnchors[1].value+yOffset;
				o.anchors[1].prawilnyStamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
			}
		}else if(idx==1){
			var index11 = renderer.getStampIndex(baseAnchors[1].prawilnyStamp, model, seriesManager);
			o.anchors[1]._index = index11+xOffset;
			o.anchors[1].value = baseAnchors[1].value+yOffset;
			o.anchors[1].dragged = true;
			o.anchors[1].prawilnyStamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
		}else{
			for(var i=0; i< o.anchors.length ;i++){
				if(!o.anchors[i].dragged){
					var ix = renderer.getStampIndex(baseAnchors[i].prawilnyStamp, model, seriesManager);
					o.anchors[i]._index = ix+xOffset;
					o.anchors[i].value = baseAnchors[i].value+yOffset;
					o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
				}
			}
		}
	};

	/*
	 * STAGE
	 */

	this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("TEXT ANNOTATION stage down start", interactor.currentAnchor);
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);

		var idx = renderer.getPointIndex (e._offset.offsetX, model);
		if(interactor.currentAnchor==null){
			o.anchors[0].value = v;
			o.anchors[0]._index = idx;
			o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
			o.anchors[1].value = v;
			o.anchors[1]._index = idx;
			o.anchors[1].prawilnyStamp = renderer.getIndexStamp(o.anchors[1]._index, model, seriesManager);
			//panel.objects.push(o);
			var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
			console.log("TEXT ANNOTATION stage down start", ca);
			return ca;
		}
		interactor.pushPanel(this, o, panel);
		return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
	};

	this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {};

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log(" TEXT ANNOTATION stage up","selected:", interactor.currentAnchor.selected, interactor.currentAnchor);
		interactor.popPanel(this, o, panel);

		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= 1){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("TEXT ANNOTATION stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	// this.stageMove			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	if(interactor.currentAnchor!==null){
	// 		var i = interactor.currentAnchor.selected;
	// 		var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
	// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
	// 		if(i!=null && i < o.anchors.length){
	// 			o.anchors[i]._index = idx;
	// 			console.log("TEXT ANNOTATION stage move",i, o.anchors);
	// 		}
	// 		//interactor.renderOverlayedObject (this, o, panel);
	// 	}
	// };
}

function BoxObject(){

	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {

		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		ctx.beginPath();
		ctx.strokeStyle = o.color;
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		if(o.fillBg==true){
			ctx.fillStyle = o.color;
			ctx.globalAlpha = 0.2;
			ctx.fillRect(pts[0].x, pts[0].y, pts[1].x-pts[0].x, pts[1].y-pts[0].y)
		}
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.rect(pts[0].x, pts[0].y, pts[1].x-pts[0].x, pts[1].y-pts[0].y)
		ctx.stroke();
		ctx.closePath();

	}

	this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);

		if(o._hitAnchor){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
					drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hitArrow){
			for(var i =0; i< pts.length; i++){
				var p = pts[i];
				if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
					drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
			}
		}

		if(o._hit || o.selected){
			drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
			drawDiagonal(o, octx, pts);
		}

		function drawDiagonal(o, ctx, pts){
			ctx.strokeStyle = o.color;
			ctx.beginPath();
			ctx.moveTo(pts[0].x, pts[0].y);
			ctx.setLineDash([2,5]);
			ctx.lineTo(pts[1].x, pts[1].y);
			ctx.stroke();
			ctx.setLineDash([1]);
			ctx.closePath();
		}
	}

	this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		var hitResult = false;

		this.clearHits(o);


		if(		between(pts[0].x, x, pts[1].x, self.hitTolerance) &&
				between(pts[0].y, y, pts[1].y, self.hitTolerance+self.anchorPointDistanceToArrow)
		){
			
			
			//check diagonal
			var nlp1 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[1].y}, x, y);
			var distance=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})

			if(
					distance < self.hitTolerance	||
					between(pts[0].x, x, pts[0].x, self.hitTolerance) ||
					between(pts[1].x, x, pts[1].x, self.hitTolerance) ||
					between(pts[0].y, y, pts[0].y, self.hitTolerance) ||
					between(pts[1].y, y, pts[1].y, self.hitTolerance)
			){
				hitResult = true;
				o._hit = true;
				var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
				if(p){
					o._hitAnchor = {x:p.x, y:p.y};
				}
			}
		}
		return hitResult;
	}


	this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);

		if(o._hitArrow)
		for(var i =0; i<pts.length;i++){
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
				this.expandAnchor(o.anchors[i]);
			}
		}

		for(var i =0; i<pts.length;i++){
			//is on anchor?
			if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
				console.log("BOX point :",i,pts[i]);
				return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
			}
		}
		return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};

	}

	// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
	// 	o._hitAnchor=null;
	// 	o._hitArrow=null;

	// 	var idx = interactor.currentAnchor.selected;
	// 	var baseAnchors = interactor.currentAnchor.anchors;
	// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
	// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
	// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));

	// 	if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;

	// 	if(idx!=null){
	// 		if(idx===0){
	// 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
	// 			o.anchors[0].value = baseAnchors[0].value+yOffset;
	// 		}else if(idx===1){
	// 			o.anchors[1]._index = baseAnchors[1]._index+xOffset;
	// 			o.anchors[1].value = baseAnchors[1].value+yOffset;
	// 		}
	// 	}else{
	// 		for(var i=0; i< o.anchors.length ;i++){
	// 			o.anchors[i]._index = baseAnchors[i]._index+xOffset;
	// 			o.anchors[i].value = baseAnchors[i].value+yOffset;
	// 		}
	// 	}
	// };

	this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		var self = this;
		var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		if(!this.wasDrag){
			for(var i =0; i<pts.length;i++){
				if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
					console.log("Clicked BOX :",i,pts[i]);
					this.expandAnchor(o.anchors[i]);
				}
			}
		}


	};

	this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
		o._hit = false;
		o._hitAnchor=null;
		o._hitArrow=null;

		this.wasDrag = false;
		interactor.popPanel(this, o, panel);

	};


	

	this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		interactor.popPanel(this, o, panel);


		if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;

		if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
			interactor.currentAnchor = null;
			return true;
		}

	};

	this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
		console.log("BOX stage out");
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

}

var TriangleObject	=	function () {
	this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {
		
				var pts = this.getPoints(o, renderer, panel, model, seriesManager);
				ctx.beginPath();
				ctx.strokeStyle = o.color;
				ctx.lineWidth = o.width;
				ctx.setLineDash(o.dash ? o.dash : []);
				ctx.globalAlpha = 1;
				ctx.moveTo(pts[0].x, pts[0].y);
				ctx.lineTo(pts[1].x, pts[1].y);
				ctx.lineTo(pts[2].x, pts[2].y);
				ctx.lineTo(pts[0].x, pts[0].y);
				if(o.fillBg==true){
					ctx.globalAlpha = 0.2;
					ctx.fillStyle = o.color;
					ctx.fill();
				}
				ctx.globalAlpha = 1;
				ctx.closePath();
				ctx.stroke();
				ctx.closePath();
			}
		
			this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
				var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		
				if(o._hitAnchor){
					for(var i =0; i< pts.length; i++){
						var p = pts[i];
						if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
							drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
					}
				}
		
				if(o._hitArrow){
					for(var i =0; i< pts.length; i++){
						var p = pts[i];
						if(p.x == o._hitArrow.x && p.y == o._hitArrow.y)
							drawAnchorArrow(octx, panel, p, this.anchorPointArrowSize+2, this.anchorPointDistanceToArrow, this.anchorColorHover, 0.5 );
					}
				}
		
				if(o._hit || o.selected){
					drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
					drawDiagonal(o, octx, pts);
				}
		
				function drawDiagonal(o, ctx, pts){
					ctx.strokeStyle = o.color;
					ctx.beginPath();
					ctx.moveTo(pts[0].x, pts[0].y);
					ctx.setLineDash([2,5]);
					ctx.lineTo(pts[1].x, pts[1].y);
					ctx.stroke();
					ctx.setLineDash([1]);
					ctx.closePath();
				}
			}
		
			this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
				var self = this;
				var pts = this.getPoints(o, renderer, panel, model, seriesManager);
				var hitResult = false;

						
				this.clearHits(o);

				if(
					between(pts[0].x, x, pts[1].x, self.hitTolerance) && between(pts[0].y, y, pts[1].y, self.hitTolerance) || 
					between(pts[1].x, x, pts[2].x, self.hitTolerance) && between(pts[1].y, y, pts[2].y, self.hitTolerance) || 
					between(pts[0].x, x, pts[2].x, self.hitTolerance) && between(pts[0].y, y, pts[2].y, self.hitTolerance)
				){
		
					var nlp1 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[1].x, y1:pts[1].y}, x, y);
					var d1=pointsDistance({x:x,y:y},{x:nlp1.x, y:nlp1.y})
					var nlp2 = getLinePointNearestMouse({x0:pts[1].x, y0:pts[1].y, x1:pts[2].x, y1:pts[2].y}, x, y);
					var d2=pointsDistance({x:x,y:y},{x:nlp2.x, y:nlp2.y})
					var nlp3 = getLinePointNearestMouse({x0:pts[0].x, y0:pts[0].y, x1:pts[2].x, y1:pts[2].y}, x, y);
					var d3=pointsDistance({x:x,y:y},{x:nlp3.x, y:nlp3.y})
		
					if(d1 < self.hitTolerance || d2 < self.hitTolerance || d3 < self.hitTolerance) {
						hitResult = true;
						o._hit = true;
						var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
						if(p){
							o._hitAnchor = {x:p.x, y:p.y};
						}
					}
				}

				return hitResult;
			}
		
		
			this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				var self = this;
				var pts = self.getPoints(o, renderer, panel, model,seriesManager);
		
				if(o._hitArrow)
				for(var i =0; i<pts.length;i++){
					if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
						this.expandAnchor(o.anchors[i]);
					}
				}
		
				for(var i =0; i<pts.length;i++){
					//is on anchor?
					if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
						console.log("BOX point :",i,pts[i]);
						return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
					}
				}
				return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};
		
			}
		
			// this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
			// 	o._hitAnchor=null;
			// 	o._hitArrow=null;
		
			// 	var idx = interactor.currentAnchor.selected;
			// 	var baseAnchors = interactor.currentAnchor.anchors;
			// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
			// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
			// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
		
			// 	if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;
		
			// 	if(idx!=null){
			// 		if(idx===0){
			// 			o.anchors[0]._index = baseAnchors[0]._index+xOffset;
			// 			o.anchors[0].value = baseAnchors[0].value+yOffset;
			// 		}else if(idx===1){
			// 			o.anchors[1]._index = baseAnchors[1]._index+xOffset;
			// 			o.anchors[1].value = baseAnchors[1].value+yOffset;
			// 		}
			// 	}else{
			// 		for(var i=0; i< o.anchors.length ;i++){
			// 			o.anchors[i]._index = baseAnchors[i]._index+xOffset;
			// 			o.anchors[i].value = baseAnchors[i].value+yOffset;
			// 		}
			// 	}
			// };
		
			this.mouseUp	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				var self = this;
				var pts = self.getPoints(o, renderer, panel, model,seriesManager);
				if(!this.wasDrag){
					for(var i =0; i<pts.length;i++){
						if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y+this.anchorPointDistanceToArrow, self.hitTolerance)) {
							console.log("Clicked BOX :",i,pts[i]);
							this.expandAnchor(o.anchors[i]);
						}
					}
				}
		
		
			};
		
			this.mouseOut	=		function (e, o, renderer, interactor, model, panel, seriesManager) {
				o._hit = false;
				o._hitAnchor=null;
				o._hitArrow=null;
		
				this.wasDrag = false;
				interactor.popPanel(this, o, panel);
		
			};
		
		
			/*
			 * STAGE
			//  */
		
			// this.stageDown		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
			// 	console.log("BOX stage down start", interactor.currentAnchor);
			// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
			// 	var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
			// 	var idx = renderer.getPointIndex (e._offset.offsetX, model);
			// 	if(interactor.currentAnchor==null){
			// 		o.anchors[0].value = v;
			// 		o.anchors[0]._index = idx;
			// 		o.anchors[1].value = v;
			// 		o.anchors[1]._index = idx;
			// 		//panel.objects.push(o);
			// 		var ca = {selected: 1, anchors: JSON.parse(JSON.stringify(o.anchors))};
			// 		console.log("BOX stage down start", ca);
			// 		return ca;
			// 	}
			// 	interactor.pushPanel(this, o, panel);
			// 	return {selected: interactor.currentAnchor.selected+1, anchors: JSON.parse(JSON.stringify(o.anchors))};
			// };
		
			// this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
			// 	var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
			// 	var fV = LIB.getReferenceValue(o, model, seriesManager);
			// 	var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
			// 	var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
			// 	var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
			// 	if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
			// 		console.log("BOX long drag ");
			// 		interactor.currentAnchor.drag = true;
			// 		var i = interactor.currentAnchor.selected;
			// 		var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV);
			// 		var idx = renderer.getPointIndex (e._offset.offsetX, model);
			// 		if(i!=null && i < o.anchors.length){
			// 			o.anchors[i]._index = idx;
			// 			o.anchors[i].value = v;
			// 			console.log("BOX after drag",i, o.anchors[i]);
			// 		}
			// 	}
			// 	interactor.renderOverlayedObject (this, o, panel);
			// };
		
			this.stageUp			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				interactor.popPanel(this, o, panel);
		
		
				if(interactor.currentAnchor && interactor.currentAnchor.drag) interactor.currentAnchor.selected++;
		
				if(interactor.currentAnchor!==null && interactor.currentAnchor.selected >= interactor.currentAnchor.anchors.length){
					interactor.currentAnchor = null;
					return true;
				}
		
			};
		
			this.stageOut			=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				console.log("BOX stage out");
				this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
			};
	}

	function PriceTagObject(){
			this.defaultTagLen = 100;
			this.defaultLineLen = 50;
		
			this.render			=	function (o, ctx, renderer, model, panel, seriesManager) {
		
				var pts = this.getPoints(o, renderer, panel, model, seriesManager);
		
				var x = pts[0].x;
				var y = pts[0].y;
		
				ctx.strokeStyle = o.color;
				ctx.fillStyle = o.color;
				ctx.lineWidth = o.width;
				ctx.setLineDash(o.dash ? o.dash : []);

				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var value = o.anchors[0].value;
				var valueS = LIB.nFormatter(value, renderer.getPrecision(model,panel));
				var w = this.defaultLineLen+this.defaultTagLen;

				if(!o.flipped){
					ctx.beginPath();
					ctx.moveTo(x+this.defaultLineLen, y)
					ctx.lineTo(x+this.defaultLineLen+5, y-10);
					ctx.lineTo(x+w, y-10);
					ctx.lineTo(x+w, y+10);
					ctx.lineTo(x+this.defaultLineLen+5, y+10);
					ctx.lineTo(x+this.defaultLineLen, y);
					ctx.fill();
					ctx.lineTo(x, y);
					ctx.stroke();
					ctx.closePath();
					ctx.fillStyle = WEBRCP.utils.getContrastColor(o.color, WEBRCP.utils.colorManager.getColor("indicatorMarker"), '#ffffff');
					ctx.fillText(valueS, x+this.defaultLineLen+10, y+3);
				}else{
					ctx.beginPath();
					ctx.moveTo(x-this.defaultLineLen, y)
					ctx.lineTo(x-this.defaultLineLen-5, y-10);
					ctx.lineTo(x-w, y-10);
					ctx.lineTo(x-w, y+10);
					ctx.lineTo(x-this.defaultLineLen-5, y+10);
					ctx.lineTo(x-this.defaultLineLen, y);
					ctx.fill();
					ctx.lineTo(x, y);
					ctx.stroke();
					ctx.closePath();
					ctx.fillStyle = WEBRCP.utils.getContrastColor(o.color, WEBRCP.utils.colorManager.getColor("indicatorMarker"), '#ffffff');
					ctx.fillText(valueS, x-w+10, y+3);
				}
			}
		
			this.renderOverlay = function (o, octx, renderer, model, panel, seriesManager) {
				var pts = this.getPoints(o, renderer, panel, model, seriesManager);
				if(o._hitAnchor){
					for(var i =0; i< pts.length; i++){
						var p = pts[i];
						if(p.x == o._hitAnchor.x && p.y == o._hitAnchor.y)
							drawAnchor(octx, panel, p, this.hitTolerance, this.anchorColorHover, 0.5 );
					}
				}

				if(o._hit || o.selected){
					drawAnchors(octx, panel, pts, this.anchorPointSize, this.anchorColor, 1 );
				}
			}
		
			this.hit	=	function (x, y, o, renderer, interactor, model, panel, seriesManager) {
				var self = this;
		
				var pts = this.getPoints(o, renderer, panel, model, seriesManager);
				var hitResult = false;
				this.clearHits(o);
		
				if(	( o.flipped && between(pts[0].x, x, pts[0].x-this.defaultLineLen-this.defaultTagLen, self.hitTolerance) && between(pts[0].y-1, y, pts[0].y+1, self.hitTolerance)) ||
					(!o.flipped && between(pts[0].x, x, pts[0].x+this.defaultLineLen+this.defaultTagLen, self.hitTolerance) && between(pts[0].y-1, y, pts[0].y+1, self.hitTolerance)) ){
					hitResult = true;
					o._hit = true;
					var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
					if(p){
						o._hitAnchor = {x:p.x, y:p.y};
					}
				}
				return hitResult;
			}
		
		
			this.mouseDown	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				var self = this;
				var pts = self.getPoints(o, renderer, panel, model,seriesManager);
				interactor.pushPanel(this, o, panel);
				for(var i =0; i<pts.length;i++){
					if (interactor.isOver(e._offset.offsetX, e._offset.offsetY, pts[i].x, pts[i].y, self.hitTolerance)) {
						console.log("Clicked point :",i,pts[i]);
						return {selected: i, anchors: JSON.parse(JSON.stringify(o.anchors))};
					}
				}
				return {selected: null, anchors: JSON.parse(JSON.stringify(o.anchors))};
		
			}
			this.mouseDrag	=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				var idx = interactor.currentAnchor.selected;	
				var yValue = e._offset.offsetY-panel._offset;
				var baseAnchors = interactor.currentAnchor.anchors;
				var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var yOffset = parseFloat((renderer.getPointValue(yValue, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
				
		
				if(Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) this.wasDrag = true;
		
				let index = renderer.getStampIndex(baseAnchors[0].prawilnyStamp, model, seriesManager) + xOffset;
				var v = baseAnchors[0].value+yOffset;
				if(o.sticky){		
					var candles = this.getCurrentCandles(index, model, seriesManager);
					v = this.stickToCandleValue(yValue, candles, panel, renderer, fV);
				}
				o.anchors[0].value = LIB.round(v,renderer.getPrecision(model,panel));
				o.anchors[0]._index = index;
				o.anchors[0].prawilnyStamp = renderer.getIndexStamp(o.anchors[0]._index, model, seriesManager);
			};

		
			this.stageDrag		=	function (e, o, renderer, interactor, model, panel, seriesManager) {
				var xOffset = renderer.getPointIndex(e._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
				var fV = LIB.getReferenceValue(o, model, seriesManager);
				var yOffset = parseFloat((renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV) - renderer.getPointValue(interactor.initialMouseEvent._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax, panel.valueAxisMode, fV)).toFixed(panel.precision));
				var xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
				var yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;
				if(Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance){
					console.log("PriceTag long drag ");
					interactor.currentAnchor.drag = true;
					var i = interactor.currentAnchor.selected;
					var v = renderer.getPointValue(e._offset.offsetY-panel._offset, panel._height, panel.vMin, panel.vMax);
					var idx = renderer.getPointIndex (e._offset.offsetX, model);
					if(i!=null && i < o.anchors.length){
						o.anchors[i]._index = idx;
						o.anchors[i].prawilnyStamp = renderer.getIndexStamp(o.anchors[i]._index, model, seriesManager);
						console.log("PriceTag after drag",i, o.anchors[i]);
					}
				}
			};
		}


export { Shape, TrendLineObject,  FibonLinesObject, ParallelChannelObject, ArrowObject, HorizontalLineObject, VerticalLineObject, DiNapoliLevels, DiNapoliAbcObject, MultiLineObject, AbcdObject, EllipseObject, HorizontalRangeObject, VerticalRangeObject, CycleObject, TextObject, BoxObject, TriangleObject, PriceTagObject }

//# sourceURL=./platform/components/newchart/js/objects2.js
