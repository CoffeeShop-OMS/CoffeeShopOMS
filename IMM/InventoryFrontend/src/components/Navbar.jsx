import { AlertCircle, Bell, CheckCircle, Clock, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar({
  setMobileOpen,
  notifications = [],
  unreadCount = 0,
  onNotificationsViewed,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleNotifications = () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (nextOpen) {
      onNotificationsViewed?.();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <header className="h-16 bg-[#FBFBFA] border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 transition-all duration-300">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open menu"
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen?.(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full md:w-96" />
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />

              <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-100 shadow-2xl z-40 overflow-hidden animate-fadeIn">
                <div className="px-5 py-4 border-b border-gray-100 bg-[#FDFCFB] flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Live inventory and stock alerts
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-5 py-4 transition-colors border-l-4 ${
                          notification.type === "alert"
                            ? "border-red-300 bg-red-50/50"
                            : notification.type === "success"
                              ? "border-emerald-300 bg-emerald-50/50"
                              : "border-gray-300 bg-gray-50/60"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Real-time inventory alerts will appear here.
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 bg-[#FDFCFB]">
                  <p className="text-xs text-gray-500 text-center">
                    Showing {notifications.length} active inventory alert{notifications.length === 1 ? "" : "s"}
                  </p>
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
          <div
            className="w-10 h-10 rounded-full bg-gray-300 border border-gray-400 overflow-hidden"
            title="Admin User"
            aria-label="Admin User"
          >
            <img
              src="https://ui-avatars.com/api/?name=Admin+User&background=3D261D&color=fff"
              alt="Admin User avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
