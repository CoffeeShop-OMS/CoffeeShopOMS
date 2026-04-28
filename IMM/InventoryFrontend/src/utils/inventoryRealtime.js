import { summarizeInventoryBatches } from "./inventoryBatches";

const categoryToBackend = {
  Beans: "beans",
  Milk: "milk",
  Syrup: "syrup",
  Cups: "packaging",
  Pastries: "other",
  Equipment: "equipment",
  "Add-ins": "add-ins",
  Powder: "powder",
  Other: "other",
};

const categoryFromBackend = {
  beans: "Beans",
  milk: "Milk",
  syrup: "Syrup",
  packaging: "Cups",
  equipment: "Equipment",
  "add-ins": "Add-ins",
  powder: "Powder",
  other: "Other",
};

const DEDUPE_WINDOW_MS = 5000;

export const parseTimestamp = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "object" && (value._seconds || value.seconds)) {
    return new Date((value._seconds || value.seconds) * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatFirestoreDate = (value) => {
  if (!value) return "-";

  try {
    if (typeof value.toDate === "function") return value.toDate().toISOString().slice(0, 10);
    if (typeof value === "object" && (value._seconds || value.seconds)) {
      return new Date((value._seconds || value.seconds) * 1000).toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return "-";
  } catch {
    return "-";
  }
};

const normalizeRawInventoryItem = (item = {}) => ({
  ...item,
  quantity: Number(item.quantity ?? 0),
  lowStockThreshold: Number(item.lowStockThreshold ?? 0),
  costPrice: Number(item.costPrice || 0),
  status: item.status || "active",
  stockBatches: Array.isArray(item.stockBatches) ? item.stockBatches : [],
});

const toRawInventoryShapeFromUi = (item = {}) => ({
  id: item.id,
  name: item.name,
  sku: item.sku || "",
  category: categoryToBackend[item.cat] || item.category || "other",
  quantity: Number(item.quantity ?? 0),
  unit: item.unit || "",
  lowStockThreshold: Number(item.threshold ?? 0),
  costPrice: Number(item.costPrice || 0),
  status: item.recordStatus || (item.isArchived ? "deleted" : "active"),
  isLowStock: item.isLow ?? false,
  expirationDate: item.expirationDate || null,
  stockBatches: Array.isArray(item.stockBatches) ? item.stockBatches : [],
  conversions: Array.isArray(item.conversions) ? item.conversions : [],
  createdAt: item.dateAdded,
  updatedAt: item.lastActivity || item.date,
});

const upsertById = (items, incoming, prependIfNew = false) => {
  const existingIndex = items.findIndex((item) => item.id === incoming.id);

  if (existingIndex === -1) {
    return prependIfNew ? [incoming, ...items] : [incoming, ...items];
  }

  const next = [...items];
  next[existingIndex] = incoming;
  return next;
};

const timestampsWithinWindow = (first, second) => {
  return Math.abs(parseTimestamp(first).getTime() - parseTimestamp(second).getTime()) <= DEDUPE_WINDOW_MS;
};

export const mapInventoryItemToUi = (item) => {
  const quantity = Number(item.quantity ?? 0);
  const threshold = Number(item.lowStockThreshold ?? 0);
  const isArchived = (item.status || "active") === "deleted";
  const isOut = quantity <= 0;
  const isLow = !isArchived && !isOut && (item.isLowStock ?? quantity <= threshold);
  const costPrice = Number(item.costPrice || 0);
  const unit = item.unit || "";
  const dateAdded = formatFirestoreDate(item.createdAt);
  const lastActivity = formatFirestoreDate(item.updatedAt || item.createdAt);
  const expirationDate = formatFirestoreDate(item.expirationDate);
  const batchSummary = summarizeInventoryBatches(item);

  return {
    id: item.id,
    name: item.name,
    sku: item.sku || "",
    cat: categoryFromBackend[item.category] || "Other",
    stock: `${quantity} ${unit}`.trim(),
    status: isArchived ? "Archived" : isOut ? "Out of Stock" : isLow ? "Low Stock" : "Healthy",
    reorder: `${threshold} ${unit}`.trim(),
    date: lastActivity,
    dateAdded,
    lastActivity,
    expirationDate: expirationDate === "-" ? "" : expirationDate,
    isLow,
    isOut,
    isArchived,
    expiredQuantity: batchSummary.expiredQuantity,
    nonExpiredQuantity: batchSummary.nonExpiredQuantity,
    hasExpiredStock: batchSummary.hasExpiredStock,
    quantity,
    threshold,
    unit,
    costPrice,
    stockBatches: Array.isArray(item.stockBatches) ? item.stockBatches : [],
    recordStatus: item.status || "active",
    currentValue: quantity * costPrice,
    reorderValue: threshold * costPrice,
    conversions: Array.isArray(item.conversions) ? item.conversions : [],
  };
};

export const mapInventoryItemToAlertUi = (item) => {
  const quantity = Number(item.quantity ?? 0);
  const threshold = Number(item.lowStockThreshold ?? 0);
  const unit = item.unit || "";
  const isArchived = (item.status || "active") === "deleted";
  const isOut = quantity <= 0;
  const isLow = !isArchived && !isOut && quantity <= threshold;
  const expirationDate = formatFirestoreDate(item.expirationDate);
  const batchSummary = summarizeInventoryBatches(item);

  return {
    id: item.id,
    name: item.name,
    sku: item.sku || "",
    quantity,
    threshold,
    unit,
    isLow,
    isOut,
    isArchived,
    expiredQuantity: batchSummary.expiredQuantity,
    nonExpiredQuantity: batchSummary.nonExpiredQuantity,
    hasExpiredStock: batchSummary.hasExpiredStock,
    expirationDate: expirationDate === "-" ? "" : expirationDate,
  };
};

export const applyRealtimeRawInventoryEvent = (items, event) => {
  const incoming = event?.data;
  if (!incoming?.id) return items;

  const current = items.find((item) => item.id === incoming.id) || {};
  const merged = normalizeRawInventoryItem({
    ...current,
    ...incoming,
  });

  return upsertById(items, merged, event?.type === "created");
};

export const applyRealtimeUiInventoryEvent = (items, event) => {
  const incoming = event?.data;
  if (!incoming?.id) return items;

  const current = items.find((item) => item.id === incoming.id);
  const mergedRaw = normalizeRawInventoryItem({
    ...toRawInventoryShapeFromUi(current),
    ...incoming,
  });

  return upsertById(items, mapInventoryItemToUi(mergedRaw), event?.type === "created");
};

export const createRealtimeActivity = (event) => {
  const data = event?.data;
  if (!data?.id) return null;

  const typeMap = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    "stock-adjusted": "adjusted",
  };

  const type = typeMap[event?.type];
  if (!type) return null;

  const timestamp = parseTimestamp(event?.timestamp || event?.receivedAt || new Date());

  return {
    id: `ws-${type}-${data.id}-${timestamp.getTime()}`,
    type,
    itemName: data.name || data.itemName || "Unknown item",
    timestamp,
    details: {
      adjustment: Number(data.adjustment || 0),
      reason: data.reason || "",
      unit: data.unit || "",
      quantity: Number(data.quantity ?? 0),
      threshold: Number(data.lowStockThreshold ?? 0),
    },
    source: "realtime",
  };
};

export const mergeRecentActivities = (activities, incomingActivity, limit = 10) => {
  if (!incomingActivity) return activities;

  const exists = activities.some((activity) => {
    return (
      activity.type === incomingActivity.type &&
      activity.itemName === incomingActivity.itemName &&
      Number(activity.details?.adjustment || 0) === Number(incomingActivity.details?.adjustment || 0) &&
      timestampsWithinWindow(activity.timestamp, incomingActivity.timestamp)
    );
  });

  if (exists) return activities;

  return [...activities, incomingActivity]
    .sort((first, second) => parseTimestamp(second.timestamp) - parseTimestamp(first.timestamp))
    .slice(0, limit);
};

const formatNotificationTime = (timestamp) => {
  return timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const mapNotificationToUi = (notification) => {
  if (!notification?.id) return null;

  const timestamp = parseTimestamp(
    notification.updatedAt || notification.createdAt || notification.readAt || notification.timestamp
  );

  return {
    id: notification.id,
    eventType: notification.type || "inventory-alert",
    itemId: notification.itemId || "",
    title: notification.title || "Inventory alert",
    message: notification.message || "",
    type: "alert",
    time: formatNotificationTime(timestamp),
    timestamp: timestamp.toISOString(),
    unread: !notification.isRead,
    status: notification.status || "active",
    severity: notification.severity || "warning",
    expirationDate: notification.expirationDate || null,
  };
};

const sortNotificationItems = (notifications = []) => {
  return [...notifications].sort((first, second) => {
    return parseTimestamp(second.timestamp) - parseTimestamp(first.timestamp);
  });
};

export const mergeStoredNotifications = (notifications, incomingNotification, limit = 20) => {
  const mapped = mapNotificationToUi(incomingNotification);
  if (!mapped) return notifications;
  if (mapped.status === "resolved") {
    return notifications.filter((notification) => notification.id !== mapped.id);
  }

  const existingIndex = notifications.findIndex((notification) => notification.id === mapped.id);
  if (existingIndex === -1) {
    return sortNotificationItems([mapped, ...notifications]).slice(0, limit);
  }

  const next = [...notifications];
  next[existingIndex] = {
    ...next[existingIndex],
    ...mapped,
  };
  return sortNotificationItems(next).slice(0, limit);
};

export const applyNotificationSocketEvent = (notifications, event, limit = 20) => {
  if (!event?.type) return notifications;

  if (event.type === "upsert") {
    return mergeStoredNotifications(notifications, event.data, limit);
  }

  if (event.type === "resolved") {
    return notifications.filter((notification) => notification.id !== event.data?.id);
  }

  if (event.type === "read") {
    return notifications.map((notification) =>
      notification.id === event.data?.id ? { ...notification, unread: false } : notification
    );
  }

  if (event.type === "all-read") {
    const ids = new Set(event.data?.ids || []);
    return notifications.map((notification) =>
      ids.size === 0 || ids.has(notification.id) ? { ...notification, unread: false } : notification
    );
  }

  return notifications;
};
