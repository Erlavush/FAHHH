import type { ReactNode } from "react";
import type { DeveloperQuickAction } from "../shellViewModel";

type DeveloperWorkspaceHeaderProps = {
  activeTabLabel: string;
  inspectorVisible: boolean;
  modeSwitch?: ReactNode;
  onQuickAction: (id: DeveloperQuickAction["id"]) => void;
  onToggleInspector: () => void;
  quickActions: DeveloperQuickAction[];
  roomId: string | null;
};

export function DeveloperWorkspaceHeader({
  activeTabLabel,
  inspectorVisible,
  modeSwitch,
  onQuickAction,
  onToggleInspector,
  quickActions,
  roomId
}: DeveloperWorkspaceHeaderProps) {
  return (
    <header className="developer-workspace-header">
      <div className="developer-workspace-header__group">
        {modeSwitch}
        <div className="developer-workspace-header__identity">
          <span className="developer-workspace-header__eyebrow">Developer workspace</span>
          <strong className="developer-workspace-header__title">{activeTabLabel}</strong>
        </div>
        {roomId ? <code className="developer-workspace-header__room-id">{roomId}</code> : null}
      </div>
      <div className="developer-workspace-header__actions">
        {quickActions.map((action) => (
          <button
            key={action.id}
            className="developer-workspace-header__button"
            onClick={() => onQuickAction(action.id)}
            type="button"
          >
            {action.label}
          </button>
        ))}
        <button
          className="developer-workspace-header__button developer-workspace-header__button--accent"
          onClick={onToggleInspector}
          type="button"
        >
          {inspectorVisible ? "Hide inspector" : "Show inspector"}
        </button>
      </div>
    </header>
  );
}
