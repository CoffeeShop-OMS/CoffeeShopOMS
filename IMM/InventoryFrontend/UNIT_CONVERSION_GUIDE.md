# Multi-Unit Conversion System Implementation Guide

## 🎯 Overview

The multi-unit conversion system allows inventory items to be tracked in multiple units of measurement. This is essential for coffee shop operations where products are purchased, stored, and used in different units.

## 📦 Components Created

### 1. **unitConversion.js** (`/utils/unitConversion.js`)
Core conversion utilities with:
- Base conversion rates for volume, weight, and count units
- Unit category detection
- Quantity conversion between compatible units
- Cost calculation per unit with conversions
- Preset conversions for common items

**Key Functions:**
```javascript
convertQuantity(quantity, fromUnit, toUnit, customRatios)
canConvertUnits(fromUnit, toUnit)
getUnitsByCategory(category)
calculateCostPerUnit(totalCost, quantity, unit, targetUnit)
```

### 2. **inventoryConversionHelpers.js** (`/utils/inventoryConversionHelpers.js`)
High-level inventory operations using conversions:
- Alternative stock level calculations
- Cost breakdown generation
- Stock checking for production (recipes)
- Conversion chain finding (multi-step conversions)

**Key Functions:**
```javascript
getAlternativeStockLevels(quantity, unit, conversions)
formatCostBreakdown(totalCost, quantity, unit, conversions)
checkStockForProduction(requiredQty, requiredUnit, availableQty, availableUnit)
```

### 3. **UnitConversionManager.jsx** Component
UI for managing conversions in the item creation/edit drawer:
- Add/remove conversions
- Suggested conversions based on category
- Input validation
- Visual feedback

### 4. **ConversionInfo.jsx** Component
Display conversions inline in inventory:
- Expandable conversion details
- Alternative stock levels
- Cost per unit breakdown

## 💡 Real-World Examples

### Example 1: Milk Inventory
```javascript
// Base unit: liters
// Conversions:
{
  id: 'conv-1',
  fromUnit: 'liters',
  toUnit: 'ml',
  ratio: 1000
},
{
  id: 'conv-2',
  fromUnit: 'liters',
  toUnit: 'sachets',
  ratio: 4  // 1 liter = 4 sachets of 250ml each
}

// Stock Level: 10 liters
// System automatically tracks:
// - 10 liters
// - 10,000 ml
// - 40 sachets

// Cost Calculation:
// Purchase: 1 liter for ₱50
// Cost per ml: ₱50 ÷ 1000 = ₱0.05
// Cost per sachet: ₱50 ÷ 4 = ₱12.50
```

### Example 2: Coffee Beans
```javascript
// Base unit: grams
// Conversions:
{
  fromUnit: 'grams',
  toUnit: 'kg',
  ratio: 1000
},
{
  fromUnit: 'grams',
  toUnit: 'pcs',
  ratio: 250  // 250g per pack
}

// Stock: 2500 grams
// Tracked as:
// - 2500 grams
// - 2.5 kg
// - 10 packs
```

### Example 3: Syrup Bottle
```javascript
// Base unit: pcs (bottles)
// Conversions:
{
  fromUnit: 'pcs',
  toUnit: 'ml',
  ratio: 750  // 750ml per bottle
},
{
  fromUnit: 'ml',
  toUnit: 'shots',
  ratio: 0.033  // 1 shot = 30ml
}

// Stock: 5 bottles
// Tracked as:
// - 5 bottles
// - 3,750 ml
// - ~125 shots
```

## 🔧 Implementation Details

### Data Structure
Conversions are stored as an array on each inventory item:
```javascript
item.conversions = [
  {
    id: 'conv-unique-id',
    fromUnit: 'string',
    toUnit: 'string',
    ratio: number
  }
]
```

### Unit Categories
- **Volume**: ml, liters, gallons, pints, cups, tablespoon, teaspoon
- **Weight**: grams, kg, lbs, oz
- **Count**: pcs, boxes, bags, sachets, cartons, packs

Only units in the same category can be converted to each other.

### Conversion Formula
```
Quantity in Target Unit = Quantity × Ratio
```

For count units with custom ratios (e.g., boxes → sachets), the ratio is user-defined.

For volume/weight, base conversions to SI units (ml, grams) are used.

## 🎯 Use Cases

### 1. **Receiving Stock**
- Receive milk in gallons
- Convert to liters for storage
- Track sachets for sales

### 2. **Production/Recipe Usage**
- Recipe needs 500ml milk
- Check stock in liters
- System calculates if available

### 3. **Accurate Costing**
- Buy 1kg beans for ₱500
- Cost per 100g: ₱50
- Cost per portion (25g): ₱12.50

### 4. **Inventory Reporting**
- Show stock in primary unit
- Display equivalent amounts
- Calculate total value in different units

### 5. **Reordering**
- Low stock threshold set in liters
- System checks liters AND equivalent units
- Alert if any equivalent unit is low

## 📊 Benefits

✅ **Accuracy**: No manual calculation errors
✅ **Flexibility**: Support multiple packaging/measurement formats
✅ **Costing**: Precise cost tracking per actual unit used
✅ **Production**: Recipes work with any unit
✅ **Reporting**: Show inventory in most convenient unit
✅ **Compliance**: Track all handling formats

## 🚀 Future Enhancements

- Multi-step conversion chains
- Conversion history/audit trail
- Bulk conversion updates
- Conversion presets per supplier
- Automated conversion suggestions based on purchase history
- Batch-level conversions (different units per batch)

## 🔗 Integration Points

### Backend (Firebase)
- Store conversions in inventory item document
- Include in API responses
- Use for inventory calculations
- Track in audit logs

### Frontend
- ItemDrawer: Add/manage conversions
- InventoryTable: Display conversion info
- StockAdjustModal: Support multi-unit adjustments
- Reports: Show alternative units

### Business Logic
- createInventoryItem: Initialize with conversions
- updateInventoryItem: Allow conversion updates
- adjustInventoryStock: Support multi-unit adjustments
- getInventory: Include conversion data

## 📝 Usage Examples in Components

### In ItemDrawer
```jsx
<UnitConversionManager
  itemCategory={item.category}
  conversions={item.conversions || []}
  onConversionsChange={(conversions) => 
    setItem(p => ({ ...p, conversions }))
  }
/>
```

### In InventoryTable
```jsx
import ConversionInfo from './ConversionInfo';

<ConversionInfo 
  item={item} 
  conversions={item.conversions} 
/>
```

### Converting Stock for Display
```javascript
import { convertQuantity } from './unitConversion';

const stockInMl = convertQuantity(
  stockInLiters, 
  'liters', 
  'ml', 
  conversions
);
```

### Checking Stock for Production
```javascript
import { checkStockForProduction } from './inventoryConversionHelpers';

const check = checkStockForProduction(
  500,        // need 500
  'ml',       // milliliters
  10,         // have 10
  'liters',   // liters
  conversions
);

if (!check.isSufficient) {
  alert(`Need ${check.shortage} more ${check.required}`);
}
```
