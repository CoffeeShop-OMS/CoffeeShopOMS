require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { initializeWebSocket } = require("./services/realtime");

const app = express();

// ─── WebSocket Setup ──────────────────────────────────────────────────────────

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet()); // Sets secure HTTP headers

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Configurable Rate Limiting (Dev-Friendly) ────────────────────────────────
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 500;
const RATE_LIMIT_WINDOW_MIN = parseInt(process.env.RATE_LIMIT_WINDOW_MIN) || 15;
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MIN * 60 * 1000;

// Global limiter - configurable, skipped in development
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,  // Don't count 2xx responses (health/polling)
  message: { 
    success: false, 
    message: `Too many requests (${RATE_LIMIT_MAX} max per ${RATE_LIMIT_WINDOW_MIN}min). Try again later.` 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter - stricter but dev-friendly
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_MAX / 5),  // ~100 for default 500
  skipSuccessfulRequests: true,
  message: { 
    success: false, 
    message: `Too many auth attempts. Wait ${RATE_LIMIT_WINDOW_MIN}min.` 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === 'development') {
  console.log(`🌿 Rate limiting SKIPPED (dev mode: NODE_ENV=${process.env.NODE_ENV})`);
  console.log(`   Global would be: ${RATE_LIMIT_MAX} req/${RATE_LIMIT_WINDOW_MIN}min`);
  console.log(`   Auth would be: ${Math.floor(RATE_LIMIT_MAX / 5)} req/${RATE_LIMIT_WINDOW_MIN}min`);
} else {
  console.log(`🔒 Rate limiting ACTIVE: ${RATE_LIMIT_MAX} req/${RATE_LIMIT_WINDOW_MIN}min global`);
  app.use(limiter);
}

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ success: true, message: "IMM Service is running", timestamp: new Date().toISOString() });
});

app.use("/api/auth", process.env.NODE_ENV === 'development' ? authRoutes : [authLimiter, authRoutes]);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.APP_PORT || process.env.PORT || 4000;
if (require.main === module) {
  const http = require("http");
  const server = http.createServer(app);
  
  // Initialize WebSocket
  initializeWebSocket(server);

  server.listen(PORT, () => {
    console.log(`IMM Backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);  
    console.log(`WebSocket server ready for real-time updates`);
  });
}

module.exports = app;
module.exports.initializeWebSocket = initializeWebSocket;

