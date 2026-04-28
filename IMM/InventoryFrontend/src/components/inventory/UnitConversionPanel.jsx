import { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  Beaker,
  Package2,
  Plus,
  Scale,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { getConversionRules, saveConversionRules } from '../../services/api';
import { getAuthSession } from '../../utils/authStorage';
import Dropdown from '../Dropdown';
import {
  PRESET_CONVERSIONS,
  canConvertUnits,
  getUnitCategory,
  getUnitsByCategory,
} from '../../utils/unitConversion';

const CATEGORY_CONFIG = {
  volume: {
    label: 'Volume',
    description: 'For milk, syrups, water, and other liquids measured by pour or pump.',
    icon: Beaker,
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    card: 'border-sky-200 bg-sky-50/70',
    accent: 'text-sky-700',
    helper: 'Common fixed ratios like liters to mL can be reused safely across items.',
  },
  weight: {
    label: 'Weight',
    description: 'For beans, powders, and dry ingredients measured on a scale.',
    icon: Scale,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    card: 'border-emerald-200 bg-emerald-50/70',
    accent: 'text-emerald-700',
    helper: 'Weight conversions are standard, so presets work well for most ingredients.',
  },
  count: {
    label: 'Count',
    description: 'For boxes, packs, sachets, cartons, and other countable stock.',
    icon: Package2,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    card: 'border-amber-200 bg-amber-50/70',
    accent: 'text-amber-700',
    helper: 'Pack sizes vary by supplier, so review the ratio before applying count presets.',
  },
};

const categoryOptions = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

const formatRatio = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value ?? '');

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return numericValue.toFixed(3).replace(/\.?0+$/, '');
};

