import type { ReactNode } from "react";
import type { DeveloperWorkspaceTabState } from "../shellViewModel";

type DeveloperWorkspaceRailProps = {
  children?: ReactNode;
  onSelectTab: (value: DeveloperWorkspaceTabState["value"]) => void;
  tabs: DeveloperWorkspaceTabState[];
};

export function DeveloperWorkspaceRail({
  children,
  onSelectTab,
  tabs
}: DeveloperWorkspaceRailProps) {
  return (
    <nav className="developer-workspace-rail" aria-label="Developer workspace navigation">
      <div className="developer-workspace-rail__tabs">
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
      </div>
      {children ? <div className="developer-workspace-rail__footer">{children}</div> : null}
    </nav>
  );
}
