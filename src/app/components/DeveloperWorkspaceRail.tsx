import type { DeveloperWorkspaceTabState } from "../shellViewModel";

type DeveloperWorkspaceRailProps = {
  onSelectTab: (value: DeveloperWorkspaceTabState["value"]) => void;
  tabs: DeveloperWorkspaceTabState[];
};

export function DeveloperWorkspaceRail({
  onSelectTab,
  tabs
}: DeveloperWorkspaceRailProps) {
  return (
    <nav className="developer-workspace-rail" aria-label="Developer workspace navigation">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`developer-workspace-rail__button${tab.isActive ? " developer-workspace-rail__button--active" : ""}`}
          onClick={() => onSelectTab(tab.value)}
          type="button"
        >
          <strong>{tab.label}</strong>
          <span>{tab.description}</span>
        </button>
      ))}
    </nav>
  );
}
