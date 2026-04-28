/**
 * Inventory Conversion Display Utilities
 * Helpers for displaying conversion information in inventory
 */

import { convertQuantity, formatConversion, calculateCostPerUnit } from './unitConversion';

/**
 * Get alternative stock levels for an item based on conversions
 */
export const getAlternativeStockLevels = (quantity, unit, conversions = []) => {
  if (!conversions || conversions.length === 0) {
    return [];
  }

  return conversions
    .filter((conv) => conv.fromUnit === unit)
    .map((conv) => ({
      quantity: quantity * conv.ratio,
      unit: conv.toUnit,
      conversion: conv,
    }));
};

/**
 * Format cost breakdown showing cost per different units
 */
export const formatCostBreakdown = (totalCost, quantity, unit, conversions = []) => {
  const breakdown = [
    {
      unit,
      quantity,
      costPerUnit: totalCost / quantity,
    },
  ];

  // Add costs for converted units
  getAlternativeStockLevels(quantity, unit, conversions).forEach((alt) => {
    breakdown.push({
      unit: alt.unit,
      quantity: alt.quantity,
      costPerUnit: totalCost / alt.quantity,
    });
  });

  return breakdown;
};

/**
 * Get stock shortage warnings based on conversions
 * Useful for recipes/production that use different units
 */
export const checkStockForProduction = (requiredQty, requiredUnit, availableQty, availableUnit, conversions = []) => {
  if (requiredUnit === availableUnit) {
    return {
      isSufficient: availableQty >= requiredQty,
      available: availableQty,
      required: requiredQty,
      shortage: Math.max(0, requiredQty - availableQty),
    };
  }

  // Try to find conversion
  const conversion = conversions.find(
    (c) => c.fromUnit === availableUnit && c.toUnit === requiredUnit
  );

  if (!conversion) {
    return {
      error: `No conversion found between ${availableUnit} and ${requiredUnit}`,
    };
  }

  const availableInRequired = availableQty * conversion.ratio;

  return {
    isSufficient: availableInRequired >= requiredQty,
    available: availableInRequired,
    required: requiredQty,
    shortage: Math.max(0, requiredQty - availableInRequired),
  };
};

/**
 * Convert stock quantity to different unit for display/reporting
 */
export const convertStockForDisplay = (quantity, fromUnit, toUnit, conversions = []) => {
  const conversion = conversions.find(
    (c) => c.fromUnit === fromUnit && c.toUnit === toUnit
  );

  if (!conversion) {
    return null;
  }

  return quantity * conversion.ratio;
};

/**
 * Group conversions by direction (to/from specific unit)
 */
export const groupConversionsByUnit = (conversions = []) => {
  const grouped = {};

  conversions.forEach((conv) => {
    if (!grouped[conv.fromUnit]) {
      grouped[conv.fromUnit] = { to: [], from: [] };
    }
    if (!grouped[conv.toUnit]) {
      grouped[conv.toUnit] = { to: [], from: [] };
    }

    grouped[conv.fromUnit].to.push(conv);
    grouped[conv.toUnit].from.push(conv);
  });

  return grouped;
};

/**
 * Find conversion chain between two units
 * Useful for multi-step conversions
 */
export const findConversionChain = (fromUnit, toUnit, conversions = []) => {
  if (fromUnit === toUnit) {
    return { chain: [], directConversion: true, ratio: 1 };
  }

  // Direct conversion
  const direct = conversions.find(
    (c) => c.fromUnit === fromUnit && c.toUnit === toUnit
  );

  if (direct) {
    return { chain: [direct], directConversion: true, ratio: direct.ratio };
  }

  // BFS for multi-step conversion
  const queue = [[fromUnit]];
  const visited = new Set([fromUnit]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    const nextConversions = conversions.filter((c) => c.fromUnit === current && !visited.has(c.toUnit));

    for (const conv of nextConversions) {
      if (conv.toUnit === toUnit) {
        return {
          chain: [...path.slice(1).map((u) => conversions.find((c) => c.fromUnit === u)), conv].filter(Boolean),
          directConversion: false,
          ratio: calculateChainRatio([conv]),
        };
      }

      visited.add(conv.toUnit);
      queue.push([...path, conv.toUnit]);
    }
  }

  return null;
};

/**
 * Calculate ratio for a conversion chain
 */
const calculateChainRatio = (chain) => {
  return chain.reduce((acc, conv) => acc * conv.ratio, 1);
};
