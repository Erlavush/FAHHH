type SharedRoomBlockingOverlayProps = {
  body: string;
  onRetry?: (() => void) | null;
  title: string;
};

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
