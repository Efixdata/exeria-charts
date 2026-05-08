import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createALMAIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'almaTitle',
        description: 'almaDescription',
        type: 'indicators',
        newPane: false,
    
        inputs: {
            'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
            'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 9},
            'OFFSET': {type: 'double', name: 'offset', properties: {max: 200, min: 0}, value: 0.85},
            'SIGMA': {type: 'integer', name: 'sigma', properties: {max: 200, min: 0}, value: 6}
        },
    
        outputs: {
            'ALMA': {
                type: 'series',
                series: {
                    seriesId: null,
                    title: 'almaTitle',
                    labels: ['value'],
                    fields: ['ALMA'],
                    data: null
                }
            }
        },
    
        plotters: [
            {
                type:'SeriesObject',
                dataLink: 'ALMA',
                renderAs: 'Line',
                dataField: 'ALMA',
                color: '#00bcd4',
                width: 1.5,
                dash:[],
                priceTag: false,
                priceLine: false
            }
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    if (this.CLOSE.getValue(index) === null || index < this.PERIODS - 1) return;
    
                    let eq = 0;
                    let wtd = 0;
                    let wtdSum = 0;
                    let wtdCum = 0;
                    
                    for (let i = this.PERIODS - 1; i > 0; --i) {
                        eq = -1 * (Math.pow(i - this.OFFSET, 2) / (Math.pow(this.SIGMA ,2)));
                        wtd = Math.exp(eq);
                        wtdSum += wtd * this.CLOSE.getValue(index - i + 1);
                        wtdCum += wtd;
                    }
    
                    this.ALMA.setValue(index, wtdSum / wtdCum);
                }
    
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
