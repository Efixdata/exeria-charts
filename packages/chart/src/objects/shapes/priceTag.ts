import WEBRCP from "../../WebRCP";
import {
  type DrawingSnapInteractor,
  isDrawingSnapEnabled,
  resolveMagnetAnchorValue,
} from "../../drawingWorkflow";
import { Shape, resolveToolRenderContext } from "../../objectRuntimeBases";
import LIB from "../../utils/chartingCommons";
import {
  between,
  findAnchorPointForXY,
} from "../../utils/objects-lib";
import { formatFullAxisPrice } from "../../utils/formatPriceLabel";
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import {
  createShapeAnchorOverlayDelegate,
  createShapeMouseDownDelegate,
} from "./_delegates";
import type { CoreInteractor } from "../../internal-types/interactor";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeTagRuntime,
} from "./_sharedTypes";

type PriceTagPanel = ShapeRenderArgs[4];
type PriceTagModel = ShapeRenderArgs[3];
type PriceTagSeriesManager = ShapeRenderArgs[5];

function syncPriceTagPanelReference(
  o: ShapeRenderArgs[0],
  panel: PriceTagPanel,
  seriesManager: PriceTagSeriesManager,
) {
  if (panel?.main === true) {
    delete o.reference;
    return;
  }

  const primarySeries = LIB.getPanelPrimarySeriesField(panel, seriesManager);
  if (primarySeries) {
    o.reference = `${primarySeries.dataLink}:${primarySeries.dataField}`;
    return;
  }

  delete o.reference;
}

function resolvePriceTagPanel(
  panel: PriceTagPanel,
  interactor: Pick<CoreInteractor, "getPanel" | "getMainPanel">,
  event?: ShapeLifecycleArgs[0],
) {
  const offsetY = event?._offset?.offsetY;
  if (typeof offsetY === "number" && typeof interactor.getPanel === "function") {
    const panelAtPointer = interactor.getPanel(offsetY) as PriceTagPanel;
    if (panelAtPointer) {
      return panelAtPointer;
    }
  }

  if (panel) {
    return panel;
  }

  if (typeof interactor.getMainPanel === "function") {
    const mainPanel = interactor.getMainPanel() as PriceTagPanel;
    if (mainPanel) {
      return mainPanel;
    }
  }

  return panel;
}

type OhlcStampPoint = {
  stamp: number;
};

type MainOhlcSeriesEntry = {
  seriesId: string;
  series: {
    data: Array<OhlcStampPoint>;
    interval?: { milis?: number };
  };
};

/** Same series resolution as fusion.getMainSeries(). */
function getMainOhlcSeries(model: PriceTagModel, seriesManager: PriceTagSeriesManager): MainOhlcSeriesEntry | null {
  const instruments = model.instrumentsSeries as Array<{ seriesId?: string }> | undefined;
  const preferredId = instruments?.[0]?.seriesId ?? model.mainSeries;

  if (preferredId && seriesManager[preferredId]?.data?.length) {
    return {
      seriesId: String(preferredId),
      series: seriesManager[preferredId] as MainOhlcSeriesEntry["series"],
    };
  }

  for (const seriesId in seriesManager) {
    const series = seriesManager[seriesId] as MainOhlcSeriesEntry["series"] | undefined;
    if (series?.data?.length) {
      return { seriesId, series };
    }
  }

  return null;
}

function resolvePriceTagReferenceValue(
  o: ShapeRenderArgs[0],
  model: PriceTagModel,
  panel: PriceTagPanel,
  seriesManager: PriceTagSeriesManager,
) {
  if (panel?.main !== true) {
    const panelReference = LIB.getPanelReferenceValue(panel, model, seriesManager);
    if (panelReference != null) {
      return panelReference;
    }
  }

  return LIB.getReferenceValue(o, model, seriesManager);
}

function resolvePriceTagPrecision(
  renderer: ShapeRenderArgs[2],
  model: PriceTagModel,
  panel: PriceTagPanel,
) {
  if (panel?.main !== true && typeof panel?.precision === "number") {
    return panel.precision;
  }

  return renderer.getPrecision(model, panel);
}

function getFractionalPointIndex(offsetX: number, model: PriceTagModel) {
  const periodWidth = model.periodWidth;
  if (!periodWidth) {
    return 0;
  }

  return (offsetX + model.viewportLeft) / periodWidth;
}

function getFractionalIndexStamp(
  index: number,
  model: PriceTagModel,
  seriesManager: PriceTagSeriesManager,
) {
  const mainSeries = getMainOhlcSeries(model, seriesManager);
  const data = mainSeries?.series.data;

  if (!data?.length) {
    return 0;
  }

  const intervalMs = mainSeries?.series.interval?.milis || 1;

  if (index <= 0) {
    return data[0].stamp + index * intervalMs;
  }

  const lastIndex = data.length - 1;
  if (index >= lastIndex) {
    return data[lastIndex].stamp + (index - lastIndex) * intervalMs;
  }

  const baseIndex = Math.floor(index);
  const fraction = index - baseIndex;
  const stamp0 = data[baseIndex].stamp;
  const stamp1 = data[baseIndex + 1].stamp;

  return stamp0 + fraction * (stamp1 - stamp0);
}

