const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const normalizePrivateKey = (value = "") => value.replace(/\\n/g, "\n");

const normalizeServiceAccount = (serviceAccount = {}) => {
  const projectId = serviceAccount.projectId || serviceAccount.project_id;
  const clientEmail = serviceAccount.clientEmail || serviceAccount.client_email;
  const privateKeyRaw = serviceAccount.privateKey || serviceAccount.private_key;
  const privateKey = privateKeyRaw ? normalizePrivateKey(privateKeyRaw) : null;

  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
};

const serviceAccountFromEnv = () => {
  const directEnvAccount = normalizeServiceAccount({
    projectId: process.env.ADMINSDK_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.ADMINSDK_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.ADMINSDK_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY,
  });
  if (directEnvAccount) return directEnvAccount;

  const rawJson =
    process.env.ADMINSDK_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) return null;
  try {
    return normalizeServiceAccount(JSON.parse(rawJson));
  } catch {
    return null;
  }
};

if (!admin.apps.length) {
  const isFirebaseRuntime = Boolean(process.env.FIREBASE_CONFIG);
  const serviceAccountPath = path.join(__dirname, "..", "service-account.json");
  const envAccount = serviceAccountFromEnv();
  const projectId =
    process.env.ADMINSDK_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    null;

  if (envAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(envAccount),
      projectId: envAccount.projectId,
    });
  } else if (!isFirebaseRuntime && fs.existsSync(serviceAccountPath)) {
    const serviceAccountFile = require(serviceAccountPath);
    const normalized = normalizeServiceAccount(serviceAccountFile);

    if (!normalized) {
      throw new Error(
        "Invalid service-account.json. Missing one of: project_id, client_email, private_key."
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(normalized),
      projectId: normalized.projectId,
    });
  } else {
    admin.initializeApp(projectId ? { projectId } : undefined);

    if (!isFirebaseRuntime) {
      console.warn(
        "[firebase] No local Firebase Admin key found. For local dev, add service-account.json " +
          "or set ADMINSDK_PROJECT_ID/ADMINSDK_CLIENT_EMAIL/ADMINSDK_PRIVATE_KEY in .env."
      );
    }
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
