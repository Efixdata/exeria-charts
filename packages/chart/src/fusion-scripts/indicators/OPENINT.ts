import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createOPENINTIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'openintTitle',
        description: 'openintDescription',
        type: 'indicators',
        newPane: true,
        quickAdd: false,
        inputs: {
            'CLOSE': {type: 'series', name: 'price', properties: {def:'i'}, value: null},
        },
    
        outputs: {
    
            'OPENINT': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'openintTitle',
                    labels: ['value'],
                    fields: ['OPENINT'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'OPENINT', renderAs: 'Line', dataField: 'OPENINT', color: '#f44336', width: 1.5, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var OPENINTController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    this.OPENINT.setValue(index, this.CLOSE.getValue(index));
                }
            };
    
            return new OPENINTController(context, inputs, outputs);
        }
    }
}
