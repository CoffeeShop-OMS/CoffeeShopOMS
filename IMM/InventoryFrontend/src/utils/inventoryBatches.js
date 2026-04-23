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

const toWholeQuantity = (value) => {
  const parsed = Number.parseInt(value ?? 0, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const summarizeInventoryBatches = (item = {}) => {
  const stockBatches = Array.isArray(item.stockBatches) ? item.stockBatches : [];

  if (stockBatches.length === 0) {
    const totalQuantity = toWholeQuantity(item.quantity);
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
    const batchQuantity = toWholeQuantity(batch?.quantity);
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
  const normalizedAddedQuantity = toWholeQuantity(addedQuantity);
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

export { normalizeInventoryDate, getTodayDateString };
