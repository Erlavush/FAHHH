import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Vector3Tuple } from "../../lib/roomState";

type AxisIndex = 0 | 1 | 2;

type NumberFieldProps = {
  value: number;
  step?: number;
  readOnly?: boolean;
  onCommit?: (value: number) => void;
  variant?: "row" | "card";
};

type SliderRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueFormatter?: (value: number) => string;
  onChange: (value: number) => void;
};

type ToggleRowProps = {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
};

type PropertyRowProps = {
  label: string;
  value?: string;
  children?: ReactNode;
};

type AxisCardProps = {
  title: string;
  value: number;
  onCommit: (value: number) => void;
};

export type DevPanelProps = {
  className?: string;
  visible: boolean;
  buildModeEnabled: boolean;
  catalogOpen: boolean;
  gridSnapEnabled: boolean;
  buildSettingsCollapsed: boolean;
  playerStateCollapsed: boolean;
  playerCoordinatesCollapsed: boolean;
  cameraPropertiesCollapsed: boolean;
  worldSettingsCollapsed: boolean;
  lightingFxCollapsed: boolean;
  collisionDebugCollapsed: boolean;
  actionsCollapsed: boolean;
  playerCoins: number;
  playerInteractionLabel: string;
  playerPosition: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
  worldTimeLabel: string;
  useMinecraftTime: boolean;
  minecraftTimeHours: number;
  timeLocked: boolean;
  lockedTimeHours: number;
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  fogEnabled: boolean;
  fogDensity: number;
  ambientMultiplier: number;
  sunIntensityMultiplier: number;
  brightness: number;
  saturation: number;
  contrast: number;
  showCollisionDebug: boolean;
  showPlayerCollider: boolean;
  showInteractionMarkers: boolean;
  onToggleBuildMode: () => void;
  onToggleCatalog: () => void;
  onToggleGridSnap: () => void;
  onBuildSettingsCollapsedChange: (value: boolean) => void;
  onPlayerStateCollapsedChange: (value: boolean) => void;
  onPlayerCoordinatesCollapsedChange: (value: boolean) => void;
  onCameraPropertiesCollapsedChange: (value: boolean) => void;
  onWorldSettingsCollapsedChange: (value: boolean) => void;
  onLightingFxCollapsedChange: (value: boolean) => void;
  onCollisionDebugCollapsedChange: (value: boolean) => void;
  onActionsCollapsedChange: (value: boolean) => void;
  onPlayerCoinsCommit: (value: number) => void;
  onPlayerAxisCommit: (axis: AxisIndex, value: number) => void;
  onCameraAxisCommit: (axis: AxisIndex, value: number) => void;
  onApplyTransforms: () => void;
  onResetCamera: () => void;
  onResetSandbox: () => void;
  onUseMinecraftTimeChange: (value: boolean) => void;
  onMinecraftTimeHoursCommit: (value: number) => void;
  onTimeLockedChange: (value: boolean) => void;
  onLockedTimeHoursCommit: (value: number) => void;
  onSyncLockedTime: () => void;
  onSunEnabledChange: (value: boolean) => void;
  onShadowsEnabledChange: (value: boolean) => void;
  onFogEnabledChange: (value: boolean) => void;
  onFogDensityCommit: (value: number) => void;
  onAmbientMultiplierCommit: (value: number) => void;
  onSunIntensityMultiplierCommit: (value: number) => void;
  onBrightnessCommit: (value: number) => void;
  onSaturationCommit: (value: number) => void;
  onContrastCommit: (value: number) => void;
  onShowCollisionDebugChange: (value: boolean) => void;
  onShowPlayerColliderChange: (value: boolean) => void;
  onShowInteractionMarkersChange: (value: boolean) => void;
};

