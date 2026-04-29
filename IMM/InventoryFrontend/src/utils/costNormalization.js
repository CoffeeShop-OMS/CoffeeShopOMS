/**
 * Cost Calculation Utilities
 * costPrice is already calculated per tracking unit in backend
 * totalBatchCost / batchQuantity = costPrice
 */

/**
 * Format cost display
 */
export const formatCostDisplay = (costPrice, trackingUnit) => {
  if (!costPrice) return { display: '₱0.00', unit: trackingUnit };

  return {
    display: `₱${Number(costPrice).toFixed(2)}/${trackingUnit}`,
    value: costPrice,
    unit: trackingUnit,
  };
};

/**
 * Calculate inventory value
 * quantity * costPrice (already normalized)
 */
export const calculateInventoryValue = (quantity, costPrice) => {
  if (!costPrice) return 0;
  return quantity * costPrice;
};
