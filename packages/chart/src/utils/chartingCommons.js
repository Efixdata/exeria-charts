import WEBRCP from "./../WebRCP";

const LIB = {};

LIB.getNumberMagnitude = function(num) {
	return -Math.floor( Math.log10(num) + 1);
}

LIB.nFormatter = function(num, digits) {
	  var si = [
		    { value: 1E9,  symbol: "B" },
		    { value: 1E6,  symbol: "M" }//,
		    //{ value: 1E3,  symbol: "k" }
		  ], rx = /(\.[0-9]*[1-9])0+$/, i;
		  for (i = 0; i < si.length; i++) {
		    if (num >= si[i].value) {
		      return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
		    }
		  }
		  return num.toFixed(digits);
}

LIB.round= function(num, digits) {
	var factor = Math.pow(10, digits);
	return Math.round(num*factor)/factor;
}

LIB.getObjectById = function(model, id){
	for(var i =0; i< model.panels.length;i++){
		for(var j =0; j< model.panels[i].objects.length;j++){
			if(model.panels[i].objects[j].id==id)
				return model.panels[i].objects[j];
		}
	}
	return null;
}

LIB.getRawSeriesWrapper = function(series, field) {
	var wrapper = {
			getValue: function (index) {
				return series.data[index][field];
			},
			setValue: function (index, value) {
				series.data[index][field] = value;
			}
	}
	return wrapper;
}

LIB.getOHLCSeriesWrapper = function (series) {
	var wrapper = {
		getOpen: function (index) {
			return series.data[index]['o'];
		},
		setOpen: function (index, value) {
			return series.data[index]['o'] = value;
		},
		getHigh: function (index) {
			return series.data[index]['h'];
		},
		setHigh: function (index, value) {
			return series.data[index]['h'] = value;
		},
		getLow: function (index) {
			return series.data[index]['l'];
		},
		setLow: function (index, value) {
			return series.data[index]['l'] = value;
		},
		getClose: function (index) {
			return series.data[index]['c'];
		},
		setClose: function (index, value) {
			return series.data[index]['c'] = value;
		},
		getVolume: function (index) {
			return series.data[index]['v'];
		},
		setVolume: function (index, value) {
			return series.data[index]['v'] = value;
		},
		getInt: function (index) {
			return series.data[index]['i'];
		},
		setInt: function (index, value) {
			return series.data[index]['i'] = value;
		},
		getStamp: function (index) {
			return series.data[index]['stamp'];
		},
		setStamp: function (index, value) {
			return series.data[index]['stamp'] = value;
		},
		getSeriesLength: function () {
			return series.data.length;
		},
		getValue: function (index) {
			return this.getClose(index);
		},
		update: function (tick) {
			var l = series.data.length;
			var lastStamp = series.data[l - 1]['stamp'];
			var flooredTickStamp = LIB.florStampToInterval(tick.stamp, series.interval, lastStamp);
			let price = WEBRCP.utils.getPriceFromTick(tick);

			const calculateNewVolume = (lastCandle, tick) => {			
				if (series.interval.symbol === "1D" && tick.dailyVolume) {
					return tick.dailyVolume;
				} else if (lastCandle) {
					return lastCandle.v + tick.volume;
				} else {
					return tick.volume;
				}
			};

			if (flooredTickStamp < lastStamp) {
				return false;
			} else if (lastStamp < flooredTickStamp) {
				series.data.push({
					o: price,
					h: price,
					l: price,
					c: price,
					v: calculateNewVolume(null, tick),
					i: 0,
					stamp: flooredTickStamp
				});
				// series.data.shift();
				return true;
			} else {
				var lastCandle = series.data[l - 1];
				if (price > lastCandle.h) lastCandle.h = price;
				if (price < lastCandle.l) lastCandle.l = price;
				lastCandle.c = price;
				lastCandle.v = calculateNewVolume(lastCandle, tick);
				return false;
			}
		},
		upsertCandle: function (candle) {
			const l = series.data.length;
			const lastStamp = series.data[l - 1]['stamp'];
			const flooredCandleStamp = LIB.florStampToInterval(candle.stamp, series.interval, lastStamp);

			if (flooredCandleStamp < lastStamp) {
				console.warn("Attempting to update earlier candle than last. This is not supported.");
				return false;
			} else if (lastStamp < flooredCandleStamp) {
				series.data.push({
					o: candle.o,
					h: candle.h,
					l: candle.l,
					c: candle.c,
					v: candle.v,
					i: candle.i || 0,
					stamp: flooredCandleStamp
				});
				return true;
			} else {
				var lastCandle = series.data[l - 1];
				lastCandle.o = candle.o;
				lastCandle.h = candle.h;
				lastCandle.l = candle.l;
				lastCandle.c = candle.c;
				lastCandle.v = candle.v;
				lastCandle.i = candle.i || 0;
				return false;
			}
		},
		synchronize: function (fetchedCandles) {
			var tail = series.data.slice(Math.max(series.data.length - fetchedCandles.length, 0));
			for (var i = 0; i < fetchedCandles.length; i++) {
				var fetched = fetchedCandles[i];
				var old = tail[i];
				if (old.stamp == fetched.stamp) {
					old.o = fetched.o;
					old.h = fetched.h;
					old.l = fetched.l;
					old.c = fetched.c;
					old.v = fetched.v;
					old.i = fetched.i;
				}
			}
		}
	}
	return wrapper;
}

