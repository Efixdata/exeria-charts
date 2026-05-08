import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createPARSARIndicatorScript(FUSION: CoreFusionStatic) {
    return {
    
        title: 'parsarTitle',
        description: 'parsarDescription',
        type: 'indicators',
        newPane: false,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'IAF': {type: 'double', name: 'iaf', properties: {max: 200, min: 0, step: 0.01}, value: 0.02},
            'MAF': {type: 'integer', name: 'maf', properties: {max: 200, min: 0}, value: 2},
        },
    
        outputs: {
    
            'PARSAR': {
                type: 'series', series: {
                    seriesId: null,
                    title: 'parsarTitle',
                    labels: ['parsarTitle'],
                    fields: ['PARSAR'],
                    data: null
                }
            }
    
        },
    
        plotters: [
            {type:'SeriesObject', dataLink: 'PARSAR', renderAs: 'Line', dataField: 'PARSAR', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
    
            var PARSARController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
    
                this.id			= '';
                this.context	= context;
                this.inputs 	= inputs;
                this.outputs	= outputs;
    
                this.init = function (this: any) {
                    this.sar	=null;
                    this.extreme=null;
                    this.af		=null;
                    this.issLong=null;
    
                    this.helper = this.context.createSeries(['ISLONG', 'AFSERIES','EXTREMESERIES']);
                    this.ISLONG = this.context.getRawSeriesWrapper(this.helper, 'ISLONG');
                    this.AFSERIES = this.context.getRawSeriesWrapper(this.helper, 'AFSERIES');
                    this.EXTREMESERIES = this.context.getRawSeriesWrapper(this.helper, 'EXTREMESERIES');
    
                }
    
                this.calculate = function (this: any, index: any) {
                    if (this.LOW.getValue(index) === null || this.HIGH.getValue(index) === null) return;
    
                    if(this.PARSAR.getValue(index - 1) === null || this.EXTREMESERIES.getValue(index - 1) === null || this.AFSERIES.getValue(index - 1) === null) {
                        this.af=this.MAF;
                        this.issLong=true;
                        this.extreme=this.HIGH.getValue(index);
                        this.sar=this.LOW.getValue(index);
                        this.PARSAR.setValue(index,this.sar);
                        this.AFSERIES.setValue(index,this.af);
                        this.EXTREMESERIES.setValue(index,this.extreme);
                        this.ISLONG.setValue(index,1);
    
                    } else {
    
    
                        this.af  = this.AFSERIES.getValue(index-1);
                        this.extreme = this.EXTREMESERIES.getValue(index-1);
                        this.sar = this.PARSAR.getValue(index-1);
    
                        if (this.ISLONG.getValue(index-1)==1) this.issLong = true; else this.issLong = false;
                    }
    
                    if (this.sar === null || this.af === null || this.extreme === null) {
                        return;
                    }
    
                    this.sar = this.sar + this.af * (this.extreme - this.sar);
    
                    if (this.issLong)
                    {
                        if (this.LOW.getValue(index) < this.sar)
                        {
                            this.issLong=false;
                            this.af = this.IAF;
                            this.sar = this.extreme;
                            this.extreme = this.LOW.getValue(index);
                        }
                        else
                        {
                            if (this.extreme < this.HIGH.getValue(index))
                            {
                                this.extreme = this.HIGH.getValue(index);
                                this.af = this.af + this.IAF;
                                if (this.af > this.MAF)
                                {
                                    this.af = this.MAF;
                                }
                            }
                        }
                    }
                    else if (this.HIGH.getValue(index) > this.sar)
                    {
                        this.issLong=true;
                        this.af = this.IAF;
                        this.sar = this.extreme;
                        this.extreme = this.HIGH.getValue(index);
                    }
                    else
                    {
                        if (this.extreme > this.LOW.getValue(index))
                        {
                            this.extreme = this.LOW.getValue(index);
                            this.af = this.af + this.IAF;
                            if (this.af > this.MAF)
                            {
                                this.af = this.MAF;
                            }
                        }
                    }
    
                    if(index>0)
                    {
                        if (this.issLong) this.ISLONG.setValue(index,1); else this.ISLONG.setValue(index,0);
                        this.AFSERIES.setValue(index,this.af);
                        this.EXTREMESERIES.setValue(index,this.extreme);
                    }
    
                    this.PARSAR.setValue(index, this.sar);
    
                }
            };
            return new PARSARController(context, inputs, outputs);
        }
    
    }
}
