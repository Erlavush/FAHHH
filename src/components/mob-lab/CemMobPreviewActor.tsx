import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  FrontSide,
  Group,
  MeshStandardMaterial,
  NearestFilter,
  Quaternion,
  SRGBColorSpace
} from "three";
import type {
  CemBoxDefinition,
  CemNodeDefinition,
  ImportedMobPreset,
  MobPartDefinition,
  MobPartRole
} from "../../lib/mobLab";
import {
  MATERIAL_ORDER,
  createBoxFaceMap,
  createExplicitFaceMap,
  resolveTextureSize,
  scaleFaceMap,
  type FaceRect,
  type TextureSize
} from "../../lib/mobTextureLayout";
import {
  convertCemPosition,
  convertCemRotation,
  convertModelDeltaToParentLocal,
  getCemBoxCenter,
  getCemBoxGeometrySize
} from "../../lib/cemTransforms";
import type { Vector3Tuple } from "../../lib/roomState";
import type { MobExternalMotionState } from "./MobPreviewActor";

const DEG_TO_RAD = Math.PI / 180;

type MaterialSet = MeshStandardMaterial[];
type MaterialLibrary = Record<string, MaterialSet>;
type TextureCanvasLibrary = Record<string, HTMLCanvasElement>;

type CemMobPreviewActorProps = {
  preset: ImportedMobPreset;
  selectedPartId: string | null;
  shadowsEnabled?: boolean;
  showCollider?: boolean;
  externalMotionStateRef?: MutableRefObject<MobExternalMotionState>;
};

type FlatNode = {
  node: CemNodeDefinition;
  effectiveInvertAxis: string;
  effectiveMirrorTexture: string;
  effectiveTextureSrc: string | undefined;
  effectiveEmissiveTextureSrc: string | undefined;
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

async function loadTextureCanvasLibrary(textureSources: string[]): Promise<TextureCanvasLibrary> {
  const settled = await Promise.allSettled(
    textureSources.map(async (source) => ({
      source,
      canvas: createTextureCanvas(await loadImage(source))
    }))
  );

  return settled.reduce<TextureCanvasLibrary>((library, result) => {
    if (result.status === "fulfilled") {
      library[result.value.source] = result.value.canvas;
    }

    return library;
  }, {});
}

function drawFaceTexture(
  sourceCanvas: HTMLCanvasElement,
  rect: FaceRect,
  destinationCanvas: HTMLCanvasElement
): void {
  const context = destinationCanvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare face texture.");
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, destinationCanvas.width, destinationCanvas.height);
  context.save();
  context.translate(rect.flipX ? destinationCanvas.width : 0, rect.flipY ? destinationCanvas.height : 0);
  context.scale(rect.flipX ? -1 : 1, rect.flipY ? -1 : 1);
  context.drawImage(
    sourceCanvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    destinationCanvas.width,
    destinationCanvas.height
  );
  context.restore();
}

function createFaceMaterial(
  textureCanvas: HTMLCanvasElement,
  rect: FaceRect,
  emissiveTextureCanvas?: HTMLCanvasElement
): MeshStandardMaterial {
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = rect.width;
  faceCanvas.height = rect.height;
  drawFaceTexture(textureCanvas, rect, faceCanvas);

  const texture = new CanvasTexture(faceCanvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;

  let emissiveMap: CanvasTexture | undefined;

  if (emissiveTextureCanvas) {
    const emissiveCanvas = document.createElement("canvas");
    emissiveCanvas.width = rect.width;
    emissiveCanvas.height = rect.height;
    drawFaceTexture(emissiveTextureCanvas, rect, emissiveCanvas);
    emissiveMap = new CanvasTexture(emissiveCanvas);
    emissiveMap.magFilter = NearestFilter;
    emissiveMap.minFilter = NearestFilter;
    emissiveMap.generateMipmaps = false;
    emissiveMap.colorSpace = SRGBColorSpace;
  }

  return new MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,
    side: FrontSide,
    emissive: emissiveMap ? "#ffffff" : "#000000",
    emissiveIntensity: emissiveMap ? 1 : 0,
    emissiveMap
  });
}

