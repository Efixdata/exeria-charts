import LIB from "./utils/chartingCommons";
import { Shape } from "./Objects2";
import type { ChartPanelObject, ChartPanel, ChartModelFragment, SeriesManager, ScriptModelConfig } from "./internalTypes";

interface RendererObjectsRegistry {
  [key: string]: unknown;
}

interface RendererLike {
  objects: RendererObjectsRegistry;
}

interface ScriptController {
  id?: string | number;
  outputs: Record<string, string>;
  inputs: Record<string, unknown>;
  [key: string]: unknown;
}

type ScriptsManager = Record<string, ScriptController>;

interface InstrumentSeriesItem {
  seriesId: string;
  instrument?: {
    id?: string | number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ObjectsManagerChart {
  model: ChartModelFragment & {
    instrumentsSeries: InstrumentSeriesItem[];
    scripts: ScriptModelConfig[];
  };
  renderer: RendererLike;
  getScriptsManager(): ScriptsManager;
  getSeriesManager(): SeriesManager;
  removePanelFromModel(panel: ChartPanel): void;
  onInstrumentRemoved?(instrumentId?: string | number): void;
}

function isShapeObject(chart: ObjectsManagerChart, object: ChartPanelObject): boolean {
  return chart.renderer.objects[object.type || ""] instanceof Shape;
}

export default class ObjectsManager {
  chart: ObjectsManagerChart;

  constructor(chart: ObjectsManagerChart) {
    this.chart = chart;
  }

  moveObjectToPanel(o: ChartPanelObject, destPanelId: string | number): void {
    const sourcePanel = this.getPanelForObject(o);
    const destPanel = this.getPanelById(destPanelId);
    if (!sourcePanel || !destPanel) return;

    const objects = sourcePanel.objects;
    for (let index = 0; index < objects.length; index += 1) {
      if (o.id === objects[index].id) {
        objects.splice(index, 1);
        break;
      }
    }

    if (o.reference) {
      o.reference = null;
      for (let index = 0; index < destPanel.objects.length; index += 1) {
        if (destPanel.objects[index].type === "SeriesObject") {
          o.reference = `${destPanel.objects[index].dataLink}:${destPanel.objects[index].dataField}`;
        }
      }
    }

    destPanel.objects.push(o);
  }

  cloneObject(o: ChartPanelObject): ChartPanelObject {
    const panel = this.getPanelForObject(o);
    const clone = JSON.parse(JSON.stringify(o)) as ChartPanelObject;
    clone.id = LIB.getUniqueId();
    panel?.objects.push(clone);
    return clone;
  }

  detachObject(objectId?: string | number): void {
    const findRelatedScript = (object: ChartPanelObject): ScriptModelConfig | null => {
      for (let index = 0; index < this.chart.model.scripts.length; index += 1) {
        const script = this.chart.model.scripts[index];
        const inputs = script.inputs as Record<string, { id?: string | number }> | undefined;
        if (inputs) {
          for (const key in inputs) {
            const input = inputs[key];
            if (input.id === object.id) return script;
          }
        }
      }
      return null;
    };

    if (!objectId) return;

    const object = LIB.getObjectById(this.chart.model, objectId);
    if (!object) return;

    if (isShapeObject(this.chart, object)) {
      this.detachToolObject(object.id);
      const relatedScript = findRelatedScript(object);
      if (relatedScript) {
        const plotters = LIB.getPlottersForScriptByScriptId(this.chart.model, relatedScript.id as string | number);
        if (plotters.length > 0) {
          this.detachSeriesObject(plotters[0]);
        }
      }
    } else if (
      object.type === "SeriesObject" ||
      object.type === "StrategyObject" ||
      object.type === "CandlestickPatternStrategyObject" ||
      object.type === "FractalsObject"
    ) {
      this.detachSeriesObject(object);
    } else {
      console.warn("DELETE: unknown object ", object);
    }
  }

  detachAllToolObjects(): void {
    const panels = this.chart.model.panels;
    for (let panelIndex = 0; panelIndex < panels.length; panelIndex += 1) {
      for (let objectIndex = 0; objectIndex < panels[panelIndex].objects.length; objectIndex += 1) {
        const object = panels[panelIndex].objects[objectIndex];
        if (isShapeObject(this.chart, object)) {
          this.detachToolObject(object.id);
          if (objectIndex > 0) objectIndex -= 1;
        }
      }
    }
  }

  detachAllScriptObjects(): void {
    const panels = this.chart.model.panels;
    for (let panelIndex = 0; panelIndex < panels.length; panelIndex += 1) {
      for (let objectIndex = 0; objectIndex < panels[panelIndex].objects.length; objectIndex += 1) {
        const object = panels[panelIndex].objects[objectIndex];
        if (
          object.type === "SeriesObject" ||
          object.type === "StrategyObject" ||
          object.type === "CandlestickPatternStrategyObject" ||
          object.type === "FractalsObject"
        ) {
          const script = this.isThisSeriesOutputOfScript(object.dataLink);
          if (script) {
            this.detachSeriesObject(object);
            if (objectIndex > 0) objectIndex = 0;
            if (panelIndex > 0) panelIndex = 0;
          }
        }
      }
    }
  }

  detachPanel(panelId: string | number): void {
    const panel = this.getPanelById(panelId);
    if (!panel) return;
    if ((panel as { main?: boolean }).main) throw new Error("Can't delete main panel!");

    while (panel.objects.length > 0) {
      this.detachObject(panel.objects[0].id);
    }

    this.removeEmptyPanels();
  }

  detachScript(scriptId?: string | number): void {
    if (!scriptId) return;

    const script = this.getScriptControllerById(scriptId);
    if (!script) return;

    const resultArray: ScriptController[] = [script];
    for (const property in script.outputs) {
      if (Object.prototype.hasOwnProperty.call(script.outputs, property)) {
        const dataLink = script.outputs[property];
        this.getScriptsRelatedToSeries(dataLink, resultArray);
      }
    }

    for (let index = resultArray.length - 1; index >= 0; index -= 1) {
      this.removeScript(resultArray[index]);
    }
  }

  removeEmptyPanels(): void {
    const panels = this.chart.model.panels;
    for (let index = 0; index < panels.length; index += 1) {
      const count = panels[index].objects.filter(
        (object) =>
          object.type === "SeriesObject" ||
          object.type === "StrategyObject" ||
          object.type === "CandlestickPatternStrategyObject" ||
          object.type === "FractalsObject",
      ).length;
      if (count === 0) {
        this.chart.removePanelFromModel(panels[index]);
      }
    }
  }

  getSeriesById(objectId: string): unknown {
    return (this.chart.model as { objects?: { seriesManager?: Record<string, unknown> } }).objects?.seriesManager?.[objectId];
  }

  getScriptControllerById(scriptId: string | number): ScriptController | undefined {
    return this.chart.getScriptsManager()[String(scriptId)] || this.chart.getScriptsManager()[scriptId as never];
  }

  getScriptModelById(scriptId: string | number): ScriptModelConfig | undefined {
    for (let index = 0; index < this.chart.model.scripts.length; index += 1) {
      if (this.chart.model.scripts[index].id === scriptId) return this.chart.model.scripts[index];
    }
    return undefined;
  }

  getPanelById(panelId: string | number): ChartPanel | null {
    const panels = this.chart.model.panels;
    for (let index = 0; index < panels.length; index += 1) {
      if (panels[index].id === panelId) return panels[index];
    }
    return null;
  }

  detachToolObject(objectId?: string | number): void {
    if (!objectId) return;
    for (let panelIndex = 0; panelIndex < this.chart.model.panels.length; panelIndex += 1) {
      const objects = this.chart.model.panels[panelIndex].objects;
      for (let objectIndex = 0; objectIndex < objects.length; objectIndex += 1) {
        if (objectId === objects[objectIndex].id) {
          objects.splice(objectIndex, 1);
          return;
        }
      }
    }
  }

  detachSeriesObject(object: ChartPanelObject): void {
    if (object.dataLink) {
      const result: ScriptController[] = [];
      const script = this.isThisSeriesOutputOfScript(object.dataLink);
      if (script) result.push(script);
      this.getScriptsRelatedToSeries(object.dataLink, result);
      for (let index = result.length - 1; index >= 0; index -= 1) {
        this.removeScript(result[index]);
      }

      this.removeInstrument(object);
    }
  }

  removeInstrument(object: ChartPanelObject): void {
    const removePlotter = (objectId?: string | number) => {
      if (!objectId) return;
      for (let panelIndex = 0; panelIndex < this.chart.model.panels.length; panelIndex += 1) {
        const objects = this.chart.model.panels[panelIndex].objects;
        for (let objectIndex = 0; objectIndex < objects.length; objectIndex += 1) {
          if (objectId === objects[objectIndex].id) {
            objects.splice(objectIndex, 1);
            return;
          }
        }
      }
    };

    if (!object.dataLink) return;

    const model = this.chart.model;
    if (object.dataLink === model.mainSeries) {
      console.warn("Can't delete main series!");
      return;
    }

    for (let index = 0; index < this.chart.model.instrumentsSeries.length; index += 1) {
      if (this.chart.model.instrumentsSeries[index].seriesId === object.dataLink) {
        this.chart.onInstrumentRemoved?.(this.chart.model.instrumentsSeries[index].instrument?.id);
        this.chart.model.instrumentsSeries.splice(index, 1);
        break;
      }
    }

    delete this.chart.getSeriesManager()[object.dataLink];
    removePlotter(object.id);
  }

  removeScript(script: ScriptController): void {
    const model = this.chart.model;

    for (let index = 0; index < model.scripts.length; index += 1) {
      if (model.scripts[index].id === script.id) {
        model.scripts.splice(index, 1);
        break;
      }
    }

    const outputs = script.outputs;
    for (const property in outputs) {
      if (Object.prototype.hasOwnProperty.call(outputs, property)) {
        const dataLink = outputs[property];

        for (let panelIndex = 0; panelIndex < model.panels.length; panelIndex += 1) {
          const panel = model.panels[panelIndex];
          for (let objectIndex = 0; objectIndex < panel.objects.length; objectIndex += 1) {
            if (panel.objects[objectIndex].dataLink && panel.objects[objectIndex].dataLink === dataLink) {
              panel.objects.splice(objectIndex, 1);
              objectIndex -= 1;
            }
          }
        }

        delete this.chart.getSeriesManager()[dataLink];
      }
    }

    const inputs = script.inputs as Record<string, { canBeIndicator?: boolean; isIndicator?: boolean }>;
    for (const property in inputs) {
      if (inputs[property].canBeIndicator) {
        inputs[property].isIndicator = false;
      }
    }

    delete this.chart.getScriptsManager()[String(script.id)];
    this.removeEmptyPanels();
  }

  getScriptsRelatedToSeries(dataLink: string, resultArray: ScriptController[]): void {
    const scripts = this.isThisSeriesInputOfScript(dataLink);
    resultArray.push.apply(resultArray, scripts);
    for (let index = 0; index < scripts.length; index += 1) {
      const outputs = scripts[index].outputs;
      for (const property in outputs) {
        if (Object.prototype.hasOwnProperty.call(outputs, property)) {
          const nextDataLink = outputs[property];
          this.getScriptsRelatedToSeries(nextDataLink, resultArray);
        }
      }
    }
  }

  isThisSeriesOutputOfScript(dataLink?: string): ScriptController | null {
    if (!dataLink) return null;
    const scriptsManager = this.chart.getScriptsManager();
    for (const property in scriptsManager) {
      if (Object.prototype.hasOwnProperty.call(scriptsManager, property)) {
        const script = scriptsManager[property];
        const outputs = script.outputs;
        for (const outputKey in outputs) {
          if (Object.prototype.hasOwnProperty.call(outputs, outputKey) && outputs[outputKey] === dataLink) {
            return script;
          }
        }
      }
    }
    return null;
  }

  isThisSeriesInputOfScript(dataLink?: string): ScriptController[] {
    if (!dataLink) return [];
    const scriptsManager = this.chart.getScriptsManager();
    const result: ScriptController[] = [];
    for (const property in scriptsManager) {
      if (Object.prototype.hasOwnProperty.call(scriptsManager, property)) {
        const script = scriptsManager[property];
        const inputs = script.inputs;
        for (const inputKey in inputs) {
          if (`${inputs[inputKey]}`.startsWith(dataLink)) {
            result.push(script);
          }
        }
      }
    }
    return result;
  }

  getPanelForObject(object: ChartPanelObject): ChartPanel | null {
    const panels = this.chart.model.panels;
    for (let panelIndex = 0; panelIndex < panels.length; panelIndex += 1) {
      for (let objectIndex = 0; objectIndex < panels[panelIndex].objects.length; objectIndex += 1) {
        if (panels[panelIndex].objects[objectIndex].id === object.id) {
          return panels[panelIndex];
        }
      }
    }
    return null;
  }
}