LIB.synchronizeSeries = function(seriesManager){
	var longest = null;
	for(var key in seriesManager){
		if (seriesManager.hasOwnProperty(key)) {
			if(!longest || seriesManager[key].data.length > longest.data.length){
				longest = seriesManager[key];
			}
		}
	}
	for(var key in seriesManager){
		if (seriesManager.hasOwnProperty(key) && seriesManager[key].data ) {
			while(seriesManager[key].data.length < longest.data.length){
				var last = seriesManager[key].data[seriesManager[key].data.length-1];
				var next = JSON.parse(JSON.stringify(last));
				if(next['c']!=null && next['c']!=undefined){
					next['o'] = next['c'];
					next['h'] = next['c'];
					next['l'] = next['c'];
					next['v'] = 0;
					next['i'] = 0;
				}
				
				next.stamp = longest.data[seriesManager[key].data.length].stamp
				seriesManager[key].data.push(next);
			}
		}
	}

}

LIB.synchronizeAllWithAll = function(seriesManager, model){
	console.log("SYNCHRONIZE ALL WITH ALL");
	var l = 1;
	var wrappers = {};
	var stampIndex = {};
	var stamps = {};

	for(var s in model.instrumentsSeries){
		var id = model.instrumentsSeries[s].seriesId;
		var series = seriesManager[id];

		if(series.data.length > l) l = series.data.length;

		stampIndex[id]={};
		for(var index in series.data){
			stampIndex[id][series.data[index].stamp] = index;
			stamps[series.data[index].stamp] = series.data[index].stamp;
		}
	}

	var stampsArray = Object.keys(stamps).sort(
			function(a,b){ 
				var n1  = parseInt(a);
				var n2	= parseInt(b);
				return n1 - n2;
			});
	
	var lastValue = {};	
	for(var index = 0 ; index < stampsArray.length; index++){
		var stamp = stampsArray[index];
		for(var s in model.instrumentsSeries){
			var id = model.instrumentsSeries[s].seriesId;
			var series = seriesManager[id];
			if(index == 0 ){
				lastValue[id] = series.data[0];
			}
			var value = series.data[index];
			if(!value || !value.stamp || value.stamp != stamp){
				var candle = {
						c : lastValue[id].c,
						h : lastValue[id].c,
						l :	lastValue[id].c,
						o : lastValue[id].c,
						stamp :	Number(stamp),
						v :	0,
						i :	0,
				}				
				series.data.splice(index,0, candle);
			}else{
				lastValue[id]  = series.data[index];
			}
		}	
	}
}

/*
 * Export stratgii
 */
LIB.createStrategyToExport = function(o, chart){
	console.log("Export strategy", o);
	var model = chart.model;
	var strategy = {
			series: [],
			mainStrategy : {id:o.id, dataLink:o.dataLink, dataField: o.dataField},
			scripts: model.scripts
	};
	//TODO - w przypdaku eksportu z inspektora o to scripy, a w przypadku eksportu z wykresu - plotter!!!!
	//if (o.type == 'StrategyObject' || o.type == 'CandlestickPatternStrategyObject') {

		var sm = chart.fusion.getSeriesManager();
		for (var key in sm) {
			if (sm.hasOwnProperty(key)) {
				if (sm[key]['instrument']) {
					var instrument = {
						id: sm[key].seriesId,
						title: sm[key].title,
						instrument: sm[key].instrument,
						interval: sm[key].interval,
						fields: sm[key].fields,
						labels: sm[key].labels,
					}
					strategy.series.push(instrument);
				}
			}
		}
		return strategy;
	//} else
	//	throw "You cant export this type of script as main strategy!";
}