function resolveCemFaceMap(
  box: CemBoxDefinition,
  logicalTextureSize: TextureSize,
  actualTextureSize: TextureSize,
  mirrorU: boolean
) {
  if (box.faceUvs) {
    const explicitFaceMap = createExplicitFaceMap(box.faceUvs);

    if (explicitFaceMap) {
      return scaleFaceMap(explicitFaceMap, logicalTextureSize, actualTextureSize);
    }
  }

  if (!box.textureOrigin) {
    return null;
  }

  const [, , , width, height, depth] = box.coordinates;
  const [u, v] = box.textureOrigin;
  const faceMap = createBoxFaceMap(u, v, width, height, depth, mirrorU);
  return scaleFaceMap(faceMap, logicalTextureSize, actualTextureSize);
}

function createCemMaterialSet(
  textureCanvas: HTMLCanvasElement,
  box: CemBoxDefinition,
  logicalTextureSize: TextureSize,
  actualTextureSize: TextureSize,
  mirrorU: boolean,
  emissiveTextureCanvas?: HTMLCanvasElement
): MaterialSet | null {
  const faceMap = resolveCemFaceMap(box, logicalTextureSize, actualTextureSize, mirrorU);

  if (!faceMap) {
    return null;
  }

  return MATERIAL_ORDER.map((face) => createFaceMaterial(textureCanvas, faceMap[face], emissiveTextureCanvas));
}

function disposeMaterialSet(materials: MaterialSet): void {
  materials.forEach((material) => {
    material.map?.dispose();
    material.emissiveMap?.dispose();
    material.dispose();
  });
}

function disposeMaterialLibrary(materialLibrary: MaterialLibrary): void {
  Object.values(materialLibrary).forEach(disposeMaterialSet);
}

