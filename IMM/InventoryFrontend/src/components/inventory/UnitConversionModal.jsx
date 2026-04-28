import { X } from 'lucide-react';
import UnitConversionPanel from './UnitConversionPanel';

export default function UnitConversionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C100A]/35 backdrop-blur-[3px] p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] sm:max-h-[92vh] overflow-y-auto rounded-t-[30px] sm:rounded-[30px] border border-[#E8DED5] bg-[#FFFDFB] shadow-[0_24px_80px_rgba(44,24,16,0.18)] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#E8E1D9] bg-gradient-to-r from-[#FCF8F4] to-white px-4 py-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#A89080]">
              Inventory Tools
            </p>
            <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-[#1C100A]">Unit Conversion Settings</h2>
            <p className="text-xs sm:text-sm text-[#7A6355] mt-0.5 hidden sm:block">
              Manage your conversion rules with the same visual style used across inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-[#E2DDD8] bg-white p-2.5 text-[#9E8A7A] transition-colors hover:bg-[#F7F4F0] hover:text-[#3D261D]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#FBF8F5] p-3 sm:p-6">
          <UnitConversionPanel />
        </div>
      </div>
    </div>
  );
}
