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

    const locomotionSpeed = (externalMotionStateRef && externalMotionStateRef.current) 
        ? 1.0 
        : Math.max(0, locomotion.speed);
    
    // Always increment limbSwing to keep animation "primed"
    limbSwingRef.current += locomotionSpeed * delta * walkAnimation.strideRate;

    if (externalMotionStateRef && externalMotionStateRef.current) {
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

    group.current.position.set(actorPosition[0], actorPosition[1], actorPosition[2]);
    group.current.rotation.y = rotationYTarget;

    const idleAnimation = preset.animation.idle;
    const idlePhase = time * idleAnimation.frequency;
    const limbSwing = limbSwingRef.current;

    const diagonalSwing = Math.cos(limbSwing) * walkAnimation.limbSwing * walkAmount * (Math.PI / 180);
    const bodyBob =
      (1.0 + Math.sin(idlePhase * 2)) * idleAnimation.bodyBob * (1 - walkAmount) +
      Math.sin(limbSwing * 2) * walkAnimation.bodyBob * walkAmount;
    const bodyRoll = Math.sin(limbSwing - 0.45) * walkAnimation.bodyRoll * walkAmount * (Math.PI / 180);
    const headYaw = Math.sin(idlePhase * 0.82) * idleAnimation.headYaw * (1 - walkAmount * 0.35) * (Math.PI / 180);
    const headPitch =
      Math.cos(idlePhase * 1.05) * idleAnimation.headPitch * (Math.PI / 180) +
      Math.cos(limbSwing * 2 - 0.2) * walkAnimation.headNod * walkAmount * (Math.PI / 180);
    const tailYaw =
      Math.sin(idlePhase) * idleAnimation.tailYaw * (Math.PI / 180) +
      Math.sin(limbSwing - 0.9) * walkAnimation.tailYaw * walkAmount * (Math.PI / 180);
    const tailPitch =
      Math.cos(idlePhase * 0.9) * idleAnimation.tailPitch * (Math.PI / 180) +
      Math.cos(limbSwing * 2 - 0.15) * walkAnimation.tailPitch * walkAmount * (Math.PI / 180);

    group.current.position.set(actorPosition[0], actorPosition[1] + bodyBob * -0.0625, actorPosition[2]);
    group.current.rotation.y = rotationYTarget;
    group.current.rotation.z = bodyRoll;

    const allActionEntries = Object.entries(actions);
    const walkEntry = allActionEntries.find(([name]) => name.toLowerCase().includes("walk"));
    const walkAction = walkEntry ? walkEntry[1] : allActionEntries[0]?.[1];
    
    if (walkAction) {
      if (!walkAction.isRunning()) walkAction.play();
      walkAction.timeScale = walkAmount;
    }

    if (frontRightLeg) frontRightLeg.rotation.x = diagonalSwing;
    if (rearLeftLeg) rearLeftLeg.rotation.x = diagonalSwing;
    if (frontLeftLeg) frontLeftLeg.rotation.x = -diagonalSwing;
    if (rearRightLeg) rearRightLeg.rotation.x = -diagonalSwing;

    const tailBaseFolder = clonedScene.getObjectByName("tailbase2");
    const tailTipFolder = clonedScene.getObjectByName("tailtip2");
    if (tailBaseFolder) {
      tailBaseFolder.rotation.x = -0.9 + tailPitch;
      tailBaseFolder.rotation.y = tailYaw;
      tailBaseFolder.rotation.z = bodyRoll * 0.18;
      if (tailTipFolder) {
        tailTipFolder.rotation.x = -0.2 + tailPitch * 0.5;
        tailTipFolder.rotation.y = tailYaw * 0.5;
      }
    }

    const headNode = clonedScene.getObjectByName("head") || clonedScene.getObjectByName("head2");
    if (headNode) {
      headNode.rotation.x = headPitch;
      headNode.rotation.y = headYaw;
      headNode.rotation.z = bodyRoll * -0.25;
    }
  });

  return (
    <group ref={group} {...props} position={[0, preset.physics.groundOffset, 0]}>
      <primitive object={clonedScene} rotation={[0, Math.PI, 0]} scale={[preset.stage.modelScale, preset.stage.modelScale, preset.stage.modelScale]} />
    </group>
  );
}
