import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCROSSStrategyScript(FUSION: CoreFusionStatic) {
    return {
        title: 'crossTitle',
        description: 'crossDescription',
        type: 'strategies',
        newPane: false,
        info: [
            {description: 'crossInfo', image: 'Cross.svg'}
        ],
        inputs: {
            'LINE': {type: 'series', name: 'aSeries', properties: {def:'MACDLine'}, value: null},
            'SIGNAL': {type: 'series', name: 'bSeries', properties: {def:'MACDSignal'}, value: null},
            'ONDN': {type: 'list', name: 'crossOnDn', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Buy'},
            'ONUP': {type: 'list', name: 'crossOnUp', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Sell'},
        },
    
        outputs: {
            'CROSS': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'crossTitle',
                    labels: ['signal'],
                    fields: ['CrossValue',],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'StrategyObject', dataLink: 'CROSS', renderAs: '', dataField: 'CrossValue', color: '#ff0000', width: 1, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var CROSSController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, INDEX: any) {
                    if (INDEX < 2) {
                        this.CrossValue.setValue(INDEX, 0);
                        this.CrossValue.setStrength(INDEX, 0)
                    } else {
    
                        this.CrossValue.setValue(INDEX,0);
                        this.CrossValue.setStrength(INDEX,1);
    
                        if (this.LINE.getValue(INDEX) === null || this.SIGNAL.getValue(INDEX) === null) {
                            return;
                        }
                        if ( this.LINE.getValue(INDEX) < this.SIGNAL.getValue(INDEX) ) {
    
                            var c = isCross(this.LINE, this.SIGNAL, INDEX);
                            if(c==true){
                                var signal = -1;
                                if (this.ONDN=="Buy") signal=FUSION.BUY;
                                else if (this.ONDN=="Sell") signal=FUSION.SELL;
                                else if (this.ONDN=="Exit long") signal=FUSION.EXIT_LONG;
                                else if (this.ONDN=="Exit short") signal=FUSION.EXIT_SHORT;
                                else if (this.ONDN=="Exit all") signal=FUSION.EXIT_ALL;
                                else if (this.ONDN=="Do nothing") signal=FUSION.DO_NOTHING;
                                this.CrossValue.setValue(INDEX,signal);
                            }
                        } else  if (this.LINE.getValue(INDEX) > this.SIGNAL.getValue(INDEX) ){
                            var c = isCross(this.SIGNAL, this.LINE, INDEX);
                            if(c==true){
                                var signal = 1;
                                if (this.ONUP=="Buy")
                                    signal=FUSION.BUY;
                                else if (this.ONUP=="Sell") signal=FUSION.SELL;
                                else if (this.ONUP=="Exit long") signal=FUSION.EXIT_LONG;
                                else if (this.ONUP=="Exit short") signal=FUSION.EXIT_SHORT;
                                else if (this.ONUP=="Exit all") signal=FUSION.EXIT_ALL;
                                else if (this.ONUP=="Do nothing") signal=FUSION.DO_NOTHING;
                                this.CrossValue.setValue(INDEX,	signal);
                            }
                        }
                    }
    
    
                    function isCross(u: any, l: any, i: any){
                        var x = i-1;
                        if(x>2){
                            while(x > 2 && u.getValue(x) == l.getValue(x) ) {
                                x--;
                            }
                            if(u.getValue(x)>l.getValue(x))
                                return true;
                            else
                                return false;
                        }else{
                            return false;
                        }
                    }
    
    
                }
            };
    
            return new CROSSController(context, inputs, outputs);
        }
    }
}
