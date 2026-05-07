import WEBRCP from "./WebRCP";
import { calcLine } from "./utils/objects-lib";
import type {
    CoreFusionBuilder,
    CoreFusionLoader,
    FusionModelRuntime,
    CoreFusionRuntime,
    CoreFusionStatic,
    FusionScriptControllerConstructor,
    FusionScriptControllerRuntime,
    FusionSeriesRuntime,
    FusionSignalMatrix,
    RuntimeScriptConfig,
    RuntimeScriptDefinition,
} from "./internalTypes";

declare const SERVICES: any;

type FusionRecord = Record<string, any>;
type FusionSeriesData = FusionRecord[];

const FUSION: CoreFusionStatic = {} as CoreFusionStatic;

FUSION.scripts = {};

FUSION.DEBUG=false;
FUSION.MIN_VALUE = -Number.MAX_VALUE;
FUSION.MAX_VALUE = Number.MAX_VALUE;

FUSION.BUY = 1;
FUSION.SELL = -1;
FUSION.EXIT_LONG = 2;
FUSION.EXIT_SHORT = -2;
FUSION.EXIT_ALL = -3;
FUSION.DO_NOTHING = 0;

/**
 * @memberOf FUSION
 */
FUSION.signals = {
    "Buy": FUSION.BUY,
    "Sell": FUSION.SELL,
    "Exit long": FUSION.EXIT_LONG,
    "Exit short": FUSION.EXIT_SHORT,
    "Exit all": FUSION.EXIT_ALL,
    "Do nothing": FUSION.DO_NOTHING
};

/**
 * @memberOf FUSION
 */
FUSION.Matrix = function (this: FusionSignalMatrix) {
    this['Buy'] = {
        'Buy': 'Buy',
        'Sell': 'Do nothing',
        'Exit long': 'Exit long',
        'Exit short': 'Exit short',
        'Exit all': 'Exit all',
        'Do nothing': 'Buy'
    };

    this['Sell'] = {
        'Buy': 'Do nothing',
        'Sell': 'Sell',
        'Exit long': 'Exit long',
        'Exit short': 'Exit short',
        'Exit all': 'Exit all',
        'Do nothing': 'Sell'
    };

    this['Exit long'] = {
        'Buy': 'Exit long',
        'Sell': 'Exit long',
        'Exit long': 'Exit long',
        'Exit short': 'Exit all',
        'Exit all': 'Exit all',
        'Do nothing': 'Exit long'
    };

    this['Exit short'] = {
        'Buy': 'Exit short',
        'Sell': 'Exit short',
        'Exit long': 'Exit all',
        'Exit short': 'Exit short',
        'Exit all': 'Exit all',
        'Do nothing': 'Exit short'
    };

    this['Exit all'] = {
        'Buy': 'Exit all',
        'Sell': 'Exit all',
        'Exit long': 'Exit all',
        'Exit short': 'Exit all',
        'Exit all': 'Exit all',
        'Do nothing': 'Exit all'
    };
    
    this['Do nothing'] = {
        'Buy': 'Buy',
        'Sell': 'Sell',
        'Exit long': 'Exit long',
        'Exit short': 'Exit short',
        'Exit all': 'Exit all',
        'Do nothing': 'Do nothing'
    };
} as unknown as CoreFusionStatic["Matrix"];


FUSION.signalValueToName = function(value){
    for (var property in FUSION.signals) {
        if (FUSION.signals.hasOwnProperty(property)) {
            if(FUSION.signals[property]==value)
                return property;
        }
    }
    return undefined;
}

FUSION.signalNameToValue = function(name){
    return FUSION.signals[name];
}



FUSION.createDoubleCheckMatrix = function(){
    var matrix = new FUSION.Matrix();
    for (var r in matrix) {
        if (matrix.hasOwnProperty(r)) {
            var row = matrix[r];
            for (var c in row) {
                if (row.hasOwnProperty(c)) {
                    if(r !== c )
                        matrix[r][c] = "Do nothing";
                }
            }
        }
    }
    return matrix;
}

FUSION.createSelectiveSignalsMatrix = function (){
    var matrix = new FUSION.Matrix();
    for (var r in matrix) {
        if (matrix.hasOwnProperty(r)) {
            var row = matrix[r];
            for (var c in row) {
                if (row.hasOwnProperty(c)) {
                    if(r == "Do nothing")
                        matrix[r][c] = "Do nothing";
                    if(c == "Do nothing")
                        matrix[r][c] = "Do nothing";
                }
            }
        }
    }
    return matrix;
}

FUSION.uniqueId		=	function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return new Date().getTime() + '@' + s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

FUSION.getAvailableScript = function(key) {
    if (typeof SERVICES === 'undefined') return FUSION.scripts[key];
    else if (!FUSION.scripts[key].subscriptionPack) return FUSION.scripts[key];
    else if (SERVICES.payments.isSubscriptionPackEnabled(FUSION.scripts[key].subscriptionPack)) return FUSION.scripts[key];
    else return null;
};

FUSION.getScript = function(key) {
    return FUSION.scripts[key];
};

FUSION.getAvailableScripts = function() {
    const availableScripts = FUSION.availableScripts ?? (FUSION.availableScripts = JSON.parse(JSON.stringify(FUSION.scripts)));

    const keys = Object.keys(availableScripts);

    for (let key of keys) {
        const script = availableScripts[key];

        if (typeof SERVICES === 'undefined' || (script.subscriptionPack && !SERVICES.payments.isSubscriptionPackEnabled(script.subscriptionPack))) {
            delete availableScripts[key];
        }
    }

    return availableScripts;
}

FUSION.getAllScripts = function() {
    if (WEBRCP && WEBRCP.platformManifest && WEBRCP.platformManifest.isWidget)
        return FUSION.getFreeScripts();
    return FUSION.scripts;
}

FUSION.getFreeScripts = function () {
    const freeScripts = FUSION.freeScripts ?? (FUSION.freeScripts = JSON.parse(JSON.stringify(FUSION.scripts)));

    const keys = Object.keys(freeScripts);

    for (let key of keys) {
        const script = freeScripts[key];

        if (script.subscriptionPack) {
            delete freeScripts[key];
        }
    }

    return freeScripts;
}



FUSION.scripts['MACD']= {
    title: 'macdTitle',
    description: 'macdDescription',
    type: 'indicators',
    newPane: true,
    centerZero:true,
    inputs: {

        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'FPERIOD': {type: 'integer', name: 'firstPeriod', properties: {def: 12, max: 100, min: 0}, value: 12},
        'SPERIOD': {type: 'integer', name: 'secondPeriod', properties: {def: 26, max: 100, min: 0}, value: 26},
        'SGPERIOD': {type: 'integer', name: 'signalPeriod', properties: {def: 9, max: 100, min: 0}, value: 9}

    },

    outputs: {

        'MACD': {
            type: 'series', series: {
                seriesId: null,
                title: 'macdTitle',
                labels: ['line', 'signal', 'histogram'],
                fields: ['MACDLine', 'MACDSignal', 'MACDHistogram'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'MACD', renderAs: 'Line and Histogram', dataField: 'MACDHistogram', color: '#ff9800', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'MACD', renderAs: 'Line', dataField: 'MACDSignal', color: '#f44336', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'MACD', renderAs: 'Line', dataField: 'MACDLine', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: true}


    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var MACDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {


            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {

                this.helper = this.context.createSeries(['EMAF', 'EMAS', 'EMAG']);
                this.EMAF = this.context.getRawSeriesWrapper(this.helper, 'EMAF');
                this.EMAS = this.context.getRawSeriesWrapper(this.helper, 'EMAS');
                this.EMAG = this.context.getRawSeriesWrapper(this.helper, 'EMAG');

            }

            this.calculate = function (this: any, index: any) {


                this.EMAF.setValue(index, FUSION.lib.getEMA(this.CLOSE, index, this.FPERIOD, this.EMAF));
                this.EMAS.setValue(index, FUSION.lib.getEMA(this.CLOSE, index, this.SPERIOD, this.EMAS));

                var fema = this.EMAF.getValue(index);
                var sema = this.EMAS.getValue(index);

                if (fema === null || sema === null) return;

                this.MACDLine.setValue(index, fema - sema);

                this.EMAG.setValue(index, FUSION.lib.getEMA(this.MACDLine, index, this.SGPERIOD, this.EMAG));
                var sgema = this.EMAG.getValue(index);
                this.MACDSignal.setValue (index, sgema);
                this.MACDHistogram.setValue (index, this.MACDLine.getValue(index) - this.MACDSignal.getValue(index));

            }

        };

        return new MACDController (context, inputs, outputs);
    }
}

//---------------------------------------------------------------------------------------------------------
FUSION.scripts['WMA'] = {
    title: 'wmaTitle',
    description: 'wmaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def: 'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 9}
    },

    outputs: {
        'WMA': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'wmaTitle',
                labels: ['value'],
                fields: ['WMAValue'],
                data: null
            }
        }
    },

    plotters: [
        {type: 'SeriesObject', dataLink: 'WMA', renderAs: 'Line', dataField: 'WMAValue', color: '#ff9800', width: 1.5, dash: []}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var WMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
            };

            this.calculate = function (this: any, index: any) {
                this.WMAValue.setValue(index, FUSION.lib.getWMA(this.CLOSE, index, this.PERIODS));
            };
        };

        return new WMAController(context, inputs, outputs);
    }
};

//---------------------------------------------------------------------------------------------------------
FUSION.scripts['HMA'] = {
    title: 'hmaTitle',
    description: 'hmaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def: 'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 196, min: 4}, value: 25}
    },

    outputs: {
        'HMA': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'hmaTitle',
                labels: ['value'],
                fields: ['HMAValue'],
                data: null
            }
        }
    },

    plotters: [
        {type: 'SeriesObject', dataLink: 'HMA', renderAs: 'Line', dataField: 'HMAValue', color: '#3f51b5', width: 1.5, dash: []}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var HMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['DIFFWMA']);
                this.DIFFWMA = this.context.getRawSeriesWrapper(this.helper, 'DIFFWMA');

                this.sqrtPeriod = Math.floor(Math.sqrt(this.PERIODS));
                this.halfPeriod = Math.floor(this.PERIODS / 2);
            };

            this.calculate = function (this: any, index: any) {
                var wman2 = 2 * FUSION.lib.getWMA(this.CLOSE, index, this.halfPeriod);
                var wman  = FUSION.lib.getWMA(this.CLOSE, index, this.PERIODS);
                if (wman === null || wman2 === null) return;
                this.DIFFWMA.setValue(index, wman2 - wman);
                this.HMAValue.setValue(index, FUSION.lib.getWMA(this.DIFFWMA, index, this.sqrtPeriod));
            };
        };

        return new HMAController(context, inputs, outputs);
    }
};


//---------------------------------------------------------------------------------------------------------
FUSION.scripts['HeikinAshi'] = {
    title: 'hashiTitle',
    description: 'hashiDescription',
    type: 'indicators',
    newPane: true,
    centerZero: false,
    inputs: {
        'OPEN': {type: 'series', name: 'priceOpen', properties: {def: 'o'}, value: null},
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def: 'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def: 'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def: 'c'}, value: null}
    },

    outputs: {
        'HeikinAshi': {
            type: 'series', 
            series: {
                seriesId: null,
                title: 'hashiTitle',
                labels: ['hashiOpen', 'hashiHigh', 'hashiLow', 'hashiClose'],
                fields: ['o', 'h', 'l', 'c'],
                data: null
            }
        }
    },

    plotters: [
        {type: 'SeriesObject', dataLink: 'HeikinAshi', renderAs: 'OHLC', openDataField: 'o', highDataField: 'h', lowDataField: 'l', closeDataField: 'c', dataField: 'o', color: '#f44336', width: 1.5, dash: [], priceTag: true, priceLine: true}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var HaController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {};

            this.calculate = function (this: any, INDEX: any) {
                var open = this.OPEN.getValue(INDEX);
                var high = this.HIGH.getValue(INDEX);
                var low = this.LOW.getValue(INDEX);
                var close = this.CLOSE.getValue(INDEX);
                var o1 = this.o.getValue(INDEX - 1) || this.OPEN.getValue(INDEX - 1);
                var c1 = this.c.getValue(INDEX - 1);

                if (open === null || high === null || close === null || o1 === null) return;

                if (c1 === null) {
                    if (this.OPEN.getValue(INDEX - 1) === null || this.HIGH.getValue(INDEX - 1) === null || this.LOW.getValue(INDEX - 1) === null || this.CLOSE.getValue(INDEX - 1) === null) return;
                    c1 = (this.OPEN.getValue(INDEX - 1) + this.HIGH.getValue(INDEX - 1) + this.LOW.getValue(INDEX - 1) + this.CLOSE.getValue(INDEX - 1)) / 4;
                }

                var tmpHaClose = (open + high + low + close) / 4;
                var tmpHaOpen = (o1 + c1) / 2;

                this.o.setValue(INDEX, tmpHaOpen);
                this.c.setValue(INDEX, tmpHaClose);
                this.h.setValue(INDEX, Math.max(high, tmpHaOpen, tmpHaClose));
                this.l.setValue(INDEX, Math.min(low, tmpHaOpen, tmpHaClose));
            };
        };

        return new HaController(context, inputs, outputs);
    }
}


//---------------------------------------------------------------------------------------------------------
FUSION.scripts['BBAND'] = {

    title: 'bbandTitle',
    description: 'bbandDescription',
    type: 'indicators',
    newPane: false,
    inputs: {

        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 15},
        'DEVIATIONS': {type: 'double', name: 'deviations', properties: {max: 10, min: 0, step: 0.1}, value: 2.5}

    },

    outputs: {

        'BBAND': {
            type: 'series', series: {
                seriesId: null,
                title: 'bbandTitle',
                labels: ['upper', 'lower', 'middle'],
                fields: ['BBUpper', 'BBLower', 'BBMiddle'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'BBAND', renderAs: 'Band', upperField: 'BBUpper', lowerField: 'BBLower', color: '#5b6f8b', width: 1, dash: [0,0]},
        {type:'SeriesObject', dataLink: 'BBAND', renderAs: 'Line', dataField: 'BBMiddle', color: '#425166', width: 1, dash: [0,0], priceTag: false, priceLine: false}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var BBANDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {

            }

            this.calculate = function (this: any, index: any) {


                var sma = FUSION.lib.getMA (this.CLOSE, index, this.PERIODS);
                var std = FUSION.lib.getStdDev (this.CLOSE, index, this.PERIODS);
                std = std * this.DEVIATIONS;
                if (sma === null || std === null) return;

                this.BBUpper.setValue (index, sma+std);
                this.BBLower.setValue (index, sma-std);
                this.BBMiddle.setValue (index, sma);

            }

        };

        return new BBANDController(context, inputs, outputs);
    }
}

//-----------------------ATR-------------------------------------------

FUSION.scripts['ATR'] = {

    title: 'atrTitle',
    description: 'atrDescription',
    type: 'indicators',
    newPane: true,
    inputs: {

        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 12},
    },

    outputs: {

        'ATR': {
            type: 'series', series: {
                seriesId: null,
                title: 'atrTitle',
                labels: ['atrTitle'],
                fields: ['ATR'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ATR', renderAs: 'Line', dataField: 'ATR', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var ATRController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;


            this.init = function (this: any) {
                this.helper = this.context.createSeries(['TRUERANGE']);
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
            }

            this.calculate = function (this: any, index: any) {
                this.TRUERANGE.setValue(index, FUSION.lib.getTrueRange(this.HIGH,this.LOW,this.CLOSE,index));
                this.ATR.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIODS, this.ATR));
            }

        };

        return new ATRController(context, inputs, outputs);
    }

}

//-----------------------ATR-------------------------------------------

FUSION.scripts['ADX'] = {

    title: 'adxTitle',
    description: 'adxDescription',
    type: 'indicators',
    newPane: true,
    centerZero:false,
    inputs: {

        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 14},
    },

    outputs: {

        'ADX': {
            type: 'series', series: {
                seriesId: null,
                title: 'adxTitle',
                labels: ['adxTitle'],
                fields: ['ADX'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ADX', renderAs: 'Line', dataField: 'ADX', color: '#FFEB3B', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var ADXController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.getWilders = function (this: any, series: any, idx: any, prd: any, prev: any){
                if (idx < prd) {
                    return null;
                }
                if (prev.getValue(idx - 1) === null) {
                    var movAvg = 0;
                    for (var j = idx - prd + 1; j < idx + 1; j++) {
                        if (series.getValue(j) === null) return null;
                        movAvg = movAvg + series.getValue(j);
                    }
                    movAvg = movAvg / prd;
                    return movAvg;
                } else {
                    var wsma1 = prev.getValue(idx-1);
                    if (wsma1 === null) return null;
                    var movAvg = 0;
                    for (var j = idx - prd + 1; j < idx + 1; j++) {
                        if (series.getValue(j) === null) return null;
                        movAvg = movAvg + series.getValue(j);
                    }
                    if (series.getValue(idx) === null) return null;
                    var wsma = (movAvg - wsma1 + series.getValue(idx)) / prd;
                    return wsma;
                }
            }

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;


            this.init = function (this: any) {
                this.helper = this.context.createSeries(['MDM', 'PDM', 'MMAUM', 'MMADM', 'MMAUP', 'MMADP', 'TRUERANGE', 'MINUSDI', 'PLUSDI', 'DS', 'aadx']);
                this.MDM = this.context.getRawSeriesWrapper(this.helper, 'MDM');
                this.PDM = this.context.getRawSeriesWrapper(this.helper, 'PDM');
                this.MMAUM = this.context.getRawSeriesWrapper(this.helper, 'MMAUM');
                this.MMADM = this.context.getRawSeriesWrapper(this.helper, 'MMADM');
                this.MMAUP = this.context.getRawSeriesWrapper(this.helper, 'MMAUP');
                this.MMADP = this.context.getRawSeriesWrapper(this.helper, 'MMADP');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
                this.MINUSDI = this.context.getRawSeriesWrapper(this.helper, 'MINUSDI');
                this.PLUSDI = this.context.getRawSeriesWrapper(this.helper, 'PLUSDI');
                this.DS = this.context.getRawSeriesWrapper(this.helper, 'DS');
                this.aadx = this.context.getRawSeriesWrapper(this.helper, 'aadx');
            }

            this.calculate = function (this: any, INDEX: any) {
                var low = this.LOW.getValue(INDEX);
                var low1 = this.LOW.getValue(INDEX - 1);
                var high = this.HIGH.getValue(INDEX);
                var high1 = this.HIGH.getValue(INDEX - 1);

                if (low === null || low1 === null || high === null || high1 === null) return;

                var tmpL = low1 - low;
                var tmpH = high - high1;

                if (tmpL < 0) tmpL = 0;
                if (tmpH < 0) tmpH = 0;

                this.MDM.setValue(INDEX, tmpL);
                this.PDM.setValue(INDEX, tmpH);
                this.TRUERANGE.setValue(INDEX, FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, INDEX));

                var mmaum = FUSION.lib.getMMA(this.MDM, INDEX, this.PERIOD, this.MMAUM);
                var mmadm = FUSION.lib.getMMA(this.TRUERANGE, INDEX, this.PERIOD, this.MMADM);
                var mmadp = FUSION.lib.getMMA(this.TRUERANGE, INDEX, this.PERIOD, this.MMADP);
                var mmaup = FUSION.lib.getMMA(this.PDM, INDEX, this.PERIOD, this.MMAUP);

                this.MMAUM.setValue(INDEX, mmaum);
                this.MMADM.setValue(INDEX, mmadm);                
                this.MMAUP.setValue(INDEX, mmaup);
                this.MMADP.setValue(INDEX, mmadp);

                if (mmaum === null || !mmadm || !mmadp || mmaup === null) return;

                var plusdi = 100 * mmaup / mmadp;
                var minusdi = 100 * mmaum / mmadm;

                this.PLUSDI.setValue(INDEX, plusdi);
                this.MINUSDI.setValue(INDEX, minusdi);

                var diff = Math.abs(plusdi - minusdi);
                var summ = plusdi + minusdi;

                if (summ) {
                    this.DS.setValue(INDEX, diff / summ);
                    //EMA VERSION
                    var aadx = this.getWilders(this.DS, INDEX, this.PERIOD, this.aadx);
                    this.aadx.setValue(INDEX, aadx);
                    
                    if (aadx === null) return;
                    this.ADX.setValue(INDEX, 100 * aadx);
                } else {
                    this.ADX.setValue(INDEX, this.ADX.getValue(INDEX - 1));
                }
            }

        };

        return new ADXController(context, inputs, outputs);
    }

}
//---------------------------------------------------------------------------------------------------------
FUSION.scripts['IF'] = {

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

FUSION.scripts['HLINE'] = {

    title: 'hlineTitle',
    description: 'hlineDescription',
    type: 'indicators',
    newPane: false,
    quickAdd: false,
    inputs: {

        'VALUE': {type: 'double', name: 'value', properties: {max: 2000000, min: -2000000}, value: 1}

    },

    outputs: {

        'HLINE': {
            type: 'series', series: {
                seriesId: null,
                title: 'hlineTitle',
                labels: ['value'],
                fields: ['HLINEValue'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'HLINE', renderAs: 'Line', dataField: 'HLINEValue', color: '#ffc107', width: 1, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var HLINEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {

            }

            this.calculate = function (this: any, index: any) {
                this.HLINEValue.setValue(index, this.VALUE);
            }

        };

        return new HLINEController(context, inputs, outputs);
    }
}

FUSION.scripts['OBJECT'] = {

    title: 'objectTitle',
    userName: "objectUserName",
    description: 'objectDescription',
    type: 'hidden',
    newPane: false,
    visible: false,
    permHide: true,

    inputs: {
        'OBJECT': {type: 'object', name: 'line', properties: {}, value: null, hidden: true}
    },

    outputs: {

        'LINE_SERIES': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'lineSeries',
                labels: ['value'],
                fields: ['Value'],
                data: null
            }
        }

    },

    plotters: [
        {type: 'SeriesObject', dataLink: 'LINE_SERIES', renderAs: 'Line', dataField: 'Value', color: '#ffc107', width: 1, dash: []}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var ObjectIndicatorController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.updateAnchors();
            };

            this.updateAnchors = function (this: any) {
                var self = this;
                var len = this.Value.getSeriesLength();
                var lastIndex = len - 1;
                var lastStamp = this.Value.getStamp(lastIndex);
                this.OBJECT.anchors.forEach(function(a: FusionRecord){
                    //var stamp = a.stamp - a.offset;
                    var stamp = a.prawilnyStamp;
                    if(stamp > lastStamp){
                        var lastIndex = self.getStampIndex(lastStamp);
                        var offsetIndex = Math.round((stamp - lastStamp) / self.context.getMainSeries().interval.milis);
                        a._index = Math.round(lastIndex + offsetIndex);
                    }else if(stamp < 0){
                        a._index = -1;
                    }else{
                        a._index = self.getStampIndex(stamp);
                    }
                });
            };

            this.calculate = function (this: any, index: any) {
                if(!this.OBJECT.type){
                    this.Value.setValue(index, 1);
                    return;
                }

                if(index == 0){
                    this.updateAnchors();
                }

                if(this.OBJECT.type == 'trendLine'){
                    var v1 = this.OBJECT.anchors[0].value;
                    var v2 = this.OBJECT.anchors[1].value;
                    var i1 = this.OBJECT.anchors[0]._index;
                    var i2 = this.OBJECT.anchors[1]._index;
                    this.line = calcLine({x: i1, y: v1}, {x: i2, y: v2});
                    var v = this.line.a * index + this.line.b;
                    this.Value.setValue(index, v);
                } else if(this.OBJECT.type == 'hLine'){
                    this.Value.setValue(index, this.OBJECT.anchors[0].value);
                }
            };

            this.getStampIndex = function (this: any, s: any) {
                var len = this.Value.getSeriesLength();
                var lastIndex = len - 1;

                for (var i = 0; i < len; i++) {
                    var stamp = this.Value.getStamp(i);

                    if (stamp == s) return i;

                    if(i < lastIndex){
                        var nextStamp = this.Value.getStamp(i + 1);
                        if(s > stamp && s < nextStamp) return i;
                    }

                    if(i == lastIndex){
                        var intervalInMilis = this.context.getMainSeries().interval.milis;
                        if(s > stamp && s < stamp + intervalInMilis) return i;
                    }
                }
                return -1;
            };
        };

        return new ObjectIndicatorController(context, inputs, outputs);
    }
};


//---------------------------------------------------------------------------------------------------------
FUSION.scripts['SMA'] = {

    title: 'smaTitle',
    description: 'smaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {

        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},

    },

    outputs: {

        'SMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'smaTitle',
                labels: ['value'],
                fields: ['SMAValue'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'SMA', renderAs: 'Line', dataField: 'SMAValue', color: '#ff9800', width: 1.5, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var SMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {

            }

            this.calculate = function (this: any, index: any) {


                this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PERIODS));

            }

        };

        return new SMAController(context, inputs, outputs);
    }
}

//---------------------------------------------------------------------------------------------------------
FUSION.scripts['EMA'] = {

    title: 'emaTitle',
    description: 'emaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {

        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},

    },

    outputs: {

        'EMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'emaTitle',
                labels: ['value'],
                fields: ['EMA'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'EMA', renderAs: 'Line', dataField: 'EMA', color: '#ff9800', width: 1.5, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var EMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                this.EMA.setValue(index, FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA));
            }
        };

        return new EMAController(context, inputs, outputs);
    }
}

//-------------------------------------CCI----------------------------------------------------------------
FUSION.scripts['CCI'] = {

    title: 'cciTitle',
    description: 'cciDescription',
    type: 'indicators',
    newPane: true,
    inputs: {

        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 12},
    },

    outputs: {

        'CCI': {
            type: 'series', series: {
                seriesId: null,
                title: 'cciDescription',
                labels: ['cciTitle'],
                fields: ['CCI'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'CCI', renderAs: 'Line', dataField: 'CCI', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var CCIController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;


            this.init = function (this: any) {
                this.helper = this.context.createSeries(['MEAN', 'AVG']);
                this.MEAN = this.context.getRawSeriesWrapper(this.helper, 'MEAN');
                this.AVG = this.context.getRawSeriesWrapper(this.helper, 'AVG');
            }

            this.calculate = function (this: any, index: any) {
                if (this.HIGH.getValue(index) === null || this.LOW.getValue(index) === null || this.CLOSE.getValue(index) === null) return;

                this.MEAN.setValue(index, (this.HIGH.getValue(index) + this.LOW.getValue(index) + this.CLOSE.getValue(index)) / 3);
                this.AVG.setValue(index, FUSION.lib.getMA(this.MEAN, index, this.PERIODS));
                if (this.AVG.getValue(index) === null) return;

                var dev = 0.0;
                if (index >= this.PERIODS - 1) {
                    for(var j = index - this.PERIODS + 1; j <= index; j++){
                        if (this.MEAN.getValue(j) === null) return;
                        dev = dev + Math.abs(this.MEAN.getValue(j) - this.AVG.getValue(index));
                    }

                    this.CCI.setValue(index, (this.MEAN.getValue(index) - this.AVG.getValue(index)) * this.PERIODS / dev / 0.015);
                }
            }

        };

        return new CCIController(context, inputs, outputs);
    }

}

//-------------------------------------CEX----------------------------------------------------------------
FUSION.scripts['CEX'] = {

    title: 'cexTitle',
    description: 'cexDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'OPEN': {type: 'series', name: 'priceOpen', properties: {def:'o'}, value: null},
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periodsATR', properties: {max: 100, min: 0}, value: 12},
        'RATE': {type: 'double', name: 'rateATR', properties: {max: 200, min: 0}, value: 4},
    },

    outputs: {

        'CEX': {
            type: 'series', series: {
                seriesId: null,
                title: 'cexDescription',
                labels: ['cexTitle'],
                fields: ['CEX'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'CEX', renderAs: 'Line', dataField: 'CEX', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var CEXController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.isInRange = function (this: any, rangeStart: any, rangeEnd: any, value: any) {
              if (rangeStart > rangeEnd) {
                var tmp = rangeStart;
                rangeStart = rangeEnd;
                rangeEnd = tmp;
              }
              if (rangeStart < value && rangeEnd > value)
                return true;
              else return false;
            };

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['tempLongs', 'tempShorts','stopLong', 'stopShort','isLong','ATR','TRUERANGE']);
                this.tempLongs = this.context.getRawSeriesWrapper(this.helper, 'tempLongs');
                this.tempShorts = this.context.getRawSeriesWrapper(this.helper, 'tempShorts');
                this.stopLong = this.context.getRawSeriesWrapper(this.helper, 'stopLong');
                this.stopShort = this.context.getRawSeriesWrapper(this.helper, 'stopShort');
                this.isLong = this.context.getRawSeriesWrapper(this.helper, 'isLong');
                this.ATR = this.context.getRawSeriesWrapper(this.helper, 'ATR');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
            };

            this.onModify = function (this: any) {
                this.init();
            };

            this.calculate = function (this: any, index: any) {
                this.TRUERANGE.setValue(index, FUSION.lib.getTrueRange(this.HIGH,this.LOW,this.CLOSE,index));
                this.ATR.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIODS, this.ATR));

                var stateLong 	= FUSION.MIN_VALUE;
                var stateShort  = FUSION.MAX_VALUE;
                var lastCex = this.CEX.getValue(index - 1);
                var close = this.CLOSE.getValue(index);
                var open = this.OPEN.getValue(index);
                var atr = this.ATR.getValue(index);

                if (atr === null || open === null) {
                    this.tempLongs.setValue(index, stateLong);
                    this.tempShorts.setValue(index, stateShort);
                    this.isLong.setValue(index, -1);
                    this.stopLong.setValue(index, FUSION.MAX_VALUE);
                    this.stopShort.setValue(index, FUSION.MIN_VALUE);
                } else {
                    var lastStopLong = this.stopLong.getValue(index - 1);
                    var lastStopShort = this.stopShort.getValue(index - 1);

                    if (open === null || close === null || atr === null) return;
                    
                    this.tempLongs.setValue(index, close - (this.RATE*atr));
                    this.tempShorts.setValue(index, close + (this.RATE*atr));

                    stateLong = FUSION.lib.getMax(this.tempLongs, index, this.PERIODS);
                    stateShort = FUSION.lib.getMin(this.tempShorts, index, this.PERIODS);

                    this.stopLong.setValue(index, (close < lastStopLong) ? stateLong : ((stateLong >= lastStopLong) ? stateLong : lastStopLong));
                    this.stopShort.setValue(index, (close > lastStopShort) ? stateShort : ((stateShort <= lastStopShort) ? stateShort : lastStopShort));

                    var blong = false;
                    if (this.isLong.getValue(index - 1) == 1) blong = true;

                    if ((this.isInRange(open, close, lastCex) || (lastCex > close)) && blong) {
                        this.isLong.setValue(index, -1);
                    }
                    else if ((this.isInRange(open, close, lastCex) || (lastCex < close)) && !blong) {
                        this.isLong.setValue(index, 1);
                    } else {
                        this.isLong.setValue(index, this.isLong.getValue(index - 1));
                    }
                    if (this.isLong.getValue(index) == 1) this.CEX.setValue(index, this.stopLong.getValue(index));
                    else this.CEX.setValue(index, this.stopShort.getValue(index));
                }
            };
        };

        return new CEXController(context, inputs, outputs);
    }

}


//-------------------------------------CHAIKIN----------------------------------------------------------------
FUSION.scripts['CHAIKIN'] = {

    title: 'chaikinTitle',
    description: 'chaikinDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'MPERIOD': {type: 'integer', name: 'mavPeriods', properties: {max: 100, min: 0}, value: 10},
        'RPERIOD': {type: 'integer', name: 'rovPeriods', properties: {max: 200, min: 0}, value: 10},
    },

    outputs: {

        'CHAIKIN': {
            type: 'series', series: {
                seriesId: null,
                title: 'chaikinDescription',
                labels: ['chaikinTitle'],
                fields: ['CHAIKIN'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'CHAIKIN', renderAs: 'Line', dataField: 'CHAIKIN', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var CHAIKINController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.emaf = function (this: any, series1: any, series2: any, idx: any, pds: any, prev: any) {
                if (series1.getValue(idx) === null || series2.getValue(idx) === null) {
                    return null;
                }
                if (series1.getValue(idx - pds) === null || series2.getValue(idx - pds) === null) {
                    return null;
                }

                if (prev.getValue(idx - 1) === null) {
                    var sum = 0;
                    for (var i = idx - pds + 1; i <= idx; i++) {
                        if (series1.getValue(i) === null || series2.getValue(i) === null) return null;
                        sum = sum + (series1.getValue(i) - series2.getValue(i));
                    }
                    sum = sum / pds;
                    return sum;
                } else {
                    var alfa = 2 / (pds+1);
                    var value = series1.getValue(idx)-series2.getValue(idx);
                    var yesterday = prev.getValue(idx-1);
                    var a = alfa*value + (1-alfa)*yesterday;
                    return a;
                }
            }            
            this.init = function (this: any) {
                this.helper = this.context.createSeries(['EMA']);
                this.EMA = this.context.getRawSeriesWrapper(this.helper, 'EMA');
            }

            this.calculate = function (this: any, index: any) {
                var ema = this.emaf(this.HIGH, this.LOW, index, this.MPERIOD, this.EMA);
                this.EMA.setValue(index, ema);
                if (ema === null || this.EMA.getValue(index - this.RPERIOD) === null || this.EMA.getValue(index - this.RPERIOD) === null) return;

                if (index>this.RPERIOD-1) {
                    var vc =  100 * (ema - this.EMA.getValue(index - this.RPERIOD)) / this.EMA.getValue(index - this.RPERIOD);
                    this.CHAIKIN.setValue(index,vc);
                }
            }
        };
        return new CHAIKINController(context, inputs, outputs);
    }

}


//-------------------------------------DIRMOV----------------------------------------------------------------
FUSION.scripts['DIRMOV'] = {

    title: 'dirmovTitle',
    description: 'dirmovDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'rovPeriods', properties: {max: 200, min: 0}, value: 14},
    },

    outputs: {

        'DIRMOV': {
            type: 'series', series: {
                seriesId: null,
                title: 'dirmovDescription',
                labels: ['pdi', 'mdi'],
                fields: ['DIRMOV_MDI','DIRMOV_PDI',],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'DIRMOV', renderAs: 'Line', dataField: 'DIRMOV_PDI', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'DIRMOV', renderAs: 'Line', dataField: 'DIRMOV_MDI', color: '#f44336', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var DIRMOVController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['MDM', 'MMAU','MMAD', 'PDM','PMAU','PMAD','TRUERANGE']);
                this.MDM = this.context.getRawSeriesWrapper(this.helper, 'MDM');
                this.MMAU = this.context.getRawSeriesWrapper(this.helper, 'MMAU');
                this.MMAD = this.context.getRawSeriesWrapper(this.helper, 'MMAD');
                this.PDM = this.context.getRawSeriesWrapper(this.helper, 'PDM');
                this.PMAU = this.context.getRawSeriesWrapper(this.helper, 'PMAU');
                this.PMAD = this.context.getRawSeriesWrapper(this.helper, 'PMAD');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');				}

            this.calculate = function (this: any, index: any) {


                if (
                    this.LOW.getValue(index) === null || this.LOW.getValue(index - 1) === null ||
                    this.HIGH.getValue(index) === null || this.HIGH.getValue(index - 1) === null
                )
                    return;
                var tmp = 0;
                var ptmp = 0;
                if(index>0){
                    tmp = this.LOW.getValue(index-1) - this.LOW.getValue(index);
                    ptmp = this.HIGH.getValue(index) - this.HIGH.getValue(index-1);
                }
                if (tmp<0) tmp = 0;
                if (ptmp<0) ptmp = 0;

                this.MDM.setValue(index,tmp);
                this.PDM.setValue(index,ptmp);
                this.TRUERANGE.setValue(index,FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index));
                this.MMAU.setValue(index, FUSION.lib.getMMA(this.MDM, index, this.PERIOD, this.MMAU));
                this.MMAD.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.MMAD));

                this.PMAU.setValue(index, FUSION.lib.getMMA(this.PDM, index, this.PERIOD, this.PMAU));
                this.PMAD.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.PMAD));

                if (this.MMAU.getValue(index) === null ||
                    this.PMAU.getValue(index) === null ||
                    this.MMAD.getValue(index) === null ||
                    this.PMAD.getValue(index) === null
                ) {
                    return;
                }

                this.DIRMOV_MDI.setValue(index, 100*this.MMAU.getValue(index)/this.MMAD.getValue(index));
                this.DIRMOV_PDI.setValue(index, 100*this.PMAU.getValue(index)/this.PMAD.getValue(index));
            }
        };
        return new DIRMOVController(context, inputs, outputs);
    }

}

