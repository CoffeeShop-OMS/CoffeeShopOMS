import { Archive, ArrowDown, ArrowUp, Edit2, RotateCcw } from 'lucide-react';

const categoryColors = {
  Beans: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
  Milk: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400', border: 'border-sky-200' },
  Syrup: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400', border: 'border-violet-200' },
  Cups: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200' },
  Pastries: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400', border: 'border-rose-200' },
  Equipment: { bg: 'bg-stone-50', text: 'text-stone-600', dot: 'bg-stone-400', border: 'border-stone-200' },
  'Add-ins': { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-400', border: 'border-pink-200' },
  Powder: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400', border: 'border-teal-200' },
  Other: { bg: 'bg-stone-50', text: 'text-stone-600', dot: 'bg-stone-400', border: 'border-stone-200' },
};

export default function InventoryTable({
  isLoading,
  items,
  onUpdate,
  onDelete,
  onRestore,
  onQuickAdjust,
  selectedItems = new Set(),
  onSelectedChange = () => {},
}) {
  if (!Array.isArray(items)) return null;
  const selectableItems = items.filter((item) => !item.isArchived);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedItems);
      selectableItems.forEach((item) => newSelected.add(item.id));
      onSelectedChange(newSelected);
    } else {
      onSelectedChange(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectedChange(newSelected);
  };

  const allSelected = selectableItems.length > 0 && selectableItems.every((item) => selectedItems.has(item.id));

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#F0EDE8] bg-[#FDFCFB]">
            <th className="w-12 text-center px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="accent-[#3D261D] rounded" />
            </th>
            {['Item', 'SKU', 'Category', 'Stock', 'Reorder Level', 'Current Value', 'Maximum Value', 'Date Added', 'Last Activity', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#A89080] uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={12} className="text-center text-[#A89080] py-12 text-sm">
                Loading inventory...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={12} className="text-center text-[#A89080] py-12 text-sm">
                No items found.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const cc = categoryColors[item.cat] || categoryColors.Other;
              const isSelected = selectedItems.has(item.id);
              return (
                <tr
                  key={item.id}
                  className={`border-b border-[#F5F2EE] last:border-0 transition-colors duration-100
                    ${isSelected ? 'bg-[#3D261D]/5' : item.isArchived ? 'bg-slate-50/80 hover:bg-slate-50' : item.hasExpiredStock ? 'bg-rose-50/60 hover:bg-rose-50' : item.isOut ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-[#FAF8F5]'}`}
                >
                  <td className="text-center px-4 py-3.5">
                    <input type="checkbox" checked={isSelected} disabled={item.isArchived} onChange={() => handleSelectItem(item.id)} className="accent-[#3D261D] disabled:opacity-40" />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-[#1C100A]">{item.name}</p>
                    {item.hasExpiredStock && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600">
                        {item.expiredQuantity} {item.unit} expired
                        {item.expirationDate ? ` - since ${item.expirationDate}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-mono text-[#7A6355]">{item.sku}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cc.bg} ${cc.text} ${cc.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
                      {item.cat}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className={`text-sm font-bold ${item.isArchived ? 'text-slate-500' : item.hasExpiredStock ? 'text-rose-700' : item.isOut ? 'text-red-500' : item.isLow ? 'text-amber-600' : 'text-[#1C100A]'}`}>
                      {item.stock}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#7A6355] whitespace-nowrap">{item.reorder}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-emerald-600">₱{item.currentValue.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-[#3D261D]">₱{item.maxValue.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#7A6355] whitespace-nowrap">{item.dateAdded}</td>
                  <td className="px-4 py-3.5 text-sm text-[#7A6355] whitespace-nowrap">{item.lastActivity}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap
                        ${item.isArchived ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : item.isOut ? 'bg-red-50 text-red-600 border border-red-200'
                          : item.isLow ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {item.status}
                      </span>
                      {item.hasExpiredStock && !item.isArchived && (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200">
                          Expired batch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {item.isArchived ? (
                      typeof onRestore === 'function' ? (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => onRestore(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 transition-all duration-150 hover:bg-sky-100"
                            aria-label={`Restore ${item.name}`}
                            title="Restore item"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                        </div>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200">Archived</span>
                      )
                    ) : (
                      <div className="flex gap-1.5 justify-center">
                        {typeof onQuickAdjust === 'function' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onQuickAdjust(item, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all duration-150 hover:bg-emerald-100"
                              aria-label={`Add stock to ${item.name}`}
                              title="Add stock"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickAdjust(item, -1)}
                              disabled={item.quantity <= 0}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition-all duration-150 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Remove stock from ${item.name}`}
                              title="Remove stock"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onUpdate(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all duration-150 hover:bg-emerald-100"
                          aria-label={`Update ${item.name}`}
                          title="Update item"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition-all duration-150 hover:bg-amber-100"
                          aria-label={`Archive ${item.name}`}
                          title="Archive item"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
