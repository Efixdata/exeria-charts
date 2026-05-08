import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createHLINEIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'hlineTitle',
        description: 'hlineDescription',
        type: 'indicators',
        newPane: false,
        quickAdd: false,
        inputs: {
    
            'VALUE': {type: 'double', name: 'value', properties: {max: 2000000, min: -2000000}, value: 1}
    
        },
    
        outputs: {
    
            'HLINE': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'hlineTitle',
                    labels: ['value'],
                    fields: ['HLINEValue'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'HLINE', renderAs: 'Line', dataField: 'HLINEValue', color: '#ffc107', width: 1, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var HLINEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
    
                }
    
                this.calculate = function (this: any, index: any) {
                    this.HLINEValue.setValue(index, this.VALUE);
                }
    
            };
    
            return new HLINEController(context, inputs, outputs);
        }
    }
}
