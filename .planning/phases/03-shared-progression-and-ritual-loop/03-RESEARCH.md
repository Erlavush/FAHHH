# Phase 03: Shared Progression and Ritual Loop - Research

**Researched:** 2026-03-27
**Domain:** Shared-room progression, ritual persistence, and shell UI integration
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Personal Progression and Shared Room Economy
- **D-01:** Phase 3 introduces per-partner progression records with personal coins, XP, and level while the room's `ownedFurniture` inventory remains couple-owned.
- **D-02:** Room purchases should spend the active partner's personal coins, but the purchased furniture becomes shared room ownership immediately.
- **D-03:** The old single shared-coin surface stops being the primary player-facing economy once personal progression exists; migration should preserve room purchasing power without silently duplicating or deleting value.
- **D-04:** Progression stays lightweight and room-centric for jam scope; no secondary currencies, skill trees, or broad quest systems in Phase 3.

### Couple Ritual and Streak Rules
- **D-05:** The first daily ritual should reuse the existing desk-PC loop rather than inventing a brand-new gameplay surface.
- **D-06:** A ritual day completes when both partners each finish one desk-PC check-in for that room day; the two completions may happen asynchronously.
- **D-07:** Normal desk-PC runs keep granting personal rewards, while the first full couple ritual completion of the day grants the extra ritual bonus and advances the shared streak.
- **D-08:** Ritual and streak evaluation use one canonical room-day boundary per couple instead of each client's local midnight.
- **D-09:** Missing the ritual for a full room day resets the streak; reconnects and reloads inside the same room day must preserve partial ritual progress.

### Progression and Ritual UI Surfaces
- **D-10:** Progression feedback must live in the main room shell rather than only in debug tools or hidden menus.
- **D-11:** The toolbar should surface the active player's personal wallet and level progress, while the shared-room status layer should surface couple streak and today's ritual state.
- **D-12:** The desk-PC overlay should show personal reward results plus ritual contribution, daily bonus, and streak feedback when a run completes.
- **D-13:** UI should remain subtle and room-first, reusing the current toolbar/status-strip language instead of introducing a standalone progression dashboard.

### Persistence and Authority
- **D-14:** Personal progression and couple ritual/streak data belong in authoritative shared-room progression state that loads and reloads with the canonical room.
- **D-15:** Phase 3 should extend the current shared-room document/store boundary instead of creating a second gameplay save path or routing progression through presence transport.

### the agent's Discretion
- Exact XP curve, level thresholds, and ritual bonus numbers.
- Exact migration math from current `sharedCoins` into the Phase 3 progression model, as long as player-visible value is preserved and not silently duplicated.
- Exact naming/copy for the first ritual as long as it stays warm, room-centered, and obviously daily.
- Exact visualization for streak chips, progress bars, and empty states within the existing shell.

### Deferred Ideas (OUT OF SCOPE)
- Multiple ritual variants or ritual rotation (`RITL-02`) after the first daily loop is stable.
- Additional minigames or second earn loops beyond the desk PC.
- Shared room growth meters, quest logs, or broader RPG-style progression surfaces.
- Memory objects, pet expansion, and breakup/reset semantics.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROG-01 | Each partner has persistent individual coins and level progression. | Canonical `progression.players[playerId]` schema, migration off `sharedCoins`, personal wallet spend rules, per-player `deskPc` persistence, toolbar selectors. |
| PROG-02 | Couple has a shared streak that updates from repeatable room activity. | Canonical `progression.couple` ritual state, authoritative room-day key, partial completion persistence, missed-day reset rules, one atomic ritual completion path. |
| PROG-03 | Shared progression state is visible in the UI and survives refresh and reconnect. | Toolbar/status-strip/PC-overlay surface plan, split invite chrome from progression status, shared-room document authority, reload-safe ritual day advancement, test coverage. |
| RITL-01 | Couple can complete at least one daily quest or ritual that grants progression. | Desk-PC check-in ritual recommendation, per-day contribution records, first-full-completion bonus to both partners, reconnect-safe asynchronous completion. |
</phase_requirements>

