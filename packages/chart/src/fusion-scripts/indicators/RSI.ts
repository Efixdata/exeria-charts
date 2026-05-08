import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createRSIIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'rsiTitle',
        description: 'rsiDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'PERIOD': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
            'HI_BASELINE': {type: 'integer', name: 'hiBaseline', properties: {def: 70, max: 100, min: 0}, value: 70},
            'LO_BASELINE': {type: 'integer', name: 'loBaseline', properties: {def: 30, max: 100, min: 0}, value: 30},
        },
    
        outputs: {
    
            'RSI': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'rsiDescription',
                    labels: ['rsiTitle', 'RSIBaseHI', 'RSIBaseLO'],
                    fields: ['RSI','RSIBaseHI','RSIBaseLO'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'RSI', renderAs: 'Line', dataField: 'RSI', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
            {type:'SeriesObject', dataLink: 'RSI', renderAs: 'Line', dataField: 'RSIBaseHI', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
            {type:'SeriesObject', dataLink: 'RSI', renderAs: 'Line', dataField: 'RSIBaseLO', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var RSIController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['AU', 'AD','MAU','TRUERANGE']);
                    this.AU = this.context.getRawSeriesWrapper(this.helper, 'AU');
                    this.AD = this.context.getRawSeriesWrapper(this.helper, 'AD');
                    this.MAU = this.context.getRawSeriesWrapper(this.helper, 'MAU');
                    this.MAD = this.context.getRawSeriesWrapper(this.helper, 'MAD');
                }
    
                this.calculate = function (this: any, index: any) {
                    this.AU.setValue(index, 0);
                    this.AD.setValue(index, 0);
                    this.MAU.setValue(index, 0);
                    this.MAD.setValue(index, 0);
                    this.RSIBaseHI.setValue(index, this.HI_BASELINE);
                    this.RSIBaseLO.setValue(index, this.LO_BASELINE);
    
                    if (index > this.PERIOD-1) {
                        if (this.CLOSE.getValue(index) === null || this.CLOSE.getValue(index - 1) === null) return;
                        var diff = this.CLOSE.getValue(index) - this.CLOSE.getValue(index-1);
    
                        if (diff > 0) {
    
                            this.AU.setValue(index, diff);
                            this.AD.setValue(index, 0);
    
                        } else {
    
                            this.AU.setValue(index, 0);
                            this.AD.setValue(index, -diff);
    
                        }
    
    
                        var mmaAU = FUSION.lib.getMMA (this.AU, index, this.PERIOD, this.MAU);
                        var mmaAD = FUSION.lib.getMMA (this.AD, index, this.PERIOD, this.MAD);
                        this.MAU.setValue(index, mmaAU);
                        this.MAD.setValue(index, mmaAD);
                        if (mmaAU === null || mmaAD === null) return;
                        if (mmaAU+mmaAD==0) this.RSI.setValue(index,this.LO_BASELINE+((this.HI_BASELINE-this.LO_BASELINE)/2));
                        else
                            this.RSI.setValue(index, 100 * mmaAU / (mmaAU + mmaAD));
                    }
    
    
                }
            };
            return new RSIController(context, inputs, outputs);
        }
    
    }
}
