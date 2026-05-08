import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createIFFunctionScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'ifTitle',
        description: 'ifDescription',
        type: 'functions',
        newPane: true,
        inputs: {
    
            'VAL_A': 	{type: 'conditional', name: 'ifAValue', properties: {}, value: {type:"double", value:0}},
            'VAL_B': 	{type: 'conditional', name: 'ifBValue', properties: {}, value: {type:"double", value:0}},
            'VAL_X': 	{type: 'conditional', name: 'ifXValue', properties: {}, value: {type:"double", value:0}},
            'VAL_Y': 	{type: 'conditional', name: 'ifYValue', properties: {}, value: {type:"double", value:0}},
            'VAL_Z': 	{type: 'conditional', name: 'ifZValue', properties: {}, value: {type:"double", value:0}},
    
        },
    
        outputs: {
    
            'IF': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'ifTitle',
                    labels: ['value'],
                    fields: ['IFValue'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'IF', renderAs: 'Line', dataField: 'IFValue', color: '#ffc107', width: 1, dash:[]}
    
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var IFController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
    
                }
    
                this.calculate = function (this: any, index: any) {
                    var CURR_A = getConditionalInputValue(this.VAL_A, index);
                    var CURR_B = getConditionalInputValue(this.VAL_B, index);
                    var CURR_X = getConditionalInputValue(this.VAL_X, index);
                    var CURR_Y = getConditionalInputValue(this.VAL_Y, index);
                    var CURR_Z = getConditionalInputValue(this.VAL_Z, index);
    
                    var OUT_RESULT: any = 0;
    
                    if (CURR_A === null || CURR_B === null)
                        OUT_RESULT = null;
                    else if(CURR_A > CURR_B)
                        OUT_RESULT = CURR_X;
                    else if (CURR_A == CURR_B)
                        OUT_RESULT = CURR_Y;
                    else if (CURR_A < CURR_B)
                        OUT_RESULT = CURR_Z;
    
                    this.IFValue.setValue(index, OUT_RESULT);
    
                }
    
                function getConditionalInputValue(input: any, index: any){
                    if(input['type'] && input['type']=='double'){
                        //double
                        return parseFloat(input['value']);
                    }else //series
                        return input.getValue(index);
                }
    
            };
    
            return new IFController(context, inputs, outputs);
        }
    }
}
