import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createUltimateOSCIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'ultimateOscillatorTitle',
        description: 'ultimateOscillatorDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'FPERIOD': {type: 'integer', name: 'firstPeriod', properties: {def: 7, max: 100, min: 0}, value: 7},
            'SPERIOD': {type: 'integer', name: 'secondPeriod', properties: {def: 14, max: 100, min: 0}, value: 14},
            'TPERIOD': {type: 'integer', name: 'thirdPeriod', properties: {def: 28, max: 100, min: 0}, value: 28},
        },
    
        outputs: {
    
            'UO': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'ultimateOscillatorDescription',
                    labels: ['value'],
                    fields: ['UltimateOsc'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'UO', renderAs: 'Line', dataField: 'UltimateOsc', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var UOController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['TRUERANGE','BPSERIES']);
                    this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
                    this.BPSERIES = this.context.getRawSeriesWrapper(this.helper, 'BPSERIES');
                }
    
                this.calculate = function (this: any, index: any) {
    
                    var tr = FUSION.lib.getTrueRange(this.HIGH,this.LOW,this.CLOSE,index);
                    var tl = FUSION.lib.getTrueLow(this.CLOSE,this.LOW,index);
                    var bp = this.CLOSE.getValue(index) - tl;
    
                    this.TRUERANGE.setValue(index, tr);
                    this.BPSERIES.setValue(index, bp);
    
                    var atr1 = FUSION.lib.getMA (this.TRUERANGE, index, this.FPERIOD);
                    var atr2 = FUSION.lib.getMA (this.TRUERANGE, index, this.SPERIOD);
                    var atr3 = FUSION.lib.getMA (this.TRUERANGE, index, this.TPERIOD);
                    var abp1 = FUSION.lib.getMA (this.BPSERIES, index, this.FPERIOD);
                    var abp2 = FUSION.lib.getMA (this.BPSERIES, index, this.SPERIOD);
                    var abp3 = FUSION.lib.getMA (this.BPSERIES, index, this.TPERIOD);
    
                    if (atr1 && atr2 && atr3 && abp1 && abp2 && abp3) {
                        var v = (abp1 / atr1 * 4 + abp2 / atr2 * 2 + abp3 / atr3) / 7 * 100;
                        this.UltimateOsc.setValue(index,v);
                    }
                }
            };
            return new UOController(context, inputs, outputs);
        }
    
    }
}
