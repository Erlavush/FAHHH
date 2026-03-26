---
phase: 02
slug: live-presence-and-co-op-consistency
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-03-26
---

# Phase 2 - UI Design Contract

> Visual and interaction contract for frontend phases. Generated for Phase 2: Live Presence and Co-op Consistency.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none - continue with custom React + CSS primitives already used in `src/styles.css` |
| Icon library | none - prefer text-first controls, subtle status pills, and minimal inline SVG only when clarity requires it |
| Font | Display: Georgia, "Times New Roman", serif. Body/UI: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif. Code/status: "Consolas", "Courier New", monospace |

---

## Visual Direction

Phase 2 should make the room feel inhabited by another person without turning the experience into a multiplayer dashboard.

Visual mood:
- warm plaster room backdrop remains dominant
- live presence cues feel airy, soft, and human rather than technical
- partner state should read through the avatar, a small name label, and quiet room-edge status surfaces
- concurrent edit feedback should be noticeable but never panic-inducing
- preserve the repo's existing cozy-glass and dusk-slate language instead of inventing a new HUD style

Core rule:
- the room stays primary; presence UI should hug the scene, not cover it

Development rule:
- while the dev bypass is active, the pairing/opening shell and the `Shared room` strip stay hidden
- the shipped UI contract still defines those surfaces so the real player-facing build has a stable target later

---

## Surface Inventory

Phase 2 UI must explicitly cover these surfaces:

1. Remote partner in-room presence
   - full Minecraft-style remote avatar
   - subtle always-readable name label
   - live, holding, reconnecting visual treatment

2. Presence status layer
   - subtle shared-room/presence strip or chip row near the toolbar in shipped builds
   - join, leave, reconnect, and quiet confirmation states
   - no giant notifications or permanent dashboard

3. Busy-item feedback
   - same-item lock cue on the furniture being edited by the partner
   - lightweight helper copy when the local player tries to edit a busy item
   - no whole-room modal lock

4. Join, leave, and reconnect feedback
   - player can remain in the room when the partner is absent
   - reconnecting state is visible but non-blocking
   - partner return is acknowledged quietly

5. Development bypass treatment
   - dev builds auto-enter the shared room
   - dev builds hide pairing/opening/invite surfaces
   - dev builds hide the `Shared room` strip above the game while iterating

6. Blocking canonical room states
   - keep Phase 1 blocking overlay for real room-authority failures only
   - live presence absence/reconnect must not escalate into full-screen blocking UI by default

Out of scope for this UI contract:
- chat
- emotes
- progression/streak surfaces
- breakup warnings
- redesigning Preview Studio, Mob Lab, or the dev panel

---

## Layout Contract

### Room First

- The room scene remains the visual center of the experience on desktop and mobile.
- Remote partner presence is primarily read inside the scene, not from external panels.
- The existing toolbar keeps its current top-left shell position.
- Do not introduce a dedicated multiplayer sidebar, friends panel, or persistent room-members roster.

### Presence Status Placement

- In shipped/player-facing mode, presence status should live near the existing shared-room shell surfaces, adjacent to the toolbar and not buried inside the inventory panel.
- The status surface must be smaller and calmer than Phase 1's invite-sharing emphasis once both players are already in the room.
- Desktop: one compact strip or grouped pill row near the toolbar.
- Mobile: collapse status into one stacked or wrapped row without horizontal scrolling.

### In-Scene Presence

- The partner name label should float above the avatar head and stay legible against both bright and dark room areas.
- Busy-item treatment should appear close to the item or selection UI, not detached in a random global banner.
- Reconnecting treatment should first preserve the partner's last known in-room position, then visibly soften/fade that actor state before marking them reconnecting.

### Development Bypass Layout

- In development mode, the live room should appear immediately without the entry shell.
- In development mode, the `Shared room` strip above the game should not occupy vertical space.
- Hiding those surfaces in development must not force a different room layout structure in shipped mode later.

---

## Interaction Contract

### Presence and Movement

- Remote movement must feel smooth and alive; never intentionally snap the partner between normal updates.
- The partner avatar should clearly indicate direction/facing through body orientation, not just status text.
- If presence updates stall briefly, hold the avatar in place for a short grace period before shifting into reconnecting treatment.
- Do not instantly delete the avatar on the first missed update.

### Join, Leave, and Reconnect

- The local player can enter and keep using the room even if the partner is absent.
- Join, leave, reconnect, and return states should be announced through subtle status updates, not toasts or modals.
- Reconnect recovery should feel quiet: the avatar returns, the label/state updates, and play continues.
- Presence events should never eject the player from the room or hide the builder UI by default.

### Same-Item Lock Feedback

- If the partner is editing an item, the local player should see that the item is busy before they commit to editing it.
- Busy feedback must be clear enough to explain why editing is blocked, but subtle enough to avoid making the room feel error-heavy.
- Different-item edits remain allowed and should not show scary global warnings.
- Avoid whole-room "someone is editing" overlays.

