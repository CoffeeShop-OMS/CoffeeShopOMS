/**
 * Example Usage of Multi-Unit Conversion System
 * Real-world scenarios for coffee shop inventory
 */

import {
  convertQuantity,
  getUnitCategory,
  canConvertUnits,
  calculateCostPerUnit,
  getSuggestedConversions,
} from '../utils/unitConversion';

import {
  getAlternativeStockLevels,
  formatCostBreakdown,
  checkStockForProduction,
} from '../utils/inventoryConversionHelpers';

// ============================================
// SCENARIO 1: MILK INVENTORY
// ============================================
console.log('=== MILK INVENTORY ===\n');

const milkItem = {
  id: 'milk-1',
  name: 'Fresh Milk',
  category: 'Milk',
  quantity: 10, // liters
  unit: 'liters',
  costPrice: 50, // ₱50 per liter
  conversions: [
    { id: 'conv-1', fromUnit: 'liters', toUnit: 'ml', ratio: 1000 },
    { id: 'conv-2', fromUnit: 'liters', toUnit: 'sachets', ratio: 4 },
    { id: 'conv-3', fromUnit: 'ml', toUnit: 'cups', ratio: 0.236 },
  ],
};

// Get alternative stock levels
const milkAlternatives = getAlternativeStockLevels(
  milkItem.quantity,
  milkItem.unit,
  milkItem.conversions
);

console.log(`Stock: ${milkItem.quantity} ${milkItem.unit}`);
console.log('Alternative levels:');
milkAlternatives.forEach((alt) => {
  console.log(`  - ${alt.quantity.toFixed(2)} ${alt.unit}`);
});

// Cost per unit breakdown
const milkCostBreakdown = formatCostBreakdown(
  milkItem.costPrice * milkItem.quantity,
  milkItem.quantity,
  milkItem.unit,
  milkItem.conversions
);

console.log('\nCost breakdown:');
milkCostBreakdown.forEach((cb) => {
  console.log(`  - ₱${cb.costPerUnit.toFixed(2)} per ${cb.unit}`);
});

// ============================================
// SCENARIO 2: COFFEE BEANS
// ============================================
console.log('\n=== COFFEE BEANS ===\n');

const beansItem = {
  name: 'Arabica Beans',
  category: 'Beans',
  quantity: 5000, // grams
  unit: 'grams',
  costPrice: 2.50, // ₱2.50 per gram
  conversions: [
    { id: 'conv-1', fromUnit: 'grams', toUnit: 'kg', ratio: 1000 },
    { id: 'conv-2', fromUnit: 'grams', toUnit: 'pcs', ratio: 250 }, // 250g per pack
  ],
};

const beansAlternatives = getAlternativeStockLevels(
  beansItem.quantity,
  beansItem.unit,
  beansItem.conversions
);

console.log(`Stock: ${beansItem.quantity} ${beansItem.unit}`);
console.log('Alternative levels:');
beansAlternatives.forEach((alt) => {
  console.log(`  - ${alt.quantity.toFixed(2)} ${alt.unit}`);
});

// ============================================
// SCENARIO 3: PRODUCTION CHECK
// ============================================
console.log('\n=== PRODUCTION CHECK ===\n');

// Recipe needs 500ml milk
const recipeRequires = {
  quantity: 500,
  unit: 'ml',
};

// We have 10 liters
const stockStatus = checkStockForProduction(
  recipeRequires.quantity,
  recipeRequires.unit,
  milkItem.quantity,
  milkItem.unit,
  milkItem.conversions
);

console.log(`Recipe needs: ${recipeRequires.quantity} ${recipeRequires.unit}`);
console.log(`We have: ${milkItem.quantity} ${milkItem.unit}`);
console.log(`Status: ${stockStatus.isSufficient ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}`);
if (!stockStatus.isSufficient) {
  console.log(`Shortage: ${stockStatus.shortage} ${recipeRequires.unit}`);
}

// ============================================
// SCENARIO 4: CONVERSION WITH PRESETS
// ============================================
console.log('\n=== SUGGESTED CONVERSIONS ===\n');

const suggested = getSuggestedConversions('milk');
console.log('Suggested conversions for Milk:');
suggested.forEach((sugg) => {
  console.log(`  - 1 ${sugg.fromUnit} = ${sugg.ratio} ${sugg.toUnit} (${sugg.name})`);
});

// ============================================
// SCENARIO 5: DIRECT CONVERSION
// ============================================
console.log('\n=== DIRECT CONVERSIONS ===\n');

const conversionExamples = [
  { qty: 2, from: 'liters', to: 'ml' },
  { qty: 5, from: 'kg', to: 'grams' },
  { qty: 1, from: 'gallons', to: 'liters' },
];

conversionExamples.forEach(({ qty, from, to }) => {
  const result = convertQuantity(qty, from, to);
  console.log(`${qty} ${from} = ${result.toFixed(2)} ${to}`);
});

// ============================================
// SCENARIO 6: BATCH COSTING
// ============================================
console.log('\n=== BATCH COSTING ===\n');

// Purchased 50kg of beans for ₱150,000
const purchaseInfo = {
  quantity: 50,
  unit: 'kg',
  totalCost: 150000,
};

const costPerKg = purchaseInfo.totalCost / purchaseInfo.quantity;
const costPerGram = costPerKg / 1000;
const costPer250gPack = costPerGram * 250;

console.log(`Purchase: ${purchaseInfo.quantity} ${purchaseInfo.unit} for ₱${purchaseInfo.totalCost}`);
console.log(`Cost per kg: ₱${costPerKg.toFixed(2)}`);
console.log(`Cost per gram: ₱${costPerGram.toFixed(4)}`);
console.log(`Cost per 250g pack: ₱${costPer250gPack.toFixed(2)}`);

// ============================================
// SCENARIO 7: CATEGORY CHECKING
// ============================================
console.log('\n=== UNIT COMPATIBILITY ===\n');

const compatibilityTests = [
  { unit1: 'liters', unit2: 'ml', description: 'Volume units' },
  { unit1: 'kg', unit2: 'grams', description: 'Weight units' },
  { unit1: 'pcs', unit2: 'boxes', description: 'Count units' },
  { unit1: 'liters', unit2: 'grams', description: 'Different categories' },
];

compatibilityTests.forEach((test) => {
  const canConvert = canConvertUnits(test.unit1, test.unit2);
  console.log(
    `${test.unit1} ↔ ${test.unit2}: ${canConvert ? '✅ Compatible' : '❌ Incompatible'} (${test.description})`
  );
});

console.log('\n=== END OF EXAMPLES ===');
