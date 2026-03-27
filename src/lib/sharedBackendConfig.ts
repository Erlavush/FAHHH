import type { FirebaseOptions } from "firebase/app";

export type SharedBackendMode = "dev" | "firebase";

const REQUIRED_FIREBASE_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_DATABASE_URL"
] as const;

function readEnvValue(key: string): string {
  const rawValue = import.meta.env[key];
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

export function getFirebaseConfig(): FirebaseOptions | null {
  const [apiKey, authDomain, projectId, appId, databaseURL] =
    REQUIRED_FIREBASE_KEYS.map(readEnvValue);

  if (!apiKey || !authDomain || !projectId || !appId || !databaseURL) {
    return null;
  }

  const storageBucket = readEnvValue("VITE_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = readEnvValue("VITE_FIREBASE_MESSAGING_SENDER_ID");

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    databaseURL,
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {})
  };
}

export function getSharedBackendMode(): SharedBackendMode {
  const configuredMode = readEnvValue("VITE_SHARED_BACKEND");

  if (configuredMode === "firebase" && getFirebaseConfig()) {
    return "firebase";
  }

  return "dev";
}

export function shouldUseFirebaseEmulators(): boolean {
  return readEnvValue("VITE_FIREBASE_USE_EMULATORS").toLowerCase() === "true";
}
