import WEBRCP from "./WebRCP";
import LIB from "./utils/chartingCommons";
import { hitTolerance, isTouchDevice } from "./utils/environment";
import { drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow } from "./utils/objects-lib";
import type { ChartRuntimeObject } from "./internal-types/objects";

type AnyRecord = Record<string, any>;

export interface LegacyHitPoint {
  x: number;
  y: number;
}

export type LegacyHitState = LegacyHitPoint | boolean | null;

export interface LegacySeriesObject extends ChartRuntimeObject {
  _hit?: LegacyHitState;
  _hitAnchor?: LegacyHitPoint | null;
  _hitArrow?: LegacyHitPoint | null;
  selected?: boolean;
  renderAs?: string;
  [key: string]: any;
}

export interface LegacyAnchor extends AnyRecord {
  stamp: number;
  value: number;
  _index: number;
  referenceStamp?: number;
  offset?: number;
  expandable?: boolean;
  defaultDirection?: string;
  expanded?: boolean;
}

export interface LegacyShapeObject extends LegacySeriesObject {
  anchors: LegacyAnchor[];
  sticky?: boolean;
  userName?: string | null;
  text?: string | null;
  values?: unknown;
  valuesState?: unknown;
  flipped?: boolean;
  priceMarker?: boolean;
  canBeIndicator?: boolean;
  isIndicator?: boolean;
  setAnchorValue?: boolean;
  fillBg?: boolean;
  priceTag?: boolean;
  [key: string]: any;
}

export interface LegacyAnchorSelection {
  selected: number | null;
  anchors: LegacyAnchor[];
  drag?: boolean;
}

export interface LegacyShapePoint extends AnyRecord {
  x: number;
  y: number;
  index: number;
  value: number;
  expandable?: boolean;
  dir?: string;
  expanded?: boolean;
}

export class Series {
  hitTolerance = hitTolerance;
  isDraggable = false;

  getMenuItems(..._args: any[]): unknown {
    return undefined;
  }

  hit(..._args: any[]): unknown {
    return undefined;
  }

  updateExtremes(..._args: any[]): void {}

  render(..._args: any[]): void {}

  postRender(..._args: any[]): void {}

  drawSelectionLine(..._args: any[]): void {}

  mouseDown(..._args: any[]): void {}

  mouseDrag(..._args: any[]): void {}

  mouseUp(..._args: any[]): void {}

  mouseOut(..._args: any[]): void {}

  clearHits(object: LegacySeriesObject): void {
    object._hit = false;
    object._hitAnchor = null;
    object._hitArrow = null;
  }

  getToolTip(..._args: any[]): unknown {
    return undefined;
  }

  getRenderMode(object: LegacySeriesObject): unknown {
    return object.renderAs;
  }
}

export class Shape {
  anchorPointSize = 3;
  anchorPointDistanceToArrow = 10;
  anchorPointArrowSize = 6;
  anchorColor = WEBRCP.utils.colorManager.getColor("accent");
  anchorColorHover = WEBRCP.utils.colorManager.getColor("chartZeroColor");
  defaultFont = WEBRCP.utils.colorManager.getFont("text");
  allowedStickyKeys: Record<string, boolean> = { o: true, h: true, l: true, c: true };
  hitTolerance = 5;
  wasDrag = false;

  constructor() {
    if (isTouchDevice()) {
      this.anchorPointSize = 15;
      this.hitTolerance = 15;
    }
  }

  cloneAnchors(anchors: LegacyAnchor[]): LegacyAnchor[] {
    return JSON.parse(JSON.stringify(anchors)) as LegacyAnchor[];
  }

  createAnchorSelection(object: LegacyShapeObject, selected: number | null): LegacyAnchorSelection {
    return {
      selected,
      anchors: this.cloneAnchors(object.anchors),
    };
  }

