const crypto = require("crypto");

const DEFAULT_TTL_MINUTES = 60 * 8; // 8 hours

const toBase64Url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (input) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const getSecret = () => process.env.ADMIN_SESSION_SECRET || "change-me-admin-session-secret";

const getTtlMinutes = () => {
  const parsed = Number.parseInt(process.env.ADMIN_SESSION_TTL_MINUTES || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_TTL_MINUTES;
  return parsed;
};

const signPart = (value) =>
  toBase64Url(crypto.createHmac("sha256", getSecret()).update(value).digest("base64"));

const createAdminSessionToken = ({ email, role = "admin" }) => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(
    JSON.stringify({
      email,
      role,
      iat: now,
      exp: now + getTtlMinutes() * 60,
    })
  );

  const unsignedToken = `${header}.${payload}`;
  const signature = signPart(unsignedToken);
  return `${unsignedToken}.${signature}`;
};

const verifyAdminSessionToken = (token) => {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = signPart(unsignedToken);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const decodedPayload = JSON.parse(fromBase64Url(payload));
    const now = Math.floor(Date.now() / 1000);
    if (!decodedPayload.exp || decodedPayload.exp <= now) return null;
    if (!decodedPayload.email || !decodedPayload.role) return null;
    return decodedPayload;
  } catch {
    return null;
  }
};

module.exports = {
  createAdminSessionToken,
  verifyAdminSessionToken,
};

