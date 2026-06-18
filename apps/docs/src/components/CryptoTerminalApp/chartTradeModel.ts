import type { ChartInstance } from "@efixdata/exeria-chart";
import type { OpenPosition, SimulatedOrder } from "./mockMarketData";

type ChartTradeInstrument = {
  type: "OTC";
  symbol: string;
  precision: number;
};

export type ChartTradeLine = {
  id: string;
  type: string;
  price: number;
  limitPrice?: number | undefined;
  stopPrice?: number | undefined;
  title: string;
  operation: "BUY" | "SELL";
  parentId?: string | null | undefined;
  modifyAllowed?: boolean | undefined;
  relatedAllowed?: boolean | undefined;
  modified?: boolean;
  stop?: boolean | undefined;
  object: {
    id: string;
    price: number;
    limitPrice?: number | undefined;
    stopPrice?: number | undefined;
    classification?: string | undefined;
    instrument: ChartTradeInstrument;
    [key: string]: unknown;
  };
};

type ChartWithTradeModel = ChartInstance & {
  model?: {
    orders: { list: ChartTradeLine[]; visible: boolean };
    positions: { list: ChartTradeLine[]; visible: boolean };
  };
  container?: HTMLElement & {
    options?: ChartTradeHostOptions;
  };
};

export type ChartContextMenuPointer = {
  clientX: number;
  clientY: number;
};

export type ChartTradeHostOptions = {
  doClosePositionCallback?: (payload: { id?: string }) => void;
  doDeleteOrderCallback?: (payload: { id?: string }) => void;
  doModifyOrderCallback?: (payload: {
    id?: string;
    limitPrice?: number | undefined;
    stopPrice?: number | undefined;
    price?: number;
  }) => void;
  doAddRelatedOrder?: (payload: {
    price: number;
    type: "SL" | "TP";
    parent: { id?: string };
  }) => void;
  placeOrderFromChartCallback?: (pointer: ChartContextMenuPointer) => void;
};

