# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Active runtime integrations:**
- None in the current shipped `src/` runtime
  - The app is client-only and does not currently call a remote API from the active room, preview, or Mob Lab paths

**Legacy or placeholder integration footprints:**
- Firebase-shaped placeholder config
  - Files: `.env.example`, `database.rules.json`, `firestore.rules`
  - Dependency: `firebase` in `package.json`
  - Current state: no active imports found under `src/`, so this is not the current runtime path

## Data Storage

**Browser-local persistence:**
- `localStorage` for sandbox world data
  - File: `src/lib/devLocalState.ts`
  - Stores: skin, camera, player position, coins, room state, PC minigame progress, pets
- `localStorage` for world settings and UI state
  - File: `src/lib/devWorldSettings.ts`
  - Stores: world clock, lighting/debug settings, build mode, preview studio state
- `localStorage` for Mob Lab authoring data
  - File: `src/lib/mobLabState.ts`
  - Stores: preset library, active mob id, selected part per mob

**Static asset storage:**
- Local static assets under `public/`
  - `public/models/` - GLB models and imported assets
  - `public/textures/` - mob textures and placeholder textures
  - `public/shop-previews/` - mixed PNG/SVG preview art used by the furniture catalog

## Authentication & Identity

**Current auth provider:**
- None active
  - The local sandbox uses `LOCAL_SANDBOX_OWNER_ID` in `src/lib/roomState.ts`
  - This is a development/runtime placeholder, not a real identity system

**Future direction implied by repo state:**
- Shared-room pairing and auth are planned, but not implemented in the active code path

## Monitoring & Observability

**In-app runtime monitoring:**
- `src/app/components/PerformanceMonitor.tsx`
  - Purpose: live FPS HUD in the running app

**Remote error tracking / analytics:**
- None found in the active codebase

## CI/CD & Deployment

**Hosting:**
- No deployment target encoded in the repo
- The project builds as a Vite static app via `cmd /c npm run build`

**CI Pipeline:**
- No `.github/workflows/` directory found
- No repo-local CI configuration found in the workspace root

## Environment Configuration

**Development:**
- Optional placeholders in `.env.example` for Firebase-era settings
- Current local runtime does not require a live backend to run

**Staging / Production:**
- No separate environment definitions found in-repo
- No active secret-management or deployment metadata found in the workspace

## Webhooks & Callbacks

**Incoming:**
- None found

**Outgoing:**
- None found

---

*Integration audit: 2026-03-26*
*Update when adding/removing external services*

