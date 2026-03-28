import type { PlayerDrawerTabState } from "../../app/shellViewModel";
import type { PlayerDrawerMode } from "../../app/types";

const ICON_BY_MODE: Record<PlayerDrawerMode, string> = {
  shop: "\u{1F6D2}",
  inventory: "\u{1F4E6}",
  pet_care: "\u{1F43E}"
};

type PlayerDrawerTabsProps = {
  onChangeMode: (mode: PlayerDrawerMode) => void;
  tabs: PlayerDrawerTabState[];
};

export function PlayerDrawerTabs({
  onChangeMode,
  tabs
}: PlayerDrawerTabsProps) {
  return (
    <nav className="player-drawer-tabs" aria-label="Room drawer navigation">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          aria-current={tab.isActive ? "page" : undefined}
          aria-label={tab.label}
          className={
            tab.isActive
              ? "player-drawer-tabs__tab player-drawer-tabs__tab--active"
              : "player-drawer-tabs__tab"
          }
          onClick={() => onChangeMode(tab.value)}
          type="button"
        >
          <span aria-hidden="true" className="player-drawer-tabs__icon">{ICON_BY_MODE[tab.value]}</span>
          <span className="player-drawer-tabs__label">{tab.label}</span>
          {tab.badgeLabel ? (
            <span className="player-drawer-tabs__badge">{tab.badgeLabel}</span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}