function formatNumber(value: number, step = 0.1): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (step >= 1) {
    return `${Math.round(value)}`;
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatSignedNumber(value: number): string {
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${normalized.toFixed(2).replace(/\.?0+$/, "")}`;
}

function formatClockHours(value: number): string {
  const clampedHours = clamp(value, 0, 24);
  const totalMinutes = Math.round((clampedHours % 24) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function normalizeAroundPivot(value: number, min: number, pivot: number, max: number): number {
  const clampedValue = clamp(value, min, max);

  if (clampedValue >= pivot) {
    const positiveRange = max - pivot;
    return positiveRange <= 0 ? 0 : (clampedValue - pivot) / positiveRange;
  }

  const negativeRange = pivot - min;
  return negativeRange <= 0 ? 0 : (clampedValue - pivot) / negativeRange;
}

function denormalizeAroundPivot(value: number, min: number, pivot: number, max: number): number {
  const clampedValue = clamp(value, -1, 1);

  if (clampedValue >= 0) {
    return clamp(pivot + clampedValue * (max - pivot), min, max);
  }

  return clamp(pivot + clampedValue * (pivot - min), min, max);
}

function NumberField({
  value,
  step = 0.1,
  readOnly = false,
  onCommit,
  variant = "row"
}: NumberFieldProps) {
  const [draft, setDraft] = useState(() => formatNumber(value, step));

  useEffect(() => {
    setDraft(formatNumber(value, step));
  }, [step, value]);

  const className =
    variant === "card"
      ? "dev-panel__number-field dev-panel__number-field--card"
      : "dev-panel__number-field";

  const commitDraft = () => {
    if (readOnly || !onCommit) {
      return;
    }

    const parsedValue = Number.parseFloat(draft);

    if (!Number.isFinite(parsedValue)) {
      setDraft(formatNumber(value, step));
      return;
    }

    onCommit(parsedValue);
  };

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      value={draft}
      readOnly={readOnly}
      onBlur={commitDraft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  return (
    <button
      className="dev-panel__toggle-row"
      type="button"
      onClick={() => onToggle(!value)}
      aria-pressed={value}
    >
      <span className="dev-panel__row-label">{label}</span>
      <span
        className={`dev-panel__toggle ${
          value ? "dev-panel__toggle--on" : "dev-panel__toggle--off"
        }`}
      >
        {value ? "YES" : "NO"}
      </span>
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 0.01,
  valueFormatter = formatSignedNumber,
  onChange
}: SliderRowProps) {
  return (
    <div className="dev-panel__slider-row">
      <div className="dev-panel__slider-header">
        <span className="dev-panel__row-label">{label}</span>
        <span className="dev-panel__slider-value">{valueFormatter(value)}</span>
      </div>
      <input
        className="dev-panel__slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
      />
    </div>
  );
}

function PropertyRow({ label, value, children }: PropertyRowProps) {
  return (
    <div className="dev-panel__property-row">
      <span className="dev-panel__row-label">{label}</span>
      <div className="dev-panel__row-value">
        {children ?? <span className="dev-panel__readout">{value}</span>}
      </div>
    </div>
  );
}

function AxisCard({ title, value, onCommit }: AxisCardProps) {
  return (
    <div className="dev-panel__axis-card">
      <span className="dev-panel__axis-title">{title}</span>
      <NumberField value={value} step={0.1} onCommit={onCommit} variant="card" />
    </div>
  );
}

function Section({
  title,
  collapsed,
  onToggle,
  children
}: {
  title: string;
  collapsed: boolean;
  onToggle: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className={`dev-panel__section${collapsed ? " dev-panel__section--collapsed" : ""}`}>
      <button
        className="dev-panel__section-trigger"
        type="button"
        onClick={() => onToggle(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span className="dev-panel__section-title">{title}</span>
        <span className="dev-panel__section-icon" aria-hidden="true">
          {collapsed ? "+" : "-"}
        </span>
      </button>
      {!collapsed ? <div className="dev-panel__section-body">{children}</div> : null}
    </section>
  );
}

function CameraGroup({
  title,
  rows
}: {
  title: string;
  rows: Array<{
    label: string;
    value: number;
    onCommit?: (value: number) => void;
    readOnly?: boolean;
  }>;
}) {
  return (
    <div className="dev-panel__camera-group">
      <div className="dev-panel__camera-group-label">{title}</div>
      <div className="dev-panel__camera-group-rows">
        {rows.map((row) => (
          <PropertyRow key={`${title}-${row.label}`} label={row.label}>
            <NumberField
              value={row.value}
              step={0.1}
              readOnly={row.readOnly}
              onCommit={row.onCommit}
            />
          </PropertyRow>
        ))}
      </div>
    </div>
  );
}

export function DevPanel({
  className,
  visible,
  buildModeEnabled,
  catalogOpen,
  gridSnapEnabled,
  buildSettingsCollapsed,
  playerStateCollapsed,
  playerCoordinatesCollapsed,
  cameraPropertiesCollapsed,
  worldSettingsCollapsed,
  lightingFxCollapsed,
  collisionDebugCollapsed,
  actionsCollapsed,
  playerCoins,
  playerInteractionLabel,
  playerPosition,
  cameraPosition,
  cameraTarget,
  worldTimeLabel,
  useMinecraftTime,
  minecraftTimeHours,
  timeLocked,
  lockedTimeHours,
  sunEnabled,
  shadowsEnabled,
  fogEnabled,
  fogDensity,
  ambientMultiplier,
  sunIntensityMultiplier,
  brightness,
  saturation,
  contrast,
  showCollisionDebug,
  showPlayerCollider,
  showInteractionMarkers,
  onToggleBuildMode,
  onToggleCatalog,
  onToggleGridSnap,
  onBuildSettingsCollapsedChange,
  onPlayerStateCollapsedChange,
  onPlayerCoordinatesCollapsedChange,
  onCameraPropertiesCollapsedChange,
  onWorldSettingsCollapsedChange,
  onLightingFxCollapsedChange,
  onCollisionDebugCollapsedChange,
  onActionsCollapsedChange,
  onPlayerCoinsCommit,
  onPlayerAxisCommit,
  onCameraAxisCommit,
  onApplyTransforms,
  onResetCamera,
  onResetSandbox,
  onUseMinecraftTimeChange,
  onMinecraftTimeHoursCommit,
  onTimeLockedChange,
  onLockedTimeHoursCommit,
  onSyncLockedTime,
  onSunEnabledChange,
  onShadowsEnabledChange,
  onFogEnabledChange,
  onFogDensityCommit,
  onAmbientMultiplierCommit,
  onSunIntensityMultiplierCommit,
  onBrightnessCommit,
  onSaturationCommit,
  onContrastCommit,
  onShowCollisionDebugChange,
  onShowPlayerColliderChange,
  onShowInteractionMarkersChange
}: DevPanelProps) {
  const interactionLabel = useMemo(
    () => playerInteractionLabel || "None",
    [playerInteractionLabel]
  );

  if (!visible) {
    return null;
  }

  return (
    <aside className={className ? `dev-panel ${className}` : "dev-panel"}>
      <div className="dev-panel__header">DEV PANEL</div>

      <Section
        title="BUILD SETTINGS"
        collapsed={buildSettingsCollapsed}
        onToggle={onBuildSettingsCollapsedChange}
      >
        <ToggleRow
          label="Build Enabled"
          value={buildModeEnabled}
          onToggle={() => onToggleBuildMode()}
        />
        <div className="dev-panel__property-row dev-panel__property-row--button">
          <button className="dev-panel__action-row" type="button" onClick={onToggleCatalog}>
            <span className="dev-panel__row-label">Inventory</span>
            <span className="dev-panel__status">{catalogOpen ? "OPEN" : "CLOSED"}</span>
          </button>
        </div>
        <ToggleRow
          label="Grid Snap"
          value={gridSnapEnabled}
          onToggle={() => onToggleGridSnap()}
        />
      </Section>

      <Section
        title="PLAYER STATE"
        collapsed={playerStateCollapsed}
        onToggle={onPlayerStateCollapsedChange}
      >
        <PropertyRow label="Coins">
          <NumberField value={playerCoins} step={1} onCommit={onPlayerCoinsCommit} />
        </PropertyRow>
        <PropertyRow label="Interaction" value={interactionLabel} />
      </Section>

      <Section
        title="PLAYER COORDINATES"
        collapsed={playerCoordinatesCollapsed}
        onToggle={onPlayerCoordinatesCollapsedChange}
      >
        <div className="dev-panel__axis-grid">
          <AxisCard title="AXIS X" value={playerPosition[0]} onCommit={(value) => onPlayerAxisCommit(0, value)} />
          <AxisCard title="AXIS Y" value={playerPosition[1]} onCommit={(value) => onPlayerAxisCommit(1, value)} />
          <AxisCard title="AXIS Z" value={playerPosition[2]} onCommit={(value) => onPlayerAxisCommit(2, value)} />
        </div>
      </Section>

      <Section
        title="CAMERA PROPERTIES"
        collapsed={cameraPropertiesCollapsed}
        onToggle={onCameraPropertiesCollapsedChange}
      >
        <CameraGroup
          title="POS"
          rows={[
            { label: "Coordinate X", value: cameraPosition[0], onCommit: (value) => onCameraAxisCommit(0, value) },
            { label: "Coordinate Y", value: cameraPosition[1], onCommit: (value) => onCameraAxisCommit(1, value) },
            { label: "Coordinate Z", value: cameraPosition[2], onCommit: (value) => onCameraAxisCommit(2, value) }
          ]}
        />
        <CameraGroup
          title="TRGT"
          rows={[
            { label: "Target X", value: cameraTarget[0], readOnly: true },
            { label: "Target Y", value: cameraTarget[1], readOnly: true },
            { label: "Target Z", value: cameraTarget[2], readOnly: true }
          ]}
        />
      </Section>

      <Section
        title="WORLD SETTINGS"
        collapsed={worldSettingsCollapsed}
        onToggle={onWorldSettingsCollapsedChange}
      >
        <PropertyRow label="World Clock" value={worldTimeLabel} />
        <ToggleRow label="Minecraft Clock" value={useMinecraftTime} onToggle={onUseMinecraftTimeChange} />
        <SliderRow
          label="Minecraft Time"
          min={0}
          max={24}
          step={1 / 12}
          value={minecraftTimeHours}
          valueFormatter={formatClockHours}
          onChange={onMinecraftTimeHoursCommit}
        />
        <ToggleRow label="Lock Time" value={timeLocked} onToggle={onTimeLockedChange} />
        <SliderRow
          label="Locked Time"
          min={0}
          max={24}
          step={1 / 12}
          value={lockedTimeHours}
          valueFormatter={formatClockHours}
          onChange={onLockedTimeHoursCommit}
        />
        <div className="dev-panel__button-grid dev-panel__button-grid--single">
          <button className="dev-panel__action-button" type="button" onClick={onSyncLockedTime}>
            Sync To Local Time
          </button>
        </div>
      </Section>

      <Section
        title="LIGHTING AND FX"
        collapsed={lightingFxCollapsed}
        onToggle={onLightingFxCollapsedChange}
      >
        <ToggleRow label="Sun" value={sunEnabled} onToggle={onSunEnabledChange} />
        <ToggleRow label="Shadows" value={shadowsEnabled} onToggle={onShadowsEnabledChange} />
        <ToggleRow label="Fog" value={fogEnabled} onToggle={onFogEnabledChange} />
        <SliderRow
          label="Fog Density"
          min={-1}
          max={1}
          step={0.01}
          value={normalizeAroundPivot(fogDensity, 0, 0.02, 0.1)}
          onChange={(value) => onFogDensityCommit(denormalizeAroundPivot(value, 0, 0.02, 0.1))}
        />
        <SliderRow
          label="Ambient"
          min={-1}
          max={1}
          step={0.01}
          value={normalizeAroundPivot(ambientMultiplier, 0, 1, 3)}
          onChange={(value) => onAmbientMultiplierCommit(denormalizeAroundPivot(value, 0, 1, 3))}
        />
        <SliderRow
          label="Sun Light"
          min={-1}
          max={1}
          step={0.01}
          value={normalizeAroundPivot(sunIntensityMultiplier, 0, 1, 3)}
          onChange={(value) => onSunIntensityMultiplierCommit(denormalizeAroundPivot(value, 0, 1, 3))}
        />
        <SliderRow
          label="Brightness"
          min={-1}
          max={1}
          step={0.01}
          value={normalizeAroundPivot(brightness, 0, 1, 2)}
          onChange={(value) => onBrightnessCommit(denormalizeAroundPivot(value, 0, 1, 2))}
        />
        <SliderRow
          label="Saturation"
          min={-1}
          max={1}
          step={0.01}
          value={normalizeAroundPivot(saturation, 0, 1, 2)}
          onChange={(value) => onSaturationCommit(denormalizeAroundPivot(value, 0, 1, 2))}
        />
        <SliderRow
          label="Contrast"
          min={-1}
          max={1}
          step={0.01}
          value={normalizeAroundPivot(contrast, 0, 1, 2)}
          onChange={(value) => onContrastCommit(denormalizeAroundPivot(value, 0, 1, 2))}
        />
      </Section>

      <Section
        title="COLLISION DEBUG"
        collapsed={collisionDebugCollapsed}
        onToggle={onCollisionDebugCollapsedChange}
      >
        <ToggleRow
          label="Show Colliders"
          value={showCollisionDebug}
          onToggle={onShowCollisionDebugChange}
        />
        <ToggleRow
          label="Show Player Box"
          value={showPlayerCollider}
          onToggle={onShowPlayerColliderChange}
        />
        <ToggleRow
          label="Show Interaction Markers"
          value={showInteractionMarkers}
          onToggle={onShowInteractionMarkersChange}
        />
      </Section>

      <Section
        title="ACTIONS"
        collapsed={actionsCollapsed}
        onToggle={onActionsCollapsedChange}
      >
        <div className="dev-panel__button-grid">
          <button className="dev-panel__action-button" type="button" onClick={onApplyTransforms}>
            Apply Transforms
          </button>
          <button className="dev-panel__action-button" type="button" onClick={onResetCamera}>
            Reset Camera
          </button>
          <button className="dev-panel__action-button" type="button" onClick={onResetSandbox}>
            Reset Sandbox
          </button>
        </div>
      </Section>
    </aside>
  );
}
