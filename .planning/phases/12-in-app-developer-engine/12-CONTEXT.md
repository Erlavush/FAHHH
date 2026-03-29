# Phase 12: In-App Developer Engine Foundation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Source:** User Discussion Pivot

<domain>
## Phase Boundary

Build a visual dashboard in Developer Mode that utilizes Vite dev-server APIs to visually author, edit, and save content directly into the codebase without touching JSON/TS files manually.
</domain>

<decisions>
## Implementation Decisions

### Engine Architecture
- **D-01:** Instead of relying on manual coding or standalone Windows executables, the game engine will be embedded directly into the React app's `DeveloperWorkspace`.
- **D-02:** Local file system access will be achieved through a custom Vite Dev Server plugin (`inAppEditorPlugin`), ensuring changes are written back to the codebase automatically during local development.
- **D-03:** Production builds (`npm run build`) will strip this dev-server plugin, ensuring no security vulnerabilities or backend access to players.
- **D-04:** Content updates (like editing furniture price, grid size, or renaming a cat) will immediately hot-reload in the browser while simultaneously updating the `furnitureRegistry.ts` or `pets.ts` files automatically.

### UI Needs
- **D-05:** The Developer Workspace needs a "Content Manager" tab, shifting the user from VSCode to the browser UI.

### the agent's Discretion
- Form specific data contracts for the `fetch` API between the React UI and the Vite Plugin.
- Decide the exact layout of the Content Manager UI inside the existing Developer Workspace styling.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundational Configs
- `vite.config.js` — Core configuration where the new plugin must be registered.
- `scripts/sharedRoomDevPlugin.mjs` — Exists as a reference implementation for a Vite dev-server middleware hook.

### Core Domain
- `src/lib/furnitureRegistry.ts` — The initial target file that the Editor will need to read and write visually.
- `src/components/ui/DeveloperWorkspace.tsx` — The UI layer where the Content Manager dashboard will live.
</canonical_refs>

<specifics>
## Specific Ideas
- "Magic Save": You design everything in the browser, adjust coordinates, resize bounding boxes, click save... and the game updates perfectly in real-time, while simultaneously writing the source code into the repository.
</specifics>

<deferred>
## Deferred Ideas
- Modifying the initial level layout visually (saving X/Y/Z positions back to `defaultRoomState`), which will be tackled in subsequent engine expansion phases after the foundational saving loop is proven with the registry.
</deferred>

---
*Phase: 12-in-app-developer-engine*
