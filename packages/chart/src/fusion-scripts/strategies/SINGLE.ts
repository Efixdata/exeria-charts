import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSINGLEStrategyScript(FUSION: CoreFusionStatic) {
    return {
        title: 'singleSignalsTitle',
        description: 'singleSignalsDescription',
        type: 'strategies',
        newPane: false,
        info: [
            {description: 'singleSignalsInfo1', image: 'Single-Signals0.svg'},
            {description: 'singleSignalsInfo2', image: 'Single-Signals1.svg'}
        ],
        inputs: {
            'STRATEGY': {type: 'series', name: 'strategy', properties: {}, value: null},
            'TYPE': {type: 'list', name: 'simpleOrReverse', properties: {},list:['Simple', 'Reverse'], value: 'Simple'},
        },
    
        outputs: {
            'SINGLE': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'singleSignalsTitle',
                    labels: ['singleSignalsTitle'],
                    fields: ['Single'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'StrategyObject', dataLink: 'SINGLE', renderAs: '', dataField: 'Single', color: '#ff0000', width: 1, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var SINGLEcontroller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
                this.positions = null;
    
                this.init = function (this: any) {
                    this.lastSignal = FUSION.DO_NOTHING;
                    this.lastSignalStr = 1;
                    this.count =0;
                    this.CORRECTION=0;
                }
    
                this.calculate = function (this: any, INDEX: any) {
                	if(this.context.isPositionsSeries()){
                    	this.positions = this.context.getPositions();
                		this.calculateUsingRealMarketPositions(INDEX);
                	}else
                		this.calculateWithoutRealMarketPositions(INDEX);
                }
    
                
                this.calculateUsingRealMarketPositions = function (this: any, INDEX: any) {
                    if(INDEX==0){
                        this.lastSignal = FUSION.DO_NOTHING;
                        this.lastSignalStr = 1;
                    }
    
                    this.Single.setValue(INDEX, 0);
                    this.Single.setStrength(INDEX,0);
                    if (this.STRATEGY.getValue(INDEX) === null) return;
    
                    var signal = Math.round(this.STRATEGY.getValue(INDEX));
                    var signalStr = this.STRATEGY.getStrength(INDEX);
    
                    if(this.lastSignal == signal){
                        //do nothing
                    }else if(signal!=FUSION.DO_NOTHING){
                        if(this.TYPE=='simple'){
                            this.Single.setValue(INDEX,signal);
                            this.Single.setStrength(INDEX,signalStr);
                        }else{
                        	var position = this.positions.data[INDEX].position;
                        	var s = position == 0 ? signalStr : 2*signalStr;
                        	
                            if(signal==FUSION.BUY){
                                this.Single.setValue(INDEX,FUSION.BUY);
                                this.Single.setStrength(INDEX, position <= 0 ? Math.abs(s) : 0);
                            }else if(signal==FUSION.SELL){
                                this.Single.setValue(INDEX,FUSION.SELL);
                                this.Single.setStrength(INDEX, position >= 0 ? Math.abs(s) : 0);
                            }else{
                                this.Single.setValue(INDEX,FUSION.DO_NOTHING);
                                this.Single.setStrength(INDEX,0.0);
                            }
                        }
                        this.lastSignal = Math.round(signal);
                    }
                }
                
                this.calculateWithoutRealMarketPositions = function (this: any, INDEX: any) {
                    if(INDEX==0){
                        this.lastSignal = FUSION.DO_NOTHING;
                        this.CORRECTION = 0;
                        this.count = 0;
                        this.lastSignalStr = 1;
                    }
    
                    this.Single.setValue(INDEX, 0);
                    this.Single.setStrength(INDEX,0);
    
                    if (this.STRATEGY.getValue(INDEX) === null) return;
    
                    var signal = Math.round(this.STRATEGY.getValue(INDEX));
                    var signalStr = this.STRATEGY.getStrength(INDEX);
    
                    if(this.lastSignal == signal){
                        //do nothing
                    }else if(signal!=FUSION.DO_NOTHING){
                        if(this.TYPE=='simple'){
                            this.Single.setValue(INDEX,signal);
                            this.Single.setStrength(INDEX,signalStr);
                        }else{
                            if(signalStr>0)
                                this.CORRECTION=signalStr;
    
                            if(this.count==0){
                                this.lastSignalStr= signalStr;
                            }else if(this.count==1){
                                this.lastSignalStr = 2*this.lastSignalStr;
                            }
                            this.count++;
    
                            signalStr = this.lastSignalStr;
                            if(signal==FUSION.BUY){
                                this.Single.setValue(INDEX,FUSION.BUY);
                                this.Single.setStrength(INDEX,signalStr);
                            }else if(signal==FUSION.SELL){
                                this.Single.setValue(INDEX,FUSION.SELL);
                                this.Single.setStrength(INDEX,signalStr);
                            }else{
                                this.Single.setValue(INDEX,FUSION.DO_NOTHING);
                                this.Single.setStrength(INDEX,0.0);
                            }
                        }
                        this.lastSignal = Math.round(signal);
                        this.lastSignalStr = signalStr;
                    }
                    //console.log("SINGLE:", INDEX, this.Single.getValue(INDEX), this.Single.getStrength(INDEX));
                }
            };
    
            return new SINGLEcontroller(context, inputs, outputs);
        }
    }
}
