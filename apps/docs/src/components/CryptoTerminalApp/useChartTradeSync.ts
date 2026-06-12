import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { ChartInstance } from "@exeria/charts";
import {
  purgeTradeLinesFromChart,
  syncChartTradeModel,
  wireChartTradeCallbacks,
} from "./chartTradeModel";
import type { OpenPosition, SimulatedOrder } from "./mockMarketData";

type UseChartTradeSyncOptions = {
  selectedSymbol: string;
  markPrices: Record<string, number>;
  onOrderFilled?: (order: SimulatedOrder, fillPrice: number) => void;
  onOrderModified?: (orderId: string, price: number, symbol: string) => void;
  onPositionClosed?: (positionId: string) => void;
  onOrderCancelled?: (orderId: string) => void;
  onBracketOrderAdded?: (positionId: string, type: "SL" | "TP", price: number) => void;
  onPlaceOrderFromChart?: (pointer: { clientX: number; clientY: number }) => void;
};

function shouldFillOrder(order: SimulatedOrder, markPrice: number): boolean {
  if (order.bracketType) {
    return false;
  }

  if (order.side === "buy") {
    return markPrice <= order.price;
  }

  return markPrice >= order.price;
}

export function useChartTradeSync(
  chart: ChartInstance | null,
  orders: SimulatedOrder[],
  setOrders: Dispatch<SetStateAction<SimulatedOrder[]>>,
  openPositions: OpenPosition[],
  setOpenPositions: Dispatch<SetStateAction<OpenPosition[]>>,
  options: UseChartTradeSyncOptions,
) {
  const ordersRef = useRef(orders);
  const openPositionsRef = useRef(openPositions);
  const optionsRef = useRef(options);

  ordersRef.current = orders;
  openPositionsRef.current = openPositions;
  optionsRef.current = options;

  const syncChart = (force = false) => {
    if (!chart) {
      return;
    }

    syncChartTradeModel(
      chart,
      ordersRef.current,
      openPositionsRef.current,
      optionsRef.current.selectedSymbol,
      { force },
    );
  };

  useEffect(() => {
    if (!chart) {
      return undefined;
    }

    wireChartTradeCallbacks(chart, {
      onClosePosition: (positionId) => {
        setOpenPositions((current) => current.filter((position) => position.id !== positionId));
        setOrders((current) => current.filter((order) => order.parentId !== positionId));
        optionsRef.current.onPositionClosed?.(positionId);
        window.requestAnimationFrame(() => syncChart(true));
      },
      onCancelOrder: (orderId) => {
        setOrders((current) => current.filter((order) => order.id !== orderId));
        optionsRef.current.onOrderCancelled?.(orderId);
        window.requestAnimationFrame(() => syncChart(true));
      },
      onModifyOrder: (orderId, price) => {
        const order = ordersRef.current.find((item) => item.id === orderId);
        setOrders((current) =>
          current.map((item) => (item.id === orderId ? { ...item, price } : item)),
        );
        if (order) {
          optionsRef.current.onOrderModified?.(orderId, price, order.symbol);
        }
        window.requestAnimationFrame(() => syncChart(true));
      },
      onAddBracketOrder: (positionId, bracketType, price) => {
        const position = openPositionsRef.current.find((item) => item.id === positionId);
        if (!position) {
          return;
        }

        const closingSide = position.side === "buy" ? "sell" : "buy";
        const bracketOrder: SimulatedOrder = {
          id: `ord-${bracketType.toLowerCase()}-${Date.now()}`,
          symbol: position.symbol,
          side: closingSide,
          price,
          size: position.size,
          placedAt: Date.now(),
          parentId: position.id,
          bracketType,
        };

        setOrders((current) => [bracketOrder, ...current].slice(0, 24));
        optionsRef.current.onBracketOrderAdded?.(positionId, bracketType, price);
        window.requestAnimationFrame(() => syncChart(true));
      },
      onPlaceOrderFromChart: (pointer) => {
        optionsRef.current.onPlaceOrderFromChart?.(pointer);
      },
    });
  }, [chart, setOpenPositions, setOrders]);

  useEffect(() => {
    syncChart();
  }, [chart, openPositions, orders, options.selectedSymbol]);

  useEffect(() => {
    const markPrices = options.markPrices;
    const toFill = ordersRef.current.filter((order) => {
      if (order.bracketType) {
        return false;
      }

      const mark = markPrices[order.symbol];
      if (mark === undefined) {
        return false;
      }

      return shouldFillOrder(order, mark);
    });

    if (toFill.length === 0) {
      return;
    }

    const filledIds = new Set(toFill.map((order) => order.id));
    const fillPrices = new Map(
      toFill.map((order) => [order.id, markPrices[order.symbol] ?? order.price] as const),
    );
    const newPositions: OpenPosition[] = toFill.map((order) => ({
      id: `pos-${order.id}`,
      symbol: order.symbol,
      side: order.side,
      entryPrice: fillPrices.get(order.id) ?? order.price,
      size: order.size,
      openedAt: Date.now(),
    }));

    setOrders((current) => current.filter((order) => !filledIds.has(order.id)));
    setOpenPositions((current) => [...newPositions, ...current].slice(0, 16));

    if (chart) {
      for (const order of toFill) {
        purgeTradeLinesFromChart(chart, { orderIds: [order.id] });
      }
      window.requestAnimationFrame(() => syncChart(true));
    }

    for (const order of toFill) {
      optionsRef.current.onOrderFilled?.(order, fillPrices.get(order.id) ?? order.price);
    }
  }, [chart, options.markPrices, orders, setOpenPositions, setOrders]);
}
