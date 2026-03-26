import { useState } from "react";
import type {
  PlayerRoomDetailsAction,
  PlayerRoomDetailsState
} from "../shellViewModel";

type PlayerRoomDetailsSheetProps = {
  onAction: (id: PlayerRoomDetailsAction["id"]) => void;
  onClose: () => void;
  open: boolean;
  state: PlayerRoomDetailsState;
};

export function PlayerRoomDetailsSheet({
  onAction,
  onClose,
  open,
  state
}: PlayerRoomDetailsSheetProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const dangerAction = state.dangerAction;

  if (!open) {
    return null;
  }

  async function handleCopyInviteCode(): Promise<void> {
    if (!state.inviteCodeVisible || !navigator.clipboard?.writeText) {
      setCopyLabel("Copy manually");
      return;
    }

    await navigator.clipboard.writeText(state.inviteCode);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy"), 1600);
  }

  return (
    <aside className="player-room-details-sheet" aria-label={state.title}>
      <div className="player-room-details-sheet__header">
        <div>
          <span className="player-room-details-sheet__eyebrow">Details</span>
          <h2 className="player-room-details-sheet__title">{state.title}</h2>
          <p className="player-room-details-sheet__subtitle">{state.subtitle}</p>
        </div>
        <button className="player-room-details-sheet__close" onClick={onClose} type="button">
          Close
        </button>
      </div>

      {state.inviteCodeVisible ? (
        <div className="player-room-details-sheet__card">
          <span className="player-room-details-sheet__card-label">Invite code</span>
          <div className="player-room-details-sheet__code-row">
            <code>{state.inviteCode}</code>
            <button
              className="player-room-details-sheet__action"
              onClick={() => {
                void handleCopyInviteCode();
              }}
              type="button"
            >
              {copyLabel}
            </button>
          </div>
        </div>
      ) : null}

      {state.roomId ? (
        <div className="player-room-details-sheet__card">
          <span className="player-room-details-sheet__card-label">Room</span>
          <code>{state.roomId}</code>
        </div>
      ) : null}

      <div className="player-room-details-sheet__actions">
        {state.secondaryActions.map((action) => (
          <button
            key={action.id}
            className="player-room-details-sheet__action"
            onClick={() => {
              if (action.id === "copy_invite") {
                void handleCopyInviteCode();
                return;
              }

              onAction(action.id);
            }}
            type="button"
          >
            {action.id === "copy_invite" ? `${action.label} (${copyLabel})` : action.label}
          </button>
        ))}
      </div>

      {dangerAction ? (
        <section className="player-room-details-sheet__danger-zone">
          <span className="player-room-details-sheet__card-label">Danger zone</span>
          <p className="player-room-details-sheet__subtitle">
            Resetting the shared room clears relationship-tied room state.
          </p>
          <button
            className="player-room-details-sheet__action player-room-details-sheet__action--danger"
            onClick={() => onAction(dangerAction.id)}
            type="button"
          >
            Break up and reset room
          </button>
        </section>
      ) : null}
    </aside>
  );
}
