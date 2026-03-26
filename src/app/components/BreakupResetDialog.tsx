import { useEffect, useState } from "react";

type BreakupResetDialogProps = {
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  open: boolean;
  saving?: boolean;
};

export function BreakupResetDialog({
  onClose,
  onConfirm,
  open,
  saving = false
}: BreakupResetDialogProps) {
  const [confirmValue, setConfirmValue] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmValue("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const canConfirm = confirmValue.trim().toUpperCase() === "RESET" && !saving;

  return (
    <div className="breakup-reset-dialog" role="presentation">
      <div
        aria-labelledby="breakup-reset-dialog-title"
        aria-modal="true"
        className="breakup-reset-dialog__panel"
        role="dialog"
      >
        <p className="breakup-reset-dialog__eyebrow">Danger Zone</p>
        <h2 className="breakup-reset-dialog__title" id="breakup-reset-dialog-title">
          Break up and reset room
        </h2>
        <p className="breakup-reset-dialog__body">
          This returns the shared room to a fresh baseline and removes shared decor,
          progression, memories, and the shared pet.
        </p>

        <label className="breakup-reset-dialog__field">
          <span>Type RESET to confirm</span>
          <input
            className="breakup-reset-dialog__confirm-input"
            onChange={(event) => setConfirmValue(event.target.value)}
            placeholder="RESET"
            type="text"
            value={confirmValue}
          />
        </label>

        <div className="breakup-reset-dialog__actions">
          <button
            className="breakup-reset-dialog__button breakup-reset-dialog__button--secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="breakup-reset-dialog__button breakup-reset-dialog__button--danger"
            disabled={!canConfirm}
            onClick={() => {
              void onConfirm();
            }}
            type="button"
          >
            Reset shared room
          </button>
        </div>
      </div>
    </div>
  );
}
