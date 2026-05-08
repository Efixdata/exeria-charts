import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createEQUITYSUMHiddenScript(FUSION: CoreFusionStatic) {
    return {
        hidden: true,
        title: 'equitySummaryTitle',
        description: 'equitySummaryDescription',
        newPane: true,
        dynamicSeriesInputs: true,
        inputs: {},
        outputs: {
            'EQUITYSUM': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'equitySummaryTitle',
                    labels: ['equitySummaryDescription'],
                    fields: ['EQUITYSUM'],
                    data: null
                }
            }
        },

        plotters: [
            {type:'SeriesObject', dataLink: 'EQUITYSUM', renderAs: 'Line', dataField: 'EQUITYSUM', color: '#2d566d', width: 2, dash:[], priceTag: false, priceLine: false},
        ],

        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

            var EQUITYSUMController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;

                this.init = function (this: any) {}

                this.calculate = function (this: any, INDEX: any) {
                    var sum = 0;
                    for(var k in this.inputs){
                        var v = this[k].getValue(INDEX);
                        if (v === null) continue;
                        if(this[k]['weight']){
                            v = v* this[k]['weight'];
                        }
                        sum += v;
                    }
                    this.EQUITYSUM.setValue(INDEX, sum);
                }
            };

            return new EQUITYSUMController(context, inputs, outputs);
        }
    }
}