### Development Bypass

- In development, auto-enter happens without extra clicks.
- Development bypass should not flash the entry shell briefly before hiding it.
- Hidden player-facing surfaces must remain real components, not dead code paths.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Label gaps, tiny status separations, avatar label internals |
| sm | 8px | Chip gaps, compact status spacing, small control spacing |
| md | 16px | Standard pill/card internals and grouped control spacing |
| lg | 24px | Toolbar/status grouping, reconnect card internals, dock spacing |
| xl | 32px | Major shell spacing and desktop status breathing room |
| 2xl | 48px | Overlay padding and major section spacing |
| 3xl | 64px | Full-height centered overlay spacing only |

Exceptions:
- avatar name labels may use 6px internal padding if needed to stay visually balanced at small scale

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 500 | 1.5 |
| Label | 11px | 700 | 1.15 |
| Heading | 24px | 700 | 1.1 |
| Display | 34px | 700 | 1.02 |

Typography rules:
- Use serif display only for shell titles, blocking overlays, and other high-emotion or high-focus headers.
- Use sans-serif for all in-room presence states, name labels, item-lock copy, and toolbar/status UI.
- Use monospace only for room ids, technical readouts, and any remaining invite/status code treatment inherited from Phase 1.
- Do not introduce Inter, Roboto, Arial, or a new default system stack.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (55%) | `#F4EADF` | Backdrop wash, room-shell atmosphere, light fallback surfaces |
| Secondary (25%) | `#273241` | Presence strips, name-label shells, overlays, dusk glass panels |
| Presence Accent (10%) | `#89B7D8` | Remote-presence labels, reconnecting/live cues, subtle presence emphasis only |
| Success Support (5%) | `#6FAF83` | Positive shared-sync confirmations and non-blocking recovered states |
| Attention (5%) | `#D9B07C` | Busy-item state, edit-lock hints, cautionary but non-destructive UI |
| Destructive | `#C74F5A` | Real blocking failures and destructive warnings only |

Presence accent reserved for:
- partner name label shell or outline
- reconnecting/live indicator treatment
- subtle in-room presence emphasis

Attention reserved for:
- busy-item outline, chip, or helper text
- edit-lock explanation states

Never use accent or attention for:
- every toolbar button
- dev controls
- unrelated inventory controls
- decorative borders with no state meaning

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Partner joined | `Partner joined` |
| Partner reconnecting | `Partner reconnecting` |
| Partner returned | `Partner is back` |
| Partner absent state | `Waiting for partner` |
| Busy item title | `Your partner is editing this item` |
| Busy item helper | `Try another item or wait a moment.` |
| Reconnecting helper | `Holding the last known partner position while presence reconnects.` |
| Non-blocking live state | `Together now` |

Copy rules:
- Use `partner`, `together`, and `shared room`; avoid `server`, `session host`, or broad multiplayer jargon.
- Presence states should read warm and human, not network-diagnostic.
- Busy-item copy should explain the block without sounding like an error log.
- Development-only hidden surfaces do not need special player-facing copy because they are suppressed during development.

---

## Component Contract

### Remote Partner Avatar

- Reuse the current Minecraft-style visual language.
- Avatar must support movement, facing, and interaction poses.
- Reconnecting state may use desaturation, soft fade, or label-state changes, but should not become a ghostly horror effect.
- The remote actor remains visually secondary to the local player but clearly readable.

### Partner Name Label

- Small pill or chip above the avatar head.
- Always visible during normal play.
- Label includes player display name and optional subtle state treatment.
- Keep the label compact; never turn it into a big floating card.

### Presence Status Strip

- Shipped builds: compact status surface near the toolbar for join/leave/reconnect and quiet room-presence confirmation.
- Development builds: hidden while auto-enter bypass is active.
- Do not reuse Phase 1 invite-sharing emphasis when the room already has two active partners.

### Busy-Item Cue

- Visual cue may combine:
  - subtle item highlight/tint
  - lightweight chip near edit UI
  - small inline helper message
- Cue must clearly map to one furniture item, not the whole room.

### Blocking Overlay

- Reuse the Phase 1 blocking overlay only for true canonical room reload or authority failures.
- Presence disconnection alone is not a blocking overlay condition.

### Development Bypass

- Auto-enter behavior belongs in the runtime bootstrap path.
- Entry shell and shared-room strip stay implemented for the real build, but are suppressed in development mode.
- Avoid duplicated "dev-only" fake versions of those components.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| Existing repo custom CSS primitives | shared-room glass shells, pill buttons, status strips, overlays, in-scene labels, edit dock primitives | preserve current `src/styles.css` naming and layering patterns; no new external UI registry in Phase 2 |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-26
