interface AuthGateProps {
  loading: boolean;
  mode: "firebase" | "mock";
  onSignIn: () => Promise<void>;
}

export function AuthGate({ loading, mode, onSignIn }: AuthGateProps) {
  const isDemo = mode === "mock";

  return (
    <section className="shell shell--centered">
      <div className="hero-card">
        <span className="eyebrow">Cozy Couple Room</span>
        <h1>A little shared room for two.</h1>
        <p className="hero-copy">
          Pair with your partner, step into your first room together, and start making
          it yours.
        </p>

        <button className="primary-button" disabled={loading} onClick={() => void onSignIn()}>
          {loading ? "Opening..." : isDemo ? "Enter Demo Mode" : "Continue with Google"}
        </button>

        <p className="helper-text">
          {isDemo
            ? "Firebase env vars are missing, so this build is using browser-only demo data."
            : "Google Auth is enabled through Firebase."}
        </p>
      </div>
    </section>
  );
}
