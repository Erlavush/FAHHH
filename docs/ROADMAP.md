# Roadmap

## Current Implementation Status

### Foundation Systems Already In

- local sandbox room builder
- floor / wall / surface placement
- stable gizmo and selection flow
- four-wall wall decor and windows
- drag-across-wall wall editing
- Minecraft skin import
- local persistence
- ownership-based inventory
- coin-based buying and selling
- Preview Studio for furniture thumbnails
- Preview Studio `Mob Lab` for imported-mob look-dev
- info popovers and shop previews
- buyable wall windows with real wall openings
- real-time world clock with sun/moon lighting controls
- smooth camera zoom
- desk PC minigame earn loop
- temporary live-room pets through the Pet Store
- real-time FPS performance monitor HUD

### Still Missing From The Jam Game

- paired shared-room runtime
- live partner presence
- player level
- couple streak
- second coin earn loop
- daily quests
- editable photo frames
- richer pet gameplay loops
- breakup reset flow

## Recommended Build Order From Here

### Track 1: Core Gameplay Progression

1. Add a canonical player progression layer on top of the current sandbox save.
2. Add the second real coin earn loop, likely:
   - one daily quest loop
   - one additional PC activity
3. Add level and couple-streak state once earning and spending are no longer one-sided.

### Track 2: Personalization And Pets

1. Add editable/custom picture frames.
2. Keep using `Mob Lab` as the authoring path for imported mobs and future pets.
3. Expand the live pet loop beyond the current simple raccoon/cat wander behavior.
4. Add more room-density props only after the core progression loop is working.

### Track 3: Shared-Room Architecture

1. Define the new shared-room/backend shape directly from the current `roomState.ts` model.
2. Sync only confirmed room edits first.
3. Add partner presence after room-state sync is reliable.
4. Add shared progression after room sync is stable.
5. Add breakup reset only after shared progression really exists.

## Current High-Value Next Steps

If the goal is `gameplay progress`, do this next:

1. progression schema
2. daily quest or second earn loop
3. level plus streak

If the goal is `imported-mob progress`, do this next:

1. tune future presets in `Mob Lab`
2. expand the imported renderer only when a specific model forces it
3. deepen gameplay pet loops after authoring stays stable

If the goal is `visual progress`, do this next:

1. finish real PNG shop thumbnails
2. improve furniture art-set cohesion
3. keep polishing global lighting on top of the world clock

## Guardrails

- Do not bypass the registry for new furniture.
- Do not collapse inventory ownership into direct placement again.
- Do not restart shared-room architecture from an obsolete schema.
- Do not replace the current room model wholesale.
- Do not add lots of content before one complete progression loop exists.
- Do not confuse Mob Lab preview locomotion with gameplay pet AI.
- Do not remove GLB cloning or mesh-only filtering from the imported renderer.

## Jam MVP Definition

The jam MVP should prove this loop:

1. two partners pair into one room
2. they earn coins
3. they buy and place items
4. they maintain a streak
5. they complete one activity loop together
6. they personalize the room
7. they can lose the shared progress through a breakup flow

The current repo is still in the `foundation + local systems + authoring tools` phase before that shared-loop MVP.
