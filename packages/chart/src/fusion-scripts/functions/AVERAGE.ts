import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createAVERAGEFunctionScript(FUSION: CoreFusionStatic) {
    return {
        title: 'averageTitle',
        description: 'averageDescription',
        type: 'functions',
        newPane: true,
        inputs: {
            'INDICATOR1': {type: 'conditional', name: 'indicator1', properties: {}, value: {type:"double", value:0}},
            'INDICATOR2': {type: 'conditional', name: 'indicator2', properties: {}, value: {type:"double", value:0}},
            'INDICATOR3': {type: 'conditional', name: 'indicator3', properties: {}, value: {type:"double", value:0}},
            'INDICATOR4': {type: 'conditional', name: 'indicator4', properties: {}, value: {type:"double", value:0}},
            'INDICATOR5': {type: 'conditional', name: 'indicator5', properties: {}, value: {type:"double", value:0}},
            'INDICATOR6': {type: 'conditional', name: 'indicator6', properties: {}, value: {type:"double", value:0}},
            'INDICATOR7': {type: 'conditional', name: 'indicator7', properties: {}, value: {type:"double", value:0}},
            'INDICATOR8': {type: 'conditional', name: 'indicator8', properties: {}, value: {type:"double", value:0}},
            'INDICATOR9': {type: 'conditional', name: 'indicator9', properties: {}, value: {type:"double", value:0}},
            'INDICATOR10': {type: 'conditional', name: 'indicator10', properties: {}, value: {type:"double", value:0}},
        },
    
        outputs: {
            'AVERAGE': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'averageTitle',
                    labels: ['value'],
                    fields: ['AVERAGE'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'AVERAGE', renderAs: 'Line', dataField: 'AVERAGE', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    var values = [];
    
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR1, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR2, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR3, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR4, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR5, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR6, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR7, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR8, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR9, index));
                    values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR10, index));
    
                    var insertedIndicatorsCount = 10;
                    var sum = 0;
    
                    for (var i = 0; i < values.length; ++i) {
                        if (values[i]) {
                            sum += values[i];
                        } else {
                            --insertedIndicatorsCount;
                        }
                    }
    
                    this.AVERAGE.setValue(index, sum / insertedIndicatorsCount);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
