# Phase 05 Debug: Hosted Entry Falls Back To Dev

## Symptom

Running `npm run dev` and opening `localhost:5173` went straight into the room in multiple browsers instead of showing the hosted Google sign-in and couple-link flow.

## Root Cause

The app only activates the hosted backend when `VITE_SHARED_BACKEND=firebase` and all required Firebase environment variables are present. Without that configuration, backend mode resolves to `dev`, both shared-room clients bind to the dev adapters, and `useSharedRoomRuntime` auto-bootstraps the development shared room.

## Evidence

- `src/lib/sharedBackendConfig.ts:43-47` only returns `firebase` when the full Firebase config exists, otherwise it returns `dev`.
- `src/lib/sharedRoomClient.ts:118-119` and `src/lib/sharedPresenceClient.ts:206-207` select the dev clients whenever backend mode is not `firebase`.
- `src/app/hooks/useSharedRoomRuntime.ts:204` enables `devBypassActive` whenever hosted flow is inactive.
- `src/app/hooks/useSharedRoomRuntime.ts:693` and `src/app/hooks/useSharedRoomRuntime.ts:778` auto-run `bootstrapDevRoom()` when the dev path is active.

## Fix Direction

- Make backend mode explicit in the player shell.
- Add a no-auto-bootstrap path for hosted UAT in dev.
- Fail loudly or block clearly when hosted flow is expected but Firebase config is missing.
