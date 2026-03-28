---
phase: 10-better-cats-variant-import
plan: 01
subsystem: cat-variant-import
tags: [better-cats, variants, presets, mob-lab, assets]
provides:
  - Repo-owned Better Cats coat and overlay assets copied out of the external download
  - Curated Better Cats variant manifest with stable ids, labels, preset ids, and texture paths
  - Checked-in Better Cats preset JSONs registered in the built-in Mob Lab library
key-files:
  created: [.planning/phases/10-better-cats-variant-import/10-01-SUMMARY.md, scripts/import_better_cat_variants.mjs, src/lib/catVariants.ts, tests/catVariants.test.ts, src/lib/mob-presets/better_cat_variant_tabby.json, src/lib/mob-presets/better_cat_variant_red.json, src/lib/mob-presets/better_cat_variant_calico.json, src/lib/mob-presets/better_cat_variant_siamese.json, src/lib/mob-presets/better_cat_variant_british_shorthair.json, src/lib/mob-presets/better_cat_variant_ragdoll.json, src/lib/mob-presets/better_cat_variant_black.json, src/lib/mob-presets/better_cat_variant_white.json]
  modified: [src/lib/mobLab.ts]
requirements-completed: [PETS-05]
duration: 1 session
completed: 2026-03-28
---

# Phase 10-01 Summary

**Repo-owned Better Cats variants, preset metadata, and Mob Lab registration**

## Accomplishments
- Added a repeatable importer that copies the curated first-wave Better Cats launch set from `C:\Users\user\Downloads\Better Cats v4.0 1.21.10` into repo-owned `public/textures/cats/better-cats/` assets.
- Added `BETTER_CAT_VARIANTS` as the stable source of truth for eight curated coats: `tabby`, `red`, `calico`, `siamese`, `british_shorthair`, `ragdoll`, `black`, and `white`.
- Generated eight checked-in Better Cats preset JSONs that all reuse `/models/better_cat.glb`, carry stable `variantId` values, and point at the repo-owned coat textures.
- Registered the curated preset files in `DEFAULT_IMPORTED_MOB_PRESETS` so Mob Lab can load them as built-in presets for the next runtime step.

## Verification
- Passed `cmd /c npm test -- --maxWorkers 1 tests/catVariants.test.ts`
- Passed `cmd /c npm run build`

## Next Readiness
- Phase 10-02 can now focus on teaching the Better Cats GLB runtime to honor preset-driven texture overrides instead of inventing ids, labels, or texture paths.
- The local adoption/runtime work in later plans can rely on stable preset ids without referencing the external Downloads folder.
