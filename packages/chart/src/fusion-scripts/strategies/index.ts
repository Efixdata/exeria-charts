import type { CoreFusionStatic } from "../../internal-types/fusion";
import createEXCEEDStrategyScript from "./EXCEED";
import createCROSSStrategyScript from "./CROSS";
import createREBOUNDStrategyScript from "./REBOUND";
import createGREATERLESSStrategyScript from "./GREATERLESS";
import createSINGLEStrategyScript from "./SINGLE";
import createJOINStrategyScript from "./JOIN";
import createDOUBLECHECKStrategyScript from "./DOUBLECHECK";
import createMIXStrategyScript from "./MIX";
import createPOSITIONStrategyScript from "./POSITION";
import createDIFFERStrategyScript from "./DIFFER";
import createCANDLESTICKPATTERNSStrategyScript from "./CANDLESTICKPATTERNS";

export function createFusionStrategyScripts(FUSION: CoreFusionStatic) {
  return {
    EXCEED: createEXCEEDStrategyScript(FUSION),
    CROSS: createCROSSStrategyScript(FUSION),
    REBOUND: createREBOUNDStrategyScript(FUSION),
    GREATERLESS: createGREATERLESSStrategyScript(FUSION),
    SINGLE: createSINGLEStrategyScript(FUSION),
    JOIN: createJOINStrategyScript(FUSION),
    DOUBLECHECK: createDOUBLECHECKStrategyScript(FUSION),
    MIX: createMIXStrategyScript(FUSION),
    POSITION: createPOSITIONStrategyScript(FUSION),
    DIFFER: createDIFFERStrategyScript(FUSION),
    CANDLESTICKPATTERNS: createCANDLESTICKPATTERNSStrategyScript(FUSION),
  };
}
