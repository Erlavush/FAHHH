type SharedRoomBlockingOverlayProps = {
  body: string;
  onRetry?: (() => void) | null;
  title: string;
};

export const SHARED_ROOM_BLOCKING_LOADING_TITLE = "Loading your room...";
export const SHARED_ROOM_BLOCKING_VERIFY_ERROR_TITLE =
  "We couldn't verify your room right now.";

export function SharedRoomBlockingOverlay({
  body,
  onRetry,
  title
}: SharedRoomBlockingOverlayProps) {
  return (
    <div className="shared-room-overlay">
      <div className="shared-room-overlay__panel">
        <p className="shared-room-overlay__eyebrow">Shared Room</p>
        <h2 className="shared-room-overlay__title">{title}</h2>
        <p className="shared-room-overlay__body">{body}</p>
        {onRetry ? (
          <button className="shared-room-overlay__button" onClick={onRetry} type="button">
            Reload latest room
          </button>
        ) : null}
      </div>
    </div>
  );
}
