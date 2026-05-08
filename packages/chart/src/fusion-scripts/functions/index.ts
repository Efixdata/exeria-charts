import type { CoreFusionStatic } from "../../internal-types/fusion";
import createIFFunctionScript from "./IF";
import createHIGHESTFunctionScript from "./HIGHEST";
import createLOWESTFunctionScript from "./LOWEST";
import createIGLUEFunctionScript from "./IGLUE";
import createIMODFunctionScript from "./IMOD";
import createDISPLACEFunctionScript from "./DISPLACE";
import createScript1xFunctionScript from "./1x";
import createSUMFunctionScript from "./SUM";
import createAVERAGEFunctionScript from "./AVERAGE";
import createFIBONACCIFunctionScript from "./FIBONACCI";

export function createFusionFunctionScripts(FUSION: CoreFusionStatic) {
    return {
        'IF': createIFFunctionScript(FUSION),
        'HIGHEST': createHIGHESTFunctionScript(FUSION),
        'LOWEST': createLOWESTFunctionScript(FUSION),
        'IGLUE': createIGLUEFunctionScript(FUSION),
        'IMOD': createIMODFunctionScript(FUSION),
        'DISPLACE': createDISPLACEFunctionScript(FUSION),
        '1x': createScript1xFunctionScript(FUSION),
        'SUM': createSUMFunctionScript(FUSION),
        'AVERAGE': createAVERAGEFunctionScript(FUSION),
        'FIBONACCI': createFIBONACCIFunctionScript(FUSION),
    };
}
