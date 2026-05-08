import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDMAIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'dmaTitle',
        description: 'dmaDescription',
        type: 'indicators',
        newPane: false,
        inputs: {
            'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
            'PERIODS': { type: 'integer', name: 'periods', properties: { max: 200, min: 1 }, value: 3 },
            'DISPLACEMENT': { type: 'integer', name: 'displacement', properties: { max: 200, min: 1 }, value: 3 },
        },
        outputs: {
            'DMA': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'dmaTitle',
                    labels: ['value'],
                    fields: ['DMA'],
                    data: null
                }
            }
        },
        plotters: [{
            type: 'SeriesObject',
            dataLink: 'DMA',
            renderAs: 'Line',
            dataField: 'DMA',
            color: '#ff9800',
            width: 1.5,
            dash: []
        }],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var DMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id = '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    if (index < this.PERIODS) {
                        return;
                    } else if (index < (this.DISPLACEMENT + this.PERIODS)) {
                        this.DMA.setValue(index + this.DISPLACEMENT, this.CLOSE.getValue(index));
                    } else {
                        this.DMA.setValue(index + this.DISPLACEMENT, FUSION.lib.getMA(this.CLOSE, index, this.PERIODS));
                    }
                }
            };
    
            return new DMAController(context, inputs, outputs);
        }
    }
}
