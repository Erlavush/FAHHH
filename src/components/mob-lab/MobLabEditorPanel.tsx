import { useEffect, useState } from "react";
import type {
  ImportedMobPreset,
  MobIdleAnimationSettings,
  MobLocomotionSettings,
  MobPreviewMode,
  MobWalkAnimationSettings
} from "../../lib/mobLab";

type MobLabEditorPanelProps = {
  preset: ImportedMobPreset;
  selectedPartId: string;
  importError: string | null;
  onSelectPart: (partId: string) => void;
  onUpdatePart: (
    partId: string,
    section: "position" | "rotation" | "scale",
    axis: 0 | 1 | 2,
    value: number
  ) => void;
  onUpdateIdle: (field: keyof MobIdleAnimationSettings, value: number) => void;
  onUpdateWalk: (field: keyof MobWalkAnimationSettings, value: number) => void;
  onUpdateLocomotion: <K extends keyof MobLocomotionSettings>(field: K, value: MobLocomotionSettings[K]) => void;
  onUpdatePhysicsNumber: (
    field: "groundOffset",
    value: number
  ) => void;
  onUpdateCollider: (
    field: "colliderSize" | "colliderOffset",
    axis: 0 | 1 | 2,
    value: number
  ) => void;
  onToggleShowCollider: (value: boolean) => void;
  onResetPreset: () => void;
  onExportPreset: () => void;
  onOpenImport: () => void;
};

