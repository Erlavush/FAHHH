# Risk It All: Cozy Couple Room Game

## Project Fantasy
This project is a cozy browser-based couple-room game built around intimacy, shared progression, and emotional risk. Two partners pair into one room, earn progress together, decorate a lovely private space, and fill it with personal memories. The room is meant to feel warm, playful, and meaningfully theirs.

The defining hook is `Risk it all`: if the couple decides to break up, the shared room and the progress tied to that relationship are wiped.

## Final Game Vision
The intended final game is not only a room decorator. It is a shared couple-space game with:

- one persistent room for one couple
- Minecraft-skin-compatible avatars
- individual progression for both partners:
  - coins
  - level
- shared couple progression:
  - streak together
  - shared room growth
- a buy loop for new furniture, decor, frames, pets, and variants
- a desk PC that opens minigames for extra coins
- daily quests that reward coins and support habit play
- editable picture frames for real couple images
- pets such as cats and dogs that make the room feel alive
- a breakup mechanic that clears the room and shared progress

## Core Pillars
- `Shared intimacy`: the room should feel like a private place for two people.
- `Earned decorating`: furniture and lovely details should be unlocked or bought, not all free from the start.
- `Memory and personality`: custom photos, pets, and visual variants should make the room feel personal.
- `Small cozy rituals`: daily quests, streaks, and PC minigames create reasons to come back together.
- `Emotional stakes`: breakup has real cost, which gives the room meaning.

## Core Player Loop
- Pair into one shared room.
- Log in and maintain the couple streak.
- Complete a daily quest.
- Play the desk PC minigame for extra coins.
- Earn coins and level up.
- Buy furniture, decor, frames, and pets.
- Customize the room with shared memories and cute details.
- Keep growing the room together while the relationship remains active.

## Game Jam MVP
The game jam build should focus on one polished slice of that fantasy:

- one shared room
- pairing into the same room
- simple coins plus furniture buying
- simple player level plus couple streak
- one desk PC minigame
- one daily quest loop
- editable photo frames
- one pet implementation
- breakup reset flow

The MVP should prove the fantasy of `we are building this room together and it matters`.

## Stretch Goals
After the MVP is stable, the next most valuable additions are:

- more furniture and decor categories
- more PC minigames
- more quest variety
- more pet types and behaviors
- room themes and visual variants
- more ambient interactions such as fridge inspect or lamp toggle
- better social presence and partner feedback

## Scope Boundaries
This project should stay focused on the room fantasy. It is not trying to become:

- a broad life sim
- an open-world multiplayer game
- a deep economy simulator
- a quest-heavy RPG

The economy, quests, and progression should stay room-centered and readable for a game jam scale.

## World Scale Rules
- `1 world unit = 1 block`.
- Ground plane uses Minecraft-like block logic.
- Room footprint is currently `10 x 10` blocks.
- `Y` is vertical height; `X/Z` are floor-plane axes.
- The player uses Minecraft-like proportions and Minecraft skin layout rules.
- Furniture should fit cleanly into block-relative footprints and remain readable beside a roughly `1.8`-unit-tall avatar.

## Current Product Status
- `Implemented now`: local sandbox room builder, furniture placement, wall decor, surface decor, room interactions, local persistence, imported furniture assets.
- `Foundation only`: the current implementation is the base layer for the larger jam game vision.
- `Planned next`: stabilize the builder foundation, then add the MVP progression, shared-room, and personalization systems.