LIB.getPlottersForScriptByScriptId= function(model, scriptId){
	var script = null;;
	for(var i in model.scripts){
		if(scriptId == model.scripts[i].id){
			script = model.scripts[i];
			break;
		}
	}
	var plotters = [];
	if(script==null) return plotters;
	
	for(var i in model.panels){
		for(var j in model.panels[i].objects){
			if(model.panels[i].objects[j].dataLink){
				for(var key in script.outputs){
					if(model.panels[i].objects[j].dataLink == script.outputs[key] ){
						plotters.push(model.panels[i].objects[j]); 
					}	
				}
			}
		}
	}
	return plotters;
	
}



LIB.createOhlcvModel = function(id, instrument, interval){
	var res = {
			seriesId: id,
			title: instrument.symbol,
			labels: ['O', 'H', 'L', 'C', 'V', 'I'],
			fields: ['o', 'h', 'l', 'c', 'v', 'i'],
			data: null,
			instrument: instrument,
			interval: interval,
	}
	return res;
}

LIB.florStampToInterval = function(tickStamp, interval, lastStamp){
	var milis = interval.milis;
	if(interval.symbol == '1W'){
		var stampMod = tickStamp + new Date().getTimezoneOffset()*60*1000;
		var d = new Date(stampMod);
		var day = d.getDay();
		var f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day == 0?0:-day), 0, 0, 0, 0);
		return f.getTime()-f.getTimezoneOffset()*60*1000;

	}else if (interval.symbol === '1M'){
		var stampMod = tickStamp + new Date().getTimezoneOffset()*60*1000;
		var d = new Date(stampMod);
		var f = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
		return f.getTime()-f.getTimezoneOffset()*60*1000;
	}else if(milis > 0 ){
		if (lastStamp) {
			return tickStamp - (tickStamp - lastStamp) % milis;
		} else {
			return tickStamp - tickStamp % milis;
		}
	}else{
		throw "Invalid nteraval / milis"
	}
}

LIB.getIntervalInMilis = function(stamp, interval){
	var milis = interval.milis;
	if(milis < 0){
		var stampMod = stamp + new Date().getTimezoneOffset()*60*1000;
		if(interval.symbol === '1M'){
			var d = new Date(stampMod);
			var f = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
			var t = new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59, 999);
			milis = t.getTime()-f.getTime(); 
		}else 
			return null;
	}
	return milis;
}


LIB.getUniqueId = function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return new Date().getTime() + '@' + s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	s4() + '-' + s4() + s4() + s4();
};




LIB.ValueConverterLin = function(){

	this.realToAxis = function(rV, fV){
		return rV;
	}

	this.axisToReal = function(aV, fV){
		return aV;
	}
}

LIB.ValueConverterPerc = function(){

	this.realToAxis = function(rV, fV){
		try{
			return 100+ 100*(rV-fV)/fV;
		}catch(err){
			console.error("ValueConverterPerc->realToAxis:"+err);
			return 0;
		}
	}

	this.axisToReal = function(aV, fV){
		try{
			return aV*fV/100;
		}catch(err){
			console.error("ValueConverterPerc->axisToreal:"+err);
			return 0;
		}
	}
}

LIB.ValueConverterLog = function(){

	this.realToAxis = function(rV, fV){
		try{
			var v =  Math.log10(rV);
			if (isNaN(v) || v == -Infinity || v == Infinity)
				return 0;
			else
				return v;
		}catch(err){
			console.error("ValueConverterLog->realToAxis:"+err);
			return 0;
		}
	}

	this.axisToReal = function(aV, fV){
		try{
			var v = Math.pow(10,aV);
			if (isNaN(v) || v == -Infinity || v == Infinity)
				return 0;
			else
				return v;
		}catch(err){
			console.error("ValueConverterLog->axisToreal:"+err);
			return 0;
		}
	}
}

LIB._converterLog = new LIB.ValueConverterLog();
LIB._converterLin = new LIB.ValueConverterLin();
LIB._converterPerc = new LIB.ValueConverterPerc();

LIB.ValueConverter = function(mode){
	this.mode = mode;
	if(mode=='perc')
		this.cnv = LIB._converterPerc;
	else if(mode == 'log')
		this.cnv =  LIB._converterLog;
	else
		this.cnv = LIB._converterLin;

	this.realToAxis = function(rV, fV){
		return this.cnv.realToAxis(rV, fV);
	}

	this.axisToReal = function(aV, rV){
		return this.cnv.axisToReal(aV, rV);
	}
}

