import { BarChart3, LoaderCircle, TableProperties, X } from 'lucide-react';

export default function PdfExportModal({
  open = false,
  isGenerating = false,
  onClose,
  onSelect,
}) {
  if (!open) return null;

  const handleClose = () => {
    if (isGenerating) return;
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close PDF export modal"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E7DED6] shadow-[0_24px_80px_rgba(28,16,10,0.18)] p-6 sm:p-7">
        <button
          type="button"
          onClick={handleClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 h-9 w-9 rounded-full border border-[#E7DED6] text-[#7F6B5F] hover:bg-[#F7F1EC] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="w-4 h-4 mx-auto" />
        </button>

        <div className="pr-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A08D87] mb-2">
            PDF Export
          </p>
          <h3 className="text-xl font-bold text-[#1C100A]" style={{ fontFamily: 'serif' }}>
            Choose report layout
          </h3>
          <p className="text-sm text-[#7F6B5F] mt-2 leading-relaxed">
            The PDF will be black and white only, with business header details and page numbers.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSelect?.('charts-and-tables')}
            className="group rounded-2xl border border-[#DDD2C8] bg-[#FCFAF8] p-4 text-left hover:border-[#3D261D] hover:bg-[#F7F1EC] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D261D] text-white">
                {isGenerating ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C100A]">Graphs + Tables</p>
                <p className="text-xs text-[#7F6B5F] mt-1">
                  Includes black-and-white charts plus all report tables.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSelect?.('tables-only')}
            className="group rounded-2xl border border-[#DDD2C8] bg-white p-4 text-left hover:border-[#3D261D] hover:bg-[#F9F6F2] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDE4DC] text-[#3D261D]">
                {isGenerating ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <TableProperties className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C100A]">Tables Only</p>
                <p className="text-xs text-[#7F6B5F] mt-1">
                  Exports only the report tables, without any charts.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl border border-[#DDD2C8] text-sm font-medium text-[#4B3429] hover:bg-[#F8F3EF] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
