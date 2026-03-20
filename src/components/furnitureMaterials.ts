type FurnitureMaterialState = {
  blocked: boolean;
  selected: boolean;
  hovered: boolean;
  interactionHovered: boolean;
};

type CozyMaterialConfig = {
  baseColor: string;
  activeColor?: string;
  hoverColor?: string;
  blockedColor?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  selectedOpacity?: number;
  hoveredOpacity?: number;
  interactionOpacity?: number;
  blockedOpacity?: number;
  emissiveColor?: string;
  activeEmissiveColor?: string;
  hoverEmissiveColor?: string;
  blockedEmissiveColor?: string;
  emissiveIntensity?: number;
  activeEmissiveIntensity?: number;
  hoverEmissiveIntensity?: number;
  blockedEmissiveIntensity?: number;
};

const DEFAULT_ACTIVE_COLOR = "#57db8d";
const DEFAULT_HOVER_COLOR = "#7bc4f8";
const DEFAULT_BLOCKED_COLOR = "#ef6f7c";

function resolveColor(
  state: FurnitureMaterialState,
  config: CozyMaterialConfig
): string {
  if (state.blocked) {
    return config.blockedColor ?? DEFAULT_BLOCKED_COLOR;
  }

  if (state.selected) {
    return config.activeColor ?? DEFAULT_ACTIVE_COLOR;
  }

  if (state.hovered || state.interactionHovered) {
    return config.hoverColor ?? DEFAULT_HOVER_COLOR;
  }

  return config.baseColor;
}

function resolveOpacity(
  state: FurnitureMaterialState,
  config: CozyMaterialConfig
): number {
  if (state.blocked) {
    return config.blockedOpacity ?? config.selectedOpacity ?? 0.72;
  }

  if (state.selected) {
    return config.selectedOpacity ?? 0.72;
  }

  if (state.hovered) {
    return config.hoveredOpacity ?? 0.9;
  }

  if (state.interactionHovered) {
    return config.interactionOpacity ?? 0.8;
  }

  return config.opacity ?? 1;
}

function resolveEmissiveColor(
  state: FurnitureMaterialState,
  config: CozyMaterialConfig
): string {
  if (state.blocked) {
    return config.blockedEmissiveColor ?? config.emissiveColor ?? "#000000";
  }

  if (state.selected) {
    return config.activeEmissiveColor ?? config.emissiveColor ?? "#000000";
  }

  if (state.hovered || state.interactionHovered) {
    return config.hoverEmissiveColor ?? config.emissiveColor ?? "#000000";
  }

  return config.emissiveColor ?? "#000000";
}

function resolveEmissiveIntensity(
  state: FurnitureMaterialState,
  config: CozyMaterialConfig
): number {
  if (state.blocked) {
    return config.blockedEmissiveIntensity ?? config.emissiveIntensity ?? 0;
  }

  if (state.selected) {
    return config.activeEmissiveIntensity ?? config.emissiveIntensity ?? 0;
  }

  if (state.hovered || state.interactionHovered) {
    return config.hoverEmissiveIntensity ?? config.emissiveIntensity ?? 0;
  }

  return config.emissiveIntensity ?? 0;
}

export function createCozyMaterialProps(
  state: FurnitureMaterialState,
  config: CozyMaterialConfig
) {
  const opacity = resolveOpacity(state, config);

  return {
    color: resolveColor(state, config),
    transparent: opacity < 0.999,
    opacity,
    roughness: config.roughness ?? 0.84,
    metalness: config.metalness ?? 0.04,
    emissive: resolveEmissiveColor(state, config),
    emissiveIntensity: resolveEmissiveIntensity(state, config)
  };
}
