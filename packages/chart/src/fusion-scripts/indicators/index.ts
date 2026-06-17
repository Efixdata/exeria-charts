import type { CoreFusionStatic } from "../../internal-types/fusion";
import createMACDIndicatorScript from "./MACD";
import createWMAIndicatorScript from "./WMA";
import createHMAIndicatorScript from "./HMA";
import createHeikinAshiIndicatorScript from "./HeikinAshi";
import createBBANDIndicatorScript from "./BBAND";
import createATRIndicatorScript from "./ATR";
import createADXIndicatorScript from "./ADX";
import createHLINEIndicatorScript from "./HLINE";
import createSMAIndicatorScript from "./SMA";
import createEMAIndicatorScript from "./EMA";
import createCCIIndicatorScript from "./CCI";
import createCEXIndicatorScript from "./CEX";
import createCHAIKINIndicatorScript from "./CHAIKIN";
import createDIRMOVIndicatorScript from "./DIRMOV";
import createENVELOPEIndicatorScript from "./ENVELOPE";
import createMINUSDIIndicatorScript from "./MINUSDI";
import createMOMENTUMIndicatorScript from "./MOMENTUM";
import createOPENINTIndicatorScript from "./OPENINT";
import createVOLUMEIndicatorScript from "./VOLUME";
import createPARSARIndicatorScript from "./PARSAR";
import createPLUSDIIndicatorScript from "./PLUSDI";
import createTRENDIndicatorScript from "./TREND";
import createROCIndicatorScript from "./ROC";
import createRSIIndicatorScript from "./RSI";
import createSMIIndicatorScript from "./SMI";
import createSTOCHASTICOSCILLATORIndicatorScript from "./STOCHASTICOSCILLATOR";
import createUltimateOSCIndicatorScript from "./Ultimate_OSC";
import createEQUITYIndicatorScript from "./EQUITY";
import createICHIMOKUIndicatorScript from "./ICHIMOKU";
import createTRADINGTIMEFRAMEIndicatorScript from "./TRADINGTIMEFRAME";
import createMMAIndicatorScript from "./MMA";
import createDPOIndicatorScript from "./DPO";
import createDMAIndicatorScript from "./DMA";
import createDINAPOLIDETRENDOSCILLATORIndicatorScript from "./DINAPOLIDETRENDOSCILLATOR";
import createDINAPOLI3X3IndicatorScript from "./DINAPOLI3X3";
import createDINAPOLIPREFERREDSTOCHASTICIndicatorScript from "./DINAPOLIPREFERREDSTOCHASTIC";
import createDINAPOLIMACDIndicatorScript from "./DINAPOLIMACD";
import createDINAPOLIMACDPREDICTORIndicatorScript from "./DINAPOLIMACDPREDICTOR";
import createDOPIndicatorScript from "./DOP";
import createFORWARDIndicatorScript from "./FORWARD";
import createFORECASTIndicatorScript from "./FORECAST";
import createVARBANDSIndicatorScript from "./VARBANDS";
import createDECISIONLONGBUYIndicatorScript from "./DECISIONLONGBUY";
import createDECISIONLONGSELLIndicatorScript from "./DECISIONLONGSELL";
import createDECISIONSHORTBUYIndicatorScript from "./DECISIONSHORTBUY";
import createDECISIONSHORTSELLIndicatorScript from "./DECISIONSHORTSELL";
import createSIGNALDISTANCEIndicatorScript from "./SIGNALDISTANCE";
import createACCUMULATIONIndicatorScript from "./ACCUMULATION";
import createPRICELEVELSIndicatorScript from "./PRICELEVELS";
import createOBVIndicatorScript from "./OBV";
import createADLIndicatorScript from "./ADL";
import createCMFIndicatorScript from "./CMF";
import createNVIIndicatorScript from "./NVI";
import createPVIIndicatorScript from "./PVI";
import createZIGZAGIndicatorScript from "./ZIGZAG";
import createPIVOTPOINTSIndicatorScript from "./PIVOTPOINTS";
import createPIVOTPOINTSHLIndicatorScript from "./PIVOTPOINTSHL";
import createWILLIAMSPERCENTRANGEIndicatorScript from "./WILLIAMSPERCENTRANGE";
import createFORCEINDEXIndicatorScript from "./FORCEINDEX";
import createKELTNERCHANNELIndicatorScript from "./KELTNERCHANNEL";
import createDONCHIANCHANNELIndicatorScript from "./DONCHIANCHANNEL";
import createMASSINDEXIndicatorScript from "./MASSINDEX";
import createTRIPLEEMAIndicatorScript from "./TRIPLEEMA";
import createVOLUMEOSCILLATORIndicatorScript from "./VOLUMEOSCILLATOR";
import createVOLUMEROCIndicatorScript from "./VOLUMEROC";
import createALMAIndicatorScript from "./ALMA";
import createAROONIndicatorScript from "./AROON";
import createAWESOMEOSCILLATORIndicatorScript from "./AWESOMEOSCILLATOR";
import createBALANCEOFPOWERIndicatorScript from "./BALANCEOFPOWER";
import createBBANDSPERCENTIndicatorScript from "./BBANDSPERCENT";
import createBBANDSWIDTHIndicatorScript from "./BBANDSWIDTH";
import createCHAIKINOSCILLATORIndicatorScript from "./CHAIKINOSCILLATOR";
import createCHANDEKROLLSTOPIndicatorScript from "./CHANDEKROLLSTOP";
import createCHANDEMOMENTUMOSCILLATORIndicatorScript from "./CHANDEMOMENTUMOSCILLATOR";
import createCHOPPINESSINDEXIndicatorScript from "./CHOPPINESSINDEX";
import createCONNORSRSIIndicatorScript from "./CONNORSRSI";
import createCOPPOCKCURVEIndicatorScript from "./COPPOCKCURVE";
import createCORRELATIONCOEFFICIENTIndicatorScript from "./CORRELATIONCOEFFICIENT";
import createDOUBLEEMAIndicatorScript from "./DOUBLEEMA";
import createEASEOFMOVEMENTIndicatorScript from "./EASEOFMOVEMENT";
import createELDERSFORCEINDEXIndicatorScript from "./ELDERSFORCEINDEX";
import createFISHERTRANSFORMIndicatorScript from "./FISHERTRANSFORM";
import createHISTORICALVOLATILITYIndicatorScript from "./HISTORICALVOLATILITY";
import createNETVOLUMEIndicatorScript from "./NETVOLUME";
import createTSIIndicatorScript from "./TSI";
import createVORTEXINDICATORIndicatorScript from "./VORTEXINDICATOR";
import createVWMAIndicatorScript from "./VWMA";
import createWILLIAMSALLIGATORIndicatorScript from "./WILLIAMSALLIGATOR";
import createWILLIAMSFRACTALSIndicatorScript from "./WILLIAMSFRACTALS";
import createNEWSFEEDIndicatorScript from "./NEWSFEED";
import createOC2IndicatorScript from "./OC2";
import createHL2IndicatorScript from "./HL2";
import createHLC3IndicatorScript from "./HLC3";
import createOHLC4IndicatorScript from "./OHLC4";
import createSTANDARDDEVIATIONIndicatorScript from "./STANDARDDEVIATION";
import createSHARPERATIOIndicatorScript from "./SHARPERATIO";
import createRORIndicatorScript from "./ROR";
import createINFORMATIONRATIOIndicatorScript from "./INFORMATIONRATIO";

