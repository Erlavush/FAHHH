import type { PlayerCompanionCardState } from "../shellViewModel";

type PlayerCompanionCardProps = {
  expanded: boolean;
  onOpenDetails: () => void;
  onToggleExpanded: () => void;
  state: PlayerCompanionCardState;
};

export function PlayerCompanionCard({
  expanded,
  onOpenDetails,
  onToggleExpanded,
  state
}: PlayerCompanionCardProps) {
  return (
    <section className={`player-companion-card player-companion-card--${state.tone}`}>
      <div className="player-companion-card__header">
        <div>
          <span className="player-companion-card__eyebrow">Companion</span>
          <h2 className="player-companion-card__title">{state.partnerTitle}</h2>
        </div>
        <div className="player-companion-card__header-actions">
          <button className="player-companion-card__button" onClick={onToggleExpanded} type="button">
            {expanded ? "Hide details" : "Show details"}
          </button>
          <button
            className="player-companion-card__button player-companion-card__button--accent"
            onClick={onOpenDetails}
            type="button"
          >
            Room details
          </button>
        </div>
      </div>
      <p className="player-companion-card__body">{state.partnerBody}</p>
      <div className="player-companion-card__ritual">
        <span className="player-companion-card__streak">{state.streakLabel}</span>
        <div>
          <strong className="player-companion-card__ritual-title">{state.ritualTitle}</strong>
          <p className="player-companion-card__ritual-body">{state.ritualBody}</p>
        </div>
      </div>
      {expanded ? (
        <div className="player-companion-card__details">
          {state.showInviteCode ? (
            <div className="player-companion-card__detail-row">
              <span>Invite code</span>
              <code>{state.inviteCode}</code>
            </div>
          ) : null}
          {state.roomSyncStatus ? (
            <div className="player-companion-card__detail-row">
              <span>Room sync</span>
              <strong>{state.roomSyncStatus}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
