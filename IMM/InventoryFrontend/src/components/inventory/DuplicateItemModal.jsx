import { CopyCheck } from 'lucide-react';

export default function DuplicateItemModal({ isOpen, item, onAddItem, onUseExisting, onCancel }) {
  if (!isOpen || !item) return null;

  return (
    <>
      <button
        aria-label="Close"
        onClick={onCancel}
        className="fixed inset-0 bg-[#1C100A]/40 backdrop-blur-[2px] z-40 border-none p-0 cursor-default w-full"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#EAE5E0]">
          <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-100 rounded-full p-3 shrink-0">
                <CopyCheck className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-[#1C100A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Existing Item Found
              </h3>
            </div>
            <p className="text-sm text-[#6B5744]">
              <strong>{item.name}</strong> already exists (SKU: <span className="font-mono">{item.sku}</span>).
              Do you want to add this as a new item or use the existing item?
            </p>
          </div>
          <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-[#F0EDE8] flex flex-col sm:flex-row gap-3 bg-[#FDFCFB]">
            <button
              onClick={onAddItem}
              className="flex-1 py-2.5 rounded-xl bg-white text-[#6B5744] font-semibold text-sm border border-[#E2DDD8] hover:bg-[#FAF6F2] transition"
            >
              Add this Item
            </button>
            <button
              onClick={onUseExisting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#3D261D] hover:bg-[#2E1C15] transition"
            >
              Use the existing item
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
