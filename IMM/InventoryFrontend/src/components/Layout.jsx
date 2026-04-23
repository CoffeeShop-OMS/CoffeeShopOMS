import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import StockAlertModal from "./inventory/StockAlertModal";
import { getAuthSession } from "../utils/authStorage";
import { getInventory, getNotifications, markAllNotificationsRead } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";
import { subscribeToInventoryRefresh } from "../utils/inventoryEvents";
import { summarizeInventoryBatches } from "../utils/inventoryBatches";
import {
  applyNotificationSocketEvent,
  applyRealtimeRawInventoryEvent,
  mapInventoryItemToAlertUi,
  mapNotificationToUi,
  mergeStoredNotifications,
} from "../utils/inventoryRealtime";

const FALLBACK_SYNC_MS = 5 * 60 * 1000; // Reduced polling: 5min fallback

const isExpiredItem = (item = {}) => {
  if ((item.status || "active") !== "active") return false;
  return summarizeInventoryBatches(item).hasExpiredStock;
};

export default function Layout({ children, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const inventoryItemsRef = useRef([]);
  const alertStatesRef = useRef(new Map());
  const hasActiveSession = Boolean(getAuthSession()?.token);

  const maybeShowStockAlert = useCallback((items) => {
    const nextAlertStates = new Map();

    items
      .filter((item) => (item.status || "active") !== "deleted")
      .forEach((item) => {
        const quantity = Number(item.quantity ?? 0);
        const threshold = Number(item.lowStockThreshold ?? 0);
        const alertTypes = [];

        if (quantity <= 0) {
          alertTypes.push("out");
        } else if (quantity <= threshold) {
          alertTypes.push("low");
        }

        if (isExpiredItem(item)) {
          alertTypes.push("expired");
        }

        if (alertTypes.length > 0) {
          nextAlertStates.set(item.id, alertTypes.join("|"));
        }
      });

    const shouldOpenModal =
      nextAlertStates.size > 0 &&
      (
        nextAlertStates.size !== alertStatesRef.current.size ||
        [...nextAlertStates.entries()].some(([itemId, state]) => alertStatesRef.current.get(itemId) !== state)
      );

    alertStatesRef.current = nextAlertStates;

    if (shouldOpenModal) {
      setShowStockAlert(true);
    }
  }, []);

  const syncInventoryItems = useCallback((items, { evaluateAlerts = true } = {}) => {
    inventoryItemsRef.current = items;
    setInventoryItems(items);

    if (evaluateAlerts) {
      maybeShowStockAlert(items);
    }
  }, [maybeShowStockAlert]);

  const loadInventory = useCallback(async () => {
    const session = getAuthSession();
    if (!session?.token) return;

    try {
      const result = await getInventory(session.token, { limit: 100, status: "all" });
      syncInventoryItems(result.data || []);
    } catch (error) {
      console.error("Failed to fetch inventory for alerts:", error);
    }
  }, [syncInventoryItems]);

  const loadNotifications = useCallback(async () => {
    const session = getAuthSession();
    if (!session?.token) return;

    try {
      const result = await getNotifications(session.token, { limit: 20 });
      const nextNotifications = Array.isArray(result?.data)
        ? result.data.map(mapNotificationToUi).filter(Boolean)
        : [];
      setNotifications(nextNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    const initialLoadFrame = window.requestAnimationFrame(() => {
      loadInventory();
      loadNotifications();
    });

    const interval = setInterval(loadInventory, FALLBACK_SYNC_MS);
    const notificationInterval = setInterval(loadNotifications, FALLBACK_SYNC_MS);
    return () => {
      window.cancelAnimationFrame(initialLoadFrame);
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, [loadInventory, loadNotifications]);

  useEffect(() => {
    return subscribeToInventoryRefresh(() => {
      loadInventory();
      loadNotifications();
    });
  }, [loadInventory, loadNotifications]);

  useWebSocket({
    enabled: hasActiveSession,
    onInventoryEvent: (event) => {
      const nextItems = applyRealtimeRawInventoryEvent(inventoryItemsRef.current, event);
      syncInventoryItems(nextItems);
    },
    onNotificationEvent: (event) => {
      if (event.type === "upsert") {
        setNotifications((previous) => mergeStoredNotifications(previous, event.data, 20));
        return;
      }

      setNotifications((previous) => applyNotificationSocketEvent(previous, event, 20));
    },
  });

  const markNotificationsRead = useCallback(async () => {
    if (!notifications.some((notification) => notification.unread)) return;

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.unread ? { ...notification, unread: false } : notification
      )
    );

    const session = getAuthSession();
    if (!session?.token) return;

    try {
      await markAllNotificationsRead(session.token);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      loadNotifications();
    }
  }, [loadNotifications, notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => notification.unread).length;
  }, [notifications]);

  const lowStockItems = useMemo(() => {
    return inventoryItems
      .filter((item) => (item.status || "active") !== "deleted")
      .filter((item) => {
        const quantity = Number(item.quantity ?? 0);
        const threshold = Number(item.lowStockThreshold ?? 0);
        return quantity > 0 && quantity <= threshold;
      })
      .map(mapInventoryItemToAlertUi);
  }, [inventoryItems]);

  const outOfStockItems = useMemo(() => {
    return inventoryItems
      .filter((item) => (item.status || "active") !== "deleted")
      .filter((item) => Number(item.quantity ?? 0) <= 0)
      .map(mapInventoryItemToAlertUi);
  }, [inventoryItems]);

  const expiredItems = useMemo(() => {
    return inventoryItems
      .filter((item) => (item.status || "active") !== "deleted")
      .filter(isExpiredItem)
      .map(mapInventoryItemToAlertUi);
  }, [inventoryItems]);

  return (
    <div className="flex h-screen bg-[#FBFBFA] font-sans overflow-hidden w-screen">
      <Sidebar
        setIsAuthenticated={setIsAuthenticated}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300">
        <Navbar
          setMobileOpen={setMobileOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationsViewed={markNotificationsRead}
        />
        <div key={location.pathname} className="flex-1 overflow-y-auto w-full animate-fadeIn">
          {children}
        </div>
      </main>

      <StockAlertModal
        open={showStockAlert}
        lowStockItems={lowStockItems}
        outOfStockItems={outOfStockItems}
        expiredItems={expiredItems}
        onDismiss={() => setShowStockAlert(false)}
        onGoToInventory={() => {
          setShowStockAlert(false);
          navigate("/inventory");
        }}
      />
    </div>
  );
}
