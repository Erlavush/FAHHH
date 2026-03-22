import { memo } from "react";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  ToneMapping,
  Vignette
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

type RoomPostProcessingProps = {
  bloomIntensity: number;
  bloomThreshold: number;
  brightness: number;
  contrast: number;
  multisampling: number;
  saturation: number;
  shouldApplyBrightnessContrast: boolean;
  shouldApplyHueSaturation: boolean;
  shouldUseAmbientOcclusion: boolean;
  shouldUseBloom: boolean;
  vignetteDarkness: number;
  vignetteOffset: number;
  aoIntensity: number;
  aoRadius: number;
};

export const RoomPostProcessing = memo(function RoomPostProcessing({
  bloomIntensity,
  bloomThreshold,
  brightness,
  contrast,
  multisampling,
  saturation,
  shouldApplyBrightnessContrast,
  shouldApplyHueSaturation,
  shouldUseAmbientOcclusion,
  shouldUseBloom,
  vignetteDarkness,
  vignetteOffset,
  aoIntensity,
  aoRadius
}: RoomPostProcessingProps) {
  const passes = [];

  if (shouldUseAmbientOcclusion) {
    passes.push(
      <N8AO
        key="ao"
        aoRadius={aoRadius}
        intensity={aoIntensity}
        color="#000000"
      />
    );
  }

  if (shouldUseBloom) {
    passes.push(
      <Bloom
        key="bloom"
        luminanceThreshold={bloomThreshold}
        mipmapBlur
        intensity={bloomIntensity}
      />
    );
  }

  passes.push(
    <ToneMapping key="tonemap" mode={ToneMappingMode.ACES_FILMIC} />,
    <Vignette
      key="vignette"
      eskil={false}
      offset={vignetteOffset}
      darkness={vignetteDarkness}
    />
  );

  if (shouldApplyHueSaturation) {
    passes.push(
      <HueSaturation key="saturation" hue={0} saturation={saturation - 1} />
    );
  }

  if (shouldApplyBrightnessContrast) {
    passes.push(
      <BrightnessContrast
        key="contrast"
        brightness={brightness}
        contrast={contrast}
      />
    );
  }

  return (
    <EffectComposer multisampling={multisampling}>{passes}</EffectComposer>
  );
});
