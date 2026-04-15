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

## Phase 6 — Auth + Convex Persistence ✅ (migrated to Convex Auth 2026-04-06)

- [x] Clerk removed — `@clerk/vue` + `svix` uninstalled, all imports stripped
- [x] Convex Auth installed — `@convex-dev/auth` + `@auth/core`, Anonymous + Password providers
- [x] `convex/auth.ts` — `convexAuth({ providers: [Anonymous, Password] })`
- [x] `convex/schema.ts` — `authTables` added, `clerkId` removed from users
- [x] `convex/http.ts` — Convex Auth HTTP routes (replaces Clerk webhook)
- [x] `convex/users.ts` — `getMe` uses `auth.getUserId()`, `hasEmail` query added
- [x] `convex/socialAccounts.ts` + `convex/settings.ts` — `getAuthUser` uses Convex Auth
- [x] `src/lib/convexAuth.ts` — Vue auth client (JWT/refresh token management, signIn/signOut)
- [x] `src/composables/useAuth.ts` — wraps Convex Auth (replaces Clerk re-exports)
- [x] `main.ts` — `setupConvexAuth()` before mount (replaces `clerkPlugin`)
- [x] `router/index.ts` — `createWebHashHistory()` for Tauri Android compatibility
- [x] `views/LoginView.vue` — "Get started" (anonymous) + email/password form (replaces Clerk `<SignIn>`)
- [x] `router/guards.ts` — uses `isAuthenticated` from Convex Auth
- [x] Signup nudge — `useSignupNudge` composable + `SignupNudge.vue` (5 nudges, 10-day cooldown)
- [x] Account section in Settings drawer — signup form or email display + sign out
- [x] Convex sync overhaul (2026-04-14) — cloud-backed sync for profiles, active profile, custom links, friends filter, SocialFlow accounts, and key preferences
- [x] Auth bootstrap now hydrates from Convex on sign-in/startup with cloud-priority behavior (2026-04-14)
- [x] Durable Convex sync queue (2026-04-15) — cloud writes are now persisted locally, retried on visibility/focus/network/timer, and flushed before cloud hydration
- [x] Placeholder default profile stays local-only until customized (2026-04-15) — avoids syncing unwanted `Profile 1` into signed-in accounts
- [x] Android WebView dark-mode bridge now reaches the web content layer (2026-04-15) — native darkening APIs + `prefers-color-scheme` hinting applied on toggle/page-finish
- [x] Facebook mobile dark mode stabilization (2026-04-15) — fallback, native night-mode alignment, and redirect-safe reapplication now keep `m.facebook.com` in dark mode on device
- [x] Backup restore now re-seeds Convex when the user is signed in (2026-04-14)
- [x] Website FR/EN copy updated to explain exactly what syncs via cloud vs what stays local-only (2026-04-14)

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
- [x] Android: grayscale toggle now also applies ColorMatrix to native bottom bar (2026-03-10)
- [x] Android: cookie consent auto-accept improved — Instagram + TikTok specific selectors, fallback global scan, 5s timeout (2026-03-10)
- [x] Android: back button fixed — triggers Vue event first, no blank-page flash (2026-03-10)
- [x] Android: network switching fixed — `navigate_webview` command (fast URL swap, no destroy/recreate) (2026-03-10)
- [x] Android: network button tags fixed — `updateBottomBarActiveNetwork` now correctly highlights active network (2026-03-10)
- [x] Android: edge-to-edge mode — transparent status bar, content extends to top like Instagram/TikTok (2026-03-10)
- [x] Mobile home screen redesigned — profile card (centered emoji + name), networks as vertical card list with brand colors (2026-03-10)
- [x] Vue mobile overlay bar removed — single native Kotlin bottom bar (no duplicate) (2026-03-10)
- [x] BuildFlowz inspector script removed from index.html (2026-03-10)
- [x] `viewport-fit=cover` added — enables `env(safe-area-inset-top)` on Android (2026-03-10)
- [x] Android CI build fix — add `androidx.activity:activity-ktx:1.9.3` to plugin `build.gradle.kts` (OnBackPressedCallback missing dep) (2026-03-10)
- [x] CI: opt into Node.js 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) + `git config safe.directory` fix (2026-03-11)
- [x] Android: back button fixed — `initialBackIndex` baseline prevents redirect-loop trap; fires `webview-back` correctly (2026-03-11)
- [x] Android: edge-to-edge bottom fixed — `navigationBarColor = TRANSPARENT` + `LAYOUT_HIDE_NAVIGATION` flag (2026-03-11)
- [x] Android: network switching fixed — `switchTo()` now always close+open (removed missing `navigate_webview` IPC call) (2026-03-11)
- [x] Mobile: profile card → bottom sheet with rename, avatar upload (base64), delete (2026-03-11)
- [x] Mobile: quick actions bar — notifications badge + friends filter toggle pill (2026-03-11)
- [x] Mobile: network tiles redesigned as horizontal rows (icon + label left-aligned) (2026-03-11)
- [x] `profiles.ts`: added `avatar` field + `setAvatar()` action (2026-03-11)
- [x] Android: Kotlin→Vue communication fixed — `getMainWebView()` with view-hierarchy fallback when `load()` not called (2026-03-11)
- [x] Android: bottom bar network switching + back-to-dashboard now work end-to-end (2026-03-11)
- [x] Android: `intent://` and `market://` URLs blocked in `shouldOverrideUrlLoading` — fixes Instagram/Threads crash (2026-03-11)
- [x] Android: webview bottom gap fixed — removed double `navBarHeight` offset from layout (2026-03-11)
- [x] Android: TikTok icon fixed — `pi-video` → `pi-tiktok` (codepoint `\uea21`) across Kotlin + Vue (2026-03-11)
- [x] Android: TikTok cookie consent — Shadow DOM support for `<tiktok-cookie-banner>` (2026-03-11)
- [x] Android: Facebook/Instagram/Threads "Download app" / "Open in app" banners hidden (2026-03-11)
- [x] Android: cookie isolation per profile — save/restore via SharedPreferences on webview open/close/switch (2026-03-11)
- [x] Gmail replaced by Messenger in dashboard + bottom bar + webview store (2026-03-11)
- [x] Mobile settings bottom sheet — username, email, dark mode toggle, grayscale toggle (2026-03-11)
- [x] Theme store: dark mode preference now persists to localStorage (2026-03-11)
- [x] Dark mode: full implementation — Vue CSS variables, Kotlin bottom bar light/dark colors, status bar icon inversion, Tauri IPC sync (2026-03-11)
- [x] Home button: replaced back button with pi-home icon in Kotlin bottom bar — goes straight to dashboard (2026-03-11)
- [x] Network visibility per profile: long-press edit mode on dashboard tiles, toggle networks on/off, persisted in profiles store (2026-03-11)
- [x] Smaller network buttons: 44dp→36dp + 18sp→15sp in Kotlin bottom bar — fits more networks in horizontal scroll (2026-03-11)
- [x] Friends filter plugin — JS injection via `webview.eval()`, semantic DOM selectors (ARIA roles, data-testid), MutationObserver for infinite scroll, global toggle (2026-03-12)
- [x] Backup/restore — encrypted `.sfbak` archives (AES-256-GCM + Argon2), native file dialogs, sessions + stores export/import (2026-03-12)
- [x] Anti-fingerprint stealth — Chrome UA + JS patches on desktop + Android (webdriver, plugins, WebGL, chrome object) (2026-03-12)
- [x] Clear cookies per network — eraser button in profile sheet, per-network session wipe (2026-03-12)
- [x] Added Quora, Pinterest, WhatsApp, Telegram, Nextdoor as social networks (2026-03-12)
- [x] Custom links per profile — `customLinks` store, add/remove on mobile + desktop sidebar (2026-03-12)
- [x] Kotlin bottom bar synced with profile network visibility — `set_bar_networks` IPC + `rebuildBottomBar()` (2026-03-12)
- [x] Android: Snapchat Web support — desktop UA + full device spoofing (touch, screen, platform, userAgentData, matchMedia) bypasses multi-layer mobile detection (2026-04-06)
- [x] Android: reCAPTCHA in WebView — `onCreateWindow` + `setSupportMultipleWindows` + `javaScriptCanOpenWindowsAutomatically` enables reCAPTCHA verification popups (2026-04-06)
- [x] Android: cookie restore as domain cookies — `baseDomainOf()` extracts `.example.com` from URLs, restores with `Domain=` attribute so all subdomains see session cookies (2026-04-06)
- [x] Android: async cookie race fix — `removeAllCookies` callback ensures clear completes before restore begins (2026-04-06)
- [x] Android: Snapchat URL fixed — `www.snapchat.com/web/` (direct) instead of `web.snapchat.com` (301 redirect that lost cookies) (2026-04-06)
- [x] Android: Snapchat cookie domains — `www.snapchat.com` + `accounts.snapchat.com` added to COOKIE_URLS (2026-04-06)
- [x] Android: cookie consent auto-accept rewrite — auth-cookie detection (`isLoggedIn`), universal element scan (button/div/span/a), iframe support, Quantcast selector fix, 30s observer timeout (2026-04-06)
- [x] Android: cookie consent robustClick — PointerEvent dispatch (pointerdown+pointerup+click) fixes React/Meta apps; cross-origin iframe script for Google FC CMP (2026-04-06)
- [x] Android: bottom bar icon opacity fade — touch reveals all icons (600ms fade-in), release restores dimmed state (800ms fade-out), no delay (2026-04-06)
- [x] Android: `__Host-` cookie fix — cookies with `__Host-` prefix restored without `Domain=` attribute (RFC 6265bis), fixes Snapchat auth persistence (2026-04-06)
- [x] Android: persistent mute — MutationObserver + AudioContext override ensures all audio stays muted across SPA navigation (2026-04-06)
- [x] Android: haptic feedback setting — `setHaptic` IPC, all `performHapticFeedback` calls gated by preference (2026-04-06)
- [x] Dashboard icons — MessengerIcon.vue + QuoraIcon.vue with official Simple Icons SVG paths (2026-04-06)
- [x] Settings drawer account section — styled signup form, gradient CTA button, red sign-out button (was unstyled HTML) (2026-04-06)
- [x] Kotlin i18n fix — "Son activé" → "Activer le son" in mute toggle (2026-04-06)
- [x] Android bottom bar not synced with active profile — moved `set_bar_networks` sync from `NetworkWebviewHost.vue` (only mounted when a webview is open) to persistent `App.vue` watcher on `activeProfile.id + hiddenNetworks` fingerprint, so bar matches dashboard on mount, profile switch, and visibility edits (2026-04-12)
- [x] Tap sound inaudible on device — replaced `view.playSoundEffect(CLICK)` (depends on system "Touch sounds" setting) with `SoundPool` + bundled `assets/sounds/click.wav` (40ms 2kHz decayed sine), routed via `USAGE_MEDIA` so it plays on STREAM_MUSIC independent of touch-sounds setting (2026-04-12)
- [x] Audit haptic + tap-sound flow — fixed dead tap-sound toggle (`set_tap_sound` IPC + `playSoundEffect`), boot sync from localStorage, global `pointerdown` handler so Vue buttons also fire haptic/sound via new `trigger_haptic` IPC (2026-04-12)
- [x] Account signup errors in settings drawer / signup nudge — compact error card with `Copier` action + long-message truncation (`Voir plus / Voir moins`) (2026-04-13)
- [x] Android WebView uploads — `onShowFileChooser` wired to SAF picker so Facebook post/message photo selection now opens Android documents/photos picker (2026-04-13)
- [x] Android debug logs enriched for Facebook upload/story analysis — navigation, custom schemes, file chooser params/results, page-finished UA mode (2026-04-13)
- [x] Android bottom-bar popup — quick dark mode toggle + text zoom slider added next to the profile switcher while browsing webviews (2026-04-13)
- [x] Facebook mobile stories — show an explicit “not available in mobile web” notice instead of silently dismissing the app-install prompt (2026-04-13)
- [x] Android: backup export/import via MediaStore — writes to `Download/SocialFlow/`, visible in file manager (was writing to private app sandbox) (2026-04-06)
- [x] Android: fix backup "command not found" — register plugin commands in `build.rs` COMMANDS array + add `android-webview:default` to capabilities + fix JS command names to snake_case (2026-04-11)
- [ ] 🟡 Header search/filters hidden on mobile — add mobile-accessible alternative
- [ ] 🟡 Android: verify edge-to-edge status bar color inversion (light icons on dark home screen)
- [ ] 🟡 Android: test cookie isolation across profile switches on device
- [ ] 🟡 Android: test friends filter end-to-end on device
- [ ] 🟡 Desktop sidebar: custom links not yet tested visually

