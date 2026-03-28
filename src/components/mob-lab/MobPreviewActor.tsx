import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  FrontSide,
  Group,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace
} from "three";
import type {
  ImportedMobPreset,
  MobPartDefinition,
  MobPartRole
} from "../../lib/mobLab";
import {
  MATERIAL_ORDER,
  createBoxFaceMap,
  resolveTextureSize,
  scaleFaceMap,
  type FaceRect,
  type TextureSize
} from "../../lib/mobTextureLayout";
import type { Vector3Tuple } from "../../lib/roomState";

const DEG_TO_RAD = Math.PI / 180;

type MaterialSet = MeshStandardMaterial[];
type MaterialLibrary = Record<string, MaterialSet>;

export type MobExternalMotionState = {
  position: Vector3Tuple;
  rotationY: number;
  walkAmount: number;
  stridePhase: number;
  behaviorState: "idle" | "walk" | "sit" | "lick" | "sleep";
};

type MobPreviewActorProps = {
  preset: ImportedMobPreset;
  selectedPartId: string | null;
  shadowsEnabled?: boolean;
  showCollider?: boolean;
  externalMotionStateRef?: MutableRefObject<MobExternalMotionState>;
};

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${source}`));
    image.src = source;
  });
}

function createTextureCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare texture canvas.");
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);
  return canvas;
}

function createFaceMaterial(
  textureCanvas: HTMLCanvasElement,
  rect: FaceRect
): MeshStandardMaterial {
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = rect.width;
  faceCanvas.height = rect.height;
  const context = faceCanvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare face texture.");
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, rect.width, rect.height);
  context.drawImage(
    textureCanvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  );

  const texture = new CanvasTexture(faceCanvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;

  return new MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,
    side: FrontSide
  });
}

function createMaterialSet(
  textureCanvas: HTMLCanvasElement,
  part: MobPartDefinition,
  logicalTextureSize: TextureSize,
  actualTextureSize: TextureSize
): MaterialSet {
  const [width, height, depth] = part.geometry.size;
  const [u, v] = part.geometry.textureOrigin;
  const faceMap = createBoxFaceMap(u, v, width, height, depth, part.geometry.mirror);
  const scaledFaceMap = scaleFaceMap(faceMap, logicalTextureSize, actualTextureSize);

  return MATERIAL_ORDER.map((face) => createFaceMaterial(textureCanvas, scaledFaceMap[face]));
}

function disposeMaterialSet(materials: MaterialSet): void {
  materials.forEach((material) => {
    material.map?.dispose();
    material.dispose();
  });
}

function disposeMaterialLibrary(materialLibrary: MaterialLibrary): void {
  Object.values(materialLibrary).forEach(disposeMaterialSet);
}

function getBoxCenter(
  offsetX: number,
  offsetY: number,
  offsetZ: number,
  width: number,
  height: number,
  depth: number
): [number, number, number] {
  return [offsetX + width / 2, -(offsetY + height / 2), offsetZ + depth / 2];
}

function buildRoleMap(parts: MobPartDefinition[]): Partial<Record<MobPartRole, string>> {
  return parts.reduce<Partial<Record<MobPartRole, string>>>((roleMap, part) => {
    if (part.role) {
      roleMap[part.role] = part.id;
    }

    return roleMap;
  }, {});
}

function lerpAngle(current: number, target: number, factor: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * factor;
}

function clampWalkAmount(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function TexturedBox({
  part,
  materials,
  selected,
  shadowsEnabled
}: {
  part: MobPartDefinition;
  materials: MaterialSet;
  selected: boolean;
  shadowsEnabled: boolean;
}) {
  const [width, height, depth] = part.geometry.size;
  const [offsetX, offsetY, offsetZ] = part.geometry.offset;
  const boxCenter = getBoxCenter(offsetX, offsetY, offsetZ, width, height, depth);

  return (
    <>
      <mesh
        position={boxCenter}
        material={materials}
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
      >
        <boxGeometry args={part.geometry.size} />
      </mesh>
      {selected ? (
        <mesh position={boxCenter}>
          <boxGeometry args={[width * 1.05, height * 1.05, depth * 1.05]} />
          <meshBasicMaterial color="#8dfcc0" transparent opacity={0.72} wireframe />
        </mesh>
      ) : null}
    </>
  );
}

export function MobPreviewActor({
  preset,
  selectedPartId,
  shadowsEnabled = true,
  showCollider,
  externalMotionStateRef
}: MobPreviewActorProps) {
  const [materialsByPartId, setMaterialsByPartId] = useState<MaterialLibrary | null>(null);
  const actorRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const partRefs = useRef<Record<string, Group | null>>({});
  const limbSwingRef = useRef(0);
  const parts = preset.parts;
  const partsByParent = useMemo(() => {
    return parts.reduce<Record<string, MobPartDefinition[]>>((accumulator, part) => {
      const parentKey = part.parentId ?? "__root__";
      if (!accumulator[parentKey]) {
        accumulator[parentKey] = [];
      }
      accumulator[parentKey].push(part);
      return accumulator;
    }, {});
  }, [parts]);
  const roleMap = useMemo(() => buildRoleMap(parts), [parts]);
  const materialSignature = useMemo(
    () =>
      JSON.stringify({
        textureSrc: preset.textureSrc,
        textureSize: preset.textureSize ?? null,
        parts: parts.map((part) => ({
          id: part.id,
          size: part.geometry.size,
          textureOrigin: part.geometry.textureOrigin,
          mirror: part.geometry.mirror ?? false
        }))
      }),
    [parts, preset.textureSize, preset.textureSrc]
  );

  useEffect(() => {
    let cancelled = false;
    let activeMaterials: MaterialLibrary | null = null;

    async function loadMaterials(): Promise<void> {
      const image = await loadImage(preset.textureSrc);
      const textureCanvas = createTextureCanvas(image);
      const actualTextureSize: TextureSize = [image.width, image.height];
      const logicalTextureSize = resolveTextureSize(preset.textureSize, actualTextureSize);
      const nextMaterials = parts.reduce<MaterialLibrary>((materialLibrary, part) => {
        materialLibrary[part.id] = createMaterialSet(
          textureCanvas,
          part,
          logicalTextureSize,
          actualTextureSize
        );
        return materialLibrary;
      }, {});

      if (cancelled) {
        disposeMaterialLibrary(nextMaterials);
        return;
      }

      activeMaterials = nextMaterials;
      setMaterialsByPartId((currentMaterials) => {
        if (currentMaterials) {
          disposeMaterialLibrary(currentMaterials);
        }

        return nextMaterials;
      });
    }

    void loadMaterials().catch(() => {
      setMaterialsByPartId(null);
    });

    return () => {
      cancelled = true;
      if (activeMaterials) {
        disposeMaterialLibrary(activeMaterials);
      }
    };
  }, [materialSignature, parts, preset.textureSize, preset.textureSrc]);

  useFrame((state, delta) => {
    const actor = actorRef.current;
    const model = modelRef.current;

    if (!actor || !model) {
      return;
    }

    for (const part of parts) {
      const partRef = partRefs.current[part.id];
      if (!partRef) {
        continue;
      }

      partRef.position.set(
        part.transform.position[0],
        part.transform.position[1],
        part.transform.position[2]
      );
      partRef.rotation.set(
        part.transform.rotation[0] * DEG_TO_RAD,
        part.transform.rotation[1] * DEG_TO_RAD,
        part.transform.rotation[2] * DEG_TO_RAD
      );
      partRef.scale.set(
        part.transform.scale[0],
        part.transform.scale[1],
        part.transform.scale[2]
      );
    }

    const idleAnimation = preset.animation.idle;
    const walkAnimation = preset.animation.walk;
    const locomotion = preset.locomotion;
    const physics = preset.physics;
    const time = state.clock.elapsedTime;
    const idlePhase = time * idleAnimation.frequency;
    const turnResponsiveness = Math.max(0.1, locomotion.turnResponsiveness);
    let actorPosition: Vector3Tuple = [0, 0, 0];
    let rotationYTarget = 0;
    let walkAmount = 0;
    let limbSwing = limbSwingRef.current;

    if (externalMotionStateRef) {
      actorPosition = externalMotionStateRef.current.position;
      rotationYTarget = externalMotionStateRef.current.rotationY;
      walkAmount = clampWalkAmount(externalMotionStateRef.current.walkAmount);
      limbSwing = externalMotionStateRef.current.stridePhase;
    } else {
      const locomotionSpeed = Math.max(0, locomotion.speed);
      const loopRadius = Math.max(0.25, locomotion.loopRadius);
      let actorX = 0;
      let actorZ = 0;
      let velocityX = 0;
      let velocityZ = 0;

      if (locomotion.mode === "walk_in_place") {
        walkAmount = Math.min(1, locomotionSpeed / 0.45);
        limbSwingRef.current += locomotionSpeed * delta * walkAnimation.strideRate;
      } else if (locomotion.mode === "loop_path") {
        const angularSpeed = locomotionSpeed / loopRadius;
        const phase = time * angularSpeed;
        actorX = Math.sin(phase) * loopRadius;
        actorZ = Math.cos(phase) * loopRadius;
        velocityX = Math.cos(phase) * loopRadius * angularSpeed;
        velocityZ = -Math.sin(phase) * loopRadius * angularSpeed;
        walkAmount = Math.min(1, locomotionSpeed / 0.45);
        limbSwingRef.current += locomotionSpeed * delta * walkAnimation.strideRate;
        rotationYTarget = Math.atan2(velocityX, velocityZ);
      }

      actorPosition = [actorX, 0, actorZ];
      limbSwing = limbSwingRef.current;
    }

    const diagonalSwing = Math.cos(limbSwing) * walkAnimation.limbSwing * walkAmount * DEG_TO_RAD;
    const bodyBob =
      Math.sin(idlePhase * 2) * idleAnimation.bodyBob * (1 - walkAmount) +
      (1 - Math.cos(limbSwing * 2)) * walkAnimation.bodyBob * walkAmount;
    const bodyRoll = Math.sin(limbSwing - 0.45) * walkAnimation.bodyRoll * walkAmount * DEG_TO_RAD;
    const headYaw = Math.sin(idlePhase * 0.82) * idleAnimation.headYaw * (1 - walkAmount * 0.35) * DEG_TO_RAD;
    const headPitch =
      Math.cos(idlePhase * 1.05) * idleAnimation.headPitch * DEG_TO_RAD +
      Math.cos(limbSwing * 2 - 0.2) * walkAnimation.headNod * walkAmount * DEG_TO_RAD;
    const tailYaw =
      Math.sin(idlePhase) * idleAnimation.tailYaw * DEG_TO_RAD +
      Math.sin(limbSwing - 0.9) * walkAnimation.tailYaw * walkAmount * DEG_TO_RAD;
    const tailPitch =
      Math.cos(idlePhase * 0.9) * idleAnimation.tailPitch * DEG_TO_RAD +
      Math.cos(limbSwing * 2 - 0.15) * walkAnimation.tailPitch * walkAmount * DEG_TO_RAD;
    const earPitch = Math.abs(Math.sin(idlePhase * 1.4)) * idleAnimation.earPitch * DEG_TO_RAD;
    const earRoll = Math.sin(idlePhase * 1.1) * idleAnimation.earRoll * DEG_TO_RAD;

    actor.position.set(actorPosition[0], actorPosition[1] + physics.groundOffset, actorPosition[2]);
    actor.rotation.y = lerpAngle(
      actor.rotation.y,
      rotationYTarget,
      Math.min(1, delta * turnResponsiveness)
    );
    model.rotation.y = Math.PI;

    const bodyId = roleMap.body;
    if (bodyId && partRefs.current[bodyId]) {
      partRefs.current[bodyId]?.position.set(
        preset.parts.find((part) => part.id === bodyId)?.transform.position[0] ?? 0,
        (preset.parts.find((part) => part.id === bodyId)?.transform.position[1] ?? 0) - bodyBob,
        preset.parts.find((part) => part.id === bodyId)?.transform.position[2] ?? 0
      );
      partRefs.current[bodyId]!.rotation.z += bodyRoll;
    }

    const headId = roleMap.head;
    if (headId && partRefs.current[headId]) {
      partRefs.current[headId]!.rotation.x += headPitch;
      partRefs.current[headId]!.rotation.y += headYaw;
      partRefs.current[headId]!.rotation.z += bodyRoll * -0.25;
    }

    const tailId = roleMap.tail;
    if (tailId && partRefs.current[tailId]) {
      partRefs.current[tailId]!.rotation.x += tailPitch;
      partRefs.current[tailId]!.rotation.y += tailYaw;
      partRefs.current[tailId]!.rotation.z += bodyRoll * 0.18;
    }

    const frontLeftLegId = roleMap.front_left_leg;
    const frontRightLegId = roleMap.front_right_leg;
    const rearLeftLegId = roleMap.rear_left_leg;
    const rearRightLegId = roleMap.rear_right_leg;

    if (frontRightLegId && partRefs.current[frontRightLegId]) {
      partRefs.current[frontRightLegId]!.rotation.x += diagonalSwing;
    }
    if (rearLeftLegId && partRefs.current[rearLeftLegId]) {
      partRefs.current[rearLeftLegId]!.rotation.x += diagonalSwing;
    }
    if (frontLeftLegId && partRefs.current[frontLeftLegId]) {
      partRefs.current[frontLeftLegId]!.rotation.x -= diagonalSwing;
    }
    if (rearRightLegId && partRefs.current[rearRightLegId]) {
      partRefs.current[rearRightLegId]!.rotation.x -= diagonalSwing;
    }

    const leftEarId = roleMap.ear_left;
    const rightEarId = roleMap.ear_right;

    if (leftEarId && partRefs.current[leftEarId]) {
      partRefs.current[leftEarId]!.rotation.x += earPitch;
      partRefs.current[leftEarId]!.rotation.z += earRoll;
    }
    if (rightEarId && partRefs.current[rightEarId]) {
      partRefs.current[rightEarId]!.rotation.x += earPitch;
      partRefs.current[rightEarId]!.rotation.z -= earRoll;
    }
  });

  const renderParts = (parentId: string | null): JSX.Element[] => {
    return (partsByParent[parentId ?? "__root__"] ?? []).map((part) => {
      const materials = materialsByPartId?.[part.id] ?? null;

      return (
        <group
          key={part.id}
          ref={(node) => {
            partRefs.current[part.id] = node;
          }}
          position={part.transform.position}
          rotation={part.transform.rotation.map((value) => value * DEG_TO_RAD) as Vector3Tuple}
          scale={part.transform.scale}
        >
          {materials ? (
            <TexturedBox
              part={part}
              materials={materials}
              selected={selectedPartId === part.id}
              shadowsEnabled={shadowsEnabled}
            />
          ) : null}
          {renderParts(part.id)}
        </group>
      );
    });
  };

  const shouldShowCollider = showCollider ?? preset.physics.showCollider;

  return (
    <group ref={actorRef} position={[0, preset.physics.groundOffset, 0]}>
      {shouldShowCollider ? (
        <mesh position={preset.physics.colliderOffset}>
          <boxGeometry args={preset.physics.colliderSize} />
          <meshBasicMaterial color="#89f0b5" transparent opacity={0.16} wireframe />
        </mesh>
      ) : null}
      <group ref={modelRef} scale={[preset.stage.modelScale, preset.stage.modelScale, preset.stage.modelScale]}>
        {renderParts(null)}
      </group>
    </group>
  );
}