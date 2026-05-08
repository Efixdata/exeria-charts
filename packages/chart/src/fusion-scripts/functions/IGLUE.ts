import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createIGLUEFunctionScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'iglueTitle',
        description: 'iglueDescription',
        type: 'functions',
        newPane: false,
        inputs: {
            'IN1': {type: 'series', name: 'firstIndicator', properties: {}, value: null},
            'IN2': {type: 'series', name: 'secondIndicator', properties: {}, value: null},
            'OPERATION': {type: 'list', name: 'operation', properties: {}, list:['Add','Substract','Multiply','Divide','Power of'], value: 'Add'},
        },
    
        outputs: {
            'IGLUE': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'iglueTitle',
                    labels: ['value'],
                    fields: ['IGLUE'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'IGLUE', renderAs: 'Line', dataField: 'IGLUE', color: '#ffc107', width: 1.5, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var IGLUEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    var value = this.IN1.getValue(index);
                    if (this.IN1.getValue(index) === null || this.IN2.getValue(index) === null) {
                        return;
                    }
    
                    if (this.OPERATION==='Add') {
                        value = value + this.IN2.getValue(index);
                    } else
    
                    if (this.OPERATION==='Substract') {
                        value = value - this.IN2.getValue(index);
                    } else
    
                    if (this.OPERATION==="Multiply") {
                        value = value * this.IN2.getValue(index);
                    } else
    
                    if (this.OPERATION==='Divide') {
                        value = value / this.IN2.getValue(index);
                    } else
    
                    if (this.OPERATION==='Power of') {
                        value = Math.pow(value, this.IN2.getValue(index));
                    }
    
                    this.IGLUE.setValue(index, value);
                }
            };
    
            return new IGLUEController(context, inputs, outputs);
        }
    }
}
