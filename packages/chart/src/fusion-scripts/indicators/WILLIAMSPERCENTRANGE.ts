import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createWILLIAMSPERCENTRANGEIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'williamsPercentRangeTitle',
        description: 'williamsPercentRangeDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'PERIOD': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
            'HI_BASELINE': {type: 'integer', name: 'hiBaseline', properties: {def: -20, max: 999, min: -999}, value: -20},
            'LO_BASELINE': {type: 'integer', name: 'loBaseline', properties: {def: -80, max: 999, min: -999}, value: -80},
        },
    
        outputs: {
    
            'WILLIAMSPERCENTRANGE': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'williamsPercentRangeTitle',
                    labels: ['williamsPercentRangeTitle', 'hiBaseline', 'loBaseline'],
                    fields: ['WPR', 'BaseHI', 'BaseLO'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'WILLIAMSPERCENTRANGE', renderAs: 'Line', dataField: 'WPR', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: false},
            {type:'SeriesObject', dataLink: 'WILLIAMSPERCENTRANGE', renderAs: 'Line', dataField: 'BaseHI', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
            {type:'SeriesObject', dataLink: 'WILLIAMSPERCENTRANGE', renderAs: 'Line', dataField: 'BaseLO', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    this.BaseHI.setValue(index, this.HI_BASELINE);
                    this.BaseLO.setValue(index, this.LO_BASELINE);
    
                    var close = this.CLOSE.getValue(index);
                    var high = FUSION.lib.getMax(this.HIGH, index, this.PERIOD);
                    var low = FUSION.lib.getMin(this.LOW, index, this.PERIOD);
                    if (close === null || high === null || low === null) return;
                    
                    var wpr = (high - close) / (high - low) * (-100);
                    this.WPR.setValue(index, wpr);
                }
            };
            return new Controller(context, inputs, outputs);
        }
    }
}
