---
phase: 11
slug: player-shell-inventory-shop-and-pet-care-overhaul
status: approved
shadcn_initialized: false
preset: none
created: 2026-03-28
reviewed_at: 2026-03-28T04:04:07.2518335+08:00
---

# Phase 11 - UI Design Contract

> Visual and interaction contract for frontend phases. Generated for Phase 11: Player Shell Inventory, Shop, and Pet Care Overhaul.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | none |
| Component library | existing custom React components plus the current `src/components/ui/*.tsx` shell primitives |
| Icon library | existing repo HUD art only; no new external icon library |
| Font | Drawer labels and chrome: current player-shell display stack / `Trebuchet MS` family. Body copy: `Source Sans 3`. Numeric accent only: `CatClockSevenSegment` for short chips or readouts when needed, never for paragraphs |

---

## Visual Direction

Build the drawer as a warm companion to the bottom HUD and digital cat clock, not as a leftover AMOLED admin panel.

- The drawer should feel like a carved side cabinet or clockwork sidecar attached to the room shell.
- Use warm walnut, brass, cream, and amber tones instead of neutral black/white glass.
- Separate purpose first: `Inventory`, `Shop`, and `Pet Care` must read as different destinations before the player reads the card content.
- Keep the player shell cozy and readable. No debug labels, raw preset IDs, or tool-facing authoring jargon in shipped player mode.
- Preserve the bottom HUD's compactness. The drawer can become richer, but the persistent HUD should not become wider or louder.

---

## Surface Contract

| Surface | Contract |
|---------|----------|
| Drawer shell | One player-facing drawer or sheet with a framed header, wallet chip, and explicit top-level mode switch |
| `Inventory` | Stored/owned furniture only: counts, previews, `Place`, `Sell`, and info actions |
| `Shop` | Furniture purchases plus cat adoption entries only. No active pet-care buttons |
| `Pet Care` | Active cats, stored cats, care-needed state, and `Feed`, `Pet`, `Play`, `Store`, `Activate`, `Remove` actions |
| Shared-room mode | Keep current single-companion truth. The `Pet Care` surface may become a shared-companion info state, but it must not expose local multi-cat sandbox controls |
| Developer-only authoring | `Open Studio` and `Open Mob Lab` remain hidden or explicitly dev-gated in player mode |

---

## Layout Contract

### Drawer Layout

- Keep one primary drawer anchored to the player shell.
- Desktop target width: `420px` to `460px`.
- Mobile target width: near-full-width bottom sheet or side sheet at `<= 900px`.
- Header order: title, short helper text, wallet chip, then top-level mode switch.
- Modes appear before the content list. Do not make the player scroll to discover that `Pet Care` is separate.

### Inventory Layout

- Lead with stored furniture and placement actions.
- Keep preview art and quick counts visible near the item name.
- The default action hierarchy is `Place` first, `Sell` second, info third.
- Do not place cat-care buttons or cat adoption cards in this surface.

### Shop Layout

- Lead with buying/adoption clarity: item name, price, short purpose, CTA.
- Furniture purchases and cat adoption may share the surface, but they need separate section headers.
- Price treatment should feel brighter and more market-like than `Inventory`, but still within the same warm shell.
- Do not mix `Store`, `Activate`, or `Feed` / `Pet` / `Play` actions into the shop cards.

### Pet Care Layout

- Active cats come first.
- Stored cats come second.
- Care-needed cards use the strongest attention treatment inside the drawer, but still warm and calm, not alarm-red by default.
- Care actions should be grouped together and easy to tap without looking like store buttons.
- If shared-room mode cannot support local multi-cat care, show a clear shared-companion info state rather than fake local controls.

---

## Interaction Contract

