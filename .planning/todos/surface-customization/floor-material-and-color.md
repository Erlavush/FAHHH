# TODO: Implement Floor Material and Color Customization

## Area: `surface-customization`
## Priority: `medium`

### Problem
Currently, the floor is a static asset or derived from a fixed theme. There is no way for the user to pick different materials (planks, concrete, carpet, metal) or change their colors.

### Proposed Solution
1. **Material Library**: Define a set of tiled PBR materials in `src/lib/roomMaterials.ts`.
2. **Surface Schema**: Update `RoomState` to include `floorMaterial` and `floorColor` fields.
3. **UI Picker**: Create a "Material Explorer" UI (Roblox-style) that allows clicking a surface and picking a new preset.
4. **Shaders**: Enhance `RoomShell.tsx` to apply the selected texture and tint color to the floor mesh.

### Proposed Materials
- [ ] Wood Planks
- [ ] Polished Concrete
- [ ] Plush Carpet
- [ ] Industrial Pavement
- [ ] Metal Plate
- [ ] Ceramic Tiles

### Progress Tracking
- [ ] Define `floorMaterial` and `floorColor` in `roomSchema`.
- [ ] Implement texture-swapping in `RoomShell.tsx`.
- [ ] Create basic "Material Picker" UI component.
- [ ] Synchronize surface changes in shared room sessions.
