import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createVWMAIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'vwmaTitle',
        description: 'vwmaDescription',
        type: 'indicators',
        newPane: false,
        inputs: {
            'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
            'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
            'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 20},
        },
    
        outputs: {
            'VWMA': {
                type: 'series',
                series: {
                    seriesId: null,
                    title: 'vwmaTitle',
                    labels: ['value'],
                    fields: ['VWMA'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'VWMA', renderAs: 'Line', dataField: 'VWMA', color: '#3f51b5', width: 1.5, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['CV']);
                    this.CV = this.context.getRawSeriesWrapper(this.helper, 'CV');
                }
    
                this.calculate = function (this: any, index: any) {
                    this.CV.setValue(index, this.CLOSE.getValue(index) * this.VOLUME.getValue(index));
                    var cvma = FUSION.lib.getMA(this.CV, index, this.PERIODS);
                    var vma = FUSION.lib.getMA(this.VOLUME, index, this.PERIODS);
                    this.VWMA.setValue(index, cvma / vma);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
