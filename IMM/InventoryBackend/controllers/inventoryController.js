const { db } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const { emitInventoryUpdate } = require("../services/realtime");
const { normalizeDateValue, syncNotificationsForItem } = require("../services/notificationService");
const {
  addStockBatch,
  consumeStockBatches,
  resetStockBatches,
} = require("../services/stockBatchService");

const COLLECTION = "inventory";
const LOG_COLLECTION = "inventoryLogs";

// Category mapping: UI format to backend lowercase format
const categoryToBackend = {
  'Beans': 'beans',
  'Milk': 'milk',
  'Syrup': 'syrup',
  'Cups': 'packaging',
  'Pastries': 'other',
  'Equipment': 'equipment',
  'Add-ins': 'add-ins',
  'Powder': 'powder',
  'Other': 'other',
};

const normalizeSkuPrefix = (value = "Item") => {
  const lettersOnly = String(value).replace(/[^a-zA-Z]/g, "");
  if (!lettersOnly) return "ITM";
  return lettersOnly.slice(0, 3).toUpperCase();
};

const sanitizeSku = (value = "") => {
  const match = String(value).trim().match(/^([a-zA-Z]+)-([0-9]{3})$/);
  if (!match) return "";
  return `${normalizeSkuPrefix(match[1])}-${match[2]}`;
};

const generateSku = (name = "Item", suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')) => {
  const prefix = normalizeSkuPrefix(name);
  return `${prefix}-${suffix}`;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const toClientErrorMessage = (error, fallbackMessage) => {
  const raw = String(error?.message || "").toLowerCase();
  const isCredentialsIssue =
    raw.includes("unable to detect a project id") ||
    raw.includes("could not load the default credentials") ||
    raw.includes("invalid grant");

  if (isCredentialsIssue) {
    return "Firestore credentials are not configured in backend. Check InventoryBackend/.env Firebase Admin settings.";
  }

  return fallbackMessage;
};

const mapBatchLogDetails = (batches = []) =>
  batches.map((batch) => ({
    id: batch.id,
    quantity: batch.quantity,
    expirationDate: batch.expirationDate || null,
    receivedAt: batch.receivedAt || null,
  }));

const logActivity = async (action, itemId, itemName, userId, details = {}) => {
  await db.collection(LOG_COLLECTION).add({
    action,        // "CREATE" | "UPDATE" | "DELETE" | "STOCK_ADJUST"
    itemId,
    itemName,
    performedBy: userId,
    details,
    timestamp: FieldValue.serverTimestamp(),
  });
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * POST /api/inventory
 */
const createItem = async (req, res) => {
  try {
    const { name, sku, category, quantity, unit, lowStockThreshold = 10, costPrice, supplier, expirationDate } = req.body;

    const quantityInt = parseInt(quantity);
    const thresholdInt = parseInt(lowStockThreshold);
    const cleanName = String(name).trim();
    const cleanCategory = categoryToBackend[category] || category.toLowerCase(); // Convert UI category to backend format
    const cleanUnit = String(unit).trim();
    const cleanSupplier = supplier ? String(supplier).trim() : null;
    const cleanExpirationDate = normalizeDateValue(expirationDate);
    const batchSnapshot = resetStockBatches({
      quantity: quantityInt,
      expirationDate: cleanExpirationDate,
      lowStockThreshold: thresholdInt,
      receivedAt: new Date().toISOString(),
    });

    let finalSku = sanitizeSku(sku) || generateSku(cleanName);

    // Ensure SKU uniqueness when auto-generating or when a custom SKU collides.
    let attempts = 0;
    while (attempts < 5) {
      const skuCheck = await db.collection(COLLECTION).where("sku", "==", finalSku).limit(1).get();
      if (skuCheck.empty) break;

      if (sku) {
        return res.status(409).json({ success: false, message: `SKU '${finalSku}' already exists` });
      }

      attempts += 1;
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalSku = generateSku(cleanName, randomSuffix);
    }

    if (attempts >= 5) {
      return res.status(500).json({
        success: false,
        message: "Unable to generate a unique SKU. Please try again.",
      });
    }

    const newItem = {
      name: cleanName,
      sku: finalSku,
      category: cleanCategory,
      quantity: batchSnapshot.quantity,
      unit: cleanUnit,
      lowStockThreshold: thresholdInt,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      supplier: cleanSupplier,
      expirationDate: batchSnapshot.expirationDate,
      stockBatches: batchSnapshot.stockBatches,
      isLowStock: batchSnapshot.isLowStock,
      status: "active",
      createdBy: req.user.uid,
      updatedBy: req.user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTION).add(newItem);

    await logActivity("CREATE", docRef.id, cleanName, req.user.uid, {
      quantity: batchSnapshot.quantity,
      sku: finalSku,
      expirationDate: batchSnapshot.expirationDate || null,
      stockBatches: mapBatchLogDetails(batchSnapshot.stockBatches),
    });

    // Emit real-time update to all connected clients
    emitInventoryUpdate("created", { id: docRef.id, ...newItem });
    await syncNotificationsForItem({ id: docRef.id, ...newItem });

    res.status(201).json({
      success: true,
      message: "Inventory item created",
      data: { id: docRef.id, ...newItem },
    });
  } catch (error) {
    console.error("createItem error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to create item") });
  }
};

