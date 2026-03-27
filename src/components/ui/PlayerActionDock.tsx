import type { PlayerActionDockAction } from "../../app/shellViewModel";

type PlayerActionDockProps = {
  actions: PlayerActionDockAction[];
  onAction: (id: PlayerActionDockAction["id"]) => void;
  statusLabel?: string;
  coins?: number;
  level?: number;
  togetherDays?: number;
};

const PRIMARY_ICON_BY_ACTION_ID: Partial<Record<PlayerActionDockAction["id"], string>> = {
  build: "/icons/build.png",
  inventory: "/icons/inventory.png"
};

export function PlayerActionDock({
  actions,
  onAction,
  statusLabel = "Room mode",
  coins = 0,
  level = 1,
  togetherDays = 0
}: PlayerActionDockProps) {
  const buildAction = actions.find((action) => action.id === "build");
  const inventoryAction = actions.find((action) => action.id === "inventory");
  const otherActions = actions.filter(
    (action) => action.id !== "build" && action.id !== "inventory"
  );

  return (
    <section className="player-hud-dock" aria-label="HUD primary actions">
      <div className="player-hud-dock__rail">
        {buildAction ? (
          <button
            className="player-hud-dock__action-card player-hud-dock__action-card--accent"
            onClick={() => onAction(buildAction.id)}
            type="button"
          >
            <span className="player-hud-dock__action-icon-shell" aria-hidden="true">
              <img
                className="player-hud-dock__action-icon"
                src={PRIMARY_ICON_BY_ACTION_ID[buildAction.id]}
                alt=""
              />
            </span>
            <span className="player-hud-dock__action-text">
              <span className="player-hud-dock__action-kicker">Mode</span>
              <strong className="player-hud-dock__action-label">{buildAction.label}</strong>
            </span>
          </button>
        ) : null}

        <div className="player-hud-dock__stats-card">
          <div className="player-hud-dock__stats-grid">
            <div className="player-hud-dock__stat-block">
              <span className="player-hud-dock__eyebrow">Level</span>
              <strong className="player-hud-dock__value">Lv {level}</strong>
            </div>
            <div className="player-hud-dock__stat-block player-hud-dock__stat-block--featured">
              <span className="player-hud-dock__eyebrow">Coins</span>
              <strong className="player-hud-dock__value">{coins.toLocaleString()}</strong>
            </div>
            <div className="player-hud-dock__stat-block">
              <span className="player-hud-dock__eyebrow">Together Days</span>
              <strong className="player-hud-dock__value">{togetherDays}</strong>
            </div>
          </div>
          <div className="player-hud-dock__status-row">
            <span className="player-hud-dock__status-pill">{statusLabel}</span>
          </div>
        </div>

        {inventoryAction ? (
          <button
            className="player-hud-dock__action-card"
            onClick={() => onAction(inventoryAction.id)}
            type="button"
          >
            <span className="player-hud-dock__action-icon-shell" aria-hidden="true">
              <img
                className="player-hud-dock__action-icon"
                src={PRIMARY_ICON_BY_ACTION_ID[inventoryAction.id]}
                alt=""
              />
            </span>
            <span className="player-hud-dock__action-text">
              <span className="player-hud-dock__action-kicker">Storage</span>
              <strong className="player-hud-dock__action-label">{inventoryAction.label}</strong>
            </span>
          </button>
        ) : null}
      </div>

      {otherActions.length > 0 ? (
        <div className="player-hud-dock__secondary">
          {otherActions.map((action) => (
            <button
              key={action.id}
              className={`player-hud-dock__secondary-btn player-hud-dock__secondary-btn--${action.tone}`}
              onClick={() => onAction(action.id)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
