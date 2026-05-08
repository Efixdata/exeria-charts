import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createHeikinAshiIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'hashiTitle',
        description: 'hashiDescription',
        type: 'indicators',
        newPane: true,
        centerZero: false,
        inputs: {
            'OPEN': {type: 'series', name: 'priceOpen', properties: {def: 'o'}, value: null},
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def: 'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def: 'l'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def: 'c'}, value: null}
        },
    
        outputs: {
            'HeikinAshi': {
                type: 'series', 
                series: {
                    seriesId: null,
                    title: 'hashiTitle',
                    labels: ['hashiOpen', 'hashiHigh', 'hashiLow', 'hashiClose'],
                    fields: ['o', 'h', 'l', 'c'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type: 'SeriesObject', dataLink: 'HeikinAshi', renderAs: 'OHLC', openDataField: 'o', highDataField: 'h', lowDataField: 'l', closeDataField: 'c', dataField: 'o', color: '#f44336', width: 1.5, dash: [], priceTag: true, priceLine: true}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var HaController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {};
    
                this.calculate = function (this: any, INDEX: any) {
                    var open = this.OPEN.getValue(INDEX);
                    var high = this.HIGH.getValue(INDEX);
                    var low = this.LOW.getValue(INDEX);
                    var close = this.CLOSE.getValue(INDEX);
                    var o1 = this.o.getValue(INDEX - 1) || this.OPEN.getValue(INDEX - 1);
                    var c1 = this.c.getValue(INDEX - 1);
    
                    if (open === null || high === null || close === null || o1 === null) return;
    
                    if (c1 === null) {
                        if (this.OPEN.getValue(INDEX - 1) === null || this.HIGH.getValue(INDEX - 1) === null || this.LOW.getValue(INDEX - 1) === null || this.CLOSE.getValue(INDEX - 1) === null) return;
                        c1 = (this.OPEN.getValue(INDEX - 1) + this.HIGH.getValue(INDEX - 1) + this.LOW.getValue(INDEX - 1) + this.CLOSE.getValue(INDEX - 1)) / 4;
                    }
    
                    var tmpHaClose = (open + high + low + close) / 4;
                    var tmpHaOpen = (o1 + c1) / 2;
    
                    this.o.setValue(INDEX, tmpHaOpen);
                    this.c.setValue(INDEX, tmpHaClose);
                    this.h.setValue(INDEX, Math.max(high, tmpHaOpen, tmpHaClose));
                    this.l.setValue(INDEX, Math.min(low, tmpHaOpen, tmpHaClose));
                };
            };
    
            return new HaController(context, inputs, outputs);
        }
    }
}
