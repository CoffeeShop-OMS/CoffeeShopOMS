import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { getAlternativeStockLevels, formatCostBreakdown } from '../../utils/inventoryConversionHelpers';

/**
 * Display conversions for an inventory item
 */
export default function ConversionInfo({ item, conversions = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!conversions || conversions.length === 0) {
    return null;
  }

  const alternatives = getAlternativeStockLevels(item.quantity, item.stock?.split(' ')[1], conversions);
  const costBreakdown = formatCostBreakdown(item.costPrice * item.quantity, item.quantity, item.stock?.split(' ')[1], conversions);

  if (alternatives.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 border-t border-[#E8E1D9] pt-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-[#6B5744] hover:text-[#3D261D] transition"
      >
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span className="font-semibold">View conversions ({alternatives.length})</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Alternative Stock Levels */}
          <div className="bg-[#F7F4F0] rounded-lg p-2">
            <p className="text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
              Equivalent Stock
            </p>
            {alternatives.map((alt, idx) => (
              <div key={idx} className="text-xs text-[#2C1810] py-1 flex justify-between">
                <span>{alt.quantity.toFixed(2)} {alt.unit}</span>
                <span className="text-[#9E8A7A]">
                  ({(alt.quantity / item.quantity * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>

          {/* Cost Per Unit Breakdown */}
          {item.costPrice && (
            <div className="bg-[#FDFCFB] rounded-lg p-2 border border-[#E2DDD8]">
              <p className="text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
                Cost Per Unit
              </p>
              {costBreakdown.map((cb, idx) => (
                <div key={idx} className="text-xs text-[#2C1810] py-1 flex justify-between">
                  <span>per {cb.unit}</span>
                  <span className="font-semibold">₱{cb.costPerUnit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
