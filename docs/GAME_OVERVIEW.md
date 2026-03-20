# Risk It All: Cozy Couple Room Game

## Project Fantasy

This project is a cozy browser-based couple-room game built around intimacy, shared progression, and emotional risk. Two partners pair into one room, earn progress together, decorate a lovely private space, and fill it with personal memories.

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

- pair into one shared room
- log in and maintain the couple streak
- complete a daily quest
- play the desk PC minigame for extra coins
- earn coins and level up
- buy furniture, decor, frames, and pets
- customize the room with shared memories and cute details
- keep growing the room together while the relationship remains active

## Current Product Status

The repo has moved beyond the earliest empty-room prototype, but it is still a `local foundation`, not the complete shared-room game.

### Implemented now

- local sandbox room runtime
- build-mode editing for floor, wall, and surface items
- registry-driven furniture system
- inventory ownership and stored-items flow
- coin-based buying and selling
- desk PC minigame earn loop
- buyable wall windows with real wall openings
- world clock with real-time sun/moon lighting controls
- preview studio for shop thumbnails
- local persistence for room, camera, position, skin, and coins

### Still missing from the full game

- pairing into one shared room
- shared room sync and partner presence
- level and couple streak
- daily quest and additional minigame earn loops
- editable couple-photo frames
- pets
- breakup reset gameplay

## Game Jam MVP

The jam build should prove one polished slice of the full fantasy:

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

- `1 world unit = 1 block`
- room footprint is currently `10 x 10`
- `Y` is vertical height; `X/Z` are floor-plane axes
- furniture should fit cleanly into block-relative footprints
- the player uses Minecraft-like proportions and Minecraft skin layout rules
