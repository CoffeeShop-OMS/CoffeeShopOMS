import { AlertTriangle, ChevronRight, Clock3 } from 'lucide-react';

export default function InventoryAlertBanner({ lowCount = 0, outCount = 0, expiredCount = 0, onReview }) {
  if (lowCount === 0 && outCount === 0 && expiredCount === 0) return null;

  const hasExpiredItems = expiredCount > 0;
  const summaryParts = [
    expiredCount > 0 ? `${expiredCount} expired item${expiredCount !== 1 ? 's' : ''}` : null,
    lowCount > 0 ? `${lowCount} running low` : null,
    outCount > 0 ? `${outCount} out of stock` : null,
  ].filter(Boolean);

  const theme = hasExpiredItems
    ? {
        wrapper: 'bg-rose-50 border-rose-200',
        iconWrap: 'bg-rose-100',
        iconColor: 'text-rose-600',
        text: 'text-rose-800',
        action: 'text-rose-700 hover:text-rose-900',
      }
    : {
        wrapper: 'bg-amber-50 border-amber-200',
        iconWrap: 'bg-amber-100',
        iconColor: 'text-amber-600',
        text: 'text-amber-800',
        action: 'text-[#8B5E3C] hover:text-[#3D261D]',
      };

  const BannerIcon = hasExpiredItems ? Clock3 : AlertTriangle;

  return (
    <div className={`flex items-start sm:items-center gap-3 rounded-2xl border px-4 sm:px-5 py-3.5 mb-5 sm:mb-6 shadow-sm ${theme.wrapper}`}>
      <div className={`rounded-lg p-1.5 shrink-0 mt-0.5 sm:mt-0 ${theme.iconWrap}`}>
        <BannerIcon className={`w-4 h-4 ${theme.iconColor}`} />
      </div>
      <p className={`flex-1 text-xs sm:text-sm ${theme.text}`}>
        <span className="font-semibold">Attention needed - </span>
        {summaryParts.join(' | ')}
      </p>
      {typeof onReview === 'function' ? (
        <button
          type="button"
          onClick={onReview}
          className={`flex items-center gap-1 text-xs font-semibold transition-colors shrink-0 ${theme.action}`}
        >
          {hasExpiredItems ? 'Review expired' : 'Review alerts'} <ChevronRight className="w-3 h-3" />
        </button>
      ) : null}
    </div>
  );
}
