import { X, Calculator } from 'lucide-react';
import ConversionCalculator from './ConversionCalculator';

export default function ConversionCalculatorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E8E1D9] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3D261D]/10 rounded-lg">
              <Calculator className="w-5 h-5 text-[#3D261D]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C100A]">Unit Conversion Calculator</h2>
              <p className="text-xs text-[#9E8A7A] mt-0.5">Convert between different units easily</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F7F4F0] rounded-lg transition-colors text-[#9E8A7A] hover:text-[#3D261D]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <ConversionCalculator />
        </div>

        {/* Footer */}
        <div className="border-t border-[#E8E1D9] px-6 py-4 bg-[#FAF6F2]">
          <p className="text-xs text-[#9E8A7A]">
            💡 <strong>Tip:</strong> Use this calculator to quickly convert between units. The results can help you with inventory management and recipe planning.
          </p>
        </div>
      </div>
    </div>
  );
}
