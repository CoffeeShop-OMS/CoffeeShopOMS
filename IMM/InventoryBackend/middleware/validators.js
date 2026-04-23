const { body, param, query, validationResult } = require("express-validator");

const INVENTORY_CATEGORIES = [
  "beans",
  "milk",
  "syrup",
  "packaging",
  "equipment",
  "add-ins",
  "powder",
  "other",
];

const CATEGORY_ALIASES = {
  beans: "beans",
  bean: "beans",
  milk: "milk",
  syrup: "syrup",
  packaging: "packaging",
  cups: "packaging",
  cup: "packaging",
  equipment: "equipment",
  "add-ins": "add-ins",
  "add ins": "add-ins",
  addins: "add-ins",
  powder: "powder",
  pastries: "other",
  pastry: "other",
  other: "other",
};

const normalizeCategory = (value) => {
  if (value === undefined || value === null) return value;
  const normalized = String(value).trim().toLowerCase();
  return CATEGORY_ALIASES[normalized] || normalized;
};

// Reusable handler to return validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const registerValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 60 })
    .withMessage("Name too long"),
  body("role")
    .optional()
    .isIn(["admin", "manager", "staff"])
    .withMessage("Role must be admin, manager, or staff"),
  validate,
];

// ─── Inventory Item Validators ────────────────────────────────────────────────

const createItemValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Item name is required")
    .isLength({ max: 100 })
    .withMessage("Item name too long"),
  body("sku")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^[a-zA-Z]+-[0-9]{3}$/)
    .withMessage("SKU format must be like Blue-001"),
  body("category")
    .customSanitizer(normalizeCategory)
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn(INVENTORY_CATEGORIES)
    .withMessage("Invalid category"),
  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),
  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required (e.g. kg, pcs, liters)"),
  body("lowStockThreshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Low stock threshold must be a non-negative integer"),
  body("costPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a non-negative number"),
  body("supplier")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Supplier must be 100 characters or fewer"),
  body("expirationDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Expiration date must be a valid date"),
  validate,
];

const updateItemValidator = [
  param("id").notEmpty().withMessage("Item ID is required"),
  body("name").optional().trim().isLength({ max: 100 }),
  body("category")
    .optional()
    .customSanitizer(normalizeCategory)
    .isIn(INVENTORY_CATEGORIES)
    .withMessage("Invalid category"),
  body("quantity").optional().isInt({ min: 0 }),
  body("unit").optional().trim().notEmpty(),
  body("lowStockThreshold").optional().isInt({ min: 0 }),
  body("costPrice").optional().isFloat({ min: 0 }),
  body("supplier")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Supplier must be 100 characters or fewer"),
  body("expirationDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Expiration date must be a valid date"),
  validate,
];

const adjustStockValidator = [
  param("id").notEmpty().withMessage("Item ID is required"),
  body("adjustment")
    .isInt()
    .withMessage("Adjustment must be an integer (positive to add, negative to deduct)"),
  body("expirationDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Expiration date must be a valid date"),
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason for adjustment is required")
    .isLength({ max: 200 }),
  validate,
];

const idParamValidator = [
  param("id").notEmpty().withMessage("ID parameter is required"),
  validate,
];

module.exports = {
  loginValidator,
  registerValidator,
  createItemValidator,
  updateItemValidator,
  adjustStockValidator,
  idParamValidator,
};
