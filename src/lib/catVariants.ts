export type BetterCatVariantId =
  | "tabby"
  | "red"
  | "calico"
  | "siamese"
  | "british_shorthair"
  | "ragdoll"
  | "black"
  | "white";

export type BetterCatVariant = {
  id: BetterCatVariantId;
  label: string;
  presetId: string;
  coatTextureSrc: string;
  eyeOverlayTextureSrc?: string;
  eyeEmissiveTextureSrc?: string;
  whiskersTextureSrc?: string;
  sourceTextureName: string;
  sourceRandomEntityProperties?: string;
};

const BETTER_CAT_OVERLAY_TEXTURES = {
  eyes: "/textures/cats/better-cats/overlays/cat_eyes.png",
  eyesEmissive: "/textures/cats/better-cats/overlays/cat_eyes_e.png",
  whiskers: "/textures/cats/better-cats/overlays/whiskers.png"
} as const;

export const BETTER_CAT_VARIANTS: readonly BetterCatVariant[] = [
  {
    id: "tabby",
    label: "Tabby Cat",
    presetId: "better_cat_variant_tabby",
    coatTextureSrc: "/textures/cats/better-cats/coats/tabby.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "tabby.png",
    sourceRandomEntityProperties: "tabby.properties"
  },
  {
    id: "red",
    label: "Red Cat",
    presetId: "better_cat_variant_red",
    coatTextureSrc: "/textures/cats/better-cats/coats/red.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "red.png",
    sourceRandomEntityProperties: "red.properties"
  },
  {
    id: "calico",
    label: "Calico Cat",
    presetId: "better_cat_variant_calico",
    coatTextureSrc: "/textures/cats/better-cats/coats/calico.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "calico.png",
    sourceRandomEntityProperties: "calico.properties"
  },
  {
    id: "siamese",
    label: "Siamese Cat",
    presetId: "better_cat_variant_siamese",
    coatTextureSrc: "/textures/cats/better-cats/coats/siamese.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "siamese.png",
    sourceRandomEntityProperties: "siamese.properties"
  },
  {
    id: "british_shorthair",
    label: "British Shorthair Cat",
    presetId: "better_cat_variant_british_shorthair",
    coatTextureSrc: "/textures/cats/better-cats/coats/british_shorthair.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "british_shorthair.png",
    sourceRandomEntityProperties: "british_shorthair.properties"
  },
  {
    id: "ragdoll",
    label: "Ragdoll Cat",
    presetId: "better_cat_variant_ragdoll",
    coatTextureSrc: "/textures/cats/better-cats/coats/ragdoll.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "ragdoll.png",
    sourceRandomEntityProperties: "ragdoll.properties"
  },
  {
    id: "black",
    label: "Black Cat",
    presetId: "better_cat_variant_black",
    coatTextureSrc: "/textures/cats/better-cats/coats/black.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "black.png",
    sourceRandomEntityProperties: "black.properties"
  },
  {
    id: "white",
    label: "White Cat",
    presetId: "better_cat_variant_white",
    coatTextureSrc: "/textures/cats/better-cats/coats/white.png",
    eyeOverlayTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyes,
    eyeEmissiveTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.eyesEmissive,
    whiskersTextureSrc: BETTER_CAT_OVERLAY_TEXTURES.whiskers,
    sourceTextureName: "white.png",
    sourceRandomEntityProperties: "white.properties"
  }
] as const;