export type ChartTradeHandlers = {
  onClosePosition: (positionId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onModifyOrder: (orderId: string, price: number) => void;
  onAddBracketOrder: (positionId: string, type: "SL" | "TP", price: number) => void;
  onPlaceOrderFromChart?: (pointer: ChartContextMenuPointer) => void;
};

function buildTradeInstrument(symbol: string): ChartTradeInstrument {
  return {
    type: "OTC",
    symbol,
    precision: symbol.startsWith("BTC") ? 2 : 4,
  };
}

function buildLimitOrderLine(order: SimulatedOrder): ChartTradeLine {
  const operation = order.side === "buy" ? "BUY" : "SELL";
  const type = order.side === "buy" ? "BUY LIMIT" : "SELL LIMIT";

  return {
    id: order.id,
    type,
    price: order.price,
    limitPrice: order.price,
    title: order.symbol.replace("USDT", "/USDT"),
    operation,
    parentId: null,
    modifyAllowed: true,
    object: {
      id: order.id,
      price: order.price,
      limitPrice: order.price,
      classification: "DEFAULT",
      instrument: buildTradeInstrument(order.symbol),
    },
  };
}

function buildBracketOrderLine(order: SimulatedOrder): ChartTradeLine {
  const operation = order.side === "buy" ? "BUY" : "SELL";
  const bracketType = order.bracketType ?? "SL";
  const isStop = bracketType === "SL";

  return {
    id: order.id,
    type: bracketType,
    price: order.price,
    limitPrice: isStop ? undefined : order.price,
    stopPrice: isStop ? order.price : undefined,
    title: bracketType,
    operation,
    parentId: order.parentId ?? null,
    modifyAllowed: true,
    stop: isStop,
    object: {
      id: order.id,
      price: order.price,
      limitPrice: isStop ? undefined : order.price,
      stopPrice: isStop ? order.price : undefined,
      instrument: buildTradeInstrument(order.symbol),
    },
  };
}

function buildPositionLine(position: OpenPosition): ChartTradeLine {
  const operation = position.side === "buy" ? "BUY" : "SELL";

  return {
    id: position.id,
    type: "POSITION",
    price: position.entryPrice,
    title: position.symbol.replace("USDT", "/USDT"),
    operation,
    parentId: null,
    relatedAllowed: true,
    object: {
      id: position.id,
      price: position.entryPrice,
      instrument: buildTradeInstrument(position.symbol),
    },
  };
}

function isTradeLineBeingDragged(chart: ChartInstance): boolean {
  const interactor = chart.getInteractor() as {
    currentHitObject?: { isBeingDragged?: boolean; type?: string };
  };
  const hit = interactor.currentHitObject;
  if (!hit?.isBeingDragged) {
    return false;
  }

  const type = hit.type ?? "";
  return (
    type === "POSITION" ||
    type === "SL" ||
    type === "TP" ||
    type.includes("LIMIT") ||
    type.includes("STOP")
  );
}

function repaintChart(chart: ChartInstance): void {
  const runtime = chart as ChartInstance & { rerender?: () => void };
  if (runtime.rerender) {
    runtime.rerender();
    return;
  }

  chart.render();
}

function buildTradeLists(
  orders: SimulatedOrder[],
  openPositions: OpenPosition[],
  selectedSymbol: string,
) {
  const symbolOrders = orders.filter((order) => order.symbol === selectedSymbol);
  const symbolPositions = openPositions.filter((position) => position.symbol === selectedSymbol);
  const workingOrders = symbolOrders.filter((order) => !order.bracketType);
  const bracketOrders = symbolOrders.filter((order) => order.bracketType);

  return {
    orders: [
      ...workingOrders.map(buildLimitOrderLine),
      ...bracketOrders.map(buildBracketOrderLine),
    ],
    positions: symbolPositions.map(buildPositionLine),
  };
}

export function purgeTradeLinesFromChart(
  chart: ChartInstance,
  ids: { orderIds?: string[]; positionIds?: string[] },
): void {
  const model = (chart as ChartWithTradeModel).model;
  if (!model) {
    return;
  }

  const orderIds = new Set((ids.orderIds ?? []).map(String));
  const positionIds = new Set((ids.positionIds ?? []).map(String));

  if (orderIds.size > 0) {
    model.orders.list = model.orders.list.filter((line) => {
      const lineId = String(line.id);
      const objectId = line.object?.id !== undefined ? String(line.object.id) : "";
      return (
        lineId !== "empty" &&
        !orderIds.has(lineId) &&
        (objectId === "" || !orderIds.has(objectId))
      );
    });
  }

  if (positionIds.size > 0) {
    model.positions.list = model.positions.list.filter((line) => {
      const lineId = String(line.id);
      const objectId = line.object?.id !== undefined ? String(line.object.id) : "";
      return !positionIds.has(lineId) && (objectId === "" || !positionIds.has(objectId));
    });
  }

  repaintChart(chart);
}

export function syncChartTradeModel(
  chart: ChartInstance,
  orders: SimulatedOrder[],
  openPositions: OpenPosition[],
  selectedSymbol: string,
  options?: { force?: boolean },
): void {
  const runtime = chart as ChartWithTradeModel;
  const model = runtime.model;
  if (!model) {
    return;
  }

  if (!options?.force && isTradeLineBeingDragged(chart)) {
    return;
  }

  const next = buildTradeLists(orders, openPositions, selectedSymbol);

  model.orders.list = next.orders;
  model.positions.list = next.positions;
  model.orders.visible = true;
  model.positions.visible = true;
  repaintChart(chart);
}

export function wireChartTradeCallbacks(
  chart: ChartInstance,
  handlers: ChartTradeHandlers,
): void {
  const host = (chart as ChartWithTradeModel).container;
  if (!host) {
    return;
  }

  if (!host.options) {
    host.options = {};
  }

  host.options.doClosePositionCallback = (payload) => {
    const positionId = payload?.id;
    if (positionId) {
      purgeTradeLinesFromChart(chart, { positionIds: [positionId] });
      handlers.onClosePosition(positionId);
    }
  };

  host.options.doDeleteOrderCallback = (payload) => {
    const orderId = payload?.id;
    if (orderId) {
      purgeTradeLinesFromChart(chart, { orderIds: [orderId] });
      handlers.onCancelOrder(orderId);
    }
  };

  host.options.doModifyOrderCallback = (payload) => {
    const orderId = payload?.id;
    const nextPrice = payload?.limitPrice ?? payload?.stopPrice ?? payload?.price;
    if (orderId && typeof nextPrice === "number" && Number.isFinite(nextPrice)) {
      handlers.onModifyOrder(orderId, nextPrice);
    }
  };

  host.options.doAddRelatedOrder = (payload) => {
    const positionId = payload?.parent?.id;
    if (positionId && payload.type && typeof payload.price === "number") {
      purgeTradeLinesFromChart(chart, { orderIds: ["empty"] });
      handlers.onAddBracketOrder(positionId, payload.type, payload.price);
    }
  };

  if (handlers.onPlaceOrderFromChart) {
    host.options.placeOrderFromChartCallback = handlers.onPlaceOrderFromChart;
  }
}
