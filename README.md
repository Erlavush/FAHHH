# Cozy Couple Room

A browser-first cozy couple game prototype built with React, React Three Fiber, and Firebase.


## What is included

- Google sign-in when Firebase is configured
- Invite-code pairing flow
- Shared couple room backed by Firestore
- Simple live presence using Firebase Realtime Database
- Fixed isometric 3D room rendered with React Three Fiber
- Decoration catalog for placing, rotating, and removing decor
- Local demo fallback when Firebase env vars are missing

## Getting started

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase project values.
3. Install dependencies.
4. Start the dev server.

On Windows PowerShell with strict script execution, use:

```powershell
cmd /c npm install
cmd /c npm run dev
```

If Firebase is not configured, the app still runs in demo mode using local browser storage so you can explore the room and pairing UX.
