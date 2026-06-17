import { useEffect, useState } from "react";
import type { SimulatedOrder } from "./mockMarketData";
import { formatPrice, formatSize } from "./terminalFormat";
import styles from "./cryptoTerminalApp.module.css";

type OrdersPanelProps = {
  orders: SimulatedOrder[];
  onCancelOrder: (orderId: string) => void;
  onUpdateOrder: (orderId: string, patch: { price?: number; size?: number }) => void;
};

type OrderCardProps = {
  order: SimulatedOrder;
  onCancelOrder: (orderId: string) => void;
  onUpdateOrder: (orderId: string, patch: { price?: number; size?: number }) => void;
};

function orderTypeLabel(order: SimulatedOrder): string {
  if (order.bracketType === "SL") {
    return "STOP";
  }

  if (order.bracketType === "TP") {
    return "TAKE PROFIT";
  }

  return `${order.side.toUpperCase()} LIMIT`;
}

function OrderCard({ order, onCancelOrder, onUpdateOrder }: OrderCardProps) {
  const [priceInput, setPriceInput] = useState(formatPrice(order.price));
  const [sizeInput, setSizeInput] = useState(formatSize(order.size));
  const isBracket = Boolean(order.bracketType);

  useEffect(() => {
    setPriceInput(formatPrice(order.price));
    setSizeInput(formatSize(order.size));
  }, [order.price, order.size]);

  const commitEdits = () => {
    const nextPrice = Number.parseFloat(priceInput.replace(/,/g, ""));
    const nextSize = Number.parseFloat(sizeInput.replace(/,/g, ""));

    const patch: { price?: number; size?: number } = {};
    if (Number.isFinite(nextPrice) && nextPrice > 0 && nextPrice !== order.price) {
      patch.price = nextPrice;
    }
    if (Number.isFinite(nextSize) && nextSize > 0 && nextSize !== order.size) {
      patch.size = nextSize;
    }

    if (Object.keys(patch).length > 0) {
      onUpdateOrder(order.id, patch);
    } else {
      setPriceInput(formatPrice(order.price));
      setSizeInput(formatSize(order.size));
    }
  };

  return (
    <li className={styles.positionCard}>
      <div className={styles.positionCardHeader}>
        <div className={styles.positionIdentity}>
          <strong>{order.symbol.replace("USDT", "/USDT")}</strong>
          <span
            className={
              isBracket
                ? styles.orderBracketType
                : order.side === "buy"
                  ? styles.positionSideBuy
                  : styles.positionSideSell
            }
          >
            {orderTypeLabel(order)}
          </span>
        </div>
        <button
          type="button"
          className={styles.positionCancel}
          aria-label={`Cancel ${orderTypeLabel(order).toLowerCase()} order`}
          onClick={() => onCancelOrder(order.id)}
        >
          ×
        </button>
      </div>
      <div className={styles.orderEditRow}>
        <label className={styles.orderEditField}>
          <span>Price</span>
          <input
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            onBlur={commitEdits}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            inputMode="decimal"
          />
        </label>
        <label className={styles.orderEditField}>
          <span>Size</span>
          <input
            value={sizeInput}
            onChange={(event) => setSizeInput(event.target.value)}
            onBlur={commitEdits}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            inputMode="decimal"
          />
        </label>
      </div>
      <div className={styles.positionMeta}>
        {isBracket ? <span>Attached to position</span> : null}
        <span>{new Date(order.placedAt).toLocaleTimeString()}</span>
      </div>
    </li>
  );
}

export default function OrdersPanel({ orders, onCancelOrder, onUpdateOrder }: OrdersPanelProps) {
  if (orders.length === 0) {
    return (
      <p className={styles.emptyState}>
        No working orders. Place a limit order — it appears on the chart as a native trade line.
        Drag the line to modify price, or click × on the chart to cancel. Use + on a position line
        to add stop / take-profit.
      </p>
    );
  }

  const sortedOrders = [...orders].sort((left, right) => right.placedAt - left.placedAt);

  return (
    <ul className={styles.positionsList}>
      {sortedOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onCancelOrder={onCancelOrder}
          onUpdateOrder={onUpdateOrder}
        />
      ))}
    </ul>
  );
}
