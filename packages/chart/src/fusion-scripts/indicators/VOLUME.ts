import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createVOLUMEIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'volumeTitle',
        description: 'volumeDescription',
        type: 'indicators',
        newPane: false,
        inputs: {
            'CLOSE': {type: 'series', name: 'price', properties: {def:'v'}, value: null},
        },
    
        outputs: {
    
            'VOLUME': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'volumeTitle',
                    labels: ['value'],
                    fields: ['VOLUME'],
                    precisions: [2],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'VOLUME', renderAs: 'Volume Histogram', renderLegend: false, dataField: 'VOLUME', color: '#f44336', width: 1.5, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var VOLUMEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    this.VOLUME.setValue(index, this.CLOSE.getValue(index));
                }
            };
    
            return new VOLUMEController(context, inputs, outputs);
        }
    }
}
