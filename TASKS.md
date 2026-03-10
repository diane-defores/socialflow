# SocialFlowz — Tauri Desktop App Migration

Convert from Chrome Extension → Tauri desktop app.
The `src/ui/setup/pages/SocialFlowz/` app is already a standalone Vue 3 app (~90% reusable).
Key change: replace blocked `<iframe>` embeds with native Tauri Webviews (bypass X-Frame-Options at OS level).

---

## Phase 1 — Extract the App ✅

- [x] Audit existing codebase — identify extension-only vs reusable code
- [x] Create `index.html` at project root mounting the SocialFlowz `main.ts`
- [x] Create `vite.tauri.config.ts` — clean Vite config without extension plugins
- [x] Add `tauri:dev` and `tauri:build` scripts to `package.json`
- [x] Verify app runs standalone via `vite dev` → HTTP 200 on port 1420

## Phase 2 — Scaffold Tauri ✅

- [x] Install `@tauri-apps/cli` + `@tauri-apps/api`
- [x] Run `pnpm exec tauri init` — generates `src-tauri/`
- [x] Configure `tauri.conf.json`: identifier, window 1280×800, min 900×600, center
- [x] Install system deps via Flox: `pkg-config gtk3 webkitgtk_4_1 librsvg patchelf`
- [x] Enable `features = ["unstable"]` in Cargo.toml for `WebviewBuilder` + `add_child`
- [x] `cargo check` passes cleanly

## Phase 3 — Native Webviews ✅ (Rust + Vue wired)

- [x] Rust IPC commands: `open_webview`, `navigate_webview`, `resize_webview`, `close_webview`
- [x] `useNetworkWebview` composable — binds webview bounds to host element via `useElementBounding`
- [x] `NetworkWebviewHost.vue` — transparent div host; shows dev placeholder in browser mode
- [x] `webviewState` Pinia store — tracks active network, maps to URLs
- [x] `AppSidebar` navigation: webview-capable networks → `webviewStore`, Gmail/others → router
- [x] `App.vue`: `<NetworkWebviewHost>` when webview active, `<router-view>` otherwise
- [x] Sidebar resize/window resize → `resize_webview` IPC via `useElementBounding` watcher
- [ ] End-to-end smoke test in actual Tauri window (requires display/GUI)
- [ ] Test all 8 platforms visually

## Phase 4 — Multi-Account Support ✅ → Replaced by Phase 7

- [x] `src/stores/accounts.ts` — Account model (superseded by profiles store in Phase 7)
- [x] Rust isolated session dirs per account (migrated to profile+network in Phase 7)
- [x] Multi-account with isolated cookie jars / localStorage / IndexedDB

## Phase 7 — Global Profile System ✅ (2026-03-08)

- [x] Replace per-network "Account 1/2/3" with global **Profiles** ("Business 1", "Perso", etc.)
- [x] `src/stores/profiles.ts` — Profile: `{ id, name, emoji, createdAt }`, persisted via localStorage
- [x] Rust `open_webview` now takes `profile_id + network_id` → `sessions/{profileId}/{networkId}/`
- [x] New Rust commands: `delete_profile_session`, `delete_network_session`
- [x] `useNetworkWebview` — tracks `activeKey = "profileId:networkId"`, `switchTo()` handles profile or network change
- [x] `NetworkWebviewHost.vue` — reacts to profile OR network change → auto-switches webview
- [x] `ProfileSwitcher.vue` — global switcher at top of sidebar: emoji + name, dropdown, add/rename/delete
- [x] `AppSidebar.vue` — removed per-network account chips, added ProfileSwitcher
- [x] `App.vue` — replaced accounts cloud sync with `profilesStore.ensureDefault()` on mount

## Phase 5 — Ship ✅ (code complete, CI ready)

- [x] App icon — generated all sizes via `pnpm exec tauri icon src/assets/logo.png`
- [x] Native system tray — `TrayIconBuilder` with per-platform menu items; left-click toggle window; right-click → open network
- [x] Tray event wired to Vue — `App.vue` listens for `tray:open-network`, calls `accountsStore.ensureDefault` + `webviewStore.selectNetwork`
- [x] Fixed `beforeBuildCommand` recursion — `tauri:build` script is now Vite-only; Tauri CLI invokes it
- [x] Fixed identifier — changed from `com.socialflowz.app` to `com.socialflowz.desktop` (avoids macOS bundle conflict)
- [x] GitHub Actions CI — `.github/workflows/build.yml` — builds AppImage + deb on ubuntu-22.04 on push to `v*` tags
- [x] `cargo check` passes cleanly on all phases
- [ ] **To produce binaries**: push a `v0.1.0` tag → GitHub Actions builds AppImage + deb
- [ ] Auto-updater (`@tauri-apps/plugin-updater`) — future
- [ ] macOS `.dmg` + code signing — future
- [ ] Windows `.exe` / `.msi` — future

## Phase 6 — Clerk Auth + Convex Persistence ✅ (2026-02-27)

