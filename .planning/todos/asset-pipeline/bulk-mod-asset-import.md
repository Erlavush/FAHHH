# TODO: Establish Bulk Import Pipeline for Minecraft Mod Assets

## Area: `asset-pipeline`
## Priority: `medium`

### Problem
Manual asset-by-asset importing is too slow for building a massive furniture catalog. We need a streamlined process to extract and refine objects from open-source Minecraft mods (CurseForge/Modrinth).

### Proposed Solution
1. **Extraction Script**: Create a tool to unzip `.jar` files and identify JSON/GLB models and `.png` textures.
2. **Metadata Generation**: Automatically generate `ImportedMobPreset` or furniture JSON structures for each extracted object.
3. **PBR Conversion**: Ensure textures are correctly mapped (diffuse, normal, roughness) for the project's Three.js environment.
4. **Surface Categorization**: Rules to auto-assign extracted objects to 'floor', 'wall', or 'ceiling' based on their bounding box or name.

### Target Sources
- [ ] CurseForge: Major furniture and decoration mods (e.g., MrCrayfish, Decocraft).
- [ ] Modrinth: Modern open-source decor mods.

### Progress Tracking
- [ ] Create a prototype `.jar` extraction script.
- [ ] Implement a batch "GLB Refresher" to fix common Minecraft export hierarchy issues.
- [ ] Bulk-import the first "Home Decor" set (10+ items).
- [ ] Update Catalog UI to handle hundreds of items efficiently.