  getPoints(
    object: LegacyShapeObject,
    renderer: AnyRecord,
    panel: AnyRecord | null | undefined,
    model: AnyRecord,
    seriesManager: AnyRecord,
  ): LegacyShapePoint[] | undefined {
    if (!panel) return undefined;

    const points: LegacyShapePoint[] = [];
    const referenceValue = LIB.getReferenceValue(object, model as any, seriesManager as any);
    let expandableCount = 0;

    for (let index = 0; index < object.anchors.length; index += 1) {
      const anchor = object.anchors[index];
      const stampIndex = renderer.getStampIndex(anchor.stamp, model, seriesManager);
      const value = anchor.value;
      const point: LegacyShapePoint = {
        x: renderer.getIndexPoint(stampIndex, model) + model._midOffset,
        y:
          renderer.getYCoordinateForPrice(anchor.value, {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV: referenceValue,
          }) + panel._offset,
        index: stampIndex,
        value,
      };

      if (anchor.expandable === true) {
        point.expandable = true;
        expandableCount += 1;

        if (expandableCount === 2) {
          if (point.x < points[0].x) {
            point.dir = anchor.defaultDirection === "right" ? "left" : "right";
            points[0].dir = point.dir === "right" ? "left" : "right";
          }
        } else {
          point.dir = anchor.defaultDirection;
        }

        point.expanded = anchor.expanded === true;
      }

      points.push(point);
    }

    return points;
  }

  push(object: LegacyShapeObject, _renderer: AnyRecord, model: AnyRecord, seriesManager: AnyRecord): void {
    const mainSeries = seriesManager[model.mainSeries];
    const lastStamp = mainSeries.data[mainSeries.data.length - 1].stamp;
    const lastIndex = mainSeries.data.length - 1;

    object.anchors.forEach((anchor) => {
      let anchorStamp: number;
      anchor.referenceStamp = lastStamp;

      if (anchor._index > lastIndex) {
        anchorStamp = lastStamp + (anchor._index - lastIndex) * mainSeries.interval.milis;
      } else if (anchor._index < 0) {
        anchorStamp = -1;
      } else {
        anchorStamp = mainSeries.data[Math.floor(anchor._index)].stamp;
      }

      anchor.offset = lastStamp - anchorStamp;
    });
  }

  pop(object: LegacyShapeObject, _renderer: AnyRecord, model: AnyRecord, seriesManager: AnyRecord, interactor: AnyRecord): void {
    const mainSeries = seriesManager[model.mainSeries];
    const lastStamp = mainSeries.data[mainSeries.data.length - 1].stamp;
    const lastIndex = mainSeries.data.length - 1;

    object.anchors.forEach((anchor) => {
      const resolvedStamp = (anchor.referenceStamp ?? lastStamp) - (anchor.offset ?? 0);

      if (resolvedStamp > lastStamp) {
        const offsetIndex = (anchor.offset ?? 0) / mainSeries.interval.milis;
        anchor._index = Math.round(lastIndex - offsetIndex);
      } else if (resolvedStamp < 0) {
        anchor._index = -1;
      } else {
        anchor._index = interactor.getStampIndex(resolvedStamp);
      }
    });
  }

  render(..._args: any[]): void {}

  renderAnchorsOverlay(
    object: LegacyShapeObject,
    overlayContext: CanvasRenderingContext2D,
    renderer: AnyRecord,
    model: AnyRecord,
    panel: AnyRecord,
    seriesManager: AnyRecord,
    options?: {
      drawArrowHandles?: boolean;
      redrawAnchorsWhenSelected?: boolean;
    },
  ): void {
    const points = this.getPoints(object, renderer, panel, model, seriesManager);
    if (!points) return;
    const overlayPanel = panel as any;

    if (object._hitAnchor) {
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        if (point.x === object._hitAnchor.x && point.y === object._hitAnchor.y) {
          drawAnchor(overlayContext, overlayPanel, point, this.hitTolerance, this.anchorColorHover, 0.5);
        }
      }
    }

