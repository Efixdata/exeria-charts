import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createScript1xFunctionScript(FUSION: CoreFusionStatic) {
    return {
        title: '1xTitle',
        description: '1xDescription',
        type: 'functions',
        newPane: true,
        inputs: {
            'INDICATOR': {type: 'series', name: 'indicator', properties: {def:'c'}, value: null},
        },
    
        outputs: {
            'X': {
                type: 'series', series: {
                    seriesId: null,
                    title: '1xTitle',
                    labels: ['value'],
                    fields: ['X'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'X', renderAs: 'Line', dataField: 'X', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    this.X.setValue(index, 1 / this.INDICATOR.getValue(index));
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
