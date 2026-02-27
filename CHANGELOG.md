# Changelog

All notable changes to SocialFlowz are documented here.

## [Unreleased]

### Added
- Clerk auth (`@clerk/vue`) — real login/signup replaces mock JWT dev bypass
- Convex backend — `users`, `socialAccounts`, `activeAccounts`, `settings`, `subscriptions` tables
- Clerk webhook handler (`/clerk-webhook`) with svix signature verification
- `src/lib/convex.ts` — `ConvexHttpClient` singleton using `VITE_CONVEX_URL`
- `src/composables/useConvex.ts` — `useConvexQuery` / `useConvexMutation` wrappers with Clerk JWT
- `src/composables/useAuth.ts` — central re-export of `useAuth` / `useUser` from `@clerk/vue`
- `convex/_generated/` stubs — allow TypeScript to compile before `npx convex dev` is run
- `.env` placeholder file with `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL`

### Changed
- `main.ts` — wraps app with `clerkPlugin`
- `views/LoginView.vue` — replaced username/password mock form with Clerk `<SignIn />` component
- `router/guards.ts` — real `useAuth()` from Clerk (removed hardcoded dev user bypass)
- `stores/accounts.ts` — offline-first cloud sync: `loadFromCloud()` merges Convex on sign-in, mutations fire `syncToCloud()` in background
- `stores/theme.ts` — `syncThemeToCloud()` on every theme toggle
- `App.vue` — `watch(isSignedIn, loadFromCloud)` to sync on auth state change

### Removed
- `src/stores/auth.ts` — mock JWT store with hardcoded `fake-jwt-token`
- `src/ui/setup/pages/SocialFlowz/stores/auth.ts` — dead API-expecting auth store never wired

---

## [0.5.0] — Phase 5 Ship (2026-02-26)

### Added
- App icons — all required Tauri sizes via `pnpm exec tauri icon`
- System tray with per-network quick-launch menu
- GitHub Actions CI workflow — builds AppImage + .deb on ubuntu-22.04 for `v*` tags

### Fixed
- `beforeBuildCommand` recursion — `tauri:build` script is Vite-only; Tauri CLI invokes it
- Bundle identifier changed to `com.socialflowz.desktop`

---

## [0.4.0] — Phase 4 Multi-Account (2026-02-25)

### Added
- Per-account isolated OS-level session dirs: `{appData}/sessions/{account_id}/`
- Sidebar account chips with hover-reveal "+"/× controls
- `ensureDefault(networkId)` — auto-creates Account 1 on first network click
- `delete_account_session` Rust command — wipes session data on removal

---

## [0.3.0] — Phase 3 Native Webviews (2026-02-24)

### Added
- Rust IPC: `open_webview`, `navigate_webview`, `resize_webview`, `close_webview`
- `NetworkWebviewHost.vue` — host div tracks bounds, positions native webview on top
- `webviewState.ts` Pinia store + `useNetworkWebview` composable
- Native webviews for: Twitter, Facebook, Instagram, LinkedIn, TikTok, Threads, Discord, Reddit

---

## [0.2.0] — Phase 2 Tauri Scaffold (2026-02-23)

### Added
- Tauri 2 `src-tauri/` Rust workspace
- Flox dev environment with webkitgtk, gtk3, librsvg, patchelf
- `features = ["unstable"]` for WebviewBuilder + Window::add_child

---

## [0.1.0] — Phase 1 App Extraction (2026-02-22)

### Added
- Standalone `index.html` mounting the SocialFlowz `main.ts`
- `vite.tauri.config.ts` — clean Vite config (port 1420, no extension plugins)
- `tauri:dev` and `tauri:build` scripts in `package.json`