- [x] `pnpm add convex @clerk/vue svix`
- [x] `convex/schema.ts` — `users`, `socialAccounts`, `activeAccounts`, `settings`, `subscriptions` tables
- [x] `convex/auth.config.ts` — Clerk JWT issuer domain
- [x] `convex/http.ts` — `POST /clerk-webhook` with svix signature verification
- [x] `convex/users.ts` — `upsertFromClerk` (internal), `deleteFromClerk` (internal), `getMe` (query)
- [x] `convex/socialAccounts.ts` — `list`, `upsert`, `remove`, `setActive`, `listActive`
- [x] `convex/settings.ts` — `get`, `upsert`
- [x] `convex/_generated/` — stubs (`api`, `server`, `dataModel`) for TS; replaced by `npx convex dev`
- [x] `src/lib/convex.ts` — `ConvexHttpClient` singleton (`VITE_CONVEX_URL`)
- [x] `src/composables/useConvex.ts` — `useConvexQuery` / `useConvexMutation` (Clerk JWT → Convex)
- [x] `src/composables/useAuth.ts` — thin re-export of `useAuth`, `useUser` from `@clerk/vue`
- [x] `main.ts` — `clerkPlugin` with `VITE_CLERK_PUBLISHABLE_KEY`
- [x] `views/LoginView.vue` — replaced username/password mock form with Clerk `<SignIn />`
- [x] `router/guards.ts` — replaced hardcoded dev bypass with real `useAuth()` from Clerk
- [x] `stores/accounts.ts` — offline-first: `loadFromCloud()` merges Convex → local on sign-in; `syncToCloud()` fires on mutations
- [x] `stores/theme.ts` — `syncThemeToCloud()` on every toggle
- [x] `App.vue` — `watch(isSignedIn, loadFromCloud)` + fire on startup if already signed in
- [x] Deleted `src/stores/auth.ts` + `src/ui/.../stores/auth.ts` (mock JWT dead code)
- [x] `.env` placeholder file (gitignored)
- [x] `pnpm tauri:build` ✅ (288 modules, 0 errors) + `cargo check` ✅

### Audit: Design (2026-03-07, score B+)

- [x] Fixed: `aria-label` missing on AppHeader toggle buttons (WCAG violation)
- [x] Fixed: `Unauthorized.vue` had zero styles — added icon + centered layout
- [x] Fixed: `.account-item` in AppSidebar not keyboard accessible (role/tabindex/keydown)
- [x] Fixed: `.channel-item` + `.server-item` in DiscordView not keyboard accessible
- [x] Fixed: `Math.random()` in DiscordView template — extracted to static data
- [x] Fixed: `!important` on DiscordView border-radius hover removed
- [x] Fixed: `prefers-reduced-motion` added to AppSidebar + AppRightSidebar + DiscordView
- [x] Fixed: TwitterView two-column grid responsive at 900px
- [x] Fixed: `.tweet-text` line-height 1.4 → 1.5
- [x] Fixed: `field-sizing: content` on all Textarea (Twitter, LinkedIn, CreatePost)
- [x] Fixed: Dead `.sidebar-hidden` class removed from AppRightSidebar
- [ ] 🟡 AppRightSidebar: wire "John Doe" placeholder to real Clerk user data
- [x] Mobile layout: `MobileLayout.vue` — single-column, profile top + network grid bottom (2026-03-09)
- [x] Android: replace FAB with native bottom bar (back btn + scrollable network switcher) (2026-03-09)
- [x] Android: fix system insets — webview respects status bar + navigation bar height (2026-03-09)
- [x] Android: Tauri events `webview-back` / `webview-switch-network` wired to Vue store (2026-03-09)
- [x] Android: PrimeIcons font loaded as native Typeface — bottom bar shows real icons with brand colors (2026-03-10)
- [x] Android: bottom bar network buttons fully circular with per-network brand colors (2026-03-10)
- [x] Android: `closeWebView` now synchronous (CountDownLatch) — fixes network-switch race condition (2026-03-10)
- [x] Mobile Vue: overlay bar moved from top to bottom — consistent with native Android bar (2026-03-10)
- [ ] 🟡 Header search/filters hidden on mobile — add mobile-accessible alternative

### To go live (⛔ blocked — needs accounts)

- [ ] Clerk: create app → paste `VITE_CLERK_PUBLISHABLE_KEY` into `.env`
- [ ] Convex: `npx convex dev` → paste `VITE_CONVEX_URL` into `.env`
- [ ] Convex dashboard: set `CLERK_WEBHOOK_SECRET` + `CLERK_JWT_ISSUER_DOMAIN` env vars
- [ ] Clerk dashboard: add JWT template `"convex"` with Convex issuer URL
- [ ] Clerk dashboard: add webhook → `https://your-deployment.convex.site/clerk-webhook`

### Post-launch

- [ ] Subscription gating (Polar.sh / Stripe) — `subscriptions` table already in schema
- [ ] In-app plan management UI (current plan, upgrade CTA)
- [ ] `sign-up` route with Clerk `<SignUp />` component

### Build Notes
- Dev environment: aarch64-linux, Ubuntu GLIBC 2.39
- Flox `webkitgtk_4_1` v2.50.5 is compiled against GLIBC 2.42 — incompatible for final linking
- Workaround: CI on `ubuntu-22.04` installs `libwebkit2gtk-4.1-dev` via apt (GLIBC-compatible)
- `flox activate -- pnpm exec tauri dev` will work once a display server is available (Xvfb or HDMI)

---

## Architecture Notes

| Concern | Extension | Tauri |
|---------|-----------|-------|
| Social media embed | `<iframe>` (blocked by CSP) | Native `Webview` (OS-level, bypasses headers) |
| Storage | `chrome.storage` | `localStorage` (already used in app) |
| Auth | Supabase + localStorage | Same — no change needed |
| Routing | `createWebHistory` | Same — Tauri-compatible |
| Pinia persistence | `pinia-plugin-persistedstate` | Same — uses localStorage backend |

- Gmail API integration works today → keep as-is
- `useBrowserStorage.ts` is extension-only, not imported by SocialFlowz app → drop it
- `webextension-polyfill` auto-import in vite.config → remove from Tauri config