function isPriceTagMainChartPanel(panel: PriceTagPanel) {
  return panel?.main === true;
}

/** Place anchor from pointer; OHLC magnet only on the main price panel. */
function setPriceTagAnchorValueFromPointer(
  shape: ShapeTagRuntime,
  o: ShapeRenderArgs[0],
  offsetX: number,
  offsetY: number,
  renderer: ShapeRenderArgs[2],
  interactor: DrawingSnapInteractor | null | undefined,
  model: PriceTagModel,
  panel: PriceTagPanel,
  seriesManager: PriceTagSeriesManager,
) {
  if (!o.anchors[0]) {
    return;
  }

  syncPriceTagPanelReference(o, panel, seriesManager);
  const precision = resolvePriceTagPrecision(renderer, model, panel);
  const referenceValue = resolvePriceTagReferenceValue(o, model, panel, seriesManager);
  const priceOptions = {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV: referenceValue,
  };

  if (isPriceTagMainChartPanel(panel)) {
    o.sticky = true;
    o.anchors[0].value = LIB.round(
      resolveMagnetAnchorValue(
        shape,
        o,
        interactor,
        offsetX,
        offsetY,
        renderer,
        model,
        panel,
        seriesManager,
      ),
      precision,
    );
  } else {
    o.anchors[0].value = LIB.round(
      renderer.getPriceForYCoordinate(offsetY - panel._offset, priceOptions),
      precision,
    );
  }

  applyPriceTagFractionalIndex(o, offsetX, model, seriesManager);
}

/** Snap the anchor (circle) price after a drag delta — not the label position under the cursor. */
function snapPriceTagAnchorValueAtIndex(
  shape: ShapeTagRuntime,
  o: ShapeRenderArgs[0],
  interactor: DrawingSnapInteractor | null | undefined,
  anchorIndex: number,
  proposedValue: number,
  renderer: ShapeRenderArgs[2],
  model: PriceTagModel,
  panel: PriceTagPanel,
  seriesManager: PriceTagSeriesManager,
) {
  const precision = resolvePriceTagPrecision(renderer, model, panel);

  if (!isPriceTagMainChartPanel(panel) || !isDrawingSnapEnabled(o, interactor)) {
    return LIB.round(proposedValue, precision);
  }

  const referenceValue = resolvePriceTagReferenceValue(o, model, panel, seriesManager);
  const anchorY = renderer.getYCoordinateForPrice(proposedValue, {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV: referenceValue,
  });
  const candleIndex = Math.max(0, Math.floor(anchorIndex));

  return LIB.round(
    shape.stickToCandleValue(
      anchorY,
      shape.getCurrentCandles(candleIndex, model, seriesManager),
      panel,
      renderer,
      referenceValue,
    ) as number,
    precision,
  );
}

function applyPriceTagFractionalIndex(
  o: ShapeRenderArgs[0],
  offsetX: number,
  model: PriceTagModel,
  seriesManager: PriceTagSeriesManager,
) {
  const anchor = o.anchors[0];
  if (!anchor) {
    return;
  }

  const fractionalIndex = getFractionalPointIndex(offsetX, model);
  anchor._index = fractionalIndex;
  anchor.stamp = getFractionalIndexStamp(fractionalIndex, model, seriesManager);
}

