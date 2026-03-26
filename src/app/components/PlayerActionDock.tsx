import type { PlayerActionDockAction } from "../shellViewModel";

type PlayerActionDockProps = {
  actions: PlayerActionDockAction[];
  onAction: (id: PlayerActionDockAction["id"]) => void;
  statusLabel: string;
};

export function PlayerActionDock({
  actions,
  onAction,
  statusLabel
}: PlayerActionDockProps) {
  return (
    <section className="player-action-dock" aria-label="Primary room actions">
      <span className="player-action-dock__status">{statusLabel}</span>
      <div className="player-action-dock__actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`player-action-dock__button player-action-dock__button--${action.tone}`}
            onClick={() => onAction(action.id)}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
