import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createHL2IndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'hl2Title',
        description: 'hl2Description',
        type: 'indicators',
        newPane: false,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null}
        },
    
        outputs: {
            'HL2': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'hl2Title',
                    labels: ['value'],
                    fields: ['HL2'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'HL2', renderAs: 'Line', dataField: 'HL2', color: '#ff9800', width: 1.5, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    this.HL2.setValue(index, (this.HIGH.getValue(index) + this.LOW.getValue(index)) / 2);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