// ─── READ ALL ─────────────────────────────────────────────────────────────────

/**
 * GET /api/inventory
 * Supports: ?category=beans&lowStock=true&search=milk&page=1&limit=20
 */
const getAllItems = async (req, res) => {
  try {
    const { category, lowStock, search, status = "active", limit = 20, startAfter } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);
    const normalizedStatus = String(status || "active").toLowerCase();

    // Use a broad query + in-memory filtering to avoid composite-index failures
    // in environments where Firestore indexes are not yet created.
    let query = db.collection(COLLECTION).limit(limitNum);

    if (startAfter) {
      const lastDoc = await db.collection(COLLECTION).doc(startAfter).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Default behavior remains active-only. Optional query allows archived/all.
    if (normalizedStatus === "archived") {
      items = items.filter((i) => (i.status || "active") === "deleted");
    } else if (normalizedStatus === "all") {
      items = items.filter((i) => ["active", "deleted"].includes(i.status || "active"));
    } else {
      items = items.filter((i) => (i.status || "active") === "active");
    }

    if (category) items = items.filter((i) => i.category === category);
    if (lowStock === "true") items = items.filter((i) => i.isLowStock === true);

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (i) =>
          (i.name || "").toLowerCase().includes(term) ||
          (i.sku || "").toLowerCase().includes(term) ||
          (i.supplier || "").toLowerCase().includes(term)
      );
    }

    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    res.json({
      success: true,
      data: items,
      count: items.length,
      nextCursor: lastVisible?.id || null,
    });
  } catch (error) {
    console.error("getAllItems error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to fetch inventory") });
  }
};

// ─── READ ONE ─────────────────────────────────────────────────────────────────

/**
 * GET /api/inventory/:id
 */
const getItemById = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();

    if (!doc.exists || doc.data().status === "deleted") {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error("getItemById error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to fetch item") });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * PATCH /api/inventory/:id
 */
