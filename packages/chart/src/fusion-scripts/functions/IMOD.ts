import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createIMODFunctionScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'imodTitle',
        description: 'imodDescription',
        type: 'functions',
        newPane: false,
        inputs: {
            'IN1': {type: 'series', name: 'indicator', properties: {}, value: null},
            'IN2': {type: 'double', name: 'indicatorModifier', properties: {max: 100, min: -100}, value: 1.0},
            'OPERATION': {type: 'list', name: 'operation', properties: {}, list:['Add','Substract','Multiply','Divide','Power of'], value: 'Add'},
        },
    
        outputs: {
            'IMOD': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'imodTitle',
                    labels: ['value'],
                    fields: ['IMOD'],
                    data: null
                }
            }
    
        },
    
        plotters: [
    
            {type:'SeriesObject', dataLink: 'IMOD', renderAs: 'Line', dataField: 'IMOD', color: '#00bcd4', width: 1.5, dash:[]}
    
    
        ],
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var IMODController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    var value = this.IN1.getValue(index);
    
                    if (value === null) {
                        this.IMOD.setValue(index, value);
                        return;
                    }
    
                    if (this.OPERATION==='Add') {
                        value = value + this.IN2;
                    } else
    
                    if (this.OPERATION==='Substract') {
                        value = value - this.IN2;
                    } else
    
                    if (this.OPERATION==="Multiply") {
                        value = value * this.IN2;
                    } else
    
                    if (this.OPERATION==='Divide') {
                        value = value / this.IN2;
                    } else
    
                    if (this.OPERATION==='Power of') {
                        value = Math.pow(value, this.IN2);
                    }
    
                    this.IMOD.setValue(index, value);
                }
            };
    
            return new IMODController(context, inputs, outputs);
        }
    }
}
