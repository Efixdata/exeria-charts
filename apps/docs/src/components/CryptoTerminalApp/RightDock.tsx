import type { TapeTrade } from "./binancePublicStreams";
import type { OpenPosition, OrderBookLevel, SimulatedOrder } from "./mockMarketData";
import type { RightDockTab } from "./constants";
import { RIGHT_DOCK_TABS } from "./constants";
import AlertsPanel from "./AlertsPanel";
import OpenPositionsPanel from "./OpenPositionsPanel";
import OrderBookPanel from "./OrderBookPanel";
import OrdersPanel from "./OrdersPanel";
import type { PriceAlert } from "./priceAlerts";
import TradesTape from "./TradesTape";
import styles from "./cryptoTerminalApp.module.css";

type RightDockProps = {
  activeTab: RightDockTab;
  onTabChange: (tab: RightDockTab) => void;
  orderSide: "buy" | "sell";
  orderPrice: string;
  orderSize: string;
  onOrderSideChange: (side: "buy" | "sell") => void;
  onOrderPriceChange: (value: string) => void;
  onOrderSizeChange: (value: string) => void;
  onPlaceOrder: () => void;
  onSyncPrice: () => void;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadBps: number;
  trades: TapeTrade[];
  orders: SimulatedOrder[];
  openPositions: OpenPosition[];
  markPrices: Record<string, number>;
  onCancelOrder: (orderId: string) => void;
  onUpdateOrder: (orderId: string, patch: { price?: number; size?: number }) => void;
  onClosePosition: (positionId: string) => void;
  alerts: PriceAlert[];
  alertPrice: string;
  livePrice?: number;
  selectedSymbol: string;
  onAlertPriceChange: (value: string) => void;
  onAddAlert: () => void;
  onRemoveAlert: (alertId: string) => void;
};

export default function RightDock({
  activeTab,
  onTabChange,
  orderSide,
  orderPrice,
  orderSize,
  onOrderSideChange,
  onOrderPriceChange,
  onOrderSizeChange,
  onPlaceOrder,
  onSyncPrice,
  bids,
  asks,
  spread,
  spreadBps,
  trades,
  orders,
  openPositions,
  markPrices,
  onCancelOrder,
  onUpdateOrder,
  onClosePosition,
  alerts,
  alertPrice,
  livePrice,
  selectedSymbol,
  onAlertPriceChange,
  onAddAlert,
  onRemoveAlert,
}: RightDockProps) {
  const activeAlertCount = alerts.filter((alert) => alert.triggeredAt === undefined).length;
  const workingOrderCount = orders.length;

  return (
    <aside
      className={[styles.panel, styles.orderPanel].join(" ")}
      data-tour="trade-dock"
    >
      <div className={styles.dockTabs} role="tablist" aria-label="Market panels">
        {RIGHT_DOCK_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={[
              styles.dockTab,
              activeTab === tab.id ? styles.dockTabActive : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.dockTabLabel}>{tab.label}</span>
            {tab.id === "alerts" && activeAlertCount > 0 ? (
              <span className={styles.dockBadge}>{activeAlertCount}</span>
            ) : null}
            {tab.id === "orders" && workingOrderCount > 0 ? (
              <span className={styles.dockBadge}>{workingOrderCount}</span>
            ) : null}
            {tab.id === "holdings" && openPositions.length > 0 ? (
              <span className={styles.dockBadge}>{openPositions.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className={styles.dockBody}>
        {activeTab === "trade" ? (
          <div className={styles.orderForm}>
            <div className={styles.sideToggle}>
              <button
                type="button"
                className={[
                  styles.sideButton,
                  orderSide === "buy" ? styles.sideBuyActive : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onOrderSideChange("buy")}
              >
                Buy
              </button>
              <button
                type="button"
                className={[
                  styles.sideButton,
                  orderSide === "sell" ? styles.sideSellActive : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onOrderSideChange("sell")}
              >
                Sell
              </button>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="order-price">Price</label>
                <button type="button" className={styles.linkButton} onClick={onSyncPrice}>
                  Sync live
                </button>
              </div>
              <input
                id="order-price"
                value={orderPrice}
                onChange={(event) => onOrderPriceChange(event.target.value)}
                inputMode="decimal"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="order-size">Size</label>
              <input
                id="order-size"
                value={orderSize}
                onChange={(event) => onOrderSizeChange(event.target.value)}
                inputMode="decimal"
              />
            </div>

            <button type="button" className={styles.primaryButton} onClick={onPlaceOrder}>
              Place order
            </button>
          </div>
        ) : null}

        {activeTab === "book" ? (
          <OrderBookPanel bids={bids} asks={asks} spread={spread} spreadBps={spreadBps} />
        ) : null}

        {activeTab === "trades" ? <TradesTape trades={trades} /> : null}

        {activeTab === "alerts" ? (
    // @ts-ignore
          <AlertsPanel
            alerts={alerts}
            alertPrice={alertPrice}
            livePrice={livePrice}
            selectedSymbol={selectedSymbol}
            onAlertPriceChange={onAlertPriceChange}
            onAddAlert={onAddAlert}
            onRemoveAlert={onRemoveAlert}
          />
        ) : null}

        {activeTab === "orders" ? (
          <OrdersPanel
            orders={orders}
            onCancelOrder={onCancelOrder}
            onUpdateOrder={onUpdateOrder}
          />
        ) : null}

        {activeTab === "holdings" ? (
          <OpenPositionsPanel
            positions={openPositions}
            markPrices={markPrices}
            onClosePosition={onClosePosition}
          />
        ) : null}
      </div>
    </aside>
  );
}
