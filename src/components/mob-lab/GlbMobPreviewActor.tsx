import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, useTexture } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { AnimationAction, Color, Group, NearestFilter, Object3D, SRGBColorSpace } from "three";
import type { MobExternalMotionState } from "./MobPreviewActor";
import {
  DEFAULT_BETTER_CAT_GLB_VARIANT,
  getBetterCatHiddenMeshNames,
  type BetterCatGlbVariantSelection
} from "../../lib/betterCatGlb";
import { BETTER_CAT_VARIANTS } from "../../lib/catVariants";
import type { ImportedMobPreset } from "../../lib/mobLab";

const SPECIAL_ACTION_FADE_SECONDS = 0.18;
const TRANSPARENT_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

type AnimationActionMap = Record<string, AnimationAction | null | undefined>;

type FallbackPose = {
  bodyRoll: number;
  headPitch: number;
  headYaw: number;
  tailPitch: number;
  tailYaw: number;
  frontLegPitch: number;
  rearLegPitch: number;
  verticalOffset: number;
};

function normalizeActionName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function findNamedAction(actions: AnimationActionMap, clipNames: string[]): AnimationAction | null {
  const normalizedTargets = clipNames.map(normalizeActionName);
  const entries = Object.entries(actions);

  for (const target of normalizedTargets) {
    const exactMatch = entries.find(([name]) => normalizeActionName(name) === target)?.[1] ?? null;
    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const target of normalizedTargets) {
    const fuzzyMatch = entries.find(([name]) => normalizeActionName(name).includes(target))?.[1] ?? null;
    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  return null;
}

function playNamedAction(actions: AnimationActionMap, clipNames: string[]): AnimationAction | null {
  const action = findNamedAction(actions, clipNames);

  if (!action) {
    return null;
  }

  action.enabled = true;
  action.setEffectiveWeight(1);
  action.setEffectiveTimeScale(1);

  if (!action.isRunning()) {
    action.reset().fadeIn(SPECIAL_ACTION_FADE_SECONDS).play();
  }

  return action;
}

function findPoseNode(clonedScene: Group, names: string[]): Object3D | null {
  for (const name of names) {
    const node = clonedScene.getObjectByName(name);
    if (node) {
      return node;
    }
  }

  return null;
}

function getFallbackPose(behaviorState: MobExternalMotionState["behaviorState"], elapsedTime: number): FallbackPose | null {
  switch (behaviorState) {
    case "sit":
      return {
        bodyRoll: 0,
        headPitch: 0.24,
        headYaw: Math.sin(elapsedTime * 0.8) * 0.08,
        tailPitch: -0.2,
        tailYaw: Math.sin(elapsedTime * 1.2) * 0.14,
        frontLegPitch: 0.24,
        rearLegPitch: 1.08,
        verticalOffset: -0.08
      };
    case "lick":
      return {
        bodyRoll: 0.06,
        headPitch: 0.48 + Math.cos(elapsedTime * 5.5) * 0.14,
        headYaw: Math.sin(elapsedTime * 4.5) * 0.18,
        tailPitch: -0.28,
        tailYaw: Math.sin(elapsedTime * 2.3) * 0.12,
        frontLegPitch: 0.34,
        rearLegPitch: 1.02,
        verticalOffset: -0.1
      };
    case "sleep":
      return {
        bodyRoll: 0.22,
        headPitch: 0.76 + Math.sin(elapsedTime * 0.45) * 0.04,
        headYaw: Math.sin(elapsedTime * 0.3) * 0.06,
        tailPitch: -0.55,
        tailYaw: Math.sin(elapsedTime * 0.4) * 0.04,
        frontLegPitch: -1.1,
        rearLegPitch: 1.18,
        verticalOffset: -0.14
      };
    default:
      return null;
  }
}

function getDesiredBehaviorState(
  externalMotionStateRef: React.MutableRefObject<MobExternalMotionState> | undefined,
  walkAmount: number
): MobExternalMotionState["behaviorState"] {
  if (externalMotionStateRef?.current) {
    return externalMotionStateRef.current.behaviorState;
  }

  return walkAmount > 0.05 ? "walk" : "idle";
}

export function GlbMobPreviewActor({
  preset,
  externalMotionStateRef,
  shadowsEnabled = true,
  ...props
}: {
  preset: ImportedMobPreset;
  externalMotionStateRef?: React.MutableRefObject<MobExternalMotionState>;
  shadowsEnabled?: boolean;
} & React.ComponentProps<"group">) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(preset.sourceMobPath || "/models/better_cat.glb");

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Group;
    return clone;
  }, [scene]);

  const { actions } = useAnimations(animations, clonedScene);
  const activeActionRef = useRef<AnimationAction | null>(null);

  const variant = useMemo(() => {
    if (!preset.variantId) {
      return null;
    }
    return BETTER_CAT_VARIANTS.find((v) => v.id === preset.variantId);
  }, [preset.variantId]);

  const isRealTexture = useMemo(() => {
    return preset.textureSrc && preset.textureSrc !== "placeholder";
  }, [preset.textureSrc]);

  const textures = useTexture({
    coat: isRealTexture ? variant?.coatTextureSrc ?? preset.textureSrc : TRANSPARENT_PIXEL,
    eyes: variant?.eyeOverlayTextureSrc ?? TRANSPARENT_PIXEL,
    eyesEmissive: variant?.eyeEmissiveTextureSrc ?? TRANSPARENT_PIXEL,
    whiskers: variant?.whiskersTextureSrc ?? TRANSPARENT_PIXEL
  });

  useEffect(() => {
    Object.values(textures).forEach((texture) => {
      if (texture) {
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;
        texture.colorSpace = SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
      }
    });
  }, [textures]);

  const betterCatVariant = useMemo<BetterCatGlbVariantSelection | null>(() => {
    if (preset.betterCatVariant) {
      return preset.betterCatVariant;
    }

    if (preset.id === "better_cat_glb") {
      return DEFAULT_BETTER_CAT_GLB_VARIANT;
    }

    return null;
  }, [preset.betterCatVariant, preset.id]);
  const hiddenBetterCatMeshNames = useMemo(() => {
    if (!betterCatVariant) {
      return null;
    }

    return new Set(getBetterCatHiddenMeshNames(betterCatVariant));
  }, [betterCatVariant]);
  const poseNodes = useMemo(
    () => ({
      frontRightLeg: findPoseNode(clonedScene, ["front_right_leg", "leg_front_right", "leg_1"]),
      frontLeftLeg: findPoseNode(clonedScene, ["front_left_leg", "leg_front_left", "leg_0"]),
      rearRightLeg: findPoseNode(clonedScene, ["rear_right_leg", "leg_rear_right", "back_right_leg", "leg_3"]),
      rearLeftLeg: findPoseNode(clonedScene, ["rear_left_leg", "leg_rear_left", "back_left_leg", "leg_2"]),
      tailBase: findPoseNode(clonedScene, ["tailbase2", "tailbase", "tail"]),
      tailTip: findPoseNode(clonedScene, ["tailtip2", "tailtip"]),
      head: findPoseNode(clonedScene, ["head", "head2"])
    }),
    [clonedScene]
  );

  useEffect(() => {
    clonedScene.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = shadowsEnabled;
        node.receiveShadow = shadowsEnabled;

        const name = node.name.toLowerCase();

        if (hiddenBetterCatMeshNames) {
          node.visible = !hiddenBetterCatMeshNames.has(name);
        }

        if (betterCatVariant && node.material && (node.material as any).isMeshStandardMaterial) {
          if (isRealTexture) {
            const material = node.material.clone();

            if (name.includes("eye")) {
              material.map = textures.eyes;
              material.emissiveMap = textures.eyesEmissive;
              material.emissive = new Color(0xffffff);
              material.emissiveIntensity = 1.0;
              material.transparent = true;
            } else if (name.includes("whisker")) {
              material.map = textures.whiskers;
              material.transparent = true;
              material.alphaTest = 0.5;
            } else {
              material.map = textures.coat;
            }

            material.needsUpdate = true;
            node.material = material;
          }
        }
      }
    });

    const tailBase = clonedScene.getObjectByName("tailbase2");
    const tailTip = clonedScene.getObjectByName("tailtip2");
    if (tailBase && tailTip && tailTip.parent !== tailBase) {
      tailBase.attach(tailTip);
    }
  }, [hiddenBetterCatMeshNames, clonedScene, shadowsEnabled]);

  useEffect(() => {
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
      activeActionRef.current = null;
    };
  }, [actions]);

  const limbSwingRef = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) {
      return;
    }

    const time = state.clock.elapsedTime;
    const locomotion = preset.locomotion;
    const walkAnimation = preset.animation.walk;
    const idleAnimation = preset.animation.idle;
    let walkAmount = 0;
    let actorPosition: [number, number, number] = [0, 0, 0];
    let rotationYTarget = group.current.rotation.y;

    const locomotionSpeed = externalMotionStateRef?.current
      ? 1.0
      : Math.max(0, locomotion.speed);

    limbSwingRef.current += locomotionSpeed * delta * walkAnimation.strideRate;

    if (externalMotionStateRef?.current) {
      const motion = externalMotionStateRef.current;
      actorPosition = motion.position;
      rotationYTarget = motion.rotationY;
      walkAmount = motion.walkAmount;
    } else {
      const loopRadius = Math.max(0.25, locomotion.loopRadius);
      if (locomotion.mode === "walk_in_place") {
        walkAmount = Math.min(1, locomotionSpeed / 0.45);
      } else if (locomotion.mode === "loop_path") {
        const angularSpeed = locomotionSpeed / loopRadius;
        const phase = time * angularSpeed;
        actorPosition = [Math.sin(phase) * loopRadius, 0, Math.cos(phase) * loopRadius];
        const velocityX = Math.cos(phase) * loopRadius * angularSpeed;
        const velocityZ = -Math.sin(phase) * loopRadius * angularSpeed;
        rotationYTarget = Math.atan2(velocityX, velocityZ);
        walkAmount = Math.min(1, locomotionSpeed / 0.45);
      }
    }

    const behaviorState = getDesiredBehaviorState(externalMotionStateRef, walkAmount);
    const walkAction = findNamedAction(actions, ["walk"]);
    let activeAction: AnimationAction | null = null;

    if (behaviorState === "sleep") {
      activeAction = playNamedAction(actions, ["sleep", "idle_sleep", "lay"]);
    } else if (behaviorState === "sit") {
      activeAction = playNamedAction(actions, ["sit", "idle_sit"]);
    } else if (behaviorState === "lick") {
      activeAction = playNamedAction(actions, ["lick", "groom"]);
    } else if (walkAction) {
      walkAction.enabled = true;
      walkAction.setEffectiveWeight(1);
      walkAction.setEffectiveTimeScale(behaviorState === "walk" ? Math.max(0.7, walkAmount) : 0.2);
      if (!walkAction.isRunning()) {
        walkAction.reset().fadeIn(SPECIAL_ACTION_FADE_SECONDS).play();
      }
      activeAction = walkAction;
    }

    if (activeActionRef.current !== activeAction) {
      if (activeActionRef.current && activeActionRef.current !== activeAction) {
        activeActionRef.current.fadeOut(SPECIAL_ACTION_FADE_SECONDS);
      }

      Object.values(actions).forEach((action) => {
        if (action && action !== activeAction && action !== activeActionRef.current) {
          action.fadeOut(SPECIAL_ACTION_FADE_SECONDS);
        }
      });

      activeActionRef.current = activeAction;
    }

    group.current.position.set(actorPosition[0], actorPosition[1], actorPosition[2]);
    group.current.rotation.y = rotationYTarget;

    const idlePhase = time * idleAnimation.frequency;
    const limbSwing = externalMotionStateRef?.current?.stridePhase ?? limbSwingRef.current;
    const diagonalSwing = Math.cos(limbSwing) * walkAnimation.limbSwing * walkAmount * (Math.PI / 180);
    const baseBodyBob =
      (1.0 + Math.sin(idlePhase * 2)) * idleAnimation.bodyBob * (1 - walkAmount) +
      Math.sin(limbSwing * 2) * walkAnimation.bodyBob * walkAmount;
    const baseBodyRoll = Math.sin(limbSwing - 0.45) * walkAnimation.bodyRoll * walkAmount * (Math.PI / 180);
    const baseHeadYaw =
      Math.sin(idlePhase * 0.82) * idleAnimation.headYaw * (1 - walkAmount * 0.35) * (Math.PI / 180);
    const baseHeadPitch =
      Math.cos(idlePhase * 1.05) * idleAnimation.headPitch * (Math.PI / 180) +
      Math.cos(limbSwing * 2 - 0.2) * walkAnimation.headNod * walkAmount * (Math.PI / 180);
    const baseTailYaw =
      Math.sin(idlePhase) * idleAnimation.tailYaw * (Math.PI / 180) +
      Math.sin(limbSwing - 0.9) * walkAnimation.tailYaw * walkAmount * (Math.PI / 180);
    const baseTailPitch =
      Math.cos(idlePhase * 0.9) * idleAnimation.tailPitch * (Math.PI / 180) +
      Math.cos(limbSwing * 2 - 0.15) * walkAnimation.tailPitch * walkAmount * (Math.PI / 180);

    const fallbackPose = activeAction ? null : getFallbackPose(behaviorState, time);
    const bodyBob = fallbackPose ? Math.sin(time * 1.8) * 0.01 : baseBodyBob;
    const bodyRoll = fallbackPose?.bodyRoll ?? baseBodyRoll;
    const headYaw = fallbackPose?.headYaw ?? baseHeadYaw;
    const headPitch = fallbackPose?.headPitch ?? baseHeadPitch;
    const tailYaw = fallbackPose?.tailYaw ?? baseTailYaw;
    const tailPitch = fallbackPose?.tailPitch ?? baseTailPitch;
    const poseYOffset = fallbackPose?.verticalOffset ?? 0;

    group.current.position.set(
      actorPosition[0],
      actorPosition[1] + bodyBob * -0.0625 + poseYOffset,
      actorPosition[2]
    );
    group.current.rotation.y = rotationYTarget;
    group.current.rotation.z = bodyRoll;

    if (!activeAction) {
      if (poseNodes.frontRightLeg) {
        poseNodes.frontRightLeg.rotation.x = fallbackPose ? fallbackPose.frontLegPitch : diagonalSwing;
      }
      if (poseNodes.rearLeftLeg) {
        poseNodes.rearLeftLeg.rotation.x = fallbackPose ? fallbackPose.rearLegPitch : diagonalSwing;
      }
      if (poseNodes.frontLeftLeg) {
        poseNodes.frontLeftLeg.rotation.x = fallbackPose ? fallbackPose.frontLegPitch : -diagonalSwing;
      }
      if (poseNodes.rearRightLeg) {
        poseNodes.rearRightLeg.rotation.x = fallbackPose ? fallbackPose.rearLegPitch : -diagonalSwing;
      }

      if (poseNodes.tailBase) {
        poseNodes.tailBase.rotation.x = -0.9 + tailPitch;
        poseNodes.tailBase.rotation.y = tailYaw;
        poseNodes.tailBase.rotation.z = bodyRoll * 0.18;
      }
      if (poseNodes.tailTip) {
        poseNodes.tailTip.rotation.x = -0.2 + tailPitch * 0.5;
        poseNodes.tailTip.rotation.y = tailYaw * 0.5;
      }
      if (poseNodes.head) {
        poseNodes.head.rotation.x = headPitch;
        poseNodes.head.rotation.y = headYaw;
        poseNodes.head.rotation.z = bodyRoll * -0.25;
      }
    }
  });

  return (
    <group ref={group} {...props} position={[0, preset.physics.groundOffset, 0]}>
      <primitive
        object={clonedScene}
        rotation={[0, Math.PI, 0]}
        scale={[preset.stage.modelScale, preset.stage.modelScale, preset.stage.modelScale]}
      />
    </group>
  );
}