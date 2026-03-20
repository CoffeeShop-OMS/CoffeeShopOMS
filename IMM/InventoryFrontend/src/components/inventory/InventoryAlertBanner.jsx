import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function InventoryAlertBanner({ lowCount, outCount }) {
  if (lowCount === 0 && outCount === 0) return null;

  return (
    <div className="flex items-start sm:items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 sm:px-5 py-3.5 mb-5 sm:mb-6 shadow-sm">
      <div className="bg-amber-100 rounded-lg p-1.5 shrink-0 mt-0.5 sm:mt-0">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      </div>
      <p className="flex-1 text-xs sm:text-sm text-amber-800">
        <span className="font-semibold">Attention needed — </span>
        {lowCount} items running low · {outCount} out of stock
      </p>
      <button className="flex items-center gap-1 text-xs font-semibold text-[#8B5E3C] hover:text-[#3D261D] transition-colors shrink-0">
        Review <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
