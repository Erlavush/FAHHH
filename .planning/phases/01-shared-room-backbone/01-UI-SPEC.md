---
phase: 01
slug: shared-room-backbone
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-03-26
---

# Phase 1 - UI Design Contract

> Visual and interaction contract for frontend phases. Generated for Phase 1: Shared Room Backbone.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none - continue with custom React + CSS primitives already used in `src/styles.css` |
| Icon library | none - prefer text-first controls and minimal inline SVG only when clarity requires it |
| Font | Display: Georgia, "Times New Roman", serif. Body/UI: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif. Code/status: "Consolas", "Courier New", monospace |

---

## Visual Direction

Phase 1 should feel like a meaningful transition from "local test sandbox" to "our shared room" without looking like enterprise multiplayer tooling.

Visual mood:
- warm plaster backdrop and dusk-blue glass panels
- rounded pill controls, not sharp admin-console chrome
- invitation and sync states should feel intimate and calm, not technical
- preserve the repo's existing cozy-glass card language rather than introducing a new design system

Core rule:
- player-facing shared-room entry surfaces should look more curated and romantic than the dev toolbar, but they must still belong to the current app shell

---

## Surface Inventory

Phase 1 UI must explicitly cover these surfaces:

1. Pairing entry shell
   - split create/join treatment in one centered card or modal shell
   - lightweight profile naming field
   - clear "create shared room" vs "join with code" choice

2. Invite sharing state
   - invite code card
   - copy action
   - waiting-for-partner status
   - partner-joined success transition

3. Join flow
   - join code input
   - invalid / expired / already-used invite handling
   - loading state while canonical room is fetched

4. Shared-room status layer
   - visible room identity indicator
   - sync/loading/reload state
   - non-blocking confirmation that edits are shared and canonical

5. Inventory wording updates
   - inventory language must reflect couple-owned/shared room inventory
   - no solo ownership phrasing in player-facing copy

6. Reconnect and canonical reload states
   - loading overlay when fetching latest shared room
   - clear retry path on failure
   - explicit warning that unconfirmed local edits are discarded on reload

Out of scope for this UI contract:
- live partner avatar presence
- chat
- progression/streak UI
- breakup flow UI

---

## Layout Contract

### Entry Before Room Load

- Use a centered modal-like shell over the existing warm scene backdrop, not a separate full app route.
- Desktop layout: two-column emphasis inside the shell only if the content remains readable at `960px` width or less.
- Mobile layout: stack create/join sections vertically with the primary action always visible without horizontal scrolling.
- The first screen should present exactly two primary paths:
  - `Create Shared Room`
  - `Join with Code`

### Shared Room After Pairing

- Keep the existing top-left toolbar location; do not move all global controls.
- Add one shared-room identity strip near the toolbar rather than scattering status chips across the screen.
- Shared-room state indicators should sit above or beside the toolbar, not inside the inventory panel.
- Do not cover the main room view with persistent large panels once pairing is complete.

### Status Presentation

- Loading, syncing, and reconnecting states should appear in one consistent location.
- Use compact banners or pills for transient status.
- Use a centered overlay only for blocking states:
  - initial shared-room load
  - reconnect fetch
  - unrecoverable shared-room load failure

---

## Interaction Contract

### Pairing Flow

- `Create Shared Room` is the default primary path.
- `Join with Code` is the secondary primary path in the same shell, not hidden behind a link maze.
- Invite code should be visually chunked and easy to read/copy.
- Copy success feedback must be immediate and quiet, e.g. a small status chip or inline confirmation.
- Waiting state should reassure the creator that the room is ready and reserved.

### Join Flow

- Join code input must accept pasted codes cleanly.
- Validation errors appear inline below the field, not as browser alerts.
- Join action stays disabled until the entered code reaches valid shape.
- If join fails, keep the typed code in place so the user can correct it.

### Shared Edit Feedback

