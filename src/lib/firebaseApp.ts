import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig } from "./sharedBackendConfig";

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  const config = getFirebaseConfig();

  if (!config) {
    throw new Error("Firebase backend is not configured.");
  }

  return initializeApp(config);
}
