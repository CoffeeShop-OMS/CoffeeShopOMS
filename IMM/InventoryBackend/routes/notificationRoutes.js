const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { idParamValidator } = require("../middleware/validators");
const {
  getNotifications,
  readAllNotifications,
  readNotification,
} = require("../controllers/notificationController");

router.use(verifyToken);

router.get("/", getNotifications);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", idParamValidator, readNotification);

module.exports = router;
