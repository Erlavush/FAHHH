import type { FurnitureDefinition } from "../../lib/furnitureRegistry";

type FurnitureInfoControlProps = {
  entry: FurnitureDefinition;
  infoKey: string;
  isOpen: boolean;
  hoverPreviewEnabled: boolean;
  onOpen: (key: string) => void;
  onClose: () => void;
  onToggle: (key: string) => void;
};

export function FurnitureInfoControl({
  entry,
  infoKey,
  isOpen,
  hoverPreviewEnabled,
  onOpen,
  onClose,
  onToggle
}: FurnitureInfoControlProps) {
  const descriptionId = `${infoKey.replace(/[^a-z0-9_-]/gi, "-")}-description`;

  return (
    <div
      className="spawn-card__info-wrap"
      onMouseEnter={() => {
        if (hoverPreviewEnabled) {
          onOpen(infoKey);
        }
      }}
      onMouseLeave={() => {
        if (hoverPreviewEnabled) {
          onClose();
        }
      }}
    >
      <button
        aria-controls={descriptionId}
        aria-expanded={isOpen}
        aria-label={`About ${entry.label}`}
        className={`spawn-card__info-button${isOpen ? " spawn-card__info-button--active" : ""}`}
        onClick={() => {
          if (!hoverPreviewEnabled) {
            onToggle(infoKey);
          }
        }}
        onFocus={() => onOpen(infoKey)}
        onBlur={() => {
          if (hoverPreviewEnabled) {
            onClose();
          }
        }}
        type="button"
      >
        i
      </button>
      {isOpen ? (
        <div className="spawn-card__info-popover" id={descriptionId} role="tooltip">
          {entry.shortDescription}
        </div>
      ) : null}
    </div>
  );
}