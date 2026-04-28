const normalizeInventoryDate = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  if (typeof value?.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  if (typeof value === "object" && (value._seconds || value.seconds)) {
    return new Date(Number(value._seconds || value.seconds) * 1000).toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const QUANTITY_PRECISION = 1000;

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isExpiredInventoryDate = (value) => {
  const normalizedDate = normalizeInventoryDate(value);
  if (!normalizedDate) return false;
  return normalizedDate <= getTodayDateString();
};

const toPositiveQuantity = (value) => {
  const parsed = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * QUANTITY_PRECISION) / QUANTITY_PRECISION;
};

const toDisplayBatch = (batch = {}, fallbackId = "batch") => {
  const quantity = toPositiveQuantity(batch?.quantity);
  if (quantity <= 0) return null;

  const expirationDate = normalizeInventoryDate(batch?.expirationDate);
  const receivedAt = normalizeInventoryDate(batch?.receivedAt || batch?.createdAt);

  return {
    id: batch?.id || fallbackId,
    quantity,
    expirationDate,
    receivedAt,
    isExpired: expirationDate ? isExpiredInventoryDate(expirationDate) : false,
  };
};

export const summarizeInventoryBatches = (item = {}) => {
  const stockBatches = Array.isArray(item.stockBatches) ? item.stockBatches : [];

  if (stockBatches.length === 0) {
    const totalQuantity = toPositiveQuantity(item.quantity);
    const expiredQuantity = isExpiredInventoryDate(item.expirationDate) ? totalQuantity : 0;

    return {
      totalQuantity,
      expiredQuantity,
      nonExpiredQuantity: Math.max(totalQuantity - expiredQuantity, 0),
      hasExpiredStock: expiredQuantity > 0,
      earliestExpiredDate: expiredQuantity > 0 ? normalizeInventoryDate(item.expirationDate) : null,
    };
  }

  let totalQuantity = 0;
  let expiredQuantity = 0;
  let earliestExpiredDate = null;

  stockBatches.forEach((batch) => {
    const batchQuantity = toPositiveQuantity(batch?.quantity);
    if (batchQuantity <= 0) return;

    totalQuantity += batchQuantity;

    if (!isExpiredInventoryDate(batch?.expirationDate)) return;

    expiredQuantity += batchQuantity;
    const batchExpiration = normalizeInventoryDate(batch?.expirationDate);
    if (!batchExpiration) return;

    if (!earliestExpiredDate || batchExpiration < earliestExpiredDate) {
      earliestExpiredDate = batchExpiration;
    }
  });

  return {
    totalQuantity,
    expiredQuantity,
    nonExpiredQuantity: Math.max(totalQuantity - expiredQuantity, 0),
    hasExpiredStock: expiredQuantity > 0,
    earliestExpiredDate,
  };
};

export const summarizeInventoryAfterAddition = (
  item = {},
  addedQuantity = 0,
  addedExpirationDate = null
) => {
  const currentSummary = summarizeInventoryBatches(item);
  const normalizedAddedQuantity = toPositiveQuantity(addedQuantity);
  const addedIsExpired =
    normalizedAddedQuantity > 0 && isExpiredInventoryDate(addedExpirationDate);

  const expiredQuantityAfterAdd =
    currentSummary.expiredQuantity + (addedIsExpired ? normalizedAddedQuantity : 0);
  const totalQuantityAfterAdd = currentSummary.totalQuantity + normalizedAddedQuantity;

  return {
    ...currentSummary,
    addedQuantity: normalizedAddedQuantity,
    addedIsExpired,
    expiredQuantityAfterAdd,
    nonExpiredQuantityAfterAdd: Math.max(totalQuantityAfterAdd - expiredQuantityAfterAdd, 0),
    totalQuantityAfterAdd,
  };
};

export const getDisplayInventoryBatches = (item = {}) => {
  const explicitBatches = Array.isArray(item.stockBatches)
    ? item.stockBatches
        .map((batch, index) =>
          toDisplayBatch(batch, `${item.id || "item"}-batch-${index + 1}`)
        )
        .filter(Boolean)
    : [];

  if (explicitBatches.length > 0) {
    return explicitBatches;
  }

  const quantity = toPositiveQuantity(item.quantity);
  if (quantity <= 0) return [];

  const seededBatch = toDisplayBatch(
    {
      id: `${item.id || "item"}-seed`,
      quantity,
      expirationDate: item.expirationDate || null,
      receivedAt: item.receivedAt || item.updatedAt || item.createdAt || null,
    },
    `${item.id || "item"}-seed`
  );

  return seededBatch ? [seededBatch] : [];
};

export const formatInventoryDateLabel = (value) => {
  const normalizedDate = normalizeInventoryDate(value);
  if (!normalizedDate) return "";

  const [year, month, day] = normalizedDate.split("-").map(Number);
  const displayDate = new Date(year, month - 1, day);

  if (Number.isNaN(displayDate.getTime())) {
    return normalizedDate;
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(displayDate);
};

export { normalizeInventoryDate, getTodayDateString };