## Summary

Phase 3 should not add a second save path, a global client store, or a new minigame. The correct move is to extend the existing authoritative `SharedRoomDocument` with a nested progression object, migrate legacy `sharedCoins` into personal player wallets once, and route all progression-affecting actions through the shared-room store boundary that already owns create, load, reload, and commit behavior.

The main brownfield constraint is that the current shared runtime still treats the entire room document plus `sharedCoins` as one client-derived snapshot. That is adequate for Phase 1 and Phase 2 room edits, but it is risky for progression because stale full-document writes can erase partner rewards or ritual state. The planner should therefore center Phase 3 around pure progression mutation helpers, load-time migration, and one authoritative room-day key derived from store time, not from the world clock or client midnight.

The UI work is smaller than the data work but has one important trap: development bypass currently hides the entire `SharedRoomStatusStrip`, so real progression feedback would be invisible during iteration if that gate remains unchanged. Split temporary invite identity UI from progression status UI, keep the room shell subtle, and show personal wallet/XP in the toolbar, couple streak/ritual state in the shared status layer, and reward plus ritual outcome in the desk-PC results card.

**Primary recommendation:** Replace writable `sharedCoins` with a canonical nested progression model, persist ritual progress by authoritative room-day key, and apply desk-PC completions as shared-room mutations that can update both partners atomically when the daily ritual completes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 installed | Existing app-shell and room UI | Already owns `App.tsx`, toolbar/status surfaces, and current shared-room orchestration. |
| TypeScript | 5.9.3 installed | Shared document types, selectors, and migration helpers | The progression work is schema-heavy and should stay strongly typed. |
| Vite | 6.4.1 installed | Dev runtime plus file-backed shared-room middleware | The shared-room dev plugin already lives in `vite.config.js` and `scripts/sharedRoomDevPlugin.mjs`. |
| Vitest | 3.2.4 installed | Regression coverage for schema, runtime, and ritual rules | Existing shared-room, presence, and PC minigame tests already follow this path. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@testing-library/jest-dom` | 6.6.3 declared | Hook and DOM assertions in jsdom | Only for UI/hook assertions that need DOM semantics. |
| Native `Date` / ISO strings | Browser + Node built-in | Authoritative room-day key derivation | Use for UTC `YYYY-MM-DD` day keys instead of adding a date library in Phase 3. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App selectors plus pure progression helpers | Zustand or Redux | Unnecessary new store layer for one brownfield phase; adds migration overhead without solving authority. |
| Native UTC day keys | `date-fns` or `dayjs` | A full date library is unnecessary for one canonical room-day boundary and increases surface area. |
| Wrapping `pcMinigame.ts` with shared progression helpers | Moving ritual logic into `PcMinigameOverlay.tsx` | UI-owned progression logic would become hard to test and easy to desync on reload. |

**Installation:**
```bash
# None. Reuse the current installed stack.
```

**Version verification:** Verified on 2026-03-27.
- Installed versions: `react 18.3.1`, `vite 6.4.1`, `vitest 3.2.4`, `typescript 5.9.3` via `npm ls`.
- Registry latest versions: `react 19.2.4` (modified 2026-03-25), `vite 8.0.3` (modified 2026-03-26), `vitest 4.1.2` (modified 2026-03-26), `typescript 6.0.2` (modified 2026-03-24) via `npm view`.
- Recommendation: do not fold a foundation-package upgrade into Phase 3. The planner should stay on the installed brownfield stack.

## Architecture Patterns

### Recommended Project Structure
```text
src/
|-- app/components/                 # Toolbar, status-strip, inventory, and desk-PC result surfaces
|-- app/hooks/                      # Shared-room runtime orchestration
|-- lib/sharedProgression.ts        # New pure progression, ritual, and migration helpers
|-- lib/sharedProgressionTypes.ts   # New progression schema types
|-- lib/sharedRoomTypes.ts          # Extend shared-room document shape
|-- lib/sharedRoomValidation.ts     # Accept and normalize legacy/v2 documents
`-- lib/pcMinigame.ts               # Keep base PC scoring and cooldown math pure

tests/
|-- sharedProgression.test.ts
|-- sharedRoomRuntime.test.ts
|-- sharedRoomStore.test.ts
|-- sharedRoomValidation.test.ts
`-- pcMinigame.test.ts
```

### Pattern 1: Canonical nested progression in the shared-room document
**What:** Add a single authoritative `progression` object to `SharedRoomDocument` instead of spreading progression across `App.tsx`, `devLocalState.ts`, and the desk-PC overlay.
**When to use:** For all shared progression, ritual, and streak reads/writes.
**Example:**
```typescript
export interface SharedPlayerProgression {
  playerId: string;
  coins: number;
  xp: number;
  level: number;
  deskPc: PcMinigameProgress;
  updatedAt: string;
}

