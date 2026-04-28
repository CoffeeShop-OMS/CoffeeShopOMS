import { useState } from 'react';
import { Trash2, Plus, ChevronDown } from 'lucide-react';
import Dropdown from '../Dropdown';
import {
  getUnitCategory,
  getUnitsByCategory,
  convertQuantity,
  formatConversion,
  getSuggestedConversions,
  canConvertUnits,
} from '../../utils/unitConversion';

export default function UnitConversionManager({ itemCategory, conversions = [], onConversionsChange, isEditMode = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddConversion, setShowAddConversion] = useState(false);
  const [newConversion, setNewConversion] = useState({
    fromUnit: '',
    toUnit: '',
    ratio: '',
  });

  const suggestedConversions = getSuggestedConversions(itemCategory);

  const handleAddConversion = () => {
    if (!newConversion.fromUnit || !newConversion.toUnit || !newConversion.ratio) {
      return;
    }

    if (!canConvertUnits(newConversion.fromUnit, newConversion.toUnit)) {
      return;
    }

    const newConv = {
      id: `conv-${Date.now()}`,
      fromUnit: newConversion.fromUnit,
      toUnit: newConversion.toUnit,
      ratio: parseFloat(newConversion.ratio),
    };

    onConversionsChange([...conversions, newConv]);
    setNewConversion({ fromUnit: '', toUnit: '', ratio: '' });
    setShowAddConversion(false);
  };

  const handleRemoveConversion = (id) => {
    onConversionsChange(conversions.filter((c) => c.id !== id));
  };

  const handleApplySuggestion = (suggestion) => {
    const newConv = {
      id: `conv-${Date.now()}`,
      fromUnit: suggestion.fromUnit,
      toUnit: suggestion.toUnit,
      ratio: suggestion.ratio,
    };
    onConversionsChange([...conversions, newConv]);
  };

  const getVolumeUnits = () => getUnitsByCategory('volume');
  const getWeightUnits = () => getUnitsByCategory('weight');
  const getCountUnits = () => getUnitsByCategory('count');

  const getAvailableToUnits = (fromUnit) => {
    const category = getUnitCategory(fromUnit);
    return getUnitsByCategory(category);
  };

  return (
    <div className="mt-4 border border-[#E2DDD8] rounded-lg p-4 bg-[#FDFCFB]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#3D261D]">Unit Conversions</span>
          {conversions.length > 0 && (
            <span className="text-xs bg-[#3D261D] text-white rounded-full px-2 py-0.5">
              {conversions.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6B5744] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Existing Conversions */}
          {conversions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#7A6355] uppercase tracking-widest">Active Conversions</p>
              {conversions.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between bg-white border border-[#E2DDD8] rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm text-[#2C1810]">
                      1 {conv.fromUnit} = {conv.ratio} {conv.toUnit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveConversion(conv.id)}
                    className="text-red-500 hover:text-red-700 transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Suggested Conversions */}
          {suggestedConversions.length > 0 && conversions.length < suggestedConversions.length && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#7A6355] uppercase tracking-widest">Suggested</p>
              <div className="space-y-2">
                {suggestedConversions.map((sugg, idx) => {
                  const isAlreadyAdded = conversions.some(
                    (c) =>
                      c.fromUnit === sugg.fromUnit &&
                      c.toUnit === sugg.toUnit &&
                      Math.abs(c.ratio - sugg.ratio) < 0.01
                  );
                  return !isAlreadyAdded ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySuggestion(sugg)}
                      className="w-full text-left text-sm bg-[#F7F4F0] hover:bg-[#E6DDD6] border border-[#E2DDD8] rounded-lg p-3 transition"
                    >
                      <p className="text-[#2C1810]">
                        1 {sugg.fromUnit} = {sugg.ratio} {sugg.toUnit}
                      </p>
                      <p className="text-xs text-[#9E8A7A]">{sugg.name}</p>
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Add Conversion */}
          {showAddConversion ? (
            <div className="space-y-3 bg-white border border-[#E2DDD8] rounded-lg p-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
                    From Unit
                  </label>
                  <Dropdown
                    value={newConversion.fromUnit}
                    onChange={(val) => setNewConversion((p) => ({ ...p, fromUnit: val }))}
                    options={[
                      ...getVolumeUnits(),
                      ...getWeightUnits(),
                      ...getCountUnits(),
                    ]}
                    placeholder="Select"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
                    To Unit
                  </label>
                  <Dropdown
                    value={newConversion.toUnit}
                    onChange={(val) => setNewConversion((p) => ({ ...p, toUnit: val }))}
                    options={
                      newConversion.fromUnit ? getAvailableToUnits(newConversion.fromUnit) : []
                    }
                    placeholder="Select"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6355] uppercase tracking-widest mb-2">
                    Ratio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newConversion.ratio}
                    onChange={(e) => setNewConversion((p) => ({ ...p, ratio: e.target.value }))}
                    className="w-full border border-[#E2DDD8] rounded-lg px-3 py-2 text-sm text-[#2C1810] focus:outline-none focus:border-[#6B3E26] focus:ring-2 focus:ring-[#6B3E26]/10"
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddConversion(false)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[#F7F4F0] text-[#6B5744] hover:bg-[#E6DDD6] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddConversion}
                  disabled={!newConversion.fromUnit || !newConversion.toUnit || !newConversion.ratio}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[#3D261D] text-white hover:bg-[#2E1C15] disabled:opacity-50 transition"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddConversion(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border border-dashed border-[#6B5744] text-[#6B5744] hover:bg-[#F7F4F0] transition"
            >
              <Plus className="w-4 h-4" />
              Add Conversion
            </button>
          )}

          {/* Info */}
          <div className="bg-[#FFF8F5] border border-[#F5C0C0] rounded-lg p-3">
            <p className="text-xs text-[#6B3E26]">
              💡 <strong>Tip:</strong> Define how many units of 'To Unit' equal 1 'From Unit'.
              <br />
              Example: 1 liter = 1000 mL
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
