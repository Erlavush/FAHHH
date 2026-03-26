import { useState } from "react";

type SharedRoomStatusStripProps = {
  inviteCode: string;
  memberCount: number;
  onReloadLatest: () => void;
  roomId: string;
  statusMessage: string | null;
};

export function SharedRoomStatusStrip({
  inviteCode,
  memberCount,
  onReloadLatest,
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

  const title =
    statusMessage === "Saving shared room..."
      ? "Saving shared room..."
      : statusMessage === "Reloading latest room..."
        ? "Reloading latest room..."
        : memberCount < 2
          ? "Room ready to share"
          : "Shared room updated";
  const body =
    statusMessage === "Saving shared room..."
      ? "Committing the latest room changes for both partners."
      : statusMessage === "Reloading latest room..."
        ? "Fetching the latest committed room before you keep editing."
        : memberCount < 2
          ? "Send this code to your partner so they can join your room."
          : "Both partners load the latest committed room.";

  return (
    <div className="shared-room-status">
      <div className="shared-room-status__identity">
        <span className="shared-room-status__label">Shared room</span>
        <code className="shared-room-status__room-id">{roomId}</code>
      </div>
      <div className="shared-room-status__content">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      <div className="shared-room-status__actions">
        <div className="shared-room-status__invite-card">
          <code>{inviteCode}</code>
          <button className="shared-room-status__button" onClick={handleCopyCode} type="button">
            {copyStatus ?? "Copy"}
          </button>
        </div>
        <button className="shared-room-status__button" onClick={onReloadLatest} type="button">
          Reload latest room
        </button>
      </div>
    </div>
  );
}