export function createFusionIndicatorScripts(FUSION: CoreFusionStatic) {
  return {
    MACD: createMACDIndicatorScript(FUSION),
    WMA: createWMAIndicatorScript(FUSION),
    HMA: createHMAIndicatorScript(FUSION),
    HeikinAshi: createHeikinAshiIndicatorScript(FUSION),
    BBAND: createBBANDIndicatorScript(FUSION),
    ATR: createATRIndicatorScript(FUSION),
    ADX: createADXIndicatorScript(FUSION),
    HLINE: createHLINEIndicatorScript(FUSION),
    SMA: createSMAIndicatorScript(FUSION),
    EMA: createEMAIndicatorScript(FUSION),
    CCI: createCCIIndicatorScript(FUSION),
    CEX: createCEXIndicatorScript(FUSION),
    CHAIKIN: createCHAIKINIndicatorScript(FUSION),
    DIRMOV: createDIRMOVIndicatorScript(FUSION),
    ENVELOPE: createENVELOPEIndicatorScript(FUSION),
    MINUSDI: createMINUSDIIndicatorScript(FUSION),
    MOMENTUM: createMOMENTUMIndicatorScript(FUSION),
    OPENINT: createOPENINTIndicatorScript(FUSION),
    VOLUME: createVOLUMEIndicatorScript(FUSION),
    PARSAR: createPARSARIndicatorScript(FUSION),
    PLUSDI: createPLUSDIIndicatorScript(FUSION),
    TREND: createTRENDIndicatorScript(FUSION),
    ROC: createROCIndicatorScript(FUSION),
    RSI: createRSIIndicatorScript(FUSION),
    SMI: createSMIIndicatorScript(FUSION),
    STOCHASTICOSCILLATOR: createSTOCHASTICOSCILLATORIndicatorScript(FUSION),
    Ultimate_OSC: createUltimateOSCIndicatorScript(FUSION),
    EQUITY: createEQUITYIndicatorScript(FUSION),
    ICHIMOKU: createICHIMOKUIndicatorScript(FUSION),
    TRADINGTIMEFRAME: createTRADINGTIMEFRAMEIndicatorScript(FUSION),
    MMA: createMMAIndicatorScript(FUSION),
    DPO: createDPOIndicatorScript(FUSION),
    DMA: createDMAIndicatorScript(FUSION),
    DINAPOLIDETRENDOSCILLATOR: createDINAPOLIDETRENDOSCILLATORIndicatorScript(FUSION),
    DINAPOLI3X3: createDINAPOLI3X3IndicatorScript(FUSION),
    DINAPOLIPREFERREDSTOCHASTIC: createDINAPOLIPREFERREDSTOCHASTICIndicatorScript(FUSION),
    DINAPOLIMACD: createDINAPOLIMACDIndicatorScript(FUSION),
    DINAPOLIMACDPREDICTOR: createDINAPOLIMACDPREDICTORIndicatorScript(FUSION),
    DOP: createDOPIndicatorScript(FUSION),
    FORWARD: createFORWARDIndicatorScript(FUSION),
    FORECAST: createFORECASTIndicatorScript(FUSION),
    VARBANDS: createVARBANDSIndicatorScript(FUSION),
    DECISIONLONGBUY: createDECISIONLONGBUYIndicatorScript(FUSION),
    DECISIONLONGSELL: createDECISIONLONGSELLIndicatorScript(FUSION),
    DECISIONSHORTBUY: createDECISIONSHORTBUYIndicatorScript(FUSION),
    DECISIONSHORTSELL: createDECISIONSHORTSELLIndicatorScript(FUSION),
    SIGNALDISTANCE: createSIGNALDISTANCEIndicatorScript(FUSION),
    ACCUMULATION: createACCUMULATIONIndicatorScript(FUSION),
    PRICELEVELS: createPRICELEVELSIndicatorScript(FUSION),
    OBV: createOBVIndicatorScript(FUSION),
    ADL: createADLIndicatorScript(FUSION),
    CMF: createCMFIndicatorScript(FUSION),
    NVI: createNVIIndicatorScript(FUSION),
    PVI: createPVIIndicatorScript(FUSION),
    ZIGZAG: createZIGZAGIndicatorScript(FUSION),
    PIVOTPOINTS: createPIVOTPOINTSIndicatorScript(FUSION),
    PIVOTPOINTSHL: createPIVOTPOINTSHLIndicatorScript(FUSION),
    WILLIAMSPERCENTRANGE: createWILLIAMSPERCENTRANGEIndicatorScript(FUSION),
    FORCEINDEX: createFORCEINDEXIndicatorScript(FUSION),
    KELTNERCHANNEL: createKELTNERCHANNELIndicatorScript(FUSION),
    DONCHIANCHANNEL: createDONCHIANCHANNELIndicatorScript(FUSION),
    MASSINDEX: createMASSINDEXIndicatorScript(FUSION),
    TRIPLEEMA: createTRIPLEEMAIndicatorScript(FUSION),
    VOLUMEOSCILLATOR: createVOLUMEOSCILLATORIndicatorScript(FUSION),
    VOLUMEROC: createVOLUMEROCIndicatorScript(FUSION),
    ALMA: createALMAIndicatorScript(FUSION),
    AROON: createAROONIndicatorScript(FUSION),
    AWESOMEOSCILLATOR: createAWESOMEOSCILLATORIndicatorScript(FUSION),
    BALANCEOFPOWER: createBALANCEOFPOWERIndicatorScript(FUSION),
    BBANDSPERCENT: createBBANDSPERCENTIndicatorScript(FUSION),
    BBANDSWIDTH: createBBANDSWIDTHIndicatorScript(FUSION),
    CHAIKINOSCILLATOR: createCHAIKINOSCILLATORIndicatorScript(FUSION),
    CHANDEKROLLSTOP: createCHANDEKROLLSTOPIndicatorScript(FUSION),
    CHANDEMOMENTUMOSCILLATOR: createCHANDEMOMENTUMOSCILLATORIndicatorScript(FUSION),
    CHOPPINESSINDEX: createCHOPPINESSINDEXIndicatorScript(FUSION),
    CONNORSRSI: createCONNORSRSIIndicatorScript(FUSION),
    COPPOCKCURVE: createCOPPOCKCURVEIndicatorScript(FUSION),
    CORRELATIONCOEFFICIENT: createCORRELATIONCOEFFICIENTIndicatorScript(FUSION),
    DOUBLEEMA: createDOUBLEEMAIndicatorScript(FUSION),
    EASEOFMOVEMENT: createEASEOFMOVEMENTIndicatorScript(FUSION),
    ELDERSFORCEINDEX: createELDERSFORCEINDEXIndicatorScript(FUSION),
    FISHERTRANSFORM: createFISHERTRANSFORMIndicatorScript(FUSION),
    HISTORICALVOLATILITY: createHISTORICALVOLATILITYIndicatorScript(FUSION),
    NETVOLUME: createNETVOLUMEIndicatorScript(FUSION),
    TSI: createTSIIndicatorScript(FUSION),
    VORTEXINDICATOR: createVORTEXINDICATORIndicatorScript(FUSION),
    VWMA: createVWMAIndicatorScript(FUSION),
    WILLIAMSALLIGATOR: createWILLIAMSALLIGATORIndicatorScript(FUSION),
    WILLIAMSFRACTALS: createWILLIAMSFRACTALSIndicatorScript(FUSION),
    NEWSFEED: createNEWSFEEDIndicatorScript(FUSION),
    OC2: createOC2IndicatorScript(FUSION),
    HL2: createHL2IndicatorScript(FUSION),
    HLC3: createHLC3IndicatorScript(FUSION),
    OHLC4: createOHLC4IndicatorScript(FUSION),
    STANDARDDEVIATION: createSTANDARDDEVIATIONIndicatorScript(FUSION),
    SHARPERATIO: createSHARPERATIOIndicatorScript(FUSION),
    ROR: createRORIndicatorScript(FUSION),
    INFORMATIONRATIO: createINFORMATIONRATIOIndicatorScript(FUSION),
  };
}
