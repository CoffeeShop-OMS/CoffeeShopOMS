const {
  getActiveNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || 20, 10), 100);
    const notifications = await getActiveNotifications({ limit, sync: true });
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      unreadCount,
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

const readNotification = async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user?.uid || null);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("readNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

const readAllNotifications = async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.user?.uid || null);

    res.json({
      success: true,
      message: "Notifications marked as read",
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    console.error("readAllNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};

module.exports = {
  getNotifications,
  readAllNotifications,
  readNotification,
};
