# TODO: Create Ceiling Furniture Set

## Area: `furniture-system`
## Priority: `low`

### Problem
New rooftop/ceiling surfaces need appropriate decorations. Initially, we need a "Starter Set" of overhead items.

### Proposed Items
1. **Ceiling Light**: A basic source of overhead illumination (requires point-light support in `RoomSceneLighting`).
2. **Ceiling Fan**: A decorative overhead item with rotation animation.
3. **Ceiling Decoration**: General "top" surface items like paper lanterns, hanging plants, or crown molding.

### Progress Tracking
- [x] Implement `ceiling` surface tag in `furnitureRegistry.ts`.
- [x] Add 3D assets for ceiling light and fan.
- [x] Update `FurniturePreviewStudio` to support ceiling-mounted items.
- [x] Set prices and purchase entries in the catalog.

### Implemented
- Ceiling catalog entries now ship for `ceiling_light`, `ceiling_fan`, and `hanging_plant`, all using the live `ceiling` placement family.
- Procedural runtime models now exist in `src/components/CeilingFurnitureModels.tsx`, including warm local light support for the ceiling light and idle blade animation for the fan.
- `FurniturePreviewStudio` now renders the ceiling set with dedicated preview framing instead of treating them like floor or wall assets.
- Shop preview art now exists under `public/shop-previews/`, and the runtime lighting pass now counts ceiling lights as practical nighttime lighting.
