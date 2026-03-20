import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, item, onCancel, onConfirm }) {
  if (!isOpen || !item) return null;

  return (
    <>
      <button
        aria-label="Close"
        onClick={onCancel}
        className="fixed inset-0 bg-[#1C100A]/40 backdrop-blur-[2px] z-40 border-none p-0 cursor-default w-full"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-[#EAE5E0]">
          <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 rounded-full p-3 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[#1C100A]" style={{ fontFamily: "'Playfair Display', serif" }}>Delete Item?</h3>
            </div>
            <p className="text-sm text-[#6B5744] mb-4">
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-[#F0EDE8] flex gap-3 bg-[#FDFCFB]">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white text-[#6B5744] font-semibold text-sm border border-[#E2DDD8] hover:bg-[#FAF6F2] transition">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition">
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
