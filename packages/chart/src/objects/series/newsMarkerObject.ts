import WEBRCP from "../../WebRCP";
import { resolveChartLocaleMessage } from "../../chartLocaleRuntime";
import FUSION from "../../fusion";
import LIB from "../../utils/chartingCommons";
import type { LegacySeriesObject } from "../../objectRuntimeBases";
import { getScriptTitle, isSeriesHitPoint } from "./_sharedTypes";
import type {
  RuntimeObjectConstructor,
  SeriesManagerContext,
  SeriesModelContext,
  SeriesPanelContext,
  SeriesRendererContext,
  SeriesRuntime,
  SeriesTooltipData,
  SeriesScriptManagerContext,
} from "./_sharedTypes";

type NewsMarkerPlotter = LegacySeriesObject & {
  buyColor?: string;
  sellColor?: string;
  neutralColor?: string;
  markerShape?: string;
  _newsBarIndex?: number;
};

function getLinkedSeries(
  object: LegacySeriesObject & { dataLink?: string },
  seriesManager: SeriesManagerContext,
) {
  if (!object.dataLink) {
    return null;
  }

  return seriesManager[object.dataLink] ?? null;
}

function getStrategyField(
  object: LegacySeriesObject & { dataField?: string | null },
  forceField?: string,
) {
  return forceField ?? object.dataField ?? null;
}

function getStrategyValue(value: unknown) {
  return typeof value === "number" && value !== 0 ? value : null;
}

function getMarkerColor(object: NewsMarkerPlotter, strategyValue: number): string {
  if (strategyValue === FUSION.BUY) {
    return object.buyColor ?? WEBRCP.utils.colorManager.getColor("buyColor");
  }

  if (strategyValue === FUSION.SELL) {
    return object.sellColor ?? WEBRCP.utils.colorManager.getColor("sellColor");
  }

  return object.neutralColor ?? object.color ?? "#3b82f6";
}

function getMarkerRadius(object: NewsMarkerPlotter, dataPoint?: { strength?: number }): number {
  if (typeof object.width === "number" && object.width > 0) {
    return Math.max(3, object.width);
  }

  if (typeof dataPoint?.strength === "number" && dataPoint.strength > 0) {
    return Math.max(3, dataPoint.strength);
  }

  return 6;
}

function getAuxPanelMarkerY(panel: SeriesPanelContext): number {
  return panel._offset + panel._height / 2;
}

function getMarkerY(
  index: number,
  panel: SeriesPanelContext,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  seriesManager: SeriesManagerContext,
): number | null {
  if (panel.main !== true) {
    return getAuxPanelMarkerY(panel);
  }

  const mainSeriesKey = model.mainSeries;
  if (typeof mainSeriesKey !== "string") {
    return null;
  }

  const candle = seriesManager[mainSeriesKey]?.data?.[index] as { l?: number } | undefined;
  if (!candle || candle.l === undefined) {
    return null;
  }

  const fV = LIB.getReferenceValue({ dataLink: mainSeriesKey }, model, seriesManager);
  return (
    renderer.getYCoordinateForPrice(candle.l, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    }) +
    panel._offset +
    14
  );
}

function appendMarkerShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  radius: number,
) {
  if (shape === "Square") {
    ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
    return;
  }

  if (shape === "Triangle") {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y + radius);
    ctx.lineTo(x - radius, y + radius);
    ctx.closePath();
    return;
  }

  ctx.moveTo(x + radius, y);
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
}

