import { useMemo, useState } from "react";

type SharedRoomEntryShellProps = {
  displayName: string;
  errorMessage: string | null;
  onCreateRoom: () => void;
  onDisplayNameChange: (value: string) => void;
  onJoinRoom: (code: string) => void;
};

export function SharedRoomEntryShell({
  displayName,
  errorMessage,
  onCreateRoom,
  onDisplayNameChange,
  onJoinRoom
}: SharedRoomEntryShellProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [stakesAcknowledged, setStakesAcknowledged] = useState(false);

  const normalizedJoinCode = useMemo(() => joinCode.trim().toUpperCase(), [joinCode]);

  return (
    <div className="shared-room-entry">
      <div className="shared-room-entry__shell">
        <p className="shared-room-entry__eyebrow">Shared Room</p>
        <h1 className="shared-room-entry__title">Start your room together</h1>
        <p className="shared-room-entry__copy">
          Create a shared room or enter an invite code to pair with your partner and
          load the same room.
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
