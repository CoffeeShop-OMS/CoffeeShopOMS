const { db } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

const COLLECTION = "conversionRules";

const toClientErrorMessage = (error, fallbackMessage) => {
  const raw = String(error?.message || "").toLowerCase();
  const isCredentialsIssue =
    raw.includes("unable to detect a project id") ||
    raw.includes("could not load the default credentials") ||
    raw.includes("invalid grant");

  if (isCredentialsIssue) {
    return "Firestore credentials are not configured in backend. Check InventoryBackend/.env Firebase Admin settings.";
  }

  return fallbackMessage;
};

// Get user's conversion rules
exports.getConversionRules = async (req, res) => {
  try {
    const userId = req.user.uid;

    const querySnapshot = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const rules = [];
    querySnapshot.forEach((doc) => {
      rules.push({
        ...doc.data(),
        id: doc.id,
      });
    });

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error("Error fetching conversion rules:", error);
    const message = toClientErrorMessage(error, "Failed to fetch conversion rules.");
    res.status(500).json({ success: false, message });
  }
};

// Save conversion rules
exports.saveConversionRules = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        message: "Rules must be an array.",
      });
    }

    // Validate each rule
    for (const rule of rules) {
      if (!rule.fromUnit || !rule.toUnit || !rule.ratio) {
        return res.status(400).json({
          success: false,
          message: "Each rule must have fromUnit, toUnit, and ratio.",
        });
      }

      if (typeof rule.ratio !== "number" || rule.ratio <= 0) {
        return res.status(400).json({
          success: false,
          message: "Ratio must be a positive number.",
        });
      }
    }

    // Delete old rules for this user
    const oldRulesSnapshot = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();
    oldRulesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new rules
    for (const rule of rules) {
      const ruleRef = db.collection(COLLECTION).doc();
      batch.set(ruleRef, {
        userId,
        fromUnit: rule.fromUnit,
        toUnit: rule.toUnit,
        ratio: rule.ratio,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    res.json({
      success: true,
      message: "Conversion rules saved successfully.",
      data: rules,
    });
  } catch (error) {
    console.error("Error saving conversion rules:", error);
    const message = toClientErrorMessage(error, "Failed to save conversion rules.");
    res.status(500).json({ success: false, message });
  }
};

// Clear all conversion rules for a user
exports.clearConversionRules = async (req, res) => {
  try {
    const userId = req.user.uid;

    const rulesSnapshot = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();
    rulesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: "Conversion rules cleared successfully.",
    });
  } catch (error) {
    console.error("Error clearing conversion rules:", error);
    const message = toClientErrorMessage(error, "Failed to clear conversion rules.");
    res.status(500).json({ success: false, message });
  }
};