//-------------------------------------ENVELOPE----------------------------------------------------------------
FUSION.scripts['ENVELOPE'] = {

    title: 'envelopeTitle',
    description: 'envelopeDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
        'VSHIFT': {type: 'double', name: 'verticalShift', properties: {max: 200, min: 0, step: 0.01}, value: 5},
        'UNITS': {type: 'list', name: 'value', properties: {},list: ['Percentage', 'Value'], value: 'Percentage'},
    },

    outputs: {

        'ENVELOPE': {
            type: 'series', series: {
                seriesId: null,
                title: 'envelopeDescription',
                labels: ['envelopeUp', 'envelopeDown'],
                fields: ['ENVELOPE_UP','ENVELOPE_DN',],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ENVELOPE', renderAs: 'Line', dataField: 'ENVELOPE_UP', color: '#e91e63', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'ENVELOPE', renderAs: 'Line', dataField: 'ENVELOPE_DN', color: '#e91e63', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var ENVELOPEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {

                var avg = FUSION.lib.getMA(this.CLOSE,index,this.PERIODS);
                if (avg === null) return;

                if(this.UNITS==undefined || this.UNITS===null || this.UNITS==='Percentage')
                {
                    this.ENVELOPE_UP.setValue(index, avg*(1+(this.VSHIFT/100)));
                    this.ENVELOPE_DN.setValue(index, avg*(1-(this.VSHIFT/100)));
                }
                else
                {
                    this.ENVELOPE_UP.setValue(index, avg+this.VSHIFT);
                    this.ENVELOPE_DN.setValue(index, avg-this.VSHIFT);
                }
            }
        };
        return new ENVELOPEController(context, inputs, outputs);
    }

}

//-------------------------------------MINUSDI----------------------------------------------------------------
FUSION.scripts['MINUSDI'] = {

    title: 'minusdiTitle',
    description: 'minusdiDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'rovPeriods', properties: {max: 200, min: 0}, value: 14},
    },

    outputs: {

        'MINUSDI': {
            type: 'series', series: {
                seriesId: null,
                title: 'minusdiTitle',
                labels: ['minusdiTitle'],
                fields: ['MINUSDI'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'MINUSDI', renderAs: 'Line', dataField: 'MINUSDI', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var MINUSDIController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['MDM', 'MMAU','MMAD','TRUERANGE']);
                this.MDM = this.context.getRawSeriesWrapper(this.helper, 'MDM');
                this.MMAU = this.context.getRawSeriesWrapper(this.helper, 'MMAU');
                this.MMAD = this.context.getRawSeriesWrapper(this.helper, 'MMAD');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');				}

            this.calculate = function (this: any, index: any) {
                var tmp = 0;
                if(index>0){
                    tmp = this.LOW.getValue(index-1) - this.LOW.getValue(index);
                }
                if (tmp<0) tmp = 0;

                this.MDM.setValue(index,tmp);
                this.TRUERANGE.setValue(index,FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index));
                this.MMAU.setValue(index, FUSION.lib.getMMA(this.MDM, index, this.PERIOD, this.MMAU));
                this.MMAD.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.MMAD));
                
                if (this.MMAU.getValue(index) === null || this.MMAD.getValue(index) === null) return;

                this.MINUSDI.setValue(index, 100*this.MMAU.getValue(index)/this.MMAD.getValue(index));
            }
        };
        return new MINUSDIController(context, inputs, outputs);
    }

}

//-------------------------------------MOMENTUM----------------------------------------------------------------
FUSION.scripts['MOMENTUM'] = {

    title: 'momentumTitle',
    description: 'momentumDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
        'MODE': {type: 'list', name: 'method', properties: {},list: ['Quotient', 'Difference'], value: 'Quotient'},
    },

    outputs: {

        'MOMENTUM': {
            type: 'series', series: {
                seriesId: null,
                title: 'momentumTitle',
                labels: ['momentumTitle'],
                fields: ['MOMENTUM',],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'MOMENTUM', renderAs: 'Line', dataField: 'MOMENTUM', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ]
    ,
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var MOMENTUMController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null) return;
                var displace = FUSION.lib.displace(this.CLOSE, index, this.PERIODS);
                if (displace === null) return;

                if (this.MODE === 'Quotient')//!DIVMODE)
                {
                    this.MOMENTUM.setValue(index, 100 * this.CLOSE.getValue(index) / displace);
                }
                else
                {
                    this.MOMENTUM.setValue(index, this.CLOSE.getValue(index) - displace);
                }
            }
        };
        return new MOMENTUMController(context, inputs, outputs);
    }

}

//-----------------------------------OPEN INT-------------------------------------------------------------
FUSION.scripts['OPENINT'] = {

    title: 'openintTitle',
    description: 'openintDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'i'}, value: null},
    },

    outputs: {

        'OPENINT': {
            type: 'series', series: {
                seriesId: null,
                title: 'openintTitle',
                labels: ['value'],
                fields: ['OPENINT'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'OPENINT', renderAs: 'Line', dataField: 'OPENINT', color: '#f44336', width: 1.5, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var OPENINTController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                this.OPENINT.setValue(index, this.CLOSE.getValue(index));
            }
        };

        return new OPENINTController(context, inputs, outputs);
    }
}

//-----------------------------------VOLUME-------------------------------------------------------------
FUSION.scripts['VOLUME'] = {

    title: 'volumeTitle',
    description: 'volumeDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'v'}, value: null},
    },

    outputs: {

        'VOLUME': {
            type: 'series', series: {
                seriesId: null,
                title: 'volumeTitle',
                labels: ['value'],
                fields: ['VOLUME'],
                precisions: [2],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'VOLUME', renderAs: 'Volume Histogram', renderLegend: false, dataField: 'VOLUME', color: '#f44336', width: 1.5, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var VOLUMEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                this.VOLUME.setValue(index, this.CLOSE.getValue(index));
            }
        };

        return new VOLUMEController(context, inputs, outputs);
    }
}

//-------------------------------------PARSAR----------------------------------------------------------------
FUSION.scripts['PARSAR'] = {

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

//-------------------------------------PLUSDI----------------------------------------------------------------
FUSION.scripts['PLUSDI'] = {

    title: 'plusdiTitle',
    description: 'plusdiDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'period', properties: {max: 200, min: 0}, value: 14},
    },

    outputs: {

        'PLUSDI': {
            type: 'series', series: {
                seriesId: null,
                title: 'plusdiTitle',
                labels: ['plusdiDescription'],
                fields: ['PLUSDI'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'PLUSDI', renderAs: 'Line', dataField: 'PLUSDI', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var PLUSDIController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['PDM', 'MMAU','MMAD','TRUERANGE']);
                this.PDM = this.context.getRawSeriesWrapper(this.helper, 'PDM');
                this.MMAU = this.context.getRawSeriesWrapper(this.helper, 'MMAU');
                this.MMAD = this.context.getRawSeriesWrapper(this.helper, 'MMAD');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');				}

            this.calculate = function (this: any, index: any) {
                if (this.HIGH.getValue(index) === null || this.HIGH.getValue(index - 1) === null) return;
                var tmp = 0;
                
                if(index>0){
                    tmp = this.HIGH.getValue(index) - this.HIGH.getValue(index-1);
                }
                if (tmp<0) tmp = 0;

                this.PDM.setValue(index,tmp);
                this.TRUERANGE.setValue(index,FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index));
                this.MMAU.setValue(index, FUSION.lib.getMMA(this.PDM, index, this.PERIOD, this.MMAU));
                this.MMAD.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.MMAD));
                if (this.MMAU.getValue(index) === null || this.MMAD.getValue(index) === null) return;

                this.PLUSDI.setValue(index, 100*this.MMAU.getValue(index)/this.MMAD.getValue(index));
            }
        };
        return new PLUSDIController(context, inputs, outputs);
    }

}

//-------------------------------------PRICE TREND----------------------------------------------------------------
FUSION.scripts['TREND'] = {

    title: 'trendTitle',
    description: 'trendDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'INDICATOR': {type: 'series', name: 'indicator', properties: {}, value: null},
    },

    outputs: {

        'TREND': {
            type: 'series', series: {
                seriesId: null,
                title: 'trendTitle',
                labels: ['trendTitle'],
                fields: ['TREND'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'TREND', renderAs: 'Line', dataField: 'TREND', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var TRENDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {	}

            this.calculate = function (this: any, index: any) {

                if (this.INDICATOR.getValue(index) === null || this.HIGH.getValue(index) === null || this.LOW.getValue(index) === null) return;
                this.TREND.setValue(index,0);
                if (this.INDICATOR.getValue(index)>=this.HIGH.getValue(index)) {
                    this.TREND.setValue(index,-1);
                } else
                if (this.INDICATOR.getValue(index)<=this.LOW.getValue(index)) {
                    this.TREND.setValue(index,1);
                }
            }
        };
        return new TRENDController(context, inputs, outputs);
    }

}


//-------------------------------------ROC----------------------------------------------------------------
FUSION.scripts['ROC'] = {

    title: 'rocTitle',
    description: 'rocDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 12},
        'PERCMODE': {type: 'boolean', name: 'percentageMode', properties: {},value: null},
    },

    outputs: {

        'ROC': {
            type: 'series', series: {
                seriesId: null,
                title: 'rocDescription',
                labels: ['rocTitle'],
                fields: ['ROC'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ROC', renderAs: 'Line', dataField: 'ROC', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var ROCController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {	}

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null) return;

                var dis=FUSION.lib.displace(
                    this.CLOSE,index,this.PERIODS);
                    
                if (dis === null) return;

                if(!this.PERCMODE)
                {
                    this.ROC.setValue(index,this.CLOSE.getValue(index)-dis);
                }
                else
                {
                    this.ROC.setValue(index,100*(this.CLOSE.getValue(index)-dis)/dis);
                }
            }
        };
        return new ROCController(context, inputs, outputs);
    }
}

//-------------------------------------RSI----------------------------------------------------------------
FUSION.scripts['RSI'] = {

    title: 'rsiTitle',
    description: 'rsiDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
        'HI_BASELINE': {type: 'integer', name: 'hiBaseline', properties: {def: 70, max: 100, min: 0}, value: 70},
        'LO_BASELINE': {type: 'integer', name: 'loBaseline', properties: {def: 30, max: 100, min: 0}, value: 30},
    },

    outputs: {

        'RSI': {
            type: 'series', series: {
                seriesId: null,
                title: 'rsiDescription',
                labels: ['rsiTitle', 'RSIBaseHI', 'RSIBaseLO'],
                fields: ['RSI','RSIBaseHI','RSIBaseLO'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'RSI', renderAs: 'Line', dataField: 'RSI', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'RSI', renderAs: 'Line', dataField: 'RSIBaseHI', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'RSI', renderAs: 'Line', dataField: 'RSIBaseLO', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var RSIController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['AU', 'AD','MAU','TRUERANGE']);
                this.AU = this.context.getRawSeriesWrapper(this.helper, 'AU');
                this.AD = this.context.getRawSeriesWrapper(this.helper, 'AD');
                this.MAU = this.context.getRawSeriesWrapper(this.helper, 'MAU');
                this.MAD = this.context.getRawSeriesWrapper(this.helper, 'MAD');
            }

            this.calculate = function (this: any, index: any) {
                this.AU.setValue(index, 0);
                this.AD.setValue(index, 0);
                this.MAU.setValue(index, 0);
                this.MAD.setValue(index, 0);
                this.RSIBaseHI.setValue(index, this.HI_BASELINE);
                this.RSIBaseLO.setValue(index, this.LO_BASELINE);

                if (index > this.PERIOD-1) {
                    if (this.CLOSE.getValue(index) === null || this.CLOSE.getValue(index - 1) === null) return;
                    var diff = this.CLOSE.getValue(index) - this.CLOSE.getValue(index-1);

                    if (diff > 0) {

                        this.AU.setValue(index, diff);
                        this.AD.setValue(index, 0);

                    } else {

                        this.AU.setValue(index, 0);
                        this.AD.setValue(index, -diff);

                    }


                    var mmaAU = FUSION.lib.getMMA (this.AU, index, this.PERIOD, this.MAU);
                    var mmaAD = FUSION.lib.getMMA (this.AD, index, this.PERIOD, this.MAD);
                    this.MAU.setValue(index, mmaAU);
                    this.MAD.setValue(index, mmaAD);
                    if (mmaAU === null || mmaAD === null) return;
                    if (mmaAU+mmaAD==0) this.RSI.setValue(index,this.LO_BASELINE+((this.HI_BASELINE-this.LO_BASELINE)/2));
                    else
                        this.RSI.setValue(index, 100 * mmaAU / (mmaAU + mmaAD));
                }


            }
        };
        return new RSIController(context, inputs, outputs);
    }

}


//-------------------------------------SMI----------------------------------------------------------------
FUSION.scripts['SMI'] = {

    title: 'smiTitle',
    description: 'smiDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 12},
        'K_SLOW_PERIOD': {type: 'integer', name: 'kSlowPeriod', properties: {def: 3, max: 100, min: 0}, value: 3},
        'D_SLOW_PERIOD': {type: 'integer', name: 'dSlowPeriod', properties: {def: 3, max: 100, min: 0}, value: 3},
        'SIGNAL_PERIOD': {type: 'integer', name: 'signalPeriod', properties: {def: 3, max: 100, min: 0}, value: 3},
        'HI_BASELINE': {type: 'integer', name: 'hiBaseline', properties: {def: 50, max: 100, min: -100}, value: 50},
        'LO_BASELINE': {type: 'integer', name: 'loBaseline', properties: {def: -50, max: 100, min: -100}, value: -50},
    },

    outputs: {

        'SMI': {
            type: 'series', series: {
                seriesId: null,
                title: 'smiDescription',
                labels: ['smiTitle', 'SMISignal', 'SMIBaseHI', 'SMIBaseLO'],
                fields: ['SMI','SMISignal','SMIBaseHI','SMIBaseLO'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'SMI', renderAs: 'Line', dataField: 'SMI', color: '#f44336', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SMI', renderAs: 'Line', dataField: 'SMISignal', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SMI', renderAs: 'Line', dataField: 'SMIBaseHI', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SMI', renderAs: 'Line', dataField: 'SMIBaseLO', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var SMIController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['CMSERIES', 'HLSERIES','CMEMA','CMEMA2','HLEMA','HLEMA2']);
                this.CMSERIES = this.context.getRawSeriesWrapper(this.helper, 'CMSERIES');
                this.HLSERIES = this.context.getRawSeriesWrapper(this.helper, 'HLSERIES');
                this.CMEMA = this.context.getRawSeriesWrapper(this.helper, 'CMEMA');
                this.CMEMA2 = this.context.getRawSeriesWrapper(this.helper, 'CMEMA2');
                this.HLEMA = this.context.getRawSeriesWrapper(this.helper, 'HLEMA');
                this.HLEMA2 = this.context.getRawSeriesWrapper(this.helper, 'HLEMA2');
            }

            this.calculate = function (this: any, index: any) {
                this.CMSERIES.setValue(index,0);
                this.HLSERIES.setValue(index,0);

                this.CMEMA.setValue(index,0);
                this.HLEMA.setValue(index,0);
                this.CMEMA2.setValue(index,0);
                this.HLEMA2.setValue(index,0);

                this.SMIBaseHI.setValue(index, this.HI_BASELINE);
                this.SMIBaseLO.setValue(index, this.LO_BASELINE);

                var lo = FUSION.lib.getMin (this.LOW, index, this.PERIOD);
                var hi = FUSION.lib.getMax (this.HIGH, index, this.PERIOD);
                var diff = hi-lo;

                if (this.CLOSE.getValue(index) === null || lo === null || hi === null) return;
                this.CMSERIES.setValue(index, this.CLOSE.getValue(index)-(0.5*(hi+lo)));
                this.HLSERIES.setValue(index, diff);

                this.CMEMA.setValue(index,FUSION.lib.getEMA(this.CMSERIES, index, this.K_SLOW_PERIOD, this.CMEMA));
                this.HLEMA.setValue(index,FUSION.lib.getEMA(this.HLSERIES, index, this.D_SLOW_PERIOD, this.HLEMA));

                this.CMEMA2.setValue(index,FUSION.lib.getEMA(this.CMEMA, index, this.K_SLOW_PERIOD, this.CMEMA2));
                this.HLEMA2.setValue(index,FUSION.lib.getEMA(this.HLEMA, index, this.D_SLOW_PERIOD, this.HLEMA2));

                this.SMI.setValue(index,100 * this.CMEMA2.getValue(index) / (0.5 * this.HLEMA2.getValue(index)));
                this.SMISignal.setValue(index, FUSION.lib.getEMA(this.SMI, index, this.SIGNAL_PERIOD, this.SMISignal));

            }
        };
        return new SMIController(context, inputs, outputs);
    }

}

//-------------------------------------STOCHASTICOSCILLATOR----------------------------------------------------------------
FUSION.scripts['STOCHASTICOSCILLATOR'] = {

    title: 'stochasticOscillatorTitle',
    description: 'stochasticOscillatorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 8},
        'K_SLOW_PERIOD': {type: 'integer', name: 'kSlowPeriod', properties: {def: 3, max: 100, min: 0}, value: 3},
        'D_SLOW_PERIOD': {type: 'integer', name: 'dSlowPeriod', properties: {def: 3, max: 100, min: 0}, value: 3},
        'HI_BASELINE': {type: 'integer', name: 'hiBaseline', properties: {def: 80, max: 100, min: 0}, value: 80},
        'LO_BASELINE': {type: 'integer', name: 'loBaseline', properties: {def: 20, max: 100, min: 0}, value: 20},
    },

    outputs: {

        'SO': {
            type: 'series', series: {
                seriesId: null,
                title: 'stochasticOscillatorTitle',
                labels: ['SOLineK', 'SOLineD', 'SOBaseHI', 'SOBaseLO'],
                fields: ['SOLineK','SOLineD','SOBaseHI','SOBaseLO'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOLineK', color: '#f44336', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOLineD', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOBaseHI', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOBaseLO', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var SOController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['KSERIES']);
                this.KSERIES = this.context.getRawSeriesWrapper(this.helper, 'KSERIES');
            }

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null || this.HIGH.getValue(index) === null || this.LOW.getValue(index) === null) return;

                this.SOBaseHI.setValue(index, this.HI_BASELINE);
                this.SOBaseLO.setValue(index, this.LO_BASELINE);

                var lo = FUSION.lib.getMin (this.LOW, index, this.PERIOD);
                var hi = FUSION.lib.getMax (this.HIGH, index, this.PERIOD);


                var diff = hi - lo;

                this.KSERIES.setValue(index, 0);
                if (diff > 0) this.KSERIES.setValue(index,100 * (this.CLOSE.getValue(index) - lo) / diff);


                this.SOLineK.setValue(index, FUSION.lib.getMA (this.KSERIES, index, this.K_SLOW_PERIOD));
                this.SOLineD.setValue(index, FUSION.lib.getMA(this.SOLineK, index, this.D_SLOW_PERIOD));
            }
        };
        return new SOController(context, inputs, outputs);
    }

}

//-------------------------------------UltimateOSC----------------------------------------------------------------
FUSION.scripts['Ultimate_OSC'] = {

    title: 'ultimateOscillatorTitle',
    description: 'ultimateOscillatorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'FPERIOD': {type: 'integer', name: 'firstPeriod', properties: {def: 7, max: 100, min: 0}, value: 7},
        'SPERIOD': {type: 'integer', name: 'secondPeriod', properties: {def: 14, max: 100, min: 0}, value: 14},
        'TPERIOD': {type: 'integer', name: 'thirdPeriod', properties: {def: 28, max: 100, min: 0}, value: 28},
    },

    outputs: {

        'UO': {
            type: 'series', series: {
                seriesId: null,
                title: 'ultimateOscillatorDescription',
                labels: ['value'],
                fields: ['UltimateOsc'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'UO', renderAs: 'Line', dataField: 'UltimateOsc', color: '#00bcd4', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var UOController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['TRUERANGE','BPSERIES']);
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
                this.BPSERIES = this.context.getRawSeriesWrapper(this.helper, 'BPSERIES');
            }

            this.calculate = function (this: any, index: any) {

                var tr = FUSION.lib.getTrueRange(this.HIGH,this.LOW,this.CLOSE,index);
                var tl = FUSION.lib.getTrueLow(this.CLOSE,this.LOW,index);
                var bp = this.CLOSE.getValue(index) - tl;

                this.TRUERANGE.setValue(index, tr);
                this.BPSERIES.setValue(index, bp);

                var atr1 = FUSION.lib.getMA (this.TRUERANGE, index, this.FPERIOD);
                var atr2 = FUSION.lib.getMA (this.TRUERANGE, index, this.SPERIOD);
                var atr3 = FUSION.lib.getMA (this.TRUERANGE, index, this.TPERIOD);
                var abp1 = FUSION.lib.getMA (this.BPSERIES, index, this.FPERIOD);
                var abp2 = FUSION.lib.getMA (this.BPSERIES, index, this.SPERIOD);
                var abp3 = FUSION.lib.getMA (this.BPSERIES, index, this.TPERIOD);

                if (atr1 && atr2 && atr3 && abp1 && abp2 && abp3) {
                    var v = (abp1 / atr1 * 4 + abp2 / atr2 * 2 + abp3 / atr3) / 7 * 100;
                    this.UltimateOsc.setValue(index,v);
                }
            }
        };
        return new UOController(context, inputs, outputs);
    }

}


//FUNKCJE
//-----------------------------------Highest-------------------------------------------------------------
FUSION.scripts['HIGHEST'] = {

    title: 'highestTitle',
    description: 'highestDescription',
    type: 'functions',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'price', properties: {def:'h'}, value: null},
        'PERIODS': {type: 'integer', name: 'period', properties: {def: 25, max: 100, min: 0}, value: 25},
    },

    outputs: {
        'HIGHEST': {
            type: 'series', series: {
                seriesId: null,
                title: 'highestTitle',
                labels: ['value'],
                fields: ['HIGHEST'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'HIGHEST', renderAs: 'Line', dataField: 'HIGHEST', color: '#8bc34a', width: 1.5, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var HIGHESTController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                this.HIGHEST.setValue(index, FUSION.lib.getMax(this.HIGH, index, this.PERIODS));
            }
        };

        return new HIGHESTController(context, inputs, outputs);
    }
}


//-----------------------------------Lowest-------------------------------------------------------------
FUSION.scripts['LOWEST'] = {

    title: 'lowestTitle',
    description: 'lowestDescription',
    type: 'functions',
    newPane: false,
    inputs: {
        'LOW': {type: 'series', name: 'price', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'period', properties: {def: 25, max: 100, min: 0}, value: 25},
    },

    outputs: {
        'LOWEST': {
            type: 'series', series: {
                seriesId: null,
                title: 'lowestTitle',
                labels: ['value'],
                fields: ['LOWEST'],
                data: null
            }
        }

    },

    plotters: [

        {type:'SeriesObject', dataLink: 'LOWEST', renderAs: 'Line', dataField: 'LOWEST', color: '#ff5722', width: 1.5, dash:[]}


    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var LOWESTController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                this.LOWEST.setValue(index, FUSION.lib.getMin(this.LOW, index, this.PERIODS));
            }
        };

        return new LOWESTController(context, inputs, outputs);
    }
}

