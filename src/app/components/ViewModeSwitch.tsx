import type { AppShellViewMode } from "../types";

type ViewModeSwitchProps = {
  onChange: (value: AppShellViewMode) => void;
  value: AppShellViewMode;
};

export function ViewModeSwitch({ onChange, value }: ViewModeSwitchProps) {
  return (
    <div className="view-mode-switch" role="tablist" aria-label="Shell view mode">
      <button
        className={`view-mode-switch__button${value === "player" ? " view-mode-switch__button--active" : ""}`}
        onClick={() => onChange("player")}
        type="button"
      >
        Player View
      </button>
      <button
        className={`view-mode-switch__button${value === "developer" ? " view-mode-switch__button--active" : ""}`}
        onClick={() => onChange("developer")}
        type="button"
      >
        Developer View
      </button>
    </div>
  );
}
