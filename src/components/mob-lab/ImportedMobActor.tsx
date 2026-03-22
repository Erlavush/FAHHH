import { Suspense, lazy, type MutableRefObject } from "react";
import { getMobRenderMode, type ImportedMobPreset } from "../../lib/mobLab";
import { MobPreviewActor, type MobExternalMotionState } from "./MobPreviewActor";

const CemMobPreviewActor = lazy(async () => {
  const module = await import("./CemMobPreviewActor");
  return { default: module.CemMobPreviewActor };
});

const GlbMobPreviewActor = lazy(async () => {
  const module = await import("./GlbMobPreviewActor");
  return { default: module.GlbMobPreviewActor };
});

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
      <Suspense fallback={null}>
        <group>
          <CemMobPreviewActor {...props} />
        </group>
      </Suspense>
    );
  }

  if (renderMode === "glb") {
    return (
      <Suspense fallback={null}>
        <GlbMobPreviewActor {...props} />
      </Suspense>
    );
  }

  return <MobPreviewActor {...props} />;
}