//-----------------------------------IGLUE-------------------------------------------------------------
FUSION.scripts['IGLUE'] = {

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

//-----------------------------------IGLUE-------------------------------------------------------------
FUSION.scripts['IMOD'] = {

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

//-----------------------------------DISPLACE-------------------------------------------------------------
FUSION.scripts['DISPLACE'] = {
    title: 'displaceTitle',
    description: 'displaceDescription',
    type: 'functions',
    newPane: false,
    inputs: {
        'DSERIES': {type: 'series', name: 'series', properties: {}, value: null},
        'VALUE': {type: 'double', name: 'value', properties: {max: 100, min: -100, step: 0.01}, value: 0.0},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: -100}, value: 12},
    },

    outputs: {
        'DISPLACE': {
            type: 'series', series: {
                seriesId: null,
                title: 'displaceTitle',
                labels: ['value'],
                fields: ['DISPLACE'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'DISPLACE', renderAs: 'Line', dataField: 'DISPLACE', color: '#e91e63', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var DISPLACEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;
            this.init = function (this: any) {}
            this.calculate = function (this: any, index: any) {
                var displace = FUSION.lib.displace(this.DSERIES, index, this.PERIODS);
                if (displace !== null) {
                    this.DISPLACE.setValue(index, displace + this.VALUE);
                }

                if (index === this.DSERIES.getSeriesLength() - 1) this.addFutureValues(index + 1);
            }
            this.addFutureValues = function (this: any, index: any) {
                for (var i = 0; i < this.PERIODS; ++i) {
                    if (FUSION.lib.displace(this.DSERIES, index, this.PERIODS) !== null) {
                        this.DISPLACE.setValue(index + i, FUSION.lib.displace(this.DSERIES, index + i, this.PERIODS) + this.VALUE);
                    }
                }
            }
        };

        return new DISPLACEController(context, inputs, outputs);
    }
}

//STRATEGIE
FUSION.scripts['EXCEED'] = {
    title: 'exceedTitle',
    description: 'exceedDescription',
    type: 'strategies',
    newPane: false,
    info: [
        {description: 'exceedInfo1', image: 'Exceed0.svg'},
        {description: 'exceedInfo2', image: 'Exceed1.svg'}
    ],
    inputs: {
        'UPPER': {type: 'series', name: 'exceedUpper', properties: {def: 'BBUpper'}, value: null},
        'LOWER': {type: 'series', name: 'exceedLower', properties: {def: 'BBLower'}, value: null},
        'HIGH': {type: 'series', name: 'cSeries', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'dSeries', properties: {def:'l'}, value: null},
        'ONDN': {type: 'list', name: 'exceedOnDn', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Sell'},
        'ONUP': {type: 'list', name: 'exceedOnUp', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Buy'},
        'SINGLE': {type: 'boolean', name: 'singleSignal', properties: {}, value: false},
    },

    outputs: {
        'EXCEED': {
            type: 'series', series: {
                seriesId: null,
                title: 'exceedTitle',
                labels: ['signal'],
                fields: ['ExceedValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'EXCEED', renderAs: '', dataField: 'ExceedValue', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var EXCEEDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['SIGNALSERIES']);
                this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, 'SIGNALSERIES');
            }
            this.calculate = function (this: any, INDEX: any) {
                this.ExceedValue.setValue(INDEX, 0);
                this.ExceedValue.setStrength(INDEX, 1);
                this.SIGNALSERIES.setValue(INDEX,0);
                var upperBand = this.UPPER.getValue(INDEX);
                var lowerBand = this.LOWER.getValue(INDEX);
                var highValue = this.HIGH.getValue(INDEX);
                var lowValue = this.LOW.getValue(INDEX);

                if (upperBand === null || lowerBand === null || highValue === null || lowValue === null) return;

                if(highValue > upperBand)
                {
                    var signal = -1;
                    if (this.ONDN==='Buy')
                        signal=FUSION.BUY;
                    else if (this.ONDN==='Sell')
                        signal=FUSION.SELL;
                    else if (this.ONDN==='Exit long')
                        signal=FUSION.EXIT_LONG;
                    else if (this.ONDN==='Exit short')
                        signal=FUSION.EXIT_SHORT;
                    else if (this.ONDN==='Exit all')
                        signal=FUSION.EXIT_ALL;
                    else if (this.ONDN==='Do nothing')
                        signal=FUSION.DO_NOTHING;

                    this.SIGNALSERIES.setValue(INDEX, signal);

                    if(this.SINGLE===true && INDEX>0) {
                        if(this.SIGNALSERIES.getValue(INDEX-1)!=signal)
                            this.ExceedValue.setValue(INDEX,signal);
                    }else
                        this.ExceedValue.setValue(INDEX, signal);
                }
                else if(lowValue < lowerBand)
                {
                    var signal = -1;
                    if (this.ONUP==='Buy')
                        signal=FUSION.BUY;
                    else if(this.ONUP==='Sell')
                        signal=FUSION.SELL;
                    else if(this.ONUP==='Exit long')
                        signal=FUSION.EXIT_LONG;
                    else if(this.ONUP==='Exit short')
                        signal=FUSION.EXIT_SHORT;
                    else if(this.ONUP==='Exit all')
                        signal=FUSION.EXIT_ALL;
                    else if (this.ONUP==='Do nothing')
                        signal=FUSION.DO_NOTHING;

                    this.SIGNALSERIES.setValue(INDEX, signal);

                    if(this.SINGLE=== true && INDEX>0) {
                        if(this.SIGNALSERIES.getValue(INDEX-1)!=signal)
                            this.ExceedValue.setValue(INDEX,signal);
                    }else
                        this.ExceedValue.setValue(INDEX, signal);
                }

            }
        };

        return new EXCEEDController(context, inputs, outputs);
    }
}

FUSION.scripts['CROSS'] = {
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


FUSION.scripts['REBOUND'] = {
    title: 'reboundTitle',
    description: 'reboundTitle',
    type: 'strategies',
    newPane: false,
    info: [
        {description: 'reboundInfo1', image: 'Rebound0.svg'},
        {description: 'reboundInfo2', image: 'Rebound1.svg'},
    ],
    inputs: {
        'UPPER': {type: 'series', name: 'reboundUpper', properties: {}, value: null},
        'LOWER': {type: 'series', name: 'reboundLower', properties: {}, value: null},
        'VALUE': {type: 'series', name: 'cSeries', properties: {}, value: null},

        'ONDN': {type: 'list', name: 'reboundOnUp', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Sell'},
        'ONUP': {type: 'list', name: 'reboundOnDn', properties: {}, list:['Buy', 'Sell', 'Exit long', 'Exit short', 'Exit all', 'Do nothing'], value: 'Buy'},
    },

    outputs: {
        'REBOUND': {
            type: 'series', series: {
                seriesId: null,
                title: 'reboundTitle',
                labels: ['reboundTitle'],
                fields: ['Rebound'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'REBOUND', renderAs: '', dataField: 'Rebound', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var REBOUNDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, INDEX: any) {
                this.Rebound.setValue(INDEX, 0);

                if (INDEX > 2) {
                    this.Rebound.setStrength(INDEX,1);

                    if (
                        this.VALUE.getValue(INDEX) === null ||
                        this.UPPER.getValue(INDEX) === null ||
                        this.LOWER.getValue(INDEX) === null ||
                        this.UPPER.getValue(INDEX - 1) === null ||
                        this.LOWER.getValue(INDEX - 1) === null ||
                        this.VALUE.getValue(INDEX - 1) === null
                    ) {
                        return;
                    }

                    if (
                        (this.VALUE.getValue(INDEX) < this.UPPER.getValue(INDEX))&&
                        (this.VALUE.getValue(INDEX-1) > this.UPPER.getValue(INDEX-1))
                    ){

                        var signal = -1;
                        if (this.ONDN=="Buy") signal=FUSION.BUY;
                        else if (this.ONDN=="Sell") signal=FUSION.SELL;
                        else if (this.ONDN=="Exit long") signal=FUSION.EXIT_LONG;
                        else if (this.ONDN=="Exit short") signal=FUSION.EXIT_SHORT;
                        else if (this.ONDN=="Exit all") signal=FUSION.EXIT_ALL;
                        else if (this.ONDN=="Do nothing") signal=FUSION.DO_NOTHING;

                        this.Rebound.setValue(INDEX,signal);

                    } else
                    if (
                        (this.VALUE.getValue(INDEX) > this.LOWER.getValue(INDEX)) &&
                        (this.VALUE.getValue(INDEX-1) < this.LOWER.getValue(INDEX-1))
                    ){

                        var signal = 1;
                        if (this.ONUP=="Buy")
                            signal=FUSION.BUY;
                        else if (this.ONUP=="Sell") signal=FUSION.SELL;
                        else if (this.ONUP=="Exit long") signal=FUSION.EXIT_LONG;
                        else if (this.ONUP=="Exit short") signal=FUSION.EXIT_SHORT;
                        else if (this.ONUP=="Exit all") signal=FUSION.EXIT_ALL;
                        else if (this.ONUP=="Do nothing") signal=FUSION.DO_NOTHING;
                        this.Rebound.setValue(INDEX,signal);

                    }
                    
                }
            }
        };

        return new REBOUNDController(context, inputs, outputs);
    }
}


FUSION.scripts['GREATERLESS'] = {
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

FUSION.scripts['SINGLE'] = {
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


FUSION.scripts['JOIN'] = {
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

FUSION.scripts['DOUBLECHECK'] = {
    title: 'doubleCheckTitle',
    description: 'doubleCheckDescription',
    type: 'strategies',
    newPane: false,
    info: [
        {description: 'doubleCheckInfo', image: 'Double-Check.svg'}
    ],
    inputs: {
        'SECOND': {type: 'series', name: 'xStrategy', properties: {}, value: null},
        'FIRST': {type: 'series', name: 'yStrategy', properties: {}, value: null},
        'MATRIX': {type: 'matrix', name: 'mixingTable', properties: {readOnly:true}, value: FUSION.createDoubleCheckMatrix()},
    },

    outputs: {
        'DOUBLE': {
            type: 'series', series: {
                seriesId: null,
                title: 'doubleCheckTitle',
                labels: ['doubleCheckTitle'],
                fields: ['Double'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'DOUBLE', renderAs: '', dataField: 'Double', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var DOUBLEController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['SIGNALSERIES']);
                this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, 'SIGNALSERIES');
            }

            this.calculate = function (this: any, INDEX: any) {
                this.Double.setValue(INDEX, 0);
                this.Double.setStrength(INDEX, 1);

                if (this.FIRST.getValue(INDEX) === null || this.SECOND.getValue(INDEX) === null) return;

                var firstSignalVal = Math.round(this.FIRST.getValue(INDEX));
                var secondSignalVal = Math.round(this.SECOND.getValue(INDEX));
                var signal1 = FUSION.signalValueToName(firstSignalVal);
                var signal2 = FUSION.signalValueToName(secondSignalVal);

                if(signal1 && signal2){
                    var signal3 = this.MATRIX[signal1][signal2];
                    this.Double.setValue(INDEX,FUSION.signalNameToValue(signal3));
                }
            }
        };

        return new DOUBLEController(context, inputs, outputs);
    }
}

FUSION.scripts['MIX'] = {
    title: 'selectiveSignalsTitle',
    description: 'selectiveSignalsDescription',
    type: 'strategies',
    newPane: false,
    info: [
        {description: 'selectiveSignalsInfo', image: 'Selective-Signals.svg'}
    ],
    inputs: {
        'FIRST': {type: 'series', name: 'xStrategy', properties: {}, value: null},
        'SECOND': {type: 'series', name: 'yStrategy', properties: {}, value: null},
        'MATRIX': {type: 'matrix', name: 'mixingTable', properties: {readOnly:false}, value: FUSION.createSelectiveSignalsMatrix()},
    },

    outputs: {
        'MIX': {
            type: 'series', series: {
                seriesId: null,
                title: 'selectiveSignalsTitle',
                labels: ['value'],
                fields: ['Mix'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'MIX', renderAs: '', dataField: 'Mix', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var MIXcontroller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['SIGNALSERIES']);
                this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, 'SIGNALSERIES');
            }

            this.calculate = function (this: any, INDEX: any) {
                this.Mix.setValue(INDEX, 0);
                this.Mix.setStrength(INDEX, 1);

                if (this.FIRST.getValue(INDEX) === null || this.SECOND.getValue(INDEX) === null) return;

                var firstSignalVal = Math.round(this.FIRST.getValue(INDEX));
                var secondSignalVal = Math.round(this.SECOND.getValue(INDEX));
                var signal1 = FUSION.signalValueToName(firstSignalVal);
                var signal2 = FUSION.signalValueToName(secondSignalVal);

                if(signal1 && signal2){
                    var signal3 = this.MATRIX[signal1][signal2];
                    this.Mix.setValue(INDEX,FUSION.signalNameToValue(signal3));
                }
            }
        };

        return new MIXcontroller(context, inputs, outputs);
    }
}


FUSION.scripts['POSITION'] = {
    title: 'positionSizeTitle',
    description: 'positionSizeTitle',
    type: 'strategies',
    newPane: true,
    info: [
        {description: 'positionSizeInfo', image: 'Position-Size.svg'}
    ],
    inputs: {
        'STRATEGY': 	{type: 'series', name: 'strategy', properties: {}, value: null},
        'WEIGHT': 		{type: 'double', name: 'weight', properties: {step: 0.01}, value: 1},
        'MULTIPLIER': 	{type: 'conditional', name: 'multiplier', properties: {}, value: {type:"double", value:1.0}},
    },

    outputs: {
        'POSITION': {
            type: 'series', series: {
                seriesId: null,
                title: 'positionSizeTitle',
                labels: ['value'],
                fields: ['Position',],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'POSITION', renderAs: 'Line', dataField: 'Position', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var POSITIONController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, INDEX: any) {
                this.valuePrev = 0;
                this.strengthPrev = 0;
                this.signal=0;
                this.strength =0;
                this.mult = 0;

                if(INDEX>0){
                    this.strengthPrev = this.Position.getStrength(INDEX-1);
                    this.valuePrev = this.Position.getValue(INDEX-1);
                }
                this.Position.setValue(INDEX, this.valuePrev);
                this.Position.setStrength(INDEX, this.strengthPrev);

                if (this.STRATEGY.getValue(INDEX) === null) return;

                this.signal = Math.round(this.STRATEGY.getValue(INDEX));
                this.strength = this.STRATEGY.getStrength(INDEX);
                if(!this.strength) this.strength = 0;
                if(this.MULTIPLIER['type'] && this.MULTIPLIER['type']=='double'){
                    //double
                    this.mult = this.MULTIPLIER['value'];
                }else //series
                    this.mult = this.MULTIPLIER.getValue(INDEX);
                
                if (this.mult === null) return;

                if(this.signal==0){
                    this.Position.setValue(INDEX, this.strengthPrev);
                    this.Position.setStrength(INDEX, this.strengthPrev);
                    //POSITION_SIZE.test("a");
                } else if(this.signal == FUSION.BUY){
                    this.Position.setValue(INDEX, this.strengthPrev+this.strength*this.mult*this.WEIGHT);
                    this.Position.setStrength(INDEX, this.strengthPrev+this.strength*this.mult*this.WEIGHT);
                    //POSITION_SIZE.test("b");
                } else if(this.signal == FUSION.SELL){
                    this.Position.setValue(INDEX, this.strengthPrev-this.strength*this.mult*this.WEIGHT);
                    this.Position.setStrength(INDEX, this.strengthPrev-this.strength*this.mult*this.WEIGHT);
                    //POSITION_SIZE.test("c");
                } else if(this.signal == FUSION.EXIT_LONG){
                    if(this.strengthPrev>0){
                        this.Position.setValue(INDEX, 0);
                        this.Position.setStrength(INDEX, 0);
                    }

                } else if(this.signal == FUSION.EXIT_SHORT){
                    if(this.strengthPrev<0){
                        this.Position.setValue(INDEX, 0);
                        this.Position.setStrength(INDEX, 0);
                    }
                    //POSITION_SIZE.test("d");
                } else if(this.signal == FUSION.EXIT_ALL){
                    this.Position.setValue(INDEX, 0);
                    this.Position.setStrength(INDEX, 0);
                    //POSITION_SIZE.test("e");
                } else{
                    this.Position.setValue(INDEX, this.strengthPrev);
                    this.Position.setStrength(INDEX, this.strengthPrev);
                    //POSITION_SIZE.test("f");
                }
            }
        };

        return new POSITIONController(context, inputs, outputs);
    }
}

FUSION.scripts['DIFFER'] = {
    title: 'buySellSizeTitle',
    description: 'buySellSizeTitle',
    type: 'strategies',
    newPane: true,
    info: [
        {description: 'buySellSizeInfo', image: 'Buy-Sell-Size.svg'}
    ],
    inputs: {
        'PS': 	{type: 'series', name: 'buySellSizePs', properties: {}, value: null},
    },

    outputs: {
        'DIFFER': {
            type: 'series', series: {
                seriesId: null,
                title: 'buySellSizeTitle',
                labels: ['value'],
                fields: ['Differ'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'DIFFER', renderAs: '', dataField: 'Differ', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var DIFFERController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, INDEX: any) {
                this.Differ.setValue(INDEX, 0);
                this.Differ.setStrength(INDEX,0);

                this.psPrev = 0;
                this.ps =0;

                if(INDEX>0)
                    this.psPrev = this.PS.getValue(INDEX-1);

                this.ps = this.PS.getValue(INDEX);
                if (this.ps === null|| this.psPrev === null) return;

                if(Math.abs(this.ps-this.psPrev)>0){
                    if(this.ps-this.psPrev>0){
                        this.Differ.setValue(INDEX,FUSION.BUY);
                        this.Differ.setStrength(INDEX,Math.abs(this.ps-this.psPrev));
                    }else if(this.ps-this.psPrev<0){
                        this.Differ.setValue(INDEX,FUSION.SELL);
                        this.Differ.setStrength(INDEX,Math.abs(this.ps-this.psPrev));
                    }
                }else{
                    this.Differ.setValue(INDEX,0);
                    this.Differ.setStrength(INDEX,0);
                }
            }
        };

        return new DIFFERController(context, inputs, outputs);
    }
}

FUSION.scripts['EQUITY'] = {
    title: 'equityTitle',
    description: 'equityDescription',
    type: 'indicators',
    showAsType: 'strategies',
    newPane: true,
    quickAdd: false,
    inputs: {
        'PRICE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'STRATEGY': {type: 'series', name: 'equityStrategy', properties: {}, value: null},
        'SPREAD': {type: 'double', name: 'spread', properties: {step: 0.0001}, value: 0.0},
        'COMMISION': {type: 'double', name: 'commision', properties: {step: 0.01}, value: 0.0},
        'INITEQ': {type: 'double', name: 'initialEquity', properties: {step: 1}, value: 100000},
        'LOTSIZE':{type: 'double', name: 'lotSize', properties: {step: 1000}, value: 100000},
        'CAPITAL': {type: 'boolean', name: 'equityCapital', properties: {}, value: false},
        'PERC': {type: 'boolean', name: 'equityPerc', properties: {}, value: false},
    },

    outputs: {
        'EQUITY': {
            type: 'series', series: {
                seriesId: null,
                title: 'equityTitle',
                labels: ['equityLine', 'equityPL', 'position', 'commision', 'spread'],
                fields: ['EQUITY', 'EQUITY_HIST','POSITION_SIZE','COMMISION_SERIES','SPREAD_SERIES'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'EQUITY', renderAs: 'Line and Histogram', dataField: 'EQUITY_HIST', color: '#ff9933', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'EQUITY', renderAs: 'Line', dataField: 'EQUITY', color: '#2d566d', width: 2, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var EQUITYController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.PSMax = 0.0;
                this.PSMaxPrice = 0.0;
            }

            this.calculate = function (this: any, INDEX: any) {
                if (!this.PRICE.getValue(INDEX)) return;
                
                this.EQUITY.setValue(INDEX, 0);
                this.EQUITY_HIST.setValue(INDEX, 0);
                this.POSITION_SIZE.setValue(INDEX, 0);
                this.COMMISION_SERIES.setValue(INDEX,0);
                this.SPREAD_SERIES.setValue(INDEX,0);

                var valuePrev = 0;
                var strengthPrev = 0;
                var signal=0;
                var strength =0;
                var mult = 0;

                if(INDEX==0){
                    this.PSMax =0;
                    this.PSMaxPrice = 0;
                    if(this.CAPITAL===true){
                        this.EQUITY.setValue(INDEX, this.INITEQ);
                        this.EQUITY_HIST.setValue(INDEX,this.INITEQ);
                    }
                }

                if(INDEX>0){
                    strengthPrev = this.POSITION_SIZE.getStrength(INDEX-1);
                    valuePrev = this.POSITION_SIZE.getValue(INDEX-1);
                }
                this.POSITION_SIZE.setValue(INDEX, valuePrev);
                this.POSITION_SIZE.setStrength(INDEX, strengthPrev);

                if (this.STRATEGY.getValue(INDEX) === null) return;

                var signal = Math.round(this.STRATEGY.getValue(INDEX));
                strength = this.STRATEGY.getStrength(INDEX);
                var mult = 1.0;
                var WEIGHT = 1.0;

                if(signal==0){
                    this.POSITION_SIZE.setValue(INDEX, strengthPrev);
                    this.POSITION_SIZE.setStrength(INDEX, strengthPrev);
                } else if(signal == FUSION.BUY){
                    this.POSITION_SIZE.setValue(INDEX, strengthPrev+strength*mult*WEIGHT);
                    this.POSITION_SIZE.setStrength(INDEX, strengthPrev+strength*mult*WEIGHT);
                } else if(signal == FUSION.SELL){
                    this.POSITION_SIZE.setValue(INDEX, strengthPrev-strength*mult*WEIGHT);
                    this.POSITION_SIZE.setStrength(INDEX, strengthPrev-strength*mult*WEIGHT);
                } else if(signal == FUSION.EXIT_LONG){
                    if(strengthPrev>0){
                        this.POSITION_SIZE.setValue(INDEX, 0);
                        this.POSITION_SIZE.setStrength(INDEX, 0);
                    }
                } else if(signal == FUSION.EXIT_SHORT){
                    if(strengthPrev<0){
                        this.POSITION_SIZE.setValue(INDEX, 0);
                        this.POSITION_SIZE.setStrength(INDEX, 0);
                    }
                } else if(signal == FUSION.EXIT_ALL){
                    this.POSITION_SIZE.setValue(INDEX, 0);
                    this.POSITION_SIZE.setStrength(INDEX, 0);
                } else{
                    this.POSITION_SIZE.setValue(INDEX, strengthPrev);
                    this.POSITION_SIZE.setStrength(INDEX, strengthPrev);
                }

                //LICZ equity line
                var position=0;
                var positionPrev=0;
                var equityPrev = 0;
                var pricePrev = 0;

                if (INDEX>0)
                {
                    positionPrev = this.POSITION_SIZE.getValue(INDEX-1);
                    equityPrev = this.EQUITY.getValue(INDEX-1);
                    pricePrev = this.PRICE.getValue(INDEX-1);

                    if(Math.abs(positionPrev)> this.PSMax){
                        this.PSMax = Math.abs(positionPrev);
                        this.PSMaxPrice = pricePrev;
                    }
                }
                position = this.POSITION_SIZE.getValue(INDEX);
                var price = this.PRICE.getValue(INDEX);
                if (price === null) return;

                var dPosition = position-positionPrev;
                var dEquity = positionPrev*(price-pricePrev);

                var spread_value = 0.0;
                var commision_value  = 0.0;

                if(Math.abs(dPosition)>0.0){
                    commision_value  = Math.abs(dPosition*price*this.COMMISION/100);

                    if(Math.abs(dPosition) > Math.abs(position)){
                        spread_value = Math.abs(position*this.SPREAD);
                    }else{
                        if(positionPrev<=0.0 && position <0.0 && position < positionPrev){
                            //inclease short
                            spread_value = Math.abs(dPosition*this.SPREAD);
                        }else if(positionPrev>=0.0 && position >0.0 && position > positionPrev){
                            //incerease long
                            spread_value = Math.abs(dPosition*this.SPREAD);
                        }
                    }
                }

                this.COMMISION_SERIES.setValue(INDEX,commision_value);
                this.SPREAD_SERIES.setValue(INDEX,spread_value);

                dEquity = dEquity - commision_value;
                dEquity = dEquity - spread_value;

                if(this.CAPITAL===true){
                    if(INDEX==0){
                        this.EQUITY.setValue(INDEX, this.INITEQ);
                        this.EQUITY_HIST.setValue(INDEX,this.INITEQ);
                    }else{
                        this.EQUITY.setValue(INDEX, equityPrev+dEquity*this.LOTSIZE);
                        this.EQUITY_HIST.setValue(INDEX,dEquity*this.LOTSIZE);
                    }
                }else if(this.PERC===true){
                    if(this.PSMax>0){
                        this.EQUITY.setValue(INDEX, equityPrev+dEquity*100/(this.PSMax*this.PSMaxPrice));
                        this.EQUITY_HIST.setValue(INDEX,dEquity*100/(this.PSMax*this.PSMaxPrice));
                    }
                }else{
                    this.EQUITY.setValue(INDEX, equityPrev+dEquity);
                    this.EQUITY_HIST.setValue(INDEX,dEquity);
                }

                if(FUSION.DEBUG)
                    console.log("Index;"+INDEX+
                        " ;C;"+ this.PRICE.getValue(INDEX),
                        " ;Eq;"+this.EQUITY.getValue(INDEX)+
                        " ;DEq;"+ this.EQUITY_HIST.getValue(INDEX)+
                        " ;PS;"+this.POSITION_SIZE.getValue(INDEX) +
                        " ;PSMax;"+ this.PSMax
                    );


            }


        };

        return new EQUITYController(context, inputs, outputs);
    }
}

FUSION.scripts['EQUITYSUM'] = {
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


FUSION.scripts['ICHIMOKU']= {
	    title: 'ichimokuTitle',
	    description: 'ichimokuDescription',
	    type: 'indicators',
	    newPane: false,
	    centerZero:true,
	    inputs: {

	        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
	        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
	        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
	        
	        'CSDISPLACE': {type: 'integer', name: 'chikouSpanDisplace', properties: {def: 25, max: 100, min: 1}, value: 25},
	        'TSPERIOD': {type: 'integer', name: 'tenkanSenPeriod', properties: {def: 9, max: 100, min: 2}, value: 9},
	        'KSPERIOD': {type: 'integer', name: 'kijunSenPeriod', properties: {def: 26, max: 100, min: 2}, value: 26},
	        'SSPERIOD': {type: 'integer', name: 'senkouSenPeriod', properties: {def: 52, max: 100, min: 2}, value: 52},

	    },

	    outputs: {

	        'ICHIMOKU': {
	            type: 'series', series: {
	                seriesId: null,
	                title: 'ichimokuTitle',
	                labels: ['ichimokuTenkanSen', 'ichimokuKijunSen', 'ichimokuChikouSpan', 'ichimokuSenkouA', 'ichimokuSenkouB'],
	                fields: ['TenkanSen', 'KijunSen', 'ChikouSpan', 'SenkouA', 'SenkouB'],
	                data: null
	            }
	        }

	    },

	    plotters: [

	        {type:'SeriesObject', dataLink: 'ICHIMOKU', renderAs: 'Line', dataField: 'TenkanSen', color: '#f44336', width: 1, dash:[], priceTag: false, priceLine: false},
	        {type:'SeriesObject', dataLink: 'ICHIMOKU', renderAs: 'Line', dataField: 'KijunSen', color: '#03a9f4', width: 1, dash:[], priceTag: false, priceLine: false},
	        {type:'SeriesObject', dataLink: 'ICHIMOKU', renderAs: 'Line', dataField: 'ChikouSpan', color: '#ffc107', width: 1.5, dash:[], priceTag: true, priceLine: true},
	        {type:'SeriesObject', dataLink: 'ICHIMOKU', renderAs: 'Band', upperField: 'SenkouA', lowerField: 'SenkouB', color: '#5b6f8b', width: 1, dash: [0,0]}

	    ],

	    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

	        var ICHIMOKUController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {


	            this.id			= '';
	            this.context	= context;
	            this.inputs 	= inputs;
	            this.outputs	= outputs;

	            this.init = function (this: any) {

	                this.helper = this.context.createSeries(['S1', 'S2']);
	                this.S1 = this.context.getRawSeriesWrapper(this.helper, 'S1');
	                this.S2 = this.context.getRawSeriesWrapper(this.helper, 'S2');

	            }
	            
	    		this.ichimokuFunc = function (this: any, serH: any, serL: any, idx: any, period: any) {
                    var max = FUSION.lib.getMax(serH, idx, period);
                    var min  = FUSION.lib.getMin(serL, idx, period)
                    if (max === null || min === null) return null;

	    			var result = (max + min) / 2;
	    			return result;
	    		}

	            this.calculate = function (this: any, index: any) {
                    var ts = this.ichimokuFunc(this.HIGH,this.LOW,index,this.TSPERIOD);
                    var ks = this.ichimokuFunc(this.HIGH,this.LOW,index,this.KSPERIOD);
                    
	            	this.TenkanSen.setValue(index, ts);
	         		this.KijunSen.setValue(index, ks);
	         		
                    this.SenkouA.setValue(index + this.CSDISPLACE, this.ichimokuFunc(this.HIGH, this.LOW, index, this.SSPERIOD));
                    if (ts !== null && ks !== null) {
                        this.SenkouB.setValue(index + this.CSDISPLACE, (ts + ks) / 2);	
                    }

	        		this.ChikouSpan.setValue(index, FUSION.lib.displace(this.CLOSE, index, -this.CSDISPLACE));	        		
	            }

	        };

	        return new ICHIMOKUController (context, inputs, outputs);
	    }
	}

FUSION.scripts['TRADINGTIMEFRAME'] = {

    title: 'ttfTitle',
    description: 'ttfDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        
        'DAYS': {type: 'booleanList', name: "ttfDays", properties: {}, value: {
            1: {name: 'Monday', value: true},
            2: {name: 'Tuesday', value: true},
            3: {name: 'Wednesday', value: true},
            4: {name: 'Thursday', value: true},
            5: {name: 'Friday', value: true},
            6: {name: 'Saturday', value: false},
            0: {name: 'Sunday', value: false},
            }
        },
        
        'START_TIME': {type: 'list', name: "hourFrom", properties: {}, list: [
            '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00',
            '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
            '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
            '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
            '22:30', '23:00', '23:30'
        ], value: '08:00'},
        'STOP_TIME': {type: 'list', name: "hourTo", properties: {}, list: [
            '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00',
            '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
            '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
            '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
            '22:30', '23:00', '23:30'
        ], value: '20:00'},
        'TIMEZONE_OFFSET': {type: 'timezone', name: "timezone", properties: {}, list: [
            { name: "UTC-12:00", offset: 720},
            { name: "UTC-11:00", offset: 660},
            { name: "UTC-10:00", offset: 600},
            { name: "UTC-9:00", offset: 540},
            { name: "UTC-8:00", offset: 480},
            { name: "UTC-7:00", offset: 420},
            { name: "UTC-6:00", offset: 360},
            { name: "UTC-5:00", offset: 300},
            { name: "UTC-4:00", offset: 240},
            { name: "UTC-3:00", offset: 180},
            { name: "UTC-2:00", offset: 120},
            { name: "UTC-1:00", offset: 60},
            { name: "UTC-0:00", offset: 0},
            { name: "UTC+1:00", offset: -60},
            { name: "UTC+2:00", offset: -120},
            { name: "UTC+3:00", offset: -180},
            { name: "UTC+4:00", offset: -240},
            { name: "UTC+5:00", offset: -300},
            { name: "UTC+6:00", offset: -360},
            { name: "UTC+7:00", offset: -420},
            { name: "UTC+8:00", offset: -480},
            { name: "UTC+9:00", offset: -540},
            { name: "UTC+10:00", offset: -600},
            { name: "UTC+11:00", offset: -660},
            { name: "UTC+12:00", offset: -720},
            { name: "UTC+13:00", offset: -780},
            { name: "UTC+14:00", offset: -840}
            ]
        }
    },
    outputs: {
        'TRADINGTIMEFRAME': {
            type: 'series', series: {
                seriesId: null,
                title: 'ttfTitle',
                labels: ['value'],
                fields: ['TTFValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'TRADINGTIMEFRAME', renderAs: 'Line', dataField: 'TTFValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var TradingTimeFrameController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;
            
            this.hourToMinutes = function (this: any, h: any) {
                var hour = h.split(':');
                var minutes = parseInt(hour[0])*60 + parseInt(hour[1]);
                return minutes;
            }

            this.timeToMinutes = function (this: any, date: any) {
                return date.getUTCMinutes() + 60 * date.getUTCHours();
            }
            
            this.init = function (this: any) {
                this.timeFrame = []
                var start = this.hourToMinutes(this.inputs.START_TIME);
                var stop = this.hourToMinutes(this.inputs.STOP_TIME);

                if(start > stop) {
                    this.timeFrame.push(
                        [start, this.hourToMinutes('23:59')],
                        [this.hourToMinutes('00:00'), stop]
                    );
                }
                else{
                    this.timeFrame.push(
                        [start, stop]
                    );
                }
            }

            this.onModify = function (this: any) {
                this.init();
            }

            this.calculate = function (this: any, index: any) {
                this.TTFValue.setValue(index, 0);
                
                var timeLong = this.TTFValue.getStamp(index) - 60000*this.inputs.TIMEZONE_OFFSET;
                var date = new Date(timeLong);
                var dayOfWeek = date.getUTCDay();

                if (this.inputs.DAYS[dayOfWeek]) {
                    var stampMinutes = this.timeToMinutes(date);
                    for(var i in this.timeFrame){
                        var timeFrame = this.timeFrame[i];
                        if ((stampMinutes >= timeFrame[0]) && (stampMinutes <= timeFrame[1])) {
                            this.TTFValue.setValue(index, 1);
                        }
                    }
                }
            }
        }
        return new TradingTimeFrameController(context, inputs, outputs);
    }
}

FUSION.scripts['CANDLESTICKPATTERNS'] = {
        title: 'candlestickPatternsTitle',
        description: 'candlestickPatternsDescription',
        type: 'strategies',
        newPane: false,
        inputs: {
            'OPEN': {type: 'series', name: 'priceOpen', properties: {def:'o'}, value: null},
            'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
	        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
            'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
            'CHOSENPATTERNS': { type: 'booleanList', name: "chooseCandlestickPatterns", properties: {}, value:{
                'DIFFUSION': {name: 'DIFFUSION', value: true},
                'MORNINGSTAR': {name: 'MORNINGSTAR', value: true},
                'SHOOTINGSTAR': {name: 'SHOOTINGSTAR', value: true},
                'EVENINGSTAR': {name: 'EVENINGSTAR', value: true},
                'BEARISHHARAMI': {name: 'BEARISHHARAMI', value: true},
                'BULLISHHARAMI': {name: 'BULLISHHARAMI', value: true},
                'HAMMER': {name: 'HAMMER', value: true},
                'BESSAHUG': {name: 'BESSAHUG', value: true},
                'HOSSAHUG': {name: 'HOSSAHUG', value: true},
                'REVERSEDHAMMER': {name: 'REVERSEDHAMMER', value: true},
                'HANGMAN': {name: 'HANGMAN', value: true},
                'HIGHWAVEDOWN': {name: 'HIGHWAVEDOWN', value: true},
                'HIGHWAVEUP': {name: 'HIGHWAVEUP', value: true},
                'DARKCLOUDCOVER': {name: 'DARKCLOUDCOVER', value: true},
                'DOJIDOWN': {name: 'DOJIDOWN', value: true},
                'DOJIUP': {name: 'DOJIUP', value: true}
                }
            }
            
        },   
        outputs: {
            'CANDLESTICKPATTERNS': {
                type: 'tooltipSeries', series: {
                    seriesId: null,
                    title: 'candlestickPatternsTitle',
                    labels: ['value'],
                    fields: ['CANDLESTICKPATTERNS'],
                    data: null
                }
            }
        },
    
        plotters: [
            {type:'CandlestickPatternStrategyObject', dataLink: 'CANDLESTICKPATTERNS', renderAs: '', dataField: 'CANDLESTICKPATTERNS', color: '#ff0000', width: 1, dash:[]}
        ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var CandlestickPatternsController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.LLV = function (this: any, data: any, periods: any, index: any) {
                if (index < periods - 1) {
                    return data.getValue(index);
                }

                var min = FUSION.MAX_VALUE;
                for (var i = 0; i < periods; i++) {
                    if (data.getValue(index - periods + 1 + i) < min)
                        min = data.getValue(index - periods + 1 + i);
                }
                return min;
            }

            this.HHV = function (this: any, data: any, periods: any, index: any) {
                if (index < periods - 1) {
                    return data.getValue(index);
                }
                var max = FUSION.MIN_VALUE;
                for (var i = 0; i < periods; i++) {
                    if (data.getValue(index - periods + 1 + i) > max)
                        max = data.getValue(index - periods + 1 + i);
                }
                return max;
            }

            this.absOC = function (this: any, OPEN: any, CLOSE: any) {
                var helper = this.context.createSeries(['ABSOC']);
                var absOC = this.context.getRawSeriesWrapper(helper, 'ABSOC');
                var BACK = this.CLOSE.length;
                for (var i = 0; i < BACK; i++) {
                    var value = Math.abs(this.OPEN.getValue(i) - this.CLOSE.getValue(i));
                    absOC.setValue(i, value.toFixed(4));

                }
                return absOC;
            }


            this.isInRange = function (this: any, rangeStart: any, rangeEnd: any, value: any) {
                if (rangeStart > rangeEnd) {
                    var tmp = rangeStart;
                    rangeStart = rangeEnd;
                    rangeEnd = tmp;
                }
                if (rangeStart < value && rangeEnd > value) return true;
                else return false;

            }

            this.init = function (this: any) {
                var CONTEXT = this.context;
                this.helper = this.context.createSeries(['SMA', 'SMAABSOC', 'ATR', 'TRUERANGE', 'AU', 'AD', 'MAU', 'MAD', 
                    'RSIBaseHI', 'RSIBaseLO', 'RSI', 'tempLongs', 'tempShorts', 'stopLong', 'stopShort', 'isLong', 'CEX'
                ]);

                this.SMA = this.context.getRawSeriesWrapper(this.helper, 'SMA');
                this.SMAABSOC =this.context.getRawSeriesWrapper(this.helper, 'SMAABSOC');
                this.ABSOC = this.absOC(this.OPEN, this.CLOSE);

                this.ATR = this.context.getRawSeriesWrapper(this.helper, 'ATR');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');

                this.AU = this.context.getRawSeriesWrapper(this.helper, 'AU');
                this.AD = this.context.getRawSeriesWrapper(this.helper, 'AD');
                this.MAU = this.context.getRawSeriesWrapper(this.helper, 'MAU');
                this.MAD = this.context.getRawSeriesWrapper(this.helper, 'MAD');
                this.RSIBaseHI = this.context.getRawSeriesWrapper(this.helper, 'RSIBaseHI');
                this.RSIBaseLO = this.context.getRawSeriesWrapper(this.helper, 'RSIBaseLO');
                this.RSI = this.context.getRawSeriesWrapper(this.helper, 'RSI');
                this.PERIOD = 14;
                this.LO_BASELINE = 30;
                this.HI_BASELINE = 70;

                this.tempLongs = this.context.getRawSeriesWrapper(this.helper, 'tempLongs');
                this.tempShorts = this.context.getRawSeriesWrapper(this.helper, 'tempShorts');
                this.stopLong = this.context.getRawSeriesWrapper(this.helper, 'stopLong');
                this.stopShort =this.context.getRawSeriesWrapper(this.helper, 'stopShort');
                this.isLong = this.context.getRawSeriesWrapper(this.helper, 'isLong');
                this.CEX = this.context.getRawSeriesWrapper(this.helper, 'CEX');
                this.PERIODS = 10;
                this.RATE = 5;
            }

            this.calculate = function (this: any, INDEX: any) {
                var CONTEXT = this.context;
                var OPEN = this.OPEN;
                var HIGH = this.HIGH;
                var LOW = this.LOW;
                var CLOSE = this.CLOSE;
                var PERIODS = this.PERIODS;
                var PERIOD = this.PERIOD;
                var RATE = this.RATE;
                this.PCH = this.HHV(HIGH, 20, INDEX);
                this.PCL = this.LLV(LOW, 20, INDEX);
                this.PCM = (this.PCH + this.PCL) / 2;

                this.SMA.setValue(INDEX, FUSION.lib.getMA(CLOSE, INDEX, 10));
                this.SMAABSOC.setValue(INDEX, FUSION.lib.getMA(this.ABSOC, INDEX, 10));

                this.TRUERANGE.setValue(INDEX, FUSION.lib.getTrueRange(HIGH, LOW, CLOSE, INDEX));
                this.ATR.setValue(INDEX, FUSION.lib.getMMA(this.TRUERANGE, INDEX, 10, this.ATR));

                this.AU.setValue(INDEX, 0);
                this.AD.setValue(INDEX, 0);
                this.MAU.setValue(INDEX, 0);
                this.MAD.setValue(INDEX, 0);
                this.RSIBaseHI.setValue(INDEX, this.HI_BASELINE);
                this.RSIBaseLO.setValue(INDEX, this.LO_BASELINE);
                this.RSI.setValue(INDEX, this.LO_BASELINE + ((this.HI_BASELINE - this.LO_BASELINE) / 2));

                if (INDEX > PERIOD - 1) {
                    var diff = CLOSE.getValue(INDEX) - CLOSE.getValue(INDEX - 1);

                    if (diff > 0) {
                        this.AU.setValue(INDEX, diff);
                        this.AD.setValue(INDEX, 0);
                    } else {
                        this.AU.setValue(INDEX, 0);
                        this.AD.setValue(INDEX, -diff);
                    }

                    var mmaAU = FUSION.lib.getMMA(this.AU, INDEX, PERIOD, this.MAU);
                    var mmaAD = FUSION.lib.getMMA(this.AD, INDEX, PERIOD, this.MAD);
                    this.MAU.setValue(INDEX, mmaAU);
                    this.MAD.setValue(INDEX, mmaAD);
                    if (mmaAU + mmaAD == 0)
                        this.RSI.setValue(INDEX, this.LO_BASELINE + ((this.HI_BASELINE - this.LO_BASELINE) / 2));
                    else
                        this.RSI.setValue(INDEX, 100 * mmaAU / (mmaAU + mmaAD));
                }

                this.CEX.setValue(INDEX, CLOSE.getValue(INDEX));

                var stateLong = FUSION.MIN_VALUE;
                var stateShort = FUSION.MAX_VALUE;

                if (INDEX < PERIODS) {
                    this.tempLongs.setValue(INDEX, stateLong);
                    this.tempShorts.setValue(INDEX, stateShort);
                    this.isLong.setValue(INDEX, -1);
                    this.stopLong.setValue(INDEX, FUSION.MAX_VALUE);
                    this.stopShort.setValue(INDEX, FUSION.MIN_VALUE);
                }
                else {
                    this.tempLongs.setValue(INDEX, CLOSE.getValue(INDEX) - (RATE * this.ATR.getValue(INDEX)));
                    this.tempShorts.setValue(INDEX, CLOSE.getValue(INDEX) + (RATE * this.ATR.getValue(INDEX)));

                    stateLong = FUSION.lib.getMax(this.tempLongs, INDEX, PERIODS);
                    stateShort = FUSION.lib.getMin(this.tempShorts, INDEX, PERIODS);

                    this.stopLong.setValue(INDEX, (CLOSE.getValue(INDEX) < this.stopLong.getValue(INDEX - 1)) ? stateLong : ((stateLong >= this.stopLong.getValue(INDEX - 1)) ? stateLong : this.stopLong.getValue(INDEX - 1)));
                    this.stopShort.setValue(INDEX, (CLOSE.getValue(INDEX) > this.stopShort.getValue(INDEX - 1)) ? stateShort : ((stateShort <= this.stopShort.getValue(INDEX - 1)) ? stateShort : this.stopShort.getValue(INDEX - 1)));

                    var blong = false;
                    if (this.isLong.getValue(INDEX - 1) == 1) blong = true;

                    if ((this.isInRange(OPEN.getValue(INDEX), CLOSE.getValue(INDEX), this.CEX.getValue(INDEX - 1)) || (this.CEX.getValue(INDEX - 1) > CLOSE.getValue(INDEX))) && blong) {
                        this.isLong.setValue(INDEX, -1);
                    }
                    else if ((this.isInRange(OPEN.getValue(INDEX), CLOSE.getValue(INDEX), this.CEX.getValue(INDEX - 1)) || (this.CEX.getValue(INDEX - 1) < CLOSE.getValue(INDEX))) && !blong) {
                        this.isLong.setValue(INDEX, 1);
                    }
                    else {
                        this.isLong.setValue(INDEX, this.isLong.getValue(INDEX - 1));
                    }

                    if (this.isLong.getValue(INDEX) == 1) this.CEX.setValue(INDEX, this.stopLong.getValue(INDEX));
                    else this.CEX.setValue(INDEX, this.stopShort.getValue(INDEX));
                }

                this.ATR10 = this.ATR.getValue(INDEX);
                this.ATR10_1 = this.ATR.getValue(INDEX - 1);
                this.RSI14 = this.RSI.getValue(INDEX);
                this.CEX10_5 = this.CEX.getValue(INDEX);
                this.SMA10ABSOC = this.SMAABSOC.getValue(INDEX);

                var O = OPEN.getValue(INDEX);
                var H = HIGH.getValue(INDEX);
                var L = LOW.getValue(INDEX);
                var C = CLOSE.getValue(INDEX);

                var O_1 = OPEN.getValue(INDEX - 1);
                var H_1 = HIGH.getValue(INDEX - 1);
                var L_1 = LOW.getValue(INDEX - 1);
                var C_1 = CLOSE.getValue(INDEX - 1);

                var O_2 = OPEN.getValue(INDEX - 2);
                var H_2 = HIGH.getValue(INDEX - 2);
                var L_2 = LOW.getValue(INDEX - 2);
                var C_2 = CLOSE.getValue(INDEX - 2);

                var value = 0;
                var signal = 0;
                var showSignal = 1;

                this.CANDLESTICKPATTERNS.clearTooltips(INDEX);

                if (this.CHOSENPATTERNS.DIFFUSION && (O_1 > C_1 && O < C && O < C_1 && C > C_1 + 0.5 * (O_1 - C_1) && C < O_1
                    && (H - C) < 0.5 * (C - O) && (O - L) < 0.5 * (C - O) && H_1 - O_1 < 0.5 * (O_1 - C_1) && C_1 - L_1 < 0.5 * (O_1 - C_1)
                    && this.RSI14 < 50 && H_1 - L_1 > this.ATR10_1) && C < this.CEX10_5) {
                        
                    if (signal < 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = 1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'DIFFUSION', FUSION.BUY);
                    }
                }

                if (INDEX >= 2) {
                    if (this.MORNINGSTAR && (C_2 < O_2 && C > O && O_2 - C_2 > this.SMA10ABSOC && Math.abs(C_1 - O_1) < (this.SMA10ABSOC) / 2
                        && C_1 < C_2 && O_1 < C_2 && C > (O_2 + C_2) / 2 && this.RSI14 < 60) && C < this.CEX10_5) {

                        if (signal < 0) {
                            showSignal = 0;
                        }
                        else {
                            signal = 1;
                            this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'MORNINGSTAR', FUSION.BUY);
                        }
                    }
                }

                if (this.CHOSENPATTERNS.SHOOTINGSTAR && ((C <= O && (H - O) >= 1.9 * (O - C) && (H - O) > 1.5 * (C - L)) || (C >= O && (H - C) >= 1.9 * (C - O)
                    && (H - C) > 1.5 * (O - L))) && H >= this.PCH - ((this.PCH - this.PCL) / 4) && this.RSI14 >= 60 && C > this.CEX10_5) {

                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'SHOOTINGSTAR', FUSION.SELL);
                    }
                }

                if (INDEX >= 2) {
                    if (this.CHOSENPATTERNS.EVENINGSTAR && C_2 > O_2 && C < O && C_2 - O_2 > this.SMA10ABSOC && Math.abs(C_1 - O_1) < this.SMA10ABSOC / 2
                        && C_1 > C_2 && O_1 > C_2 && this.RSI14 > 50 && C < (O_2 + C_2) / 2 && C > this.CEX10_5) {

                        if (signal > 0) {
                            showSignal = 0;
                        }
                        else {
                            signal = -1;
                            this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'EVENINGSTAR', FUSION.SELL);
                        }

                    }
                }

                if (this.CHOSENPATTERNS.BEARISHHARAMI && O_1 < C_1 && O >= C && C > O_1 && O < C_1 && O - C < (2 / 3) * (C_1 - O_1) && H_1 - C_1 < 0.5 * (C_1 - O_1)
                    && O_1 - L_1 < 0.5 * (C_1 - O_1) && this.RSI14 > 50 && H_1 - L_1 > this.ATR10_1 && C > this.CEX10_5) {

                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'BEARISHHARAMI', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.BULLISHHARAMI && O_1 > C_1 && O <= C && O > C_1 && C < O_1 && C - O < (2 / 3) * (O_1 - C_1) && H_1 - O_1 < 0.5 * (O_1 - C_1)
                    && C_1 - L_1 < 0.5 * (O_1 - C_1) && this.RSI14 < 50 && H_1 - L_1 > this.ATR10_1 && C < this.CEX10_5) {


                    if (signal < 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = 1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'BULLISHHARAMI', FUSION.BUY);
                    }
                }

                if (this.CHOSENPATTERNS.HAMMER && ((C >= O && (O - L) >= 1.5 * (C - O) && (O - L) > 2 * (H - C)) || (C < O && (C - L) >= 1.5 * (O - C)
                    && (C - L) > 2 * (H - O)) == true) && L <= this.PCL + ((this.PCH - this.PCL) / 4) && this.RSI14 <= 40 && C < this.CEX10_5) {


                    if (signal < 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = 1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'HAMMER', FUSION.BUY);
                    }
                }

                if (this.CHOSENPATTERNS.BESSAHUG && (O_1 < C_1 && (C_1 - O_1) > (0.02 * O_1) && O > C_1 && C < O_1)
                    && H >= this.PCH - ((this.PCH - this.PCL) / 4) && this.RSI14 >= 60 && C > this.CEX10_5) {

                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'BESSAHUG', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.HOSSAHUG && (C_1 < O_1 && (O_1 - C_1) > (0.02 * O_1) && O < C_1 && C > O_1)
                    && L <= this.PCL + ((this.PCH - this.PCL) / 4) && this.RSI14 <= 40 && C < this.CEX10_5) {

                    if (signal < 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = 1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'HOSSAHUG', FUSION.BUY);
                    }
                }

                if (this.CHOSENPATTERNS.REVERSEDHAMMER && ((O <= C && H - C >= 2 * (C - O) && H - C >= 3 * (O - L) && this.RSI14 < 40 && (C < C_1 || C < O_1))
                    || (C < O && H - O >= 2 * (O - C) && H - O >= 3 * (C - L) && this.RSI14 < 40 && O < C_1 && O < O_1)) && C < this.CEX10_5) {


                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'REVERSEDHAMMER', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.HANGMAN && ((C < O && (C - L) >= 1.5 * (O - C) && (C - L) > 2 * (H - O)) == true)
                    && H >= this.PCH - ((this.PCH - this.PCL) / 4) && this.RSI14 >= 60 && C > this.CEX10_5) {

                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'HANGMAN', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.HIGHWAVEDOWN && ((O - C > 0 && Math.abs(O - C) <= 0.1 * this.ATR10 && H - O >= 4 * Math.abs(O - C) && C - L >= 4 * Math.abs(O - C))
                    || ((C - O) > 0 && Math.abs(O - C) <= 0.1 * this.ATR10 && H - C >= 4 * Math.abs(O - C) && O - L >= 4 * Math.abs(O - C)))
                    && H >= this.PCH - ((this.PCH - this.PCL) / 4) && this.RSI14 >= 60 && C > this.CEX10_5) {

                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'HIGHWAVEDOWN', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.HIGHWAVEUP && ((O - C > 0 && Math.abs(O - C) <= 0.1 * this.ATR10 && H - O >= 4 * Math.abs(O - C) && C - L >= 4 * Math.abs(O - C))
                    || ((C - O) > 0 && Math.abs(O - C) <= 0.1 * this.ATR10 && H - C >= 4 * Math.abs(O - C) && O - L >= 4 * Math.abs(O - C)))
                    && L <= this.PCL + ((this.PCH - this.PCL) / 4) && this.RSI14 <= 40 && C < this.CEX10_5) {

                    if (signal < 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = 1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'HIGHWAVEUP', FUSION.BUY);
                    }
                }

                if (this.CHOSENPATTERNS.DARKCLOUDCOVER && O_1 < C_1 && O > C && O > C_1 && C < O_1 + 0.5 * (C_1 - O_1) && C > O_1
                    && (H - O) < 0.5 * (O - C) && (C - L) < 0.5 * (O - C) && H_1 - C_1 < 0.5 * (C_1 - O_1)
                    && O_1 - L_1 < 0.5 * (C_1 - O_1) && this.RSI14 > 50 && H_1 - L_1 > this.ATR10_1 && C > this.CEX10_5) {
                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'DARKCLOUDCOVER', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.DOJIDOWN && ((O - C > 0 && Math.abs(O - C) <= 0.03 * this.ATR10 && H - O >= 1 * Math.abs(O - C) && C - L >= 1 * Math.abs(O - C))
                    || ((C - O) > 0 && Math.abs(O - C) <= 0.03 * this.ATR10 && H - C >= 1 * Math.abs(O - C) && O - L >= 1 * Math.abs(O - C)))
                    && H >= this.PCH - ((this.PCH - this.PCL) / 4) && this.RSI14 >= 60 && C > this.CEX10_5) {
                    if (signal > 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = -1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'DOJIDOWN', FUSION.SELL);
                    }
                }

                if (this.CHOSENPATTERNS.DOJIUP && ((O - C > 0 && Math.abs(O - C) <= 0.03 * this.ATR10 && H - O >= 1 * Math.abs(O - C) && C - L >= 1 * Math.abs(O - C))
                    || ((C - O) > 0 && Math.abs(O - C) <= 0.03 * this.ATR10 && H - C >= 1 * Math.abs(O - C) && O - L >= 1 * Math.abs(O - C)))
                    && L <= this.PCL + ((this.PCH - this.PCL) / 4) && this.RSI14 <= 40 && C < this.CEX10_5) {
                    if (signal < 0) {
                        showSignal = 0;
                    }
                    else {
                        signal = 1;
                        this.CANDLESTICKPATTERNS.setTooltip(INDEX, 'DOJIUP', FUSION.BUY);
                    }
                }

                //this.CANDLESTICKPATTERNS.setBinaryValue(INDEX, value);

                if (showSignal == 1) {
                    this.CANDLESTICKPATTERNS.setValue(INDEX, signal);
                    this.CANDLESTICKPATTERNS.setStrength(INDEX, 1);
                } else {
                    this.CANDLESTICKPATTERNS.setValue(INDEX, 0);
                    this.CANDLESTICKPATTERNS.setStrength(INDEX, 0);
                }
            }
        }

        return new CandlestickPatternsController(context, inputs, outputs);
    }    
}

