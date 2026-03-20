import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  Box3,
  Color,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Vector3
} from "three";

type PreparedGlbAsset = {
  root: Group;
  materials: Material[];
};

export interface GlbAssetModelProps {
  modelPath: string;
  targetSize: {
    width: number;
    height: number;
    depth: number;
  };
  overlaySize: [number, number, number];
  ringSize?: [number, number];
  modelOffset?: [number, number, number];
  modelRotationY?: number;
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  flatShading?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  fallbackColor?: string;
}

function cloneMaterial(material: Material, flatShading: boolean): Material {
  const nextMaterial = material.clone();

  if (nextMaterial instanceof MeshStandardMaterial) {
    nextMaterial.roughness = Math.max(nextMaterial.roughness, 0.72);
    nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.1);
    nextMaterial.color.offsetHSL(0.01, -0.02, 0.015);
    nextMaterial.flatShading = flatShading;
    nextMaterial.needsUpdate = true;
  }

  return nextMaterial;
}

function prepareGlbAssetObject(
  sourceGroup: Group,
  targetSize: GlbAssetModelProps["targetSize"],
  flatShading: boolean
): PreparedGlbAsset {
  const rootSource = sourceGroup.clone(true);
  const materials: Material[] = [];

  rootSource.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => {
        const nextMaterial = cloneMaterial(material, flatShading);
        materials.push(nextMaterial);
        return nextMaterial;
      });
      return;
    }

    const nextMaterial = cloneMaterial(child.material, flatShading);
    materials.push(nextMaterial);
    child.material = nextMaterial;
  });

  rootSource.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(rootSource);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const scaleFactor =
    size.x > 0 && size.y > 0 && size.z > 0
      ? Math.min(
          targetSize.width / size.x,
          targetSize.height / size.y,
          targetSize.depth / size.z
        )
      : 1;

  const alignGroup = new Group();
  alignGroup.position.set(-center.x, -bounds.min.y, -center.z);
  alignGroup.add(rootSource);

  const root = new Group();
  root.scale.setScalar(scaleFactor);
  root.add(alignGroup);

  return { root, materials };
}

export function GlbAssetModel({
  modelPath,
  targetSize,
  overlaySize,
  ringSize = [0.6, 0.9],
  modelOffset = [0, 0, 0],
  modelRotationY = 0,
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  flatShading = false,
  onPointerDown,
  fallbackColor = "#d9dee8"
}: GlbAssetModelProps) {
  const gltf = useGLTF(modelPath);
  const preparedAsset = useMemo(
    () => prepareGlbAssetObject(gltf.scene, targetSize, flatShading),
    [flatShading, gltf.scene, targetSize.depth, targetSize.height, targetSize.width]
  );

  useEffect(() => {
    preparedAsset.root.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = shadowsEnabled;
        child.receiveShadow = shadowsEnabled;
      }
    });
  }, [preparedAsset, shadowsEnabled]);

  useEffect(() => {
    const tintColor = blocked
      ? new Color("#ff7b88")
      : selected
        ? new Color("#5cff98")
        : hovered || interactionHovered
          ? new Color("#7cc8ff")
          : null;
    const opacity = blocked || selected ? 0.8 : hovered ? 0.92 : interactionHovered ? 0.84 : 1;

    preparedAsset.materials.forEach((material) => {
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;

      if (material instanceof MeshStandardMaterial) {
        material.emissive.copy(tintColor ?? new Color("#000000"));
        material.emissiveIntensity = tintColor
          ? blocked
            ? 0.28
            : selected
              ? 0.18
              : hovered
                ? 0.12
                : 0.08
          : 0;
      }

      material.needsUpdate = true;
    });
  }, [blocked, hovered, interactionHovered, preparedAsset, selected]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      {preparedAsset ? (
        <group position={modelOffset} rotation={[0, modelRotationY, 0]}>
          <primitive object={preparedAsset.root} />
        </group>
      ) : (
        <mesh
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          position={[modelOffset[0], modelOffset[1] + targetSize.height / 2, modelOffset[2]]}
        >
          <boxGeometry args={[targetSize.width, targetSize.height, targetSize.depth]} />
          <meshStandardMaterial color={fallbackColor} />
        </mesh>
      )}

      {selected || blocked || hovered || interactionHovered ? (
        <>
          <mesh position={[0, overlaySize[1] / 2, 0]} raycast={() => null}>
            <boxGeometry args={overlaySize} />
            <meshBasicMaterial
              color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
              transparent
              opacity={selected || blocked ? 0.14 : interactionHovered ? 0.08 : 0.1}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[ringSize[0], ringSize[1], 32]} />
            <meshBasicMaterial
              color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
              transparent
              opacity={selected || blocked ? 1 : interactionHovered ? 0.35 : 0.7}
            />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
