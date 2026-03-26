# TODO: Import More Variants from "Better Cats" GLB

## Area: `pet-system`
## Priority: `high`

### Background (The "Better Cats" Recipe)
The "Better Cats" models (exported from Blockbench) are highly complex because they contain multiple mesh variations ($thin, $fluff, $bobtail, $ear1-5) in a single file. Our custom `GlbMobPreviewActor` has a specialized filter pipeline (lines 36-58) that is required to make these look correct.

### The "Hard" Parts to Remember
1. **Mesh Filtering**: Must specifically keep `ear4` and `ear5` while hiding other `ear` variations.
2. **Hierarchy Correction**: The tail is broken on export; we MUST manually `tailBase.attach(tailTip)` in the code (L54-58).
3. **Variant Selection**: Future variants (Orange Tabby, Calico, etc.) will likely require different filtering strings or different texture files from the "Better Cats v4.0" download.

### Goals
- [ ] Import "Ginger Tabby" variant.
- [ ] Import "Calico" variant.
- [ ] Import "Siamese" variant.
- [ ] Implement a `variantId` in `ImportedMobPreset` to allow the `GlbMobPreviewActor` to switch these mesh filters dynamically.

### Progress Tracking
- [ ] Confirm filtering logic works for other skins in the Better Cats pack.
- [ ] Extract and optimize .png textures for new variants.
- [ ] Create `.json` presets for each new cat species.
