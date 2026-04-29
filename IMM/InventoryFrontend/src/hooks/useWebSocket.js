import { useEffect, useRef } from "react";
import io from "socket.io-client";

const rawSocketUrl =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_BACKEND_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL;

// Clean up the socket URL by removing /api suffix and trailing slashes
let socketUrl = rawSocketUrl?.replace(/\/api\/?$/, "").replace(/\/$/, "") || "";

// Only default to localhost in development mode
if (!socketUrl && import.meta.env.DEV) {
  socketUrl = "http://localhost:4000";
}
// In production, leave socketUrl empty to connect to current domain

let sharedSocket = null;
let activeSubscribers = 0;

const ensureSocket = () => {
  if (!sharedSocket) {
    sharedSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });
  }

  return sharedSocket;
};

export const useWebSocket = ({ enabled = true, onInventoryEvent, onNotificationEvent } = {}) => {
  const inventoryHandlerRef = useRef(onInventoryEvent);
  const notificationHandlerRef = useRef(onNotificationEvent);

  useEffect(() => {
    inventoryHandlerRef.current = onInventoryEvent;
  }, [onInventoryEvent]);

  useEffect(() => {
    notificationHandlerRef.current = onNotificationEvent;
  }, [onNotificationEvent]);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = ensureSocket();
    activeSubscribers += 1;

    const relayInventoryEvent = (type) => (data) => {
      inventoryHandlerRef.current?.({
        type,
        data,
        receivedAt: new Date().toISOString(),
      });
    };

    const relayNotificationEvent = (type) => (data) => {
      notificationHandlerRef.current?.({
        type,
        data,
        receivedAt: new Date().toISOString(),
      });
    };

    const handleConnect = () => {
      console.log("WebSocket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("WebSocket disconnected");
    };

    const handleConnectError = (error) => {
      console.error("WebSocket connection error:", error?.message || error);
    };

    const createdHandler = relayInventoryEvent("created");
    const updatedHandler = relayInventoryEvent("updated");
    const deletedHandler = relayInventoryEvent("deleted");
    const adjustedHandler = relayInventoryEvent("stock-adjusted");
    const notificationUpsertHandler = relayNotificationEvent("upsert");
    const notificationResolvedHandler = relayNotificationEvent("resolved");
    const notificationReadHandler = relayNotificationEvent("read");
    const notificationAllReadHandler = relayNotificationEvent("all-read");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("inventory:created", createdHandler);
    socket.on("inventory:updated", updatedHandler);
    socket.on("inventory:deleted", deletedHandler);
    socket.on("inventory:stock-adjusted", adjustedHandler);
    socket.on("notification:upsert", notificationUpsertHandler);
    socket.on("notification:resolved", notificationResolvedHandler);
    socket.on("notification:read", notificationReadHandler);
    socket.on("notification:all-read", notificationAllReadHandler);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("inventory:created", createdHandler);
      socket.off("inventory:updated", updatedHandler);
      socket.off("inventory:deleted", deletedHandler);
      socket.off("inventory:stock-adjusted", adjustedHandler);
      socket.off("notification:upsert", notificationUpsertHandler);
      socket.off("notification:resolved", notificationResolvedHandler);
      socket.off("notification:read", notificationReadHandler);
      socket.off("notification:all-read", notificationAllReadHandler);

      activeSubscribers = Math.max(0, activeSubscribers - 1);

      if (activeSubscribers === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, [enabled]);

  return sharedSocket;
};
