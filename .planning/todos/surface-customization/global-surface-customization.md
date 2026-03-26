# TODO: Implement Global Surface Customization (Roblox-Style)

## Area: `surface-customization`
## Priority: `medium`

### Problem
Room surfaces (Floor, Walls, Ceiling) are mostly static. There is no system for users to customize individual surface materials (wood, concrete, tiles) or colors, which limits personalization.

### Proposed Solution
1. **Material Library**: Define a unified PBR material library in `src/lib/roomMaterials.ts`.
2. **Schema Update**: Update `RoomState` with per-surface `materialId` and `tintColor` (HEX).
3. **Wall Height**: Add a global `wallHeight` parameter to the room metadata and ensure `RoomShell.tsx` renders accordingly.
4. **Painter Tool**: Implement a tool that applies a selected material/color to the clicked surface (Floor, Left Wall, Back Wall, etc.).

### Proposed Materials
- [x] Wood Planks
- [x] Polished Concrete
- [x] Plush Carpet
- [x] Industrial Pavement
- [x] Metal Plate
- [x] Ceramic Tiles
- [ ] Painted Drywall (for walls)
- [ ] Exposed Brick (for walls)

### Progress Tracking
- [ ] Implement `wallHeight` configuration in room schema.
- [ ] Update `RoomShell.tsx` to use dynamic height for wall meshes.
- [ ] Create basic "Surface Picker" UI.
- [ ] Set up tinting and texture-swapping for all surfaces.