function PriceTagObject(this: ShapeTagRuntime) {
  this.defaultTagLen = 100;
  this.defaultLineLen = 50;
  this.push = function (
    object: ShapeRenderArgs[0],
    renderer: ShapeRenderArgs[2],
    model: ShapeRenderArgs[3],
    seriesManager: ShapeRenderArgs[5],
  ) {
    Shape.prototype.push.call(this, object, renderer, model, seriesManager);
  };
  this.pop = function () {};

  this.getPoints = function (o, rendererOrContext, panel, model, seriesManager) {
    const runtime = resolveToolRenderContext(rendererOrContext, panel, model, seriesManager);
    if (!runtime.panel || !o.anchors[0]) {
      return [];
    }

    const anchor = o.anchors[0];
    const referenceValue = resolvePriceTagReferenceValue(
      o,
      runtime.model,
      runtime.panel,
      runtime.seriesManager,
    );
    const index =
      typeof anchor._index === "number"
        ? anchor._index
        : runtime.renderer.getStampIndex(anchor.stamp, runtime.model, runtime.seriesManager);

    return [
      {
        x: runtime.renderer.getIndexPoint(index, runtime.model) + runtime.model._midOffset,
        y:
          runtime.renderer.getYCoordinateForPrice(anchor.value, {
            panelHeight: runtime.panel._height,
            minValue: runtime.panel.vMin,
            maxValue: runtime.panel.vMax,
            valueAxisMode: runtime.panel.valueAxisMode,
            fV: referenceValue,
          }) + runtime.panel._offset,
        index,
        value: anchor.value,
      },
    ];
  };

  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (!pts.length) {
      return;
    }

    var x = pts[0].x;
    var y = pts[0].y;

    const color = o.color ? o.color : WEBRCP.utils.colorManager.getColor("defaultToolColor");
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash ? o.dash : []);

    var value = o.anchors[0].value;
    var valueS = formatFullAxisPrice(value, resolvePriceTagPrecision(renderer, model, panel));
    var w =
      this.defaultLineLen +
      15 +
      measurePriceTextWidth({
        text: valueS,
        ctx,
        zerosToReduce: renderer.getPriceRenderingOptions().zerosToReduce,
      });

    if (!o.flipped) {
      ctx.beginPath();
      ctx.moveTo(x + this.defaultLineLen, y);
      ctx.lineTo(x + this.defaultLineLen + 5, y - 10);
      ctx.lineTo(x + w, y - 10);
      ctx.lineTo(x + w, y + 10);
      ctx.lineTo(x + this.defaultLineLen + 5, y + 10);
      ctx.lineTo(x + this.defaultLineLen, y);
      ctx.fill();
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
      ctx.fillStyle = WEBRCP.utils.getContrastColor(
        color,
        WEBRCP.utils.colorManager.getColor("indicatorMarker"),
        "#ffffff"
      );
      const previousBaseline = ctx.textBaseline;
      ctx.textBaseline = "middle";
      renderPriceText({
        text: valueS,
        ctx,
        x: x + this.defaultLineLen + 10,
        y,
        zerosToReduce: renderer.getPriceRenderingOptions().zerosToReduce,
      });
      ctx.textBaseline = previousBaseline;
    } else {
      ctx.beginPath();
      ctx.moveTo(x - this.defaultLineLen, y);
      ctx.lineTo(x - this.defaultLineLen - 5, y - 10);
      ctx.lineTo(x - w, y - 10);
      ctx.lineTo(x - w, y + 10);
      ctx.lineTo(x - this.defaultLineLen - 5, y + 10);
      ctx.lineTo(x - this.defaultLineLen, y);
      ctx.fill();
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
      ctx.fillStyle = WEBRCP.utils.getContrastColor(
        color,
        WEBRCP.utils.colorManager.getColor("indicatorMarker"),
        "#ffffff"
      );
      const previousBaseline = ctx.textBaseline;
      ctx.textBaseline = "middle";
      renderPriceText({
        text: valueS,
        ctx,
        x: x - w + 10,
        y,
        zerosToReduce: renderer.getPriceRenderingOptions().zerosToReduce,
      });
      ctx.textBaseline = previousBaseline;
    }
  };

  this.renderOverlay = createShapeAnchorOverlayDelegate({ drawArrowHandles: false });

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    var self = this;

    var pts = this.getPoints(o, renderer, panel, model, seriesManager);
    var hitResult = false;
    this.clearHits(o);

    if (
      (o.flipped &&
        between(
          pts[0].x,
          x,
          pts[0].x - this.defaultLineLen - this.defaultTagLen,
          self.hitTolerance
        ) &&
        between(pts[0].y - 1, y, pts[0].y + 1, self.hitTolerance)) ||
      (!o.flipped &&
        between(
          pts[0].x,
          x,
          pts[0].x + this.defaultLineLen + this.defaultTagLen,
          self.hitTolerance
        ) &&
        between(pts[0].y - 1, y, pts[0].y + 1, self.hitTolerance))
    ) {
      hitResult = true;
      o._hit = true;
      var p = findAnchorPointForXY(pts, x, y, self.hitTolerance);
      if (p) {
        o._hitAnchor = { x: p.x, y: p.y };
      }
    }
    return hitResult;
  };

  this.mouseDown = createShapeMouseDownDelegate("mouseDownWithPanelPush");
  this.mouseDrag = function (...[e, o, renderer, interactor, model, panel, seriesManager]: ShapeInteractionArgs) {
    if (!interactor.currentAnchor?.anchors?.[0] || !o.anchors[0] || !e._offset) {
      return;
    }

    const activePanel = resolvePriceTagPanel(panel, interactor, e);
    if (!activePanel) {
      return;
    }

    const baseAnchor = interactor.currentAnchor.anchors[0];
    const startIndex =
      typeof baseAnchor._index === "number"
        ? baseAnchor._index
        : renderer.getStampIndex(baseAnchor.stamp, model, seriesManager);
    const indexDelta =
      getFractionalPointIndex(e._offset.offsetX, model) -
      getFractionalPointIndex(interactor.initialMouseEvent._offset.offsetX, model);

    syncPriceTagPanelReference(o, activePanel, seriesManager);
    const referenceValue = resolvePriceTagReferenceValue(o, model, activePanel, seriesManager);
    const priceOptions = {
      panelHeight: activePanel._height,
      minValue: activePanel.vMin,
      maxValue: activePanel.vMax,
      valueAxisMode: activePanel.valueAxisMode,
      fV: referenceValue,
    };
    const yOffset = Number.parseFloat(
      (
        renderer.getPriceForYCoordinate(e._offset.offsetY - activePanel._offset, priceOptions) -
        renderer.getPriceForYCoordinate(
          interactor.initialMouseEvent._offset.offsetY - activePanel._offset,
          priceOptions,
        )
      ).toFixed(activePanel.precision ?? 0),
    );

    if (Math.abs(indexDelta) > 0 || Math.abs(yOffset) > 0) {
      this.wasDrag = true;
    }

    const nextIndex = startIndex + indexDelta;
    o.anchors[0]._index = nextIndex;

    const grabbedAnchorHandle = interactor.currentAnchor.selected != null;
    const precision = resolvePriceTagPrecision(renderer, model, activePanel);

    if (grabbedAnchorHandle) {
      if (isPriceTagMainChartPanel(activePanel)) {
        o.sticky = true;
        o.anchors[0].value = LIB.round(
          resolveMagnetAnchorValue(
            this,
            o,
            interactor,
            e._offset.offsetX,
            e._offset.offsetY,
            renderer,
            model,
            activePanel,
            seriesManager,
          ),
          precision,
        );
      } else {
        o.anchors[0].value = LIB.round(
          renderer.getPriceForYCoordinate(e._offset.offsetY - activePanel._offset, priceOptions),
          precision,
        );
      }
    } else {
      o.anchors[0].value = snapPriceTagAnchorValueAtIndex(
        this,
        o,
        interactor,
        nextIndex,
        baseAnchor.value + yOffset,
        renderer,
        model,
        activePanel,
        seriesManager,
      );
    }

    o.anchors[0].stamp = getFractionalIndexStamp(nextIndex, model, seriesManager);
  };

  this.stageDown = function (...args: ShapeLifecycleArgs) {
    const [e, o, renderer, interactor, model, panel, seriesManager] = args;
    const activePanel = resolvePriceTagPanel(panel, interactor, e);

    if (!activePanel || !o.anchors[0] || !e._offset) {
      return {
        selected: 1,
        anchors: this.cloneAnchors(o.anchors),
      };
    }

    setPriceTagAnchorValueFromPointer(
      this,
      o,
      e._offset.offsetX,
      e._offset.offsetY,
      renderer,
      interactor,
      model,
      activePanel,
      seriesManager,
    );

    return {
      selected: 1,
      anchors: this.cloneAnchors(o.anchors),
    };
  };

  this.stageMove = function (...args: ShapeInteractionArgs) {
    const [e, o, renderer, interactor, model, panel, seriesManager] = args;
    if (!interactor.currentAnchor || !o.anchors[0] || !e._offset) return;

    const activePanel = resolvePriceTagPanel(panel, interactor, e);
    if (!activePanel) return;

    setPriceTagAnchorValueFromPointer(
      this,
      o,
      e._offset.offsetX,
      e._offset.offsetY,
      renderer,
      interactor,
      model,
      activePanel,
      seriesManager,
    );
  };

  this.stageDrag = function (...args: ShapeInteractionArgs) {
    const [e, o, renderer, interactor, model, panel, seriesManager] = args;
    const xPointsOffset = e._offset.offsetX - interactor.initialMouseEvent._offset.offsetX;
    const yPointsOffset = e._offset.offsetY - interactor.initialMouseEvent._offset.offsetY;

    if (
      Math.abs(xPointsOffset) > this.hitTolerance ||
      Math.abs(yPointsOffset) > this.hitTolerance
    ) {
      interactor.currentAnchor.drag = true;
    }

    this.stageMove(e, o, renderer, interactor, model, panel, seriesManager);
  };

  this.stageUp = function (...[event, object, renderer, interactor, model, panel]: ShapeLifecycleArgs) {
    const activePanel = resolvePriceTagPanel(panel, interactor, event);
    return Shape.prototype.stageUpWithSelectionLimit.call(
      this,
      event,
      object,
      renderer,
      interactor,
      model,
      activePanel,
      1,
    );
  };
}

const PriceTagObjectCtor: import("./_sharedTypes").ShapeConstructor =
  PriceTagObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { PriceTagObjectCtor as PriceTagObject };