const updateItem = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().status === "deleted") {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const current = doc.data();
    const { name, category, quantity, unit, lowStockThreshold, costPrice, supplier, expirationDate } = req.body;

    const updates = { updatedBy: req.user.uid, updatedAt: FieldValue.serverTimestamp() };

    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = categoryToBackend[category] || category.toLowerCase(); // Convert UI category to backend format
    if (unit !== undefined) updates.unit = unit;
    if (supplier !== undefined) updates.supplier = supplier;
    if (costPrice !== undefined) updates.costPrice = parseFloat(costPrice);

    const newQty = quantity !== undefined ? parseInt(quantity) : current.quantity;
    const newThreshold = lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : current.lowStockThreshold;
    const nextExpirationDate =
      expirationDate !== undefined ? normalizeDateValue(expirationDate) : current.expirationDate;
    const shouldResetStockBatches = quantity !== undefined || expirationDate !== undefined;

    if (lowStockThreshold !== undefined) updates.lowStockThreshold = newThreshold;

    if (shouldResetStockBatches) {
      const batchSnapshot = resetStockBatches({
        quantity: newQty,
        expirationDate: nextExpirationDate,
        lowStockThreshold: newThreshold,
        receivedAt: new Date().toISOString(),
      });

      updates.quantity = batchSnapshot.quantity;
      updates.expirationDate = batchSnapshot.expirationDate;
      updates.stockBatches = batchSnapshot.stockBatches;
      updates.isLowStock = batchSnapshot.isLowStock;
    } else {
      updates.isLowStock = Number(current.quantity ?? 0) <= newThreshold;
    }

    await docRef.update(updates);
    await logActivity("UPDATE", req.params.id, current.name, req.user.uid, {
      ...updates,
      ...(shouldResetStockBatches && {
        fifoReset: true,
        quantity: updates.quantity,
        expirationDate: updates.expirationDate || null,
        stockBatches: mapBatchLogDetails(updates.stockBatches),
      }),
    });

    const responseData = {
      id: req.params.id,
      ...current,
      ...updates,
      name: updates.name ?? current.name,
      quantity: updates.quantity ?? newQty,
      lowStockThreshold: newThreshold,
      expirationDate: updates.expirationDate ?? current.expirationDate ?? null,
      stockBatches: updates.stockBatches || current.stockBatches || [],
      status: current.status || "active",
    };

    // Emit real-time update to all connected clients
    emitInventoryUpdate("updated", responseData);

    await syncNotificationsForItem(responseData);

    res.json({ success: true, message: "Item updated successfully", data: responseData });
  } catch (error) {
    console.error("updateItem error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to update item") });
  }
};

// ─── DELETE (Soft) ────────────────────────────────────────────────────────────

/**
 * DELETE /api/inventory/:id
 */
const deleteItem = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().status === "deleted") {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const current = doc.data();

    await docRef.update({
      status: "deleted",
      deletedBy: req.user.uid,
      deletedAt: FieldValue.serverTimestamp(),
    });

    await logActivity("DELETE", req.params.id, current.name, req.user.uid);

    // Emit real-time update to all connected clients
    emitInventoryUpdate("deleted", {
      id: req.params.id,
      ...current,
      status: "deleted",
      deletedBy: req.user.uid,
    });

    await syncNotificationsForItem({
      id: req.params.id,
      ...current,
      status: "deleted",
    });

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("deleteItem error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to delete item") });
  }
};

// ─── STOCK ADJUSTMENT ─────────────────────────────────────────────────────────

/**
 * POST /api/inventory/:id/adjust
 * Safely adjusts stock using Firestore transactions to prevent race conditions.
 */
