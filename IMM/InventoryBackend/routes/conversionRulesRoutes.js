const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getConversionRules,
  saveConversionRules,
  clearConversionRules,
} = require("../controllers/conversionRulesController");

// All conversion rules routes require authentication
router.use(verifyToken);

// Get user's conversion rules
router.get("/", getConversionRules);

// Save conversion rules
router.post("/", saveConversionRules);

// Clear all conversion rules
router.delete("/", clearConversionRules);

module.exports = router;
