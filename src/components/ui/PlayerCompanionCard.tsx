import { useState } from "react";
import type { PlayerCompanionCardState } from "../../app/shellViewModel";

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`player-companion-card-shell${collapsed ? " player-companion-card-shell--collapsed" : ""}`}>
      <button
        aria-label={collapsed ? "Show companion panel" : "Hide companion panel"}
        className="player-companion-card-shell__toggle"
        onClick={() => setCollapsed((current) => !current)}
        type="button"
      >
        {collapsed ? "<" : ">"}
      </button>
      <section className={`player-companion-card player-companion-card--${state.tone}`}>
        <div className="player-companion-card__header">
          <div>
            <span className="player-companion-card__eyebrow">
              {state.roomModeLabel ? `Companion / ${state.roomModeLabel}` : "Companion"}
            </span>
            <h2 className="player-companion-card__title">{state.partnerTitle}</h2>
          </div>
          <div className="player-companion-card__header-actions">
            <button className="player-companion-card__button" onClick={onToggleExpanded} type="button">
              {expanded ? "Less info" : "More info"}
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
          <div>
            <span className="player-companion-card__streak">{state.togetherDaysLabel}</span>
            <div>
              <strong className="player-companion-card__ritual-title">{state.ritualTitle}</strong>
              <p className="player-companion-card__ritual-body">{state.ritualBody}</p>
            </div>
          </div>
          <div className="player-companion-card__details">
            <div className="player-companion-card__detail-row">
              <span>Visit</span>
              <strong>{state.visitStatusLabel}</strong>
            </div>
            <div className="player-companion-card__detail-row">
              <span>Desk PC</span>
              <strong>{state.deskActivityStatus}</strong>
            </div>
            <div className="player-companion-card__detail-row">
              <span>Cozy Rest</span>
              <strong>{state.cozyRestStatus}</strong>
            </div>
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
    </div>
  );
}
