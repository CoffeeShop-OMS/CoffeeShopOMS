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
}) {
  if (!Array.isArray(items)) return null;

  return (
    <div className="md:hidden divide-y divide-[#F5F2EE]">
      {isLoading ? (
        <p className="text-center text-[#A89080] py-12 text-sm">Loading inventory…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-[#A89080] py-12 text-sm">No items found.</p>
      ) : (
        items.map((item) => {
          const cc = categoryColors[item.cat] || categoryColors.Other;
          return (
            <div
              key={item.id}
              className={`px-4 py-4 ${item.isOut ? 'bg-red-50/50' : ''}`}
            >
              {/* Row 1: name + status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1C100A] truncate">{item.name}</p>
                  <p className="text-[11px] text-[#C4B8B0] font-mono mt-0.5 truncate">{item.id}</p>
                </div>
                <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide
                  ${item.isOut ? 'bg-red-50 text-red-600 border border-red-200'
                    : item.isLow ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {item.status}
                </span>
              </div>

              {/* Row 2: category + stock */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cc.bg} ${cc.text} ${cc.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
                  {item.cat}
                </span>
                <span className={`text-sm font-bold ${item.isOut ? 'text-red-500' : item.isLow ? 'text-amber-600' : 'text-[#1C100A]'}`}>
                  {item.stock}
                </span>
                <span className="text-[11px] text-[#C4B8B0]">Updated {item.date}</span>
              </div>

              {/* Row 3: value grid */}
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

              {/* Row 4: actions */}
              <div className="flex gap-2 justify-center">
                <button onClick={() => onUpdate(item)} className="py-1.5 px-6 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">Update</button>
                <button onClick={() => onDelete(item)} className="py-1.5 px-6 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all">Delete</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