### Audit: Code (2026-04-06, score C)

- [x] 🔴 XSS via `v-html` in SocialPost.vue — `formatText()` now escapes HTML before injecting
- [x] 🔴 Dead Supabase client removed — `supabase-client.ts` + `supabase.d.ts` deleted
- [x] 🟠 IDOR in `socialAccounts.ts` — `upsert` now checks `userId` ownership before patching
- [x] 🟠 `convexAuth.ts` — auth results typed (`AuthResult` interface), empty catches now log warnings
- [x] 🟠 App.vue event listeners — all 5 custom event handlers now cleaned up on `onUnmounted`
- [x] 🟡 `gmailService.ts` broken `md5()` replaced with `crypto.subtle.digest('SHA-256')`
- [x] 🟠 `networkAccessGuard` removed — was a no-op with dead `roles` meta
- [x] 🟠 `@vueuse/core` version conflict fixed — deduplicated to `^12.3.0` in deps only
- [x] 🟡 MobileLayout.vue split — 1972→956 lines; extracted MobileProfileSheet + MobileSettingsSheet
- [ ] 🟡 Duplicate stores — `src/stores/socialNetworks.ts` vs `src/ui/.../stores/socialNetworks.ts`
- [ ] 🟡 Zero test coverage — no test framework, no test files, no CI test step
- [x] 🟡 `.env.example` created with VITE_CONVEX_URL, VITE_GMAIL_CLIENT_ID, VITE_GMAIL_API_KEY
- [x] 🟡 Hardcoded French in kanban stores → i18n keys (`kanban.todo`, etc.) + locale entries
- [ ] 🟡 Content script injects iframe on ALL pages (`*://*/*`) — performance/privacy concern
- [ ] 🟡 `accessToken` stored in plain Pinia state — could leak to localStorage if persisted

