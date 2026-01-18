import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let firebaseInstance = null;

function readMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || "";
}

function resolveFirebaseConfig() {
  if (window.AURORA_FIREBASE_CONFIG) {
    return window.AURORA_FIREBASE_CONFIG;
  }

  const apiKey = readMeta("firebase-api-key");
  const authDomain = readMeta("firebase-auth-domain");
  const projectId = readMeta("firebase-project-id");
  const storageBucket = readMeta("firebase-storage-bucket");
  const messagingSenderId = readMeta("firebase-messaging-sender-id");
  const appId = readMeta("firebase-app-id");

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function initFirebase() {
  if (firebaseInstance) return firebaseInstance;
  const config = resolveFirebaseConfig();
  if (!config) return null;
  const app = initializeApp(config);
  firebaseInstance = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return firebaseInstance;
}
