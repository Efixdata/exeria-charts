import type {
    CoreFusionRuntime,
    CoreFusionStatic,
} from "../../internal-types/fusion";
import type {
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createWILLIAMSFRACTALSIndicatorScript(FUSION: CoreFusionStatic) {
    return {
        title: 'williamsFractalsTitle',
        description: 'williamsFractalsDescription',
        type: 'indicators',
        newPane: false,
        inputs: {
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
            'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 2}, value: 2},
        },
    
        outputs: {
            'WILLIAMSFRACTALS': {
                type: 'series',
                series: {
                    seriesId: null,
                    title: 'williamsFractalsTitle',
                    labels: ['value'],
                    fields: ['WILLIAMSFRACTALS'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'FractalsObject', dataLink: 'WILLIAMSFRACTALS', renderAs: 'Line', dataField: 'WILLIAMSFRACTALS', color: '#03a9f4', width: 1.5, dash:[]},
        ],
    
        controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
            var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
                this.id	= '';
                this.context = context;
                this.inputs = inputs;
                this.outputs = outputs;
    
                this.init = function (this: any) {}
    
                this.calculate = function (this: any, index: any) {
                    this.WILLIAMSFRACTALS.setValue(index, 0);
    
                    var high = this.HIGH.getValue(index - this.PERIODS);
                    var highp1 = this.HIGH.getValue(index - this.PERIODS - 1);
                    var highp2 = this.HIGH.getValue(index - this.PERIODS - 2);
                    var highp3 = this.HIGH.getValue(index - this.PERIODS - 3);
                    var highp4 = this.HIGH.getValue(index - this.PERIODS - 4);
                    var highp5 = this.HIGH.getValue(index - this.PERIODS - 5);
                    var highp6 = this.HIGH.getValue(index - this.PERIODS - 6);
                    var highm1 = this.HIGH.getValue(index - this.PERIODS + 1);
                    var highm2 = this.HIGH.getValue(index - this.PERIODS + 2);
    
                    var low = this.LOW.getValue(index - this.PERIODS);
                    var lowp1 = this.LOW.getValue(index - this.PERIODS - 1);
                    var lowp2 = this.LOW.getValue(index - this.PERIODS - 2);
                    var lowp3 = this.LOW.getValue(index - this.PERIODS - 3);
                    var lowp4 = this.LOW.getValue(index - this.PERIODS - 4);
                    var lowp5 = this.LOW.getValue(index - this.PERIODS - 5);
                    var lowp6 = this.LOW.getValue(index - this.PERIODS - 6);
                    var lowm1 = this.LOW.getValue(index - this.PERIODS + 1);
                    var lowm2 = this.LOW.getValue(index - this.PERIODS + 2);
    
                    if (!high || !highp1 || !highp2 || !highp3 || !highp4 || !highp5 || !highp6 || !highm1 || !highm2 ||
                        !low || !lowp1 || !lowp2 || !lowp3 || !lowp4 || !lowp5 || !lowp6 || !lowm1 || !lowm2) {
                        return;
                    }
    
                    var upFractal = ((highp2  < high) && (highp1  < high) && (highm1 < high) && (highm2 < high))
                    || ((highp3  < high) && (highp2  < high) && (highp1 == high) && (highm1 < high) && (highm2 < high))
                    || ((highp4  < high) && (highp3  < high) && (highp2 == high) && (highp1 <= high) && (highm1 < high) && (highm2 < high))
                    || ((highp5 < high) && (highp4  < high) && (highp3 == high) && (highp2 == high) && (highp1 <= high) && (highm1 < high) && (highm2 < high))
                    || ((highp6 < high) && (highp5 < high) && (highp4 == high) && (highp3 <= high) && (highp2 == high) && (highp1 <= high) && (highm1 < high) && (highm2 < high));
    
                    var downFractal = ( (lowp2  > low) && (lowp1  > low) && (lowm1 > low) && (lowm2 > low))
                    || ((lowp3  > low) && (lowp2  > low) && (lowp1 == low) && (lowm1 > low) && (lowm2 > low))
                    || ((lowp4  > low) && (lowp3  > low) && (lowp2 == low) && (lowp1 >= low) && (lowm1 > low) && (lowm2 > low))
                    || ((lowp5 > low) && (lowp4  > low) && (lowp3 == low) && (lowp2 == low) && (lowp1 >= low) && (lowm1 > low) && (lowm2 > low))
                    || ((lowp6 > low) && (lowp5 > low) && (lowp4 == low) && (lowp3 >= low) && (lowp2 == low) && (lowp1 >= low) && (lowm1 > low) && (lowm2 > low));
    
                    if (index - this.PERIODS > 0) {
                        if (upFractal && downFractal) {
                            this.WILLIAMSFRACTALS.setValue(index - this.PERIODS, -3);
                        } else if (upFractal) {
                            this.WILLIAMSFRACTALS.setValue(index - this.PERIODS, -1);
                        } else if (downFractal) {
                            this.WILLIAMSFRACTALS.setValue(index - this.PERIODS, 1);
                        }
                    }
                }
            };
    
            return new Controller(context, inputs, outputs);
        }
    }
}
