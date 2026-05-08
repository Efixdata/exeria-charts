import type { UnknownFn } from "./shared";

export interface ChartPanelObject {
  id?: string | number;
  dataLink?: string;
  dataField?: string | null;
  type?: string;
  reference?: string | null;
  drag?: boolean;
  [key: string]: unknown;
}

export interface ChartRuntimeObject extends ChartPanelObject {
  id?: string | number;
  type: string;
  hidden?: boolean;
  permHide?: boolean;
  selected?: boolean;
  hover?: boolean;
  isBeingDragged?: boolean;
  renderAs?: string;
  color?: string;
  list?: ChartRuntimeObject[];
  object?: Record<string, unknown>;
  [key: string]: any;
}

export interface ChartObjectCollection {
  visible: boolean;
  selected?: boolean;
  list: ChartRuntimeObject[];
  [key: string]: any;
}

export interface CoreRendererObject {
  render: UnknownFn;
  postRender: UnknownFn;
  renderOverlay: UnknownFn;
  postRenderOverlay: UnknownFn;
  updateExtremes: UnknownFn;
  hit: UnknownFn;
  clearHits: UnknownFn;
  push: UnknownFn;
  pop: UnknownFn;
  mouseDown: UnknownFn;
  mouseUp: UnknownFn;
  mouseMove: UnknownFn;
  mouseOut: UnknownFn;
  mouseDrag: UnknownFn;
  stageDown: UnknownFn;
  stageUp: UnknownFn;
  stageMove: UnknownFn;
  stageDrag: UnknownFn;
  stageOut: UnknownFn;
  getToolTip: UnknownFn;
  isDraggable?: boolean;
  [key: string]: any;
}

export interface RendererObjectsRegistry {
  [key: string]: any;
}