FUSION.scripts['MMA'] = {
    title: 'mmaTitle',
    description: 'mmaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        'PERIODS': { type: 'integer', name: 'periods', properties: { max: 200, min: 0 }, value: 3 }
    },

    outputs: {

        'MMA': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'mmaTitle',
                labels: ['value'],
                fields: ['MMA'],
                data: null
            }
        }
    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'MMA', renderAs: 'Line', dataField: 'MMA', color: '#ff9800', width: 1.5, dash: [] }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var MMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.MMA.setValue(index, FUSION.lib.getMMA(this.CLOSE, index, this.PERIODS, this.MMA));
            };
        };

        return new MMAController(context, inputs, outputs);
    }
};

FUSION.scripts['DPO'] = {

    title: 'dpoTitle',
    description: 'dpoDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        'PERIODS': { type: 'integer', name: 'periods', properties: { max: 200, min: 0 }, value: 7 },
    },

    outputs: {
        'DPO': {
            type: 'series', series: {
                seriesId: null,
                title: 'dpoTitle',
                labels: ['value'],
                fields: ['DPOValue'],
                data: null
            }
        }
    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'DPO', renderAs: 'Line', dataField: 'DPOValue', color: '#03a9f4', width: 1.5, dash: [], priceTag: true }
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var DPOController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var ma = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
                if (close === null || ma === null) return;

                this.DPOValue.setValue(index, close - ma);
            }
        };

        return new DPOController(context, inputs, outputs);
    }
}

FUSION.scripts['DMA'] = {
    title: 'dmaTitle',
    description: 'dmaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        'PERIODS': { type: 'integer', name: 'periods', properties: { max: 200, min: 1 }, value: 3 },
        'DISPLACEMENT': { type: 'integer', name: 'displacement', properties: { max: 200, min: 1 }, value: 3 },
    },
    outputs: {
        'DMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'dmaTitle',
                labels: ['value'],
                fields: ['DMA'],
                data: null
            }
        }
    },
    plotters: [{
        type: 'SeriesObject',
        dataLink: 'DMA',
        renderAs: 'Line',
        dataField: 'DMA',
        color: '#ff9800',
        width: 1.5,
        dash: []
    }],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var DMAController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                if (index < this.PERIODS) {
                    return;
                } else if (index < (this.DISPLACEMENT + this.PERIODS)) {
                    this.DMA.setValue(index + this.DISPLACEMENT, this.CLOSE.getValue(index));
                } else {
                    this.DMA.setValue(index + this.DISPLACEMENT, FUSION.lib.getMA(this.CLOSE, index, this.PERIODS));
                }
            }
        };

        return new DMAController(context, inputs, outputs);
    }
}

//-------------------------------------RSI----------------------------------------------------------------

FUSION.scripts['DINAPOLIDETRENDOSCILLATOR'] = {

    title: 'diNapoliDetrendOscillatorTitle',
    description: 'diNapoliDetrendOscillatorDescription',
    type: 'indicators',
    subscriptionPack: 'diNapoliTools',
    newPane: true,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        'PERIODS': { type: 'integer', name: 'periods', properties: { max: 200, min: 0 }, value: 7 },
    },

    outputs: {
        'DPO': {
            type: 'series', series: {
                seriesId: null,
                title: 'diNapoliDetrendOscillatorTitle',
                labels: ['value'],
                fields: ['DPOValue'],
                data: null
            }
        }
    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'DPO', renderAs: 'Line', dataField: 'DPOValue', color: '#03a9f4', width: 1.5, dash: [], priceTag: true }
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var ma = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
                if (close === null || ma === null) return;

                this.DPOValue.setValue(index, close - ma);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DINAPOLI3X3'] = {

    title: 'diNapoli3x3Title',
    description: 'diNapoli3x3Description',
    type: 'indicators',
    subscriptionPack: 'diNapoliTools',
    newPane: false,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null }
    },
    outputs: {
        'DiNapoli 3X3': {
            type: 'series', series: {
                seriesId: null,
                title: 'diNapoli3x3Title',
                labels: ['value'],
                fields: ['DiNapoli3X3Value'],
                data: null
            }
        }
    },
    plotters: [{
        type: 'SeriesObject',
        dataLink: 'DiNapoli 3X3',
        renderAs: 'Line',
        dataField: 'DiNapoli3X3Value',
        color: '#0361f4',
        width: 1.5,
        dash: [],
        priceTag: true
    }],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var DiNapoli3x3Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;
            this.PERIODS = 3;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.DiNapoli3X3Value.setValue(index + this.PERIODS, FUSION.lib.getMA(this.CLOSE, index, this.PERIODS));
            }
        };

        return new DiNapoli3x3Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DINAPOLIPREFERREDSTOCHASTIC'] = {

    title: 'diNapoliPreferredStochasticTitle',
    description: 'diNapoliPreferredStochasticDescription',
    subscriptionPack: 'diNapoliTools',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': { type: 'series', name: 'priceHigh', properties: { def: 'h' }, value: null },
        'LOW': { type: 'series', name: 'priceLow', properties: { def: 'l' }, value: null },
        'CLOSE': { type: 'series', name: 'priceClose', properties: { def: 'c' }, value: null },
        'PERIOD': { type: 'integer', name: 'periods', properties: { max: 100, min: 0 }, value: 8 },
        'K_SLOW_PERIOD': { type: 'integer', name: 'kSlowPeriod', properties: { def: 3, max: 100, min: 0 }, value: 3 },
        'D_SLOW_PERIOD': { type: 'integer', name: 'dSlowPeriod', properties: { def: 3, max: 100, min: 0 }, value: 3 },
        'HI_BASELINE': { type: 'integer', name: 'hiBaseline', properties: { def: 80, max: 100, min: 0 }, value: 80 },
        'LO_BASELINE': { type: 'integer', name: 'loBaseline', properties: { def: 20, max: 100, min: 0 }, value: 20 },
    },

    outputs: {

        'SO': {
            type: 'series', series: {
                seriesId: null,
                title: 'diNapoliPreferredStochasticTitle',
                labels: ['SOLineK', 'SOLineD', 'SOBaseHI', 'SOBaseLO'],
                fields: ['SOLineK', 'SOLineD', 'SOBaseHI', 'SOBaseLO'],
                data: null
            }
        }

    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOLineK', color: '#03a9f4', width: 1.5, dash: [], priceTag: true, priceLine: false },
        { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOLineD', color: '#f403ea', width: 1.5, dash: [], priceTag: true, priceLine: false },
        { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOBaseHI', color: '#607d8b', width: 1, dash: [], priceTag: false, priceLine: false },
        { type: 'SeriesObject', dataLink: 'SO', renderAs: 'Line', dataField: 'SOBaseLO', color: '#607d8b', width: 1, dash: [], priceTag: false, priceLine: false },
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var SOController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['KSERIES']);
                this.KSERIES = this.context.getRawSeriesWrapper(this.helper, 'KSERIES');
            }

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null || this.HIGH.getValue(index) === null || this.LOW.getValue(index) === null) return;
                this.SOBaseHI.setValue(index, this.HI_BASELINE);
                this.SOBaseLO.setValue(index, this.LO_BASELINE);

                var lo = FUSION.lib.getMin(this.LOW, index, this.PERIOD);
                var hi = FUSION.lib.getMax(this.HIGH, index, this.PERIOD);


                var diff = hi - lo;

                this.KSERIES.setValue(index, 0);
                if (diff > 0) this.KSERIES.setValue(index, 100 * (this.CLOSE.getValue(index) - lo) / diff);


                this.SOLineK.setValue(index, FUSION.lib.getMMA(this.KSERIES, index, this.K_SLOW_PERIOD, this.SOLineK));
                this.SOLineD.setValue(index, FUSION.lib.getMMA(this.SOLineK, index, this.D_SLOW_PERIOD, this.SOLineD));
            }
        };
        return new SOController(context, inputs, outputs);
    }

}

FUSION.scripts['DINAPOLIMACD'] = {
    title: 'diNapoliMacdTitle',
    description: 'diNapoliMacdDescription',
    subscriptionPack: 'diNapoliTools',
    type: 'indicators',
    newPane: true,
    centerZero: true,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        'SMOOTHINGFACTOR1': { type: 'double', name: 'smoothingFactor1', properties: { def: 0.213, max: 1, min: 0.001, step: 0.001 }, value: 0.213 },
        'SMOOTHINGFACTOR2': { type: 'double', name: 'smoothingFactor2', properties: { def: 0.108, max: 1, min: 0.001, step: 0.001 }, value: 0.108 },
        'SIGNALLINESMOOTHINGFACTOR': { type: 'double', name: 'signalLineSmoothingFactor', properties: { def: 0.199, max: 1, min: 0.001, step: 0.001 }, value: 0.199 },
    },

    outputs: {
        'MACD': {
            type: 'series', series: {
                seriesId: null,
                title: 'diNapoliMacdTitle',
                labels: ['line', 'signal', 'histogram'],
                fields: ['MACDLine', 'MACDSignal'],
                data: null
            }
        }
    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'MACD', renderAs: 'Line', dataField: 'MACDSignal', color: '#f403ea', width: 1.5, dash: [], priceTag: true, priceLine: false },
        { type: 'SeriesObject', dataLink: 'MACD', renderAs: 'Line', dataField: 'MACDLine', color: '#03a9f4', width: 1.5, dash: [], priceTag: true, priceLine: false }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var MACDController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['EMAF', 'EMAS', 'EMAG']);
                this.EMAF = this.context.getRawSeriesWrapper(this.helper, 'EMAF');
                this.EMAS = this.context.getRawSeriesWrapper(this.helper, 'EMAS');
                this.EMAG = this.context.getRawSeriesWrapper(this.helper, 'EMAG');
            }

            this.calculate = function (this: any, index: any) {
                this.EMAF.setValue(index, FUSION.lib.getMMA(this.CLOSE, index, 1 / this.SMOOTHINGFACTOR1, this.EMAF));
                this.EMAS.setValue(index, FUSION.lib.getMMA(this.CLOSE, index, 1 / this.SMOOTHINGFACTOR2, this.EMAS));

                var fema = this.EMAF.getValue(index);
                var sema = this.EMAS.getValue(index);

                if (fema === null || sema === null) return;

                this.MACDLine.setValue(index, fema - sema);

                this.EMAG.setValue(index, FUSION.lib.getMMA(this.MACDLine, index, 1 / this.SIGNALLINESMOOTHINGFACTOR, this.EMAG));
                var sgema = this.EMAG.getValue(index);
                this.MACDSignal.setValue(index, sgema);
            }
        };

        return new MACDController(context, inputs, outputs);
    }
}

FUSION.scripts['DINAPOLIMACDPREDICTOR'] = {
    title: 'diNapoliMacdPredictorTitle',
    description: 'diNapoliMacdPredictorDescription',
    subscriptionPack: 'diNapoliTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        'SHIFT': { type: 'integer', name: 'shift', properties: { def: 1, max: 999, min: 0 }, value: 1 },
    },

    outputs: {
        'MACDPredictor': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'diNapoliMacdPredictorTitle',
                labels: ['value'],
                fields: ['MACDPredictorValue'],
                data: null
            }
        }
    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'MACDPredictor', renderAs: 'Line', dataField: 'MACDPredictorValue', color: '#f44336', width: 1.5, dash: [], priceTag: true, priceLine: false }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var MACDPredictorController: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['EMA1', 'EMA2', 'MACD', 'SIGNAL']);
                this.EMA1 = this.context.getRawSeriesWrapper(this.helper, 'EMA1');
                this.EMA2 = this.context.getRawSeriesWrapper(this.helper, 'EMA2');
                this.MACD = this.context.getRawSeriesWrapper(this.helper, 'MACD');
                this.SIGNAL = this.context.getRawSeriesWrapper(this.helper, 'SIGNAL');

                this.SMOOTHINGFACTOR1 = 0.213;
                this.SMOOTHINGFACTOR2 = 0.108;
                this.SIGNALLINESMOOTHINGFACTOR = 0.199;
            }

            this.calculate = function (this: any, index: any) {
                var ema1Periods = 8;
                var ema2Periods = 18;
                var signalPeriods = 9;
                var mp1 = 1 / 0.105;
                var mp2 = 1.574 / 0.210;
                var mp3 = 1.784 / 0.210;

                if (this.CLOSE.getValue(index) === null) return;

                if (this.EMA1.getValue(index - 1) !== null) {
                    this.EMA1.setValue(index, this.EMA1.getValue(index - 1) + this.SMOOTHINGFACTOR1 * (this.CLOSE.getValue(index) - this.EMA1.getValue(index - 1)));
                } else {
                    this.EMA1.setValue(index, FUSION.lib.getMA(this.CLOSE, index, ema1Periods));
                }

                 
                if (this.EMA2.getValue(index - 1) !== null) {
                    this.EMA2.setValue(index, this.EMA2.getValue(index - 1) + this.SMOOTHINGFACTOR2 * (this.CLOSE.getValue(index) - this.EMA2.getValue(index - 1)));
                    this.MACD.setValue(index, this.EMA1.getValue(index) - this.EMA2.getValue(index));
                } else {
                    this.EMA2.setValue(index, FUSION.lib.getMA(this.CLOSE, index, ema2Periods));
                    if (this.EMA1.getValue(index) === null || this.EMA2.getValue(index) === null) return;
                    this.MACD.setValue(index, this.EMA1.getValue(index) - this.EMA2.getValue(index));
                }

                
                if (this.EMA1.getValue(index) !== null || this.EMA2.getValue(index) !== null || this.MACD.getValue(index) !== null || this.SIGNAL.getValue(index - 1) !== null) {
                    this.SIGNAL.setValue(index, this.SIGNAL.getValue(index - 1) + (this.SIGNALLINESMOOTHINGFACTOR * (this.MACD.getValue(index) - this.SIGNAL.getValue(index - 1))));
                    if (this.SIGNAL.getValue(index) === null || this.SIGNAL.getValue(index - 1) === null) return;
                    var macdPredictor = this.SIGNAL.getValue(index) * mp1 - this.EMA1.getValue(index) * mp2 + this.EMA2.getValue(index) * mp3;
                    this.MACDPredictorValue.setValue(index + this.SHIFT, macdPredictor);
                } else {
                    this.SIGNAL.setValue(index, FUSION.lib.getMA(this.MACD, index, signalPeriods));
                }


            }
        };

        return new MACDPredictorController(context, inputs, outputs);
    }
}

FUSION.scripts['DOP'] = {
    title: 'diNapoliOscillatorPredictorTitle',
    description: 'diNapoliOscillatorPredictorDescription',
    subscriptionPack: 'diNapoliTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': { type: 'series', name: 'price', properties: { def: 'c' }, value: null },
        // 'PERIOD': { type: 'integer', name: 'periods', properties: { max: 100, min: 0 }, value: 7 },
        'PERCENT': { type: 'integer', name: 'percent', properties: { def: 100, max: 999, min: 1}, value: 100 },
        'LOOKBACKPERIODS': { type: 'integer', name: 'lookbackPeriods', properties: { def: 135, max: 999, min: 1 }, value: 135 },
        'PEAKSANDTHROUGHS': { type: 'integer', name: 'peaksAndThroughs', properties: { def: 3, max: 999, min: 1 }, value: 3 },
        'SHIFT': { type: 'integer', name: 'Shift', properties: { def: 1, max: 999, min: 0 }, value: 1 }
    }, 

    outputs: {
        'DOP': {
            type: 'series', series: {
                seriesId: null,
                title: 'diNapoliOscillatorPredictorTitle',
                labels: ['diNapoliOscillatorPredictorHigh', 'diNapoliOscillatorPredictorLow'],
                fields: ['High', 'Low'],
                data: null
            }
        }
    },

    plotters: [
        { type: 'SeriesObject', dataLink: 'DOP', renderAs: 'Line', dataField: 'High', color: '#03a9f4', width: 1.5, dash: [], priceTag: true, priceLine: false },
        { type: 'SeriesObject', dataLink: 'DOP', renderAs: 'Line', dataField: 'Low', color: '#03a9f4', width: 1.5, dash: [], priceTag: true, priceLine: false }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var c: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'peaks1',
                    'peaks2',
                    'troughs1',
                    'troughs2',
                    'peaksAverage',
                    'throughsAverage'
                ]);
                this.peaks1 = this.context.getRawSeriesWrapper(this.helper, 'peaks1');
                this.peaks2 = this.context.getRawSeriesWrapper(this.helper, 'peaks2');
                this.throughs1 = this.context.getRawSeriesWrapper(this.helper, 'throughs1');
                this.throughs2 = this.context.getRawSeriesWrapper(this.helper, 'throughs2');
                this.peaksAverage = this.context.getRawSeriesWrapper(this.helper, 'peaksAverage');
                this.throughsAverage = this.context.getRawSeriesWrapper(this.helper, 'throughsAverage');
                this.PERIOD = 7;
            }

            this.calculate = function (this: any, index: any) {               
                var ma7 = FUSION.lib.getMA(this.CLOSE, index, this.PERIOD);
                if (ma7 === null) return; 
                var detrendOscillatorValue = this.CLOSE.getValue(index) - ma7;

                // Peaks
                if (detrendOscillatorValue > 0) {
                    if (!this.peaks1.getValue(index - 1)) {
                        this.peaks1.setValue(index, detrendOscillatorValue);
                    } else {
                        if (detrendOscillatorValue > this.peaks1.getValue(index - 1)) {
                            this.peaks1.setValue(index, detrendOscillatorValue);
                        } else {
                            this.peaks1.setValue(index, this.peaks1.getValue(index - 1));
                        }
                    }
                } else {
                    this.peaks1.setValue(index, null);
                }   

                if (detrendOscillatorValue < 0) {
                    this.peaks2.setValue(index, this.peaks1.getValue(index - 1));
                } else {
                    this.peaks2.setValue(index, null);
                }

                // Throughs            
                if (detrendOscillatorValue < 0) {
                    if (detrendOscillatorValue < this.throughs1.getValue(index - 1)) {
                        this.throughs1.setValue(index, detrendOscillatorValue);
                    } else {
                        this.throughs1.setValue(index, this.throughs1.getValue(index - 1));
                    }
                } else {
                    this.throughs1.setValue(index, null);
                }

                if (detrendOscillatorValue > 0) {
                    this.throughs2.setValue(index, this.throughs1.getValue(index - 1));
                } else {
                    this.throughs2.setValue(index, null);
                }

                // Peaks and Throughs Averages
                var peaksSum = 0;
                var throughsSum = 0;
                var minPeak = this.peaks1.getValue(index);
                var maxThrough = this.throughs1.getValue(index);

                for (var i = 0; i < this.PEAKSANDTHROUGHS; ++i) {
                    var peak = FUSION.lib.getLarge(this.peaks2, index, this.LOOKBACKPERIODS, i);
                    if (peak >= minPeak) {
                        peaksSum += peak;
                    } else {
                        peaksSum += minPeak;
                        minPeak = peak;
                    }
                    
                    var through = FUSION.lib.getSmall(this.throughs2, index, this.LOOKBACKPERIODS, i);
                    if (through <= maxThrough) {
                        throughsSum += through;
                    } else {
                        throughsSum += maxThrough;
                        maxThrough = through;
                    }
                }

                this.peaksAverage.setValue(index, peaksSum / this.PEAKSANDTHROUGHS);
                this.throughsAverage.setValue(index, throughsSum / this.PEAKSANDTHROUGHS);

                if (index >= this.LOOKBACKPERIODS) {
                    var ma = FUSION.lib.getMA(this.CLOSE, index, 6);
                    if (ma === null || this.peaksAverage.getValue(index) === null || this.throughsAverage.getValue(index) === null) return;
                    this.High.setValue(index + this.SHIFT, 7/6 * this.peaksAverage.getValue(index) * this.PERCENT / 100 + ma);
                    this.Low.setValue(index + this.SHIFT, 7/6 * this.throughsAverage.getValue(index) * this.PERCENT / 100 + ma);
                }
            }
        };

        return new c(context, inputs, outputs);
    }
}

