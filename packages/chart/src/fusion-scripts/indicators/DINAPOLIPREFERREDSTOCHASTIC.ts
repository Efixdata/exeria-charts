import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDINAPOLIPREFERREDSTOCHASTICIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'diNapoliPreferredStochasticTitle',
        description: 'diNapoliPreferredStochasticDescription',
        subscriptionPack: 'diNapoliTools',
        type: 'indicators',
        newPane: true,
        inputs: {
            'HIGH': { type: 'series', name: 'priceHigh', properties: { def: 'h' }, value: null },
            'LOW': { type: 'series', name: 'priceLow', properties: { def: 'l' }, value: null },
            'CLOSE': { type: 'series', name: 'priceClose', properties: { def: 'c' }, value: null },
            'PERIOD': { type: 'integer', name: 'periods', properties: { max: 100, min: 0 }, value: 8 },
            'K_SLOW_PERIOD': { type: 'integer', name: 'kSlowPeriod', properties: { def: 3, max: 100, min: 0 }, value: 3 },
            'D_SLOW_PERIOD': { type: 'integer', name: 'dSlowPeriod', properties: { def: 3, max: 100, min: 0 }, value: 3 },
            'HI_BASELINE': { type: 'integer', name: 'hiBaseline', properties: { def: 80, max: 100, min: 0 }, value: 80 },
            'LO_BASELINE': { type: 'integer', name: 'loBaseline', properties: { def: 20, max: 100, min: 0 }, value: 20 },
        },
    
        outputs: {
    
            'SO': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'diNapoliPreferredStochasticTitle',
                    labels: ['SOLineK', 'SOLineD', 'SOBaseHI', 'SOBaseLO'],
                    fields: ['SOLineK', 'SOLineD', 'SOBaseHI', 'SOBaseLO'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOLineK', color: '#03a9f4', width: 1.5, dash: [], priceTag: true, priceLine: false },
            { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOLineD', color: '#f403ea', width: 1.5, dash: [], priceTag: true, priceLine: false },
            { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOBaseHI', color: '#607d8b', width: 1, dash: [], priceTag: false, priceLine: false },
            { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOBaseLO', color: '#607d8b', width: 1, dash: [], priceTag: false, priceLine: false },
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var SOController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id = '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['KSERIES']);
                    this.KSERIES = this.context.getRawSeriesWrapper(this.helper, 'KSERIES');
                }
    
                this.calculate = function (this: any, index: any) {
                    if (this.CLOSE.getValue(index) === null || this.HIGH.getValue(index) === null || this.LOW.getValue(index) === null) return;
                    this.SOBaseHI.setValue(index, this.HI_BASELINE);
                    this.SOBaseLO.setValue(index, this.LO_BASELINE);
    
                    var lo = FUSION.lib.getMin(this.LOW, index, this.PERIOD);
                    var hi = FUSION.lib.getMax(this.HIGH, index, this.PERIOD);
    
    
                    var diff = hi - lo;
    
                    this.KSERIES.setValue(index, 0);
                    if (diff > 0) this.KSERIES.setValue(index, 100 * (this.CLOSE.getValue(index) - lo) / diff);
    
    
                    this.SOLineK.setValue(index, FUSION.lib.getMMA(this.KSERIES, index, this.K_SLOW_PERIOD, this.SOLineK));
                    this.SOLineD.setValue(index, FUSION.lib.getMMA(this.SOLineK, index, this.D_SLOW_PERIOD, this.SOLineD));
                }
            };
            return new SOController(context, inputs, outputs);
        }
    
    }
}
