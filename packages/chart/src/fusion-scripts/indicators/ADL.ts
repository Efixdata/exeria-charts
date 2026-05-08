import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createADLIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'adlTitle',
        description: 'adlDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
        },
        outputs: {
            'ADL': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'adlTitle',
                    labels: ['value'],
                    fields: ['ADLValue'],
                    data: null
                }
            }
        },
        plotters: [
            {type:'SeriesObject', dataLink: 'ADL', renderAs: 'Line', dataField: 'ADLValue', color: '#ff9800', width: 1.5, dash:[]}
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    var high = this.HIGH.getValue(index);
                    var low = this.LOW.getValue(index);
                    var close = this.CLOSE.getValue(index);
                    var volume = this.VOLUME.getValue(index);
                    var lastADL = this.ADLValue.getValue(index - 1);
    
                    if (high === null || low === null || close === null || volume === null || (high - low) === 0) {
                        this.ADLValue.setValue(index, lastADL);
                        return;
                    }
    
                    var currentADL = (close - low - high + close) / (high - low) * volume;
                    this.ADLValue.setValue(index, lastADL + currentADL);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
