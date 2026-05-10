import LIB from "../../utils/chartingCommons";
import type {
  SeriesManagerContext,
  SeriesMenuObject,
  SeriesModelContext,
  SeriesPanelContext,
  SeriesPriceTagConfig,
  SeriesRendererContext,
} from "./_sharedTypes";

export function renderSeriesPriceTag<TObject extends SeriesMenuObject>(
  object: TObject,
  context: CanvasRenderingContext2D,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
  config: SeriesPriceTagConfig<TObject>
) {
  const dataLink = object.dataLink;
  const dataField = object.dataField;
  if (!dataLink || !dataField) return;

  const series = seriesManager[dataLink];
  if (!series || !series.data || series.data.length === 0) return;

  const data = series.data;
  const lastPoint = data[data.length - 1];
  const renderMode = config.getRenderMode(object, model);

  let value = 0;
  let open = 0;
  let color = config.getBaseColor(object);
  const textColor = config.getTextColor(object, color);

  const openField = object.openDataField ? object.openDataField : dataField;
  const closeField = object.closeDataField ? object.closeDataField : dataField;

  if (config.lineModes.includes(renderMode)) {
    const lineValue = lastPoint[dataField];
    if (typeof lineValue !== "number") return;
    value = lineValue;
  }

  if (config.ohlcModes.includes(renderMode)) {
    const closeValue = lastPoint[closeField];
    const openValue = lastPoint[openField];
    if (typeof closeValue !== "number" || typeof openValue !== "number") return;
    value = closeValue;
    open = openValue;
    color = value - open > 0 ? config.getUpColor(object) : config.getDownColor(object);
  }

  const fV = LIB.getReferenceValue(object, model, seriesManager);
  const valueY =
    renderer.getYCoordinateForPrice(value, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    }) + panel._offset;

  renderer.drawPriceTag(
    context,
    model,
    panel,
    valueY,
    color ?? config.getUpColor(object),
    textColor,
    value,
    "real"
  );
}