| Interaction | Contract |
|-------------|----------|
| Open drawer | Existing inventory dock affordance opens the drawer; do not add multiple new always-visible dock buttons by default |
| Switch modes | Mode switch is always visible at the top of the drawer. Mode changes should not close the drawer |
| Inventory entry | Default drawer mode is `Inventory` unless the player explicitly comes from a care shortcut |
| Care shortcut | When cats need care, the player shell may offer one secondary shortcut labeled `Open Pet Care` |
| Shop actions | Buying and adoption actions stay in `Shop` and do not silently reroute into `Inventory` |
| Shared-room pet care | Shared-room mode may show a `Pet Care` tab, but the content must remain shared-room-safe and single-companion truthful |
| Authoring shortcuts | Player mode must not make Preview Studio or Mob Lab look like normal room actions |

---

## Responsive Contract

- At `<= 900px`, the drawer becomes a bottom sheet or wide side sheet with the mode switch still pinned near the top.
- At `<= 900px`, mode switch controls must stay large enough for thumb taps and must remain visible without horizontal scrolling.
- Card grids inside the drawer collapse to one column on mobile.
- The bottom HUD must remain visible enough that the room still feels present behind the drawer.
- Do not move the drawer's navigation into the bottom HUD on mobile.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | inline chip gaps, icon offsets |
| sm | 8px | compact button spacing, stat gaps |
| md | 12px | card internals, chip padding |
| lg | 16px | default drawer padding and section spacing |
| xl | 24px | section separation and framed header breathing room |
| 2xl | 32px | large drawer gaps and mobile sheet padding |
| 3xl | 48px | major shell offset and safe-area breathing room |

Exceptions: `44px` minimum tap target for interactive tabs and primary action buttons

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 500 | 1.4 |
| Label | 11px | 800 | 1.1 |
| Heading | 18px | 800 | 1.1 |
| Display | 28px | 400 | 1.0 |

Typography rules:
- Drawer chrome and tab labels should feel like the HUD, with short punchy wording.
- Use body font for descriptions, helper copy, and care hints.
- Reserve seven-segment styling for short numeric readouts only.
- Do not use generic all-caps system pills that ignore the existing warm shell tone.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#4A2913` | drawer shell backgrounds, framed headers, heavy card surfaces |
| Secondary (30%) | `#F3DFBA` | cream ink, plaque fills, stat chips, label highlights |
| Accent (10%) | `#E3A84A` | active tab, primary CTA, care-needed emphasis, focused price glow |
| Destructive | `#B24D49` | remove, sell, or destructive confirmations only |

Supporting tones allowed:
- `#2D1609` for deeper surface shadows
- `#6D3516` for warm raised edges and darker buttons
- `#FFF3DE` for the brightest readable text
- `#FFCF88` for soft highlight glows and focused accents

Accent reserved for:
- active drawer mode
- primary buy/adopt CTA
- one care-needed emphasis state
- keyboard focus ring

Do not use accent on every chip, every section header, or every secondary button.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Drawer mode | `Inventory` |
| Drawer mode | `Shop` |
| Drawer mode | `Pet Care` |
| Inventory empty state | `No furniture stored yet.` |
| Shop helper | `Buy decor and adopt cats here.` |
| Pet Care helper | `Take care of the cats already in your room.` |
| Care-needed badge | `Needs care` |
| Shared-room fallback | `Shared companion care uses the room interaction flow right now.` |
| Companion shortcut | `Open Pet Care` |

Copy rules:
- Keep player-facing labels short and calm.
- Avoid words like `preset`, `registry`, `sandbox`, or `debug` in shipped player surfaces.
- The drawer should sound like part of the room, not a tools menu.

---

## Component Notes

- Split the current drawer content into dedicated section components rather than keeping one giant mixed JSX surface.
- The mode switch should look like plaques, toggles, or carved tabs that visually belong beside the clock and bottom dock.
- `Inventory` buttons should feel practical and room-builder oriented.
- `Shop` buttons should feel transactional but still cozy.
- `Pet Care` buttons should feel caretaker-focused and softer than store CTAs.
- Shared-room mode must not imply that local multi-cat management exists there.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable - shadcn is not initialized in this brownfield repo |
| third-party registries | none | do not introduce a new UI registry for this phase |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-28
