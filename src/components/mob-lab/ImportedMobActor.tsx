import type { MutableRefObject } from "react";
import { getMobRenderMode, type ImportedMobPreset } from "../../lib/mobLab";
import { CemMobPreviewActor } from "./CemMobPreviewActor";
import { GlbMobPreviewActor } from "./GlbMobPreviewActor";
import { MobPreviewActor, type MobExternalMotionState } from "./MobPreviewActor";

type ImportedMobActorProps = {
  preset: ImportedMobPreset;
  selectedPartId: string | null;
  shadowsEnabled?: boolean;
  showCollider?: boolean;
  showVanillaReference?: boolean;
  externalMotionStateRef?: MutableRefObject<MobExternalMotionState>;
};

export function ImportedMobActor(props: ImportedMobActorProps) {
  const renderMode = getMobRenderMode(props.preset);

  if (renderMode === "cem") {
    return (
      <group>
        <CemMobPreviewActor {...props} />
      </group>
    );
  }

  if (renderMode === "glb") {
    return <GlbMobPreviewActor {...props} />;
  }

  return <MobPreviewActor {...props} />;
}
