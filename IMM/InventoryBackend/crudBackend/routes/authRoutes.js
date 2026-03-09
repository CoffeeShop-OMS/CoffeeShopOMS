const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { registerValidator } = require("../middleware/validators");
const {
  register,
  getMe,
  updateMe,
  deactivateUser,
  listUsers,
} = require("../controllers/authController");

// Public: no auth needed (Firebase login is handled client-side)
// POST /api/auth/register — Admin creates new users
router.post("/register", verifyToken, requireRole("admin"), registerValidator, register);

// Authenticated routes
router.get("/me", verifyToken, getMe);
router.patch("/me", verifyToken, updateMe);

// Admin-only routes
router.get("/users", verifyToken, requireRole("admin"), listUsers);
router.post("/deactivate/:uid", verifyToken, requireRole("admin"), deactivateUser);

module.exports = router;
