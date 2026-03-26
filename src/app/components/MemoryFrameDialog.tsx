import { useEffect, useState } from "react";
import { prepareMemoryFrameImage } from "../../lib/memoryFrameImage";
import type { SharedRoomFrameMemory } from "../../lib/sharedRoomTypes";

type MemoryFrameDialogProps = {
  memory: SharedRoomFrameMemory | null;
  onClear: () => void;
  onClose: () => void;
  onSave: (input: { imageSrc: string; caption: string | null }) => Promise<void> | void;
  open: boolean;
  saving?: boolean;
};

export function MemoryFrameDialog({
  memory,
  onClear,
  onClose,
  onSave,
  open,
  saving = false
}: MemoryFrameDialogProps) {
  const [caption, setCaption] = useState(memory?.caption ?? "");
  const [draftImageSrc, setDraftImageSrc] = useState<string | null>(memory?.imageSrc ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileInputResetKey, setFileInputResetKey] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCaption(memory?.caption ?? "");
    setDraftImageSrc(memory?.imageSrc ?? null);
    setErrorMessage(null);
    setFileInputResetKey((currentKey) => currentKey + 1);
  }, [memory?.caption, memory?.imageSrc, open]);

  if (!open) {
    return null;
  }

  async function handleFileChange(file: File | null): Promise<void> {
    if (!file) {
      return;
    }

    try {
      const preparedImageSrc = await prepareMemoryFrameImage(file);
      setDraftImageSrc(preparedImageSrc);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't prepare that image."
      );
    }
  }

  async function handleSave(): Promise<void> {
    if (!draftImageSrc) {
      setErrorMessage("Upload shared photo before saving.");
      return;
    }

    setErrorMessage(null);
    await onSave({
      imageSrc: draftImageSrc,
      caption: caption.trim() || null
    });
  }

  function handleClear(): void {
    if (memory) {
      onClear();
      return;
    }

    setCaption("");
    setDraftImageSrc(null);
    setErrorMessage(null);
    setFileInputResetKey((currentKey) => currentKey + 1);
  }

  return (
    <div className="memory-frame-dialog" role="presentation">
      <div
        aria-labelledby="memory-frame-dialog-title"
        aria-modal="true"
        className="memory-frame-dialog__panel"
        role="dialog"
      >
        <div className="memory-frame-dialog__header">
          <div>
            <p className="memory-frame-dialog__eyebrow">Shared Memory</p>
            <h2 className="memory-frame-dialog__title" id="memory-frame-dialog-title">
              Wall frame memory
            </h2>
            <p className="memory-frame-dialog__body">
              Choose one shared photo and optional caption for this frame.
            </p>
          </div>
          <button
            className="memory-frame-dialog__close"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="memory-frame-dialog__preview">
          {draftImageSrc ? (
            <img alt="Shared memory preview" src={draftImageSrc} />
          ) : (
            <div className="memory-frame-dialog__preview-empty">
              Upload a shared photo to fill this frame.
            </div>
          )}
        </div>

        <label className="memory-frame-dialog__upload">
          <span>Upload shared photo</span>
          <input
            accept="image/*"
            key={fileInputResetKey}
            onChange={(event) => {
              void handleFileChange(event.target.files?.[0] ?? null);
            }}
            type="file"
          />
        </label>

        <label className="memory-frame-dialog__field">
          <span>Caption</span>
          <textarea
            className="memory-frame-dialog__caption"
            maxLength={120}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="A small note for the room."
            rows={3}
            value={caption}
          />
        </label>

        {errorMessage ? (
          <p className="memory-frame-dialog__error">{errorMessage}</p>
        ) : null}

        <div className="memory-frame-dialog__actions">
          <button
            className="memory-frame-dialog__button memory-frame-dialog__button--primary"
            disabled={!draftImageSrc || saving}
            onClick={() => {
              void handleSave();
            }}
            type="button"
          >
            Save memory
          </button>
          <button
            className="memory-frame-dialog__button memory-frame-dialog__button--secondary"
            disabled={saving || (!memory && !draftImageSrc)}
            onClick={handleClear}
            type="button"
          >
            Clear memory
          </button>
        </div>
      </div>
    </div>
  );
}
