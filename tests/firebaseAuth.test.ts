import { afterEach, describe, expect, it, vi } from "vitest";

const {
  googleAuthProviderMock,
  onAuthStateChangedMock,
  signInWithPopupMock,
  signOutMock
} = vi.hoisted(() => ({
  googleAuthProviderMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signOutMock: vi.fn()
}));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: googleAuthProviderMock,
  getAuth: vi.fn(() => ({ tag: "auth" })),
  onAuthStateChanged: onAuthStateChangedMock,
  signInWithPopup: signInWithPopupMock,
  signOut: signOutMock
}));

describe("firebase auth helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("recognizes firebase mode only when config is complete", async () => {
    vi.stubEnv("VITE_SHARED_BACKEND", "firebase");
    vi.stubEnv("VITE_FIREBASE_API_KEY", "api-key");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "cozy.example");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "cozy-project");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "app-id");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "https://cozy.example");

    const backendConfig = await import("../src/lib/sharedBackendConfig");

    expect(backendConfig.getSharedBackendMode()).toBe("firebase");
    expect(backendConfig.getFirebaseConfig()).toMatchObject({
      apiKey: "api-key",
      authDomain: "cozy.example",
      projectId: "cozy-project",
      appId: "app-id",
      databaseURL: "https://cozy.example"
    });

    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "");
    expect(backendConfig.getSharedBackendMode()).toBe("dev");
    expect(backendConfig.getFirebaseConfig()).toBeNull();
  });

  it("maps Firebase uid to the shared player profile id", async () => {
    const { toSharedPlayerProfile } = await import("../src/lib/firebaseAuth");

    const profile = toSharedPlayerProfile(
      {
        uid: "firebase-user-1",
        displayName: "Ari",
        email: "ari@example.com",
        metadata: {
          creationTime: "2026-03-27T00:00:00.000Z",
          lastSignInTime: "2026-03-27T01:00:00.000Z"
        }
      } as never,
      "Fallback"
    );

    expect(profile).toEqual({
      playerId: "firebase-user-1",
      displayName: "Ari",
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T01:00:00.000Z"
    });
  });

  it("uses the Google provider path for auth sign-in, sign-out, and subscription", async () => {
    const unsubscribe = vi.fn();
    onAuthStateChangedMock.mockReturnValue(unsubscribe);
    googleAuthProviderMock.mockImplementation(() => ({ providerId: "google" }));
    vi.stubEnv("VITE_SHARED_BACKEND", "firebase");
    vi.stubEnv("VITE_FIREBASE_API_KEY", "api-key");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "cozy.example");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "cozy-project");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "app-id");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "https://cozy.example");

    const {
      signInWithGoogle,
      signOutSharedAuth,
      subscribeToSharedAuth
    } = await import("../src/lib/firebaseAuth");

    const callback = vi.fn();
    const returnedUnsubscribe = subscribeToSharedAuth(callback);

    expect(onAuthStateChangedMock).toHaveBeenCalledTimes(1);
    expect(typeof onAuthStateChangedMock.mock.calls[0]?.[1]).toBe("function");
    expect(returnedUnsubscribe).toBe(unsubscribe);

    await signInWithGoogle();

    expect(googleAuthProviderMock).toHaveBeenCalledTimes(1);
    expect(signInWithPopupMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ providerId: "google" })
    );

    await signOutSharedAuth();

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
