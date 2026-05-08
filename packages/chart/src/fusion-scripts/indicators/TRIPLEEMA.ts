import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createTRIPLEEMAIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'tripleExponentialAverageTitle',
        description: 'tripleExponentialAverageDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 1}, value: 24},
        },
    
        outputs: {
            'TRIPLEEMA': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'tripleExponentialAverageTitle',
                    labels: ['value'],
                    fields: ['TripleEma'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'TRIPLEEMA', renderAs: 'Line', dataField: 'TripleEma', color: '#f44336', width: 1, dash:[], priceTag: true, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['EMAC', 'EMAEMAC', 'EMAEMAEMAC']);
                    this.EMAC = this.context.getRawSeriesWrapper(this.helper, 'EMAC');
                    this.EMAEMAC = this.context.getRawSeriesWrapper(this.helper, 'EMAEMAC');
                    this.EMAEMAEMAC = this.context.getRawSeriesWrapper(this.helper, 'EMAEMAEMAC');
                }
    
                this.calculate = function (this: any, index: any) {
                    var close = this.CLOSE.getValue(index);
                    if (close === null) return
    
                    var emaC = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMAC);
                    if (emaC === null) return;
                    this.EMAC.setValue(index, emaC);
    
                    var emaEmaC = FUSION.lib.getEMA(this.EMAC, index, this.PERIODS, this.EMAEMAC);
                    if(emaEmaC === null) return;
                    this.EMAEMAC.setValue(index, emaEmaC);
    
                    var emaEmaEmaC = FUSION.lib.getEMA(this.EMAEMAC, index, this.PERIODS, this.EMAEMAEMAC);
                    if(emaEmaEmaC === null) return;
                    this.EMAEMAEMAC.setValue(index, emaEmaEmaC);
    
                    var emaEmaEmaC1 = this.EMAEMAEMAC.getValue(index - 1);
                    if (emaEmaEmaC1 === null) return;
    
                    this.TripleEma.setValue(index, (emaEmaEmaC - emaEmaEmaC1) / emaEmaEmaC1);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