- Confirmed room edits should feel shared, but Phase 1 must avoid noisy "multiplayer" theatrics.
- Show lightweight save feedback such as:
  - `Saving shared room...`
  - `Shared room updated`
  - `Reloading latest room...`
- Never imply live collaborative dragging in Phase 1.

### Reconnect Behavior

- On reconnect, the user sees a blocking reload state rather than stale room UI pretending to be current.
- If canonical reload fails, present:
  - what went wrong
  - a retry action
  - a return-to-pairing fallback only if reload truly cannot recover

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline status spacing |
| sm | 8px | Pill gaps, compact action spacing |
| md | 16px | Default card internals and form spacing |
| lg | 24px | Panel padding and grouped section spacing |
| xl | 32px | Major shell gaps and desktop split spacing |
| 2xl | 48px | Modal breathing room and major section breaks |
| 3xl | 64px | Full-height centered layout spacing |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 500 | 1.5 |
| Label | 12px | 700 | 1.2 |
| Heading | 24px | 700 | 1.1 |
| Display | 34px | 700 | 1.02 |

Typography rules:
- Use serif display only for page-shell titles, pairing headlines, and high-emotion state headers.
- Use sans-serif for controls, forms, status text, and explanatory copy.
- Use monospace only for invite codes, room ids, and technical status readouts.
- Avoid introducing Inter, Roboto, Arial, or a new generic system font stack.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F4EADF` | App backdrop wash, canvas fallback backdrop, pairing background atmosphere |
| Secondary (30%) | `#273241` | Shared-room cards, modal shells, glass panels, status trays |
| Accent (10%) | `#6FAF83` | `Create Shared Room`, `Join with Code`, copy-success state, positive sync confirmation only |
| Destructive | `#C74F5A` | Invalid destructive actions, blocking failures, discard/reload warnings only |

Accent reserved for:
- create/join primary CTA
- copy invite confirmation
- shared-room synced success state
- active pairing success transition

Never use accent for:
- every button
- passive labels
- inventory secondary actions
- decorative borders

Supporting neutrals may continue the existing panel palette from `src/styles.css`, but they must stay subordinate to the dominant/secondary/accent roles above.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Create Shared Room` |
| Empty state heading | `Start your room together` |
| Empty state body | `Create a shared room or enter an invite code to pair with your partner and load the same room.` |
| Error state | `We couldn't load the shared room. Retry to fetch the latest room state.` |
| Destructive confirmation | `Reload latest room`: `Any unconfirmed local changes will be discarded before the shared room reloads.` |

Additional locked copy:
- Join action label: `Join with Code`
- Waiting state title: `Room ready to share`
- Code helper text: `Send this code to your partner so they can join your room.`
- Shared inventory label: `Shared Inventory`

Copy rules:
- Use "shared room", "partner", and "together"; do not use lobby/server jargon.
- Avoid "sandbox" in player-facing UI.
- Avoid implying a broad multiplayer system; keep language intimate and one-room specific.

---

## Component Contract

### Pairing Shell

- One rounded modal/card shell with warm backdrop separation
- supports tabs or segmented controls for create vs join
- title + short emotional explanation + action zone

### Invite Code Card

- monospace code treatment
- one primary copy button
- one calm waiting-state line beneath

### Shared Status Strip

- compact pill or chip row near toolbar
- room identity, sync state, and reconnect state only
- must not expand into a large dashboard

### Shared Inventory Panel

- continue using the existing `spawn-panel` and `spawn-card` visual family
- rename wording from solo room language to shared-inventory language
- avoid redesigning the whole inventory panel in Phase 1

### Blocking Overlay

- used only for initial shared load, reconnect fetch, and unrecoverable shared-room failure
- centered panel with one clear primary action and one fallback action at most

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| Existing repo custom CSS primitives | toolbar pills, glass panels, card shells, modal overlays, status chips | preserve current `src/styles.css` naming and layering patterns; no new external UI registry in Phase 1 |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-26
