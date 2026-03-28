import { useEffect, useState } from "react";

type FurniturePreviewThumbProps = {
  badgeLabel?: string;
  label: string;
  authoringEnabled?: boolean;
  previewSrc: string;
  previewScale?: number;
  onOpenStudio: () => void;
};

export function FurniturePreviewThumb({
  badgeLabel,
  label,
  authoringEnabled = true,
  previewSrc,
  previewScale = 1,
  onOpenStudio
}: FurniturePreviewThumbProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [previewSrc]);

  return (
    <div className="spawn-card__preview">
      {badgeLabel ? <span className="spawn-card__preview-badge">{badgeLabel}</span> : null}
      {loadFailed ? (
        <div className="spawn-card__preview-fallback">
          <span>Preview pending</span>
          {authoringEnabled ? (
            <button
              className="spawn-card__preview-link"
              onClick={onOpenStudio}
              type="button"
            >
              Open Studio
            </button>
          ) : null}
        </div>
      ) : (
        <img
          alt={`${label} preview`}
          className="spawn-card__preview-image"
          loading="lazy"
          onError={() => setLoadFailed(true)}
          src={previewSrc}
          style={previewScale === 1 ? undefined : { transform: `scale(${previewScale})` }}
        />
      )}
    </div>
  );
}