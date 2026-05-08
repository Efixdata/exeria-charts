import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCHAIKINOSCILLATORIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'chaikinOscillatorTitle',
        description: 'chaikinOscillatorDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
            'PERIOD1': {type: 'integer', name: 'firstPeriod', properties: {max: 200, min: 0}, value: 3},
            'PERIOD2': {type: 'integer', name: 'secondPeriod', properties: {max: 200, min: 0}, value: 10},
        },
        outputs: {
            'CHAIKINOSCILLATOR': {
                type: 'series',
                series: {
                    seriesId: null,
                    title: 'chaikinOscillatorTitle',
                    labels: ['value'],
                    fields: ['CHAIKINOSCILLATOR'],
                    data: null
                }
            }
        },
    
        plotters: [
            {
                type:'SeriesObject',
                dataLink: 'CHAIKINOSCILLATOR',
                renderAs: 'Line',
                dataField: 'CHAIKINOSCILLATOR',
                color: '#ff9800',
                width: 1.5,
                dash:[],
                priceTag: true,
                priceLine: false
            }
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries([
                        'ADL',
                        'EMA1',
                        'EMA2'
                    ]);
                    this.ADL = this.context.getRawSeriesWrapper(this.helper, 'ADL');
                    this.EMA1 = this.context.getRawSeriesWrapper(this.helper, 'EMA1');
                    this.EMA2 = this.context.getRawSeriesWrapper(this.helper, 'EMA2');
                }
    
                this.calculate = function (this: any, index: any) {
                    var high = this.HIGH.getValue(index);
                    var low = this.LOW.getValue(index);
                    var close = this.CLOSE.getValue(index);
                    var volume = this.VOLUME.getValue(index);
                    var lastADL = this.ADL.getValue(index - 1);
    
                    if (high === null || low === null || close === null || volume === null || (high - low) === 0) {
                        this.ADL.setValue(index, lastADL);
                        return;
                    }
    
                    var currentADL = (close - low - high + close) / (high - low) * volume;
                    this.ADL.setValue(index, lastADL + currentADL);
    
                    this.EMA1.setValue(index, FUSION.lib.getEMA(this.ADL, index, this.PERIOD1, this.EMA1));
                    this.EMA2.setValue(index,FUSION.lib.getEMA(this.ADL, index, this.PERIOD2, this.EMA2));
    
                    this.CHAIKINOSCILLATOR.setValue(index, this.EMA1.getValue(index) - this.EMA2.getValue(index));
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
