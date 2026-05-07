import { Shape } from "../../objectRuntimeBases";

type BaseShapeRuntime = Omit<
	InstanceType<typeof Shape>,
	| "getPoints"
	| "push"
	| "pop"
	| "render"
	| "renderOverlay"
	| "hit"
	| "mouseDown"
	| "mouseUp"
	| "mouseOut"
	| "mouseDrag"
	| "stageDown"
	| "stageMove"
	| "stageUp"
	| "stageOut"
	| "stageDrag"
	| "postRender"
	| "postRenderOverlay"
> & Record<string, any>;
export type LegacyAnyMethod = (...args: any[]) => any;
export type ShapeRuntime = BaseShapeRuntime & {
	getPoints: LegacyAnyMethod;
	push: LegacyAnyMethod;
	pop: LegacyAnyMethod;
	postRender: LegacyAnyMethod;
	postRenderOverlay: LegacyAnyMethod;
	getColors: LegacyAnyMethod;
	isWinning: LegacyAnyMethod;
	render: LegacyAnyMethod;
	renderOverlay: LegacyAnyMethod;
	hit: LegacyAnyMethod;
	mouseDown: LegacyAnyMethod;
	mouseUp: LegacyAnyMethod;
	mouseOut: LegacyAnyMethod;
	mouseDrag: LegacyAnyMethod;
	stageUp: LegacyAnyMethod;
	stageOut: LegacyAnyMethod;
	stageDrag: LegacyAnyMethod;
	stageDown: LegacyAnyMethod;
	stageMove: LegacyAnyMethod;
	drawPoint: LegacyAnyMethod;
	getIndexName: LegacyAnyMethod;
	drawLevels: LegacyAnyMethod;
	isHighestDifference: LegacyAnyMethod;
	drawLevelPoints: LegacyAnyMethod;
	getPrecision: LegacyAnyMethod;
	getValueColor: LegacyAnyMethod;
	getValueName: LegacyAnyMethod;
	wrap?: LegacyAnyMethod;
	newSize?: LegacyAnyMethod;
};
export type ShapeTagRuntime = ShapeRuntime & { defaultTagLen: number; defaultLineLen: number };
