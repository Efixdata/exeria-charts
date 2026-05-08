import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createINFORMATIONRATIOIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'informationRatioTitle',
        description: 'informationRatioDescription',
        type: 'indicators',
        newPane: true,
        quickAdd: false,
        inputs: {
            'EL': {type: 'series', name: 'equityLine', properties: {def:'EQUITY'}, value: null},
            'RORPERIODS': {type: 'integer', name: 'rorPeriods', properties: {max: 200, min: 0}, value: 21},
            'PERIODS': {type: 'integer', name: 'informationRatioPeriods', properties: {max: 999, min: 0}, value: 220},
            'BENCHMARK': {type: 'series', name: 'benchmark', properties: {def:'c'}, value: null},
        },
    
        outputs: {
            'INFORMATIONRATIO': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'informationRatioTitle',
                    labels: ['informationRatioTitle', 'portfolioReturn', 'benchmarkReturn', 'trackingError'],
                    fields: ['INFORMATIONRATIO', 'PORTFOLIORETURN', 'BENCHMARKRETURN', 'TRACKINGERROR'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'INFORMATIONRATIO', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false},
            {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'PORTFOLIORETURN', color: '#ee4336', width: 1.5, dash:[], priceTag: false, priceLine: false},
            {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'BENCHMARKRETURN', color: '#9e9e9e', width: 1.5, dash:[], priceTag: false, priceLine: false},
            {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'TRACKINGERROR', color: '#03a9f4', width: 1.5, dash:[2, 2], priceTag: false, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['RATEOFRETURN', 'RATEOFRETURNSUM', 'BENCHMARKRATEOFRETURN', 'BENCHMARKRATEOFRETURNSUM', 'DIFFERENCE']);
    
                    this.RATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURN');
                    this.RATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURNSUM');
                    this.BENCHMARKRATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'BENCHMARKRATEOFRETURN');
                    this.BENCHMARKRATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'BENCHMARKRATEOFRETURNSUM');
                    this.DIFFERENCE = this.context.getRawSeriesWrapper(this.helper, 'DIFFERENCE');
                }
    
                this.calculate = function (this: any, index: any) {
                    // PORTFOLIO RETURN
                    const el = this.EL.getValue(index);
                    const prevEl = this.EL.getValue(index - this.RORPERIODS);
    
                    if (!el || !prevEl) return;
    
                    const rateOfReturn = (el - prevEl) / prevEl;
                    this.RATEOFRETURN.setValue(index, rateOfReturn);
    
                    const rateOfReturnSum = FUSION.lib.getSum(this.RATEOFRETURN, index, this.PERIODS, this.RATEOFRETURNSUM);
                    this.RATEOFRETURNSUM.setValue(index, rateOfReturnSum);
    
                    const averageRateOfReturn = rateOfReturnSum / this.PERIODS;
    
                    // BENCHMARK RETURN
                    const benchmarkPrice = this.BENCHMARK.getValue(index);
                    const prevBenchmarkPrice = this.BENCHMARK.getValue(index - this.RORPERIODS);
    
                    if (!benchmarkPrice || !prevBenchmarkPrice) return;
    
                    const benchmarkRateOfReturn = (benchmarkPrice - prevBenchmarkPrice) / prevBenchmarkPrice;
                    this.BENCHMARKRATEOFRETURN.setValue(index, benchmarkRateOfReturn);
    
                    const benchmarkRateOfReturnSum = FUSION.lib.getSum(this.BENCHMARKRATEOFRETURN, index, this.PERIODS, this.BENCHMARKRATEOFRETURNSUM);
                    this.BENCHMARKRATEOFRETURNSUM.setValue(index, benchmarkRateOfReturnSum);
    
                    const benchmarkAverageRateOfReturn = benchmarkRateOfReturnSum / this.PERIODS;
    
                    // STD
                    const difference = rateOfReturn - benchmarkRateOfReturn;
                    this.DIFFERENCE.setValue(index, difference);
    
                    if (index < this.PERIODS + this.RORPERIODS) return;
    
                    // TRACKING ERROR
                    const trackingError = FUSION.lib.getStdDev(this.DIFFERENCE, index, this.PERIODS);
                    const informationRatio = (averageRateOfReturn - benchmarkAverageRateOfReturn) / trackingError;
    
                    this.TRACKINGERROR.setValue(index, trackingError);
                    this.PORTFOLIORETURN.setValue(index, averageRateOfReturn);
                    this.BENCHMARKRETURN.setValue(index, benchmarkAverageRateOfReturn);
                    this.INFORMATIONRATIO.setValue(index, informationRatio);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
