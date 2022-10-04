import WEBRCP from "./WebRCP";
import LIB from "./utils/chartingCommons";
import { Shape } from "./Objects2";

export default function ObjectsManager(chart){
	this.chart = chart;
	var self = this;
	
	this.moveObjectToPanel = function(o, destPanelId){
		var sourcePanel = getPanelForObject(o);
		var destPanel = getPanelById(destPanelId);
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
		var panel = getPanelForObject(o);
		var clone = JSON.parse(JSON.stringify(o));
		clone.id = FUSION.uniqueId();
		panel.objects.push(clone);
		return clone;
	}

	this.detachObject = function(objectId){
		if(objectId){
			var o = LIB.getObjectById(self.chart.model, objectId);
			if( this.chart.renderer.objects[o.type] instanceof Shape){
				detachToolObject(o.id);
				var relatedScript = findRelatedScript(o);
				if(relatedScript){
					var plotters = LIB.getPlottersForScriptByScriptId(self.chart.model, relatedScript.id);
					if(plotters.length > 0)
						detachSeriesObject(plotters[0]);
				}
			}else if( o.type == 'SeriesObject' || o.type=='StrategyObject' || o.type=='CandlestickPatternStrategyObject' || o.type=='FractalsObject'){
				detachSeriesObject(o);
			}else{
				console.log("DELETE: not series object, not tool object....WTF ?", o);
			}
			console.log("After delete model:", self.chart.model);
			console.log("After delete chart.options:", self.chart.options);
		}
		
		
		function findRelatedScript(o){
			for(var k in self.chart.model.scripts){
				var s = self.chart.model.scripts[k];
				if(s.inputs){
					for(let i in s.inputs){
						if(s.inputs[i].id == o.id)
							return s;
					}
				}
			}
			return null;
		}
	}
	
	this.detachAllToolObjects = function(){
		var panels = self.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			for(var j =0; j< panels[i].objects.length; j++){
				var o = panels[i].objects[j];
				if( this.chart.renderer.objects[o.type] instanceof Shape){
					detachToolObject(o.id);
					if(j>0) j--;
				}
			}
		}
		
		console.log("After delete model:", self.chart.model);
		console.log("After delete chart.options:", self.chart.options);
	}
	
	this.detachAllScriptObjects = function(){
		var panels = self.chart.model.panels;
		for(var i = 0; i < panels.length; i++){
			for(var j = 0; j < panels[i].objects.length; j++){
				const object = panels[i].objects[j];
				if (object.type === "SeriesObject" ||
					object.type === "StrategyObject" ||
					object.type === "CandlestickPatternStrategyObject" ||
					object.type === "FractalsObject"
				) {
					var script = isThisSeriesOutputOfScript(object.dataLink);
					if(script){
						detachSeriesObject(object);
						if(j > 0) j = 0;
						if(i > 0) i = 0;
					}
				}
			}
		}
		console.log("After delete model:", self.chart.model);
		console.log("After delete chart.options:", self.chart.options);
	}
	
	this.detachPanel	= function(panelId){
		var p = getPanelById(panelId);
		if(p.main) throw "Can't delete main panel!";
		
		while(p.objects.length>0){
			this.detachObject(p.objects[0].id)
		}
		self.removeEmptyPanels();
	}

	this.detachScript	= function(scriptId){
		if(scriptId){
			var s = getScriptControllerById(scriptId)
			var resultArray = [];
			resultArray.push(s);
			for(var i=0; i< s.length; i++){
				var outputs = s[i].outputs;
				for (var property in outputs) {
					if (outputs.hasOwnProperty(property)) {
						var dl = outputs[property];
						getScriptsRelatedToSeries(dl, resultArray);
					}
				}
			}
			for(var i =resultArray.length-1; i>=0; i--){
				removeScript(resultArray[i]);
			}
		}
	}
	
	this.removeEmptyPanels = function(){
		var panels = self.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			var c = panels[i].objects.filter(o => (o.type=="SeriesObject" || o.type=="StrategyObject" || o.type=='CandlestickPatternStrategyObject' || o.type=='FractalsObject')).length;
			if(c==0){
				self.chart.removePanelFromModel(panels[i]);
			}
		}
	}

	function getSeriesById(objectId){
		return self.chart.model.objects.seriesManager[objectId]
	}

	function getScriptControllerById(scriptId){
		return self.chart.getScriptsManager()[scriptId];
	}

	function getScriptModelById(scriptId){
		for(var i=0; i<self.chart.model.scripts.length;i++){
			if(self.chart.model.scripts[i].id === scriptId)
				return self.chart.model.scripts[i];
		}
	}
	
	function getPanelById(panelId){
		var panels = self.chart.model.panels;
		for(var i =0; i< panels.length; i++){
			if(panels[i].id === panelId){
				return panels[i];
			}
		}
		return null;
	}


	function detachToolObject(objectId){
		if(objectId){
			for (var i=0; i<self.chart.model.panels.length; i++) {
				var objects = self.chart.model.panels[i].objects;
				for(var j=0; j< objects.length; j++){
					if(objectId===objects[j].id){
						objects.splice(j,1);
						return;
					}
				}
			}
		}
	}

	function detachSeriesObject(o){
		if(o.dataLink){
			var result = [];
			var script = isThisSeriesOutputOfScript(o.dataLink);
			if(script) result.push(script);
			getScriptsRelatedToSeries(o.dataLink, result);
			console.log("DELETE SERIES: related scripts:", result );
			for(var i =result.length-1; i>=0; i--){
				removeScript(result[i]);
			}

			removeInstrument(o);
		}
	}

	function removeInstrument(o){
		if(o.dataLink){
			var model = self.chart.model;
			if(o.dataLink == model.mainSeries){
				console.log("Can't delete main series!");				
			}else{
				for(var k in self.chart.model.instrumentsSeries){
					if(self.chart.model.instrumentsSeries[k].seriesId == o.dataLink){
						self.chart.onInstrumentRemoved(self.chart.model.instrumentsSeries[k].instrument.id);
						self.chart.model.instrumentsSeries.splice(k,1);
						break;
					}
				}
				delete self.chart.getSeriesManager()[o.dataLink];
				removePlotter(o.id);
			}
		}

		function removePlotter(objectId){
			for (var i=0; i<self.chart.model.panels.length; i++) {
				var objects = self.chart.model.panels[i].objects;
				for(var j=0; j< objects.length; j++){
					if(objectId===objects[j].id){
						objects.splice(j,1);
						return;
					}
				}
			}
		}
	}

	function removeScript(s){
		var model = self.chart.model;

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
				delete self.chart.getSeriesManager()[dl];
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
		delete self.chart.getScriptsManager()[s.id];

		self.removeEmptyPanels();
	}


	function getScriptsRelatedToSeries(dataLink, resultArray){
		var s = isThisSeriesInputOfScript(dataLink);
		resultArray.push.apply(resultArray,s);
		for(var i=0; i< s.length; i++){
			var outputs = s[i].outputs;
			for (var property in outputs) {
				if (outputs.hasOwnProperty(property)) {
					var dl = outputs[property];
					getScriptsRelatedToSeries(dl, resultArray);
				}
			}
		}
	}

	function isThisSeriesOutputOfScript (dataLink){
		var sm = self.chart.getScriptsManager()
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

	function isThisSeriesInputOfScript(dataLink){
		var sm = self.chart.getScriptsManager()
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

	function getPanelForObject(o){
		var panels = self.chart.model.panels;
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