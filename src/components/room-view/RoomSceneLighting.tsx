import type { WorldLightingState } from "../../lib/worldLighting";

type RoomSceneLightingProps = {
  ambientLightIntensity: number;
  hemisphereGroundColor: string;
  hemisphereLightIntensity: number;
  hemisphereSkyColor: string;
  lightingState: WorldLightingState;
  moonOpacity: number;
  moonShadowMapSize: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  pointLightVisible: boolean;
  shadowsEnabled: boolean;
  sunEnabled: boolean;
  sunLightEnabled: boolean;
  sunLightIntensity: number;
  sunShadowMapSize: number;
  sunShadowNormalBias: number;
  sunShadowRadius: number;
};

export function RoomSceneLighting({
  ambientLightIntensity,
  hemisphereGroundColor,
  hemisphereLightIntensity,
  hemisphereSkyColor,
  lightingState,
  moonOpacity,
  moonShadowMapSize,
  pointLightIntensity,
  pointLightPosition,
  pointLightVisible,
  shadowsEnabled,
  sunEnabled,
  sunLightEnabled,
  sunLightIntensity,
  sunShadowMapSize,
  sunShadowNormalBias,
  sunShadowRadius
}: RoomSceneLightingProps) {
  return (
    <>
      <ambientLight intensity={ambientLightIntensity} color="#ffd7b0" />
      <hemisphereLight
        intensity={hemisphereLightIntensity}
        groundColor={hemisphereGroundColor}
        color={hemisphereSkyColor}
      />
      {pointLightVisible ? (
        <pointLight
          position={pointLightPosition}
          color="#ffcf9f"
          intensity={pointLightIntensity}
          distance={13.5}
          decay={2.2}
        />
      ) : null}
      {sunEnabled ? (
        <>
          <mesh position={lightingState.moonPosition} raycast={() => null}>
            <sphereGeometry args={[0.48, 10, 10]} />
            <meshBasicMaterial
              color={lightingState.moonColor}
              toneMapped={false}
              transparent
              opacity={moonOpacity}
            />
          </mesh>
          <directionalLight
            castShadow={shadowsEnabled && sunLightEnabled}
            intensity={sunLightIntensity}
            color={lightingState.sunColor}
            position={lightingState.sunPosition}
            shadow-mapSize-width={sunShadowMapSize}
            shadow-mapSize-height={sunShadowMapSize}
            shadow-bias={-0.00028}
            shadow-normalBias={sunShadowNormalBias}
            shadow-radius={sunShadowRadius}
          >
            <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 50]} />
          </directionalLight>
          <directionalLight
            castShadow={false}
            intensity={lightingState.moonIntensity}
            color={lightingState.moonColor}
            position={lightingState.moonPosition}
            shadow-mapSize-width={moonShadowMapSize}
            shadow-mapSize-height={moonShadowMapSize}
            shadow-bias={-0.00018}
            shadow-normalBias={0.012}
            shadow-radius={4.8}
          >
            <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 50]} />
          </directionalLight>
        </>
      ) : null}
    </>
  );
}