const flattenPresetConversions = () => {
  const seen = new Set();

  return Object.values(PRESET_CONVERSIONS)
    .flat()
    .filter((preset) => canConvertUnits(preset.fromUnit, preset.toUnit))
    .filter((preset) => {
      const key = `${preset.fromUnit}-${preset.toUnit}-${preset.ratio}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const compatiblePresets = flattenPresetConversions();

export default function UnitConversionPanel() {
  const [conversions, setConversions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('volume');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [ratio, setRatio] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load conversions from database on mount
  useEffect(() => {
    const loadRules = async () => {
      try {
        setIsLoading(true);
        const session = getAuthSession();
        if (!session?.token) {
          setIsLoading(false);
          return;
        }

        const result = await getConversionRules(session.token);
        if (result?.data && Array.isArray(result.data)) {
          setConversions(result.data);
        }
      } catch (e) {
        console.error('Failed to load conversion rules:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, []);

  // Save conversions to database whenever they change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const saveToDB = async () => {
        try {
          const session = getAuthSession();
          if (!session?.token) return;

          // Only save if there are actual conversions
          if (conversions.length > 0) {
            await saveConversionRules(session.token, conversions);
          }
        } catch (e) {
          console.error('Failed to save conversions:', e);
        }
      };

      saveToDB();
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [conversions]);

  const categoryConfig = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG.volume;
  const CategoryIcon = categoryConfig.icon;
  const unitsByCategory = getUnitsByCategory(selectedCategory);
  const fromUnitOptions = unitsByCategory.map((unit) => ({ value: unit, label: unit }));
  const toUnitOptions = unitsByCategory
    .filter((unit) => unit !== fromUnit)
    .map((unit) => ({ value: unit, label: unit }));
  const categorySuggestions = useMemo(
    () =>
      compatiblePresets.filter((preset) => getUnitCategory(preset.fromUnit) === selectedCategory),
    [selectedCategory]
  );
  const selectedPairPreview =
    fromUnit && toUnit ? `1 ${fromUnit} = ${ratio || '?'} ${toUnit}` : 'Build your conversion pair';

  const resetDraft = () => {
    setFromUnit('');
    setToUnit('');
    setRatio('');
  };

  const conversionExists = (candidate) =>
    conversions.some(
      (conversion) =>
        conversion.fromUnit === candidate.fromUnit && conversion.toUnit === candidate.toUnit
    );

  const handleCategoryChange = (nextCategory) => {
    setSelectedCategory(nextCategory);
    setError('');
    resetDraft();
  };

  const handleAddConversion = () => {
    setError('');

    if (!fromUnit || !toUnit || !ratio) {
      setError('Please fill in the category, both units, and the conversion ratio.');
      return;
    }

    if (fromUnit === toUnit) {
      setError('From Unit and To Unit must be different.');
      return;
    }

    if (!canConvertUnits(fromUnit, toUnit)) {
      setError('These units are not compatible.');
      return;
    }

    const numericRatio = Number.parseFloat(ratio);
    if (!Number.isFinite(numericRatio) || numericRatio <= 0) {
      setError('Ratio must be a positive number.');
      return;
    }

    const nextConversion = {
      id: `conv-${Date.now()}`,
      fromUnit,
      toUnit,
      ratio: numericRatio,
    };

    if (conversionExists(nextConversion)) {
      setError('This conversion pair already exists.');
      return;
    }

    setConversions((current) => [...current, nextConversion]);
    resetDraft();
  };

  const handleRemoveConversion = (id) => {
    setConversions((current) => current.filter((conversion) => conversion.id !== id));
  };

  const handleAddSuggested = (suggestion) => {
    setError('');

    if (conversionExists(suggestion)) {
      setError('That suggested conversion is already in the active list.');
      return;
    }

    setConversions((current) => [
      ...current,
      {
        id: `conv-${Date.now()}`,
        fromUnit: suggestion.fromUnit,
        toUnit: suggestion.toUnit,
        ratio: suggestion.ratio,
      },
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#E8DED5] bg-gradient-to-br from-[#FCF8F4] via-white to-[#F6EEE6] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A89080]">
              Conversion Workspace
            </p>
            <h3 className="mt-2 text-xl font-bold text-[#1C100A]">
              Organize unit rules with the same inventory style
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#7A6355]">
              Create reusable conversion pairs for liquids, weights, and packaged stock using your
              custom dropdown design.
            </p>
          </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E8DED5] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                Active Rules
              </p>
              <p className="mt-2 text-2xl font-bold text-[#1C100A]">{conversions.length}</p>
            </div>
            <div className="rounded-2xl border border-[#E8DED5] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                Category
              </p>
              <p className="mt-2 text-sm font-semibold text-[#3D261D]">{categoryConfig.label}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-[#E8DED5] bg-white px-4 py-3 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                Preview
              </p>
              <p className="mt-2 text-sm font-semibold text-[#3D261D]">{selectedPairPreview}</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[#E8DED5] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                  Add Custom Conversion
                </p>
                <h4 className="mt-2 text-lg font-bold text-[#1C100A]">
                  Define a conversion pair
                </h4>
                <p className="mt-1 text-sm text-[#7A6355]">
                  Keep everything inside one unit category so the ratio stays predictable.
                </p>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${categoryConfig.card} lg:max-w-xs`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl border px-2.5 py-2 ${categoryConfig.badge}`}>
                    <CategoryIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${categoryConfig.accent}`}>
                      {categoryConfig.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6B5744]">
                      {categoryConfig.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6355]">
                  Category
                </label>
                <Dropdown
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  options={categoryOptions}
                  placeholder="Select category"
                  className="text-sm font-semibold text-[#3D261D]"
                />
              </div>

              <div className="rounded-2xl border border-[#EFE7DE] bg-[#FCFAF8] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                  Category Tip
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6B5744]">{categoryConfig.helper}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6355]">
                  From Unit
                </label>
                <Dropdown
                  value={fromUnit}
                  onChange={(value) => {
                    setError('');
                    setFromUnit(value);
                    if (value === toUnit) {
                      setToUnit('');
                    }
                  }}
                  options={fromUnitOptions}
                  placeholder="Select source unit"
                  className="text-sm font-semibold text-[#3D261D]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6355]">
                  To Unit
                </label>
                <Dropdown
                  value={toUnit}
                  onChange={(value) => {
                    setError('');
                    setToUnit(value);
                  }}
                  options={toUnitOptions}
                  placeholder={fromUnit ? 'Select target unit' : 'Choose from unit first'}
                  className="text-sm font-semibold text-[#3D261D]"
                  disabled={!fromUnit}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6355]">
                  Ratio
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={ratio}
                  onChange={(event) => {
                    setError('');
                    setRatio(event.target.value);
                  }}
                  placeholder={fromUnit && toUnit ? `1 ${fromUnit} = ? ${toUnit}` : 'Enter conversion ratio'}
                  className="w-full rounded-xl border border-[#E2DDD8] bg-white px-3.5 py-2.5 text-sm text-[#2C1810] transition placeholder:text-[#C4B8B0] focus:outline-none focus:border-[#6B3E26] focus:ring-2 focus:ring-[#6B3E26]/10"
                />
              </div>

              <button
                type="button"
                onClick={handleAddConversion}
                className="mt-[26px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D261D] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2E1C15]"
              >
                <Plus className="h-4 w-4" />
                Add Conversion
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E8DED5] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                  Suggested Presets
                </p>
                <h4 className="mt-2 text-lg font-bold text-[#1C100A]">
                  Start with common conversions
                </h4>
                <p className="mt-1 text-sm text-[#7A6355]">
                  These are pulled from your existing conversion utility and filtered by category.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${categoryConfig.badge}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {categorySuggestions.length} presets
              </div>
            </div>

            {categorySuggestions.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {categorySuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.fromUnit}-${suggestion.toUnit}-${suggestion.ratio}`}
                    type="button"
                    onClick={() => handleAddSuggested(suggestion)}
                    className="rounded-2xl border border-[#E8DED5] bg-[#FCFAF8] px-4 py-4 text-left transition-all hover:border-[#C4A882] hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-[#1C100A]">
                      1 {suggestion.fromUnit} = {formatRatio(suggestion.ratio)} {suggestion.toUnit}
                    </p>
                    <p className="mt-1 text-xs text-[#9E8A7A]">{suggestion.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#E2DDD8] bg-[#FBFAF8] px-4 py-5">
                <p className="text-sm font-medium text-[#6B5744]">
                  No standard presets for this category yet.
                </p>
                <p className="mt-1 text-xs leading-5 text-[#9E8A7A]">
                  Create a custom ratio based on your supplier packaging or stocking format.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E8DED5] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A89080]">
                Active Conversions
              </p>
              <h4 className="mt-2 text-lg font-bold text-[#1C100A]">
                Review your current rules
              </h4>
              <p className="mt-1 text-sm text-[#7A6355]">
                Remove any rule that should not appear in the current conversion set.
              </p>
            </div>
            <div className="rounded-full bg-[#3D261D] px-3 py-1 text-xs font-semibold text-white">
              {conversions.length}
            </div>
          </div>

          {conversions.length > 0 ? (
            <div className="mt-5 space-y-3">
              {conversions.map((conversion) => (
                <div
                  key={conversion.id}
                  className="rounded-2xl border border-[#E8DED5] bg-[#FCFAF8] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1C100A]">
                        1 {conversion.fromUnit} = {formatRatio(conversion.ratio)} {conversion.toUnit}
                      </p>
                      <p className="mt-1 text-xs text-[#9E8A7A]">
                        {CATEGORY_CONFIG[getUnitCategory(conversion.fromUnit)]?.label || 'Unit'} rule
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConversion(conversion.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8DED5] bg-white text-[#9E8A7A] transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Remove ${conversion.fromUnit} to ${conversion.toUnit} conversion`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#E2DDD8] bg-[#FBFAF8] px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EBE5] text-[#6B5744]">
                <Plus className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#3D261D]">
                No active conversions yet
              </p>
              <p className="mt-1 text-xs leading-5 text-[#9E8A7A]">
                Add a custom rule or pick one of the suggested presets to start building your unit setup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