LIB.getReferenceValue = function(o, model, seriesManager){
	var link = o.dataLink;
	var field = o.dataField;
	if(field=='BBMiddle') field=null;
	
	if(o.type=='StrategyObject' || o.type=='CandlestickPatternStrategyObject' || o.type=='FractalsObject'){
		link = model.mainSeries;
		field = 'c';
	}

	if(!(link && field) || o.reference){
		if(o.reference){
			var s = o.reference.split(':');
			link = s[0];
			field = s[1];
		}else{
			link = model.mainSeries;
			field = 'c';
		}
	}
	try {
		return LIB.getFirstAvailableValue(model, seriesManager[link].data, field);
	} catch(e) {
		return null;
	}
}

LIB.getFirstAvailableValue = function(model, data, field) {
	if (model._leftIndex < model._rightIndex) {
		for (let i = model._leftIndex; i < model._rightIndex; i++) {
			if (data[i] && data[i][field]) return data[i][field];
		}
	}
	else {
		for (let i = model._leftIndex; i > model._rightIndex; i--) {
			if (data[i] && data[i][field]) return data[i][field];
		}
	}
	
	return null;
}

LIB.synchronizeArraysByObjId = function(src, dst){
	//usun z dst wszystkie niepasujące
	var newDest = dst.filter(p => getObjById(src, p.id));
	dst.splice(0,dst.length);
	newDest.forEach(p => dst.push(p));
	
	for(var i in src){
		var o = getObjById(dst, src[i].id);
		if(!o)
			dst.push(src[i]);
		else
			updateOneByOther(o,src[i]);
	}
	
	function updateOneByOther(dst, src){
		for(var p in src){
			 if (src.hasOwnProperty(p) && (!dst.drag)) dst[p] = src[p];
		}
		return dst;
	}
		
	function getObjById(arr, id){
		for(var i in arr){
			if(arr[i] && arr[i].id && arr[i].id == id) 	return arr[i];
		}
		return null;
	}	
}


LIB.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

LIB.validateIntervalSymbolForInstrument = function(instrument, intervalSymbol){
	for(var k in instrument.availableIntervals){
		if(instrument.availableIntervals[k].symbol === intervalSymbol) 
			return instrument.availableIntervals[k];
	}
	return false;
};

LIB.validateIntervalSymbol = function(instrument, intervalSymbol){
	var firstInterval = instrument.defaultInterval; 
	for(var k in instrument.availableIntervals){
		firstInterval = firstInterval || instrument.availableIntervals[k];
		if(instrument.availableIntervals[k].symbol === intervalSymbol)
			return instrument.availableIntervals[k];
	}

	return firstInterval;
};

CanvasRenderingContext2D.prototype.rectRound = function (x, y, w, h, r1,r2,r3,r4) {
	  if (w < 2 * r1) r1 = w / 2;
	  if (h < 2 * r1) r1 = h / 2;
	  this.beginPath();
	  this.moveTo(x + r1, y);
	  this.arcTo(x + w, y, x + w, y + h, r1);
	  this.arcTo(x + w, y + h, x, y + h, r2);
	  this.arcTo(x, y + h, x, y, r3);
	  this.arcTo(x, y, x + w, y, r4);
	  this.closePath();
	  return this;
};

LIB.resizeImage = function(image, onSuccess, width, height){
	if(!width) width = 300;
	if(!height) height = 150;

	var img = new Image();
	img.src = image;
	img.onload = function(){
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		canvas.width = width;
		canvas.height = height;

		ctx.drawImage(img, 0, 0, width, height);
		var base64image = canvas.toDataURL();
		onSuccess(base64image);
	}
}

LIB.getSortedKeys = function(model, object){
	var objectKeys = [];
	for(var key in object){
		objectKeys.push(key);
	}
	if(!model)
		return objectKeys;

	var sortedKeys = [];
	for(var i = 0; i < model.length; ++i){
		var modelKey = model[i];
		var index = objectKeys.indexOf(modelKey);
		if(index > -1){
			sortedKeys.push(objectKeys.splice(index, 1)[0]);
		}
	}
	var newKeys = objectKeys.concat(sortedKeys);
	return newKeys;
};

LIB.groupBy = function(property, array){
	var map = [];
	for (var key in array){
		map[array[key][property]] = array[key];
	}
	return map;
};

LIB.getMilisFromIntervalSymbol = function (symbol) {
	switch (symbol) {
		case "1m":
			return 60000;
		case "5m":
			return 300000;
		case "15m":
			return 900000;
		case "30m":
			return 1800000;
		case "1h":
			return 3600000;
		case "1D":
			return 86400000;
		case "1W":
			return 604800000;
	}
};

export default LIB;