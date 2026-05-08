import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createNVIIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'nviTitle',
        description: 'nviDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
        },
        outputs: {
            'NVI': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'nviTitle',
                    labels: ['value'],
                    fields: ['NVIValue'],
                    data: null
                }
            }
        },
        plotters: [
            {type:'SeriesObject', dataLink: 'NVI', renderAs: 'Line', dataField: 'NVIValue', color: '#ff9800', width: 1.5, dash:[]}
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    var close = this.CLOSE.getValue(index);
                    var lastClose = this.CLOSE.getValue(index - 1);
                    var volume = this.VOLUME.getValue(index);
                    var lastVolume = this.VOLUME.getValue(index - 1);
                    var lastNVI = this.NVIValue.getValue(index - 1) || 1;
    
                    if (close === null || lastClose === null || volume === null || lastVolume === null || volume > lastVolume) {
                        this.NVIValue.setValue(index, lastNVI);
                    } else {
                        var nvi = (close - lastClose) / lastClose * lastNVI + lastNVI;
                        this.NVIValue.setValue(index, nvi);
                    }
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
