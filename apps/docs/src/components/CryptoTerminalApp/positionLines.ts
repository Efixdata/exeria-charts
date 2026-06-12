import type { ChartInstance } from "@exeria/charts";

type ChartObject = {
  id?: string | number;
  type?: string;
  positionId?: string;
  anchors?: Array<{ value?: number }>;
};

type ChartModelAccess = ChartInstance & {
  model?: {
    panels: Array<{
      objects: ChartObject[];
    }>;
  };
};

function getPanelObjects(chart: ChartInstance): ChartObject[] {
  const model = (chart as ChartModelAccess).model;
  if (!model) {
    return [];
  }

  return model.panels.flatMap((panel) => panel.objects);
}

export function readOrderLinePrice(chart: ChartInstance, lineId: string | number): number | null {
  const object = getPanelObjects(chart).find((item) => item.id === lineId && item.type === "hLine");
  const value = object?.anchors?.[0]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function listOrderLineIds(chart: ChartInstance): Set<string | number> {
  const ids = new Set<string | number>();
  for (const object of getPanelObjects(chart)) {
    if (object.type === "hLine" && object.id !== undefined) {
      ids.add(object.id);
    }
  }
  return ids;
}

export function findLineIdByPositionId(
  chart: ChartInstance,
  positionId: string,
): string | number | null {
  const object = getPanelObjects(chart).find(
    (item) => item.type === "hLine" && item.positionId === positionId,
  );
  return object?.id ?? null;
}