FUSION.scripts['FORWARD'] = {
    title: 'forwardTitle',
    description: 'forwardDescription',
    subscriptionPack: 'importerExporterTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 999, min: 0}, value: 365},
        'INTEREST1': {type: 'double', name: 'interest1', properties: {max: 999, min: -999, step: 0.1}, value: 3},
        'INTEREST2': {type: 'double', name: 'interest2', properties: {max: 999, min: -999, step: 0.1}, value: 1},
    },

    outputs: {
        'FORWARD': {
            type: 'series', series: {
                seriesId: null,
                title: 'forwardTitle',
                labels: ['value'],
                fields: ['ForwardValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'FORWARD', renderAs: 'Line', dataField: 'ForwardValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = "";
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {};

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null) return;
                var INTEREST1 = this.INTEREST1 / 100;
                var INTEREST2 = this.INTEREST2 / 100;
                var value = this.CLOSE.getValue(index) * Math.pow(Math.E, (INTEREST2 - INTEREST1) * this.PERIODS / 365);
                this.ForwardValue.setValue(index, value);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['FORECAST'] = {
    title: 'forecastTitle',
    description: 'forecastDescription',
    subscriptionPack: 'importerExporterTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periodsForAnalysis', properties: {max: 999, min: 0}, value: 250},
        'SHIFT': {type: 'integer', name: 'shift', properties: {max: 999, min: 0}, value: 0},
        'PROGNOSIS_PERIODS': {type: 'integer', name: 'prognosisPeriods', properties: {max: 999, min: 0}, value: 250},
        'PROBABILITY': {type: 'double', name: 'probability', properties: {max: 100, min: 0, step: 1}, value: 50}
    },

    outputs: {
        'FORECAST': {
            type: 'series', series: {
                seriesId: null,
                title: 'forecastTitle',
                labels: ['upper', 'lower'],
                fields: ['ForecastUpper', 'ForecastLower'],
                data: null
            }
        },
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'FORECAST', renderAs: 'Band', upperField: 'ForecastUpper', lowerField: 'ForecastLower', color: '#5b6f8b', width: 1, dash: [0,0]},
    ],
    
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = "";
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'returnRate'
                ]);
                this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');
            }

            this.calculate = function (this: any, index: any) {                
                var shiftedIndex = (this.CLOSE.getSeriesLength() - 1 - this.SHIFT);

                if (index >= shiftedIndex - this.PERIODS) {
                    var returnRate = (this.CLOSE.getValue(index) - this.CLOSE.getValue(index - 1)) / this.CLOSE.getValue(index - 1);
                    this.returnRate.setValue(index, returnRate);
                }

                if (index === shiftedIndex) {
                    var PROBABILITY = (1 - this.PROBABILITY / 100) / 2;
                    var average = FUSION.lib.getMA(this.returnRate, index, this.PERIODS);
                    var standardDeviation = FUSION.lib.getStdDev(this.returnRate, index, this.PERIODS);
                    var valueAtRisk = FUSION.lib.inverseNormalDistribution(PROBABILITY, average, standardDeviation);

                    this.ForecastUpper.setValue(index, this.CLOSE.getValue(index));
                    this.ForecastLower.setValue(index, this.CLOSE.getValue(index));

                    for (var i = 1; i <= this.PROGNOSIS_PERIODS; ++i) {
                        var valueAtRiskValue = valueAtRisk * Math.sqrt(i) * this.CLOSE.getValue(index);
                        var upper = this.CLOSE.getValue(index) - valueAtRiskValue;
                        var lower = this.CLOSE.getValue(index) + valueAtRiskValue;

                        this.ForecastUpper.setValue(index + i, upper);
                        this.ForecastLower.setValue(index + i, lower);
                    }
                }
                
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['VARBANDS'] = {
    title: 'varbandsTitle',
    description: 'varbandsDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'Price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'Periods', properties: {max: 200, min: 0}, value: 10},
        'PROGNOSIS_PERIODS': {type: 'integer', name: 'Prognosis periods', properties: {max: 200, min: 0}, value: 50},
        'PROBABILITY_PERCENT': {type: 'double', name: 'Probability', properties: {max: 999, min: -999, step: 0.1}, value: 95}
    },

    outputs: {
        'VARBANDS': {
            type: 'series', series: {
                seriesId: null,
                title: 'varbandsTitle',
                labels: ['upper', 'upper'],
                fields: ['VarbandsUpper', 'VarbandsLower'],
                data: null
            }
        },
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'VARBANDS', renderAs: 'Band', upperField: 'VarbandsUpper', lowerField: 'VarbandsLower', color: '#5b6f8b', width: 1, dash: [0,0]},
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id = "";
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'returnRate'
                ]);
                this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');
                this.PROBABILITY = (1 - this.PROBABILITY_PERCENT / 100) / 2;
            }

            this.calculate = function (this: any, index: any) {
                this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

                if (index === this.CLOSE.getSeriesLength() - 1) {
                    for (var i = 0; i <= this.PROGNOSIS_PERIODS; ++i) {
                        var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index + i, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);
                        this.VarbandsUpper.setValue(index + i, values.upper);
                        this.VarbandsLower.setValue(index + i, values.lower);
                    }
                } else if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
                    var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);

                    this.VarbandsUpper.setValue(index, values.upper);
                    this.VarbandsLower.setValue(index, values.lower);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DECISIONLONGBUY'] = {
    title: 'decisionLongBuyTitle',
    description: 'decisionLongBuyDescription',
    subscriptionPack: 'importerExporterTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'Price', properties: {def:'c'}, value: null},
    },

    outputs: {
        'SIGNAL': {
            type: 'series', series: {
                seriesId: null,
                title: 'decisionLongBuyTitle',
                labels: ['signal'],
                fields: ['SignalValue'],
                data: null
            }
        },
        'SMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'smaTitle',
                labels: ['value'],
                fields: ['SMAValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'SIGNAL', renderAs: '', dataField: 'SignalValue', color: '#ff0000', width: 1, dash:[]},
        {type:'SeriesObject', dataLink: 'SMA', renderAs: 'Line', dataField: 'SMAValue', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'returnRate'
                ]);
                this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');

                this.PERIODS = 24;
                this.PROGNOSIS_PERIODS = 480;
                this.PROBABILITY = (1 - 50 / 100) / 2;;
            }
            this.calculate = function (this: any, index: any) {
                var signal = FUSION.DO_NOTHING;
                this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PROGNOSIS_PERIODS));
                this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

                if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
                    var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);
                    if(this.CLOSE.getValue(index) < values.lower) {
                        signal=FUSION.BUY;
                    }
                }
                
                this.SignalValue.setValue(index, signal);
            }
        }
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DECISIONLONGSELL'] = {
    title: 'decisionLongSellTitle',
    description: 'decisionLongSellDescription',
    subscriptionPack: 'importerExporterTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'Price', properties: {def:'c'}, value: null},
    },

    outputs: {
        'SIGNAL': {
            type: 'series', series: {
                seriesId: null,
                title: 'decisionLongSellTitle',
                labels: ['signal'],
                fields: ['SignalValue'],
                data: null
            }
        },
        'SMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'smaTitle',
                labels: ['value'],
                fields: ['SMAValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'SIGNAL', renderAs: '', dataField: 'SignalValue', color: '#ff0000', width: 1, dash:[]},
        {type:'SeriesObject', dataLink: 'SMA', renderAs: 'Line', dataField: 'SMAValue', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'returnRate'
                ]);
                this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');

                this.PERIODS = 24;
                this.PROGNOSIS_PERIODS = 480;
                this.PROBABILITY = (1 - 50 / 100) / 2;;
            }
            this.calculate = function (this: any, index: any) {
                var signal = FUSION.DO_NOTHING;
                this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PROGNOSIS_PERIODS));
                this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

                if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
                    var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);
                    if (this.CLOSE.getValue(index) !== null &&
                        this.CLOSE.getValue(index) > values.upper
                    ) {
                        signal=FUSION.SELL;
                    }
                }
                
                this.SignalValue.setValue(index, signal);
            }
        }
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DECISIONSHORTBUY'] = {
    title: 'decisionShortBuyTitle',
    description: 'decisionShortBuyDescription',
    subscriptionPack: 'importerExporterTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'Price', properties: {def:'c'}, value: null},
    },

    outputs: {
        'SIGNAL': {
            type: 'series', series: {
                seriesId: null,
                title: 'decisionShortBuyTitle',
                labels: ['signal'],
                fields: ['SignalValue'],
                data: null
            }
        },
        'SMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'smaTitle',
                labels: ['value'],
                fields: ['SMAValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'SIGNAL', renderAs: '', dataField: 'SignalValue', color: '#ff0000', width: 1, dash:[]},
        {type:'SeriesObject', dataLink: 'SMA', renderAs: 'Line', dataField: 'SMAValue', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'returnRate'
                ]);
                this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');

                this.PERIODS = 24;
                this.PROGNOSIS_PERIODS = 120;
                this.PROBABILITY = (1 - 50 / 100) / 2;;
            }
            this.calculate = function (this: any, index: any) {
                var signal = FUSION.DO_NOTHING;
                this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PROGNOSIS_PERIODS));
                this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

                if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
                    var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);
                    if(this.CLOSE.getValue(index) < values.lower) {
                        signal=FUSION.BUY;
                    }
                }
                
                this.SignalValue.setValue(index, signal);
            }
        }
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DECISIONSHORTSELL'] = {
    title: 'decisionShortSellTitle',
    description: 'decisionShortSellDescription',
    subscriptionPack: 'importerExporterTools',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'Price', properties: {def:'c'}, value: null},
    },

    outputs: {
        'SIGNAL': {
            type: 'series', series: {
                seriesId: null,
                title: 'decisionShortSellTitle',
                labels: ['signal'],
                fields: ['SignalValue'],
                data: null
            }
        },
        'SMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'smaTitle',
                labels: ['value'],
                fields: ['SMAValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'SIGNAL', renderAs: '', dataField: 'SignalValue', color: '#ff0000', width: 1, dash:[]},
        {type:'SeriesObject', dataLink: 'SMA', renderAs: 'Line', dataField: 'SMAValue', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'returnRate'
                ]);
                this.returnRate = this.context.getRawSeriesWrapper(this.helper, 'returnRate');

                this.PERIODS = 24;
                this.PROGNOSIS_PERIODS = 120;
                this.PROBABILITY = (1 - 50 / 100) / 2;
            }
            this.calculate = function (this: any, index: any) {
                var signal = FUSION.DO_NOTHING;
                this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PROGNOSIS_PERIODS));
                this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

                if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
                    var values = FUSION.lib.getForecastAverage(this.CLOSE, this.returnRate, index, this.PERIODS, this.PROGNOSIS_PERIODS, this.PROBABILITY);
                    if(this.CLOSE.getValue(index) > values.upper) {
                        signal=FUSION.SELL;
                    }
                }
                
                this.SignalValue.setValue(index, signal);
            }
        }
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['SIGNALDISTANCE'] = {
    title: 'signalDistanceTitle',
    description: 'signalDistanceDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'STRATEGY': {type: 'series', name: 'strategy', properties: {}, value: null},
    },

    outputs: {
        'DISTANCE': {
            type: 'series', series: {
                seriesId: null,
                title: 'signalDistanceTitle',
                labels: ['value'],
                fields: ['SignalDistanceValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'DISTANCE', renderAs: 'Line', dataField: 'SignalDistanceValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'lastSignal'
                ]);
                this.lastSignal = this.context.getRawSeriesWrapper(this.helper, 'lastSignal');
            }

            this.onModify = function (this: any) {
                this.init();
            }

            this.calculate = function (this: any, index: any) {
                var lastSignal = this.lastSignal.getValue(index - 1); 

                if (this.STRATEGY.getValue(index)) {
                    this.lastSignal.setValue(index, index);
                } else {
                    this.lastSignal.setValue(index, lastSignal);
                }

                if (lastSignal !== null) {
                    this.SignalDistanceValue.setValue(index, index - lastSignal);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['ACCUMULATION'] = {
    title: 'accumulationTitle',
    description: 'accumulationDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'INDICATOR': {type: 'series', name: 'indicator', properties: {}, value: null},
    },

    outputs: {
        'ACCUMULATION': {
            type: 'series', series: {
                seriesId: null,
                title: 'accumulationTitle',
                labels: ['value'],
                fields: ['AccumulationValue'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ACCUMULATION', renderAs: 'Line', dataField: 'AccumulationValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {

        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {

            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'lastSignal'
                ]);
                this.lastSignal = this.context.getRawSeriesWrapper(this.helper, 'lastSignal');
            }

            this.onModify = function (this: any) {
                this.init();
            }

            this.calculate = function (this: any, index: any) {
                if (this.INDICATOR.getValue(index) === null) return;
                this.AccumulationValue.setValue(index, this.AccumulationValue.getValue(index - 1) + this.INDICATOR.getValue(index));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['PRICELEVELS'] = {
    title: 'priceLevelsTitle',
    description: 'priceLevelsDescription',
    type: 'indicators',
    newPane: false,

    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'DISTANCE': {type: 'double', name: 'distance', properties: {def: 10.0, max: 999.0, min: 0.0}, value: 10.0},
        'UNITS': {type: 'list', name: 'type', properties: {},list: ['percent', 'value'], value: 'percent'}
    },

    outputs: {
        'PRICELEVELS': {
            type: 'series', series: {
                seriesId: null,
                title: 'priceLevelsTitle',
                labels: ['value'],
                fields: ['PriceLevels'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'PRICELEVELS', renderAs: 'Line', dataField: 'PriceLevels', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.percentDistance = this.DISTANCE * 0.01;
            }

            this.onModify = function (this: any) {
                this.init();
            }

            this.calculate = function (this: any, index: any) {
                var lastPriceLevels = this.PriceLevels.getValue(index - 1);
                var close = this.CLOSE.getValue(index);

                if (close === null) return;
                if (lastPriceLevels === null) lastPriceLevels = close;

                var priceLevels = lastPriceLevels;
                var distance = this.DISTANCE;

                if (this.UNITS === "percent") {
                    distance = lastPriceLevels * this.percentDistance;
                }

                if (Math.abs(lastPriceLevels - close) > distance) {
                    priceLevels = close;
                }

                this.PriceLevels.setValue(index, priceLevels);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['OBV'] = {
    title: 'obvTitle',
    description: 'obvDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
    },
    outputs: {
        'OBV': {
            type: 'series', series: {
                seriesId: null,
                title: 'obvTitle',
                labels: ['value'],
                fields: ['OBVValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'OBV', renderAs: 'Line', dataField: 'OBVValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);
                var volume = this.VOLUME.getValue(index);
                var lastOBV = this.OBVValue.getValue(index - 1) || 0;

                if (close === null || lastClose === null || volume === null) return;

                if (close > lastClose) {
                    this.OBVValue.setValue(index, lastOBV + volume);
                } else if (close < lastClose) {
                    this.OBVValue.setValue(index, lastOBV - volume);
                } else {
                    this.OBVValue.setValue(index, lastOBV);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['ADL'] = {
    title: 'adlTitle',
    description: 'adlDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
    },
    outputs: {
        'ADL': {
            type: 'series', series: {
                seriesId: null,
                title: 'adlTitle',
                labels: ['value'],
                fields: ['ADLValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'ADL', renderAs: 'Line', dataField: 'ADLValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var high = this.HIGH.getValue(index);
                var low = this.LOW.getValue(index);
                var close = this.CLOSE.getValue(index);
                var volume = this.VOLUME.getValue(index);
                var lastADL = this.ADLValue.getValue(index - 1);

                if (high === null || low === null || close === null || volume === null || (high - low) === 0) {
                    this.ADLValue.setValue(index, lastADL);
                    return;
                }

                var currentADL = (close - low - high + close) / (high - low) * volume;
                this.ADLValue.setValue(index, lastADL + currentADL);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CMF'] = {
    title: 'cmfTitle',
    description: 'cmfDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 21}
    },
    outputs: {
        'CMF': {
            type: 'series', series: {
                seriesId: null,
                title: 'cmfTitle',
                labels: ['value'],
                fields: ['CMFValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'CMF', renderAs: 'Line', dataField: 'CMFValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'ADL',
                    'ADLSum',
                    'VolumeSum'
                ]);
                this.ADL = this.context.getRawSeriesWrapper(this.helper, 'ADL');
                this.ADLSum = this.context.getRawSeriesWrapper(this.helper, 'ADLSum');
                this.VolumeSum = this.context.getRawSeriesWrapper(this.helper, 'VolumeSum');
            }

            this.calculate = function (this: any, index: any) {
                var high = this.HIGH.getValue(index);
                var low = this.LOW.getValue(index);
                var close = this.CLOSE.getValue(index);
                var volume = this.VOLUME.getValue(index);
                var lastADL = this.ADL.getValue(index - 1);
                var lastADLSum = this.ADLSum.getValue(index - 1);
                var lastVolumeSum = this.VolumeSum.getValue(index - 1);

                var adl = 0;
                if (high === null || low === null || close === null || volume === null || (high - low) === 0) {
                    adl = 0;
                } else {
                    adl = (close - low - high + close) / (high - low) * volume;
                }

                var adlSum = lastADLSum + adl - this.ADL.getValue(index - this.PERIODS);
                var volumeSum = lastVolumeSum + volume - this.VOLUME.getValue(index - this.PERIODS);

                this.ADL.setValue(index, adl);
                this.ADLSum.setValue(index, adlSum);
                this.VolumeSum.setValue(index, volumeSum);
                
                if (volumeSum) {
                    this.CMFValue.setValue(index, adlSum / volumeSum);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['NVI'] = {
    title: 'nviTitle',
    description: 'nviDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
    },
    outputs: {
        'NVI': {
            type: 'series', series: {
                seriesId: null,
                title: 'nviTitle',
                labels: ['value'],
                fields: ['NVIValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'NVI', renderAs: 'Line', dataField: 'NVIValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);
                var volume = this.VOLUME.getValue(index);
                var lastVolume = this.VOLUME.getValue(index - 1);
                var lastNVI = this.NVIValue.getValue(index - 1) || 1;

                if (close === null || lastClose === null || volume === null || lastVolume === null || volume > lastVolume) {
                    this.NVIValue.setValue(index, lastNVI);
                } else {
                    var nvi = (close - lastClose) / lastClose * lastNVI + lastNVI;
                    this.NVIValue.setValue(index, nvi);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['PVI'] = {
    title: 'pviTitle',
    description: 'pviDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
    },
    outputs: {
        'PVI': {
            type: 'series', series: {
                seriesId: null,
                title: 'pviTitle',
                labels: ['value'],
                fields: ['PVIValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'PVI', renderAs: 'Line', dataField: 'PVIValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);
                var volume = this.VOLUME.getValue(index);
                var lastVolume = this.VOLUME.getValue(index - 1);
                var lastPVI = this.PVIValue.getValue(index - 1) || 1;

                if (close === null || lastClose === null || volume === null || lastVolume === null || volume < lastVolume) {
                    this.PVIValue.setValue(index, lastPVI);
                } else {
                    var pvi = (close - lastClose) / lastClose * lastPVI + lastPVI;
                    this.PVIValue.setValue(index, pvi);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['ZIGZAG'] = {
    title: 'zigzagTitle',
    description: 'zigzagDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERCENT': { type: 'integer', name: 'percent', properties: { def: 10, max: 999, min: 1}, value: 10 },
        'EXTENDTOLASTBAR': {type: 'boolean', name: 'extendToLastBar', properties: {}, value: true},

    },
    outputs: {
        'ZIGZAG': {
            type: 'series', series: {
                seriesId: null,
                title: 'zigzagTitle',
                labels: ['value'],
                fields: ['ZIGZAGValue'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'ZIGZAG', renderAs: 'Line', dataField: 'ZIGZAGValue', color: '#ff9800', width: 1.5, dash:[]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.onModify = function (this: any) {
                this.init();
            }

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'lastPeak',
                    'lastThrough',
                    'lastPeakIndex',
                    'lastThroughIndex',
                    'lastExtremeType'
                ]);
                this.lastPeak = this.context.getRawSeriesWrapper(this.helper, 'lastPeak');
                this.lastThrough = this.context.getRawSeriesWrapper(this.helper, 'lastThrough');
                this.lastPeakIndex = this.context.getRawSeriesWrapper(this.helper, 'lastPeakIndex');
                this.lastThroughIndex = this.context.getRawSeriesWrapper(this.helper, 'lastThroughIndex');
                this.lastExtremeType = this.context.getRawSeriesWrapper(this.helper, 'lastExtremeType');
                this.change = this.PERCENT / 100;

                this.addValuesInBetween = function (this: any, startIndex: any, endIndex: any, startValue: any, endValue: any) {
                    var a = (startValue - endValue) / (startIndex - endIndex);
                    var b = startValue - a * startIndex;
                    for (var i = startIndex + 1; i < endIndex; ++i) {
                        this.ZIGZAGValue.setValue(i, a * i + b);
                    }
                }

                this.calculateWhenLastWasPeak = function (this: any, index: any) {
                    var high = this.HIGH.getValue(index);
                    var low = this.LOW.getValue(index);
                    var lastPeak = this.lastPeak.getValue(index - 1) || high;
                    var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
                    var lastThrough = this.lastThrough.getValue(index - 1) || low;
                    var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;
                    
                    this.lastExtremeType.setValue(index, 1);
                    if (high > lastPeak) {
                        lastPeak = high;
                        this.lastPeak.setValue(index, high);
                        this.ZIGZAGValue.setValue(index, high);
                        this.addValuesInBetween(lastThroughIndex, index, lastThrough, lastPeak);
                        this.lastPeakIndex.setValue(index, index);
                        this.lastThrough.setValue(index, lastThrough);
					    this.lastThroughIndex.setValue(index, lastThroughIndex);
                        return;
                    } else {
                        this.lastPeak.setValue(index, lastPeak);
                        this.lastPeakIndex.setValue(index, lastPeakIndex);
                    }
                    
                    if (low < lastPeak - this.change * lastPeak) {
                        this.lastThrough.setValue(index, low);
                        this.ZIGZAGValue.setValue(index, low);
                        this.addValuesInBetween(lastPeakIndex, index, lastPeak, low);
                        this.lastExtremeType.setValue(index, -1);
                        this.lastThroughIndex.setValue(index, index);
                    } else {
                        this.lastThrough.setValue(index, lastThrough);
                        this.lastThroughIndex.setValue(index, lastThroughIndex);
                    }
                }.bind(this);

                this.calculateWhenLastWasThrough = function (this: any, index: any) {
                    var high = this.HIGH.getValue(index);
                    var low = this.LOW.getValue(index);
                    var lastPeak = this.lastPeak.getValue(index - 1) || high;
                    var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
                    var lastThrough = this.lastThrough.getValue(index - 1) || low;
                    var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;

                    this.lastExtremeType.setValue(index, -1);
                    this.ZIGZAGValue.setValue(index, null);
                    if (low < lastThrough) {
                        lastThrough = low;
                        this.lastThrough.setValue(index, low);
                        this.addValuesInBetween(lastPeakIndex, index, lastPeak, lastThrough);
                        this.ZIGZAGValue.setValue(index, low);
                        this.lastThroughIndex.setValue(index, index);
                        this.lastPeak.setValue(index, lastPeak);
					    this.lastPeakIndex.setValue(index, lastPeakIndex);
                        return;
                    } else {
                        this.lastThrough.setValue(index, lastThrough);
                        this.lastThroughIndex.setValue(index, lastThroughIndex);
                    }
                    
                    if (high > lastThrough + this.change * lastThrough) {
                        this.lastPeak.setValue(index, high);
                        this.ZIGZAGValue.setValue(index, high);
                        this.addValuesInBetween(lastThroughIndex, index, lastThrough, high);
                        this.lastPeakIndex.setValue(index, index);
                        this.lastExtremeType.setValue(index, 1);
                    } else {
                        this.lastPeak.setValue(index, lastPeak);
                        this.lastPeakIndex.setValue(index, lastPeakIndex);
                    }
                }.bind(this);

                this.calculateWhenLastWasUnknown = function (this: any, index: any, lastWasThrough: any) {
                    var high = this.HIGH.getValue(index);
                    var low = this.LOW.getValue(index);
                    var lastPeak = this.lastPeak.getValue(index - 1) || high;
                    var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
                    var lastThrough = this.lastThrough.getValue(index - 1) || low;
                    var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;

                    if (high > lastPeak) {
                        lastPeak = high;
                        lastPeakIndex = index;
                        this.lastPeak.setValue(index, high);
                        this.lastPeakIndex.setValue(index, index);
                    } else {
                        this.lastPeak.setValue(index, lastPeak);
                        this.lastPeakIndex.setValue(index, lastPeakIndex);
                    }

                    if (low < lastThrough) {
                        lastThrough = low;
                        lastThroughIndex = index;
                        this.lastThrough.setValue(index, low);
                        this.lastThroughIndex.setValue(index, index);
                    } else {
                        this.lastThrough.setValue(index, lastThrough);
                        this.lastThroughIndex.setValue(index, lastThroughIndex);
                    }
                    
                    if (high > this.lastPeak.getValue(index - 1) && high > lastThrough + this.change * lastThrough) {
                        this.lastPeak.setValue(index, high);
                        this.ZIGZAGValue.setValue(index, high);
                        this.ZIGZAGValue.setValue(lastThroughIndex, lastThrough);
                        this.addValuesInBetween(lastThroughIndex, index, lastThrough, lastPeak);
                        this.lastPeakIndex.setValue(index, index);
                        this.lastExtremeType.setValue(index, 1);
                    } else if (low < this.lastThrough.getValue(index - 1) && low < lastPeak - this.change * lastPeak) {
                        this.lastThrough.setValue(index, low);
                        this.ZIGZAGValue.setValue(index, low);
                        this.ZIGZAGValue.setValue(lastPeakIndex, lastPeak);
                        this.addValuesInBetween(lastPeakIndex, index, lastPeak, lastThrough);
                        this.lastThroughIndex.setValue(index, index);
                        this.lastExtremeType.setValue(index, -1);
                    }
                }.bind(this);
            }

            this.calculate = function (this: any, index: any) {
                var lastExtremeType = this.lastExtremeType.getValue(index - 1);
                var high = this.HIGH.getValue(index);
                var low = this.LOW.getValue(index);

                if (high === null || low === null) {
                    return;
                }

                if (lastExtremeType === 1) {
                    this.calculateWhenLastWasPeak(index);            
                } else if (lastExtremeType === -1) {
                    this.calculateWhenLastWasThrough(index);
                } else {      
                    this.calculateWhenLastWasUnknown(index);
                }

                if (this.EXTENDTOLASTBAR && index === this.HIGH.getSeriesLength() - 1 && this.ZIGZAGValue.getValue(index) === null) {
                    if (lastExtremeType === 1) {
                        var lastPeak = this.lastPeak.getValue(index - 1) || high;
				        var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
                        this.ZIGZAGValue.setValue(index, low);
                        this.addValuesInBetween(lastPeakIndex, index, lastPeak, low);
                    } else if (lastExtremeType === -1) {
                        var lastThrough = this.lastThrough.getValue(index - 1) || low;
                        var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;
                        this.ZIGZAGValue.setValue(index, high);
                        this.addValuesInBetween(lastThroughIndex, index, lastThrough, high);
                    }
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['PIVOTPOINTS'] = {
    title: 'pivotPointTitle',
    description: 'pivotPointDescription',
    type: 'indicators',
    newPane: false,
    quickAdd: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
    },
    outputs: {
        'PIVOTPOINTS': {
            type: 'series', series: {
                seriesId: null,
                title: 'pivotPointTitle',
                labels: ['pivotPointResistance3', 'pivotPointResistance2', 'pivotPointResistance1', 'pivotPointTitle', 'pivotPointSupport1', 'pivotPointSupport2', 'pivotPointSupport3'],
                fields: ['Resistance3', 'Resistance2', 'Resistance1', 'PivotPoint', 'Support1', 'Support2', 'Support3'],
                data: null
            }
            
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'PivotPoint', color: '#03a9f4', width: 1.5, dash:[]},
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'Support1', color: '#4caf50', width: 1.5, dash:[3, 3]},
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'Support2', color: '#4caf50', width: 1.5, dash:[1, 4]},
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'Support3', color: '#4caf50', width: 1.5, dash:[1, 8]},
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'Resistance1', color: '#f44336', width: 1.5, dash:[3, 3]},
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'Resistance2', color: '#f44336', width: 1.5, dash:[1, 4]},
        {type:'SeriesObject', dataLink: 'PIVOTPOINTS', renderAs: 'Line', dataField: 'Resistance3', color: '#f44336', width: 1.5, dash:[1, 8]}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                var getInterval = function (interval: FusionRecord, availableIntervals: FusionRecord[]) {
                    var pivotInterval = {};
                    if (interval.symbol === "1m" || interval.symbol === "5m" || interval.symbol === "15m") {
                        pivotInterval = {
                            desc: "1D",
                            id: 5,
                            milis: 86400000,
                            symbol: "1D"
                        };
                    } else if (interval.symbol === "1D" || interval.symbol === "1W" || interval.symbol === "1M") {
                        pivotInterval = {
                            desc: "1M",
                            id: 7,
                            milis: 2592000000,
                            symbol: "1M",
                        };
                    } else {
                        pivotInterval = {
                            desc: "1W",
                            id: 6,
                            milis: 604800000,
                            symbol: "1W",
                        };
                    }
                    return FUSION.lib.getBestMatchingInterval(pivotInterval, availableIntervals);
                };

                return new Promise(function (this: any, resolve: any, reject: any) {
                    var instrument = this.CLOSE.getInstrument();
                    var interval = this.CLOSE.getInterval();

                    if (this.data && instrument === this.instrument && interval === this.interval) {
                        resolve();
                        return;
                    }

                    this.instrument = instrument;
                    this.interval = interval;

                    FUSION.lib.loadInstrumentCandles(
                        instrument,
                        getInterval(interval, instrument.availableIntervals), 
                        function(this: any, data: FusionRecord) {
                            this.data = data.candles;
                            resolve();
                        }.bind(this),
                        reject
                    );
                }.bind(this));                 
            }

            this.onModify = async function () {
                await this.init();
            }

            this.getCandle = function (this: any, index: any) {
                var stamp = this.CLOSE.getStamp(index);

                for (var i = this.data.length - 1; i > 0; --i) {
                    if (this.data[i].stamp <= stamp) {
                        return this.data[i - 1];
                    }
                }

                return {};
            }

            this.calculate = function (this: any, index: any) {
                if (!this.data || this.data.length === 0) return;

                var candle = this.getCandle(index);
                var high = candle.h;
                var low = candle.l;
                var close = candle.c;

                if (!high || !low || !close) {
                    return;
                }

                var pivotPoint = (high + low + close) / 3;
                var candleHeight = high - low;

                this.PivotPoint.setValue(index, pivotPoint);
                this.Support1.setValue(index, 2 * pivotPoint - high);
                this.Support2.setValue(index, pivotPoint - candleHeight);
                this.Support3.setValue(index, low - 2 * (high - pivotPoint));
                this.Resistance1.setValue(index, 2 * pivotPoint - low);
                this.Resistance2.setValue(index, pivotPoint + candleHeight);
                this.Resistance3.setValue(index, high + 2 * (pivotPoint - low));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['PIVOTPOINTSHL'] = {
    title: 'pivotPointHLTitle',
    description: 'pivotPointHLDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 1}, value: 5},
    },

    outputs: {
        'PIVOTPOINTSHL': {
            type: 'series', series: {
                seriesId: null,
                title: 'pivotPointHLTitle',
                labels: ['signal'],
                fields: ['PivotPointsHL'],
                data: null
            }
        }
    },

    plotters: [
        {type:'StrategyObject', dataLink: 'PIVOTPOINTSHL', renderAs: '', dataField: 'PivotPointsHL', color: '#ff0000', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {}
            this.calculate = function (this: any, index: any) {
                this.PivotPointsHL.setValue(index, FUSION.DO_NOTHING);

                if (FUSION.lib.isHighBar(this.HIGH, index, this.PERIODS)) {
                    this.PivotPointsHL.setValue(index, FUSION.SELL);
                } else if (FUSION.lib.isLowBar(this.LOW, index, this.PERIODS)) {
                    this.PivotPointsHL.setValue(index, FUSION.BUY);
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['WILLIAMSPERCENTRANGE'] = {

    title: 'williamsPercentRangeTitle',
    description: 'williamsPercentRangeDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
        'HI_BASELINE': {type: 'integer', name: 'hiBaseline', properties: {def: -20, max: 999, min: -999}, value: -20},
        'LO_BASELINE': {type: 'integer', name: 'loBaseline', properties: {def: -80, max: 999, min: -999}, value: -80},
    },

    outputs: {

        'WILLIAMSPERCENTRANGE': {
            type: 'series', series: {
                seriesId: null,
                title: 'williamsPercentRangeTitle',
                labels: ['williamsPercentRangeTitle', 'hiBaseline', 'loBaseline'],
                fields: ['WPR', 'BaseHI', 'BaseLO'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'WILLIAMSPERCENTRANGE', renderAs: 'Line', dataField: 'WPR', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'WILLIAMSPERCENTRANGE', renderAs: 'Line', dataField: 'BaseHI', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'WILLIAMSPERCENTRANGE', renderAs: 'Line', dataField: 'BaseLO', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs= outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                this.BaseHI.setValue(index, this.HI_BASELINE);
                this.BaseLO.setValue(index, this.LO_BASELINE);

                var close = this.CLOSE.getValue(index);
                var high = FUSION.lib.getMax(this.HIGH, index, this.PERIOD);
                var low = FUSION.lib.getMin(this.LOW, index, this.PERIOD);
                if (close === null || high === null || low === null) return;
                
                var wpr = (high - close) / (high - low) * (-100);
                this.WPR.setValue(index, wpr);
            }
        };
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['FORCEINDEX'] = {
    title: 'forceIndexTitle',
    description: 'forceIndexDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
    },
    outputs: {
        'FI': {
            type: 'series', series: {
                seriesId: null,
                title: 'forceIndexTitle',
                labels: ['value'],
                fields: ['ForceIndex'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'FI', renderAs: 'Line', dataField: 'ForceIndex', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);
                var volume = this.VOLUME.getValue(index);

                if (close === null || lastClose === null || volume === null) {
                    return;
                }

                var forceIndex = volume * (close - lastClose);
                this.ForceIndex.setValue(index, forceIndex);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['KELTNERCHANNEL'] = {
    title: 'keltnerChannelIndicatorTitle',
    description: 'keltnerChannelIndicatorDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 20},
        'ATRPERIODS': {type: 'integer', name: 'ATRPeriods', properties: {max: 100, min: 0}, value: 10},
    },
    outputs: {
        'KELTNERCHANNEL': {
            type: 'series', series: {
                seriesId: null,
                title: 'keltnerChannelIndicatorTitle',
                labels: ['upper', 'lower', 'middle'],
                fields: ['Upper', 'Lower', 'Middle'],
                data: null
            }
        }
    },
    plotters: [
        {type:'SeriesObject', dataLink: 'KELTNERCHANNEL', renderAs: 'Band', upperField: 'Upper', lowerField: 'Lower', color: '#5b6f8b', width: 1, dash: [0,0]},
        {type:'SeriesObject', dataLink: 'KELTNERCHANNEL', renderAs: 'Line', dataField: 'Middle', color: '#425166', width: 1, dash: [0,0], priceTag: false, priceLine: false}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['TRUERANGE', 'ATR', 'EMA']);
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
                this.ATR = this.context.getRawSeriesWrapper(this.helper, 'ATR');
                this.EMA = this.context.getRawSeriesWrapper(this.helper, 'EMA');
            }            

            this.calculate = function (this: any, index: any) {
                this.TRUERANGE.setValue(index, FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index));

                var ema = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA);
                var atr = FUSION.lib.getMMA(this.TRUERANGE, index, this.ATRPERIODS, this.ATR)
                this.ATR.setValue(index, atr);
                this.EMA.setValue(index, ema);

                if (index < this.PERIODS || index < this.ATRPERIODS) return;

                this.Upper.setValue(index, ema + 2 * atr);
                this.Lower.setValue(index, ema - 2 * atr);
                this.Middle.setValue(index, ema);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DONCHIANCHANNEL'] = {

    title: 'donchianChannelTitle',
    description: 'donchianChannelDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 20},
    },

    outputs: {
        'DONCHIANCHANNEL': {
            type: 'series', series: {
                seriesId: null,
                title: 'donchianChannelTitle',
                labels: ['upper', 'lower', 'middle'],
                fields: ['Upper', 'Lower', 'Middle'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'DONCHIANCHANNEL', renderAs: 'Band', upperField: 'Upper', lowerField: 'Lower', color: '#3f51b5', width: 1, dash: [0,0]},
        {type:'SeriesObject', dataLink: 'DONCHIANCHANNEL', renderAs: 'Line', dataField: 'Middle', color: '#e91e63', width: 1.5, dash: [0,0], priceTag: false, priceLine: false}
    ],
    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var high = FUSION.lib.getMax(this.HIGH, index, this.PERIODS);
                var low = FUSION.lib.getMin(this.LOW, index, this.PERIODS);
                if (high === null || low === null || index < this.PERIODS) return;

                this.Upper.setValue(index, high);
                this.Lower.setValue(index, low);
                this.Middle.setValue(index, (high + low) / 2);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['MASSINDEX'] = {
    title: 'massIndexTitle',
    description: 'massIndexDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 1}, value: 24},
        'EMAPERIODS': {type: 'integer', name: 'EMAPeriods', properties: {max: 100, min: 1}, value: 9},
    },

    outputs: {
        'MASSINDEX': {
            type: 'series', series: {
                seriesId: null,
                title: 'massIndexTitle',
                labels: ['value'],
                fields: ['MassIndex'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'MASSINDEX', renderAs: 'Line', dataField: 'MassIndex', color: '#f44336', width: 1, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['HL', 'EMAHL', 'EMAEMAHL', 'MISUMMANDS', 'MI']);
                this.HL = this.context.getRawSeriesWrapper(this.helper, 'HL');
                this.EMAHL = this.context.getRawSeriesWrapper(this.helper, 'EMAHL');
                this.EMAEMAHL = this.context.getRawSeriesWrapper(this.helper, 'EMAEMAHL');
                this.MISUMMANDS = this.context.getRawSeriesWrapper(this.helper, 'MISUMMANDS');
                this.MI = this.context.getRawSeriesWrapper(this.helper, 'MI');
            }

            this.calculate = function (this: any, index: any) {
                var high = this.HIGH.getValue(index);
                var low = this.LOW.getValue(index);
                if (high === null || low === null) return;

                this.HL.setValue(index, high - low);

                var emaHL = FUSION.lib.getEMA(this.HL, index, this.EMAPERIODS, this.EMAHL);
                if (emaHL === null) return;
                this.EMAHL.setValue(index, emaHL);

                var emaEmaHL = FUSION.lib.getEMA(this.EMAHL, index, this.EMAPERIODS, this.EMAEMAHL);
                if(emaEmaHL === null || emaEmaHL === 0) return;
                this.EMAEMAHL.setValue(index, emaEmaHL);

                this.MISUMMANDS.setValue(index, emaHL / emaEmaHL);

                var previousMassIndex = this.MI.getValue(index - 1) || 0;
                var mi = previousMassIndex + this.MISUMMANDS.getValue(index) - this.MISUMMANDS.getValue(index - this.PERIODS);
                this.MI.setValue(index, mi);

                if (index < this.PERIODS + this.EMAPERIODS * 2) return;

                this.MassIndex.setValue(index, mi);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['TRIPLEEMA'] = {
    title: 'tripleExponentialAverageTitle',
    description: 'tripleExponentialAverageDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 1}, value: 24},
    },

    outputs: {
        'TRIPLEEMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'tripleExponentialAverageTitle',
                labels: ['value'],
                fields: ['TripleEma'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'TRIPLEEMA', renderAs: 'Line', dataField: 'TripleEma', color: '#f44336', width: 1, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['EMAC', 'EMAEMAC', 'EMAEMAEMAC']);
                this.EMAC = this.context.getRawSeriesWrapper(this.helper, 'EMAC');
                this.EMAEMAC = this.context.getRawSeriesWrapper(this.helper, 'EMAEMAC');
                this.EMAEMAEMAC = this.context.getRawSeriesWrapper(this.helper, 'EMAEMAEMAC');
            }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                if (close === null) return

                var emaC = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMAC);
                if (emaC === null) return;
                this.EMAC.setValue(index, emaC);

                var emaEmaC = FUSION.lib.getEMA(this.EMAC, index, this.PERIODS, this.EMAEMAC);
                if(emaEmaC === null) return;
                this.EMAEMAC.setValue(index, emaEmaC);

                var emaEmaEmaC = FUSION.lib.getEMA(this.EMAEMAC, index, this.PERIODS, this.EMAEMAEMAC);
                if(emaEmaEmaC === null) return;
                this.EMAEMAEMAC.setValue(index, emaEmaEmaC);

                var emaEmaEmaC1 = this.EMAEMAEMAC.getValue(index - 1);
                if (emaEmaEmaC1 === null) return;

                this.TripleEma.setValue(index, (emaEmaEmaC - emaEmaEmaC1) / emaEmaEmaC1);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['VOLUMEOSCILLATOR'] = {
    title: 'volumeOscillatorTitle',
    description: 'volumeOscillatorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'SHORTPERIOD': {type: 'integer', name: 'shortPeriod', properties: {def: 7, max: 100, min: 1}, value: 7},
        'LONGPERIOD': {type: 'integer', name: 'longPeriod', properties: {def: 14, max: 100, min: 1}, value: 14},
    },
    outputs: {
        'VOLUMEOSCILLATOR': {
            type: 'series', series: {
                seriesId: null,
                title: 'volumeOscillatorTitle',
                labels: ['value'],
                fields: ['VolumeOscillator'],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'VOLUMEOSCILLATOR', renderAs: 'Line', dataField: 'VolumeOscillator', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var shortMA = FUSION.lib.getMA(this.VOLUME, index, this.SHORTPERIOD);
                var longMA = FUSION.lib.getMA(this.VOLUME, index, this.LONGPERIOD);

                if (longMA === null || shortMA === null || shortMA === 0) return;

                this.VolumeOscillator.setValue(index, (shortMA - longMA) / shortMA * 100);
            };
        }
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['VOLUMEROC'] = {
    title: 'volumeRateOfChangeTitle',
    description: 'volumeRateOfChangeDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 12},
        'PERCMODE': {type: 'boolean', name: 'percentageMode', properties: {}, value: true},
    },

    outputs: {

        'VOLUMEROC': {
            type: 'series', series: {
                seriesId: null,
                title: 'volumeRateOfChangeTitle',
                labels: ['value'],
                fields: ['ROC'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'VOLUMEROC', renderAs: 'Line', dataField: 'ROC', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id			= '';
            this.context	= context;
            this.inputs 	= inputs;
            this.outputs	= outputs;

            this.init = function (this: any) {	}

            this.calculate = function (this: any, index: any) {
                if (this.VOLUME.getValue(index) === null) return;

                var dis = FUSION.lib.displace(this.VOLUME, index, this.PERIODS);
                if (dis === null) return;

                if(!this.PERCMODE) {
                    this.ROC.setValue(index, this.VOLUME.getValue(index) - dis);
                } else {
                    this.ROC.setValue(index, 100 * (this.VOLUME.getValue(index) - dis) / dis);
                }
            }

        };
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['ALMA'] = {
    title: 'almaTitle',
    description: 'almaDescription',
    type: 'indicators',
    newPane: false,

    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 9},
        'OFFSET': {type: 'double', name: 'offset', properties: {max: 200, min: 0}, value: 0.85},
        'SIGMA': {type: 'integer', name: 'sigma', properties: {max: 200, min: 0}, value: 6}
    },

    outputs: {
        'ALMA': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'almaTitle',
                labels: ['value'],
                fields: ['ALMA'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'ALMA',
            renderAs: 'Line',
            dataField: 'ALMA',
            color: '#00bcd4',
            width: 1.5,
            dash:[],
            priceTag: false,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null || index < this.PERIODS - 1) return;

                let eq = 0;
                let wtd = 0;
                let wtdSum = 0;
                let wtdCum = 0;
                
                for (let i = this.PERIODS - 1; i > 0; --i) {
                    eq = -1 * (Math.pow(i - this.OFFSET, 2) / (Math.pow(this.SIGMA ,2)));
                    wtd = Math.exp(eq);
                    wtdSum += wtd * this.CLOSE.getValue(index - i + 1);
                    wtdCum += wtd;
                }

                this.ALMA.setValue(index, wtdSum / wtdCum);
            }

        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['AROON'] = {
    title: 'aroonTitle',
    description: 'aroonDescription',
    type: 'indicators',
    newPane: true,

    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 25},
    },

    outputs: {
        'AROONUP': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'aroonUp',
                labels: ['value'],
                fields: ['AROONUP'],
                data: null
            }
        },
        'AROONDOWN': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'aroonDown',
                labels: ['value'],
                fields: ['AROONDOWN'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'AROONUP',
            renderAs: 'Line',
            dataField: 'AROONUP',
            color: '#ff9800',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        },
        {
            type:'SeriesObject',
            dataLink: 'AROONDOWN',
            renderAs: 'Line',
            dataField: 'AROONDOWN',
            color: '#03a9f4',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        },
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                if (this.HIGH.getValue(index) === null || index < this.PERIODS - 1) return;

                let aroonUp = 100 * ((this.PERIODS - index + FUSION.lib.getMaxIndex(this.HIGH, index, this.PERIODS)) / this.PERIODS);
                this.AROONUP.setValue(index, aroonUp);

                let aroonDown = 100 * ((this.PERIODS - index + FUSION.lib.getMinIndex(this.LOW, index, this.PERIODS)) / this.PERIODS);
                this.AROONDOWN.setValue(index, aroonDown);
            }

        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['AWESOMEOSCILLATOR'] = {
    title: 'awesomeOscillatorTitle',
    description: 'awesomeOscillatorDescription',
    type: 'indicators',
    newPane: true,

    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null}
    },

    outputs: {
        'AWESOMEOSCILLATOR': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'awesomeOscillatorTitle',
                labels: ['value'],
                fields: ['AWESOMEOSCILLATOR'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'AWESOMEOSCILLATOR',
            renderAs: 'Histogram',
            dataField: 'AWESOMEOSCILLATOR',
            color: '#ff9800',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.minPeriod = 5;
                this.maxPeriod = 34;
                this.helper = this.context.createSeries(['MEDIAN']);
                this.MEDIAN = this.context.getRawSeriesWrapper(this.helper, 'MEDIAN');
            }

            this.calculate = function (this: any, index: any) {
                if (this.HIGH.getValue(index) === null || this.LOW.getValue(index) == null) return;

                this.MEDIAN.setValue(index, (this.HIGH.getValue(index) + this.LOW.getValue(index)) / 2);

                if (index < this.maxPeriod - 1) return;
                

                var minSMA = FUSION.lib.getMA(this.MEDIAN, index, this.minPeriod);
                var maxSMA = FUSION.lib.getMA(this.MEDIAN, index, this.maxPeriod);

                this.AWESOMEOSCILLATOR.setValue(index, minSMA - maxSMA);
            }

        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['BALANCEOFPOWER'] = {
    title: 'balanceOfPowerTitle',
    description: 'balanceOfPowerDescription',
    type: 'indicators',
    newPane: true,

    inputs: {
        'OPEN': {type: 'series', name: 'priceOpen', properties: {def:'o'}, value: null},
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
    },

    outputs: {
        'BALANCEOFPOWER': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'balanceOfPowerTitle',
                labels: ['value'],
                fields: ['BALANCEOFPOWER'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'BALANCEOFPOWER',
            renderAs: 'Line',
            dataField: 'BALANCEOFPOWER',
            color: '#ff9800',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                if (this.OPEN.getValue(index) === null || this.HIGH.getValue(index) === null || this.LOW.getValue(index) == null || this.CLOSE.getValue(index) === null) return;

                this.BALANCEOFPOWER.setValue(index, (this.CLOSE.getValue(index) - this.OPEN.getValue(index)) / (this.HIGH.getValue(index) - this.LOW.getValue(index)));
            }

        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['BBANDSPERCENT'] = {
    title: 'bbandsPercentTitle',
    description: 'bbandsPercentDescription',
    type: 'indicators',
    newPane: true,

    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 20},
        'DEVIATIONS': {type: 'double', name: 'deviations', properties: {max: 10, min: 0, step: 0.1}, value: 2},
        'UPPERBAND': {type: 'double', name: 'upperBand', properties: {max: 10, min: -10, step: 0.1}, value: 1},
        'LOWERBAND': {type: 'double', name: 'lowerBand', properties: {max: 10, min: -10, step: 0.1}, value: 0},
    },


    outputs: {
        'BBANDSPERCENT': {
            type: 'series', series: {
                seriesId: null,
                title: 'bbandsPercentTitle',
                labels: ['upper', 'lower', 'value'],
                fields: ['BBUpper', 'BBLower', 'BBMiddle'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'BBANDSPERCENT', renderAs: 'Band', upperField: 'BBUpper', lowerField: 'BBLower', color: '#5b6f8b', width: 1, dash: [0,0]},
        {type:'SeriesObject', dataLink: 'BBANDSPERCENT', renderAs: 'Line', dataField: 'BBMiddle', color: '#03a9f4', width: 1, dash: [0,0], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null) return;

                var sma = FUSION.lib.getMA (this.CLOSE, index, this.PERIODS);
                var std = FUSION.lib.getStdDev (this.CLOSE, index, this.PERIODS);
                std = std * this.DEVIATIONS;
                if (sma === null || std === null) return;

                const upperBand = sma+std;
                const lowerBand = sma-std;

                this.BBUpper.setValue(index, this.UPPERBAND);
                this.BBLower.setValue(index, this.LOWERBAND);
                this.BBMiddle.setValue(index, (this.CLOSE.getValue(index) - lowerBand) / (upperBand - lowerBand));
            }

        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['BBANDSWIDTH'] = {
    title: 'bbandsWidthTitle',
    description: 'bbandsWidthDescription',
    type: 'indicators',
    newPane: true,

    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 100, min: 0}, value: 20},
        'DEVIATIONS': {type: 'double', name: 'deviations', properties: {max: 10, min: 0, step: 0.1}, value: 2},
    },


    outputs: {
        'BBANDSWIDTH': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'bbandsWidthTitle',
                labels: ['value'],
                fields: ['BBANDSWIDTH'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'BBANDSWIDTH',
            renderAs: 'Line',
            dataField: 'BBANDSWIDTH',
            color: '#ff9800',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                if (this.CLOSE.getValue(index) === null) return;

                var sma = FUSION.lib.getMA (this.CLOSE, index, this.PERIODS);
                var std = FUSION.lib.getStdDev (this.CLOSE, index, this.PERIODS);
                std = std * this.DEVIATIONS;
                if (sma === null || std === null) return;

                const upperBand = sma+std;
                const lowerBand = sma-std;

                this.BBANDSWIDTH.setValue(index, (upperBand - lowerBand) / sma);
            }

        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CHAIKINOSCILLATOR'] = {
    title: 'chaikinOscillatorTitle',
    description: 'chaikinOscillatorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'PERIOD1': {type: 'integer', name: 'firstPeriod', properties: {max: 200, min: 0}, value: 3},
        'PERIOD2': {type: 'integer', name: 'secondPeriod', properties: {max: 200, min: 0}, value: 10},
    },
    outputs: {
        'CHAIKINOSCILLATOR': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'chaikinOscillatorTitle',
                labels: ['value'],
                fields: ['CHAIKINOSCILLATOR'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'CHAIKINOSCILLATOR',
            renderAs: 'Line',
            dataField: 'CHAIKINOSCILLATOR',
            color: '#ff9800',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'ADL',
                    'EMA1',
                    'EMA2'
                ]);
                this.ADL = this.context.getRawSeriesWrapper(this.helper, 'ADL');
                this.EMA1 = this.context.getRawSeriesWrapper(this.helper, 'EMA1');
                this.EMA2 = this.context.getRawSeriesWrapper(this.helper, 'EMA2');
            }

            this.calculate = function (this: any, index: any) {
                var high = this.HIGH.getValue(index);
                var low = this.LOW.getValue(index);
                var close = this.CLOSE.getValue(index);
                var volume = this.VOLUME.getValue(index);
                var lastADL = this.ADL.getValue(index - 1);

                if (high === null || low === null || close === null || volume === null || (high - low) === 0) {
                    this.ADL.setValue(index, lastADL);
                    return;
                }

                var currentADL = (close - low - high + close) / (high - low) * volume;
                this.ADL.setValue(index, lastADL + currentADL);

                this.EMA1.setValue(index, FUSION.lib.getEMA(this.ADL, index, this.PERIOD1, this.EMA1));
                this.EMA2.setValue(index,FUSION.lib.getEMA(this.ADL, index, this.PERIOD2, this.EMA2));

                this.CHAIKINOSCILLATOR.setValue(index, this.EMA1.getValue(index) - this.EMA2.getValue(index));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CHANDEKROLLSTOP'] = {

    title: 'chandeKrollStopTitle',
    description: 'chandeKrollStopDescription',
    type: 'indicators',
    newPane: false,
    inputs: {

        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'P': {type: 'integer', name: 'chandeKrollStopP', properties: {max: 100, min: 0}, value: 10},
        'Q': {type: 'integer', name: 'chandeKrollStopQ', properties: {max: 100, min: 0}, value: 9},
        'X': {type: 'integer', name: 'chandeKrollStopX', properties: {max: 100, min: 0}, value: 1},
    },

    outputs: {
        'CHANDEKROLLSTOP': {
            type: 'series', series: {
                seriesId: null,
                title: 'chandeKrollStopTitle',
                labels: ['chandeKrollStopUp', 'chandeKrollStopDown'],
                fields: ['CHANDEKROLLSTOP_UP','CHANDEKROLLSTOP_DOWN',],
                data: null
            }
        }

    },

    plotters: [
        {type:'SeriesObject', dataLink: 'CHANDEKROLLSTOP', renderAs: 'Line', dataField: 'CHANDEKROLLSTOP_UP', color: '#f44336', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'CHANDEKROLLSTOP', renderAs: 'Line', dataField: 'CHANDEKROLLSTOP_DOWN', color: '#4caf50', width: 1.5, dash:[], priceTag: false, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['TRUERANGE, ATR, FIRSTHIGHSTOP, FIRSTLOWSTOP']);
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
                this.ATR = this.context.getRawSeriesWrapper(this.helper, 'ATR');
                this.FIRSTHIGHSTOP = this.context.getRawSeriesWrapper(this.helper, 'FIRSTHIGHSTOP');
                this.FIRSTLOWSTOP = this.context.getRawSeriesWrapper(this.helper, 'FIRSTLOWSTOP');
            }

            this.calculate = function (this: any, index: any) {
                this.TRUERANGE.setValue(index, FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index));

                var atr = FUSION.lib.getMMA(this.TRUERANGE, index, this.P, this.ATR);
                this.ATR.setValue(index, atr);
                var highest = FUSION.lib.getMax(this.HIGH, index, this.P);
                var lowest = FUSION.lib.getMin(this.LOW, index, this.P);

                if (atr == null || highest == null || lowest == null)
                    return;

                var firstHighStop = highest - this.X * atr;
                var firstLowStop = lowest + this.X * atr;

                this.FIRSTHIGHSTOP.setValue(index, firstHighStop);
                this.FIRSTLOWSTOP.setValue(index, firstLowStop);
                
                var stopShort = FUSION.lib.getMax(this.FIRSTHIGHSTOP, index, this.Q);
                var stopLong = FUSION.lib.getMin(this.FIRSTLOWSTOP, index, this.Q);

                if (stopShort == null || stopLong == null)
                    return;

                this.CHANDEKROLLSTOP_UP.setValue(index, stopShort);
                this.CHANDEKROLLSTOP_DOWN.setValue(index, stopLong);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CHANDEMOMENTUMOSCILLATOR'] = {
    title: 'chandeMomentumOscillatorTitle',
    description: 'chandeMomentumOscillatorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'period', properties: {max: 200, min: 0}, value: 20},
    },
    outputs: {
        'CMO': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'chandeMomentumOscillatorTitle',
                labels: ['value'],
                fields: ['CMO'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'CMO',
            renderAs: 'Line',
            dataField: 'CMO',
            color: '#009688',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false

        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'SUMUP',
                    'UPVALUE',
                    'SUMDOWN',
                    'DOWNVALUE'
                ]);
                this.SUMUP = this.context.getRawSeriesWrapper(this.helper, 'SUMUP');
                this.UPVALUE = this.context.getRawSeriesWrapper(this.helper, 'UPVALUE');
                this.SUMDOWN = this.context.getRawSeriesWrapper(this.helper, 'SUMDOWN');
                this.DOWNVALUE = this.context.getRawSeriesWrapper(this.helper, 'DOWNVALUE');
            }

            this.calculate = function (this: any, index: any) {
                var lastClose = this.CLOSE.getValue(index - 1);
                var close = this.CLOSE.getValue(index);
                var upValue = 0;
                var downValue = 0;

                if (close === null || lastClose == null) {
                    return;
                }

                if (close > lastClose) {
                    upValue = close - lastClose;
                } else {
                    downValue = lastClose - close;
                }

                this.UPVALUE.setValue(index, upValue);
                this.DOWNVALUE.setValue(index, downValue);

                var sumUp = this.SUMUP.getValue(index - 1) + upValue - this.UPVALUE.getValue(index - this.PERIOD);
                var sumDown = this.SUMDOWN.getValue(index - 1) + downValue - this.DOWNVALUE.getValue(index - this.PERIOD);

                this.SUMUP.setValue(index, sumUp);
                this.SUMDOWN.setValue(index, sumDown);

                if (index < this.PERIOD)
                    return;

                var cmo = 100 * (sumUp - sumDown) / (sumUp + sumDown);

                this.CMO.setValue(index, cmo);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CHOPPINESSINDEX'] = {

    title: 'choppinessIndexTitle',
    description: 'choppinessIndexDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 14},
        'UPPERBANDVALUE': {type: 'double', name: 'upperBand', properties: {def: 61.8, max: 100, min: 0}, value: 61.8},
        'LOWERBANDVALUE': {type: 'double', name: 'lowerBand', properties: {def: 38.2, max: 100, min: 0}, value: 38.2},
    },

    outputs: {
        'CHOPPINESSINDEX': {
            type: 'series', series: {
                seriesId: null,
                title: 'choppinessIndexTitle',
                labels: ['choppinessIndexTitle', 'upperBand', 'lowerBand'],
                fields: ['CHOPPINESSINDEX','UPPERBAND','LOWERBAND'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'CHOPPINESSINDEX', renderAs: 'Line', dataField: 'CHOPPINESSINDEX', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'CHOPPINESSINDEX', renderAs: 'Line', dataField: 'UPPERBAND', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'CHOPPINESSINDEX', renderAs: 'Line', dataField: 'LOWERBAND', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['TRUERANGE, ATR', 'ATRSUM']);
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
                this.ATR = this.context.getRawSeriesWrapper(this.helper, 'ATR');
                this.ATRSUM = this.context.getRawSeriesWrapper(this.helper, 'ATRSUM');
            }

            this.calculate = function (this: any, index: any) {
                this.TRUERANGE.setValue(index, FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index));
                this.ATR.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, 1, this.ATR));
                this.UPPERBAND.setValue(index, this.UPPERBANDVALUE);
                this.LOWERBAND.setValue(index, this.LOWERBANDVALUE);

                var highest = FUSION.lib.getMax(this.HIGH, index, this.PERIODS);
                var lowest = FUSION.lib.getMin(this.LOW, index, this.PERIODS);
                var atrSum = FUSION.lib.getSum(this.ATR, index, this.PERIODS, this.ATRSUM);
                
                this.ATRSUM.setValue(index, atrSum);

                if (index < this.PERIODS) return;
                var choppinessIndex = 100 *  Math.log10(atrSum / (highest - lowest)) / Math.log10(this.PERIODS);

                this.CHOPPINESSINDEX.setValue(index, choppinessIndex);
            }
        };
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CONNORSRSI'] = {
    title: 'connorsRsiTitle',
    description: 'connorsRsiDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'RSIPERIODS': {type: 'integer', name: 'rsiPeriods', properties: {max: 200, min: 0}, value: 3},
        'UPDOWNPERIODS': {type: 'integer', name: 'upDownPeriods', properties: {max: 200, min: 0}, value: 2},
        'ROCPERIODS': {type: 'integer', name: 'rocPeriods', properties: {max: 200, min: 0}, value: 100},
        'UPPERBANDVALUE': {type: 'double', name: 'upperBand', properties: {def: 70, max: 100, min: 0}, value: 70},
        'LOWERBANDVALUE': {type: 'double', name: 'lowerBand', properties: {def: 30, max: 100, min: 0}, value: 30},
    },

    outputs: {
        'CONNORSRSI': {
            type: 'series', series: {
                seriesId: null,
                title: 'connorsRsiTitle',
                labels: ['connorsRsiTitle', 'upperBand', 'lowerBand'],
                fields: ['CONNORSRSI','UPPERBAND','LOWERBAND'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'CONNORSRSI', renderAs: 'Line', dataField: 'CONNORSRSI', color: '#00bcd4', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'CONNORSRSI', renderAs: 'Line', dataField: 'UPPERBAND', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'CONNORSRSI', renderAs: 'Line', dataField: 'LOWERBAND', color: '#607d8b', width: 1, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs= outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['AU', 'AD', 'MAU', 'MAD', 'RSI, UPDOWNLENGTH', 'UPDOWNLENGTHAU', 'UPDOWNLENGTHAD', 'UPDOWNLENGTHMAU', 'UPDOWNLENGTHMAD', 'UPDOWNLENGTHRSI', 'ROC']);

                // RSI
                this.RSI = this.context.getRawSeriesWrapper(this.helper, 'RSI');
                this.AU = this.context.getRawSeriesWrapper(this.helper, 'AU');
                this.AD = this.context.getRawSeriesWrapper(this.helper, 'AD');
                this.MAU = this.context.getRawSeriesWrapper(this.helper, 'MAU');
                this.MAD = this.context.getRawSeriesWrapper(this.helper, 'MAD');

                this.UPDOWNLENGTH = this.context.getRawSeriesWrapper(this.helper, 'UPDOWNLENGTH');
                this.UPDOWNLENGTHRSI = this.context.getRawSeriesWrapper(this.helper, 'UPDOWNLENGTHRSI');
                this.UPDOWNLENGTHAU = this.context.getRawSeriesWrapper(this.helper, 'UPDOWNLENGTHAU');
                this.UPDOWNLENGTHAD = this.context.getRawSeriesWrapper(this.helper, 'UPDOWNLENGTHAD');
                this.UPDOWNLENGTHMAU = this.context.getRawSeriesWrapper(this.helper, 'UPDOWNLENGTHMAU');
                this.UPDOWNLENGTHMAD = this.context.getRawSeriesWrapper(this.helper, 'UPDOWNLENGTHMAD');

                this.ROC = this.context.getRawSeriesWrapper(this.helper, 'ROC');
            }

            this.calculate = function (this: any, index: any) {
                this.UPPERBAND.setValue(index, this.UPPERBANDVALUE);
                this.LOWERBAND.setValue(index, this.LOWERBANDVALUE);

                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);

                // RSI
                FUSION.lib.calculateRSI(index, this.CLOSE, this.RSI, this.AU, this.AD, this.MAU, this.MAD, this.UPPERBANDVALUE, this.LOWERBANDVALUE, this.RSIPERIODS);

                // UPDOWN
                var lastUpDownLength = this.UPDOWNLENGTH.getValue(index - 1);

                if (close === null || lastClose === null) {
                    this.UPDOWNLENGTH.setValue(index, 0);
                } else if (close < lastClose) {
                    if (lastUpDownLength < 0)
                        this.UPDOWNLENGTH.setValue(index, lastUpDownLength - 1);
                    else
                        this.UPDOWNLENGTH.setValue(index, -1);
                } else if (close > lastClose) {
                    if (lastUpDownLength > 0)
                        this.UPDOWNLENGTH.setValue(index, lastUpDownLength + 1);
                    else
                        this.UPDOWNLENGTH.setValue(index, 1);
                } else {
                    this.UPDOWNLENGTH.setValue(index, 0);
                }

                FUSION.lib.calculateRSI(index, this.UPDOWNLENGTH, this.UPDOWNLENGTHRSI, this.UPDOWNLENGTHAU, this.UPDOWNLENGTHAD, this.UPDOWNLENGTHMAU, this.UPDOWNLENGTHMAD, this.UPPERBANDVALUE, this.LOWERBANDVALUE, this.UPDOWNPERIODS);
                
                // ROC (DIFFERENT THAN ROC INDICATOR)
                if (index < this.ROCPERIODS) return;
                
                var pricesBelowCurrentClose = 0;
                var priceChange = 100 * (close - lastClose) / lastClose;

                for (var i = index - 1; i > index - this.ROCPERIODS; --i) {
                    var pc = 100 * (this.CLOSE.getValue(i) - this.CLOSE.getValue(i - 1)) / this.CLOSE.getValue(i - 1);
                    if (pc < priceChange) ++pricesBelowCurrentClose; 
                }

                var roc = 100 * pricesBelowCurrentClose / this.ROCPERIODS;

                var crsi = (this.RSI.getValue(index) + this.UPDOWNLENGTHRSI.getValue(index) + roc) / 3;
                this.CONNORSRSI.setValue(index, crsi);                
            }
        };
        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['COPPOCKCURVE'] = {
    title: 'coppockCurveTitle',
    description: 'coppockCurveDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'WMAPERIOD': {type: 'integer', name: 'wmaPeriod', properties: {max: 200, min: 1}, value: 10},
        'LONGROCPERIOD': {type: 'integer', name: 'longRocPeriod', properties: {max: 200, min: 1}, value: 14},
        'SHORTROCPERIOD': {type: 'integer', name: 'shortRocPeriod', properties: {max: 200, min: 1}, value: 11},
    },
    outputs: {
        'COPPOCKCURVE': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'coppockCurveTitle',
                labels: ['value'],
                fields: ['COPPOCKCURVE'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'COPPOCKCURVE',
            renderAs: 'Line',
            dataField: 'COPPOCKCURVE',
            color: '#03a9f4',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'ROCSUM',
                ]);
                this.ROCSUM = this.context.getRawSeriesWrapper(this.helper, 'ROCSUM');
            }

            this.calculate = function (this: any, index: any) {
                var shortROC = FUSION.lib.getPercentageROC(index, this.CLOSE, this.SHORTROCPERIOD);
                var longROC = FUSION.lib.getPercentageROC(index, this.CLOSE, this.LONGROCPERIOD);

                this.ROCSUM.setValue(index, shortROC + longROC);

                var coppockCurve = FUSION.lib.getWMA(this.ROCSUM, index, this.WMAPERIOD);
                this.COPPOCKCURVE.setValue(index, coppockCurve);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['CORRELATIONCOEFFICIENT'] = {
    title: 'correlationCoefficientTitle',
    description: 'correlationCoefficientDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'CLOSE2': {type: 'series', name: 'priceClose2', properties: {def:'c'}, value: null},
        'PERIOD': {type: 'integer', name: 'period', properties: {max: 200, min: 1}, value: 20}
    },
    outputs: {
        'CORRELATIONCOEFFICIENT': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'correlationCoefficientTitle',
                labels: ['value'],
                fields: ['CORRELATIONCOEFFICIENT'],
                data: null
            }
        }
    },

    plotters: [
        {
            type:'SeriesObject',
            dataLink: 'CORRELATIONCOEFFICIENT',
            renderAs: 'Line and Histogram',
            dataField: 'CORRELATIONCOEFFICIENT',
            color: '#e91e63',
            width: 1.5,
            dash:[],
            priceTag: true,
            priceLine: false
        }
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'SQUAREDCLOSE',
                    'SQUAREDCLOSE2',
                    'MULTIPLIEDCLOSES',
                    'CLOSESUM',
                    'CLOSE2SUM',
                    'SQUAREDCLOSESUM',
                    'SQUAREDCLOSE2SUM',
                    'MULTIPLIEDCLOSESSUM'
                ]);

                this.SQUAREDCLOSE = this.context.getRawSeriesWrapper(this.helper, 'SQUAREDCLOSE');
                this.SQUAREDCLOSE2 = this.context.getRawSeriesWrapper(this.helper, 'SQUAREDCLOSE2');
                this.MULTIPLIEDCLOSES = this.context.getRawSeriesWrapper(this.helper, 'MULTIPLIEDCLOSES');
                this.CLOSESUM = this.context.getRawSeriesWrapper(this.helper, 'CLOSESUM');
                this.CLOSE2SUM = this.context.getRawSeriesWrapper(this.helper, 'CLOSE2SUM');
                this.SQUAREDCLOSESUM = this.context.getRawSeriesWrapper(this.helper, 'SQUAREDCLOSESUM');
                this.SQUAREDCLOSE2SUM = this.context.getRawSeriesWrapper(this.helper, 'SQUAREDCLOSE2SUM');
                this.MULTIPLIEDCLOSESSUM = this.context.getRawSeriesWrapper(this.helper, 'MULTIPLIEDCLOSESSUM');
            }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var close2 = this.CLOSE2.getValue(index);

                this.SQUAREDCLOSE.setValue(index, close * close);
                this.SQUAREDCLOSE2.setValue(index, close2 * close2);
                this.MULTIPLIEDCLOSES.setValue(index, close * close2);

                this.CLOSESUM.setValue(index, FUSION.lib.getSum(this.CLOSE, index, this.PERIOD, this.CLOSESUM));
                this.CLOSE2SUM.setValue(index, FUSION.lib.getSum(this.CLOSE2, index, this.PERIOD, this.CLOSE2SUM));
                this.SQUAREDCLOSESUM.setValue(index, FUSION.lib.getSum(this.SQUAREDCLOSE, index, this.PERIOD, this.SQUAREDCLOSESUM));
                this.SQUAREDCLOSE2SUM.setValue(index, FUSION.lib.getSum(this.SQUAREDCLOSE2, index, this.PERIOD, this.SQUAREDCLOSE2SUM));
                this.MULTIPLIEDCLOSESSUM.setValue(index, FUSION.lib.getSum(this.MULTIPLIEDCLOSES, index, this.PERIOD, this.MULTIPLIEDCLOSESSUM));

                if (close == null || close2 == null || index < this.PERIOD) return;

                var closeAverage = this.CLOSESUM.getValue(index) / this.PERIOD;
                var close2Average = this.CLOSE2SUM.getValue(index) / this.PERIOD;
                var squaredCloseAverage = this.SQUAREDCLOSESUM.getValue(index) / this.PERIOD;
                var squaredClose2Average = this.SQUAREDCLOSE2SUM.getValue(index) / this.PERIOD;
                var multipliedClosesAverage = this.MULTIPLIEDCLOSESSUM.getValue(index) / this.PERIOD;

                var closeVariance = squaredCloseAverage - (closeAverage * closeAverage);
                var close2Variance = squaredClose2Average - (close2Average * close2Average);
                var covariance = multipliedClosesAverage - closeAverage * close2Average;
                var correlationCoefficient = covariance / Math.sqrt(closeVariance * close2Variance);

                this.CORRELATIONCOEFFICIENT.setValue(index, correlationCoefficient);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['DOUBLEEMA'] = {
    title: 'doubleEmaTitle',
    description: 'doubleEmaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 9},
    },

    outputs: {
        'DOUBLEEMA': {
            type: 'series', series: {
                seriesId: null,
                title: 'doubleEmaTitle',
                labels: ['value'],
                fields: ['DOUBLEEMA'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'DOUBLEEMA', renderAs: 'Line', dataField: 'DOUBLEEMA', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs	= inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'EMA',
                    'EMAEMA'
                ]);

                this.EMA = this.context.getRawSeriesWrapper(this.helper, 'EMA');
                this.EMAEMA = this.context.getRawSeriesWrapper(this.helper, 'EMAEMA');
            }

            this.calculate = function (this: any, index: any) {
                var ema = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA);
                this.EMA.setValue(index, ema);

                var emaema = FUSION.lib.getEMA(this.EMA, index, this.PERIODS, this.EMAEMA);
                this.EMAEMA.setValue(index, emaema);

                if (ema == null || emaema == null) return;

                var doubleEma = 2 * ema - emaema;

                this.DOUBLEEMA.setValue(index, doubleEma);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['EASEOFMOVEMENT'] = {
    title: 'easeOfMovementTitle',
    description: 'easeOfMovementDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 1}, value: 14},
        'DIVISOR': {type: 'integer', name: 'divisor', properties: {max: 99999999, min: 1}, value: 10000},
    },

    outputs: {
        'EASEOFMOVEMENT': {
            type: 'series', series: {
                seriesId: null,
                title: 'easeOfMovementTitle',
                labels: ['value'],
                fields: ['EASEOFMOVEMENT'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'EASEOFMOVEMENT', renderAs: 'Line', dataField: 'EASEOFMOVEMENT', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs	= inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'EOM',
                ]);

                this.EOM = this.context.getRawSeriesWrapper(this.helper, 'EOM');
            }

            this.calculate = function (this: any, index: any) {
                var high = this.HIGH.getValue(index);
                var low = this.LOW.getValue(index);
                var volume = this.VOLUME.getValue(index);

                var lastHigh = this.HIGH.getValue(index - 1);
                var lastLow = this.LOW.getValue(index - 1);

                if (high == low || this.DIVISOR == 0) {
                    this.EOM.setValue(index, this.EOM.getValue(index - 1));
                } else {
                    var distanceMoved = (high + low) / 2 - (lastHigh + lastLow) / 2;
                    var boxRatio = volume / this.DIVISOR / (high - low);
                    var eom = distanceMoved / boxRatio;
    
                    this.EOM.setValue(index, eom);
                }

                if (index < this.PERIODS) return;

                this.EASEOFMOVEMENT.setValue(index, FUSION.lib.getMA(this.EOM, index, this.PERIODS));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['ELDERSFORCEINDEX'] = {
    title: 'eldersForceIndexTitle',
    description: 'eldersForceIndexDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 1}, value: 13}
    },

    outputs: {
        'ELDERSFORCEINDEX': {
            type: 'series', series: {
                seriesId: null,
                title: 'eldersForceIndexTitle',
                labels: ['value'],
                fields: ['ELDERSFORCEINDEX'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ELDERSFORCEINDEX', renderAs: 'Line', dataField: 'ELDERSFORCEINDEX', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs	= inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'EFI',
                ]);

                this.EFI = this.context.getRawSeriesWrapper(this.helper, 'EFI');
            }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);
                var volume = this.VOLUME.getValue(index);

                this.EFI.setValue(index, (close - lastClose) * volume);

                if (index < this.PERIODS) return;

                this.ELDERSFORCEINDEX.setValue(index, FUSION.lib.getEMA(this.EFI, index, this.PERIODS, this.ELDERSFORCEINDEX));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['FISHERTRANSFORM'] = {
    title: 'fisherTransformTitle',
    description: 'fisherTransformDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 1}, value: 13}
    },

    outputs: {
        'FISHERTRANSFORM': {
            type: 'series', series: {
                seriesId: null,
                title: 'fisherTransformTitle',
                labels: ['value', 'trigger'],
                fields: ['FISHERTRANSFORM', 'FISHERTRANSFORMTRIGGER'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'FISHERTRANSFORM', renderAs: 'Line', dataField: 'FISHERTRANSFORM', color: '#03a9f4', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'FISHERTRANSFORM', renderAs: 'Line', dataField: 'FISHERTRANSFORMTRIGGER', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs	= inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'X',
                    'PRICE'
                ]);

                this.X = this.context.getRawSeriesWrapper(this.helper, 'X');
                this.PRICE = this.context.getRawSeriesWrapper(this.helper, 'PRICE');
            }

            this.calculate = function (this: any, index: any) {
                var price = (this.HIGH.getValue(index) + this.LOW.getValue(index)) / 2;
                this.PRICE.setValue(index, price);
                
                if (index < this.PERIODS) return;

                var round = (val: any) => val > .99 ? .999 : val < -.99 ? -.999 : val;
                
                var max = FUSION.lib.getMax(this.PRICE, index, this.PERIODS);
                var min = FUSION.lib.getMin(this.PRICE, index, this.PERIODS);

                var x = round(.66 * ((price - min) / Math.max(max - min, 0.001) - .5) + .67 * this.X.getValue(index - 1));
                this.X.setValue(index, x);

                var fisherTransform = 0.5 * Math.log((1 + x) / Math.max(1 - x, 0.001)) + 0.5 * this.FISHERTRANSFORM.getValue(index - 1);

                this.FISHERTRANSFORM.setValue(index, fisherTransform);
                this.FISHERTRANSFORMTRIGGER.setValue(index, this.FISHERTRANSFORM.getValue(index - 1));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['HISTORICALVOLATILITY'] = {
    title: 'historicalVolatilityTitle',
    description: 'historicalVolatilityDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 1}, value: 10},
        'DIVISOR': {type: 'integer', name: 'divisor', properties: {max: 999999, min: 1}, value: 252},
    },

    outputs: {
        'HISTORICALVOLATILITY': {
            type: 'series', series: {
                seriesId: null,
                title: 'historicalVolatilityTitle',
                labels: ['value'],
                fields: ['HISTORICALVOLATILITY'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'HISTORICALVOLATILITY', renderAs: 'Line', dataField: 'HISTORICALVOLATILITY', color: '#03a9f4', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs	= inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'X',
                ]);
                this.X = this.context.getRawSeriesWrapper(this.helper, 'X');
            }

            this.calculate = function (this: any, index: any) {
                var x = this.CLOSE.getValue(index) / this.CLOSE.getValue(index - 1) - 1;
                this.X.setValue(index, x);
                
                if (index < this.PERIODS) return;

                var std = FUSION.lib.getStdDev(this.X, index, this.PERIODS);
                var volatility = 100 * Math.sqrt(this.DIVISOR) * std;
                this.HISTORICALVOLATILITY.setValue(index, volatility);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['NETVOLUME'] = {
    title: 'netVolumeTitle',
    description: 'netVolumeDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null}
    },

    outputs: {
        'NETVOLUME': {
            type: 'series', series: {
                seriesId: null,
                title: 'netVolumeTitle',
                labels: ['value'],
                fields: ['NETVOLUME'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'NETVOLUME', renderAs: 'Line', dataField: 'NETVOLUME', color: '#03a9f4', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs	= inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries([
                    'X',
                ]);
                this.X = this.context.getRawSeriesWrapper(this.helper, 'X');
            }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);
                
                if (close == null || lastClose == null) return;

                if (close - lastClose > 0) {
                    this.NETVOLUME.setValue(index, this.VOLUME.getValue(index));
                } else if (close == lastClose) {
                    this.NETVOLUME.setValue(index, 0);
                } else {
                    this.NETVOLUME.setValue(index, this.VOLUME.getValue(index)*(-1));
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['TSI'] = {
    title: 'tsiTitle',
    description: 'tsiDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null},
        'SHORTPERIOD': {type: 'integer', name: 'shortPeriod', properties: {def: 13, max: 100, min: 1}, value: 13},
        'LONGPERIOD': {type: 'integer', name: 'longPeriod', properties: {def: 25, max: 100, min: 1}, value: 25},
        'SIGNALPERIOD': {type: 'integer', name: 'signalPeriod', properties: {def: 13, max: 100, min: 0}, value: 13}
    },

    outputs: {
        'TSI': {
            type: 'series', series: {
                seriesId: null,
                title: 'tsiTitle',
                labels: ['value', 'signal'],
                fields: ['TSI', 'TSISIGNAL'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'TSI', renderAs: 'Line', dataField: 'TSI', color: '#03a9f4', width: 1, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'TSI', renderAs: 'Line', dataField: 'TSISIGNAL', color: '#e91e63', width: 1, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['PC', 'APC', 'PCS', 'PCDS', 'APCS', 'APCDS']);
                this.PC = this.context.getRawSeriesWrapper(this.helper, 'PC');
                this.PCS = this.context.getRawSeriesWrapper(this.helper, 'PCS');
                this.PCDS = this.context.getRawSeriesWrapper(this.helper, 'PCDS');
                this.APC = this.context.getRawSeriesWrapper(this.helper, 'APC');
                this.APCS = this.context.getRawSeriesWrapper(this.helper, 'APCS');
                this.APCDS = this.context.getRawSeriesWrapper(this.helper, 'APCDS');
            }

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);
                var lastClose = this.CLOSE.getValue(index - 1);

                if (close === null || lastClose === null) return

                var pc = close - lastClose;
                this.PC.setValue(index, pc);

                var pcs = FUSION.lib.getEMA(this.PC, index, this.LONGPERIOD, this.PCS);
                if (pcs == null) return;
                this.PCS.setValue(index, pcs);

                var pcds = FUSION.lib.getEMA(this.PCS, index, this.SHORTPERIOD, this.PCDS);
                if (pcds == null) return;
                this.PCDS.setValue(index, pcds);

                this.APC.setValue(index, Math.abs(pc));

                var apcs = FUSION.lib.getEMA(this.APC, index, this.LONGPERIOD, this.APCS);
                if (apcs == null) return;
                this.APCS.setValue(index, apcs);

                var apcds = FUSION.lib.getEMA(this.APCS, index, this.SHORTPERIOD, this.APCDS);
                if (apcds == null) return;
                this.APCDS.setValue(index, apcds);

                this.TSI.setValue(index, pcds / apcds * 100);

                var signal = FUSION.lib.getEMA(this.TSI, index, this.SIGNALPERIOD, this.TSISIGNAL);
                this.TSISIGNAL.setValue(index, signal);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['VORTEXINDICATOR'] = {
    title: 'vortexIndicatorTitle',
    description: 'vortexIndicatorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceLow', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {def: 14, max: 100, min: 1}, value: 14}
    },

    outputs: {
        'VORETEXINDICATOR': {
            type: 'series', series: {
                seriesId: null,
                title: 'vortexIndicatorTitle',
                labels: ['vortexIndicatorPlus', 'vortexIndicatorMinus'],
                fields: ['VIP', 'VIM'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'VORETEXINDICATOR', renderAs: 'Line', dataField: 'VIP', color: '#03a9f4', width: 1, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'VORETEXINDICATOR', renderAs: 'Line', dataField: 'VIM', color: '#e91e63', width: 1, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['HL1', 'LH1', 'HL1SUM', 'LH1SUM', 'ATR', 'ATRSUM', 'TRUERANGE']);
                this.HL1 = this.context.getRawSeriesWrapper(this.helper, 'HL1');
                this.LH1 = this.context.getRawSeriesWrapper(this.helper, 'LH1');
                this.HL1SUM = this.context.getRawSeriesWrapper(this.helper, 'HL1SUM');
                this.LH1SUM = this.context.getRawSeriesWrapper(this.helper, 'LH1SUM');
                this.ATR = this.context.getRawSeriesWrapper(this.helper, 'ATR');
                this.ATRSUM = this.context.getRawSeriesWrapper(this.helper, 'ATRSUM');
                this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, 'TRUERANGE');
            }

            this.calculate = function (this: any, index: any) {
                var high = this.HIGH.getValue(index);
                var lastLow = this.LOW.getValue(index - 1);
                var low = this.LOW.getValue(index);
                var lastHigh = this.HIGH.getValue(index - 1);

                this.TRUERANGE.setValue(index, FUSION.lib.getTrueRange(this.HIGH,this.LOW,this.CLOSE,index));
                this.ATR.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, 1, this.ATR));

                // if (high === null || low === null || lastLow === null || lastHigh === null) return;

                var hl1 = Math.abs(high - lastLow);
                this.HL1.setValue(index, hl1);

                var hl1sum =  FUSION.lib.getSum(this.HL1, index, this.PERIODS, this.HL1SUM);
                this.HL1SUM.setValue(index, hl1sum);

                var lh1 = Math.abs(low - lastHigh);
                this.LH1.setValue(index, lh1);

                var lh1sum = FUSION.lib.getSum(this.LH1, index, this.PERIODS, this.LH1SUM);
                this.LH1SUM.setValue(index, lh1sum);

                var atrSum = FUSION.lib.getSum(this.ATR, index, this.PERIODS, this.ATRSUM);
                this.ATRSUM.setValue(index, atrSum);

                if (atrSum === null || atrSum === 0 || hl1sum === null || lh1sum === null || index < this.PERIODS) return;

                this.VIP.setValue(index, hl1sum / atrSum);
                this.VIM.setValue(index, lh1sum / atrSum);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['VWMA'] = {
    title: 'vwmaTitle',
    description: 'vwmaDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'VOLUME': {type: 'series', name: 'priceVolume', properties: {def:'v'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 20},
    },

    outputs: {
        'VWMA': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'vwmaTitle',
                labels: ['value'],
                fields: ['VWMA'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'VWMA', renderAs: 'Line', dataField: 'VWMA', color: '#3f51b5', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['CV']);
                this.CV = this.context.getRawSeriesWrapper(this.helper, 'CV');
            }

            this.calculate = function (this: any, index: any) {
                this.CV.setValue(index, this.CLOSE.getValue(index) * this.VOLUME.getValue(index));
                var cvma = FUSION.lib.getMA(this.CV, index, this.PERIODS);
                var vma = FUSION.lib.getMA(this.VOLUME, index, this.PERIODS);
                this.VWMA.setValue(index, cvma / vma);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['WILLIAMSALLIGATOR'] = {
    title: 'williamsAlligatorTitle',
    description: 'williamsAlligatorDescription',
    type: 'indicators',
    newPane: false,
    inputs: {
        'CLOSE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'JAWPERIODS': {type: 'integer', name: 'jawPeriods', properties: {max: 200, min: 0}, value: 13},
        'TEETHPERIODS': {type: 'integer', name: 'teethPeriods', properties: {max: 200, min: 0}, value: 8},
        'LIPSPERIODS': {type: 'integer', name: 'lipsPeriods', properties: {max: 200, min: 0}, value: 5},
        'JAWOFFSET': {type: 'integer', name: 'jawOffset', properties: {max: 200, min: 0}, value: 8},
        'TEETHOFFSET': {type: 'integer', name: 'teethOffset', properties: {max: 200, min: 0}, value: 5},
        'LIPSOFFSET': {type: 'integer', name: 'lipsOffset', properties: {max: 200, min: 0}, value: 3},
    },

    outputs: {
        'WILLIAMSALLIGATOR': {
            type: 'series',
            series: {
                seriesId: null,
                title: 'williamsAlligatorTitle',
                labels: ['jaw', 'teeth', 'lips'],
                fields: ['JAW', 'TEETH', 'LIPS'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'WILLIAMSALLIGATOR', renderAs: 'Line', dataField: 'JAW', color: '#03a9f4', width: 1.5, dash:[]},
        {type:'SeriesObject', dataLink: 'WILLIAMSALLIGATOR', renderAs: 'Line', dataField: 'TEETH', color: '#ee4336', width: 1.5, dash:[]},
        {type:'SeriesObject', dataLink: 'WILLIAMSALLIGATOR', renderAs: 'Line', dataField: 'LIPS', color: '#8bc349', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var close = this.CLOSE.getValue(index);

                var lastJaw = this.JAW.getValue(index + this.JAWOFFSET - 1);
                if (lastJaw) {
                    this.JAW.setValue(index + this.JAWOFFSET, (lastJaw * (this.JAWPERIODS - 1) + close) / this.JAWPERIODS);
                } else {
                    this.JAW.setValue(index + this.JAWOFFSET, FUSION.lib.getMA(this.CLOSE, index, this.JAWPERIODS));
                }

                var lastTeeth = this.TEETH.getValue(index + this.TEETHOFFSET - 1);
                if (lastTeeth) {
                    this.TEETH.setValue(index + this.TEETHOFFSET, (lastTeeth * (this.TEETHPERIODS - 1) + close) / this.TEETHPERIODS);
                } else {
                    this.TEETH.setValue(index + this.TEETHOFFSET, FUSION.lib.getMA(this.CLOSE, index, this.TEETHPERIODS));
                }

                var lastLips = this.LIPS.getValue(index + this.LIPSOFFSET- 1);            
                if (lastLips) {
                    this.LIPS.setValue(index + this.LIPSOFFSET, (lastLips * (this.LIPSPERIODS - 1) + close) / this.LIPSPERIODS);
                } else {
                    this.LIPS.setValue(index + this.LIPSOFFSET, FUSION.lib.getMA(this.CLOSE, index, this.LIPSPERIODS));
                }
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['WILLIAMSFRACTALS'] = {
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

FUSION.scripts['OC2'] = {
    title: 'oc2Title',
    description: 'oc2Description',
    type: 'indicators',
    newPane: false,
    inputs: {
        'OPEN': {type: 'series', name: 'priceOpen', properties: {def:'o'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null}
    },

    outputs: {
        'OC2': {
            type: 'series', series: {
                seriesId: null,
                title: 'oc2Title',
                labels: ['value'],
                fields: ['OC2'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'OC2', renderAs: 'Line', dataField: 'OC2', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.OC2.setValue(index, (this.OPEN.getValue(index) + this.CLOSE.getValue(index)) / 2);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['HL2'] = {
    title: 'hl2Title',
    description: 'hl2Description',
    type: 'indicators',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null}
    },

    outputs: {
        'HL2': {
            type: 'series', series: {
                seriesId: null,
                title: 'hl2Title',
                labels: ['value'],
                fields: ['HL2'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'HL2', renderAs: 'Line', dataField: 'HL2', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.HL2.setValue(index, (this.HIGH.getValue(index) + this.LOW.getValue(index)) / 2);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['HLC3'] = {
    title: 'hlc3Title',
    description: 'hlc3Description',
    type: 'indicators',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null}
    },

    outputs: {
        'HLC3': {
            type: 'series', series: {
                seriesId: null,
                title: 'hlc3Title',
                labels: ['value'],
                fields: ['HLC3'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'HLC3', renderAs: 'Line', dataField: 'HLC3', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.HLC3.setValue(index, (this.HIGH.getValue(index) + this.LOW.getValue(index) + this.CLOSE.getValue(index)) / 3);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['OHLC4'] = {
    title: 'ohlc4Title',
    description: 'ohlc4Description',
    type: 'indicators',
    newPane: false,
    inputs: {
        'OPEN': {type: 'series', name: 'priceOpen', properties: {def:'o'}, value: null},
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'CLOSE': {type: 'series', name: 'priceClose', properties: {def:'c'}, value: null}
    },

    outputs: {
        'OHLC4': {
            type: 'series', series: {
                seriesId: null,
                title: 'ohlc4Title',
                labels: ['value'],
                fields: ['OHLC4'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'OHLC4', renderAs: 'Line', dataField: 'OHLC4', color: '#ff9800', width: 1.5, dash:[]}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.OHLC4.setValue(index, (this.OPEN.getValue(index) + this.HIGH.getValue(index) + this.LOW.getValue(index) + this.CLOSE.getValue(index)) / 4);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['1x'] = {
    title: '1xTitle',
    description: '1xDescription',
    type: 'functions',
    newPane: true,
    inputs: {
        'INDICATOR': {type: 'series', name: 'indicator', properties: {def:'c'}, value: null},
    },

    outputs: {
        'X': {
            type: 'series', series: {
                seriesId: null,
                title: '1xTitle',
                labels: ['value'],
                fields: ['X'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'X', renderAs: 'Line', dataField: 'X', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.X.setValue(index, 1 / this.INDICATOR.getValue(index));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['SUM'] = {
    title: 'sumTitle',
    description: 'sumDescription',
    type: 'functions',
    newPane: true,
    inputs: {
        'INDICATOR1': {type: 'conditional', name: 'indicator1', properties: {}, value: {type:"double", value:0}},
        'INDICATOR2': {type: 'conditional', name: 'indicator2', properties: {}, value: {type:"double", value:0}},
        'INDICATOR3': {type: 'conditional', name: 'indicator3', properties: {}, value: {type:"double", value:0}},
        'INDICATOR4': {type: 'conditional', name: 'indicator4', properties: {}, value: {type:"double", value:0}},
        'INDICATOR5': {type: 'conditional', name: 'indicator5', properties: {}, value: {type:"double", value:0}},
        'INDICATOR6': {type: 'conditional', name: 'indicator6', properties: {}, value: {type:"double", value:0}},
        'INDICATOR7': {type: 'conditional', name: 'indicator7', properties: {}, value: {type:"double", value:0}},
        'INDICATOR8': {type: 'conditional', name: 'indicator8', properties: {}, value: {type:"double", value:0}},
        'INDICATOR9': {type: 'conditional', name: 'indicator9', properties: {}, value: {type:"double", value:0}},
        'INDICATOR10': {type: 'conditional', name: 'indicator10', properties: {}, value: {type:"double", value:0}},
    },

    outputs: {
        'SUM': {
            type: 'series', series: {
                seriesId: null,
                title: 'sumTitle',
                labels: ['value'],
                fields: ['SUM'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'SUM', renderAs: 'Line', dataField: 'SUM', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                var i1 = FUSION.lib.getConditionalInputValue(this.INDICATOR1, index);
                var i2 = FUSION.lib.getConditionalInputValue(this.INDICATOR2, index);
                var i3 = FUSION.lib.getConditionalInputValue(this.INDICATOR3, index);
                var i4 = FUSION.lib.getConditionalInputValue(this.INDICATOR4, index);
                var i5 = FUSION.lib.getConditionalInputValue(this.INDICATOR5, index);
                var i6 = FUSION.lib.getConditionalInputValue(this.INDICATOR6, index);
                var i7 = FUSION.lib.getConditionalInputValue(this.INDICATOR7, index);
                var i8 = FUSION.lib.getConditionalInputValue(this.INDICATOR8, index);
                var i9 = FUSION.lib.getConditionalInputValue(this.INDICATOR9, index);
                var i10 = FUSION.lib.getConditionalInputValue(this.INDICATOR10, index);

                this.SUM.setValue(index, i1 + i2 + i3 + i4 + i5 + i6 + i7 + i8 + i9 + i10);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['AVERAGE'] = {
    title: 'averageTitle',
    description: 'averageDescription',
    type: 'functions',
    newPane: true,
    inputs: {
        'INDICATOR1': {type: 'conditional', name: 'indicator1', properties: {}, value: {type:"double", value:0}},
        'INDICATOR2': {type: 'conditional', name: 'indicator2', properties: {}, value: {type:"double", value:0}},
        'INDICATOR3': {type: 'conditional', name: 'indicator3', properties: {}, value: {type:"double", value:0}},
        'INDICATOR4': {type: 'conditional', name: 'indicator4', properties: {}, value: {type:"double", value:0}},
        'INDICATOR5': {type: 'conditional', name: 'indicator5', properties: {}, value: {type:"double", value:0}},
        'INDICATOR6': {type: 'conditional', name: 'indicator6', properties: {}, value: {type:"double", value:0}},
        'INDICATOR7': {type: 'conditional', name: 'indicator7', properties: {}, value: {type:"double", value:0}},
        'INDICATOR8': {type: 'conditional', name: 'indicator8', properties: {}, value: {type:"double", value:0}},
        'INDICATOR9': {type: 'conditional', name: 'indicator9', properties: {}, value: {type:"double", value:0}},
        'INDICATOR10': {type: 'conditional', name: 'indicator10', properties: {}, value: {type:"double", value:0}},
    },

    outputs: {
        'AVERAGE': {
            type: 'series', series: {
                seriesId: null,
                title: 'averageTitle',
                labels: ['value'],
                fields: ['AVERAGE'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'AVERAGE', renderAs: 'Line', dataField: 'AVERAGE', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                var values = [];

                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR1, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR2, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR3, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR4, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR5, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR6, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR7, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR8, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR9, index));
                values.push(FUSION.lib.getConditionalInputValue(this.INDICATOR10, index));

                var insertedIndicatorsCount = 10;
                var sum = 0;

                for (var i = 0; i < values.length; ++i) {
                    if (values[i]) {
                        sum += values[i];
                    } else {
                        --insertedIndicatorsCount;
                    }
                }

                this.AVERAGE.setValue(index, sum / insertedIndicatorsCount);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['STANDARDDEVIATION'] = {
    title: 'standardDeviationTitle',
    description: 'standardDeviationDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'PRICE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 0}, value: 9}
    },

    outputs: {
        'STANDARDDEVIATION': {
            type: 'series', series: {
                seriesId: null,
                title: 'standardDeviationTitle',
                labels: ['value'],
                fields: ['STANDARDDEVIATION'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'STANDARDDEVIATION', renderAs: 'Line', dataField: 'STANDARDDEVIATION', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) { }

            this.calculate = function (this: any, index: any) {
                this.STANDARDDEVIATION.setValue(index, FUSION.lib.getStdDev(this.PRICE, index, this.PERIODS));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['FIBONACCI'] = {
    title: 'fibonacciTitle',
    description: 'fibonacciDescription',
    type: 'functions',
    newPane: false,
    inputs: {
        'HIGH': {type: 'series', name: 'priceHigh', properties: {def:'h'}, value: null},
        'LOW': {type: 'series', name: 'priceLow', properties: {def:'l'}, value: null},
        'PERIODS': {type: 'integer', name: 'periods', properties: {max: 200, min: 1}, value: 24}
    },

    outputs: {
        'FIBONACCI': {
            type: 'series', series: {
                seriesId: null,
                title: 'fibonacciTitle',
                labels: ['fibonacciValue0', 'fibonacciValue2', 'fibonacciValue3', 'fibonacciValue4', 'fibonacciValue6', 'fibonacciValue7'],
                fields: ['FIBONACCI0', 'FIBONACCI2', 'FIBONACCI3', 'FIBONACCI4', 'FIBONACCI6', 'FIBONACCI7'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'FIBONACCI', renderAs: 'Line', dataField: 'FIBONACCI0', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'FIBONACCI', renderAs: 'Line', dataField: 'FIBONACCI2', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'FIBONACCI', renderAs: 'Line', dataField: 'FIBONACCI3', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'FIBONACCI', renderAs: 'Line', dataField: 'FIBONACCI4', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'FIBONACCI', renderAs: 'Line', dataField: 'FIBONACCI6', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'FIBONACCI', renderAs: 'Line', dataField: 'FIBONACCI7', color: '#ff9800', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {}

            this.calculate = function (this: any, index: any) {
                var highest = FUSION.lib.getMax(this.HIGH, index, this.PERIODS);
                var lowest = FUSION.lib.getMin(this.LOW, index, this.PERIODS);

                if (!highest || !lowest) return;

                this.FIBONACCI0.setValue(index, lowest);
                this.FIBONACCI2.setValue(index, lowest + 0.382 * (highest - lowest));
                this.FIBONACCI3.setValue(index, lowest + 0.5 * (highest - lowest));
                this.FIBONACCI4.setValue(index, lowest + 0.618 * (highest - lowest));
                this.FIBONACCI6.setValue(index, highest);
                this.FIBONACCI7.setValue(index, lowest + 1.618 * (highest - lowest));
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['SHARPERATIO'] = {
    title: 'sharpeRatioTitle',
    description: 'sharpeRatioDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'EL': {type: 'series', name: 'equityLine', properties: {def:'EQUITY'}, value: null},
        'RORPERIODS': {type: 'integer', name: 'rorPeriods', properties: {max: 200, min: 0}, value: 21},
        'PERIODS': {type: 'integer', name: 'sharpePeriods', properties: {max: 999, min: 0}, value: 220},
        'RF': {type: 'integer', name: 'riskFreeRateOfReturn', properties: {max: 200, min: 0}, value: 0},
    },

    outputs: {
        'SHARPERATIO': {
            type: 'series', series: {
                seriesId: null,
                title: 'sharpeRatioTitle',
                labels: ['value', 'stddev', 'ror'],
                fields: ['SHARPERATIO', 'STD', 'ROR'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'SHARPERATIO', renderAs: 'Line', dataField: 'SHARPERATIO', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'SHARPERATIO', renderAs: 'Line', dataField: 'STD', color: '#03a9f4', width: 1.5, dash:[2, 2], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'SHARPERATIO', renderAs: 'Line', dataField: 'ROR', color: '#ee4336', width: 1.5, dash:[], priceTag: false, priceLine: false},
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['RATEOFRETURN', 'RATEOFRETURNSUM', 'STD']);
                this.RATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURN');
                this.RATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURNSUM');
            }

            this.calculate = function (this: any, index: any) {
                const el = this.EL.getValue(index);
                const prevEl = this.EL.getValue(index - this.RORPERIODS);

                if (!el || !prevEl) return;

                const rateOfReturn = (el - prevEl) / prevEl;
                this.RATEOFRETURN.setValue(index, rateOfReturn);

                const rateOfReturnSum = FUSION.lib.getSum(this.RATEOFRETURN, index, this.PERIODS, this.RATEOFRETURNSUM);
                this.RATEOFRETURNSUM.setValue(index, rateOfReturnSum);

                const averageRateOfReturn = rateOfReturnSum / this.PERIODS;
                const std = FUSION.lib.getStdDev(this.RATEOFRETURN, index, this.PERIODS);
                const sharpeRatio = (averageRateOfReturn - this.RF / 100) / std;

                if (index < this.PERIODS + this.RORPERIODS) return;

                this.ROR.setValue(index, averageRateOfReturn);
                this.STD.setValue(index, std);
                this.SHARPERATIO.setValue(index, sharpeRatio);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['ROR'] = {
    title: 'rorTitle',
    description: 'rorDescription',
    type: 'indicators',
    newPane: true,
    inputs: {
        'PRICE': {type: 'series', name: 'price', properties: {def:'c'}, value: null},
        'RORPERIODS': {type: 'integer', name: 'rorPeriods', properties: {max: 200, min: 0}, value: 21},
        'PERIODS': {type: 'integer', name: 'sharpePeriods', properties: {max: 999, min: 0}, value: 220}
    },

    outputs: {
        'ROR': {
            type: 'series', series: {
                seriesId: null,
                title: 'rorTitle',
                labels: ['rorDescription', 'stddev'],
                fields: ['ROR', 'STD'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'ROR', renderAs: 'Line', dataField: 'ROR', color: '#ee4336', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'ROR', renderAs: 'Line', dataField: 'STD', color: '#03a9f4', width: 1.5, dash:[2, 2], priceTag: false, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['RATEOFRETURN', 'RATEOFRETURNSUM']);
                this.RATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURN');
                this.RATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURNSUM');
            }

            this.calculate = function (this: any, index: any) {
                const el = this.PRICE.getValue(index);
                const prevEl = this.PRICE.getValue(index - this.RORPERIODS);

                if (!el || !prevEl) return;

                const rateOfReturn = (el - prevEl) / prevEl;
                this.RATEOFRETURN.setValue(index, rateOfReturn);

                const rateOfReturnSum = FUSION.lib.getSum(this.RATEOFRETURN, index, this.PERIODS, this.RATEOFRETURNSUM);
                this.RATEOFRETURNSUM.setValue(index, rateOfReturnSum);

                const averageRateOfReturn = rateOfReturnSum / this.PERIODS;
                const std = FUSION.lib.getStdDev(this.RATEOFRETURN, index, this.PERIODS);

                if (index < this.PERIODS + this.RORPERIODS) return;

                this.ROR.setValue(index, averageRateOfReturn);
                this.STD.setValue(index, std);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

FUSION.scripts['INFORMATIONRATIO'] = {
    title: 'informationRatioTitle',
    description: 'informationRatioDescription',
    type: 'indicators',
    newPane: true,
    quickAdd: false,
    inputs: {
        'EL': {type: 'series', name: 'equityLine', properties: {def:'EQUITY'}, value: null},
        'RORPERIODS': {type: 'integer', name: 'rorPeriods', properties: {max: 200, min: 0}, value: 21},
        'PERIODS': {type: 'integer', name: 'informationRatioPeriods', properties: {max: 999, min: 0}, value: 220},
        'BENCHMARK': {type: 'series', name: 'benchmark', properties: {def:'c'}, value: null},
    },

    outputs: {
        'INFORMATIONRATIO': {
            type: 'series', series: {
                seriesId: null,
                title: 'informationRatioTitle',
                labels: ['informationRatioTitle', 'portfolioReturn', 'benchmarkReturn', 'trackingError'],
                fields: ['INFORMATIONRATIO', 'PORTFOLIORETURN', 'BENCHMARKRETURN', 'TRACKINGERROR'],
                data: null
            }
        }
    },

    plotters: [
        {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'INFORMATIONRATIO', color: '#ff9800', width: 1.5, dash:[], priceTag: true, priceLine: false},
        {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'PORTFOLIORETURN', color: '#ee4336', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'BENCHMARKRETURN', color: '#9e9e9e', width: 1.5, dash:[], priceTag: false, priceLine: false},
        {type:'SeriesObject', dataLink: 'INFORMATIONRATIO', renderAs: 'Line', dataField: 'TRACKINGERROR', color: '#03a9f4', width: 1.5, dash:[2, 2], priceTag: false, priceLine: false}
    ],

    controller: function (context: CoreFusionRuntime, inputs: Record<string, unknown>, outputs: Record<string, string>) {
        var Controller: FusionScriptControllerConstructor = function (this: FusionScriptControllerRuntime, context: CoreFusionRuntime, inputs: Record<string, any>, outputs: Record<string, any>) {
            this.id	= '';
            this.context = context;
            this.inputs = inputs;
            this.outputs = outputs;

            this.init = function (this: any) {
                this.helper = this.context.createSeries(['RATEOFRETURN', 'RATEOFRETURNSUM', 'BENCHMARKRATEOFRETURN', 'BENCHMARKRATEOFRETURNSUM', 'DIFFERENCE']);

                this.RATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURN');
                this.RATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'RATEOFRETURNSUM');
                this.BENCHMARKRATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, 'BENCHMARKRATEOFRETURN');
                this.BENCHMARKRATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, 'BENCHMARKRATEOFRETURNSUM');
                this.DIFFERENCE = this.context.getRawSeriesWrapper(this.helper, 'DIFFERENCE');
            }

            this.calculate = function (this: any, index: any) {
                // PORTFOLIO RETURN
                const el = this.EL.getValue(index);
                const prevEl = this.EL.getValue(index - this.RORPERIODS);

                if (!el || !prevEl) return;

                const rateOfReturn = (el - prevEl) / prevEl;
                this.RATEOFRETURN.setValue(index, rateOfReturn);

                const rateOfReturnSum = FUSION.lib.getSum(this.RATEOFRETURN, index, this.PERIODS, this.RATEOFRETURNSUM);
                this.RATEOFRETURNSUM.setValue(index, rateOfReturnSum);

                const averageRateOfReturn = rateOfReturnSum / this.PERIODS;

                // BENCHMARK RETURN
                const benchmarkPrice = this.BENCHMARK.getValue(index);
                const prevBenchmarkPrice = this.BENCHMARK.getValue(index - this.RORPERIODS);

                if (!benchmarkPrice || !prevBenchmarkPrice) return;

                const benchmarkRateOfReturn = (benchmarkPrice - prevBenchmarkPrice) / prevBenchmarkPrice;
                this.BENCHMARKRATEOFRETURN.setValue(index, benchmarkRateOfReturn);

                const benchmarkRateOfReturnSum = FUSION.lib.getSum(this.BENCHMARKRATEOFRETURN, index, this.PERIODS, this.BENCHMARKRATEOFRETURNSUM);
                this.BENCHMARKRATEOFRETURNSUM.setValue(index, benchmarkRateOfReturnSum);

                const benchmarkAverageRateOfReturn = benchmarkRateOfReturnSum / this.PERIODS;

                // STD
                const difference = rateOfReturn - benchmarkRateOfReturn;
                this.DIFFERENCE.setValue(index, difference);

                if (index < this.PERIODS + this.RORPERIODS) return;

                // TRACKING ERROR
                const trackingError = FUSION.lib.getStdDev(this.DIFFERENCE, index, this.PERIODS);
                const informationRatio = (averageRateOfReturn - benchmarkAverageRateOfReturn) / trackingError;

                this.TRACKINGERROR.setValue(index, trackingError);
                this.PORTFOLIORETURN.setValue(index, averageRateOfReturn);
                this.BENCHMARKRETURN.setValue(index, benchmarkAverageRateOfReturn);
                this.INFORMATIONRATIO.setValue(index, informationRatio);
            }
        };

        return new Controller(context, inputs, outputs);
    }
}

/*
* FUSION LIB - basic fusion functions
*/ 
FUSION.lib = {};

FUSION.lib.getConditionalInputValue = function (input, index) {
    if (input['type'] && input['type'] == 'double') {
        //double
        return parseFloat(input['value']);
    } else //series
        return input.getValue(index);
}

FUSION.lib.getPercentageROC = function (index, series, periods) {
    var dis = FUSION.lib.displace(series, index, periods);
        
    if (dis === null) return null;
    return (series.getValue(index) - dis) / dis * 100;
}

FUSION.lib.calculateRSI = function (index, closeSeries, rsiSeries, auSeries, adSeries, mauSeries, madSeries, upperBandValue, lowerBandValue, rsiPeriods) {
    auSeries.setValue(index, 0);
    adSeries.setValue(index, 0);
    mauSeries.setValue(index, 0);
    madSeries.setValue(index, 0);

    var close = closeSeries.getValue(index);
    var lastClose = closeSeries.getValue(index - 1);

    if (index < rsiPeriods) return;
    if (close === null || lastClose === null) return;

    var diff = close - lastClose;

    if (diff > 0) {
        auSeries.setValue(index, diff);
        adSeries.setValue(index, 0);
    } else {
        auSeries.setValue(index, 0);
        adSeries.setValue(index, -diff);
    }

    var mmaAU = FUSION.lib.getMMA(auSeries, index, rsiPeriods, mauSeries);
    var mmaAD = FUSION.lib.getMMA(adSeries, index, rsiPeriods, madSeries);
    mauSeries.setValue(index, mmaAU);
    madSeries.setValue(index, mmaAD);
    
    if (mmaAU === null || mmaAD === null) return;
    
    if (mmaAU + mmaAD == 0) {
        rsiSeries.setValue(index, lowerBandValue + ((upperBandValue - lowerBandValue) / 2));
    } else {
        rsiSeries.setValue(index, 100 * mmaAU / (mmaAU + mmaAD));
    }
}

FUSION.lib.getSum = function(series, index, periods, sumSeries) {
    var sum = 0;

    if (sumSeries) {
        sum = sumSeries.getValue(index - 1) + series.getValue(index) - series.getValue(index - periods);
    } else {
        for (var i = index; i > index - periods; --i) {
            sum += series.getValue(index);
        }
    }

    return sum;
}

FUSION.lib.getBestMatchingInterval = function(originalInterval, availableIntervals) {
  if (availableIntervals.length === 0) throw new Error("No intervals available for the instrument");
  if (!originalInterval) return availableIntervals[0];

  const bestDelta = availableIntervals
      .filter((interval: FusionRecord) => interval.milis > 0)
      .map((interval: FusionRecord, index: number) => {
          return {
              index: index,
              value: Math.abs(originalInterval.milis - interval.milis)
          };
      })
      .sort((deltaA: FusionRecord, deltaB: FusionRecord) => deltaA.value - deltaB.value)
      .slice(0, 1);
  return availableIntervals[bestDelta[0].index];
};

FUSION.lib.getForecastAverage = function (series, returnRate, idx, periods, prognosisPeriods, probability) {
    var upperSum = 0;
    var lowerSum = 0;
    var num = 0;
    var iteration = 0;
    var emptyValues = {
        upper: null,
        lower: null
    };

    for (var i = prognosisPeriods; i > 0; --i) {
        iteration++
        if (iteration % 10 !== 0) continue;
        if ((idx - i) >= series.getSeriesLength()) {
            break;
        }
        num += 1;
        
        var average = FUSION.lib.getMA(returnRate, idx - i, periods);
        var standardDeviation = FUSION.lib.getStdDev(returnRate, idx - i, periods);
        var valueAtRisk = FUSION.lib.inverseNormalDistribution(probability, average, standardDeviation);
        var valueAtRiskValue = valueAtRisk * Math.sqrt(i) * series.getValue(idx);
        if (average === null || standardDeviation === null || valueAtRisk === null || series.getValue(idx) === null || series.getValue(idx - i) === null)
            return emptyValues;

        upperSum += series.getValue(idx - i) - valueAtRiskValue;
        lowerSum += series.getValue(idx - i) + valueAtRiskValue;
    }

    return {
        upper: upperSum / num,
        lower: lowerSum / num
    }
}

FUSION.lib.getReturnRate = function (series, index) {
    if (series.getValue(index) === null || series.getValue(index - 1) === null) return null;
    if (series.getValue(index - 1) === null && series.getValue(index) !== null) return series.getValue(index);

    return (series.getValue(index) - series.getValue(index - 1)) / series.getValue(index - 1);
}

FUSION.lib.inverseNormalDistribution = function(p, mean, std) {
    function erfcinv(p: number) {
        var j = 0;
        var x, err, t, pp;
        if (p >= 2) return -100;
        if (p <= 0) return 100;
        pp = p < 1 ? p : 2 - p;
        t = Math.sqrt(-2 * Math.log(pp / 2));
        x =
            -0.70711 *
            ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
        for (; j < 2; j++) {
            err = erfc(x) - pp;
            x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err);
        }
        return p < 1 ? x : -x;
    }
  
    function erfc(x: number) {
        return 1 - erf(x);
    }
  
    function erf(x: number) {
        var cof = [
            -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
            -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
            4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
            1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
            6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
            -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
            -6.886027e-12, 8.94487e-13, 3.13092e-13,
            -1.12708e-13, 3.81e-16, 7.106e-15,
            -1.523e-15, -9.4e-17, 1.21e-16,
            -2.8e-17
        ];
        var j = cof.length - 1;
        var isneg = false;
        var d = 0;
        var dd = 0;
        var t, ty, tmp, res;

        if (x < 0) {
            x = -x;
            isneg = true;
        }

        t = 2 / (2 + x);
        ty = 4 * t - 2;

        for (; j > 0; j--) {
            tmp = d;
            d = ty * d - dd + cof[j];
            dd = tmp;
        }

        res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
        return isneg ? res - 1 : 1 - res;
    }
  
    return -1.41421356237309505 * std * erfcinv(2 * p) + mean;
}

FUSION.lib.isHighBar = function (series, idx, prd) {
    var high = series.getValue(idx);
    for (var i = idx - prd; i < idx; ++i) {
        if (series.getValue(i) === null || series.getValue(i) >= high) return false;
    }

    for (i = idx + 1; i <= idx + prd; ++i) {
        if (series.getValue(i) === null || series.getValue(i) >= high) return false;
    }

    return true;
}

FUSION.lib.isLowBar = function (series, idx, prd) {
    var low = series.getValue(idx);
    for (var i = idx - prd; i < idx; ++i) {
        if (series.getValue(i) === null || series.getValue(i) <= low) return false;
    }

    for (i = idx + 1; i <= idx + prd; ++i) {
        if (series.getValue(i) === null || series.getValue(i) <= low) return false;
    }

    return true;
}

FUSION.lib.getMA = function(series, idx, prd) {
    if (idx < prd - 1) {
        return null;
        
    } else {
        
        var movAvg = 0;
        for (var j = idx - prd + 1; j < idx + 1; j++) {
            if (series.getValue(j) === null) return null;
            movAvg = movAvg + series.getValue(j);
        }    
        movAvg = movAvg / prd;
        
        return movAvg;
        
    }    
}    

FUSION.lib.getWMA = function(series, idx, pds) {

    if (idx < pds-1) {
        return null;
    } else {
        var sum = 0;
        var wsum = 0;

        for(var j = 0; j < pds; j++) {
            if (series.getValue(idx-j) === null) return null;
            sum += series.getValue(idx-j) * (pds-j);
            wsum += j+1;
        }
        return sum / wsum;
    }
}


FUSION.lib.getMMA = function(series, idx, pds, prev) {

    if (idx < pds-1) {
        return null;
    } else    
    if (prev.getValue(idx-1) === null) {
        return FUSION.lib.getMA(series, idx, Math.ceil(pds));
    } else if (series.getValue(idx) === null) {
        return null;
    } else {
        var mma = 0;
        mma = prev.getValue(idx-1) + (series.getValue(idx) - prev.getValue(idx-1)) / pds;
        return mma;

    }    
}    

FUSION.lib.getEMA = function(series, idx, pds, prev) {
  if (idx < pds - 1 || series.getValue(idx) === null) {
    return null;
  } else if (prev.getValue(idx-1) === null) {
    return FUSION.lib.getMA(series, idx, pds);
  } else {
    var alfa = 2 / (pds + 1);
    var value = series.getValue(idx);
    var yesterday = prev.getValue(idx - 1);
    var a = alfa * value + (1 - alfa) * yesterday;
    return a;
  }
};

FUSION.lib.getMin = function(series, idx, pds) {

    if (idx < pds - 1) {
        return null;
    }
    var min = FUSION.MAX_VALUE;
    for (var i=0; i<pds; i++) {
        if (series.getValue(idx-pds+1+i) === null) return null;
        if (series.getValue(idx-pds+1+i)<min)min = series.getValue(idx-pds+1+i);
    }
    if (min === FUSION.MAX_VALUE) return null;
    return min;
}

FUSION.lib.getMinIndex = function(series, idx, pds) {

    if (idx < pds - 1) {
        return null;
    }
    var min = FUSION.MAX_VALUE;
    var minIndex = 0;

    for (var i=0; i<pds; i++) {
        if (series.getValue(idx-pds+1+i) === null) return null;
        if (series.getValue(idx-pds+1+i)<min) {
            min = series.getValue(idx-pds+1+i);
            minIndex = idx-pds+1+i;
        }
    }
    if (min === FUSION.MAX_VALUE) return null;
    return minIndex;
}

FUSION.lib.getMax = function(series, idx, pds) {

    if (idx < pds - 1) {
        return null;
    }
    var max = FUSION.MIN_VALUE;
    for (var i=0; i<pds; i++) {
        if (series.getValue(idx-pds+1+i) === null) return null;
        if (series.getValue(idx-pds+1+i)>max)max = series.getValue(idx-pds+1+i);

    }
    if (max === FUSION.MIN_VALUE) return null;
    return max;

}

FUSION.lib.getMaxIndex = function(series, idx, pds) {

    if (idx < pds - 1) {
        return null;
    }
    var max = FUSION.MIN_VALUE;
    var maxIndex = 0;
    for (var i=0; i<pds; i++) {
        if (series.getValue(idx-pds+1+i) === null) return null;
        if (series.getValue(idx-pds+1+i)>max) {
            max = series.getValue(idx-pds+1+i);
            maxIndex = idx-pds+1+i;
        }

    }
    if (max === FUSION.MIN_VALUE) return null;
    return maxIndex;
}

FUSION.lib.getStdDev = function(series, idx, prd) {

    if (idx < prd - 1) {
        return null;
    }

    var movStdDev = 0;
    var mean = 0;

    for (var i = idx - prd + 1; i < idx + 1; i++) {
        if (series.getValue(i) === null) return null;
        mean = mean + series.getValue(i);
    }
    mean = mean / prd;

    for (var i = idx - prd + 1; i < idx + 1; i++) {
        var toSqrt = series.getValue(i) - mean;
        movStdDev = movStdDev + ((toSqrt) * (toSqrt));
    }

    movStdDev = movStdDev / prd;
    movStdDev = Math.sqrt(movStdDev);

    return movStdDev;

}
FUSION.lib.getTrueRange = function(high, low, close, idx)
{
    if (
        idx === 0 ||
        high.getValue(idx) === null ||
        low.getValue(idx) === null ||
        close.getValue(idx-1) === null
    ) {
        return null;
    }

    var hml = high.getValue(idx) - low.getValue(idx);
    var hmc = high.getValue(idx) - close.getValue(idx-1);
    var cml = close.getValue(idx-1) - low.getValue(idx);

    var ret = hml;
    if (hmc>ret)ret=hmc;
    if (cml>ret)ret=cml;

    return ret;
}
FUSION.lib.getTrueLow = function(close, low, idx)
{
    if (
        idx === 0 ||
        low.getValue(idx) === null ||
        close.getValue(idx-1) === null
    ) {
        return null;
    }
    var tl = close.getValue(idx-1);
    if (tl>low.getValue(idx)) tl = low.getValue(idx);
    return tl;
}

FUSION.lib.displace = function(source, idx, pds) {
  var i = idx - pds;
  if (i < 0) {
    return null; //source.getValue(0);
  } else if (i > source.getSeriesLength() - 1) {
    return null; //source.getValue(source.getSeriesLength() - 1);
  } else {
    return source.getValue(i);
  }
};

FUSION.lib.getLarge = function(series, index, period, n) {
    var values = [];
    var from = index - period;
    if (from < 0) from = 0;

    for (var i = index; i > from; --i) {
        if (series.getValue(i) !== null) {
            values.push(series.getValue(i));
        }
    }

    values.sort(function (a, b) {
        return b - a;
    });

    if (n >= values.length) n = values.length - 1;
    return values[n];
}

FUSION.lib.getSmall = function(series, index, period, n) {
    var values = [];
    var from = index - period;
    if (from < 0) from = 0;

    for (var i = index; i > from; --i) {
        if (series.getValue(i) !== null) {
            values.push(series.getValue(i));
        }
    }

    values.sort(function (a, b) {
        return a - b;
    });

    if (n >= values.length) n = values.length - 1;
    return values[n];
}


/*
 * ENGINE
 */

FUSION.engine = function (this: CoreFusionRuntime) {
    this.model = {
        id: FUSION.uniqueId(),
        instrumentsSeries: [],
        scripts: [],
    } as FusionModelRuntime;
    var positionsSeriesId = "POSITIONS";

    this.seriesManager = {} as Record<string, FusionSeriesRuntime>;
    this.scriptsManager = {} as Record<string, FusionScriptControllerRuntime>;

    this.createSeries = function (this: any, fields: string[]) {
        var series: FusionSeriesData = [];
        const mainSeries = this.getMainSeries();
        const mainSeriesData = (mainSeries && mainSeries.data ? mainSeries.data : []) as FusionSeriesData;
        if(mainSeriesData){
            for (var i=0; i<mainSeriesData.length; i++) {
                series[i] = {};
                series[i]['stamp'] = mainSeriesData[i].stamp;
                series[i]['strength'] = 1.0;
                for (var j=0; j<fields.length; j++) {
                    series[i][fields[j]] = null;
                }
            }
        }
        return series;
    };
    this.createTooltipSeries = function (this: any, fields: string[]) {
        var series = this.createSeries(fields);
        for (var i=0; i<series.length; i++) {
            series[i].tooltips = {};
        }
        return series;
    }

    this.configureScripts = function (this: any){
        for (var i=0; i<this.model.scripts.length; i++) {
            this.configureScript(this.model.scripts[i] as RuntimeScriptConfig);
        }
    }

	this.configureScript = function (this: any, scriptModel: RuntimeScriptConfig) {
        var self = this;
        var scriptProto = FUSION.scripts[scriptModel.key] as RuntimeScriptDefinition | undefined;
        if (scriptProto == null || !scriptProto.controller) return;

        scriptModel.scriptType = scriptProto.type;
        //Get Script ID

        var id = scriptModel.id;

        //create input wrappers
        var wrappers: Record<string, any> = {};

        for (var key in scriptModel.inputs) {
            if(scriptProto.inputs[key]){
                if (scriptProto.inputs[key].type=='series') {
                    wrappers[key] = this.getSeriesWrapper(scriptModel.inputs[key]);
                    if(!scriptModel.reference && scriptModel.scriptType != "strategies") scriptModel.reference = scriptModel.inputs[key];
                } else if (scriptProto.inputs[key].type=='conditional' && scriptModel.inputs[key]['type']=='series') {
                    wrappers[key] = this.getSeriesWrapper(scriptModel.inputs[key]['value'])
                }else if (scriptProto.inputs[key].type=='object') {
                    wrappers[key] = scriptModel.inputs[key];
                    wrappers[key].isIndicator = true;
                }else {
                    wrappers[key] = scriptModel.inputs[key];
                }
            }
        }
        function initializeSeries(series: FusionRecord) {
            series.userName = scriptModel.userName;
            if(scriptModel.inputs['OBJECT'] && scriptModel.inputs['OBJECT'].userName){
                series.userName = scriptModel.inputs['OBJECT'].userName;
            }
            series.seriesId = scriptModel.outputs[key];
            self.seriesManager[series.seriesId] = series as FusionSeriesRuntime;
        }
        //create outputs
        for (var key in scriptModel.outputs) {
            var type = scriptProto.outputs[key].type;
            if (type === 'series') {

                var series: FusionRecord = JSON.parse(JSON.stringify(scriptProto.outputs[key].series));
                series.data = this.createSeries(series.fields);
                initializeSeries(series);           

                for (var i=0; i<series.fields.length; i++) {
                    wrappers[series.fields[i]] = this.getSeriesWrapper(series.seriesId+':'+series.fields[i]);
                }
            }
            else if(type === 'tooltipSeries'){
                var series: FusionRecord = JSON.parse(JSON.stringify(scriptProto.outputs[key].series));              
                series.data = this.createTooltipSeries(series.fields);
                initializeSeries(series);
                for (var i=0; i<series.fields.length; i++) {
                    wrappers[series.fields[i]] = this.getTooltipSeriesWrapper(series.seriesId+':'+series.fields[i]);
                }
            }
        }

        //Create Script Instance
        var scriptController = scriptProto.controller(this, scriptModel.inputs, scriptModel.outputs);
        scriptController.id = scriptModel.id;
        for (var key in wrappers) {
            scriptController[key] = wrappers[key];
        }
        this.scriptsManager[String(scriptModel.id)] = scriptController;
    }


	this.getSeriesWrapper = function (this: any, seriesLink: string) {
        var spl = seriesLink.split(':');

        var self = this;

        var wrapper = {
            getValue: function (index: number) {
                const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                if (index < 0) return null;
                if (index >= data.length) return null;
                return data[index][spl[1]];
            },
            setValue: function (index: number, value: any) {
                function pushEmptyValues(number: number) {
                    const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                    var lastValue = JSON.parse(JSON.stringify(data[data.length - 1]));
                    const mainSeries = self.getMainSeries();
                    let milis = 1;
                    if (mainSeries && mainSeries.interval && mainSeries.interval.milis && mainSeries.interval.milis > 0)
                        milis = mainSeries.interval.milis;
    
                    for (let i = 0; i < number; ++i) { 
                        const value = {
                          stamp: lastValue.stamp + (i + 1) * milis
                        };

                        data.push(value);
                    }
                }

                const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                const lastIndex = data.length - 1;
                if (index > lastIndex) pushEmptyValues(index - lastIndex);

                data[index][spl[1]] = value;
            },
            getStrength: function (index: number) {
                const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                if(index < 0) return undefined;
                return data[index]['strength'];
            },
            setStrength: function (index: number, value: any) {
                const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                data[index]['strength'] = value;
            },
            getSeriesLength: function () {
                const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                return data.length;
            },
            getStamp: function(index: number){
                const data = self.seriesManager[spl[0]].data as FusionSeriesData;
                if(index < 0) return undefined;
                return data[index].stamp;
            },
            getSeriesId: function(){
                return self.seriesManager[spl[0]].seriesId;
            }
        }

        return wrapper;

    }

    this.getTooltipSeriesWrapper = function (this: any, seriesLink: string) {    
        var self = this;
        var spl = seriesLink.split(':');
        var wrapper = this.getSeriesWrapper(seriesLink);
        var series = self.seriesManager[spl[0]].data as FusionSeriesData;

        function pushEmptyValues(number: number) {
            var lastValue = JSON.parse(JSON.stringify(series[series.length - 1]));
            const mainSeries = self.getMainSeries();
            let milis = 1;
            if (mainSeries && mainSeries.interval && mainSeries.interval.milis && mainSeries.interval.milis > 0)
                milis = mainSeries.interval.milis;

            for (let i = 0; i < number; ++i) { 
                const value = {
                  stamp: lastValue.stamp + (i + 1) * milis,
                  strength: 1,
                  tooltips: []
                };
                series.push(value);
            }
        }

        wrapper.clearTooltips = function(index: number) {
            const lastIndex = series.length - 1;
            if (index > lastIndex) pushEmptyValues(index - lastIndex);
            series[index].tooltips = [];
        }

        wrapper.setTooltip = function(index: number, key: string, value: any){
            const lastIndex = series.length - 1;
            if (index > lastIndex) pushEmptyValues(index - lastIndex);
            series[index].tooltips[key] = value;
        }
        wrapper.getTooltip = function(index: number, key: string) {
            if (index < 0) return null;
            if (index > series.length - 1) return null;
            return series[index].tooltips[key];
        }
        return wrapper;
    }

    this.getRawSeriesWrapper = function (this: any, series: FusionSeriesData, field: string) {

        var self = this;

        var wrapper = {
            getValue: function (index: number) {
                if (index<0) return null;
                if (index>series.length-1) return null;
                return series[index][field];
            },
            setValue: function (index: number, value: any) {
                function pushEmptyValues(number: number) {
                    var lastValue = JSON.parse(JSON.stringify(series[series.length - 1]));
                    const mainSeries = self.getMainSeries();
                    let milis = 1;
                    if (mainSeries && mainSeries.interval && mainSeries.interval.milis && mainSeries.interval.milis > 0)
                        milis = mainSeries.interval.milis;
    
                    for (let i = 0; i < number; ++i) { 
                        const value = {
                          stamp: lastValue.stamp + (i + 1) * milis
                        };
                        series.push(value);
                    }
                }
                if (index < 0)
                    return;

                var lastIndex = series.length - 1;
                if (index > lastIndex) pushEmptyValues(index - lastIndex);

                series[index][field] = value;
            },
            getStamp: function(index: number){
                return series[index].stamp;
            },
            
            getSeriesLength: function(){
            	return series.length;
            },
            getSeriesId: function(){
                return (series as FusionRecord).seriesId;
            }
        }

        return wrapper;

    }

    this.getId = function (this: any){
        return this.model.id;
    }

    this.getModel = function (this: any){
        return this.model;
    }

    this.getValue = function (this: any, series: string, i: number, field?: string) {

        if (field) return this.seriesManager[series].data[i][field];

        var spl = series.split(':');
        return this.seriesManager[spl[0]].data[i][spl[1]];

    }

    this.setValue = function (this: any, series: string, i: number, value: any, field?: string) {

        if (field) this.seriesManager[series].data[i][field] = value;

        var spl = series.split(':');
        this.seriesManager[spl[0]].data[i][spl[1]] = value;

    }

    this.initAll = function (this: any) {
        for (var key in this.model.scripts) { //w modelu skrypty są w kolejności!!! wrappery już nie koniecznie
            const scriptConfig = this.model.scripts[key] as RuntimeScriptConfig;
            this.scriptsManager[String(scriptConfig.id)].init();
        }
    }

    this.shortSynchronization = function (this: any){
        var seriesManager = this.getSeriesManager();
        var longest = null;
        for(var key in seriesManager){
            if (seriesManager.hasOwnProperty(key) && seriesManager[key].instrument) {
                if(!longest || seriesManager[key].data.length > longest.data.length){
                    longest = seriesManager[key];
                }
            }
        }
        for(var key in seriesManager){
            if (seriesManager.hasOwnProperty(key) && seriesManager[key].data && seriesManager[key].data.length > 0) {
                while(seriesManager[key].data.length < longest.data.length){
                    var last = seriesManager[key].data[seriesManager[key].data.length-1];
                    var next = JSON.parse(JSON.stringify(last));
                    if (next['c'] != null && next['c'] != undefined){
                        next['o'] = next['c'];
                        next['h'] = next['c'];
                        next['l'] = next['c'];
                        next['v'] = null;
                        next['i'] = null;
                    }

                    next.stamp = longest.data[seriesManager[key].data.length].stamp
                    seriesManager[key].data.push(next);
                }
            }
        }

    }

    this.fullSynchronization = function (this: any){
        var model = this.model;
        var seriesManager = this.getSeriesManager();

        if(model.instrumentsSeries.length <1 ) return; //synchronization not needed
        if(!this.isLoaded()){
            throw "Can't synchronize unloaded series! Load it first!";
        }

        var l = 1;
        var stampIndex: Record<string, FusionRecord> = {};
        var stamps: Record<string, number> = {};

        for(var s in model.instrumentsSeries){
            var id = model.instrumentsSeries[s].seriesId;
            var series = seriesManager[id];
            if (!series || !series.data) continue;
            model.instrumentsSeries[s].instrument = JSON.parse(JSON.stringify(series.instrument));
            const seriesData = series.data as FusionSeriesData;
            if(seriesData.length > l) l = seriesData.length;

            stampIndex[id]={};
            for(var idx in seriesData){
                stampIndex[id][seriesData[idx].stamp] = idx;
                stamps[seriesData[idx].stamp] = seriesData[idx].stamp;
            }
        }

        var stampsArray = Object.keys(stamps).sort(
            function(a: string,b: string){
                var n1  = parseInt(a);
                var n2	= parseInt(b);
                return n1 - n2;
            });

        let lastValue: Record<string, FusionRecord> = {};

        for (var index = 0 ; index < stampsArray.length; index++) {
            const stamp = stampsArray[index];

            for (var s in model.instrumentsSeries) {
                const id = model.instrumentsSeries[s].seriesId;
                const series = seriesManager[id];
                if (!series || !series.data) continue;
                const seriesData = series.data as FusionSeriesData;

                if (seriesData.length === 0) continue;

                const value = seriesData[index];
                const isValueMissing = !value || !value.stamp || value.stamp != stamp;
                const isValueEmpty = value && !value.o;

                if (!isValueMissing && !isValueEmpty) {
                    lastValue[id] = seriesData[index];
                    continue;
                }

                const candle: FusionRecord = lastValue[id]
                    ? {
                        c: lastValue[id].c,
                        h: lastValue[id].c,
                        l: lastValue[id].c,
                        o: lastValue[id].c,
                        stamp: Number(stamp),
                        v: null,
                        i: null,
                    }
                    : {
                        c: null,
                        h: null,
                        l: null,
                        o: null,
                        stamp: Number(stamp),
                        v: null,
                        i: null,
                    };

                if (isValueEmpty) seriesData[index] = candle;
                else seriesData.splice(index, 0, candle);
            }
        }
    }
    
    this.setPositions = function (this: any, positionsSeries: FusionSeriesData){
    	var self = this;
    	var mainSeriesId = this.getMainSeries().seriesId;
        var series: FusionRecord = {
    			seriesId: positionsSeriesId,
    			data: [],
    			fields: ["position"],
            interval: this.getMainSeries().interval,
    			title: "Market positions",
    			labels: ["Market position"]
    	}
        series.data = (this.seriesManager[mainSeriesId].data as FusionSeriesData).map(function(e: FusionRecord){
    		return {"stamp": e.stamp, "position":null, "instrumentId": self.getMainSeries().instrument.id}
    	})

        positionsSeries.sort(function(a: FusionRecord,b: FusionRecord){
    		if (a.stamp < b.stamp)
    		      return -1
    		   if (a.stamp > b.stamp)
    		      return 1
    		   return 0
    	})
    	
    	var lastDataIdx = 0;
    	//synch
        positionsSeries.forEach(function(p: FusionRecord, _i: number){
    		for(var i =lastDataIdx;i<series.data.length;i++){
    			if(series.data[i].stamp <= p.stamp)
    				lastDataIdx = i;
    			else{
    				series.data[lastDataIdx].position = p.positionSize;
    				lastDataIdx = i;
    				break;
    			}
    		}
    	});

    	//fill nulls
    	for(var i =0;i<series.data.length;i++){
    		if(series.data[i].position == null){
    			if(i==0)
    				series.data[i].position = 0;
    			else
    				series.data[i].position = series.data[i-1].position;
    		}
    	}
    	
        this.seriesManager[series.seriesId] = series as FusionSeriesRuntime;
    	
    }
    
    this.isPositionsSeries = function (this: any){
    	return this.seriesManager[positionsSeriesId]!=null && 
    		this.seriesManager[positionsSeriesId].data!=null && 
    		this.seriesManager[positionsSeriesId].data.length >0; 
    }
    
    this.getPositions = function (this: any){
    	return this.seriesManager[positionsSeriesId]; 
    }

    this.calculateAll = function (this: any) {
        // console.log('##################################FUSION CALCULATE ALL#####################################');
        for (var key in this.model.scripts) { //w modelu skrypty są w kolejności!!! wrappery już nie koniecznie
            const scriptConfig = this.model.scripts[key] as RuntimeScriptConfig;
            var script = this.scriptsManager[String(scriptConfig.id)];
            this.calculate(script, this.getMainSeries());

            for( var output in script.outputs){
                var series = this.seriesManager[script.outputs[output]];
                const fields = (series.fields || []) as string[];
                for(var f in fields){
                    var outWrap = script[fields[f]];
                    var lastIdx = outWrap.getSeriesLength()-1;
                    var secondLastIdx = outWrap.getSeriesLength()-2;
                    // console.log("FUSION: " + this.getMainSeries().title + ":" + series.data[lastIdx].stamp + ":" +series.fields[f]+ " "
                    //     + "...," + outWrap.getValue(secondLastIdx) + "," + outWrap.getValue(lastIdx));
                }
            }
        }
    }

    this.calculate = function (this: any, script: FusionScriptControllerRuntime, mainSeries: FusionSeriesRuntime) {
        const mainSeriesData = (mainSeries.data || []) as FusionSeriesData;
        var maxLength = mainSeriesData.length;
        for (var key in script.inputs) {
            const inputName = script.inputs[key];
            const isSeries = typeof inputName === 'string' && this.seriesManager[inputName.split(':')[0]];

            if (isSeries) try {
                const spl = inputName.split(':');
                const inputSeries = this.seriesManager[spl[0]];
                const seriesLength = inputSeries && inputSeries.data ? inputSeries.data.length : 0;

                if (seriesLength > maxLength) {
                    maxLength = seriesLength;
                }
            } catch (e) {
                console.log(e);
            }
        }
        for (let i = 0; i < maxLength; i++) {
            script.calculate(i);
        }
    }

    this.modifyScript = function (this: any, s: RuntimeScriptConfig){

        var scriptProto = FUSION.scripts[s.key] as RuntimeScriptDefinition | undefined;
        if (scriptProto==null) return;

        if(s.permHide) s.visible = false;

        //modify inputs values
        var wrappers: Record<string, any> = {};
        for (var key in s.inputs) {

            if (scriptProto.inputs[key].type=='series') {
                wrappers[key] = this.getSeriesWrapper(s.inputs[key]);
            } else if (scriptProto.inputs[key].type=='conditional' && s.inputs[key]['type']=='series') {
                wrappers[key] = this.getSeriesWrapper(s.inputs[key]['value']);
            }
            else {
                wrappers[key] = s.inputs[key];
            }

            for(var i in this.model.scripts){
                if(this.model.scripts[i].id == s.id){
                    const modelScript = this.model.scripts[i] as RuntimeScriptConfig;
                    modelScript.inputs[key] = s.inputs[key];
                    break;
                }
            }
        }
        var scriptInstance = this.scriptsManager[String(s.id)];
        for(var id in scriptInstance.outputs){
            var scriptSeries = this.seriesManager[scriptInstance.outputs[id]];
            scriptSeries.userName = s.userName;
            scriptSeries.data = this.createSeries((scriptSeries.fields || []) as string[]);
        }
        if(scriptInstance.onModify) scriptInstance.onModify();
        for (var key in wrappers) {
            scriptInstance[key] = wrappers[key];
        }
    }

    this.addScript = function (this: any, config: any) {

        //Create script id
        config.id = FUSION.uniqueId();

        //Create output ids
        config['outputs'] = {};
        var proto = JSON.parse(JSON.stringify(FUSION.scripts[config.key]));
        for (var key in proto.outputs) {
            config.outputs[key] = FUSION.uniqueId();
        }
        config.permHide = proto.permHide;
        config.visible = proto.permHide==true ? false : config.visible;
        this.configureScript(config);

        this.model.scripts.push(config);
        this.scriptsManager[String(config.id)].init();
    }
    
    this.clearSeriesData = function (this: any){
        if(this.seriesManager){
            for(var k in this.seriesManager){
                if(this.seriesManager[k].data)
                    this.seriesManager[k].data = null;
            }
        }
    }

    this.getMainSeries = function (this: any){
        if(this.model && this.model.instrumentsSeries && this.model.instrumentsSeries.length >0){
            var id = this.model.instrumentsSeries[0].seriesId;
            return this.seriesManager[id];
        }

        if(this.model.mainSeries && this.seriesManager[this.model.mainSeries])
            return this.seriesManager[this.model.mainSeries];

        return null as unknown as FusionSeriesRuntime;
    }

    this.getScriptsManager = function (this: any){
        return this.scriptsManager;
    }

    this.getSeriesManager = function (this: any){
        return this.seriesManager;
    }

    this.getSeriesManagerSnapshot = function (this: any){
        var snapshot: Record<string, FusionRecord> = {};
        var index = this.getMainSeriesLastIndex();
        for(var id in this.seriesManager){
            var series = this.seriesManager[id];
            snapshot[id] = {
                seriesId: series.seriesId,
                fields: series.fields,
                title: series.title,
                labels: series.labels,
                data: []
            };
            snapshot[id].data.push(series.data[index]);

            if(series.instrument) snapshot[id].instrument = series.instrument;
            if(series.interval)	snapshot[id].interval = series.interval;
        }
        return snapshot;

    }

    this.getMainSeriesLastIndex = function (this: any){
        return this.getMainSeries().data.length-1;
    }

    this.getSeriesById = function (this: any, seriesId: any){
        return this.seriesManager[seriesId];
    }

    this.isLoaded = function (this: any){
        for(var k in this.seriesManager){
            if(this.seriesManager[k].instrument && (!this.seriesManager[k].data || !Array.isArray(this.seriesManager[k].data)))
                return false;
        }
        return true;
    }

    this.areAllSeriesEmpty = function (this: any) {
        for(var k in this.seriesManager){
            if(this.seriesManager[k].data && Array.isArray(this.seriesManager[k].data) && this.seriesManager[k].data.length !== 0)
               return false;
        }
        return true;
    }

    this.getEmptyInstrumentSeries = function (this: any) {
        const emptySeries: Record<string, FusionSeriesRuntime> = {};

        for(const k in this.seriesManager){
            const series = this.seriesManager[k];
            if(series.instrument && (!series.data || !Array.isArray(series.data) || series.data.length === 0))
               emptySeries[k] = this.seriesManager[k];
        }
        return emptySeries; 
    }
} as unknown as CoreFusionStatic["engine"];

FUSION.loader = function(this: CoreFusionLoader){
    var self = this;
    this.loaded = {};

    this.loadFusionData = function (this: any, engine: any, onSuccess: any, onError: any){
        engine.clearSeriesData();

        var interval = engine.model.interval || engine.model.instrumentsSeries[0].interval;

        for(var k in engine.model.instrumentsSeries){
            var is = engine.model.instrumentsSeries[k];
            load(is.instrument, interval, this,
                function(data: FusionRecord){
                    setData(engine, data);
                    onSuccess(engine, data);
                },
                (error: FusionRecord) => {
                    error.instrument = is.instrument;
                    onError(error);
                })
        }
    }

    function setData(engine: CoreFusionRuntime, data: FusionRecord){
        var sm = engine.getSeriesManager();
        const modelInterval = engine.model.interval as FusionRecord | null;

        if(modelInterval && modelInterval.symbol == data.interval.symbol){
            for(var k in sm){
                const seriesInstrument = sm[k].instrument;
                if(seriesInstrument && seriesInstrument.id == data.instrument.id){
                    sm[k].data = JSON.parse(JSON.stringify(data.candles));
                    sm[k].title = data.instrument.symbol;
                    sm[k].instrument = data.instrument;
                    sm[k].interval = data.interval;
                }
            }
        }
    }

    function load(instrument: FusionRecord, interval: FusionRecord, loader: CoreFusionLoader, onSuccess: (data: FusionRecord) => void, onError: (error: any) => void){
        loader.loaded[interval.symbol] = loader.loaded[interval.symbol] || {};

        if(loader.loaded[interval.symbol][instrument.id]){
            onSuccess(loader.loded[interval.symbol][instrument.id]);
        }else{
            SERVICES.datasource.loadInstrumentCandles(instrument, interval.symbol, null, null,
                function (data: FusionRecord) {
                    loader.loaded[interval.symbol][instrument.id] = data;
                    onSuccess(loader.loaded[interval.symbol][instrument.id]);
                },
                function(errorMessage: any){
                    onError(errorMessage);
                });
        }
    }

    this.loadFusionDataHistoric = function (this: any, engine: any, onSuccess: any, onError: any){
        var interval = engine.model.interval || engine.model.instrumentsSeries[0].interval;
        var toStamp = engine.getSeriesManager()[engine.model.instrumentsSeries[0].seriesId].data[0].stamp - 1;
        var instrumentsToLoad = [];

        for (var k in engine.model.instrumentsSeries) {
            instrumentsToLoad.push(engine.model.instrumentsSeries[k].instrument);
        }

        loadHistoric(instrumentsToLoad, interval, toStamp, this,
            function(data: FusionRecord){
                setDataHistoric(engine, data, toStamp);
                onSuccess(engine, data);
            }, onError)

    }

    function setDataHistoric(engine: CoreFusionRuntime, _data: Record<string, FusionRecord>, toStamp: number) {
        const sm = engine.getSeriesManager();
        const modelInterval = engine.model.interval as FusionRecord | null;

        for (const id in _data) {
            if (modelInterval && modelInterval.symbol === _data[id].interval.symbol) {
                const data = _data[id];
                for (const k in sm) {
                    const seriesInstrument = sm[k].instrument;
                    if (seriesInstrument && seriesInstrument.id === data.instrument.id) {
                        const history = data.candles.filter((c: FusionRecord) => c.stamp <= toStamp);
                        const joined = history.concat((sm[k].data || []) as FusionSeriesData);
                        const map = new Map<number, FusionRecord>();
                        
                        joined.forEach((c: FusionRecord) => map.set(c.stamp, c));
                        sm[k].data = Array.from(map.values());
                    }
                }
            }
        }
    }

    function loadHistoric(instruments: FusionRecord[], interval: FusionRecord, toStamp: number, loader: CoreFusionLoader, onSuccess: (data: FusionRecord) => void, onError: (error: any) => void) {
        SERVICES.datasource.loadCandlesHistory(2000, interval.symbol, null, toStamp, instruments,
            //some cache ???
            function (data: FusionRecord) {
                onSuccess(data);
            },
            function (errorMessage: any) {
                onError(errorMessage);
            });

    }

    //metoda KUBY dla charta
    this.loadHistory = function (this: any, engine: any, onSuccess: any, onError: any){
        var model = engine.model;
        var instruments = [];
        for(var series in model.instrumentsSeries){
            instruments.push(model.instrumentsSeries[series].instrument);
        }
        var toStamp = engine.getSeriesManager()[model.instrumentsSeries[0].seriesId].data[0].stamp - 1;
        SERVICES.datasource.loadCandlesHistory(2000, model.interval.symbol, null, toStamp, instruments, onSuccess, onError);
    }
} as unknown as CoreFusionStatic["loader"];


/*
 * ENGINE BUILDER
 */
FUSION.builder = function(this: CoreFusionBuilder, engine: CoreFusionRuntime | null){
    var self = this;

    this._engine = engine ? engine : null;
    this._instrumentsToAdd = [];
    this._instrumentsToReplace = [];

    this._interval = null;
    this._scripts = [];
    this._series = [];

    this._model = {
        interval: null,
        instrumentsSeries: [],
        scripts:[]
    };

    this.setModel = function (this: any, model: any){
        this._model = model;
        return this;
    }

    this.addInstrument = function (this: any, instrument: any, seriesId: any){
        this._instrumentsToAdd.push({instrument:instrument, seriesId: seriesId});
        return this;
    }

    this.replaceInstrumentByOther = function (this: any, oldInstrument: any, newInstrument: any, withRelated: any){
        this._instrumentsToReplace.push({old: oldInstrument, new: newInstrument, withRelated: withRelated});
        return this;
    }

    this.setInterval = function (this: any, interval: any){
        this._interval = interval;
        return this;
    }

    this.addScript = function (this: any, script: any, pos: any){
        if(pos==null || pos == undefined)
            this._scripts.push(script);
        else
            this._scripts.splice(pos, 0 , script);
        return this;
    }

    this.addSeries = function (this: any, series: any){
        this._series.push(series);
        return this;
    }

    this.build = function (this: any): CoreFusionRuntime {
        var self = this;
        var engine: CoreFusionRuntime;
        var model: FusionModelRuntime;

        if(!self._model && !self._engine)
            throw new FusionBuilderException("Give me some model or primal engine by builder param ", null);


        if(self._engine){
            engine = self._engine as CoreFusionRuntime;
            model = engine.model;
        }else{
            engine = new (FUSION.engine as CoreFusionStatic["engine"])();
            model = self._model;
        }

        prepareModel(engine);

        return engine;

        function prepareModel(engine: CoreFusionRuntime){
            //set interval - default if none
            if(self._interval) model.interval = self._interval;

            //add instruments
            for(var k in self._instrumentsToAdd){
                if(!containsInstrument(self._instrumentsToAdd[k].instrument, model)){
                    var id =  self._instrumentsToAdd[k].seriesId || FUSION.uniqueId();
                    var newSeries = createOhlcvModel(id, self._instrumentsToAdd[k].instrument, model.interval);
                    model.instrumentsSeries.push(newSeries);
                }
            }

            //replace instrument
            for(var k in self._instrumentsToReplace){
                var oldInstrumentSeries = containsInstrument(self._instrumentsToReplace[k].old, model);
                if(oldInstrumentSeries){

                    //first find related instruments - some fundametals?
                    if(self._instrumentsToReplace[k].withRelated === true){
                        var related = findInstrumentSeriesRelatedTo(oldInstrumentSeries.instrument, model);
                        //find coresponding related from new instrument
                        for(var r in related){
                            var newRelated = getInstrumentsRelatedFromBaseInstrumentByRelatedKey(self._instrumentsToReplace[k]['new'], related[r].instrument.relatedKey);
                            if(newRelated){
                                related[r].instrument = newRelated;
                                related[r].title = newRelated.symbol + "."+newRelated.name;
                            }
                        }
                    }

                    oldInstrumentSeries.instrument = self._instrumentsToReplace[k]['new'];
                    oldInstrumentSeries.title = self._instrumentsToReplace[k]['new'].symbol;
                    delete oldInstrumentSeries.data;


                }
            }

            model.scripts = model.scripts.concat(self._scripts);
            model.id = model.id || FUSION.uniqueId();
            engine.model = model;

            mergeScriptInputObjectsWithObjects(engine.model);

            //seriesId
            //register instrument series to manager
            var _tmp = null;
            if(self._engine){
                _tmp = engine.seriesManager;
            }

            engine.seriesManager = {};

            for (var k in engine.model.instrumentsSeries) {
                const series = engine.model.instrumentsSeries[k];

                engine.seriesManager[series.seriesId] = JSON.parse(JSON.stringify(series));
                delete series.data;  //no data in model!

                if(_tmp && _tmp[engine.model.instrumentsSeries[k].seriesId]){
                    const previousSeries = _tmp[engine.model.instrumentsSeries[k].seriesId];
                    if(previousSeries && previousSeries.instrument && previousSeries.instrument.id == engine.model.instrumentsSeries[k].instrument.id){
                        engine.seriesManager[engine.model.instrumentsSeries[k].seriesId].data = previousSeries.data;
                    }
                }
            }

            engine.model.mainSeries = engine.getMainSeries() ? engine.getMainSeries().seriesId : null;

            for(var i in self._series){
                engine.seriesManager[self._series[i].seriesId] = JSON.parse(JSON.stringify(self._series[i]));
            }
        }
    }

    class FusionBuilderException {
        model: FusionModelRuntime | null;
        message: string;

        constructor(message: string, model: FusionModelRuntime | null) {
            this.model = model;
            this.message = message;
        }
    }


    function mergeScriptInputObjectsWithObjects(model: FusionModelRuntime){
        model.scripts.forEach((s: FusionRecord) => {
            if(s.key === "OBJECT"){
                const id = s.inputs["OBJECT"].id;
                const o = findObjectById(model,id);
                if(o) s.inputs["OBJECT"] = o;               
            }
        });
    }

    function findObjectById(model: FusionModelRuntime, id: string | number){
        var obj: FusionRecord | null = null;
        if (!model.panels) return null;
        model.panels.forEach((panel: FusionRecord) => {
           panel.objects.forEach((o: FusionRecord) =>{
              if(o.id === id)
                obj = o; 
           }); 
        });
        return obj;
    }



    function createOhlcvModel(id: string, instrument: FusionRecord, interval: FusionRecord | null | undefined){
        var res = {
            seriesId: id,
            title: (instrument.relatedKey ? instrument.symbol+"."+instrument.name : instrument.symbol),
            labels: ['O', 'H', 'L', 'C', 'V', 'I'],
            fields: ['o', 'h', 'l', 'c', 'v', 'i'],
            data: null,
            instrument: instrument,
            interval: interval,
        }
        //deep clone
        return JSON.parse(JSON.stringify(res));
    }

    function containsInstrument(instrument: FusionRecord, model: FusionModelRuntime){
        for(var i in model.instrumentsSeries){
            if(model.instrumentsSeries[i] && model.instrumentsSeries[i].instrument.id == instrument.id)
                return model.instrumentsSeries[i];
        }
        return false;
    }

    function findInstrumentSeriesRelatedTo(instrument: FusionRecord, model: FusionModelRuntime){
        var related: FusionRecord[] = [];
        for(var i in model.instrumentsSeries){
            for(var j in instrument.related){
                if(instrument.related[j].id == model.instrumentsSeries[i].instrument.id){
                    related.push(model.instrumentsSeries[i]);
                    break;
                }
            }
        }
        return related;
    }

    function getInstrumentsRelatedFromBaseInstrumentByRelatedKey(instrument: FusionRecord, key: string){
        for(var j in instrument.related){
            if(instrument.related[j].relatedKey == key){
                return instrument.related[j];
            }
        }
        return null;
    }

    function containsSeries(seriesId: string, model: FusionModelRuntime){
        for(var i in model.instrumentsSeries){
            if(model.instrumentsSeries[i] && model.instrumentsSeries[i].seriesId == seriesId)
                return model.instrumentsSeries[i];
        }
        return false;
    }

    function deleteInstrumentSeriesById(seriesId: string, model: FusionModelRuntime){
        for(var c = 0; c < model.instrumentsSeries.length; c++){
            if( model.instrumentsSeries[c].seriesId == seriesId){
                model.instrumentsSeries.splice(c, 1);
                return true;
            }
        }
        return false;
    }
} as unknown as CoreFusionStatic["builder"];

export default FUSION;