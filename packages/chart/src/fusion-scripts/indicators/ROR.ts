import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createRORIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'rorTitle',
        description: 'rorDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'PRICE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
            'RORPERIODS': {type: 'integer', name: 'rorPeriods', properties: {max: 200, min: 0}, value: 21},
            'PERIODS': {type: 'integer', name: 'sharpePeriods', properties: {max: 999, min: 0}, value: 220}
        },
    
        outputs: {
            'ROR': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'rorTitle',
                    labels: ['rorDescription', 'stddev'],
                    fields: ['ROR', 'STD'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'ROR', renderAs: 'Line', dataField: 'ROR', color: '#ee4336', width: 1.5, dash:[], priceTag: true, priceLine: false},
            {type:'SeriesObject', dataLink: 'ROR', renderAs: 'Line', dataField: 'STD', color: '#03a9f4', width: 1.5, dash:[2, 2], priceTag: false, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['RATEOFRETURN', 'RATEOFRETURNSUM']);
                    this.RATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURN');
                    this.RATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURNSUM');
                }
    
                this.calculate = function (this: any, index: any) {
                    const el = this.PRICE.getValue(index);
                    const prevEl = this.PRICE.getValue(index - this.RORPERIODS);
    
                    if (!el || !prevEl) return;
    
                    const rateOfReturn = (el - prevEl) / prevEl;
                    this.RATEOFRETURN.setValue(index, rateOfReturn);
    
                    const rateOfReturnSum = FUSION.lib.getSum(this.RATEOFRETURN, index, this.PERIODS, this.RATEOFRETURNSUM);
                    this.RATEOFRETURNSUM.setValue(index, rateOfReturnSum);
    
                    const averageRateOfReturn = rateOfReturnSum / this.PERIODS;
                    const std = FUSION.lib.getStdDev(this.RATEOFRETURN, index, this.PERIODS);
    
                    if (index < this.PERIODS + this.RORPERIODS) return;
    
                    this.ROR.setValue(index, averageRateOfReturn);
                    this.STD.setValue(index, std);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
