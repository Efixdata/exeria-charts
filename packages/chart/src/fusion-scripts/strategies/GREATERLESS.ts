import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createGREATERLESSStrategyScript(FUSION: CoreFusionStatic) {
    return {
        title: 'greaterLessTitle',
        description: 'greaterLessDescription',
        type: 'strategies',
        newPane: false,
        info: [
            {description: 'greaterLessInfo1', image: 'Greater-Less0.svg'},
            {description: 'greaterLessInfo2', image: 'Greater-Less1.svg'},
            {description: 'greaterLessInfo3', image: 'Greater-Less2.svg'}
        ],
        inputs: {
            'LINE1': {type: 'series', name: 'aSeries', properties: {}, value: null},
            'LINE2': {type: 'series', name: 'bSeries', properties: {}, value: null},
    
            'CHOICE': {type: 'list', name: 'greaterLessChoice', properties: {}, list: ['greater than', 'less than', 'equals'], value: 'greater than'},
            'RT': {type: 'list', name: 'greaterLessRt', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Sell'},
            'SINGLE': {type: 'boolean', name: 'singleSignal', properties: {}, value: false},
        },
    
        outputs: {
            'GREATERLESS': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'greaterLessTitle',
                    labels: ['greaterLessTitle'],
                    fields: ['GreaterLess',],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'StrategyObject', dataLink: 'GREATERLESS', renderAs: '', dataField: 'GreaterLess', color: '#ff0000', width: 1, dash:[]}
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var GREATERLESSController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
                    this.helper = this.context.createSeries(['SIGNALSERIES']);
                    this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, 'SIGNALSERIES');
                }
    
                this.calculate = function (this: any, INDEX: any) {
                    if (INDEX < 2) {
                        this.SIGNALSERIES.setValue(INDEX, FUSION.DO_NOTHING);
                        this.GreaterLess.setValue(INDEX, FUSION.DO_NOTHING);
                    } else {
                        this.SIGNALSERIES.setValue(INDEX, FUSION.DO_NOTHING);
                        this.GreaterLess.setValue(INDEX, FUSION.DO_NOTHING);
    
                        if (this.LINE1.getValue(INDEX) === null || this.LINE2.getValue(INDEX) === null) {
                            return;
                        }
    
                        if(this.CHOICE== "greater than")
                        {
                            if (this.LINE1.getValue(INDEX) > this.LINE2.getValue(INDEX))
                            {
                                var signal = FUSION.BUY;
                                if (this.RT=="Buy") signal=FUSION.BUY;
                                else if (this.RT=="Sell") signal=FUSION.SELL;
                                else if (this.RT=="Exit long") signal=FUSION.EXIT_LONG;
                                else if (this.RT=="Exit short") signal=FUSION.EXIT_SHORT;
                                else if (this.RT=="Exit all") signal=FUSION.EXIT_ALL;
                                else if (this.RT=="Do nothing") signal=FUSION.DO_NOTHING;
    
                                this.SIGNALSERIES.setValue(INDEX, signal);
                                if (this.SINGLE) {
                                    if (this.SIGNALSERIES.getValue(INDEX-1)!=signal)
                                        this.GreaterLess.setValue(INDEX, signal);
                                }
                                else this.GreaterLess.setValue(INDEX, signal);
                            }
                        }
                        else if(this.CHOICE== "less than")
                        {
                            if (this.LINE1.getValue(INDEX) < this.LINE2.getValue(INDEX))
                            {
                                var signal = FUSION.SELL;
                                if (this.RT=="Buy") signal=FUSION.BUY;
                                else if (this.RT=="Sell") signal=FUSION.SELL;
                                else if (this.RT=="Exit long") signal=FUSION.EXIT_LONG;
                                else if (this.RT=="Exit short") signal=FUSION.EXIT_SHORT;
                                else if (this.RT=="Exit all") signal=FUSION.EXIT_ALL;
                                else if (this.RT=="Do nothing") signal=FUSION.DO_NOTHING;
    
                                this.SIGNALSERIES.setValue(INDEX, signal);
                                if (this.SINGLE==true) {
                                    if (this.SIGNALSERIES.getValue(INDEX-1)!=signal)
                                        this.GreaterLess.setValue(INDEX, signal);
                                }
                                else this.GreaterLess.setValue(INDEX, signal);
                            }
                        }
                        else
                        {
                            if (this.LINE1.getValue(INDEX) == this.LINE2.getValue(INDEX))
                            {
                                var signal = FUSION.SELL;
                                if (this.RT=="Buy") signal=FUSION.BUY;
                                else if (this.RT=="Sell") signal=FUSION.SELL;
                                else if (this.RT=="Exit long") signal=FUSION.EXIT_LONG;
                                else if (this.RT=="Exit short") signal=FUSION.EXIT_SHORT;
                                else if (this.RT=="Exit all") signal=FUSION.EXIT_ALL;
                                else if (this.RT=="Do nothing") signal=FUSION.DO_NOTHING;
    
                                this.SIGNALSERIES.setValue(INDEX, signal);
                                if (this.SINGLE===true) {
                                    if (this.SIGNALSERIES.getValue(INDEX-1)!=signal)
                                        this.GreaterLess.setValue(INDEX, signal);
                                }
                                else this.GreaterLess.setValue(INDEX, signal);
                            }
                        }
                        this.GreaterLess.setStrength(INDEX, 1);
                    }
                }
            };
    
            return new GREATERLESSController(context, inputs, outputs);
        }
    }
}
