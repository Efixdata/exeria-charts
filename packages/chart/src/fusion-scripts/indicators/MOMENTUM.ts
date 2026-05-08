import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createMOMENTUMIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'momentumTitle',
        description: 'momentumDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
            'MODE': {type: 'list', name: 'method', properties: {},list: ['Quotient', 'Difference'], value: 'Quotient'},
        },
    
        outputs: {
    
            'MOMENTUM': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'momentumTitle',
                    labels: ['momentumTitle'],
                    fields: ['MOMENTUM',],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'MOMENTUM', renderAs: 'Line', dataField: 'MOMENTUM', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        ]
        ,
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var MOMENTUMController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    if (this.CLOSE.getValue(index) === null) return;
                    var displace = FUSION.lib.displace(this.CLOSE, index, this.PERIODS);
                    if (displace === null) return;
    
                    if (this.MODE === 'Quotient')//!DIVMODE)
                    {
                        this.MOMENTUM.setValue(index, 100 * this.CLOSE.getValue(index) / displace);
                    }
                    else
                    {
                        this.MOMENTUM.setValue(index, this.CLOSE.getValue(index) - displace);
                    }
                }
            };
            return new MOMENTUMController(context, inputs, outputs);
        }
    
    }
}