const adjustStock = async (req, res) => {
  try {
    const { adjustment, reason, expirationDate } = req.body;
    const adjustmentInt = parseInt(adjustment);
    const normalizedExpirationDate = normalizeDateValue(expirationDate);
    const docRef = db.collection(COLLECTION).doc(req.params.id);

    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists || doc.data().status === "deleted") {
        throw { code: 404, message: "Item not found" };
      }

      const current = doc.data();
      const batchSnapshot =
        adjustmentInt >= 0
          ? addStockBatch(current, adjustmentInt, normalizedExpirationDate, new Date().toISOString())
          : consumeStockBatches(current, Math.abs(adjustmentInt));

      transaction.update(docRef, {
        quantity: batchSnapshot.quantity,
        expirationDate: batchSnapshot.expirationDate,
        stockBatches: batchSnapshot.stockBatches,
        isLowStock: batchSnapshot.isLowStock,
        updatedBy: req.user.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        newQuantity: batchSnapshot.quantity,
        isLowStock: batchSnapshot.isLowStock,
        expirationDate: batchSnapshot.expirationDate,
        stockBatches: batchSnapshot.stockBatches,
        addedBatch: batchSnapshot.addedBatch || null,
        consumedBatches: batchSnapshot.consumedBatches || [],
        itemName: current.name,
        item: current,
      };
    });

    await logActivity("STOCK_ADJUST", req.params.id, result.itemName, req.user.uid, {
      adjustment: adjustmentInt,
      direction: adjustmentInt >= 0 ? "IN" : "OUT",
      reason,
      sku: result.item.sku || "",
      unit: result.item.unit || "",
      previousQuantity: result.newQuantity - adjustmentInt,
      newQuantity: result.newQuantity,
      expirationDate: result.expirationDate || null,
      addedBatch: result.addedBatch
        ? {
            quantity: result.addedBatch.quantity,
            expirationDate: result.addedBatch.expirationDate || null,
            receivedAt: result.addedBatch.receivedAt || null,
          }
        : null,
      consumedBatches: mapBatchLogDetails(result.consumedBatches),
      fifoMode: "FIFO",
    });

    // Emit real-time update to all connected clients
    emitInventoryUpdate("stock-adjusted", {
      id: req.params.id,
      name: result.item.name,
      sku: result.item.sku || "",
      category: result.item.category,
      quantity: result.newQuantity,
      unit: result.item.unit || "",
      lowStockThreshold: result.item.lowStockThreshold || 0,
      costPrice: result.item.costPrice || null,
      supplier: result.item.supplier || null,
      expirationDate: result.expirationDate || null,
      stockBatches: result.stockBatches || [],
      isLowStock: result.isLowStock,
      status: result.item.status || "active",
      adjustment: adjustmentInt,
      reason,
    });

    await syncNotificationsForItem({
      id: req.params.id,
      ...result.item,
      quantity: result.newQuantity,
      expirationDate: result.expirationDate || null,
      stockBatches: result.stockBatches || [],
      isLowStock: result.isLowStock,
    });

    res.json({
      success: true,
      message: `Stock adjusted by ${adjustmentInt > 0 ? "+" : ""}${adjustmentInt}`,
      data: {
        newQuantity: result.newQuantity,
        isLowStock: result.isLowStock,
        expirationDate: result.expirationDate || null,
        stockBatches: result.stockBatches || [],
        ...(result.isLowStock && { alert: "⚠️ Item is below low stock threshold!" }),
      },
    });
  } catch (error) {
    if (error.code === 404) return res.status(404).json({ success: false, message: error.message });
    if (error.code === 400) return res.status(400).json({ success: false, message: error.message });
    console.error("adjustStock error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to adjust stock") });
  }
};

// ─── LOW STOCK REPORT ─────────────────────────────────────────────────────────

/**
 * GET /api/inventory/reports/low-stock
 */
const getLowStockItems = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("status", "==", "active")
      .where("isLowStock", "==", true)
      .orderBy("quantity", "asc")
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      sku: doc.data().sku,
      quantity: doc.data().quantity,
      lowStockThreshold: doc.data().lowStockThreshold,
      unit: doc.data().unit,
      category: doc.data().category,
    }));

    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    console.error("getLowStockItems error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to fetch low stock report") });
  }
};

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────

/**
 * GET /api/inventory/:id/logs
 */
const getItemLogs = async (req, res) => {
  try {
    const snapshot = await db
      .collection(LOG_COLLECTION)
      .where("itemId", "==", req.params.id)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("getItemLogs error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to fetch logs") });
  }
};

// ─── CROSS-ITEM ACTIVITY LOGS ─────────────────────────────────────────────────

