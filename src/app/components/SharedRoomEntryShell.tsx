import { useMemo, useState } from "react";
import type { SharedPairLinkPresenceSnapshot } from "../../lib/sharedPresenceTypes";
import type { SharedPendingPairLink } from "../../lib/sharedRoomTypes";

type SharedRoomLegacyEntryShellProps = {
  mode: "legacy";
  displayName: string;
  errorMessage: string | null;
  onCreateRoom: () => void;
  onDisplayNameChange: (value: string) => void;
  onJoinRoom: (code: string) => void;
};

type SharedRoomHostedUnavailableEntryShellProps = {
  mode: "hosted_unavailable";
  detail: string;
  errorMessage: string | null;
};

type SharedRoomHostedEntryShellProps = {
  mode: "hosted";
  bootstrapKind: "signed_out" | "needs_linking" | "pending_link";
  displayName: string;
  errorMessage: string | null;
  pairLinkPresence: SharedPairLinkPresenceSnapshot | null;
  pendingLink: SharedPendingPairLink | null;
  playerId: string | null;
  selfPairCode: string | null;
  onCancelPairLink: () => void;
  onConfirmPairLink: () => void;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  onSubmitPartnerCode: (code: string) => void;
};

type SharedRoomEntryShellProps =
  | SharedRoomLegacyEntryShellProps
  | SharedRoomHostedUnavailableEntryShellProps
  | SharedRoomHostedEntryShellProps;

type PendingParticipantState = {
  confirmed: boolean;
  displayName: string;
  isPresent: boolean;
  isSelf: boolean;
  playerId: string;
};

function buildPendingParticipantStates(
  pendingLink: SharedPendingPairLink,
  playerId: string | null,
  pairLinkPresence: SharedPairLinkPresenceSnapshot | null
): PendingParticipantState[] {
  const presentPlayerIds = new Set(
    pairLinkPresence?.presences.map((presence) => presence.playerId) ?? []
  );

  return pendingLink.playerIds.map((entryPlayerId) => ({
    confirmed: pendingLink.confirmationsByPlayerId[entryPlayerId] === true,
    displayName:
      pendingLink.playerDisplayNamesById?.[entryPlayerId] ?? entryPlayerId,
    isPresent: presentPlayerIds.has(entryPlayerId),
    isSelf: entryPlayerId === playerId,
    playerId: entryPlayerId
  }));
}