export interface SharedCoupleRitualDay {
  dayKey: string;
  completionsByPlayerId: Partial<Record<string, {
    source: "desk_pc";
    completedAt: string;
    score: number;
    rewardCoins: number;
  }>>;
  completedAt: string | null;
  bonusAppliedAt: string | null;
}

export interface SharedCoupleProgression {
  streakCount: number;
  longestStreakCount: number;
  lastCompletedDayKey: string | null;
  ritual: SharedCoupleRitualDay;
  updatedAt: string;
}

export interface SharedRoomProgressionState {
  version: 1;
  players: Record<string, SharedPlayerProgression>;
  couple: SharedCoupleProgression;
  migratedFromSharedCoins: number | null;
}
```
Source: repo synthesis based on `src/lib/sharedRoomTypes.ts`, `src/lib/pcMinigame.ts`, and `03-CONTEXT.md`.

### Pattern 2: Load-time migration from legacy `sharedCoins`
**What:** Accept legacy Phase 1 and Phase 2 room documents, upgrade them to the new progression shape on load, and write the upgraded shape back to the dev DB so the migration is not re-run every time.
**When to use:** In `loadSharedRoomInDatabase`, `bootstrapDevSharedRoomInDatabase`, `createSharedRoomInDatabase`, and any validation path that can encounter older documents.
**Example:**
```typescript
export function upgradeLegacyRoomProgression(
  roomDocument: SharedRoomDocumentLegacy | SharedRoomDocumentV2,
  nowIso: string
): SharedRoomDocumentV2 {
  if ("progression" in roomDocument) {
    return ensureProgressionMembers(roomDocument, nowIso);
  }

  const memberIds = roomDocument.memberIds;
  const distributedCoins = splitLegacyCoins(roomDocument.sharedCoins, memberIds);

  return {
    ...roomDocument,
    progression: {
      version: 1,
      players: Object.fromEntries(
        memberIds.map((playerId, index) => [
          playerId,
          createInitialPlayerProgression(playerId, distributedCoins[index] ?? 0, nowIso)
        ])
      ),
      couple: createEmptyCoupleProgression(toRoomDayKey(nowIso), nowIso),
      migratedFromSharedCoins: roomDocument.sharedCoins
    }
  };
}
```
Source: repo synthesis based on `src/lib/sharedRoomValidation.ts`, `scripts/sharedRoomDevPlugin.mjs`, and `.data/shared-room-dev-db.json`.

### Pattern 3: Apply desk-PC completions as authoritative progression mutations
**What:** Keep `pcMinigame.ts` responsible only for base score and cooldown math, then wrap it with a shared progression helper that can update personal coins/XP, mark ritual contribution, and award the daily bonus plus streak if the second partner completes the day.
**When to use:** On desk-PC run completion in shared-room mode.
**Example:**
```typescript
export function applyDeskPcCompletionToProgression(input: {
  document: SharedRoomDocumentV2;
  actorPlayerId: string;
  result: PcMinigameResult;
  nowIso: string;
}) {
  const nextDocument = advanceRitualDayIfNeeded(input.document, input.nowIso);
  const player = nextDocument.progression.players[input.actorPlayerId];
  const nextDeskPc = applyPcMinigameResult(player.deskPc, input.result);
  const roomDayKey = toRoomDayKey(input.nowIso);

  updatePlayerReward(nextDocument, input.actorPlayerId, input.result.rewardCoins, gainXp(input.result));
  markDailyDeskPcContribution(nextDocument, input.actorPlayerId, roomDayKey, input.result, input.nowIso);

  if (ritualJustCompleted(nextDocument, roomDayKey)) {
    awardDailyRitualBonusToBothPartners(nextDocument, input.nowIso);
    incrementCoupleStreak(nextDocument, roomDayKey, input.nowIso);
  }

  nextDocument.progression.players[input.actorPlayerId].deskPc = nextDeskPc;
  return nextDocument;
}
```
Source: repo synthesis based on `src/lib/pcMinigame.ts`, `src/App.tsx`, and `03-CONTEXT.md`.

### Pattern 4: Split temporary invite chrome from progression status chrome
**What:** Continue hiding room identity and invite code in dev bypass if needed, but stop hiding the entire progression/status surface behind `!devBypassActive`.
**When to use:** While wiring `SharedRoomStatusStrip` and toolbar progression feedback.
**Example:** `SharedRoomStatusStrip` should render streak and ritual chips in dev builds even if the invite code card stays hidden.

### Recommended Sequencing
1. Extend shared-room types and validation to accept a nested `progression` object plus legacy `sharedCoins`.
2. Add migration helpers and write-back upgrade logic in the dev shared-room store.
3. Add pure progression selectors and mutation helpers for personal wallet, XP/level, ritual day, and streak state.
4. Replace `App.tsx` selectors and UI props that still assume one `playerCoins` or `sharedCoins` source.
5. Wrap desk-PC completion, buy, and sell flows through progression-aware mutations.
6. Add shell UI surfaces and regression tests after the data path is authoritative.

### Anti-Patterns to Avoid
- **Dual writable wallet sources:** Do not keep `sharedCoins` and personal coins both writable after migration. One must become read-only during the transition, then removed.
- **World-clock rituals:** Do not derive ritual days from `useSandboxWorldClock`, local midnight, or any client-set time controls.
- **Shared progression in `devLocalState.ts`:** Shared mode must not trust `cozy-room-dev-world-data-v1` for authoritative coins, ritual, or desk-PC stats.
- **UI-owned reward logic:** Do not let `PcMinigameOverlay.tsx` or `SceneToolbar.tsx` become the source of truth for progression math.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared progression authority | A second local save path or a presence-side cache | The existing `SharedRoomDocument` plus `SharedRoomStore` boundary | Keeps reload, session, and canonical room ownership rules in one place. |
| Daily ritual day boundary | Client-midnight logic or world-clock math | Store-time UTC day keys such as `YYYY-MM-DD` | It is deterministic across refresh, reconnect, and two time zones. |
| XP, level, and streak math | Inline `setState` math spread across `App.tsx` handlers | A pure `sharedProgression` domain module | Makes migration and reload-safe testing possible. |
| Shared-room desk-PC stats | Local-only `pcMinigameProgress` while shared room is active | Per-player canonical `deskPc` state inside progression | Preserves cooldown and history across refresh and avoids reward drift. |
| Progression visibility in dev | Piggybacking all status UI on the existing invite/status strip gate | A split status surface with progression always visible in shared mode | Otherwise Phase 3 UI cannot be iterated in the current dev bypass. |

**Key insight:** The expensive mistakes in this phase are authority duplication and stale snapshot overwrites, not missing widgets. Planner effort should bias toward schema, mutation boundaries, and tests first.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `.data/shared-room-dev-db.json` currently stores `rooms[*].sharedCoins` and already has at least one live room document with `sharedCoins: 180`. Browser local storage key `cozy-room-dev-world-data-v1` still stores solo `playerCoins` and `pcMinigame`. | **Data migration:** upgrade stored shared-room documents from top-level `sharedCoins` to nested `progression`. **Code edit:** shared-room mode must stop treating local `playerCoins` and local `pcMinigame` as authority. |
| Live service config | None found. Shared-room persistence is the file-backed Vite plugin in `scripts/sharedRoomDevPlugin.mjs`, not an external service dashboard. | None - verified by repo inspection. |
| OS-registered state | None found in repo-controlled runtime. No `pm2`, `systemd`, `launchd`, or Task Scheduler registration artifacts were found in the workspace. | None - verified by workspace inspection only. |
| Secrets/env vars | Firebase-shaped placeholders exist in `.env.example`, but no progression-specific secret names or live env-var readers were found in the active `src/` runtime. Shared-room progression does not currently depend on secret-backed config. | None for Phase 3. Keep progression logic independent from stale Firebase placeholders. |
| Build artifacts | `dist/` exists and `node_modules` are installed. Built assets will not reflect schema or type changes until rebuild. | **Code edit/build step:** run `cmd /c npm run build` after implementation. No data migration needed. |

**Nothing else found:** There is no evidence that ritual, streak, or progression state currently lives in presence snapshots, authoring-tool state, or external service configuration.

## Common Pitfalls

### Pitfall 1: Stale full-document commits erase partner rewards
**What goes wrong:** One partner's desk-PC reward or ritual completion disappears after the other partner commits a later snapshot.
**Why it happens:** The current dev store still treats the shared room as a whole-document overwrite and does not use `expectedRevision` defensively.
**How to avoid:** Apply progression mutations against the latest authoritative room document inside the store, or reload and replay the mutation before saving.
**Warning signs:** Wallet totals move backward, streak chips flicker after simultaneous activity, or partner reward history differs after reload.

### Pitfall 2: Partial ritual progress is only stored when both partners finish
**What goes wrong:** The first partner's daily check-in is lost on refresh or reconnect, so the couple cannot finish the ritual asynchronously.
**Why it happens:** It is tempting to treat ritual completion as one boolean instead of a per-player contribution record for the current room day.
**How to avoid:** Persist each partner's current-day desk-PC completion immediately under `progression.couple.ritual.completionsByPlayerId`.
**Warning signs:** "Waiting on partner" progress disappears after reload or the same player can contribute twice in one room day.

### Pitfall 3: The first finisher never receives the daily ritual bonus
**What goes wrong:** The second partner sees streak advancement, but the first partner's wallet/XP stays unchanged until they play again or never updates at all.
**Why it happens:** The bonus is awarded only to the currently active finisher instead of to both canonical player records when the ritual closes.
**How to avoid:** When the second completion lands, update both personal progression records and the couple streak in one authoritative mutation.
**Warning signs:** Offline partner reconnects and does not see the bonus, or the second finisher receives a larger total payout than the first.

### Pitfall 4: Ritual day uses local time or the world clock
**What goes wrong:** Two partners see different ritual resets or the ritual can be manipulated with dev time controls.
**Why it happens:** The project already has a client-side world clock, and it is easy to confuse that visual clock with authoritative daily progression time.
**How to avoid:** Derive a canonical room-day key from store time only and keep it independent from rendering time-of-day state.
**Warning signs:** Changing time controls changes ritual status, or partners in different time zones disagree on whether "today" is complete.

### Pitfall 5: Progression UI disappears in development builds
**What goes wrong:** The planner thinks the shell surfaces exist, but the dev bypass still hides the status strip and the team cannot exercise the streak/ritual loop.
**Why it happens:** `App.tsx` currently hides `SharedRoomStatusStrip` entirely when `devBypassActive` is true.
**How to avoid:** Split the invite/identity strip from the progression/status strip, or make the latter render even in dev bypass mode.
**Warning signs:** Toolbar is the only visible progression surface or ritual state cannot be manually verified during local iteration.

## Code Examples

Verified patterns from repo sources:

### Legacy migration entry point
```typescript
export function loadSharedRoomInDatabase(database: SharedRoomDevDatabase, roomId: string) {
  const rawRoomDocument = database.rooms[roomId];
  if (!rawRoomDocument) {
    throw new SharedRoomHttpError("Shared room not found", 404);
  }

  const upgradedRoomDocument = upgradeLegacyRoomProgression(rawRoomDocument, new Date().toISOString());
  database.rooms[roomId] = upgradedRoomDocument;
  return validateSharedRoomDocument(upgradedRoomDocument);
}
```
Source: repo synthesis based on `scripts/sharedRoomDevPlugin.mjs` and `src/lib/sharedRoomValidation.ts`.

### Toolbar-level selector
```typescript
export function selectActivePlayerProgression(
  progression: SharedRoomProgressionState,
  session: SharedRoomSession | null
) {
  const playerId = session?.playerId;
  return playerId ? progression.players[playerId] ?? null : null;
}
```
Source: repo synthesis based on `src/app/hooks/useSharedRoomRuntime.ts` and `src/App.tsx`.

### Ritual banner view model
```typescript
export function buildRitualBanner(input: {
  couple: SharedCoupleProgression;
  session: SharedRoomSession;
}) {
  const today = input.couple.ritual;
  const selfDone = Boolean(today.completionsByPlayerId[input.session.playerId]);
  const partnerDone = Boolean(
    input.session.partnerId && today.completionsByPlayerId[input.session.partnerId]
  );

  if (today.completedAt) {
    return { title: `Streak ${input.couple.streakCount}`, body: "Today's ritual is complete." };
  }

  if (selfDone && !partnerDone) {
    return { title: `Streak ${input.couple.streakCount}`, body: "Your check-in is done. Waiting on partner." };
  }

  return { title: `Streak ${input.couple.streakCount}`, body: "Both partners need one desk-PC check-in today." };
}
```
Source: repo synthesis based on `src/app/components/SharedRoomStatusStrip.tsx` and `03-CONTEXT.md`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Top-level `sharedCoins` scalar on `SharedRoomDocument` | Nested `progression.players[playerId].coins` plus `progression.couple` ritual/streak state | Phase 3 | Enables personal wallets without changing shared room inventory ownership. |
| Local `pcMinigameProgress` remains authoritative even in shared mode | Per-player canonical `deskPc` state in the shared-room document | Phase 3 | Cooldown, best score, and daily contribution survive refresh and reconnect. |
| Hidden status strip in dev bypass | Split invite identity from progression status so streak/ritual chips render in dev | Phase 3 | The team can verify the ritual loop locally without re-enabling temporary pairing chrome. |
| Client-local midnight or world time for daily checks | Authoritative store-time UTC room-day key | Phase 3 | Removes timezone drift and dev-time-control exploits. |

**Deprecated/outdated:**
- `roomDocument.sharedCoins` as the writable player-facing economy source.
- Shared-room reads that rely on `devLocalState.ts` `playerCoins` or `pcMinigame` while a canonical shared room is active.
- UI copy that still says "shared coins" in the toolbar or inventory buy flow after personal wallets exist.

## Defer From Phase 3

- Multiple ritual variants or rotation logic beyond the first desk-PC ritual.
- New minigames, second earn loops, or broad quest-log infrastructure.
- Shared room growth meters, achievements, or secondary currencies.
- Memory objects, pet progression, breakup/reset semantics, or production backend/auth replacement.
- Full economy rebalance beyond the minimum XP curve and ritual bonus values needed to prove the loop.

## Open Questions

1. **What is the one-time migration split for legacy `sharedCoins` when a room already has two members?**
   - What we know: total value must be preserved and not duplicated or deleted.
   - What's unclear: whether the split should be even, creator-biased for odd remainders, or based on some future-visible rule.
   - Recommendation: split evenly across current `memberIds`, give any odd remainder to the creator, and record `migratedFromSharedCoins` for debugging.

2. **What should happen when a second partner joins a room that was migrated while only one member existed?**
   - What we know: there is no historical source of truth for coins the late-joining partner "should" have.
   - What's unclear: whether late joiners should start at `0`, a visible starter grant, or a one-time catch-up bundle.
   - Recommendation: do not silently mint migration coins for late joiners. If a starter grant is desired, make it explicit product copy and treat it as new progression, not migration.

3. **How should stale revision handling be implemented for progression-affecting writes?**
   - What we know: current store behavior accepts stale writes and increments revision, which is dangerous for personal rewards and ritual state.
   - What's unclear: whether Phase 3 should add typed store-side mutations or a reload-and-replay retry path around `commitSharedRoomState`.
   - Recommendation: planner should treat this as required design work inside Phase 3, not a future cleanup. The exact interface can vary, but blind stale progression overwrites should not ship.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev plugin, tests, build | yes | 20.18.3 | - |
| npm | `npm test`, `npm run build`, package resolution | yes | 10.8.2 | - |
| File-backed shared-room DB | Dev shared-room persistence | yes | `.data/shared-room-dev-db.json` present | If deleted, the Vite dev plugin recreates it on next room create/bootstrap. |

**Missing dependencies with no fallback:**
- None found.

**Missing dependencies with fallback:**
- None found.

**Current verification baseline:** `cmd /c npm test` passed with 29 files and 107 tests on 2026-03-27. `cmd /c npm run build` also passed on 2026-03-27.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/03-shared-progression-and-ritual-loop/03-CONTEXT.md` - locked Phase 3 decisions, UI surfaces, and out-of-scope items.
- `src/App.tsx` - current wallet, buy/sell flow, PC reward path, and dev-bypass UI gating.
- `src/app/hooks/useSharedRoomRuntime.ts` - canonical shared-room load/reload/commit boundary and runtime snapshot shape.
- `src/lib/sharedRoomTypes.ts` - current shared-room document contract.
- `src/lib/sharedRoomValidation.ts` - current document validator and normalization rules.
- `scripts/sharedRoomDevPlugin.mjs` - actual dev backend create/load/commit behavior and on-disk database layout.
- `src/lib/pcMinigame.ts` - base desk-PC scoring and cooldown model.
- `src/lib/devLocalState.ts` - local fallback persistence keys and current non-authoritative PC progress storage.
- `tests/sharedRoomRuntime.test.ts` - runtime authority and reload guarantees.
- `tests/sharedRoomStore.test.ts` - current dev-store commit semantics.
- `tests/sharedRoomValidation.test.ts` - current validation coverage.
- `tests/pcMinigame.test.ts` - current desk-PC reward and cooldown coverage.
- `.data/shared-room-dev-db.json` - real persisted room document showing legacy `sharedCoins`.
- `https://react.dev/learn/managing-state` - current React guidance on structuring growing state.
- `https://vite.dev/config/` - current Vite config conventions matching the repo's `vite.config.js`.
- `https://vitest.dev/guide/mocking` - current Vitest guidance aligned with existing test patterns.
- npm registry queries run on 2026-03-27 via `npm ls` and `npm view` for `react`, `vite`, `vitest`, and `typescript`.

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` - existing brownfield layering recommendation.
- `.planning/research/FEATURES.md` - MVP dependency chain placing progression before richer content.
- `.planning/research/PITFALLS.md` - existing warning that progression must stay tied to a visible ritual.
- `docs/AI_HANDOFF.md`, `docs/CURRENT_SYSTEMS.md`, `docs/GAME_OVERVIEW.md`, `docs/ROADMAP.md` - current product framing and brownfield guardrails.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - installed versions and registry latest versions were verified directly.
- Architecture: MEDIUM - the brownfield boundaries are clear, but the exact stale-write strategy still needs a Phase 3 implementation choice.
- Pitfalls: HIGH - they are grounded in current code, current dev DB shape, and existing UI/store gates.

**Research date:** 2026-03-27
**Valid until:** 2026-04-03
