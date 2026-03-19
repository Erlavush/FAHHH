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
  Object3D,
  Vector3
} from "three";

export const PACK_MODEL_PATH = "/models/fnaf-minecraft-pizzeria-mini-pack/source/demopack.gltf";

type PreparedPackAsset = {
  root: Group;
  materials: Material[];
};

export interface PackAssetModelProps {
  nodeNames: string[];
  targetSize: {
    width: number;
    height: number;
    depth: number;
  };
  overlaySize: [number, number, number];
  ringSize?: [number, number];
  modelOffset?: [number, number, number];
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  fallbackColor?: string;
}

function cloneMaterial(material: Material): Material {
  return material.clone();
}

function preparePackAssetObject(
  sourceNodes: Object3D[],
  targetSize: PackAssetModelProps["targetSize"]
): PreparedPackAsset {
  const rootSource = new Group();
  sourceNodes.forEach((sourceNode) => {
    rootSource.add(sourceNode.clone(true));
  });

  const materials: Material[] = [];

  rootSource.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => {
        const nextMaterial = cloneMaterial(material);
        materials.push(nextMaterial);
        return nextMaterial;
      });
      return;
    }

    const nextMaterial = cloneMaterial(child.material);
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

export function PackAssetModel({
  nodeNames,
  targetSize,
  overlaySize,
  ringSize = [0.5, 0.64],
  modelOffset = [0, 0, 0],
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown,
  fallbackColor = "#d9dee8"
}: PackAssetModelProps) {
  const gltf = useGLTF(PACK_MODEL_PATH);
  const nodeSignature = nodeNames.join("|");
  const preparedAsset = useMemo(() => {
    const sourceNodes = nodeNames
      .map((nodeName) => gltf.scene.getObjectByName(nodeName))
      .filter((node): node is Object3D => node !== undefined);

    if (sourceNodes.length !== nodeNames.length) {
      return null;
    }

    return preparePackAssetObject(sourceNodes, targetSize);
  }, [gltf.scene, nodeSignature, targetSize.width, targetSize.height, targetSize.depth]);

  useEffect(() => {
    if (!preparedAsset) {
      return;
    }

    preparedAsset.root.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = shadowsEnabled;
        child.receiveShadow = shadowsEnabled;
      }
    });
  }, [preparedAsset, shadowsEnabled]);

  useEffect(() => {
    if (!preparedAsset) {
      return;
    }

    const tintColor = blocked
      ? new Color("#ff7b88")
      : selected
        ? new Color("#5cff98")
        : hovered || interactionHovered
          ? new Color("#7cc8ff")
          : null;
    const opacity = blocked || selected ? 0.78 : hovered ? 0.9 : interactionHovered ? 0.8 : 1;

    preparedAsset.materials.forEach((material) => {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
      material.depthWrite = opacity >= 0.999;

      if (material instanceof MeshStandardMaterial) {
        material.emissive.copy(tintColor ?? new Color("#000000"));
        material.emissiveIntensity = tintColor
          ? blocked
            ? 0.42
            : selected
              ? 0.28
              : hovered
                ? 0.2
                : 0.14
          : 0;
      }

      material.needsUpdate = true;
    });
  }, [blocked, hovered, interactionHovered, preparedAsset, selected]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      {preparedAsset ? (
        <group position={modelOffset}>
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
          <mesh position={[0, overlaySize[1] / 2, 0]}>
            <boxGeometry args={overlaySize} />
            <meshBasicMaterial
              color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
              transparent
              opacity={selected || blocked ? 0.14 : interactionHovered ? 0.08 : 0.1}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

useGLTF.preload(PACK_MODEL_PATH);
