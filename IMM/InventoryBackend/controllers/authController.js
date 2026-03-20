const { auth, db } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const { createAdminSessionToken, verifyAdminSessionToken } = require("../utils/adminSession");

/**
 * POST /api/auth/admin/login
 * Simple admin credential check for frontend login page.
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL || "coffeeandtea@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "coffeeandtea123";

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Contact your manager if you need access.",
      });
    }

    const token = createAdminSessionToken({
      email: adminEmail,
      role: "admin",
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        email: adminEmail,
        role: "admin",
        token,
      },
    });
  } catch (error) {
    console.error("AdminLogin error:", error);
    res.status(500).json({ success: false, message: "Failed to login" });
  }
};

/**
 * GET /api/auth/admin/verify
 * Verifies admin session token issued by this backend.
 */
const verifyAdminSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const payload = verifyAdminSessionToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired session",
      });
    }

    return res.json({
      success: true,
      message: "Session is valid",
      data: {
        email: payload.email,
        role: payload.role,
        exp: payload.exp,
      },
    });
  } catch (error) {
    console.error("VerifyAdminSession error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify session" });
  }
};

/**
 * POST /api/auth/register
 * Creates a Firebase Auth user + Firestore user document.
 * Only admins can create manager/admin accounts.
 */
const register = async (req, res) => {
  try {
    const { email, password, name, role = "staff" } = req.body;

    // Only admins can assign elevated roles
    if ((role === "admin" || role === "manager") && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create manager or admin accounts",
      });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Store user profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      role,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: req.user?.uid || "system",
    });

    // Set custom claims for role-based access in Firebase Rules
    await auth.setCustomUserClaims(userRecord.uid, { role });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        uid: userRecord.uid,
        email,
        name,
        role,
      },
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({
        success: false,
        message: "Email is already in use",
      });
    }
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Failed to register user" });
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        status: req.user.status,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/**
 * PATCH /api/auth/me
 * Updates current user's name or password.
 */
const updateMe = async (req, res) => {
  try {
    const { name, password } = req.body;
    const updates = {};
    const firestoreUpdates = { updatedAt: FieldValue.serverTimestamp() };

    if (name) {
      updates.displayName = name;
      firestoreUpdates.name = name;
    }

    if (password) {
      if (password.length < 8) {
        return res.status(422).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
      updates.password = password;
    }

    if (Object.keys(updates).length > 0) {
      await auth.updateUser(req.user.uid, updates);
    }

    await db.collection("users").doc(req.user.uid).update(firestoreUpdates);

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("UpdateMe error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/**
 * POST /api/auth/deactivate/:uid  [Admin only]
 * Soft-deletes a user by setting status to inactive and disabling Auth.
 */
const deactivateUser = async (req, res) => {
  try {
    const { uid } = req.params;

    if (uid === req.user.uid) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    await auth.updateUser(uid, { disabled: true });
    await db.collection("users").doc(uid).update({
      status: "inactive",
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.error("DeactivateUser error:", error);
    res.status(500).json({ success: false, message: "Failed to deactivate user" });
  }
};

/**
 * GET /api/auth/users  [Admin only]
 * Lists all users (paginated).
 */
const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    let query = db.collection("users").orderBy("createdAt", "desc");

    if (role) query = query.where("role", "==", role);

    const snapshot = await query.limit(limitNum).get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt,
      };
    });

    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    console.error("ListUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

module.exports = { adminLogin, verifyAdminSession, register, getMe, updateMe, deactivateUser, listUsers };
