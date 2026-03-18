import { useMemo, useState } from "react";
import { normalizeInviteCode } from "../lib/utils/inviteCode";
import type { UserProfile } from "../lib/types";

interface PairingScreenProps {
  profile: UserProfile;
  busy: boolean;
  error: string | null;
  onCreateInvite: () => Promise<void>;
  onRedeemInvite: (code: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function PairingScreen({
  profile,
  busy,
  error,
  onCreateInvite,
  onRedeemInvite,
  onSignOut
}: PairingScreenProps) {
  const [joinCode, setJoinCode] = useState("");
  const normalizedCode = useMemo(() => normalizeInviteCode(joinCode), [joinCode]);

  return (
    <section className="shell">
      <div className="pairing-layout">
        <div className="info-card">
          <span className="eyebrow">Step 1</span>
          <h2>Pair your room with your partner</h2>
          <p className="card-copy">
            Every couple gets one shared room. Create an invite code for your partner, or
            enter one they already made.
          </p>
          <div className="profile-badge">
            <span className="profile-avatar">{profile.displayName.slice(0, 1)}</span>
            <div>
              <strong>{profile.displayName}</strong>
              <p>Ready to claim a shared space</p>
            </div>
          </div>
          <button className="ghost-button" onClick={() => void onSignOut()}>
            Sign out
          </button>
        </div>

        <div className="pairing-card">
          <div className="pairing-section">
            <span className="eyebrow">Create Invite</span>
            <h3>Start your room</h3>
            <p>
              Generate a code and send it to your partner. Once they join, both of you
              will enter the same room.
            </p>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void onCreateInvite()}
            >
              {busy ? "Working..." : profile.activeInviteCode ? "Refresh Invite" : "Create Invite"}
            </button>
            {profile.activeInviteCode ? (
              <div className="invite-code-box">
                <span>Invite code</span>
                <strong>{profile.activeInviteCode}</strong>
              </div>
            ) : null}
          </div>

          <div className="pairing-section">
            <span className="eyebrow">Join Invite</span>
            <h3>Enter your partner&apos;s code</h3>
            <label className="field-label" htmlFor="join-code">
              Invitation code
            </label>
            <input
              id="join-code"
              className="text-input"
              value={normalizedCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="ABC-123"
              maxLength={7}
            />
            <button
              className="secondary-button"
              disabled={busy || normalizedCode.length < 7}
              onClick={() => void onRedeemInvite(normalizedCode)}
            >
              {busy ? "Joining..." : "Join Room"}
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
