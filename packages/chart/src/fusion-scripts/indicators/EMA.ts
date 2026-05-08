import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createEMAIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'emaTitle',
        description: 'emaDescription',
        type: 'indicators',
        newPane: false,
        inputs: {
    
            'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
            'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
    
        },
    
        outputs: {
    
            'EMA': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'emaTitle',
                    labels: ['value'],
                    fields: ['EMA'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'EMA', renderAs: 'Line', dataField: 'EMA', color: '#ff9800', width: 1.5, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var EMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    this.EMA.setValue(index, FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA));
                }
            };
    
            return new EMAController(context, inputs, outputs);
        }
    }
}
