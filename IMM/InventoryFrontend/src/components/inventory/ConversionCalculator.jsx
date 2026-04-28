import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Dropdown from '../Dropdown';
import {
  convertQuantity,
  getUnitsByCategory,
  canConvertUnits,
  getUnitCategory,
} from '../../utils/unitConversion';

/**
 * Unit Conversion Calculator Component
 * For testing and quick conversions
 */
export default function ConversionCalculator({ conversions = [], item = null }) {
  const [fromQuantity, setFromQuantity] = useState('1');
  const [fromUnit, setFromUnit] = useState('liters');
  const [toUnit, setToUnit] = useState('ml');

  const category = getUnitCategory(fromUnit);
  const availableToUnits = category ? getUnitsByCategory(category) : [];
  const canConvert = canConvertUnits(fromUnit, toUnit);

  let result = null;
  if (canConvert && fromQuantity) {
    try {
      result = convertQuantity(
        parseFloat(fromQuantity),
        fromUnit,
        toUnit,
        convertRatiosToObject(conversions)
      );
    } catch (e) {
      console.error('Conversion error:', e);
    }
  }

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="bg-[#FDFCFB] border border-[#E2DDD8] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[#3D261D] mb-4">Quick Converter</h3>

      <div className="space-y-3">
        {/* From Unit */}
        <div>
          <label className="block text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
            From
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={fromQuantity}
              onChange={(e) => setFromQuantity(e.target.value)}
              className="flex-1 border border-[#E2DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6B3E26] focus:ring-2 focus:ring-[#6B3E26]/10"
              placeholder="Enter quantity"
            />
            <Dropdown
              value={fromUnit}
              onChange={setFromUnit}
              options={[
                ...getUnitsByCategory('volume'),
                ...getUnitsByCategory('weight'),
                ...getUnitsByCategory('count'),
              ]}
              className="w-24"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2 bg-[#F7F4F0] hover:bg-[#E6DDD6] rounded-lg transition text-[#6B5744]"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* To Unit */}
        <div>
          <label className="block text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
            To
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result !== null ? result.toFixed(4) : ''}
              disabled
              className="flex-1 border border-[#E2DDD8] rounded-lg px-3 py-2 text-sm bg-[#F7F4F0] text-[#2C1810] cursor-not-allowed"
              placeholder="Result"
            />
            <Dropdown
              value={toUnit}
              onChange={setToUnit}
              options={availableToUnits}
              className="w-24"
              disabled={!category}
            />
          </div>
        </div>

        {/* Conversion Info */}
        {canConvert && result !== null && (
          <div className="bg-[#F7F4F0] rounded-lg p-3 text-sm">
            <p className="text-[#2C1810]">
              <strong>{fromQuantity} {fromUnit}</strong> = <strong>{result.toFixed(4)} {toUnit}</strong>
            </p>
          </div>
        )}

        {!canConvert && fromUnit && toUnit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Cannot convert between {fromUnit} and {toUnit}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to convert conversions array to object for convertQuantity function
 */
function convertRatiosToObject(conversions = []) {
  const ratios = {};
  conversions.forEach((conv) => {
    ratios[`${conv.fromUnit}_to_${conv.toUnit}`] = conv.ratio;
    // Also add reverse conversion
    if (conv.ratio !== 0) {
      ratios[`${conv.toUnit}_to_${conv.fromUnit}`] = 1 / conv.ratio;
    }
  });
  return ratios;
}