function SharedRoomLegacyEntryShell({
  displayName,
  errorMessage,
  onCreateRoom,
  onDisplayNameChange,
  onJoinRoom
}: SharedRoomLegacyEntryShellProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [stakesAcknowledged, setStakesAcknowledged] = useState(false);
  const normalizedJoinCode = useMemo(() => joinCode.trim().toUpperCase(), [joinCode]);

  return (
    <div className="shared-room-entry">
        <div className="shared-room-entry__shell">
        <p className="shared-room-entry__eyebrow">Local Shared Room</p>
        <h1 className="shared-room-entry__title">Use the local dev room flow</h1>
        <p className="shared-room-entry__copy">
          This browser is using the local fallback path, not Google sign-in. Create a
          room or enter an invite code to pair inside the local dev runtime.
        </p>

        <div className="shared-room-entry__stakes">
          <strong>Shared rooms can be reset if the relationship ends.</strong>
          <p>
            This clears shared progression, room decor, memories, and your shared pet.
          </p>
        </div>

        <div className="shared-room-entry__tabs" role="tablist" aria-label="Shared room mode">
          <button
            className={`shared-room-entry__tab${mode === "create" ? " shared-room-entry__tab--active" : ""}`}
            onClick={() => setMode("create")}
            type="button"
          >
            Create Shared Room
          </button>
          <button
            className={`shared-room-entry__tab${mode === "join" ? " shared-room-entry__tab--active" : ""}`}
            onClick={() => setMode("join")}
            type="button"
          >
            Join with Code
          </button>
        </div>

        <label className="shared-room-entry__field">
          <span>Your name</span>
          <input
            className="shared-room-entry__input"
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Display name"
            type="text"
            value={displayName}
          />
        </label>

        {mode === "join" ? (
          <label className="shared-room-entry__field">
            <span>Invite code</span>
            <input
              className="shared-room-entry__input shared-room-entry__input--code"
              maxLength={6}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              type="text"
              value={joinCode}
            />
          </label>
        ) : null}

        {errorMessage ? (
          <p className="shared-room-entry__error">{errorMessage}</p>
        ) : null}

        <label className="shared-room-entry__acknowledgment">
          <input
            checked={stakesAcknowledged}
            onChange={(event) => setStakesAcknowledged(event.target.checked)}
            type="checkbox"
          />
          <span>I understand the shared room can be reset later</span>
        </label>

        <div className="shared-room-entry__actions">
          {mode === "create" ? (
            <button
              className="shared-room-entry__button"
              disabled={!stakesAcknowledged}
              onClick={onCreateRoom}
              type="button"
            >
              Create Shared Room
            </button>
          ) : (
            <button
              className="shared-room-entry__button"
              disabled={!stakesAcknowledged || normalizedJoinCode.length < 6}
              onClick={() => onJoinRoom(normalizedJoinCode)}
              type="button"
            >
              Join with Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SharedRoomHostedUnavailableEntryShell({
  detail,
  errorMessage
}: SharedRoomHostedUnavailableEntryShellProps) {
  return (
    <div className="shared-room-entry">
      <div className="shared-room-entry__shell">
        <p className="shared-room-entry__eyebrow">Hosted Couple Room</p>
        <h1 className="shared-room-entry__title">Finish hosted setup before sign-in</h1>
        <p className="shared-room-entry__copy">
          This run asked for the hosted Google flow, but the Firebase room backend is
          not fully configured yet.
        </p>
        <div className="shared-room-entry__note-card">
          <strong>Hosted sign-in is blocked until setup is complete.</strong>
          <p>{detail}</p>
        </div>
        {errorMessage ? (
          <p className="shared-room-entry__error">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}

function SharedRoomHostedEntryShell({
  bootstrapKind,
  displayName,
  errorMessage,
  pairLinkPresence,
  pendingLink,
  playerId,
  selfPairCode,
  onCancelPairLink,
  onConfirmPairLink,
  onSignInWithGoogle,
  onSignOut,
  onSubmitPartnerCode
}: SharedRoomHostedEntryShellProps) {
  const [partnerCode, setPartnerCode] = useState("");
  const normalizedPartnerCode = useMemo(
    () => partnerCode.trim().toUpperCase(),
    [partnerCode]
  );
  const participantStates = useMemo(
    () =>
      pendingLink
        ? buildPendingParticipantStates(pendingLink, playerId, pairLinkPresence)
        : [],
    [pairLinkPresence, pendingLink, playerId]
  );
  const localParticipant = participantStates.find((participant) => participant.isSelf) ?? null;
  const allParticipantsPresent =
    participantStates.length > 0 &&
    participantStates.every((participant) => participant.isPresent);

  return (
    <div className="shared-room-entry">
      <div className="shared-room-entry__shell">
        <p className="shared-room-entry__eyebrow">Couple Room</p>
        <h1 className="shared-room-entry__title">Start your room together</h1>
        <p className="shared-room-entry__copy">
          Sign in, bring both partners to the linking screen, and confirm the couple
          room before the starter room opens.
        </p>

        <div className="shared-room-entry__stakes">
          <strong>Shared rooms can be reset if the relationship ends.</strong>
          <p>
            This clears shared progression, room decor, memories, and your shared pet.
          </p>
        </div>

        {bootstrapKind === "signed_out" ? (
          <div className="shared-room-entry__hosted-stack">
            <div className="shared-room-entry__note-card">
              <strong>Google sign-in is required for the hosted couple room.</strong>
              <p>
                Returning partners skip linking and load their room automatically after
                sign-in.
              </p>
            </div>
            {errorMessage ? (
              <p className="shared-room-entry__error">{errorMessage}</p>
            ) : null}
            <div className="shared-room-entry__actions">
              <button
                className="shared-room-entry__button"
                onClick={onSignInWithGoogle}
                type="button"
              >
                Continue with Google
              </button>
            </div>
          </div>
        ) : null}

        {bootstrapKind === "needs_linking" ? (
          <div className="shared-room-entry__hosted-stack">
            <div className="shared-room-entry__account-row">
              <div>
                <span className="shared-room-entry__label">Signed in as</span>
                <strong className="shared-room-entry__account-name">{displayName}</strong>
              </div>
              <button
                className="shared-room-entry__button shared-room-entry__button--secondary"
                onClick={onSignOut}
                type="button"
              >
                Sign out
              </button>
            </div>

            <div className="shared-room-entry__code-card">
              <span className="shared-room-entry__label">Your code</span>
              <strong>{selfPairCode ?? "Preparing..."}</strong>
              <p>Either partner can share their code, and both players must confirm.</p>
            </div>

            <label className="shared-room-entry__field">
              <span>Partner code</span>
              <input
                className="shared-room-entry__input shared-room-entry__input--code"
                maxLength={8}
                onChange={(event) => setPartnerCode(event.target.value.toUpperCase())}
                placeholder="AB12CD34"
                type="text"
                value={partnerCode}
              />
            </label>

            <p className="shared-room-entry__helper">
              Both partners need to stay on this screen to finish linking.
            </p>

            {errorMessage ? (
              <p className="shared-room-entry__error">{errorMessage}</p>
            ) : null}

            <div className="shared-room-entry__actions">
              <button
                className="shared-room-entry__button"
                disabled={normalizedPartnerCode.length < 6}
                onClick={() => onSubmitPartnerCode(normalizedPartnerCode)}
                type="button"
              >
                Submit partner code
              </button>
            </div>
          </div>
        ) : null}

        {bootstrapKind === "pending_link" && pendingLink ? (
          <div className="shared-room-entry__hosted-stack">
            <div className="shared-room-entry__account-row">
              <div>
                <span className="shared-room-entry__label">Signed in as</span>
                <strong className="shared-room-entry__account-name">{displayName}</strong>
              </div>
              <button
                className="shared-room-entry__button shared-room-entry__button--secondary"
                onClick={onSignOut}
                type="button"
              >
                Sign out
              </button>
            </div>

            <div className="shared-room-entry__participant-grid">
              {participantStates.map((participant) => (
                <article className="shared-room-entry__participant-card" key={participant.playerId}>
                  <span className="shared-room-entry__label">
                    {participant.isSelf ? "You" : "Partner"}
                  </span>
                  <strong>{participant.displayName}</strong>
                  <span
                    className={`shared-room-entry__participant-status${participant.isPresent ? " shared-room-entry__participant-status--live" : ""}`}
                  >
                    {participant.isPresent ? "On this screen" : "Not here yet"}
                  </span>
                  <span className="shared-room-entry__participant-meta">
                    {participant.confirmed ? "Confirmed" : "Waiting to confirm"}
                  </span>
                </article>
              ))}
            </div>

            <div className="shared-room-entry__code-card">
              <span className="shared-room-entry__label">Link code in play</span>
              <strong>{pendingLink.targetPairCode}</strong>
              <p>Once both partners confirm, the starter room and shared cat will appear.</p>
            </div>

            {localParticipant?.confirmed ? (
              <p className="shared-room-entry__waiting-copy">
                Waiting for your partner to confirm
              </p>
            ) : (
              <p className="shared-room-entry__helper">
                Both partners need to stay on this screen before you confirm the couple
                room.
              </p>
            )}

            {errorMessage ? (
              <p className="shared-room-entry__error">{errorMessage}</p>
            ) : null}

            <div className="shared-room-entry__actions">
              {!localParticipant?.confirmed ? (
                <button
                  className="shared-room-entry__button"
                  disabled={!allParticipantsPresent}
                  onClick={onConfirmPairLink}
                  type="button"
                >
                  Confirm couple room
                </button>
              ) : null}
              <button
                className="shared-room-entry__button shared-room-entry__button--secondary"
                onClick={onCancelPairLink}
                type="button"
              >
                Cancel link
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SharedRoomEntryShell(props: SharedRoomEntryShellProps) {
  if (props.mode === "hosted_unavailable") {
    return <SharedRoomHostedUnavailableEntryShell {...props} />;
  }

  if (props.mode === "legacy") {
    return <SharedRoomLegacyEntryShell {...props} />;
  }

  return <SharedRoomHostedEntryShell {...props} />;
}
