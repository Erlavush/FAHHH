import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { ImportedMobPreset } from "../../lib/mobLab";
import { ImportedMobActor } from "./ImportedMobActor";

function GrassBlockPlatform() {
  const blockMaterials = useMemo(
    () => [
      new MeshStandardMaterial({ color: "#7b4f2d", roughness: 1 }),
      new MeshStandardMaterial({ color: "#7b4f2d", roughness: 1 }),
      new MeshStandardMaterial({ color: "#4db652", roughness: 0.96 }),
      new MeshStandardMaterial({ color: "#5b3822", roughness: 1 }),
      new MeshStandardMaterial({ color: "#7b4f2d", roughness: 1 }),
      new MeshStandardMaterial({ color: "#7b4f2d", roughness: 1 })
    ],
    []
  );

  const blocks = useMemo(() => {
    const nextBlocks: Array<[number, number, number]> = [];

    for (let x = -2; x <= 2; x += 1) {
      for (let z = -2; z <= 2; z += 1) {
        nextBlocks.push([x, -0.2, z]);
      }
    }

    return nextBlocks;
  }, []);

  return (
    <group>
      {blocks.map((position) => (
        <mesh key={`${position[0]}-${position[2]}`} position={position} material={blockMaterials} receiveShadow castShadow>
          <boxGeometry args={[1, 0.4, 1]} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[5.1, 5.1]} />
        <meshStandardMaterial color="#4db652" roughness={0.98} />
      </mesh>
    </group>
  );
}

function MobLabScene({
  preset,
  selectedPartId
}: {
  preset: ImportedMobPreset;
  selectedPartId: string | null;
}) {
  const stageTarget = preset.stage.cameraTarget;

  return (
    <>
      <color attach="background" args={["#8cc9ff"]} />
      <PerspectiveCamera
        makeDefault
        fov={34}
        near={0.1}
        far={100}
        position={preset.stage.cameraPosition}
        onUpdate={(camera) => {
          camera.lookAt(stageTarget[0], 0, stageTarget[2]);
          camera.updateProjectionMatrix();
        }}
      />
      <ambientLight intensity={1.15} />
      <hemisphereLight intensity={0.38} groundColor="#68523c" color="#d6f0ff" />
      <directionalLight castShadow intensity={1.8} color="#ffe0b3" position={[4.8, 7.5, 4.6]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight intensity={0.46} color="#a8d2ff" position={[-4.4, 4.8, -3.6]} />
      <group position={[0, 0, 0]}>
        <GrassBlockPlatform />
        <Suspense fallback={null}>
          <ImportedMobActor preset={preset} selectedPartId={selectedPartId} shadowsEnabled />
        </Suspense>
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom
        makeDefault
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2.2}
        minPolarAngle={Math.PI / 5}
        target={[stageTarget[0], 0, stageTarget[2]]}
      />
    </>
  );
}

export function MobLabStage({
  preset,
  selectedPartId,
  stageKey
}: {
  preset: ImportedMobPreset;
  selectedPartId: string | null;
  stageKey: string;
}) {
  return (
    <Canvas key={stageKey} dpr={[1, 1.8]} shadows>
      <MobLabScene preset={preset} selectedPartId={selectedPartId} />
    </Canvas>
  );
}
