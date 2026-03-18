import { DECOR_CATALOG } from "../lib/catalog";
import type { FurnitureInstance, PresenceState, UserProfile } from "../lib/types";

interface DecorPanelProps {
  profile: UserProfile;
  furniture: FurnitureInstance[];
  presence: PresenceState[];
  selectedItem: FurnitureInstance | null;
  onAddFurniture: (type: FurnitureInstance["type"]) => Promise<void>;
  onRotateItem: () => Promise<void>;
  onRemoveItem: () => Promise<void>;
}

export function DecorPanel({
  profile,
  furniture,
  presence,
  selectedItem,
  onAddFurniture,
  onRotateItem,
  onRemoveItem
}: DecorPanelProps) {
  const onlineUsers = new Set(presence.filter((entry) => entry.online).map((entry) => entry.userId));

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <span className="eyebrow">Couple Room</span>
        <h2>{profile.partnerName ? `${profile.displayName} + ${profile.partnerName}` : profile.displayName}</h2>
        <p className="card-copy">
          Shared item count: <strong>{furniture.length}</strong>
        </p>
        <div className="presence-list">
          {presence.map((entry) => (
            <div key={`${entry.userId}-${entry.lastSeen}`} className="presence-pill">
              <span
                className={onlineUsers.has(entry.userId) ? "presence-dot presence-dot--online" : "presence-dot"}
              />
              {entry.displayName}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <span className="eyebrow">Decor Catalog</span>
        <div className="catalog-grid">
          {DECOR_CATALOG.map((item) => (
            <button
              key={item.type}
              className="catalog-tile"
              onClick={() => void onAddFurniture(item.type)}
              style={{ borderColor: item.color }}
            >
              <strong>{item.label}</strong>
              <span>{item.surface}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <span className="eyebrow">Selection</span>
        {selectedItem ? (
          <>
            <h3>{selectedItem.type.replaceAll("_", " ")}</h3>
            <p className="card-copy">
              {selectedItem.locked
                ? "Starter furniture is locked in place for v1."
                : "Rotate or remove this decor item."}
            </p>
            <div className="panel-actions">
              <button
                className="secondary-button"
                disabled={selectedItem.locked}
                onClick={() => void onRotateItem()}
              >
                Rotate
              </button>
              <button
                className="ghost-button"
                disabled={selectedItem.locked}
                onClick={() => void onRemoveItem()}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <p className="card-copy">
            Click an item in the room to inspect it. New decor pieces can be edited after
            placement.
          </p>
        )}
      </div>
    </aside>
  );
}
