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

## Phase 4 — Multi-Account Support ✅

- [x] `src/stores/accounts.ts` — Account model: `{ id, networkId, label, addedAt }`, persisted via localStorage
- [x] `ensureDefault(networkId)` — auto-creates Account 1 on first network click (zero friction)
- [x] Rust `open_webview` now takes `account_id`, creates `data_directory = {appData}/sessions/{id}/`
- [x] Each account = isolated cookie jar / localStorage / IndexedDB (true multi-account)
- [x] `delete_account_session` Rust command — wipes session dir on account removal
- [x] `useNetworkWebview` composable updated — passes `accountId` to all IPC calls, handles `switchAccount`
- [x] Sidebar account list — shows accounts under active network, active indicator dot
- [x] "Add account" button (hover-reveal "+" next to network) — auto-names "Account N"
- [x] Account switcher — click account chip to switch; webview closes + reopens with isolated session
- [x] Remove account — trash icon (multi-account only), confirm dialog, deletes session data
- [x] Account list persisted via `pinia-plugin-persistedstate` (no extra plugin needed)

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

### Audit: Design (2026-02-27, score C+)

- [x] Fixed: missing `computed` import in `SocialAvatar.vue` (runtime crash)
- [x] Fixed: missing `useTheme` import in `ThemeSwitch.vue` (runtime crash)
- [x] Fixed: 4× `confirm()` browser dialogs in Kanban + Sidebar removed
- [x] Fixed: `aria-label` on AppHeader buttons, Textarea, sidebar toggle
- [x] Fixed: TikTok/Threads brand color `#000000` → `var(--text-color)` (dark mode)
- [x] Fixed: spurious `defineProps` import in `DisplayError.vue`
- [x] Account removal: `<ConfirmPopup>` + `useConfirm()` — `ConfirmationService` + `ToastService` registered
- [x] Design system: spacing scale `--space-1` → `--space-8` in `:root`
- [x] Dark theme: `.dark {}` token block for all surface colors
- [x] DaisyUI consolidation: `LoadingSpinner` → PrimeVue `<ProgressSpinner>`, `DisplayError` → PrimeVue `<Message>`
- [x] Breakpoints: `md: 768px` + `lg: 1200px` in `tailwind.config.cjs`; removed bogus string plugin

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
