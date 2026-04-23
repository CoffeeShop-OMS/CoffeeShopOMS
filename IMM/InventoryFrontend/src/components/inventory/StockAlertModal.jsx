import { useEffect, useState } from 'react';
import { AlertTriangle, Clock3, X, TrendingDown, Volume2, VolumeX, PackageOpen } from 'lucide-react';

export default function StockAlertModal({
  open = false,
  lowStockItems = [],
  outOfStockItems = [],
  expiredItems = [],
  onDismiss,
  onGoToInventory,
}) {
  const [visible, setVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('out');

  function playAlertSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const beep = (freq, startTime) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    };

    beep(880, audioContext.currentTime);
    beep(1047, audioContext.currentTime + 0.3);
  }

  useEffect(() => {
    if (!open) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
      setActiveTab(expiredItems.length > 0 ? 'expired' : outOfStockItems.length > 0 ? 'out' : 'low');
      if (soundEnabled) playAlertSound();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [expiredItems.length, open, outOfStockItems.length, soundEnabled]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (typeof onDismiss === 'function') onDismiss();
    }, 180);
  };

  if (!open && !visible) return null;

  const totalItems = new Set([
    ...lowStockItems.map((item) => item.id),
    ...outOfStockItems.map((item) => item.id),
    ...expiredItems.map((item) => item.id),
  ]).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg mx-4 sm:mx-0 transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 rounded-lg p-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Stock alert</h3>
                <p className="text-xs text-amber-700">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} need attention
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-5 gap-1">
            <TabButton
              active={activeTab === 'expired'}
              onClick={() => setActiveTab('expired')}
              color="rose"
              label="Expired"
              count={expiredItems.length}
            />
            <TabButton
              active={activeTab === 'out'}
              onClick={() => setActiveTab('out')}
              color="red"
              label="Out of stock"
              count={outOfStockItems.length}
            />
            <TabButton
              active={activeTab === 'low'}
              onClick={() => setActiveTab('low')}
              color="amber"
              label="Low stock"
              count={lowStockItems.length}
            />
          </div>

          {/* Panel */}
          <div className="p-5 max-h-72 overflow-y-auto">
            {activeTab === 'expired' && (
              <div className="space-y-2">
                {expiredItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No expired items.</p>
                ) : (
                  expiredItems.map((item) => (
                    <ExpiredRow key={item.id} item={item} />
                  ))
                )}
              </div>
            )}
            {activeTab === 'out' && (
              <div className="space-y-2">
                {outOfStockItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No out-of-stock items.</p>
                ) : (
                  outOfStockItems.map((item) => (
                    <OutOfStockRow key={item.id} item={item} />
                  ))
                )}
              </div>
            )}
            {activeTab === 'low' && (
              <div className="space-y-2">
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No low-stock items.</p>
                ) : (
                  lowStockItems.map((item) => (
                    <LowStockRow key={item.id} item={item} />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                soundEnabled
                  ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                  : 'text-gray-400 bg-gray-100 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {soundEnabled ? 'Sound on' : 'Sound off'}
            </button>
            <button
              onClick={() => {
                handleClose();
                if (typeof onGoToInventory === 'function') onGoToInventory();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3D261D] text-white rounded-lg text-xs font-semibold hover:bg-[#2A1A14] transition-colors"
            >
              <PackageOpen className="w-3.5 h-3.5" />
              Go to inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, color, label, count }) {
  const activeStyles = {
    rose: 'border-rose-500 text-rose-600',
    red: 'border-red-500 text-red-600',
    amber: 'border-amber-500 text-amber-600',
  };
  const dotStyles = {
    rose: 'bg-rose-500',
    red: 'bg-red-500',
    amber: 'bg-amber-400',
  };
  const badgeStyles = {
    rose: 'bg-rose-100 text-rose-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
        active
          ? activeStyles[color]
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${dotStyles[color]}`} />
      {label}
      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeStyles[color]}`}>
        {count}
      </span>
    </button>
  );
}

function ExpiredRow({ item }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
      <Clock3 className="w-4 h-4 text-rose-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-rose-900 truncate">{item.name}</p>
        <p className="text-xs text-rose-500">{item.sku || 'N/A'}</p>
        <p className="text-[11px] text-rose-600 mt-1">
          {item.nonExpiredQuantity > 0
            ? `${item.nonExpiredQuantity} ${item.unit} still usable in newer batches`
            : 'No usable stock left in non-expired batches'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-rose-700">{item.expiredQuantity || item.quantity} {item.unit} expired</p>
        <p className="text-xs text-rose-500">{item.quantity} {item.unit} total on hand</p>
        <p className="text-xs text-rose-500">Expired {item.expirationDate || 'today'}</p>
      </div>
    </div>
  );
}

function OutOfStockRow({ item }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-900 truncate">{item.name}</p>
        <p className="text-xs text-red-500">{item.sku || 'N/A'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-red-600">0 {item.unit}</p>
        <p className="text-xs text-red-400">Reorder at {item.threshold}</p>
      </div>
    </div>
  );
}

function LowStockRow({ item }) {
  const pct = Math.min(100, Math.round((item.quantity / item.threshold) * 100));
  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <TrendingDown className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-900 truncate mb-1">{item.name}</p>
        <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-amber-700">{item.quantity} {item.unit}</p>
        <p className="text-xs text-amber-500">of {item.threshold}</p>
      </div>
    </div>
  );
}
