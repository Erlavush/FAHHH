# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.7.x - all shipped application logic in `src/` and the automated tests in `tests/`

**Secondary:**
- JavaScript (ES modules) - build and tool configuration in `vite.config.js`
- JavaScript (Node ESM) - one-off asset generation script in `scripts/generate_minecraft_vanilla_cat_rig.mjs`
- JSON - imported mob presets in `src/lib/mob-presets/`, environment example data in `.env.example`, and legacy Firebase rules files in `database.rules.json` and `firestore.rules`

## Runtime

**Environment:**
- Browser runtime - the game itself runs as a client-side React app with WebGL and `localStorage`
- Node.js 20.x compatible toolchain - required for `vite`, `vitest`, `tsc`, and the asset generation script

**Package Manager:**
- npm - inferred from `package-lock.json`
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.3.1 - shell state and UI composition in `src/App.tsx`
- React DOM 18.3.1 - browser mount in `src/main.tsx`
- `@react-three/fiber` 8.17.14 - 3D scene integration for `RoomView` and Preview Studio
- `three` 0.173.0 - cameras, math, rendering primitives, GLB helpers
- `@react-three/drei` 9.122.0 - scene helpers such as cameras, controls, and convenience components

**Testing:**
- Vitest 3.0.5 - unit and hook-style tests under `tests/`
- jsdom 26.0.0 - browser-like environment for DOM and `localStorage` tests
- `@testing-library/jest-dom` 6.6.3 - matcher extension dependency, though current tests mostly use Vitest built-ins

**Build/Dev:**
- Vite 6.0.1 - dev server, bundle orchestration, and test config host in `vite.config.js`
- TypeScript 5.7.2 - type-checking via `tsc --noEmit -p tsconfig.app.json`
- Leva 0.10.1 - dev-only control surface used through `DevPanel` and hidden Leva state in `src/App.tsx`

## Key Dependencies

**Critical:**
- `@react-three/fiber` - binds React state to the live 3D room and Preview Studio stages
- `@react-three/drei` - camera and control helpers used across `src/components/RoomView.tsx` and `src/components/FurniturePreviewStudio.tsx`
- `@react-three/postprocessing` and `postprocessing` - ambient occlusion, bloom, vignette, and color grading in `src/components/room-view/RoomPostProcessing.tsx`
- `three` - core render/math dependency for scene code, collision transforms, imported-model work, and the mob rig generator script
- `leva` - powers the current in-app debug and lighting tuning workflow

**Infrastructure:**
- `firebase` 11.0.2 - dependency still present for future connected features, but the active `src/` runtime does not currently import it

## Configuration

**Environment:**
- `.env.example` defines Firebase-shaped `VITE_FIREBASE_*` placeholders
- The active runtime is still local-first and can boot without those values

**Build:**
- `vite.config.js` defines the React plugin, test environment, and manual chunk splitting for `mob-lab`, vendor groups, and post-processing
- `tsconfig.json` and `tsconfig.app.json` define the TypeScript project setup

## Platform Requirements

**Development:**
- Windows/macOS/Linux with Node.js and npm
- Browser with WebGL support for the live room and preview stages
- No local database or Docker dependency in the active runtime

**Production:**
- Static web hosting capable of serving the Vite build output
- Browser access to `localStorage` for the current solo sandbox and Mob Lab persistence model

---

*Stack analysis: 2026-03-26*
*Update after major dependency changes*

