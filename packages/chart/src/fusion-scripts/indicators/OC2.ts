import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createOC2IndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'oc2Title',
        description: 'oc2Description',
        type: 'indicators',
        newPane: false,
        inputs: {
            'OPEN': {type: 'series', name: 'priceOpen', properties: {def:'o'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null}
        },
    
        outputs: {
            'OC2': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'oc2Title',
                    labels: ['value'],
                    fields: ['OC2'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'OC2', renderAs: 'Line', dataField: 'OC2', color: '#ff9800', width: 1.5, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    this.OC2.setValue(index, (this.OPEN.getValue(index) + this.CLOSE.getValue(index)) / 2);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
