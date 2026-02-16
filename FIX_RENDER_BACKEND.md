
# Render Backend Deploy - Step-by-Step Fix Log

## 1. Authentication Strategy
- **Reverted to Google Sign-In**: We moved back to the original Google Sign-In flow using Firebase Popup on the frontend.
- **Backend Verification**: Implemented `/auth/login-google` endpoint that accepts the Firebase ID Token.
- **Role Sync**: The backend verifies the token and automatically syncs the user.
- **God Mode**: `alpherymail@gmail.com` is hardcoded to receive `super_admin` (God) privileges.

## 2. Issues Encountered & Fixed
### Issue A: "Unique constraint failed" on deployment
- **Cause**: Existing stale user records collided with new seed data.
- **Fix**: Updated `seedSuperAdmin` to smartly detect conflicts and clean up stale UID holders before upserting.

### Issue B: "Unknown argument `icon`" in seeding
- **Cause**: The `App` model in `schema.prisma` uses `iconUrl`, but the seed script passed `icon`. This caused the app to crash on startup (500 Internal Server Error).
- **Fix**: Renamed `icon` to `iconUrl` in `auth-simple.service.ts`.

### Issue C: "Pending Approval" screen stuck
- **Cause**: The backend was unreachable (due to crash or deployment lag), so frontend couldn't fetch the `platformUser`.
- **Fix**: Once the backend is healthy, `platformUser` loads correctly, and `alpherymail@gmail.com` is auto-approved.

## 3. Current Status
- **Backend**: Functional and deployed on Render.
- **Endpoint**: `POST /auth/login-google` is active.
- **Database**: Seeded with Super Admin (`AA000001`) and default Apps.
- **Frontend**: Updated to use correct endpoint.

## 4. Next Steps for User
1.  **Refresh your browser** (to ensure latest frontend bundle).
2.  **Click Sign in with Google**.
3.  **Create Tenant**: If prompted, assign the tenant to yourself (`alpherymail@gmail.com`).
