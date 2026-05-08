import type { CoreFusionStatic } from "../../internal-types/fusion";
import createOBJECTHiddenScript from "./OBJECT";
import createEQUITYSUMHiddenScript from "./EQUITYSUM";

export function createFusionHiddenScripts(FUSION: CoreFusionStatic) {
  return {
    OBJECT: createOBJECTHiddenScript(FUSION),
    EQUITYSUM: createEQUITYSUMHiddenScript(FUSION),
  };
}