    if (options?.drawArrowHandles !== false && object._hitArrow) {
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        if (point.x === object._hitArrow.x && point.y === object._hitArrow.y) {
          drawAnchorArrow(
            overlayContext,
            overlayPanel,
            point,
            this.anchorPointArrowSize + 2,
            this.anchorPointDistanceToArrow,
            this.anchorColorHover,
            0.5,
          );
        }
      }
    }

    if (object._hit || object.selected) {
      drawAnchors(overlayContext, overlayPanel, points, this.anchorPointSize, this.anchorColor, 1);
    }

    if (object.selected) {
      if (options?.redrawAnchorsWhenSelected) {
        drawAnchors(overlayContext, overlayPanel, points, this.anchorPointSize, this.anchorColor, 1);
      }
      if (options?.drawArrowHandles !== false) {
        drawAnchorsArrow(
          overlayContext,
          overlayPanel,
          points,
          this.anchorPointArrowSize,
          this.anchorPointDistanceToArrow,
          this.anchorColor,
          1,
        );
      }
    }
  }

  postRender(_object: LegacyShapeObject, ctx: CanvasRenderingContext2D): void {
    ctx.font = this.defaultFont;
  }

  updateExtremes(..._args: any[]): void {}

  getMenuItems(object: LegacyShapeObject, chart: AnyRecord): AnyRecord {
    const menuItems: AnyRecord = {};

    if (object.userName) {
      menuItems.showName = {
        name: object.userName,
        icon: false,
        callback: function callback() {
          return true;
        },
        disabled: true,
      };
      menuItems["sep-1"] = "---------";
    }

    menuItems.setName = {
      name: chart.options.locale.getMessage("set_name", "Set name"),
      icon: false,
      callback: function callback() {
        if (!object.userName) object.userName = null;
        chart.requestObjectText(object, "userName", object.userName, chart.options.locale.getMessage("set_name", "Set name"));
        if (!object.userName || object.userName.trim().length === 0) object.userName = null;
        return true;
      },
    };

    if (object.text !== undefined) {
      menuItems.text = {
        name: chart.options.locale.getMessage("set_text", "Set text"),
        icon: false,
        callback: function callback() {
          if (object.text || object.text === "") {
            chart.requestObjectText(object, "text", object.text);
          }
          return true;
        },
      };
    }

    if (object.setAnchorValue) {
      menuItems.setValue = {
        name: chart.options.locale.getMessage("set_value", "Set value"),
        icon: false,
        callback: function callback() {
          if (object.setAnchorValue) {
            chart.requestObjectAnchorValue(object);
          }
          return true;
        },
      };
    }

    if (object.values !== undefined && object.valuesState !== undefined) {
      menuItems.setValues = {
        name: chart.options.locale.getMessage("set_values", "Set values"),
        icon: false,
        callback: function callback() {
          if (object.values) {
            chart.requestObjectValues(object, "values", object.values);
          }
          return true;
        },
      };
    }

    if (object.flipped !== undefined) {
      menuItems.flip = {
        name: chart.options.locale.getMessage("flip", "Flip"),
        icon: false,
        callback: function callback() {
          if (object.flipped !== undefined) {
            object.flipped = !object.flipped;
          }
          return true;
        },
      };
    }

    if (object.fillBg !== undefined) {
      menuItems.fill = {
        name: chart.options.locale.getMessage("fill", "Fill"),
        icon: function icon() {
          if (object.fillBg === true) {
            return "context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white";
          }
          return "context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white";
        },
        callback: function callback() {
          if (object.fillBg !== undefined) {
            object.fillBg = !object.fillBg;
          }
          return true;
        },
      };
      menuItems.fill.disabled = object.isIndicator;
    }

    if (object.priceMarker) {
      menuItems.priceMarker = {
        name: chart.options.locale.getMessage("show_price_marker", "Show price marker"),
        icon: function icon() {
          if (object.priceTag === true) {
            return "context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white";
          }
          return "context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white";
        },
        callback: function callback() {
          object.priceTag = !object.priceTag;
          return true;
        },
      };
    }

    if (object.canBeIndicator === true) {
      menuItems.registerAsSeries = {
        name: chart.options.locale.getMessage("register_as_indicator", "Register as indicator"),
        icon: function icon() {
          if (object.isIndicator === true) {
            return "context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white";
          }
          return "context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white";
        },
        callback: function callback() {
          if (object.isIndicator === true) chart.interactor.unregisterObjectAsIdicator(object);
          else chart.interactor.registerObjectAsIdicator(object);
          return true;
        },
      };
    }

    return menuItems;
  }

  expandAnchor(anchor: LegacyAnchor): void {
    if (anchor.expandable) {
      anchor.expanded = !anchor.expanded;
    }
  }

  isValid(object: LegacyShapeObject): boolean | undefined {
    for (const key in object.anchors) {
      if (object.anchors[key]._index < 0) return false;
      if ((object.anchors[key].referenceStamp as number) - (object.anchors[key].offset as number) <= 0) return false;
    }
    return undefined;
  }

  clearHits(object: LegacyShapeObject): void {
    object._hit = false;
    object._hitAnchor = null;
    object._hitArrow = null;
  }

  getCurrentCandles(index: number, model: AnyRecord, seriesManager: AnyRecord): AnyRecord[] {
    const candles: AnyRecord[] = [];
    for (const key in model.instrumentsSeries) {
      const seriesId = model.instrumentsSeries[key].seriesId;
      const series = seriesManager[seriesId];
      if (series && index < series.data.length) {
        candles.push(series.data[index]);
      }
    }
    return candles;
  }

  getLastCandlePoint(renderer: AnyRecord, model: AnyRecord, seriesManager: AnyRecord): number {
    const seriesId = model.instrumentsSeries[0].seriesId;
    const series = seriesManager[seriesId];
    return renderer.getIndexPoint(series.data.length, model) + 10;
  }

  stickToCandlePoint(_event: AnyRecord, panel: AnyRecord, renderer: AnyRecord, referenceValue: unknown, candles: AnyRecord[], point: number): number {
    const offset = 20;
    let minDifference = Number.POSITIVE_INFINITY;
    let closestPoint = point;

    for (const candle of candles) {
      for (const key in candle) {
        if (!this.allowedStickyKeys[key]) continue;
        const candlePoint =
          renderer.getYCoordinateForPrice(candle[key], {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV: referenceValue,
          }) + panel._offset;
        const difference = Math.abs(candlePoint - point);
        if (difference < minDifference) {
          minDifference = difference;
          closestPoint = candlePoint;
        }
      }
    }

    return minDifference < offset ? closestPoint : point;
  }

  stickToCandleValue(point: number, candles: AnyRecord[], panel: AnyRecord, renderer: AnyRecord, referenceValue: unknown): any {
    const offset = 20;
    let minDifference = Number.POSITIVE_INFINITY;
    let closestValue: any = 0;
    const pointValue = renderer.getPriceForYCoordinate(point, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV: referenceValue,
    });

    for (const candle of candles) {
      for (const key in candle) {
        if (!this.allowedStickyKeys[key]) continue;
        const candlePoint =
          renderer.getYCoordinateForPrice(candle[key], {
            panelHeight: panel._height,
            minValue: panel.vMin,
            maxValue: panel.vMax,
            valueAxisMode: panel.valueAxisMode,
            fV: referenceValue,
          }) + panel._offset;
        const difference = Math.abs(candlePoint - point);
        if (difference < minDifference) {
          minDifference = difference;
          closestValue = candle[key];
        }
      }
    }

    return minDifference < offset ? closestValue : pointValue;
  }

  mouseDown(
    event: AnyRecord,
    object: LegacyShapeObject,
    renderer: AnyRecord,
    interactor: AnyRecord,
    model: AnyRecord,
    panel: AnyRecord,
    seriesManager: AnyRecord,
  ): LegacyAnchorSelection {
    this.wasDrag = false;

    const points = this.getPoints(object, renderer, panel, model, seriesManager);
    if (!points) {
      return this.createAnchorSelection(object, null);
    }

    for (let index = 0; index < points.length; index += 1) {
      if (interactor.isOver(event._offset.offsetX, event._offset.offsetY, points[index].x, points[index].y, this.hitTolerance)) {
        return this.createAnchorSelection(object, index);
      }
    }

    return this.createAnchorSelection(object, null);
  }

  mouseDownWithPanelPush(
    event: AnyRecord,
    object: LegacyShapeObject,
    renderer: AnyRecord,
    interactor: AnyRecord,
    model: AnyRecord,
    panel: AnyRecord,
    seriesManager: AnyRecord,
  ): LegacyAnchorSelection {
    interactor.pushPanel(this, object, panel);
    return Shape.prototype.mouseDown.call(this, event, object, renderer, interactor, model, panel, seriesManager);
  }

  mouseDownWithExpandableArrowSelection(
    event: AnyRecord,
    object: LegacyShapeObject,
    renderer: AnyRecord,
    interactor: AnyRecord,
    model: AnyRecord,
    panel: AnyRecord,
    seriesManager: AnyRecord,
    options?: {
      pushPanel?: boolean;
    },
  ): LegacyAnchorSelection {
    if (object._hitArrow) {
      const points = this.getPoints(object, renderer, panel, model, seriesManager);
      if (points) {
        for (let index = 0; index < points.length; index += 1) {
          if (
            interactor.isOver(
              event._offset.offsetX,
              event._offset.offsetY,
              points[index].x,
              points[index].y + this.anchorPointDistanceToArrow,
              this.hitTolerance,
            )
          ) {
            this.expandAnchor(object.anchors[index]);
          }
        }
      }
    }

    if (options?.pushPanel) {
      interactor.pushPanel(this, object, panel);
    }

    return Shape.prototype.mouseDown.call(this, event, object, renderer, interactor, model, panel, seriesManager);
  }

  mouseUp(
    _event: AnyRecord,
    object: LegacyShapeObject,
    _renderer: AnyRecord,
    interactor: AnyRecord,
    _model: AnyRecord,
    panel: AnyRecord,
    _seriesManager?: AnyRecord,
  ): void {
    interactor.popPanel(this, object, panel);
  }

  mouseUpWithExpandableAnchors(
    event: AnyRecord,
    object: LegacyShapeObject,
    renderer: AnyRecord,
    interactor: AnyRecord,
    model: AnyRecord,
    panel: AnyRecord,
    seriesManager: AnyRecord,
    options?: {
      popPanel?: boolean;
      requireHitArrow?: boolean;
    },
  ): void {
    if (!this.wasDrag && (!options?.requireHitArrow || object._hitArrow)) {
      const points = this.getPoints(object, renderer, panel, model, seriesManager);
      if (points) {
        for (let index = 0; index < points.length; index += 1) {
          if (
            interactor.isOver(
              event._offset.offsetX,
              event._offset.offsetY,
              points[index].x,
              points[index].y + this.anchorPointDistanceToArrow,
              this.hitTolerance,
            )
          ) {
            this.expandAnchor(object.anchors[index]);
          }
        }
      }
    }

    if (options?.popPanel !== false) {
      interactor.popPanel(this, object, panel);
    }
  }

  mouseOut(
    _event: AnyRecord,
    object: LegacyShapeObject,
    _renderer: AnyRecord,
    interactor: AnyRecord,
    _model: AnyRecord,
    panel: AnyRecord,
    _seriesManager?: AnyRecord,
  ): void {
    this.clearHits(object);
    this.wasDrag = false;
    interactor.popPanel(this, object, panel);
  }

  mouseOutKeepHits(
    _event: AnyRecord,
    object: LegacyShapeObject,
    _renderer: AnyRecord,
    interactor: AnyRecord,
    _model: AnyRecord,
    panel: AnyRecord,
    _seriesManager?: AnyRecord,
  ): void {
    this.wasDrag = false;
    interactor.popPanel(this, object, panel);
  }

  mouseDrag(event: AnyRecord, object: LegacyShapeObject, renderer: AnyRecord, interactor: AnyRecord, model: AnyRecord, panel: AnyRecord, seriesManager: AnyRecord): void {
    const selectedAnchor = interactor.currentAnchor.selected;
    const yValue = event._offset.offsetY - panel._offset;
    const baseAnchors = interactor.currentAnchor.anchors as LegacyAnchor[];
    const xOffset = renderer.getPointIndex(event._offset.offsetX, model) - renderer.getPointIndex(interactor.initialMouseEvent._offset.offsetX, model);
    const referenceValue = LIB.getReferenceValue(object, model as any, seriesManager as any);
    const yOffset = Number.parseFloat(
      (
        renderer.getPriceForYCoordinate(yValue, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV: referenceValue,
        }) -
        renderer.getPriceForYCoordinate(interactor.initialMouseEvent._offset.offsetY - panel._offset, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV: referenceValue,
        })
      ).toFixed(panel.precision ?? 0),
    );

    if (Math.abs(xOffset) > 0 && Math.abs(yOffset) > 0) {
      this.wasDrag = true;
    }

    if (selectedAnchor != null) {
      const index = renderer.getStampIndex(baseAnchors[selectedAnchor].stamp, model, seriesManager) + xOffset;
      const value = object.sticky
        ? this.stickToCandleValue(yValue, this.getCurrentCandles(index, model, seriesManager), panel, renderer, referenceValue)
        : baseAnchors[selectedAnchor].value + yOffset;

      object.anchors[selectedAnchor]._index = index;
      object.anchors[selectedAnchor].value = LIB.round(value, renderer.getPrecision(model, panel));
      object.anchors[selectedAnchor].stamp = renderer.getIndexStamp(object.anchors[selectedAnchor]._index, model, seriesManager);
      return;
    }

    for (let index = 0; index < object.anchors.length; index += 1) {
      const anchorIndex = renderer.getStampIndex(baseAnchors[index].stamp, model, seriesManager);
      object.anchors[index]._index = anchorIndex + xOffset;
      object.anchors[index].value = baseAnchors[index].value + yOffset;
      object.anchors[index].stamp = renderer.getIndexStamp(object.anchors[index]._index, model, seriesManager);
    }
  }

  stageDown(event: AnyRecord, object: LegacyShapeObject, renderer: AnyRecord, interactor: AnyRecord, model: AnyRecord, panel: AnyRecord, seriesManager: AnyRecord): { selected: number; anchors: LegacyAnchor[] } {
    const referenceValue = LIB.getReferenceValue(object, model as any, seriesManager as any);
    const index = renderer.getPointIndex(event._offset.offsetX, model);
    const yValue = event._offset.offsetY - panel._offset;
    const currentAnchor = interactor.currentAnchor ? interactor.currentAnchor.selected : 0;
    const value = object.sticky
      ? this.stickToCandleValue(yValue, this.getCurrentCandles(index, model, seriesManager), panel, renderer, referenceValue)
      : renderer.getPriceForYCoordinate(yValue, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV: referenceValue,
        });

    if (!interactor.currentAnchor) {
      for (const key in object.anchors) {
        object.anchors[key]._index = index;
        object.anchors[key].value = LIB.round(value, renderer.getPrecision(model, panel));
        object.anchors[key].stamp = renderer.getIndexStamp(object.anchors[key]._index, model, seriesManager);
      }
    } else {
      interactor.pushPanel(this, object, panel);
      object.anchors[currentAnchor]._index = index;
      object.anchors[currentAnchor].value = LIB.round(value, renderer.getPrecision(model, panel));
      object.anchors[currentAnchor].stamp = renderer.getIndexStamp(object.anchors[currentAnchor]._index, model, seriesManager);
    }

    return {
      selected: currentAnchor + 1,
      anchors: this.cloneAnchors(object.anchors),
    };
  }

  stageMove(event: AnyRecord, object: LegacyShapeObject, renderer: AnyRecord, interactor: AnyRecord, model: AnyRecord, panel: AnyRecord, seriesManager: AnyRecord): void {
    if (!interactor.currentAnchor) return;

    const selectedAnchor = interactor.currentAnchor.selected;
    const referenceValue = LIB.getReferenceValue(object, model as any, seriesManager as any);
    const index = renderer.getPointIndex(event._offset.offsetX, model);
    const yValue = event._offset.offsetY - panel._offset;
    const value = object.sticky
      ? this.stickToCandleValue(yValue, this.getCurrentCandles(index, model, seriesManager), panel, renderer, referenceValue)
      : renderer.getPriceForYCoordinate(yValue, {
          panelHeight: panel._height,
          minValue: panel.vMin,
          maxValue: panel.vMax,
          valueAxisMode: panel.valueAxisMode,
          fV: referenceValue,
        });

    if (selectedAnchor != null && selectedAnchor < object.anchors.length) {
      object.anchors[selectedAnchor]._index = index;
      object.anchors[selectedAnchor].value = LIB.round(value, renderer.getPrecision(model, panel));
      object.anchors[selectedAnchor].stamp = renderer.getIndexStamp(object.anchors[selectedAnchor]._index, model, seriesManager);
    }
  }

  stageDrag(event: AnyRecord, object: LegacyShapeObject, renderer: AnyRecord, interactor: AnyRecord, model: AnyRecord, panel: AnyRecord, seriesManager: AnyRecord): void {
    const xPointsOffset = event._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yPointsOffset = event._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;

    if (Math.abs(xPointsOffset) > this.hitTolerance || Math.abs(yPointsOffset) > this.hitTolerance) {
      interactor.currentAnchor.drag = true;
    }

    this.stageMove(event, object, renderer, interactor, model, panel, seriesManager);
  }

  stageOut(event: AnyRecord, object: LegacyShapeObject, renderer: AnyRecord, interactor: AnyRecord, model: AnyRecord, panel: AnyRecord, seriesManager: AnyRecord): boolean | void {
    this.stageUp(event, object, renderer, interactor, model, panel, seriesManager);
    return undefined;
  }

  stageUpWithSelectionLimit(
    _event: AnyRecord,
    object: LegacyShapeObject,
    _renderer: AnyRecord,
    interactor: AnyRecord,
    _model: AnyRecord,
    panel: AnyRecord,
    selectedLimit: number,
  ): boolean | void {
    interactor.popPanel(this, object, panel);
    if (interactor.currentAnchor && interactor.currentAnchor.drag) {
      interactor.currentAnchor.selected += 1;
    }

    if (interactor.currentAnchor !== null && interactor.currentAnchor.selected >= selectedLimit) {
      interactor.currentAnchor = null;
      return true;
    }

    return undefined;
  }

  stageUp(_event: AnyRecord, object: LegacyShapeObject, _renderer: AnyRecord, interactor: AnyRecord, _model: AnyRecord, panel: AnyRecord, _seriesManager?: AnyRecord): boolean | void {
    const selectedLimit = interactor.currentAnchor ? interactor.currentAnchor.anchors.length : Number.POSITIVE_INFINITY;
    return this.stageUpWithSelectionLimit(_event, object, _renderer, interactor, _model, panel, selectedLimit);
  }
}