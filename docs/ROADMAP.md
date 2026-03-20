# Roadmap

## Current Implementation Status

### Foundation Systems Already In

- local sandbox room builder
- floor / wall / surface placement
- stable gizmo and selection flow
- Minecraft skin import
- local persistence
- ownership-based inventory
- coin-based buying and selling
- preview studio for shop thumbnails
- info popovers and static shop previews
- buyable wall windows with real wall openings
- real-time world clock with sun/moon lighting controls
- smooth camera zoom

### Still Missing From the Jam Game

- paired shared room runtime
- live partner presence
- player level
- couple streak
- coin earn loops
- PC minigame
- daily quests
- editable photo frames
- pets
- breakup reset flow

## Recommended Build Order From Here

### Track 1: Core Gameplay Progression

1. Add a canonical `player progression` layer on top of the current sandbox save.
2. Add one real `coin earn loop`, either:
   - one desk PC minigame
   - one daily quest loop
3. Add the second loop after the first one is stable.
4. Add level and couple-streak state once earning/spending is no longer one-sided.

### Track 2: Personalization

1. Add editable/custom picture frames.
2. Add one pet implementation.
3. Add more room-density props only after the core loop is working.

### Track 3: Shared-Room Architecture

1. Reconcile Firebase/auth/pairing code with the current `roomState.ts` model.
2. Define a canonical shared-room document shape based on the current registry-driven room schema.
3. Sync only confirmed room edits first.
4. Add partner presence after the room-state sync is reliable.
5. Add breakup reset only after shared progression actually exists.

## Current High-Value Next Steps

If the goal is `gameplay progress`, do this next:

1. progression schema
2. one earn loop
3. level + streak

If the goal is `visual progress`, do this next:

1. finish real PNG shop thumbnails
2. improve furniture art-set cohesion
3. keep polishing global lighting on top of the world clock

## Guardrails

- Do not bypass the registry for new furniture.
- Do not collapse inventory ownership into direct placement again.
- Do not restart multiplayer from the older `types.ts` shape without reconciling it to the current sandbox schema.
- Do not build future systems by replacing the current room model wholesale.
- Do not add lots of content before one complete progression loop exists.

## Jam MVP Definition

The jam MVP should prove this loop:

1. two partners pair into one room
2. they earn coins
3. they buy and place items
4. they maintain a streak
5. they complete one activity loop together
6. they personalize the room
7. they can lose the shared progress through a breakup flow

The current repo is still in the `foundation + local systems` phase before that shared-loop MVP.
