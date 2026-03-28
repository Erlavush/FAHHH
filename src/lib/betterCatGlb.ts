export type BetterCatBodyVariant = "base" | "thin" | "fluffy";
export type BetterCatTailVariant = "normal" | "thin" | "fluffy" | "bob";
export type BetterCatEarVariant = "base" | "bent" | "big";

export type BetterCatGlbVariantSelection = {
  body?: BetterCatBodyVariant;
  tail?: BetterCatTailVariant;
  ear?: BetterCatEarVariant;
};

const BODY_VARIANT_MESH_NAMES: Record<BetterCatBodyVariant, string[]> = {
  base: ["base"],
  thin: ["thinbase"],
  fluffy: ["fluffybase"]
};

const TAIL_VARIANT_MESH_NAMES: Record<BetterCatTailVariant, string[]> = {
  normal: ["normaltail", "normaltip", "normaltip_1"],
  thin: ["thintail", "thintail2"],
  fluffy: ["flufftail", "flufftip", "flufftip_1"],
  bob: ["bobtail", "bobtailtip"]
};

const EAR_VARIANT_MESH_NAMES: Record<BetterCatEarVariant, string[]> = {
  base: ["ear2", "ear3"],
  bent: ["ear4", "ear5"],
  big: ["ear6", "ear7"]
};

const ALWAYS_HIDDEN_MESH_TOKENS = ["small_leg"];

export const DEFAULT_BETTER_CAT_GLB_VARIANT: Required<BetterCatGlbVariantSelection> = {
  body: "base",
  tail: "normal",
  ear: "bent"
};

function getOtherVariantMeshNames<T extends string>(selected: T, meshNamesByVariant: Record<T, string[]>): string[] {
  return (Object.entries(meshNamesByVariant) as Array<[T, string[]]>)
    .filter(([variant]) => variant !== selected)
    .flatMap(([, meshNames]) => meshNames);
}

export function getBetterCatHiddenMeshNames(
  selection: BetterCatGlbVariantSelection = DEFAULT_BETTER_CAT_GLB_VARIANT
): string[] {
  const resolved = {
    ...DEFAULT_BETTER_CAT_GLB_VARIANT,
    ...selection
  };

  return [
    ...getOtherVariantMeshNames(resolved.body, BODY_VARIANT_MESH_NAMES),
    ...getOtherVariantMeshNames(resolved.tail, TAIL_VARIANT_MESH_NAMES),
    ...getOtherVariantMeshNames(resolved.ear, EAR_VARIANT_MESH_NAMES)
  ];
}

export function shouldHideBetterCatMesh(
  meshName: string,
  selection: BetterCatGlbVariantSelection = DEFAULT_BETTER_CAT_GLB_VARIANT
): boolean {
  const normalizedName = meshName.toLowerCase();

  if (ALWAYS_HIDDEN_MESH_TOKENS.some((token) => normalizedName.includes(token))) {
    return true;
  }

  return getBetterCatHiddenMeshNames(selection).includes(normalizedName);
}