### Bug: Android backup restore fails after reinstall

- [x] 🔴 Backup restore after uninstall/reinstall shows `[object Object]` — fixed: (1) replaced MediaStore query with SAF file picker (bypasses scoped storage ownership), (2) error handler extracts `.message` from Tauri plugin error objects
- [x] Backup coverage audit — added `onboarding` store, `sfz_text_zoom`, `kanban-state` to `useBackup.ts` (2026-04-12)
- [x] WhatsApp Web disabled — infinite loader after phone+code pairing caused by IndexedDB not persisted per profile (Signal keys lost on switch) + `navigator.userAgentData` mismatch; commented out in 5 files, re-enable plan documented in `docs/whatsapp-web-integration.md` (2026-04-12)
- [ ] 🟡 Per-profile IndexedDB + localStorage persistence — unblocks WhatsApp, Telegram (MTProto keys in IDB), Discord (token in localStorage); prefer copying `/data/data/<pkg>/app_webview/Default/IndexedDB/` between profile dirs over JS serialization
- [ ] 🟠 Android WebView camera capture — extend `onShowFileChooser` with camera intent (`capture`) in addition to gallery/doc picker, then re-test Facebook story flow on device
- [ ] 🟠 Facebook mobile text zoom — validate on device whether the new CSS/JS fallback actually changes `m.facebook.com` typography; tighten the fallback if it still looks unchanged