/**
 * GET /api/inventory/logs
 * Supports: ?action=STOCK_ADJUST&limit=50&days=7&cursor=<docId>&itemId=<inventoryId>
 */
const getAllLogs = async (req, res) => {
  try {
    const {
      action,
      itemId,
      limit = 50,
      days = 7,
      cursor,
    } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const isAllTime = String(days || "").toLowerCase() === "all";
    const requiresInMemoryFiltering = Boolean(action || itemId);

    let baseQuery = db.collection(LOG_COLLECTION);

    if (!isAllTime) {
      const daysNum = Math.max(parseInt(days, 10) || 7, 1);
      const now = new Date();
      const startDate = new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000);
      baseQuery = baseQuery.where("timestamp", ">=", startDate);
    }

    baseQuery = baseQuery.orderBy("timestamp", "desc");

    let cursorDoc = null;
    if (cursor) {
      const cursorSnapshot = await db.collection(LOG_COLLECTION).doc(String(cursor)).get();
      if (cursorSnapshot.exists) {
        cursorDoc = cursorSnapshot;
      }
    }

    const matchesFilters = (log) => {
      if (action && log.action !== action) return false;
      if (itemId && log.itemId !== itemId) return false;
      return true;
    };

    const mapSnapshot = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (!requiresInMemoryFiltering) {
      let query = baseQuery.limit(limitNum);
      if (cursorDoc) {
        query = query.startAfter(cursorDoc);
      }

      const snapshot = await query.get();
      const logs = mapSnapshot(snapshot);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      return res.json({
        success: true,
        data: logs,
        count: logs.length,
        nextCursor: snapshot.docs.length === limitNum ? lastVisible?.id || null : null,
      });
    }

    const batchSize = Math.min(Math.max(limitNum * 2, 50), 200);
    const maxScanBatches = 10;
    const collectedLogs = [];
    let lastScannedDoc = cursorDoc;
    let batchesScanned = 0;
    let exhausted = false;

    while (collectedLogs.length < limitNum && batchesScanned < maxScanBatches) {
      let query = baseQuery.limit(batchSize);
      if (lastScannedDoc) {
        query = query.startAfter(lastScannedDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        exhausted = true;
        break;
      }

      const rawLogs = mapSnapshot(snapshot);
      collectedLogs.push(...rawLogs.filter(matchesFilters));

      lastScannedDoc = snapshot.docs[snapshot.docs.length - 1];
      batchesScanned += 1;

      if (snapshot.docs.length < batchSize) {
        exhausted = true;
        break;
      }
    }

    const logs = collectedLogs.slice(0, limitNum);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      nextCursor: exhausted ? null : lastScannedDoc?.id || null,
    });
  } catch (error) {
    console.error("getAllLogs error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to fetch logs") });
  }
};

/**
 * PATCH /api/inventory/:id/restore
 */
const restoreItem = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const current = doc.data();
    if ((current.status || "active") !== "deleted") {
      return res.status(400).json({ success: false, message: "Item is not archived" });
    }

    const updates = {
      status: "active",
      deletedBy: null,
      deletedAt: null,
      restoredBy: req.user.uid,
      restoredAt: FieldValue.serverTimestamp(),
      updatedBy: req.user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(updates);

    const responseData = {
      id: req.params.id,
      ...current,
      ...updates,
      status: "active",
    };

    await logActivity("UPDATE", req.params.id, current.name, req.user.uid, {
      restored: true,
      previousStatus: current.status || "deleted",
      status: "active",
    });

    emitInventoryUpdate("updated", responseData);
    await syncNotificationsForItem(responseData);

    res.json({
      success: true,
      message: "Item restored successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("restoreItem error:", error);
    res.status(500).json({ success: false, message: toClientErrorMessage(error, "Failed to restore item") });
  }
};

module.exports = { createItem, getAllItems, getItemById, updateItem, deleteItem, restoreItem, adjustStock, getLowStockItems, getItemLogs, getAllLogs };
