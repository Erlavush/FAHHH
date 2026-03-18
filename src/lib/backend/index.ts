import { isFirebaseConfigured } from "../../firebase";
import { createFirebaseBackend } from "./firebaseBackend";
import { createMockBackend } from "./mockBackend";

export const backend = isFirebaseConfigured ? createFirebaseBackend() : createMockBackend();
