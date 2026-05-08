import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDINAPOLIDETRENDOSCILLATORIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'diNapoliDetrendOscillatorTitle',
        description: 'diNapoliDetrendOscillatorDescription',
        type: 'indicators',
        subscriptionPack: 'diNapoliTools',
        newPane: true,
        inputs: {
            'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
            'PERIODS': { type: 'integer', name: 'periods', properties: { max: 200, min: 0 }, value: 7 },
        },
    
        outputs: {
            'DPO': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'diNapoliDetrendOscillatorTitle',
                    labels: ['value'],
                    fields: ['DPOValue'],
                    data: null
                }
            }
        },
    
        plotters: [
            { type: 'SeriesObject', dataLink: 'DPO', renderAs: 'Line', dataField: 'DPOValue', color: '#03a9f4', width: 1.5, dash: [], priceTag: true }
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id = '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) { }
    
                this.calculate = function (this: any, index: any) {
                    var close = this.CLOSE.getValue(index);
                    var ma = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
                    if (close === null || ma === null) return;
    
                    this.DPOValue.setValue(index, close - ma);
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
