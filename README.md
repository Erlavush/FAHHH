# Risk It All: Cozy Couple Room

A browser-first couple-room game foundation built with React, React Three Fiber, and Firebase.

## Project direction

This repo is the foundation for a game jam concept about two partners building a shared room together and risking all of that progress on the relationship itself.

The final game direction is:

- two partners pair into one persistent room
- each partner earns coins and levels up
- the couple keeps a shared streak together
- furniture, decor, frames, and pets are bought with earned currency
- the desk PC contains minigames for extra coins
- daily quests provide steady progression
- picture frames can display the couple's own photos
- pets like cats and dogs make the room feel alive
- if the couple breaks up, the shared room and its progress are wiped

## Current foundation

What exists in this repo today is the local sandbox foundation:

- React + Vite + TypeScript frontend
- React Three Fiber / Drei 3D room scene
- local room builder with floor, wall, and surface decor placement
- avatar movement and current furniture interactions
- local persistence for room state, player position, camera, and skin
- imported furniture asset wrappers

## Game jam MVP

The intended jam MVP is:

- one shared couple room
- pairing into the same room
- coins plus a furniture shop
- simple level and streak progression
- one PC minigame for extra coins
- one daily quest loop
- editable photo frames
- one pet type
- breakup reset flow

## Getting started

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase project values if you want to work on connected features later.
3. Install dependencies.
4. Start the dev server.

On Windows PowerShell with strict script execution, use:

```powershell
cmd /c npm install
cmd /c npm run dev
```

If Firebase is not configured, the app runs in the current local sandbox mode using browser storage.
