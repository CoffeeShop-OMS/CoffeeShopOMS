const { db } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const { emitNotificationUpdate } = require("./realtime");

const INVENTORY_COLLECTION = "inventory";
const NOTIFICATION_COLLECTION = "notifications";
const ACTIVE_STATUS = "active";
const RESOLVED_STATUS = "resolved";
const LOW_STOCK_TYPE = "low-stock";
const EXPIRED_TYPE = "expired";
const TRACKED_NOTIFICATION_TYPES = new Set([LOW_STOCK_TYPE, EXPIRED_TYPE]);

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && (value._seconds || value.seconds)) {
    return Number(value._seconds || value.seconds) * 1000;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const normalizeDateValue = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  if (typeof value.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  if (typeof value === "object" && (value._seconds || value.seconds)) {
    return new Date(Number(value._seconds || value.seconds) * 1000).toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isItemActive = (item = {}) => (item.status || ACTIVE_STATUS) === ACTIVE_STATUS;

const isLowStockItem = (item = {}) => {
  if (!isItemActive(item)) return false;
  const quantity = Number(item.quantity ?? 0);
  const threshold = Number(item.lowStockThreshold ?? 0);
  return quantity <= threshold;
};

const isExpiredItem = (item = {}) => {
  if (!isItemActive(item)) return false;
  const expirationDate = normalizeDateValue(item.expirationDate);
  if (!expirationDate) return false;
  return expirationDate <= getTodayDateString();
};

const notificationDocId = (type, itemId) => `${type}:${itemId}`;

const buildNotificationPayload = (type, item = {}, existing = null) => {
  const quantity = Number(item.quantity ?? 0);
  const threshold = Number(item.lowStockThreshold ?? 0);
  const unit = item.unit || "";
  const expirationDate = normalizeDateValue(item.expirationDate);
  const itemName = item.name || "Inventory item";

  let title = "Inventory alert";
  let message = `${itemName} needs attention.`;
  let severity = "warning";

  if (type === LOW_STOCK_TYPE) {
    title = "Low stock alert";
    message =
      quantity <= 0
        ? `${itemName} is out of stock.`
        : `${itemName} is low on stock with ${quantity}${unit ? ` ${unit}` : ""} remaining.`;
    severity = quantity <= 0 ? "critical" : "warning";
  }

  if (type === EXPIRED_TYPE) {
    title = "Expired item";
    message = expirationDate
      ? `${itemName} expired on ${expirationDate}.`
      : `${itemName} is marked as expired.`;
    severity = "critical";
  }

  return {
    type,
    status: ACTIVE_STATUS,
    isRead: existing?.status === ACTIVE_STATUS ? Boolean(existing.isRead) : false,
    title,
    message,
    severity,
    itemId: item.id,
    itemName,
    sku: item.sku || "",
    category: item.category || null,
    quantity,
    lowStockThreshold: threshold,
    unit,
    expirationDate,
  };
};

const comparableNotificationFields = [
  "type",
  "status",
  "isRead",
  "title",
  "message",
  "severity",
  "itemId",
  "itemName",
  "sku",
  "category",
  "quantity",
  "lowStockThreshold",
  "unit",
  "expirationDate",
];

const hasNotificationChanged = (current = {}, next = {}) => {
  return comparableNotificationFields.some((field) => (current[field] ?? null) !== (next[field] ?? null));
};

const serializeNotification = (id, data = {}) => ({
  id,
  ...data,
});

const sortNotifications = (notifications = []) => {
  return [...notifications].sort((first, second) => {
    return (
      toMillis(second.updatedAt || second.createdAt || second.resolvedAt) -
      toMillis(first.updatedAt || first.createdAt || first.resolvedAt)
    );
  });
};

const queueUpsertNotification = (batch, docId, payload, existing, emittedEvents) => {
  const docRef = db.collection(NOTIFICATION_COLLECTION).doc(docId);
  const nowIso = new Date().toISOString();
  const setData = {
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
    readAt: payload.isRead ? existing?.readAt || null : null,
  };

  if (!existing?.createdAt) {
    setData.createdAt = FieldValue.serverTimestamp();
  }

  batch.set(docRef, setData, { merge: true });

  emittedEvents.push({
    event: "upsert",
    payload: {
      id: docId,
      ...payload,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      resolvedAt: null,
      readAt: payload.isRead ? existing?.readAt || null : null,
    },
  });
};

const queueResolvedNotification = (batch, current, emittedEvents) => {
  const docRef = db.collection(NOTIFICATION_COLLECTION).doc(current.id);
  const nowIso = new Date().toISOString();

  batch.set(
    docRef,
    {
      status: RESOLVED_STATUS,
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  emittedEvents.push({
    event: "resolved",
    payload: {
      id: current.id,
      type: current.type,
      itemId: current.itemId,
      status: RESOLVED_STATUS,
      resolvedAt: nowIso,
    },
  });
};

const applyEmittedNotificationEvents = (events = []) => {
  events.forEach(({ event, payload }) => emitNotificationUpdate(event, payload));
};

const listNotifications = async ({ status = ACTIVE_STATUS, limit = 20 } = {}) => {
  const snapshot = await db.collection(NOTIFICATION_COLLECTION).get();
  const allNotifications = snapshot.docs.map((doc) => serializeNotification(doc.id, doc.data()));

  const filtered = allNotifications.filter((notification) => {
    if (!TRACKED_NOTIFICATION_TYPES.has(notification.type)) return false;
    if (status === "all") return true;
    return (notification.status || ACTIVE_STATUS) === status;
  });

  return sortNotifications(filtered).slice(0, Math.max(1, Number(limit) || 20));
};

const syncNotificationsForItem = async (item = {}) => {
  if (!item?.id) return;

  const batch = db.batch();
  const emittedEvents = [];

  for (const type of TRACKED_NOTIFICATION_TYPES) {
    const docId = notificationDocId(type, item.id);
    const docRef = db.collection(NOTIFICATION_COLLECTION).doc(docId);
    const snapshot = await docRef.get();
    const existing = snapshot.exists ? serializeNotification(snapshot.id, snapshot.data()) : null;
    const shouldBeActive =
      type === LOW_STOCK_TYPE ? isLowStockItem(item) : isExpiredItem(item);

    if (shouldBeActive) {
      const payload = buildNotificationPayload(type, item, existing);
      if (!existing || existing.status !== ACTIVE_STATUS || hasNotificationChanged(existing, payload)) {
        queueUpsertNotification(batch, docId, payload, existing, emittedEvents);
      }
      continue;
    }

    if (existing && existing.status === ACTIVE_STATUS) {
      queueResolvedNotification(batch, existing, emittedEvents);
    }
  }

  if (emittedEvents.length > 0) {
    await batch.commit();
    applyEmittedNotificationEvents(emittedEvents);
  }
};

const synchronizeNotificationsWithInventory = async () => {
  const [inventorySnapshot, notificationSnapshot] = await Promise.all([
    db.collection(INVENTORY_COLLECTION).get(),
    db.collection(NOTIFICATION_COLLECTION).get(),
  ]);

  const inventoryItems = inventorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const currentNotifications = notificationSnapshot.docs.map((doc) =>
    serializeNotification(doc.id, doc.data())
  );

  const desiredNotifications = new Map();
  inventoryItems
    .filter(isItemActive)
    .forEach((item) => {
      if (isLowStockItem(item)) {
        const docId = notificationDocId(LOW_STOCK_TYPE, item.id);
        desiredNotifications.set(docId, { type: LOW_STOCK_TYPE, item });
      }

      if (isExpiredItem(item)) {
        const docId = notificationDocId(EXPIRED_TYPE, item.id);
        desiredNotifications.set(docId, { type: EXPIRED_TYPE, item });
      }
    });

  const batch = db.batch();
  const emittedEvents = [];

  desiredNotifications.forEach(({ type, item }, docId) => {
    const existing = currentNotifications.find((notification) => notification.id === docId) || null;
    const nextPayload = buildNotificationPayload(type, item, existing);

    if (!existing || existing.status !== ACTIVE_STATUS || hasNotificationChanged(existing, nextPayload)) {
      queueUpsertNotification(batch, docId, nextPayload, existing, emittedEvents);
    }
  });

  currentNotifications
    .filter(
      (notification) =>
        TRACKED_NOTIFICATION_TYPES.has(notification.type) &&
        notification.status === ACTIVE_STATUS &&
        !desiredNotifications.has(notification.id)
    )
    .forEach((notification) => {
      queueResolvedNotification(batch, notification, emittedEvents);
    });

  if (emittedEvents.length > 0) {
    await batch.commit();
    applyEmittedNotificationEvents(emittedEvents);
  }
};

const getActiveNotifications = async ({ limit = 20, sync = true } = {}) => {
  if (sync) {
    await synchronizeNotificationsWithInventory();
  }

  return listNotifications({ status: ACTIVE_STATUS, limit });
};

const markNotificationRead = async (notificationId, readBy) => {
  const docRef = db.collection(NOTIFICATION_COLLECTION).doc(notificationId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) return null;

  const current = serializeNotification(snapshot.id, snapshot.data());
  if (current.status !== ACTIVE_STATUS) return current;

  if (!current.isRead) {
    await docRef.set(
      {
        isRead: true,
        readAt: FieldValue.serverTimestamp(),
        readBy: readBy || null,
      },
      { merge: true }
    );

    emitNotificationUpdate("read", {
      id: notificationId,
      isRead: true,
      readAt: new Date().toISOString(),
    });
  }

  const refreshed = await docRef.get();
  return serializeNotification(refreshed.id, refreshed.data());
};

const markAllNotificationsRead = async (readBy) => {
  const activeNotifications = await listNotifications({ status: ACTIVE_STATUS, limit: 500 });
  const unreadNotifications = activeNotifications.filter((notification) => !notification.isRead);

  if (unreadNotifications.length === 0) {
    return { updatedCount: 0 };
  }

  const batch = db.batch();
  unreadNotifications.forEach((notification) => {
    const docRef = db.collection(NOTIFICATION_COLLECTION).doc(notification.id);
    batch.set(
      docRef,
      {
        isRead: true,
        readAt: FieldValue.serverTimestamp(),
        readBy: readBy || null,
      },
      { merge: true }
    );
  });

  await batch.commit();

  emitNotificationUpdate("all-read", {
    ids: unreadNotifications.map((notification) => notification.id),
    readAt: new Date().toISOString(),
  });

  return { updatedCount: unreadNotifications.length };
};

module.exports = {
  getActiveNotifications,
  isExpiredItem,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeDateValue,
  syncNotificationsForItem,
  synchronizeNotificationsWithInventory,
};
