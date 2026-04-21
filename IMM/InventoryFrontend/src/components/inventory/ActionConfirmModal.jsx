import { AlertTriangle } from 'lucide-react';

const toneStyles = {
  primary: {
    iconBg: 'bg-[#EDE4DC]',
    iconColor: 'text-[#3D261D]',
    confirmButton: 'bg-[#3D261D] hover:bg-[#2E1C15] text-white',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-700',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

export default function ActionConfirmModal({
  isOpen,
  title = 'Confirm action',
  message = '',
  details = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  icon: Icon = AlertTriangle,
  isBusy = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  const styles = toneStyles[tone] || toneStyles.primary;

  return (
    <>
      <button
        aria-label="Close"
        disabled={isBusy}
        onClick={isBusy ? undefined : onCancel}
        className="fixed inset-0 bg-[#1C100A]/40 backdrop-blur-[2px] z-[60] border-none p-0 cursor-default w-full disabled:opacity-100"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#EAE5E0] overflow-hidden">
          <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`${styles.iconBg} rounded-full p-3 shrink-0`}>
                <Icon className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-[#1C100A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {title}
              </h3>
            </div>

            <p className="text-sm text-[#6B5744] leading-relaxed">{message}</p>

            {details.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {details.map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[#F0EDE8] bg-[#FBFAF8] px-3.5 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A89080] mb-1">{label}</p>
                    <p className="text-sm font-semibold text-[#3D261D] break-words">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-[#F0EDE8] flex flex-col sm:flex-row gap-3 bg-[#FDFCFB]">
            <button
              onClick={onCancel}
              disabled={isBusy}
              className="flex-1 py-2.5 rounded-xl bg-white text-[#6B5744] font-semibold text-sm border border-[#E2DDD8] hover:bg-[#FAF6F2] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isBusy}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${styles.confirmButton}`}
            >
              {isBusy ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