### To go live

- [x] Convex: `npx convex dev` linked the workspace and generated `.env.local` with `VITE_CONVEX_URL`
- [x] Convex Auth signing keys configured on the dev deployment — `JWT_PRIVATE_KEY` + `JWKS` via `@convex-dev/auth`
- [ ] Vérifier le signup/signin Convex Auth end-to-end sur le bon déploiement et nettoyer l’ancien dev deployment link si inutile
- [ ] Vérifier Sentry — intégration, remontée d'erreurs, configuration des alertes

### Performance & Cache

- [x] Webview pooling — hide/show au lieu de destroy/recreate pour switch instantané
- [x] Convex subscriptions temps-réel via WebSocket (remplace polling 30s)
- [x] logoCache persist — `persist: true` ajouté au store
- [x] Routes lazy-loaded — dynamic imports, code splitting (764KB → 586KB)
- [x] PrimeVue tree-shaking — auto-import resolver, supprimé 15 enregistrements globaux
- [x] Webview preloading — top 3 réseaux préchargés off-screen au démarrage
- [x] DNS prefetch — résolution DNS des réseaux sociaux au chargement HTML
- [x] Vendor chunk splitting — vue/primevue séparés (app code 586KB → 163KB)
- [x] Service Worker — precache 73 assets + runtime cache logos (web build only)

### UX — Anti-popups

- [ ] Script suppression pop-ups "Installer l'app" — détecter et masquer automatiquement les bannières d'installation d'app native sur tous les réseaux (Facebook, Instagram, Reddit, etc.)

### UX — Onboarding

- [x] Onboarding première installation — guide pas-à-pas au premier lancement (présentation des fonctionnalités, configuration du profil, choix des réseaux)
- [x] Onboarding relançable depuis les paramètres — bouton "Revoir le tutoriel" dans Settings, même contenu que le premier lancement + explications complètes de toutes les fonctionnalités

### UX — Auto-login

- [ ] Sauvegarde identifiants par réseau social — stocker login/mot de passe chiffrés dans Convex (AES côté client, clé dérivée du master password), auto-remplir les formulaires de connexion dans les webviews. Alternative au transfert de cookies : l'utilisateur se reconnecte automatiquement sans ressaisir ses identifiants. (Légalement OK — même modèle que les gestionnaires de mots de passe, consentement explicite requis)

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
| Auth | Convex Auth (Anonymous + Password) | Same — JWT via ConvexClient |
| Routing | `createWebHashHistory` | Hash routing — Tauri Android compatible |
| Pinia persistence | `pinia-plugin-persistedstate` | Same — uses localStorage backend |

- Gmail API integration works today → keep as-is
- `useBrowserStorage.ts` is extension-only, not imported by SocialFlowz app → drop it
- `webextension-polyfill` auto-import in vite.config → remove from Tauri config
