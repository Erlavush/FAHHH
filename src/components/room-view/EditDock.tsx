type EditDockProps = {
  busyHelper?: string | null;
  busyTitle?: string | null;
  itemLabel: string;
  surfaceLabel: string;
  blocked: boolean;
  canRotate: boolean;
  canSwapWall: boolean;
  canNudgeVertical: boolean;
  onNudgeNegativeHorizontal: () => void;
  onNudgePositiveHorizontal: () => void;
  onNudgeNegativeVertical: () => void;
  onNudgePositiveVertical: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onSwapWall: () => void;
  onDeselect: () => void;
};

export function EditDock({
  busyHelper = null,
  busyTitle = null,
  itemLabel,
  surfaceLabel,
  blocked,
  canRotate,
  canSwapWall,
  canNudgeVertical,
  onNudgeNegativeHorizontal,
  onNudgePositiveHorizontal,
  onNudgeNegativeVertical,
  onNudgePositiveVertical,
  onRotateLeft,
  onRotateRight,
  onSwapWall,
  onDeselect
}: EditDockProps) {
  const isBusyNoticeVisible = busyTitle !== null && busyHelper !== null;

  return (
    <div className="edit-dock">
      <div className="edit-dock__summary">
        <strong>{itemLabel}</strong>
        <span>{isBusyNoticeVisible ? "Busy item" : blocked ? "Blocked" : surfaceLabel}</span>
      </div>

      <div className="edit-dock__divider" />

      {isBusyNoticeVisible ? (
        <>
          <div className="room-item-busy">
            <strong>{busyTitle}</strong>
            <span>{busyHelper}</span>
          </div>
          <div className="edit-dock__divider" />
        </>
      ) : null}

      <div className="edit-dock__actions">
        {!isBusyNoticeVisible && canRotate ? (
          <>
            <button className="edit-dock__icon-btn" onClick={onRotateLeft} title="Rotate Left" type="button">
              Turn L
            </button>
            <button className="edit-dock__icon-btn" onClick={onRotateRight} title="Rotate Right" type="button">
              Turn R
            </button>
            <div className="edit-dock__divider" />
          </>
        ) : null}

        {!isBusyNoticeVisible ? (
          <>
            <button className="edit-dock__icon-btn" onClick={onNudgeNegativeHorizontal} title="Move Left" type="button">
              Left
            </button>
            {canNudgeVertical ? (
              <>
                <button className="edit-dock__icon-btn" onClick={onNudgePositiveVertical} title="Move Up" type="button">
                  Up
                </button>
                <button className="edit-dock__icon-btn" onClick={onNudgeNegativeVertical} title="Move Down" type="button">
                  Down
                </button>
              </>
            ) : null}
            <button className="edit-dock__icon-btn" onClick={onNudgePositiveHorizontal} title="Move Right" type="button">
              Right
            </button>

            {canSwapWall ? (
              <>
                <div className="edit-dock__divider" />
                <button className="edit-dock__button" onClick={onSwapWall} type="button">
                  Swap Wall
                </button>
              </>
            ) : null}
          </>
        ) : null}

        <div className="edit-dock__divider" />
        <button className="edit-dock__button edit-dock__button--secondary" onClick={onDeselect} type="button">
          {isBusyNoticeVisible ? "Close" : "Deselect"}
        </button>
      </div>
    </div>
  );
}
