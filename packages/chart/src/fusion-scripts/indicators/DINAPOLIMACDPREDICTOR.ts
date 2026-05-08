import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDINAPOLIMACDPREDICTORIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'diNapoliMacdPredictorTitle',
        description: 'diNapoliMacdPredictorDescription',
        subscriptionPack: 'diNapoliTools',
        type: 'indicators',
        newPane: false,
        inputs: {
            'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
            'SHIFT': { type: 'integer', name: 'shift', properties: { def: 1, max: 999, min: 0 }, value: 1 },
        },
    
        outputs: {
            'MACDPredictor': {
                type: 'series',
                series: {
                    seriesId: null,
                    title: 'diNapoliMacdPredictorTitle',
                    labels: ['value'],
                    fields: ['MACDPredictorValue'],
                    data: null
                }
            }
        },
    
        plotters: [
            { type: 'SeriesObject', dataLink: 'MACDPredictor', renderAs: 'Line', dataField: 'MACDPredictorValue', color: '#f44336', width: 1.5, dash: [], priceTag: true, priceLine: false }
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var MACDPredictorController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id = '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['EMA1', 'EMA2', 'MACD', 'SIGNAL']);
                    this.EMA1 = this.context.getRawSeriesWrapper(this.helper, 'EMA1');
                    this.EMA2 = this.context.getRawSeriesWrapper(this.helper, 'EMA2');
                    this.MACD = this.context.getRawSeriesWrapper(this.helper, 'MACD');
                    this.SIGNAL = this.context.getRawSeriesWrapper(this.helper, 'SIGNAL');
    
                    this.SMOOTHINGFACTOR1 = 0.213;
                    this.SMOOTHINGFACTOR2 = 0.108;
                    this.SIGNALLINESMOOTHINGFACTOR = 0.199;
                }
    
                this.calculate = function (this: any, index: any) {
                    var ema1Periods = 8;
                    var ema2Periods = 18;
                    var signalPeriods = 9;
                    var mp1 = 1 / 0.105;
                    var mp2 = 1.574 / 0.210;
                    var mp3 = 1.784 / 0.210;
    
                    if (this.CLOSE.getValue(index) === null) return;
    
                    if (this.EMA1.getValue(index - 1) !== null) {
                        this.EMA1.setValue(index, this.EMA1.getValue(index - 1) + this.SMOOTHINGFACTOR1 * (this.CLOSE.getValue(index) - this.EMA1.getValue(index - 1)));
                    } else {
                        this.EMA1.setValue(index, FUSION.lib.getMA(this.CLOSE, index, ema1Periods));
                    }
    
                     
                    if (this.EMA2.getValue(index - 1) !== null) {
                        this.EMA2.setValue(index, this.EMA2.getValue(index - 1) + this.SMOOTHINGFACTOR2 * (this.CLOSE.getValue(index) - this.EMA2.getValue(index - 1)));
                        this.MACD.setValue(index, this.EMA1.getValue(index) - this.EMA2.getValue(index));
                    } else {
                        this.EMA2.setValue(index, FUSION.lib.getMA(this.CLOSE, index, ema2Periods));
                        if (this.EMA1.getValue(index) === null || this.EMA2.getValue(index) === null) return;
                        this.MACD.setValue(index, this.EMA1.getValue(index) - this.EMA2.getValue(index));
                    }
    
                    
                    if (this.EMA1.getValue(index) !== null || this.EMA2.getValue(index) !== null || this.MACD.getValue(index) !== null || this.SIGNAL.getValue(index - 1) !== null) {
                        this.SIGNAL.setValue(index, this.SIGNAL.getValue(index - 1) + (this.SIGNALLINESMOOTHINGFACTOR * (this.MACD.getValue(index) - this.SIGNAL.getValue(index - 1))));
                        if (this.SIGNAL.getValue(index) === null || this.SIGNAL.getValue(index - 1) === null) return;
                        var macdPredictor = this.SIGNAL.getValue(index) * mp1 - this.EMA1.getValue(index) * mp2 + this.EMA2.getValue(index) * mp3;
                        this.MACDPredictorValue.setValue(index + this.SHIFT, macdPredictor);
                    } else {
                        this.SIGNAL.setValue(index, FUSION.lib.getMA(this.MACD, index, signalPeriods));
                    }
    
    
                }
            };
    
            return new MACDPredictorController(context, inputs, outputs);
        }
    }
}
