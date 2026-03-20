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
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  });
  if (directEnvAccount) return directEnvAccount;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  try {
    return normalizeServiceAccount(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  } catch {
    return null;
  }
};

if (!admin.apps.length) {
  const isFirebaseRuntime = Boolean(process.env.FIREBASE_CONFIG);
  const serviceAccountPath = path.join(__dirname, "..", "service-account.json");
  const envAccount = serviceAccountFromEnv();
  const projectId =
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
          "or set FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY in .env."
      );
    }
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
