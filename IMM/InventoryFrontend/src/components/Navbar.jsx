import { AlertCircle, Bell, CheckCircle, Clock, Menu, X } from "lucide-react";
import { useState } from "react";
import { getAuthSession } from "../utils/authStorage";

const containsAdminLabel = (value) => /admin|administrator/i.test(String(value || ""));

const toTitleCase = (value) =>
  String(value || "").replace(/\b\w/g, (character) => character.toUpperCase());

const getManagerDisplayName = (session) => {
  const directName = [
    session?.name,
    session?.fullName,
    session?.displayName,
    session?.userName,
  ]
    .map((value) => String(value || "").trim())
    .find((value) => value && !containsAdminLabel(value));

  if (directName) return directName;

  const localPart = String(session?.email || "")
    .trim()
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();

  if (localPart && !containsAdminLabel(localPart)) {
    return toTitleCase(localPart);
  }

  return "Manager";
};

export default function Navbar({
  setMobileOpen,
  notifications = [],
  unreadCount = 0,
  onNotificationsViewed,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const session = getAuthSession();
  const profileName = getManagerDisplayName(session);
  const profileRole = "Store Manager";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=3D261D&color=fff`;

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
    <header className="h-16 bg-[#FBFBFA] border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 transition-all duration-300">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen?.(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block relative w-96" />
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Notifications"
            aria-expanded={showNotifications}
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
              <div
                className="fixed inset-0 z-30 bg-black/10"
                onClick={() => setShowNotifications(false)}
              />

              <div className="fixed inset-x-4 top-20 bottom-4 z-40 flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-fadeIn sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:mt-2 sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[32rem]">
                <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-[#FDFCFB] flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Live inventory and stock alerts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-gray-100">
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
                            <p className="text-xs text-gray-600 mt-0.5 break-words">
                              {notification.message}
                            </p>
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

                <div className="shrink-0 px-5 py-3 border-t border-gray-100 bg-[#FDFCFB]">
                  <p className="text-xs text-gray-500 text-center">
                    Showing {notifications.length} active inventory alert{notifications.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 pl-3 sm:pl-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-gray-800">{profileName}</p>
            <p className="text-xs text-gray-500">{profileRole}</p>
          </div>
          <div
            className="w-10 h-10 rounded-full bg-gray-300 border border-gray-400 overflow-hidden"
            title={profileName}
            aria-label={`${profileName} avatar`}
          >
            <img
              src={avatarUrl}
              alt={`${profileName} avatar`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
