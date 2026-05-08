import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createTRENDIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'trendTitle',
        description: 'trendDescription',
        type: 'indicators',
        newPane: true,
        quickAdd: false,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'INDICATOR': {type: 'series', name: 'indicator', properties: {}, value: null},
        },
    
        outputs: {
    
            'TREND': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'trendTitle',
                    labels: ['trendTitle'],
                    fields: ['TREND'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'TREND', renderAs: 'Line', dataField: 'TREND', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var TRENDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {	}
    
                this.calculate = function (this: any, index: any) {
    
                    if (this.INDICATOR.getValue(index) === null || this.HIGH.getValue(index) === null || this.LOW.getValue(index) === null) return;
                    this.TREND.setValue(index,0);
                    if (this.INDICATOR.getValue(index)>=this.HIGH.getValue(index)) {
                        this.TREND.setValue(index,-1);
                    } else
                    if (this.INDICATOR.getValue(index)<=this.LOW.getValue(index)) {
                        this.TREND.setValue(index,1);
                    }
                }
            };
            return new TRENDController(context, inputs, outputs);
        }
    
    }
}
