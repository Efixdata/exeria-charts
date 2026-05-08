import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSUMFunctionScript(FUSION: CoreFusionStatic) {
    return {
        title: 'sumTitle',
        description: 'sumDescription',
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
            'SUM': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'sumTitle',
                    labels: ['value'],
                    fields: ['SUM'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'SUM', renderAs: 'Line', dataField: 'SUM', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    var i1 = FUSION.lib.getConditionalInputValue(this.INDICATOR1, index);
                    var i2 = FUSION.lib.getConditionalInputValue(this.INDICATOR2, index);
                    var i3 = FUSION.lib.getConditionalInputValue(this.INDICATOR3, index);
                    var i4 = FUSION.lib.getConditionalInputValue(this.INDICATOR4, index);
                    var i5 = FUSION.lib.getConditionalInputValue(this.INDICATOR5, index);
                    var i6 = FUSION.lib.getConditionalInputValue(this.INDICATOR6, index);
                    var i7 = FUSION.lib.getConditionalInputValue(this.INDICATOR7, index);
                    var i8 = FUSION.lib.getConditionalInputValue(this.INDICATOR8, index);
                    var i9 = FUSION.lib.getConditionalInputValue(this.INDICATOR9, index);
                    var i10 = FUSION.lib.getConditionalInputValue(this.INDICATOR10, index);
    
                    this.SUM.setValue(index, i1 + i2 + i3 + i4 + i5 + i6 + i7 + i8 + i9 + i10);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
