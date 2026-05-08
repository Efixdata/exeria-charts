import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createJOINStrategyScript(FUSION: CoreFusionStatic) {
    return {
        title: 'joinTitle',
        description: 'joinDescription',
        type: 'strategies',
        newPane: false,
        info: [
            {description: 'joinInfo', image: 'Join.svg'}
        ],
        inputs: {
            'FIRST': {type: 'series', name: 'xStrategy', properties: {}, value: null},
            'SECOND': {type: 'series', name: 'yStrategy', properties: {}, value: null},
            'MATRIX': {type: 'matrix', name: 'joiningTable', properties: {readOnly:true}, value: new FUSION.Matrix()},
        },
    
        outputs: {
            'JOIN': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'joinTitle',
                    labels: ['joinTitle'],
                    fields: ['Join'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'StrategyObject', dataLink: 'JOIN', renderAs: '', dataField: 'Join', color: '#ff0000', width: 1, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var JOINController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['SIGNALSERIES']);
                    this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, 'SIGNALSERIES');
                }
    
                this.calculate = function (this: any, INDEX: any) {
                    this.Join.setValue(INDEX, 0);
                    this.Join.setStrength(INDEX, 1);
    
                    if (this.FIRST.getValue(INDEX) === null || this.SECOND.getValue(INDEX) === null) return;
    
                    var firstSignalVal = Math.round(this.FIRST.getValue(INDEX));
                    var secondSignalVal = Math.round(this.SECOND.getValue(INDEX));
                    var signal1 = FUSION.signalValueToName(firstSignalVal);
                    var signal2 = FUSION.signalValueToName(secondSignalVal);
    
                    if(signal1 && signal2){
                        var signal3 = this.MATRIX[signal1][signal2];
                        this.Join.setValue(INDEX,FUSION.signalNameToValue(signal3));
                    }
                }
            };
    
            return new JOINController(context, inputs, outputs);
        }
    }
}
