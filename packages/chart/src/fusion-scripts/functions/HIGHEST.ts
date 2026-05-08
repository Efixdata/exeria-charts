import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createHIGHESTFunctionScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'highestTitle',
        description: 'highestDescription',
        type: 'functions',
        newPane: false,
        inputs: {
            'HIGH': {type: 'series', name: 'price', properties: {def:'h'}, value: null},
            'PERIODS': {type: 'integer', name: 'period', properties: {def: 25, max: 100, min: 0}, value: 25},
        },
    
        outputs: {
            'HIGHEST': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'highestTitle',
                    labels: ['value'],
                    fields: ['HIGHEST'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'HIGHEST', renderAs: 'Line', dataField: 'HIGHEST', color: '#8bc34a', width: 1.5, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var HIGHESTController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    this.HIGHEST.setValue(index, FUSION.lib.getMax(this.HIGH, index, this.PERIODS));
                }
            };
    
            return new HIGHESTController(context, inputs, outputs);
        }
    }
}
