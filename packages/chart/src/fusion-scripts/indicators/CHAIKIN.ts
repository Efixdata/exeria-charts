import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCHAIKINIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'chaikinTitle',
        description: 'chaikinDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'MPERIOD': {type: 'integer', name: 'mavPeriods', properties: {max: 100, min: 0}, value: 10},
            'RPERIOD': {type: 'integer', name: 'rovPeriods', properties: {max: 200, min: 0}, value: 10},
        },
    
        outputs: {
    
            'CHAIKIN': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'chaikinDescription',
                    labels: ['chaikinTitle'],
                    fields: ['CHAIKIN'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'CHAIKIN', renderAs: 'Line', dataField: 'CHAIKIN', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false}
        ]
        ,
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var CHAIKINController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.emaf = function (this: any, series1: any, series2: any, idx: any, pds: any, prev: any) {
                    if (series1.getValue(idx) === null || series2.getValue(idx) === null) {
                        return null;
                    }
                    if (series1.getValue(idx - pds) === null || series2.getValue(idx - pds) === null) {
                        return null;
                    }
    
                    if (prev.getValue(idx - 1) === null) {
                        var sum = 0;
                        for (var i = idx - pds + 1; i <= idx; i++) {
                            if (series1.getValue(i) === null || series2.getValue(i) === null) return null;
                            sum = sum + (series1.getValue(i) - series2.getValue(i));
                        }
                        sum = sum / pds;
                        return sum;
                    } else {
                        var alfa = 2 / (pds+1);
                        var value = series1.getValue(idx)-series2.getValue(idx);
                        var yesterday = prev.getValue(idx-1);
                        var a = alfa*value + (1-alfa)*yesterday;
                        return a;
                    }
                }            
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['EMA']);
                    this.EMA = this.context.getRawSeriesWrapper(this.helper, 'EMA');
                }
    
                this.calculate = function (this: any, index: any) {
                    var ema = this.emaf(this.HIGH, this.LOW, index, this.MPERIOD, this.EMA);
                    this.EMA.setValue(index, ema);
                    if (ema === null || this.EMA.getValue(index - this.RPERIOD) === null || this.EMA.getValue(index - this.RPERIOD) === null) return;
    
                    if (index>this.RPERIOD-1) {
                        var vc =  100 * (ema - this.EMA.getValue(index - this.RPERIOD)) / this.EMA.getValue(index - this.RPERIOD);
                        this.CHAIKIN.setValue(index,vc);
                    }
                }
            };
            return new CHAIKINController(context, inputs, outputs);
        }
    
    }
}
