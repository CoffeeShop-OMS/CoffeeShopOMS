/**
 * Unit Conversion Utility
 * Handles multi-unit conversion for inventory items
 */

// Base conversion rates to common units
const BASE_CONVERSIONS = {
  // Volume conversions (all to milliliters)
  ml: 1,
  liters: 1000,
  gallons: 3785.41,
  pints: 473.176,
  cups: 236.588,
  tablespoon: 14.787,
  teaspoon: 4.929,
  
  // Weight conversions (all to grams)
  grams: 1,
  kg: 1000,
  lbs: 453.592,
  oz: 28.3495,
  
  // Count conversions (pieces)
  pcs: 1,
  boxes: 1,
  bags: 1,
  sachets: 1,
  cartons: 1,
  packs: 1,
};

// Unit categories for proper conversion
const UNIT_CATEGORIES = {
  volume: ['ml', 'liters', 'gallons', 'pints', 'cups', 'tablespoon', 'teaspoon'],
  weight: ['grams', 'kg', 'lbs', 'oz'],
  count: ['pcs', 'boxes', 'bags', 'sachets', 'cartons', 'packs'],
};

/**
 * Get the category of a unit
 */
export const getUnitCategory = (unit) => {
  const normalizedUnit = unit.toLowerCase();
  for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
    if (units.includes(normalizedUnit)) {
      return category;
    }
  }
  return null;
};

/**
 * Check if two units can be converted
 */
export const canConvertUnits = (fromUnit, toUnit) => {
  return getUnitCategory(fromUnit) === getUnitCategory(toUnit);
};

/**
 * Convert a quantity from one unit to another
 * For count units, uses custom conversion ratios
 */
export const convertQuantity = (quantity, fromUnit, toUnit, customRatios = {}) => {
  fromUnit = fromUnit.toLowerCase();
  toUnit = toUnit.toLowerCase();
  
  if (fromUnit === toUnit) {
    return quantity;
  }
  
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);
  
  if (fromCategory !== toCategory) {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit} - different unit categories`);
  }
  
  // For count units, use custom ratios
  if (fromCategory === 'count') {
    const key = `${fromUnit}_to_${toUnit}`;
    if (customRatios[key]) {
      return quantity * customRatios[key];
    }
    // Default count conversion (1:1 if no custom ratio)
    return quantity;
  }
  
  // For volume and weight, use base conversions
  const fromBase = BASE_CONVERSIONS[fromUnit] || 1;
  const toBase = BASE_CONVERSIONS[toUnit] || 1;
  
  return (quantity * fromBase) / toBase;
};

/**
 * Get common unit options by category
 */
export const getUnitsByCategory = (category) => {
  return UNIT_CATEGORIES[category] || [];
};

/**
 * Format a conversion for display
 */
export const formatConversion = (fromQuantity, fromUnit, toQuantity, toUnit) => {
  return `${fromQuantity} ${fromUnit} = ${toQuantity.toFixed(2)} ${toUnit}`;
};

/**
 * Calculate cost per unit in different units
 */
export const calculateCostPerUnit = (totalCost, quantity, unit, targetUnit, customRatios = {}) => {
  if (unit === targetUnit) {
    return totalCost / quantity;
  }
  
  const convertedQuantity = convertQuantity(quantity, unit, targetUnit, customRatios);
  return totalCost / convertedQuantity;
};

/**
 * Standardize quantity to base unit for storage
 */
export const standardizeQuantity = (quantity, unit) => {
  const category = getUnitCategory(unit);
  
  if (category === 'volume') {
    return convertQuantity(quantity, unit, 'ml');
  } else if (category === 'weight') {
    return convertQuantity(quantity, unit, 'grams');
  } else if (category === 'count') {
    return quantity; // Keep as is for count
  }
  
  return quantity;
};

/**
 * Get preset conversions for common items
 */
export const PRESET_CONVERSIONS = {
  milk: [
    { name: 'box to sachets', fromUnit: 'boxes', toUnit: 'sachets', ratio: 10 },
    { name: 'sachet to ml', fromUnit: 'sachets', toUnit: 'ml', ratio: 250 },
    { name: 'liter to ml', fromUnit: 'liters', toUnit: 'ml', ratio: 1000 },
    { name: 'gallon to liters', fromUnit: 'gallons', toUnit: 'liters', ratio: 3.78 },
  ],
  beans: [
    { name: 'pack to grams', fromUnit: 'pcs', toUnit: 'grams', ratio: 250 },
    { name: 'kg to grams', fromUnit: 'kg', toUnit: 'grams', ratio: 1000 },
  ],
  syrup: [
    { name: 'bottle to ml', fromUnit: 'pcs', toUnit: 'ml', ratio: 750 },
    { name: 'liter to ml', fromUnit: 'liters', toUnit: 'ml', ratio: 1000 },
  ],
  cups: [
    { name: 'carton to pcs', fromUnit: 'cartons', toUnit: 'pcs', ratio: 50 },
  ],
};

/**
 * Get suggested conversions based on category
 */
export const getSuggestedConversions = (category) => {
  const categoryLower = category.toLowerCase();
  if (PRESET_CONVERSIONS[categoryLower]) {
    return PRESET_CONVERSIONS[categoryLower];
  }
  return [];
};
