import type { FirebaseOptions } from "firebase/app";

export type SharedBackendMode = "dev" | "firebase";
export type SharedBackendReason = "firebase_config_missing" | null;

export interface SharedBackendState {
  firebaseConfig: FirebaseOptions | null;
  firebaseMissingKeys: readonly string[];
  firebaseReady: boolean;
  firebaseRequested: boolean;
  mode: SharedBackendMode;
  reason: SharedBackendReason;
}

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

export function getFirebaseMissingKeys(): readonly string[] {
  return REQUIRED_FIREBASE_KEYS.filter((key) => readEnvValue(key).length === 0);
}

export function getFirebaseConfig(): FirebaseOptions | null {
  const missingKeys = getFirebaseMissingKeys();

  if (missingKeys.length > 0) {
    return null;
  }

  const [apiKey, authDomain, projectId, appId, databaseURL] =
    REQUIRED_FIREBASE_KEYS.map(readEnvValue);


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

export function getSharedBackendState(): SharedBackendState {
  const configuredMode = readEnvValue("VITE_SHARED_BACKEND");
  const firebaseRequested = configuredMode === "firebase";
  const firebaseConfig = getFirebaseConfig();
  const firebaseMissingKeys = getFirebaseMissingKeys();
  const firebaseReady = firebaseConfig !== null;

  if (firebaseRequested && firebaseReady) {
    return {
      firebaseConfig,
      firebaseMissingKeys,
      firebaseReady,
      firebaseRequested,
      mode: "firebase",
      reason: null
    };
  }

  return {
    firebaseConfig,
    firebaseMissingKeys,
    firebaseReady,
    firebaseRequested,
    mode: "dev",
    reason:
      firebaseRequested && !firebaseReady ? "firebase_config_missing" : null
  };
}

export function getSharedBackendMode(): SharedBackendMode {
  return getSharedBackendState().mode;
}

export function shouldUseFirebaseEmulators(): boolean {
  return readEnvValue("VITE_FIREBASE_USE_EMULATORS").toLowerCase() === "true";
}
