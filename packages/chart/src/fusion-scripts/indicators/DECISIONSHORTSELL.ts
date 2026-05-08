import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDECISIONSHORTSELLIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'decisionShortSellTitle',
        description: 'decisionShortSellDescription',
        subscriptionPack: 'importerExporterTools',
        type: 'indicators',
        newPane: false,
        inputs: {
            'CLOSE': {type: 'series', name: 'Price', properties: {def:'c'}, value: null},
        },
    
        outputs: {
            'SIGNAL': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'decisionShortSellTitle',
                    labels: ['signal'],
                    fields: ['SignalValue'],
                    data: null
                }
            },
            'SMA': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'smaTitle',
                    labels: ['value'],
                    fields: ['SMAValue'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'StrategyObject', dataLink: 'SIGNAL', renderAs: '', dataField: 'SignalValue', color: '#ff0000', width: 1, dash:[]},
            {type:'SeriesObject', dataLink: 'SMA', renderAs: 'Line', dataField: 'SMAValue', color: '#ff9800', width: 1.5, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries([
                        'returnRate'
                    ]);
                    this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');
    
                    this.PERIODS = 24;
                    this.PROGNOSIS_PERIODS = 120;
                    this.PROBABILITY = (1 - 50 / 100) / 2;
                }
                this.calculate = function (this: any, index: any) {
                    var signal = FUSION.DO_NOTHING;
                    this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PROGNOSIS_PERIODS));
                    this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));
    
                    if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
                        var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);
                        if(this.CLOSE.getValue(index) > values.upper) {
                            signal=FUSION.SELL;
                        }
                    }
                    
                    this.SignalValue.setValue(index, signal);
                }
            }
            return new Controller(context, inputs, outputs);
        }
    }
}