function buildFlatNodes(
  nodes: CemNodeDefinition[],
  inheritedInvertAxis = "",
  inheritedMirrorTexture = "",
  inheritedTextureSrc?: string,
  inheritedEmissiveTextureSrc?: string
): FlatNode[] {
  return nodes.flatMap((node) => {
    const effectiveInvertAxis = node.invertAxis && node.invertAxis.length > 0
      ? node.invertAxis
      : inheritedInvertAxis;
    const effectiveMirrorTexture = node.mirrorTexture && node.mirrorTexture.length > 0
      ? node.mirrorTexture
      : inheritedMirrorTexture;
    const effectiveTextureSrc = node.textureSrc ?? inheritedTextureSrc;
    const effectiveEmissiveTextureSrc = node.emissiveTextureSrc ?? inheritedEmissiveTextureSrc;

    return [
      {
        node,
        effectiveInvertAxis,
        effectiveMirrorTexture,
        effectiveTextureSrc,
        effectiveEmissiveTextureSrc
      },
      ...buildFlatNodes(
        node.children,
        effectiveInvertAxis,
        effectiveMirrorTexture,
        effectiveTextureSrc,
        effectiveEmissiveTextureSrc
      )
    ];
  });
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

function CemTexturedBox({
  box,
  invertAxis,
  materials,
  selected,
  shadowsEnabled
}: {
  box: CemBoxDefinition;
  invertAxis: string;
  materials: MaterialSet;
  selected: boolean;
  shadowsEnabled: boolean;
}) {
  const geometrySize = getCemBoxGeometrySize(box);
  const boxCenter = getCemBoxCenter(box, invertAxis);

  return (
    <>
      <mesh
        position={boxCenter}
        material={materials}
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
      >
        <boxGeometry args={geometrySize} />
      </mesh>
      {selected ? (
        <mesh position={boxCenter}>
          <boxGeometry args={[geometrySize[0] * 1.04, geometrySize[1] * 1.04, geometrySize[2] * 1.04]} />
          <meshBasicMaterial color="#8dfcc0" transparent opacity={0.72} wireframe />
        </mesh>
      ) : null}
    </>
  );
}

export function CemMobPreviewActor({
  preset,
  selectedPartId,
  shadowsEnabled = true,
  showCollider,
  externalMotionStateRef
}: CemMobPreviewActorProps) {
  const [materialsByBoxKey, setMaterialsByBoxKey] = useState<MaterialLibrary | null>(null);
  const actorRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const nodeRefs = useRef<Record<string, Group | null>>({});
  const visualNodeRefs = useRef<Record<string, Group | null>>({});
  const limbSwingRef = useRef(0);
  const cemModel = preset.cemModel;
  const hiddenNodeIds = useMemo(() => new Set(cemModel?.hiddenNodeIds ?? []), [cemModel?.hiddenNodeIds]);
  const usesModelDeltaEditor = preset.editorTransformSpace === "model_delta";
  const flatNodes = useMemo(
    () => buildFlatNodes(cemModel?.rootNodes ?? []).filter(({ node }) => !hiddenNodeIds.has(node.id)),
    [cemModel?.rootNodes, hiddenNodeIds]
  );
  const roleMap = useMemo(() => buildRoleMap(preset.parts), [preset.parts]);
  const partOverridesById = useMemo(
    () => Object.fromEntries(preset.parts.map((part) => [part.id, part])),
    [preset.parts]
  );
  const materialSignature = useMemo(
    () => JSON.stringify({
      textureSrc: preset.textureSrc,
      textureSize: preset.textureSize ?? null,
      cemModel: preset.cemModel ?? null
    }),
    [preset.cemModel, preset.textureSize, preset.textureSrc]
  );

  useEffect(() => {
    if (!cemModel) {
      setMaterialsByBoxKey(null);
      return;
    }

    let cancelled = false;
    let activeMaterials: MaterialLibrary | null = null;

    async function loadMaterials(): Promise<void> {
      const textureSources = new Set<string>([preset.textureSrc]);

      for (const { effectiveTextureSrc, effectiveEmissiveTextureSrc } of flatNodes) {
        if (effectiveTextureSrc) {
          textureSources.add(effectiveTextureSrc);
        }
        if (effectiveEmissiveTextureSrc) {
          textureSources.add(effectiveEmissiveTextureSrc);
        }
      }

      const textureCanvasLibrary = await loadTextureCanvasLibrary([...textureSources]);
      const nextMaterials: MaterialLibrary = {};

      for (const { node, effectiveMirrorTexture, effectiveTextureSrc, effectiveEmissiveTextureSrc } of flatNodes) {
        const textureSource = effectiveTextureSrc ?? preset.textureSrc;
        const textureCanvas = textureCanvasLibrary[textureSource];

        if (!textureCanvas) {
          continue;
        }

        const actualTextureSize: TextureSize = [textureCanvas.width, textureCanvas.height];
        const logicalTextureSize = resolveTextureSize(preset.textureSize, actualTextureSize);
        const emissiveTextureCanvas = effectiveEmissiveTextureSrc
          ? textureCanvasLibrary[effectiveEmissiveTextureSrc]
          : undefined;

        node.boxes.forEach((box, boxIndex) => {
          const materialKey = `${node.id}:${boxIndex}`;
          const materialSet = createCemMaterialSet(
            textureCanvas,
            box,
            logicalTextureSize,
            actualTextureSize,
            effectiveMirrorTexture.includes("u"),
            emissiveTextureCanvas
          );

          if (materialSet) {
            nextMaterials[materialKey] = materialSet;
          }
        });
      }

      if (cancelled) {
        disposeMaterialLibrary(nextMaterials);
        return;
      }

      activeMaterials = nextMaterials;
      setMaterialsByBoxKey((currentMaterials) => {
        if (currentMaterials) {
          disposeMaterialLibrary(currentMaterials);
        }

        return nextMaterials;
      });
    }

    void loadMaterials().catch(() => {
      setMaterialsByBoxKey(null);
    });

    return () => {
      cancelled = true;
      if (activeMaterials) {
        disposeMaterialLibrary(activeMaterials);
      }
    };
  }, [cemModel, flatNodes, materialSignature, preset.textureSize, preset.textureSrc]);

  useFrame((state, delta) => {
    const actor = actorRef.current;
    const model = modelRef.current;

    if (!actor || !model || !cemModel) {
      return;
    }

    for (const { node, effectiveInvertAxis } of flatNodes) {
      const nodeRef = nodeRefs.current[node.id];
      if (!nodeRef) {
        continue;
      }

      const overridePart = partOverridesById[node.id];
      const transform = usesModelDeltaEditor ? node.transform : overridePart?.transform ?? node.transform;
      const position = convertCemPosition(transform.position, effectiveInvertAxis);
      const rotation = convertCemRotation(transform.rotation, effectiveInvertAxis);

      nodeRef.rotation.order = "ZYX";
      nodeRef.position.set(position[0], position[1], position[2]);
      nodeRef.rotation.set(rotation[0], rotation[1], rotation[2]);
      nodeRef.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
    }

    model.rotation.order = "ZYX";
    model.rotation.y = 0;

    if (usesModelDeltaEditor) {
      model.updateWorldMatrix(true, true);

      const actorQuaternion = new Quaternion();
      actor.getWorldQuaternion(actorQuaternion);

      for (const part of preset.parts) {
        const visualRef = visualNodeRefs.current[part.id];

        if (!visualRef) {
          continue;
        }

        const parent = nodeRefs.current[part.id]?.parent;
        let positionDelta = part.transform.position;

        if (parent) {
          const parentQuaternion = new Quaternion();
          parent.getWorldQuaternion(parentQuaternion);
          positionDelta = convertModelDeltaToParentLocal(part.transform.position, parentQuaternion, actorQuaternion);
        }

        visualRef.position.x = positionDelta[0];
        visualRef.position.y = positionDelta[1];
        visualRef.position.z = positionDelta[2];
        visualRef.rotation.x = part.transform.rotation[0] * DEG_TO_RAD;
        visualRef.rotation.y = part.transform.rotation[1] * DEG_TO_RAD;
        visualRef.rotation.z = part.transform.rotation[2] * DEG_TO_RAD;
        visualRef.scale.x = part.transform.scale[0];
        visualRef.scale.y = part.transform.scale[1];
        visualRef.scale.z = part.transform.scale[2];
      }
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

    actor.position.set(actorPosition[0], actorPosition[1] + physics.groundOffset, actorPosition[2]);
    actor.rotation.y = lerpAngle(
      actor.rotation.y,
      rotationYTarget,
      Math.min(1, delta * turnResponsiveness)
    );

    model.rotation.order = "ZYX";
    model.rotation.y = Math.PI;
  });

  const renderNode = (
    node: CemNodeDefinition,
    inheritedInvertAxis = "",
    inheritedMirrorTexture = ""
  ): JSX.Element | null => {
    if (hiddenNodeIds.has(node.id)) {
      return null;
    }

    const effectiveInvertAxis = node.invertAxis && node.invertAxis.length > 0
      ? node.invertAxis
      : inheritedInvertAxis;
    const effectiveMirrorTexture = node.mirrorTexture && node.mirrorTexture.length > 0
      ? node.mirrorTexture
      : inheritedMirrorTexture;

    return (
      <group
        key={node.id}
        ref={(group) => {
          nodeRefs.current[node.id] = group;
        }}
      >
        <group
          ref={(group) => {
            visualNodeRefs.current[node.id] = group;
          }}
        >
          {node.boxes.map((box, boxIndex) => {
            const materialKey = `${node.id}:${boxIndex}`;
            const materials = materialsByBoxKey?.[materialKey];

            if (!materials) {
              return null;
            }

            return (
              <CemTexturedBox
                key={materialKey}
                box={box}
                invertAxis={effectiveInvertAxis}
                materials={materials}
                selected={selectedPartId === node.id}
                shadowsEnabled={shadowsEnabled}
              />
            );
          })}
        </group>
        {node.children.map((child) => renderNode(child, effectiveInvertAxis, effectiveMirrorTexture))}
      </group>
    );
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
        {cemModel?.rootNodes.map((node) => renderNode(node))}
      </group>
    </group>
  );
}
