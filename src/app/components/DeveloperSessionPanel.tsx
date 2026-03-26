import { useState } from "react";
import type { DeveloperSessionPanelState } from "../shellViewModel";

type DeveloperSessionPanelProps = {
  onRefreshRoomState: (() => void) | null;
  state: DeveloperSessionPanelState;
};

export function DeveloperSessionPanel({
  onRefreshRoomState,
  state
}: DeveloperSessionPanelProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");

  async function handleCopyInviteCode(): Promise<void> {
    if (!state.inviteCode || !navigator.clipboard?.writeText) {
      setCopyLabel("Copy manually");
      return;
    }

    await navigator.clipboard.writeText(state.inviteCode);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy"), 1600);
  }

  return (
    <section className="developer-session-panel">
      <div className="developer-session-panel__header">
        <span className="developer-session-panel__eyebrow">Session</span>
        <strong className="developer-session-panel__title">{state.presenceTitle}</strong>
      </div>
      <p className="developer-session-panel__body">{state.presenceBody}</p>
      <div className="developer-session-panel__grid">
        <div>
          <span className="developer-session-panel__label">Members</span>
          <strong>{state.memberCountLabel}</strong>
        </div>
        {state.roomId ? (
          <div>
            <span className="developer-session-panel__label">Room</span>
            <code>{state.roomId}</code>
          </div>
        ) : null}
        {state.inviteCode ? (
          <div>
            <span className="developer-session-panel__label">Invite code</span>
            <div className="developer-session-panel__code-row">
              <code>{state.inviteCode}</code>
              <button
                className="developer-session-panel__button"
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
      </div>
      {state.syncStatus ? (
        <div className="developer-session-panel__sync-status">{state.syncStatus}</div>
      ) : null}
      {onRefreshRoomState ? (
        <button
          className="developer-session-panel__button developer-session-panel__button--accent"
          onClick={onRefreshRoomState}
          type="button"
        >
          Refresh room state
        </button>
      ) : null}
    </section>
  );
}
