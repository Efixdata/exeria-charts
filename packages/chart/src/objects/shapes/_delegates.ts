import { Shape } from "../../objectRuntimeBases";
import type {
  ShapeAnchorOverlayOptions,
  ShapeBaseMouseDownDelegate,
  ShapeBaseMouseOutDelegate,
  ShapeInteractionArgs,
  ShapeMouseUpOptions,
  ShapeRenderOverlayArgs,
  ShapeRuntime,
} from "./_sharedTypes";

export function createShapeAnchorOverlayDelegate(options?: ShapeAnchorOverlayOptions) {
  return function (
    this: ShapeRuntime,
    object,
    overlayContext,
    renderer,
    model,
    panel,
    seriesManager
  ) {
    return Shape.prototype.renderAnchorsOverlay.call(
      this,
      object,
      overlayContext,
      renderer,
      model,
      panel,
      seriesManager,
      options
    );
  } as (this: ShapeRuntime, ...args: ShapeRenderOverlayArgs) => void;
}

export function createShapeMouseDownDelegate(
  methodName: ShapeBaseMouseDownDelegate = "mouseDown"
) {
  return function (
    this: ShapeRuntime,
    event,
    object,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  ) {
    const method = Shape.prototype[methodName] as (
      this: ShapeRuntime,
      ...args: ShapeInteractionArgs
    ) => unknown;
    return method.call(this, event, object, renderer, interactor, model, panel, seriesManager);
  } as (this: ShapeRuntime, ...args: ShapeInteractionArgs) => unknown;
}

export function createShapeMouseUpExpandableDelegate(options?: ShapeMouseUpOptions) {
  return function (
    this: ShapeRuntime,
    event,
    object,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  ) {
    return Shape.prototype.mouseUpWithExpandableAnchors.call(
      this,
      event,
      object,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
      options
    );
  } as (this: ShapeRuntime, ...args: ShapeInteractionArgs) => unknown;
}

export function createShapeMouseOutDelegate(methodName: ShapeBaseMouseOutDelegate = "mouseOut") {
  return function (
    this: ShapeRuntime,
    event,
    object,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  ) {
    const method = Shape.prototype[methodName] as (
      this: ShapeRuntime,
      ...args: ShapeInteractionArgs
    ) => unknown;
    return method.call(this, event, object, renderer, interactor, model, panel, seriesManager);
  } as (this: ShapeRuntime, ...args: ShapeInteractionArgs) => unknown;
}

export function shapeStageUpDelegate(
  this: ShapeRuntime,
  ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
) {
  return Shape.prototype.stageUp.call(
    this,
    event,
    object,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  );
}

export function shapeStageOutDelegate(
  this: ShapeRuntime,
  ...[event, object, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs
) {
  return Shape.prototype.stageOut.call(
    this,
    event,
    object,
    renderer,
    interactor,
    model,
    panel,
    seriesManager
  );
}