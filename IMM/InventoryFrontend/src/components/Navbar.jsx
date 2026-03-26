import { Search, Bell, Menu, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ collapsed, setMobileOpen }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'alert':
        return 'bg-red-50 border-red-100';
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <header className="h-16 bg-[#FBFBFA] border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 transition-all duration-300">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open menu"
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen && setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full md:w-96">
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              
              {/* Notification Dropdown */}
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl border border-gray-100 shadow-2xl z-40 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-[#FDFCFB] flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                          notif.type === 'alert'
                            ? 'border-red-300'
                            : notif.type === 'success'
                            ? 'border-emerald-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-[#FDFCFB]">
                  <button className="text-sm text-[#3D261D] font-semibold hover:underline w-full text-center">
                    View All Notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-gray-800">Admin User</p>
            <p className="text-xs text-gray-500">Store Manager</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-300 border border-gray-400 overflow-hidden" title="Admin User" aria-label="Admin User">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=3D261D&color=fff" alt="Admin User avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}