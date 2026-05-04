import { X } from 'lucide-react';
import Dropdown from '../Dropdown';

const DEFAULT_UNIT_OPTIONS = ['pcs', 'ml', 'grams', 'liters'];

const CATEGORY_UNIT_GUIDES = {
  Beans: {
    title: 'Beans Unit Guide',
    unitOptions: ['grams', 'pcs'],
    defaultUnit: 'grams',
    rules: [
      'Use grams if the beans are scooped, weighed, or taken from bulk bags.',
      'Use pcs if each sealed pack is tracked as one stock unit.',
    ],
    presets: [
      { label: 'Bulk beans', unit: 'grams' },
      { label: 'Packed beans', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-amber-100 bg-amber-50/80',
      title: 'text-amber-700',
      text: 'text-amber-900',
      subtext: 'text-amber-700',
      active: 'border-amber-300 bg-white text-amber-700',
      idle: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-white',
    },
  },
  Milk: {
    title: 'Milk Unit Guide',
    unitOptions: ['liters', 'ml', 'pcs'],
    defaultUnit: 'liters',
    rules: [
      'Use liters or mL if the milk is poured or measured.',
      'Use pcs if the milk is individually packed, like sachets or cartons.',
    ],
    presets: [
      { label: 'Liquid milk', unit: 'liters' },
      { label: 'Small measured milk', unit: 'ml' },
      { label: 'Packed milk', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-sky-100 bg-sky-50/80',
      title: 'text-sky-700',
      text: 'text-sky-900',
      subtext: 'text-sky-700',
      active: 'border-sky-300 bg-white text-sky-700',
      idle: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-white',
    },
  },
  Syrup: {
    title: 'Syrup Unit Guide',
    unitOptions: ['liters', 'ml', 'pcs'],
    defaultUnit: 'ml',
    rules: [
      'Use liters or mL if syrup is pumped, poured, or measured by volume.',
      'Use pcs if each bottle or sachet is tracked as one stock unit.',
    ],
    presets: [
      { label: 'Bulk syrup', unit: 'liters' },
      { label: 'Measured syrup', unit: 'ml' },
      { label: 'Packed syrup', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-violet-100 bg-violet-50/80',
      title: 'text-violet-700',
      text: 'text-violet-900',
      subtext: 'text-violet-700',
      active: 'border-violet-300 bg-white text-violet-700',
      idle: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-white',
    },
  },
  Cups: {
    title: 'Cup Supply Guide',
    unitOptions: ['pcs'],
    defaultUnit: 'pcs',
    rules: [
      'Use pcs for countable items like cups, lids, sleeves, and stirrers.',
      'If supplies come by box, convert them to total pieces for clearer reordering.',
    ],
    presets: [
      { label: 'Countable supply', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-emerald-100 bg-emerald-50/80',
      title: 'text-emerald-700',
      text: 'text-emerald-900',
      subtext: 'text-emerald-700',
      active: 'border-emerald-300 bg-white text-emerald-700',
      idle: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-white',
    },
  },
  Pastries: {
    title: 'Pastry Unit Guide',
    unitOptions: ['pcs'],
    defaultUnit: 'pcs',
    rules: [
      'Use pcs for individual pastries or batches counted one by one.',
      'If pastries arrive by tray or box, record the total usable pieces.',
    ],
    presets: [
      { label: 'Pastry pieces', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-rose-100 bg-rose-50/80',
      title: 'text-rose-700',
      text: 'text-rose-900',
      subtext: 'text-rose-700',
      active: 'border-rose-300 bg-white text-rose-700',
      idle: 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-white',
    },
  },
  Equipment: {
    title: 'Equipment Unit Guide',
    unitOptions: ['pcs'],
    defaultUnit: 'pcs',
    rules: [
      'Use pcs for machines, pitchers, tampers, and other tools counted individually.',
      'Track each equipment item as countable stock instead of weight or volume.',
    ],
    presets: [
      { label: 'Equipment units', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-stone-200 bg-stone-50/80',
      title: 'text-stone-700',
      text: 'text-stone-900',
      subtext: 'text-stone-700',
      active: 'border-stone-300 bg-white text-stone-700',
      idle: 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-white',
    },
  },
  'Add-ins': {
    title: 'Add-ins Unit Guide',
    unitOptions: ['grams', 'ml', 'pcs'],
    defaultUnit: 'grams',
    rules: [
      'Use grams for toppings or ingredients measured by weight.',
      'Use mL for liquid add-ins, or pcs if they are individually packed.',
    ],
    presets: [
      { label: 'Dry add-ins', unit: 'grams' },
      { label: 'Liquid add-ins', unit: 'ml' },
      { label: 'Packed add-ins', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-pink-100 bg-pink-50/80',
      title: 'text-pink-700',
      text: 'text-pink-900',
      subtext: 'text-pink-700',
      active: 'border-pink-300 bg-white text-pink-700',
      idle: 'border-pink-200 bg-pink-50 text-pink-800 hover:bg-white',
    },
  },
  Powder: {
    title: 'Powder Unit Guide',
    unitOptions: ['grams', 'pcs'],
    defaultUnit: 'grams',
    rules: [
      'Use grams for powder scooped from bulk packs or containers.',
      'Use pcs if each sachet or pouch is tracked individually.',
    ],
    presets: [
      { label: 'Bulk powder', unit: 'grams' },
      { label: 'Powder sachets', unit: 'pcs' },
    ],
    tone: {
      panel: 'border-teal-100 bg-teal-50/80',
      title: 'text-teal-700',
      text: 'text-teal-900',
      subtext: 'text-teal-700',
      active: 'border-teal-300 bg-white text-teal-700',
      idle: 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-white',
    },
  },
  Other: {
    title: 'Unit Guide',
    unitOptions: DEFAULT_UNIT_OPTIONS,
    defaultUnit: 'pcs',
    rules: [
      'Use liters or mL for pourable items, grams for weighed items, and pcs for countable stock.',
      'Choose one clear base unit per item so reordering and adjustments stay consistent.',
    ],
    presets: [
      { label: 'Countable item', unit: 'pcs' },
      { label: 'Weighed item', unit: 'grams' },
      { label: 'Liquid item', unit: 'liters' },
    ],
    tone: {
      panel: 'border-stone-200 bg-stone-50/80',
      title: 'text-stone-700',
      text: 'text-stone-900',
      subtext: 'text-stone-700',
      active: 'border-stone-300 bg-white text-stone-700',
      idle: 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-white',
    },
  },
};

export default function ItemDrawer({
  isOpen,
  isEditMode,
  item,
  setItem,
  formError,
  onClose,
  onSubmit,
  inputCls,
  btnBrown,
}) {
  const categoryGuide = CATEGORY_UNIT_GUIDES[item.category] || CATEGORY_UNIT_GUIDES.Other;
  const unitOptions = categoryGuide.unitOptions || DEFAULT_UNIT_OPTIONS;
  const supportsFractionalUnit = String(item.unit || '').toLowerCase() !== 'pcs';
  const title = isEditMode ? 'Update Stock' : 'Add New Stock';
  const subtitle = isEditMode
    ? 'Modify the details for this inventory stock. Manual stock or expiration edits will reset the saved batch history for this item.'
    : 'Fill in the details for the new inventory Stock.';
  const submitText = isEditMode ? 'Update Stock' : 'Save Stock';
  const fields = isEditMode
    ? [
        { label: 'Stock Name', field: 'itemName', type: 'text', placeholder: 'e.g. Arabica Beans' },
        { label: 'Current Batch Cost', field: 'totalBatchCost', type: 'number', placeholder: 'e.g. 500' },
        { label: 'Minimum Stock', field: 'minimumStock', type: 'number', placeholder: 'e.g. 50' },
      ]
    : [
        { label: 'Stock Name', field: 'itemName', type: 'text', placeholder: 'e.g. Arabica Beans' },
        { label: 'Stock Level', field: 'initialStock', type: 'number', placeholder: 'e.g. 120' },
        { label: 'Total Batch Cost', field: 'totalBatchCost', type: 'number', placeholder: 'e.g. 500' },
        { label: 'Minimum Stock', field: 'minimumStock', type: 'number', placeholder: 'e.g. 50' },
        ...(item.category !== 'Equipment' ? [{ label: 'Expiration Date', field: 'expirationDate', type: 'date', placeholder: '' }] : []),
      ];

  return (
    <>
      <button
        aria-label="Close"
        onClick={onClose}
        className={`fixed inset-0 bg-[#1C100A]/20 backdrop-blur-[2px] z-40 border-none p-0 cursor-default w-full transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed inset-0 sm:inset-auto sm:top-0 sm:right-0 sm:h-screen sm:w-full sm:max-w-105 bg-white sm:border-l border-[#EAE5E0] shadow-2xl z-50 flex flex-col transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-x-0 sm:translate-x-0'
            : 'opacity-0 translate-x-full sm:translate-x-full pointer-events-none'
        }`}
      >
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-[#F0EDE8] bg-[#FDFCFB]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-[#1C100A]" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
                <p className="text-xs text-[#9E8A7A] mt-1">{subtitle}</p>
              </div>
              <button type="button" onClick={onClose} className="bg-[#F0EBE5] border-none rounded-xl p-2 cursor-pointer flex text-[#6B5744] hover:bg-[#E6DDD6] transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 flex flex-col gap-4 sm:gap-5">
            {fields.map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-[11px] font-bold text-[#7A6355] uppercase tracking-widest mb-2">{label}</label>
                <input
                  type={type}
                  min={type === 'number' ? 0 : undefined}
                  step={field === 'totalBatchCost' ? '0.01' : supportsFractionalUnit ? '0.001' : '1'}
                  maxLength={field === 'itemName' ? 100 : undefined}
                  pattern={field === 'itemName' ? '.{1,}' : undefined}
                  value={item[field]}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (field === 'itemName') {
                      console.log('[DEBUG] ItemDrawer onChange - itemName input:', value);
                    }

                    if (type === 'number') {
                      // Allow only numbers and decimal point
                      value = value.replace(/[^0-9.]/g, '');

                      // For cost fields (totalBatchCost, batchQuantity), allow up to 2 decimals
                      if (field === 'totalBatchCost' || field === 'batchQuantity') {
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts[1];
                        } else if (parts[1] && parts[1].length > 2) {
                          value = parts[0] + '.' + parts[1].slice(0, 2);
                        }
                      } else if (supportsFractionalUnit) {
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts[1];
                        } else if (parts[1] && parts[1].length > 3) {
                          value = parts[0] + '.' + parts[1].slice(0, 3);
                        }
                      } else {
                        // For piece-based stock quantities, only integers
                        value = value.replace(/\./g, '');
                      }
                    }

                    setItem((p) => ({ ...p, [field]: value }));
                  }}
                  className={inputCls}
                  placeholder={placeholder}
                  required={field !== 'expirationDate'}
                />
                {type === 'number' && !['totalBatchCost', 'batchQuantity'].includes(field) && (
                  <p className="mt-1 text-[10px] text-[#9E8A7A]">
                    {supportsFractionalUnit
                      ? 'Decimal values are allowed for this unit.'
                      : 'Whole numbers only for pieces.'}
                  </p>
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#7A6355] uppercase tracking-widest mb-2">Category</label>
                <Dropdown
                  value={item.category}
                  onChange={(val) =>
                    setItem((p) => {
                      const nextCategory = val;
                      const nextGuide = CATEGORY_UNIT_GUIDES[nextCategory] || CATEGORY_UNIT_GUIDES.Other;
                      const nextUnit =
                        nextGuide.unitOptions.includes(p.unit)
                          ? p.unit
                          : nextGuide.defaultUnit;

                      return { ...p, category: nextCategory, unit: nextUnit };
                    })
                  }
                  options={['Beans', 'Milk', 'Syrup', 'Cups', 'Pastries', 'Equipment', 'Add-ins', 'Powder', 'Other']}
                  placeholder="Select category"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#7A6355] uppercase tracking-widest mb-2">Unit</label>
                <Dropdown
                  value={item.unit}
                  onChange={(val) => setItem((p) => ({ ...p, unit: val }))}
                  options={unitOptions}
                  placeholder="Select unit"
                />
              </div>
            </div>

            {categoryGuide && (
              <div className={`rounded-2xl border px-4 py-4 ${categoryGuide.tone.panel}`}>
                <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${categoryGuide.tone.title}`}>{categoryGuide.title}</p>
                <div className={`mt-2 space-y-1 text-xs leading-5 ${categoryGuide.tone.text}`}>
                  {categoryGuide.rules.map((rule) => (
                    <p key={rule}>{rule}</p>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryGuide.presets.map((preset) => {
                    const isActive = item.unit === preset.unit;

                    return (
                      <button
                        key={preset.unit}
                        type="button"
                        onClick={() => setItem((p) => ({ ...p, unit: preset.unit }))}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                          isActive
                            ? categoryGuide.tone.active
                            : categoryGuide.tone.idle
                        }`}
                      >
                        {preset.label}: {preset.unit}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

          </div>

          <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-[#F0EDE8] flex gap-3 bg-[#FDFCFB]">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white text-[#6B5744] font-semibold text-sm border border-[#E2DDD8] hover:bg-[#FAF6F2] transition">
              Cancel
            </button>
            <button type="submit" className={`flex-1 py-2.5 rounded-xl text-sm ${btnBrown}`}>
              {submitText}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
