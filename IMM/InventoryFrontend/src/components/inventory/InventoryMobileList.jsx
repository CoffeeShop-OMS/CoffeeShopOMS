import { Archive, ArrowDown, ArrowUp, Edit2, RotateCcw } from 'lucide-react';

const categoryColors = {
  Beans: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
  Milk: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400', border: 'border-sky-200' },
  Syrup: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400', border: 'border-violet-200' },
  Cups: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200' },
  Pastries: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400', border: 'border-rose-200' },
  Equipment: { bg: 'bg-stone-50', text: 'text-stone-600', dot: 'bg-stone-400', border: 'border-stone-200' },
  Other: { bg: 'bg-stone-50', text: 'text-stone-600', dot: 'bg-stone-400', border: 'border-stone-200' },
};

export default function InventoryMobileList({
  isLoading,
  items,
  onUpdate,
  onDelete,
  onRestore,
  onQuickAdjust,
}) {
  if (!Array.isArray(items)) return null;

  return (
    <div className="md:hidden divide-y divide-[#F5F2EE]">
      {isLoading ? (
        <p className="text-center text-[#A89080] py-12 text-sm">Loading inventory...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-[#A89080] py-12 text-sm">No items found.</p>
      ) : (
        items.map((item) => {
          const cc = categoryColors[item.cat] || categoryColors.Other;
          return (
            <div
              key={item.id}
              className={`px-4 py-4 ${item.isArchived ? 'bg-slate-50/80' : item.hasExpiredStock ? 'bg-rose-50/60' : item.isOut ? 'bg-red-50/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1C100A] truncate">{item.name}</p>
                  <p className="text-[11px] text-[#C4B8B0] font-mono mt-0.5 truncate">{item.sku}</p>
                  {item.hasExpiredStock && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 truncate">
                      {item.expiredQuantity} {item.unit} expired
                      {item.expirationDate ? ` - since ${item.expirationDate}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide
                    ${item.isArchived ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : item.isOut ? 'bg-red-50 text-red-600 border border-red-200'
                      : item.isLow ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {item.status}
                  </span>
                  {item.hasExpiredStock && !item.isArchived && (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
                      Expired batch
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cc.bg} ${cc.text} ${cc.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
                  {item.cat}
                </span>
                <span className={`text-sm font-bold ${item.isArchived ? 'text-slate-500' : item.hasExpiredStock ? 'text-rose-700' : item.isOut ? 'text-red-500' : item.isLow ? 'text-amber-600' : 'text-[#1C100A]'}`}>
                  {item.stock}
                </span>
                {!item.isArchived && typeof onQuickAdjust === 'function' && (
                  <div className="flex items-center gap-1 rounded-lg border border-[#E9E1DA] bg-[#FCFAF8] p-1">
                    <button
                      type="button"
                      onClick={() => onQuickAdjust(item, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
                      aria-label={`Add stock to ${item.name}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAdjust(item, -1)}
                      disabled={item.quantity <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove stock from ${item.name}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#FAF8F5] rounded-xl px-3 py-2">
                  <p className="text-[9px] text-[#A89080] uppercase tracking-wider font-bold mb-0.5">Date Added</p>
                  <p className="text-xs font-semibold text-[#7A6355]">{item.dateAdded}</p>
                </div>
                <div className="bg-[#FAF8F5] rounded-xl px-3 py-2">
                  <p className="text-[9px] text-[#A89080] uppercase tracking-wider font-bold mb-0.5">Last Activity</p>
                  <p className="text-xs font-semibold text-[#7A6355]">{item.lastActivity}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-[#FAF8F5] rounded-xl px-3 py-2">
                  <p className="text-[9px] text-[#A89080] uppercase tracking-wider font-bold mb-0.5">Reorder</p>
                  <p className="text-xs font-semibold text-[#7A6355]">{item.reorder}</p>
                </div>
                <div className="bg-[#FAF8F5] rounded-xl px-3 py-2">
                  <p className="text-[9px] text-[#A89080] uppercase tracking-wider font-bold mb-0.5">Curr. Value</p>
                  <p className="text-xs font-semibold text-emerald-600">₱{item.currentValue.toFixed(2)}</p>
                </div>
                <div className="bg-[#FAF8F5] rounded-xl px-3 py-2">
                  <p className="text-[9px] text-[#A89080] uppercase tracking-wider font-bold mb-0.5">Max Value</p>
                  <p className="text-xs font-semibold text-[#3D261D]">₱{item.maxValue.toFixed(2)}</p>
                </div>
              </div>

              {item.isArchived ? (
                <div className="text-center">
                  {typeof onRestore === 'function' ? (
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition-all hover:bg-sky-100"
                      aria-label={`Restore ${item.name}`}
                      title="Restore item"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore item
                    </button>
                  ) : (
                    <span className="inline-block py-1.5 px-6 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg">Archived</span>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => onUpdate(item)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:bg-emerald-100"
                    aria-label={`Update ${item.name}`}
                    title="Update item"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition-all hover:bg-amber-100"
                    aria-label={`Archive ${item.name}`}
                    title="Archive item"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
