import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Group } from "three";
import type { MobExternalMotionState } from "./MobPreviewActor";
import type { ImportedMobPreset } from "../../lib/mobLab";

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

  useEffect(() => {
    // DIAGNOSTIC CORE: Log every node to see why ears are gone!
    clonedScene.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = shadowsEnabled;
        node.receiveShadow = shadowsEnabled;

        // SMART VARIANT FILTER: Hide "Ghost" meshes (alternate tails/legs/ears)
        const name = node.name.toLowerCase();
        
        // Hide only the extra ear variations (keep 4 and 5)
        const isGhostEar = (name.includes("ear") && !name.includes("ear4") && !name.includes("ear5"));
        const isVariantMesh = 
          name.includes("thin") || 
          name.includes("fluff") || 
          name.includes("bobtail") || 
          name.includes("small_leg") ||
          isGhostEar;

        if (isVariantMesh) {
          node.visible = false;
        }
      }
    });

    const tailBase = clonedScene.getObjectByName("tailbase2");
    const tailTip = clonedScene.getObjectByName("tailtip2");
    if (tailBase && tailTip && tailTip.parent !== tailBase) {
        tailBase.attach(tailTip);
    }
  }, [clonedScene, shadowsEnabled]);

  useEffect(() => {
    const walkAction = actions.walk || actions.Walk || Object.values(actions)[0];
    if (walkAction) walkAction.play();
  }, [actions]);

  const limbSwingRef = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    const frontRightLeg = clonedScene.getObjectByName("front_right_leg") || clonedScene.getObjectByName("leg_front_right") || clonedScene.getObjectByName("leg_1");
    const frontLeftLeg = clonedScene.getObjectByName("front_left_leg") || clonedScene.getObjectByName("leg_front_left") || clonedScene.getObjectByName("leg_0");
    const rearRightLeg = clonedScene.getObjectByName("rear_right_leg") || clonedScene.getObjectByName("leg_rear_right") || clonedScene.getObjectByName("back_right_leg") || clonedScene.getObjectByName("leg_3");
    const rearLeftLeg = clonedScene.getObjectByName("rear_left_leg") || clonedScene.getObjectByName("leg_rear_left") || clonedScene.getObjectByName("back_left_leg") || clonedScene.getObjectByName("leg_2");

    const time = state.clock.elapsedTime;
    const locomotion = preset.locomotion;
    const walkAnimation = preset.animation.walk;
    let walkAmount = 0;
    let actorPosition: [number, number, number] = [0, 0, 0];
    let rotationYTarget = group.current.rotation.y;

    if (externalMotionStateRef && externalMotionStateRef.current) {
        const motion = externalMotionStateRef.current;
        actorPosition = motion.position;
        rotationYTarget = motion.rotationY;
        walkAmount = motion.walkAmount;
    } else {
        const locomotionSpeed = Math.max(0, locomotion.speed);
        const loopRadius = Math.max(0.25, locomotion.loopRadius);
        if (locomotion.mode === "walk_in_place") {
            walkAmount = Math.min(1, locomotionSpeed / 0.45);
            limbSwingRef.current += locomotionSpeed * delta * walkAnimation.strideRate;
        } else if (locomotion.mode === "loop_path") {
            const angularSpeed = locomotionSpeed / loopRadius;
            const phase = time * angularSpeed;
            actorPosition = [Math.sin(phase) * loopRadius, 0, Math.cos(phase) * loopRadius];
            const velocityX = Math.cos(phase) * loopRadius * angularSpeed;
            const velocityZ = -Math.sin(phase) * loopRadius * angularSpeed;
            rotationYTarget = Math.atan2(velocityX, velocityZ);
            walkAmount = Math.min(1, locomotionSpeed / 0.45);
            limbSwingRef.current += locomotionSpeed * delta * walkAnimation.strideRate;
        }
    }

    group.current.position.set(actorPosition[0], actorPosition[1], actorPosition[2]);
    group.current.rotation.y = rotationYTarget;

    const allActionEntries = Object.entries(actions);
    const walkEntry = allActionEntries.find(([name]) => name.toLowerCase().includes("walk"));
    const walkAction = walkEntry ? walkEntry[1] : allActionEntries[0]?.[1];
    if (walkAction) {
        if (!walkAction.isRunning()) walkAction.play();
        walkAction.timeScale = walkAmount;
    }

    const swingSpeed = 10;
    const swingAmount = 0.5 * walkAmount;
    if (frontRightLeg) frontRightLeg.rotation.x = Math.sin(time * swingSpeed) * swingAmount;
    if (rearLeftLeg) rearLeftLeg.rotation.x = Math.sin(time * swingSpeed) * swingAmount;
    if (frontLeftLeg) frontLeftLeg.rotation.x = -Math.sin(time * swingSpeed) * swingAmount;
    if (rearRightLeg) rearRightLeg.rotation.x = -Math.sin(time * swingSpeed) * swingAmount;

    const tailBaseFolder = clonedScene.getObjectByName("tailbase2");
    const tailTipFolder = clonedScene.getObjectByName("tailtip2");
    if (tailBaseFolder) {
        tailBaseFolder.rotation.x = -0.9;
        tailBaseFolder.rotation.z = Math.sin(time * 3.2) * 0.3;
        if (tailTipFolder) {
            tailTipFolder.rotation.x = -0.2;
            tailTipFolder.rotation.z = Math.sin(time * 3.2 - 1.0) * 0.4;
        }
    }

    const headNode = clonedScene.getObjectByName("head") || clonedScene.getObjectByName("head2");
    if (headNode) headNode.rotation.y = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <group ref={group} {...props} position={[0, preset.physics.groundOffset, 0]}>
      <primitive object={clonedScene} rotation={[0, Math.PI, 0]} scale={[preset.stage.modelScale, preset.stage.modelScale, preset.stage.modelScale]} />
    </group>
  );
}
