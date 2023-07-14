import WEBRCP from "./WebRCP";
import FUSION from "./fusion";
import LIB from "./utils/chartingCommons";
import { Shape } from "./Objects2";

export default function ObjectsManager(chart){
	this.chart = chart;
	
	this.moveObjectToPanel = function(o, destPanelId){
		var sourcePanel = this.getPanelForObject(o);
		var destPanel = this.getPanelById(destPanelId);
		var objects = sourcePanel.objects;
		for(var j=0; j< objects.length; j++){
			if(o.id===objects[j].id){
				objects.splice(j,1);
				break
			}
		}
		if(o.reference){
			o.reference = null;
			for(var i in destPanel.objects){
				if(destPanel.objects[i].type=='SeriesObject'){
					o.reference = destPanel.objects[i].dataLink+":"+destPanel.objects[i].dataField;
				}
			}	
		}

		destPanel.objects.push(o);
		
	}

	this.cloneObject = function(o){
		var panel = this.getPanelForObject(o);
		var clone = JSON.parse(JSON.stringify(o));
		clone.id = FUSION.uniqueId();
		panel.objects.push(clone);
		return clone;
	}

	this.detachObject = function(objectId){

		const findRelatedScript = (o) => {
			for(var k in this.chart.model.scripts){
				var s = this.chart.model.scripts[k];
				if(s.inputs){
					for(let i in s.inputs){
						if(s.inputs[i].id == o.id)
							return s;
					}
				}
			}
			return null;
		};

		if(objectId){
			var o = LIB.getObjectById(this.chart.model, objectId);

			if (!o) return;
			if( this.chart.renderer.objects[o.type] instanceof Shape){
				this.detachToolObject(o.id);
				var relatedScript = findRelatedScript(o);
				if(relatedScript){
					var plotters = LIB.getPlottersForScriptByScriptId(this.chart.model, relatedScript.id);
					if(plotters.length > 0)
						this.detachSeriesObject(plotters[0]);
				}
			}else if( o.type == 'SeriesObject' || o.type=='StrategyObject' || o.type=='CandlestickPatternStrategyObject' || o.type=='FractalsObject'){
				this.detachSeriesObject(o);
			}else{
				console.log("DELETE: not series object, not tool object....WTF ?", o);
			}
		}
	}
	
	this.detachAllToolObjects = function(){
		var panels = this.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			for(var j =0; j< panels[i].objects.length; j++){
				var o = panels[i].objects[j];
				if( this.chart.renderer.objects[o.type] instanceof Shape){
					this.detachToolObject(o.id);
					if(j>0) j--;
				}
			}
		}
	}
	
	this.detachAllScriptObjects = function(){
		var panels = this.chart.model.panels;
		for(var i = 0; i < panels.length; i++){
			for(var j = 0; j < panels[i].objects.length; j++){
				const object = panels[i].objects[j];
				if (object.type === "SeriesObject" ||
					object.type === "StrategyObject" ||
					object.type === "CandlestickPatternStrategyObject" ||
					object.type === "FractalsObject"
				) {
					var script = this.isThisSeriesOutputOfScript(object.dataLink);
					if(script){
						this.detachSeriesObject(object);
						if(j > 0) j = 0;
						if(i > 0) i = 0;
					}
				}
			}
		}
	}
	
	this.detachPanel	= function(panelId){
		var p = this.getPanelById(panelId);
		if(p.main) throw "Can't delete main panel!";
		
		while(p.objects.length>0){
			this.detachObject(p.objects[0].id)
		}
		this.removeEmptyPanels();
	}

	this.detachScript	= function(scriptId){
		if(scriptId){
			var s = this.getScriptControllerById(scriptId)
			var resultArray = [];
			resultArray.push(s);
			for(var i=0; i< s.length; i++){
				var outputs = s[i].outputs;
				for (var property in outputs) {
					if (outputs.hasOwnProperty(property)) {
						var dl = outputs[property];
						this.getScriptsRelatedToSeries(dl, resultArray);
					}
				}
			}
			for(var i =resultArray.length-1; i>=0; i--){
				this.removeScript(resultArray[i]);
			}
		}
	}
	
	this.removeEmptyPanels = function(){
		var panels = this.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			var c = panels[i].objects.filter(o => (o.type=="SeriesObject" || o.type=="StrategyObject" || o.type=='CandlestickPatternStrategyObject' || o.type=='FractalsObject')).length;
			if(c==0){
				this.chart.removePanelFromModel(panels[i]);
			}
		}
	}

	this.getSeriesById = function(objectId) {
		return this.chart.model.objects.seriesManager[objectId]
	}

	this.getScriptControllerById = function(scriptId){
		return this.chart.getScriptsManager()[scriptId];
	}

	this.getScriptModelById = function (scriptId) {
		for(var i=0; i<this.chart.model.scripts.length;i++){
			if(this.chart.model.scripts[i].id === scriptId)
				return this.chart.model.scripts[i];
		}
	}
	
	this.getPanelById = function(panelId) {
		var panels = this.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			if(panels[i].id === panelId){
				return panels[i];
			}
		}
		return null;
	}


	this.detachToolObject = function(objectId) {
		if(objectId){
			for (var i=0; i<this.chart.model.panels.length; i++) {
				var objects = this.chart.model.panels[i].objects;
				for(var j=0; j< objects.length; j++){
					if(objectId===objects[j].id){
						objects.splice(j,1);
						return;
					}
				}
			}
		}
	}

	this.detachSeriesObject = function(o) {
		if(o.dataLink){
			var result = [];
			var script = this.isThisSeriesOutputOfScript(o.dataLink);
			if(script) result.push(script);
			this.getScriptsRelatedToSeries(o.dataLink, result);
			console.log("DELETE SERIES: related scripts:", result );
			for(var i =result.length-1; i>=0; i--){
				this.removeScript(result[i]);
			}

			this.removeInstrument(o);
		}
	}

	this.removeInstrument = function (o) {
		const removePlotter = (objectId) => {
			for (var i=0; i<this.chart.model.panels.length; i++) {
				var objects = this.chart.model.panels[i].objects;
				for(var j=0; j< objects.length; j++){
					if(objectId===objects[j].id){
						objects.splice(j,1);
						return;
					}
				}
			}
		}

		if (o.dataLink) {
			var model = this.chart.model;
			if (o.dataLink == model.mainSeries) {
				console.log("Can't delete main series!");				
			} else {
				for(var k in this.chart.model.instrumentsSeries){
					if(this.chart.model.instrumentsSeries[k].seriesId == o.dataLink){
						this.chart.onInstrumentRemoved(this.chart.model.instrumentsSeries[k].instrument.id);
						this.chart.model.instrumentsSeries.splice(k,1);
						break;
					}
				}
				delete this.chart.getSeriesManager()[o.dataLink];
				removePlotter(o.id);
			}
		}
	}

	this.removeScript = function (s) {
		var model = this.chart.model;

		//model script objects
		for(var i=0; i<model.scripts.length;i++){
			if(model.scripts[i].id===s.id){
				model.scripts.splice(i,1);
				break;
			}
		}

		var outputs = s.outputs;
		for (var property in outputs) {
			if (outputs.hasOwnProperty(property)) {
				var dl = outputs[property];

				//ploters
				for(var i=0; i<model.panels.length;i++){
					var panel = model.panels[i];
					for(var j =0; j< panel.objects.length; j++){
						if(panel.objects[j].dataLink){
							if(panel.objects[j].dataLink===dl){
								panel.objects.splice(j,1);
								j--;
							}

						}
					}
				}

				//series
				delete this.chart.getSeriesManager()[dl];
			}
		}
		
		//are thereany related objects?
		var inputs = s.inputs;
		for(var property in inputs){
			if(inputs[property].canBeIndicator){
				inputs[property].isIndicator = false;
			}
		}

		//delete script controller
		delete this.chart.getScriptsManager()[s.id];

		this.removeEmptyPanels();
	}


	this.getScriptsRelatedToSeries = function(dataLink, resultArray){
		var s = this.isThisSeriesInputOfScript(dataLink);
		resultArray.push.apply(resultArray,s);
		for(var i=0; i< s.length; i++){
			var outputs = s[i].outputs;
			for (var property in outputs) {
				if (outputs.hasOwnProperty(property)) {
					var dl = outputs[property];
					this.getScriptsRelatedToSeries(dl, resultArray);
				}
			}
		}
	}

	this.isThisSeriesOutputOfScript = function(dataLink){
		var sm = this.chart.getScriptsManager()
		//iterate over scripts
		for (var property in sm) {
			if (sm.hasOwnProperty(property)) {
				var script = sm[property];
				var outputs = script.outputs;
				for (var property in outputs) {
					if (outputs.hasOwnProperty(property)) {
						if(outputs[property]==dataLink){
							return script;
						}
					}
				}
			}
		}
		return null;
	}

	this.isThisSeriesInputOfScript = function(dataLink) {
		var sm = this.chart.getScriptsManager()
		var result = [];
		//iterate over scripts
		for (var property in sm) {
			if (sm.hasOwnProperty(property)) {
				var script = sm[property];
				var inputs = script.inputs;
				for (var property in inputs) {
					if((""+inputs[property]).startsWith(dataLink)){
						result.push(script);
					}
				}
			}
		}
		return result;
	}

	this.getPanelForObject = function(o) {
		var panels = this.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			for(var j =0; j< panels[i].objects.length;j++){
				if(panels[i].objects[j].id === o.id)
					return panels[i]; 
			}
		}
		return null;
	}
}

//# sourceURL=./platform/components/newchart/js/objectsManager.js