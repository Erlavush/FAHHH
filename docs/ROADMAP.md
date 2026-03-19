# Game Vision, MVP, and Stretch Goals

## Current Foundation
### Status: Done
The current implementation is the foundation layer, not the final game.

What already exists:

- local solo sandbox room runtime
- registry-driven furniture system
- starter room layout
- floor, wall, and surface decor placement
- local persistence
- current interactions:
  - sit
  - sleep
  - use PC

Acceptance:
- the user can open the app, decorate the room, interact with furniture, refresh, and keep progress locally.

## Final Game Vision
The intended game jam concept is a `cozy couple room game with real emotional stakes`.

The final target experience is:

- two partners pair into one shared room
- each partner has their own coins and level
- the couple shares a streak together
- furniture and lovely room details are earned and bought
- the desk PC contains minigames that reward extra coins
- daily quests reward consistent play
- custom picture frames hold real couple photos
- pets such as cats and dogs live in the room
- if the couple breaks up, the shared room and shared progress are wiped

This repo should treat the current sandbox as the implementation base for that larger experience.

## Game Jam MVP
### Status: Active Target
The MVP should deliver one polished slice of the full fantasy.

Must-have systems:

- `Shared room access`
  - Google auth or equivalent sign-in
  - invite pairing
  - one couple mapped to one room
- `Shared room sync`
  - both partners load the same room
  - confirmed furniture changes sync reliably
  - both players can see partner presence in the room
- `Core progression`
  - coins for each partner
  - basic player level
  - shared couple streak
- `Room economy`
  - simple furniture/decor shop
  - buying uses coins instead of free infinite placement
- `Activity loop`
  - one desk PC minigame
  - one daily quest loop for extra coins
- `Personalization`
  - editable wall or desk picture frames
  - one pet implementation
- `Emotional hook`
  - breakup/reset flow that wipes the shared room after explicit confirmation

MVP acceptance:
- two players can pair into the same room, earn coins, buy at least some furniture, maintain a streak, play one PC minigame, complete one daily quest, place a custom photo in a frame, have one pet in the room, and trigger the breakup reset flow.

## Stretch Goals
These features strengthen the fantasy, but should not block the jam build.

- more furniture categories and decorative sets
- more picture frame sizes and placements
- more PC minigames
- more daily quest types
- more pet types and simple pet behaviors
- room themes and visual variants
- ambient interactions such as lamp toggle or fridge inspect
- stronger onboarding, blocked-placement feedback, and mobile polish
- richer partner presence such as emotes or status cues

## Build Order
To keep scope realistic, development should move in this order:

1. Stabilize the current builder foundation.
2. Unify the room schema so local and shared room state can use the same model.
3. Reconnect auth, pairing, and shared room sync to the current room model.
4. Add coins, buying, level, and streak data.
5. Add one minigame, one daily quest, and one pet.
6. Add custom picture frames and breakup reset flow.
7. Spend remaining time on content and polish, not on new core systems.

## Scope Boundaries
To stay finishable and coherent, the project should avoid expanding into:

- a broad life sim
- an open-world game
- a complex market economy
- a large quest system
- many rooms before the main shared room is polished

The game should remain focused on one memorable couple-room experience with a strong `Risk it all` identity.
