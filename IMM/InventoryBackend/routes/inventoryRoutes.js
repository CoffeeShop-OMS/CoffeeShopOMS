const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  createItemValidator,
  updateItemValidator,
  adjustStockValidator,
  idParamValidator,
} = require("../middleware/validators");
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  restoreItem,
  adjustStock,
  getLowStockItems,
  getItemLogs,
  getAllLogs,
} = require("../controllers/inventoryController");

// All inventory routes require authentication
router.use(verifyToken);

// Reports (must be above /:id routes to avoid conflicts)
router.get("/reports/low-stock", getLowStockItems);
router.get("/logs", requireRole(["admin", "manager"]), getAllLogs);

// CRUD
router.get("/", getAllItems);
router.post("/", requireRole(["admin", "manager"]), createItemValidator, createItem);
router.get("/:id", idParamValidator, getItemById);
router.patch("/:id", requireRole(["admin", "manager"]), updateItemValidator, updateItem);
router.patch("/:id/restore", requireRole("admin"), idParamValidator, restoreItem);
router.delete("/:id", requireRole("admin"), idParamValidator, deleteItem);

// Stock operations
router.post("/:id/adjust", requireRole(["admin", "manager", "staff"]), adjustStockValidator, adjustStock);

// Audit logs (admin + manager)
router.get("/:id/logs", requireRole(["admin", "manager"]), idParamValidator, getItemLogs);

module.exports = router;