const NewsMarkerObject = function (this: SeriesRuntime) {
  this.getMenuItems = function () {
    return null;
  };

  this.render = function (
    o: NewsMarkerPlotter,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext,
    forceField?: string,
  ) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) {
      return false;
    }

    renderer.validateSeriesBeforeRender(linkedSeries);

    const field = getStrategyField(o, forceField);
    if (!field) {
      return false;
    }

    const shape = o.markerShape ?? "Circle";
    const markers: Array<{
      midX: number;
      valueY: number;
      strategyValue: number;
      pointRadius: number;
    }> = [];

    for (let index = model._leftIndex; index <= model._rightIndex; index += 1) {
      if (index > linkedSeries.data.length - 1) {
        continue;
      }

      const dataPoint = linkedSeries.data[index];
      const strategyValue = getStrategyValue(dataPoint[field]);
      if (strategyValue === null) {
        continue;
      }

      const indexX = renderer.getIndexPoint(index, model);
      const midX =
        model.periodWidth === 1 ? indexX : indexX + (model._midOffset ?? 0);
      const valueY = getMarkerY(index, panel, renderer, model, seriesManager);

      if (valueY === null) {
        continue;
      }

      markers.push({
        midX,
        valueY,
        strategyValue,
        pointRadius: getMarkerRadius(o, dataPoint as { strength?: number }),
      });
    }

    ctx.save();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;

    const groups = new Map<
      string,
      {
        color: string;
        shape: string;
        pointRadius: number;
        items: Array<{ midX: number; valueY: number }>;
      }
    >();

    for (const marker of markers) {
      const color = getMarkerColor(o, marker.strategyValue);
      const groupKey = `${color}|${shape}|${marker.pointRadius}`;
      const group = groups.get(groupKey);

      if (group) {
        group.items.push({ midX: marker.midX, valueY: marker.valueY });
        continue;
      }

      groups.set(groupKey, {
        color,
        shape,
        pointRadius: marker.pointRadius,
        items: [{ midX: marker.midX, valueY: marker.valueY }],
      });
    }

    for (const group of groups.values()) {
      ctx.fillStyle = group.color;
      ctx.beginPath();

      for (const item of group.items) {
        appendMarkerShape(ctx, group.shape, item.midX, item.valueY, group.pointRadius);
      }

      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
    return true;
  };

  this.postRender = function () {};

  this.renderOverlay = function (
    o: NewsMarkerPlotter,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext,
  ) {
    if (!isSeriesHitPoint(o._hit)) {
      return;
    }

    this.drawHit(o, ctx, renderer, model, panel, seriesManager);
  };

  this.renderPriceTag = function () {};

  this.getToolTip = function (
    o: NewsMarkerPlotter,
    index: number,
    model: SeriesModelContext,
    seriesManager: SeriesManagerContext,
    scriptManager: SeriesScriptManagerContext,
  ) {
    const linkedSeries = getLinkedSeries(o, seriesManager);
    if (!linkedSeries) {
      return null;
    }

    const dataPoint = linkedSeries.data[index];
    if (!dataPoint) {
      return null;
    }

    const field = getStrategyField(o);
    if (!field) {
      return null;
    }

    const strategyValue = getStrategyValue(dataPoint[field]);
    if (strategyValue === null) {
      return null;
    }

    const values: SeriesTooltipData["values"] = [
      {
        label: resolveChartLocaleMessage("newsFeedSentiment", "Sentiment"),
        value: sentimentLabel(strategyValue),
      },
    ];

    return {
      title: getScriptTitle(o, model, seriesManager, scriptManager),
      stamp: dataPoint.stamp,
      values,
    };

    function sentimentLabel(value: number): string {
      if (value === FUSION.BUY) {
        return "Positive";
      }
      if (value === FUSION.SELL) {
        return "Negative";
      }
      return "Neutral";
    }
  };

  this.drawHit = function (
    o: NewsMarkerPlotter,
    ctx: CanvasRenderingContext2D,
    renderer: SeriesRendererContext,
    model: SeriesModelContext,
    panel: SeriesPanelContext,
    seriesManager: SeriesManagerContext,
  ) {
    if (!isSeriesHitPoint(o._hit)) {
      return;
    }

    const linkedSeries = getLinkedSeries(o, seriesManager);
    const field = getStrategyField(o);
    if (!linkedSeries || !field) {
      return;
    }

    const index = renderer.getPointIndex(o._hit.x, model);
    const strategyValue = getStrategyValue(linkedSeries.data[index]?.[field]);
    if (strategyValue === null) {
      return;
    }

    const indexX = renderer.getIndexPoint(index, model);
    const x = model.periodWidth === 1 ? indexX : indexX + (model._midOffset ?? 0);
    const y = getMarkerY(index, panel, renderer, model, seriesManager);
    if (y === null) {
      return;
    }

    const radius = getMarkerRadius(o, linkedSeries.data[index] as { strength?: number }) + 3;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = WEBRCP.utils.colorManager.getColor("hitColor");
    ctx.globalAlpha = 0.8;
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.stroke();
    ctx.restore();
  };

  this.hit = function (x, y, o, renderer, interactor, model, panel, seriesManager) {
    const plotter = o as NewsMarkerPlotter;
    if (plotter.hidden === true) {
      return false;
    }

    this.clearHits(plotter);

    const linkedSeries = getLinkedSeries(plotter, seriesManager);
    const field = getStrategyField(plotter);
    if (!linkedSeries || !field) {
      return false;
    }

    const tolerance = interactor?.hitTolerance ?? 4;
    const start = Math.max(0, model._leftIndex);
    const end = Math.min(linkedSeries.data.length - 1, model._rightIndex);
    let closestBarIndex: number | null = null;
    let closestDistance = Infinity;

    for (let barIndex = start; barIndex <= end; barIndex += 1) {
      const strategyValue = getStrategyValue(linkedSeries.data[barIndex]?.[field]);
      if (strategyValue === null) {
        continue;
      }

      const radius =
        getMarkerRadius(plotter, linkedSeries.data[barIndex] as { strength?: number }) + tolerance;
      const indexX = renderer.getIndexPoint(barIndex, model);
      const pointX = model.periodWidth === 1 ? indexX : indexX + (model._midOffset ?? 0);
      const pointY = getMarkerY(barIndex, panel, renderer, model, seriesManager);

      if (pointY === null) {
        continue;
      }

      const distance = Math.hypot(x - pointX, y - pointY);
      if (distance <= radius && distance < closestDistance) {
        closestDistance = distance;
        closestBarIndex = barIndex;
      }
    }

    if (closestBarIndex === null) {
      plotter._hit = false;
      return false;
    }

    plotter._hit = { x, y };
    plotter._newsBarIndex = closestBarIndex;
    return true;
  };
};

const NewsMarkerObjectCtor =
  NewsMarkerObject as unknown as RuntimeObjectConstructor<SeriesRuntime>;

export { NewsMarkerObjectCtor as NewsMarkerObject };
