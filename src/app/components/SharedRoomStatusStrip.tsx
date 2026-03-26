import { useState } from "react";
import type { SharedPresenceStatus } from "../hooks/useSharedRoomPresence";

type SharedRoomStatusStripProps = {
  inviteCode: string;
  memberCount: number;
  onReloadLatest: () => void;
  presenceStatus: SharedPresenceStatus | null;
  roomId: string;
  statusMessage: string | null;
};

export function SharedRoomStatusStrip({
  inviteCode,
  memberCount,
  onReloadLatest,
  presenceStatus,
  roomId,
  statusMessage
}: SharedRoomStatusStripProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  async function handleCopyCode(): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      setCopyStatus("Copy manually");
      return;
    }

    await navigator.clipboard.writeText(inviteCode);
    setCopyStatus("Code copied");
    window.setTimeout(() => setCopyStatus(null), 1800);
  }

  const roomSyncStatus =
    statusMessage === "Saving shared room..."
      ? {
          title: "Saving shared room...",
          body: "Committing the latest room changes for both partners.",
          tone: "presence" as const
        }
      : statusMessage === "Reloading latest room..."
        ? {
            title: "Reloading latest room...",
            body: "Fetching the latest committed room before you keep editing.",
            tone: "attention" as const
          }
        : null;
  const activeStatus =
    roomSyncStatus ??
    presenceStatus ?? {
      title: memberCount < 2 ? "Waiting for partner" : "Together now",
      body:
        memberCount < 2
          ? "Send this code to your partner so they can join your room."
          : "Both partners load the latest committed room.",
      tone: "presence" as const
    };
  const rootClassName = roomSyncStatus
    ? "shared-room-status"
    : "shared-room-status shared-room-status--presence";

  return (
    <div className={rootClassName}>
      <div className="shared-room-status__identity">
        <span className="shared-room-status__label">Shared room</span>
        <code className="shared-room-status__room-id">{roomId}</code>
      </div>
      <div className="shared-room-status__content">
        <strong className={`shared-room-status__title shared-room-status__title--${activeStatus.tone}`}>
          {activeStatus.title}
        </strong>
        <span>{activeStatus.body}</span>
      </div>
      <div className="shared-room-status__actions">
        {memberCount < 2 ? (
          <div className="shared-room-status__invite-card">
            <code>{inviteCode}</code>
            <button className="shared-room-status__button" onClick={handleCopyCode} type="button">
              {copyStatus ?? "Copy"}
            </button>
          </div>
        ) : null}
        <button className="shared-room-status__button" onClick={onReloadLatest} type="button">
          Reload latest room
        </button>
      </div>
    </div>
  );
}