function NumberField({
  label,
  step,
  value,
  emptyValue,
  onChange
}: {
  label: string;
  step: number;
  value: number;
  emptyValue?: number;
  onChange: (value: number) => void;
}) {
  const resolvedEmptyValue = emptyValue ?? 0;
  const [draft, setDraft] = useState(() => (Number.isFinite(value) ? String(value) : String(resolvedEmptyValue)));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(Number.isFinite(value) ? String(value) : String(resolvedEmptyValue));
    }
  }, [isEditing, resolvedEmptyValue, value]);

  return (
    <label className="mob-lab__field">
      <span className="mob-lab__field-label">{label}</span>
      <input
        className="mob-lab__number-input"
        type="number"
        step={step}
        value={draft}
        onFocus={() => setIsEditing(true)}
        onBlur={() => {
          setIsEditing(false);
          if (draft.trim() === "") {
            onChange(resolvedEmptyValue);
            return;
          }

          const nextValue = Number(draft);
          onChange(Number.isFinite(nextValue) ? nextValue : resolvedEmptyValue);
        }}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);

          if (nextDraft.trim() === "") {
            return;
          }

          const nextValue = Number(nextDraft);

          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mob-lab__toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function MobLabEditorPanel({
  preset,
  selectedPartId,
  importError,
  onSelectPart,
  onUpdatePart,
  onUpdateIdle,
  onUpdateWalk,
  onUpdateLocomotion,
  onUpdatePhysicsNumber,
  onUpdateCollider,
  onToggleShowCollider,
  onResetPreset,
  onExportPreset,
  onOpenImport
}: MobLabEditorPanelProps) {
  const selectedPart = preset.parts.find((part) => part.id === selectedPartId) ?? preset.parts[0];
  const [positionStep, setPositionStep] = useState<0.1 | 1>(1);
  const usesModelOffsets = preset.editorTransformSpace === "model_delta";

  return (
    <aside className="mob-lab__panel">
      <div className="mob-lab__section mob-lab__section--compact">
        <div>
          <h4 className="mob-lab__section-title">Preset</h4>
          <p className="mob-lab__section-copy">
            Auto-saved locally. Export JSON when you want to keep a tuned preset outside the browser.
          </p>
        </div>
        <div className="mob-lab__meta-list">
          <span><strong>Source:</strong> {preset.sourceLabel}</span>
          <span><strong>Mob:</strong> {preset.sourceMobPath}</span>
          <span><strong>Texture:</strong> {preset.textureSrc}</span>
          <span><strong>Atlas:</strong> {preset.textureSize ? `${preset.textureSize[0]} x ${preset.textureSize[1]}` : "Use image size"}</span>
        </div>
        <div className="mob-lab__button-row">
          <button className="preview-studio__toolbar-button" onClick={onExportPreset} type="button">
            Export JSON
          </button>
          <button className="preview-studio__toolbar-button" onClick={onOpenImport} type="button">
            Import JSON
          </button>
          <button className="preview-studio__toolbar-button preview-studio__toolbar-button--secondary" onClick={onResetPreset} type="button">
            Reset Preset
          </button>
        </div>
        {importError ? <div className="mob-lab__error">{importError}</div> : null}
      </div>

      {selectedPart ? (
        <div className="mob-lab__section">
        <h4 className="mob-lab__section-title">Rig</h4>
        <label className="mob-lab__field mob-lab__field--full">
          <span className="mob-lab__field-label">Selected Part</span>
          <select
            className="mob-lab__select"
            value={selectedPart.id}
            onChange={(event) => onSelectPart(event.target.value)}
          >
            {preset.parts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mob-lab__subsection">
          <div className="mob-lab__button-row mob-lab__button-row--compact">
            <span className="mob-lab__subsection-title">{usesModelOffsets ? "Position Offset" : "Position"}</span>
            <label className="mob-lab__field mob-lab__field--step-toggle">
              <span className="mob-lab__field-label">Step</span>
              <select
                className="mob-lab__select"
                value={String(positionStep)}
                onChange={(event) => setPositionStep(event.target.value === "0.1" ? 0.1 : 1)}
              >
                <option value="1">1</option>
                <option value="0.1">0.1</option>
              </select>
            </label>
          </div>
          {usesModelOffsets ? (
            <p className="mob-lab__section-copy">Model axes: X left/right, Y up/down, Z forward/back.</p>
          ) : null}
          <div className="mob-lab__field-grid">
            <NumberField label="X" step={positionStep} value={selectedPart.transform.position[0]} onChange={(value) => onUpdatePart(selectedPart.id, "position", 0, value)} />
            <NumberField label="Y" step={positionStep} value={selectedPart.transform.position[1]} onChange={(value) => onUpdatePart(selectedPart.id, "position", 1, value)} />
            <NumberField label="Z" step={positionStep} value={selectedPart.transform.position[2]} onChange={(value) => onUpdatePart(selectedPart.id, "position", 2, value)} />
          </div>
        </div>
        <div className="mob-lab__subsection">
          <span className="mob-lab__subsection-title">Rotation</span>
          <div className="mob-lab__field-grid">
            <NumberField label="Pitch" step={1} value={selectedPart.transform.rotation[0]} onChange={(value) => onUpdatePart(selectedPart.id, "rotation", 0, value)} />
            <NumberField label="Yaw" step={1} value={selectedPart.transform.rotation[1]} onChange={(value) => onUpdatePart(selectedPart.id, "rotation", 1, value)} />
            <NumberField label="Roll" step={1} value={selectedPart.transform.rotation[2]} onChange={(value) => onUpdatePart(selectedPart.id, "rotation", 2, value)} />
          </div>
        </div>
        <div className="mob-lab__subsection">
          <span className="mob-lab__subsection-title">Scale</span>
          <div className="mob-lab__field-grid">
            <NumberField label="X" step={0.05} value={selectedPart.transform.scale[0]} emptyValue={1} onChange={(value) => onUpdatePart(selectedPart.id, "scale", 0, value)} />
            <NumberField label="Y" step={0.05} value={selectedPart.transform.scale[1]} emptyValue={1} onChange={(value) => onUpdatePart(selectedPart.id, "scale", 1, value)} />
            <NumberField label="Z" step={0.05} value={selectedPart.transform.scale[2]} emptyValue={1} onChange={(value) => onUpdatePart(selectedPart.id, "scale", 2, value)} />
          </div>
        </div>
        </div>
      ) : null}

      <div className="mob-lab__section">
        <h4 className="mob-lab__section-title">Idle Animation</h4>
        <div className="mob-lab__field-grid">
          <NumberField label="Frequency" step={0.05} value={preset.animation.idle.frequency} onChange={(value) => onUpdateIdle("frequency", value)} />
          <NumberField label="Body Bob" step={0.01} value={preset.animation.idle.bodyBob} onChange={(value) => onUpdateIdle("bodyBob", value)} />
          <NumberField label="Head Yaw" step={0.5} value={preset.animation.idle.headYaw} onChange={(value) => onUpdateIdle("headYaw", value)} />
          <NumberField label="Head Pitch" step={0.5} value={preset.animation.idle.headPitch} onChange={(value) => onUpdateIdle("headPitch", value)} />
          <NumberField label="Tail Yaw" step={0.5} value={preset.animation.idle.tailYaw} onChange={(value) => onUpdateIdle("tailYaw", value)} />
          <NumberField label="Tail Pitch" step={0.5} value={preset.animation.idle.tailPitch} onChange={(value) => onUpdateIdle("tailPitch", value)} />
          <NumberField label="Ear Pitch" step={0.5} value={preset.animation.idle.earPitch} onChange={(value) => onUpdateIdle("earPitch", value)} />
          <NumberField label="Ear Roll" step={0.5} value={preset.animation.idle.earRoll} onChange={(value) => onUpdateIdle("earRoll", value)} />
        </div>
      </div>

      <div className="mob-lab__section">
        <h4 className="mob-lab__section-title">Walk Animation</h4>
        <div className="mob-lab__field-grid">
          <NumberField label="Stride Rate" step={0.5} value={preset.animation.walk.strideRate} onChange={(value) => onUpdateWalk("strideRate", value)} />
          <NumberField label="Limb Swing" step={1} value={preset.animation.walk.limbSwing} onChange={(value) => onUpdateWalk("limbSwing", value)} />
          <NumberField label="Body Bob" step={0.01} value={preset.animation.walk.bodyBob} onChange={(value) => onUpdateWalk("bodyBob", value)} />
          <NumberField label="Body Roll" step={0.5} value={preset.animation.walk.bodyRoll} onChange={(value) => onUpdateWalk("bodyRoll", value)} />
          <NumberField label="Head Nod" step={0.5} value={preset.animation.walk.headNod} onChange={(value) => onUpdateWalk("headNod", value)} />
          <NumberField label="Tail Yaw" step={0.5} value={preset.animation.walk.tailYaw} onChange={(value) => onUpdateWalk("tailYaw", value)} />
          <NumberField label="Tail Pitch" step={0.5} value={preset.animation.walk.tailPitch} onChange={(value) => onUpdateWalk("tailPitch", value)} />
        </div>
      </div>

      <div className="mob-lab__section">
        <h4 className="mob-lab__section-title">Locomotion</h4>
        <div className="mob-lab__field-grid">
          <label className="mob-lab__field mob-lab__field--full">
            <span className="mob-lab__field-label">Preview Mode</span>
            <select
              className="mob-lab__select"
              value={preset.locomotion.mode}
              onChange={(event) => onUpdateLocomotion("mode", event.target.value as MobPreviewMode)}
            >
              <option value="idle">Idle</option>
              <option value="walk_in_place">Walk In Place</option>
              <option value="loop_path">Loop Path</option>
            </select>
          </label>
          <NumberField label="Speed" step={0.02} value={preset.locomotion.speed} onChange={(value) => onUpdateLocomotion("speed", value)} />
          <NumberField label="Turn Response" step={0.1} value={preset.locomotion.turnResponsiveness} onChange={(value) => onUpdateLocomotion("turnResponsiveness", value)} />
          <NumberField label="Loop Radius" step={0.05} value={preset.locomotion.loopRadius} onChange={(value) => onUpdateLocomotion("loopRadius", value)} />
        </div>
      </div>

      <div className="mob-lab__section">
        <h4 className="mob-lab__section-title">Physics</h4>
        <div className="mob-lab__field-grid">
          <NumberField label="Ground Offset" step={0.02} value={preset.physics.groundOffset} onChange={(value) => onUpdatePhysicsNumber("groundOffset", value)} />
          <NumberField label="Collider W" step={0.05} value={preset.physics.colliderSize[0]} onChange={(value) => onUpdateCollider("colliderSize", 0, value)} />
          <NumberField label="Collider H" step={0.05} value={preset.physics.colliderSize[1]} onChange={(value) => onUpdateCollider("colliderSize", 1, value)} />
          <NumberField label="Collider D" step={0.05} value={preset.physics.colliderSize[2]} onChange={(value) => onUpdateCollider("colliderSize", 2, value)} />
          <NumberField label="Offset X" step={0.02} value={preset.physics.colliderOffset[0]} onChange={(value) => onUpdateCollider("colliderOffset", 0, value)} />
          <NumberField label="Offset Y" step={0.02} value={preset.physics.colliderOffset[1]} onChange={(value) => onUpdateCollider("colliderOffset", 1, value)} />
          <NumberField label="Offset Z" step={0.02} value={preset.physics.colliderOffset[2]} onChange={(value) => onUpdateCollider("colliderOffset", 2, value)} />
        </div>
        <ToggleField label="Show Collider" checked={preset.physics.showCollider} onChange={onToggleShowCollider} />
      </div>
    </aside>
  );
}
