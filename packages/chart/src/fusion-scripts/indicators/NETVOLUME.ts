import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createNETVOLUMEIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'netVolumeTitle',
        description: 'netVolumeDescription',
        type: 'indicators',
        newPane: true,
        inputs: {
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
        },
    
        outputs: {
            'NETVOLUME': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'netVolumeTitle',
                    labels: ['value'],
                    fields: ['NETVOLUME'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'NETVOLUME', renderAs: 'Line', dataField: 'NETVOLUME', color: '#03a9f4', width: 1.5, dash:[], priceTag: true, priceLine: false}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs	= inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries([
                        'X',
                    ]);
                    this.X = this.context.getRawSeriesWrapper(this.helper, 'X');
                }
    
                this.calculate = function (this: any, index: any) {
                    var close = this.CLOSE.getValue(index);
                    var lastClose = this.CLOSE.getValue(index - 1);
                    
                    if (close == null || lastClose == null) return;
    
                    if (close - lastClose > 0) {
                        this.NETVOLUME.setValue(index, this.VOLUME.getValue(index));
                    } else if (close == lastClose) {
                        this.NETVOLUME.setValue(index, 0);
                    } else {
                        this.NETVOLUME.setValue(index, this.VOLUME.getValue(index)*(-1));
                    }
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
