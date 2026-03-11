# Changelog

All notable changes to SocialFlow are documented here.

## [Unreleased] — 2026-03-11 (c)

### Added
- Dark mode — full end-to-end implementation: Vue CSS variables toggle light/dark surfaces, Kotlin bottom bar adapts (white bg + dark icons in light mode, dark bg + light icons in dark mode), Android status bar icon color inverts, initial state synced on mount via `set_dark_mode` Tauri IPC
- Home button on Android bottom bar — replaces back button with `pi-home` PrimeIcons icon; tapping always returns to dashboard (hardware back still navigates webview history first)
- Network visibility per profile — long-press any network tile on the mobile dashboard to enter edit mode; toggle switches hide/show individual networks per profile; hidden networks persisted in `hiddenNetworks[]` on Profile model via Pinia
- Smaller network buttons in Kotlin bottom bar — 44dp → 36dp with 15sp icons (was 18sp), fits more networks in horizontal scroll

---

## [Unreleased] — 2026-03-11 (b)

### Added
- Mobile settings bottom sheet — username, email, dark mode toggle, and grayscale toggle accessible from dashboard
- Messenger added to dashboard, sidebar, and Android bottom bar (replaces Gmail)
- Android cookie isolation per profile — cookies saved/restored via SharedPreferences on webview open/close/switch, enabling multi-account usage across profiles
- Android `getMainWebView()` with view-hierarchy fallback — fixes Kotlin→Vue communication when plugin `load()` isn't called
- TikTok cookie consent Shadow DOM support — pierces `<tiktok-cookie-banner>.shadowRoot` to auto-accept
- Facebook/Instagram/Threads "Download app" and "Open in app" banners auto-hidden via CSS + text-match

### Changed
- TikTok icon corrected — `pi-video` → `pi-tiktok` (`\uea21`) across Kotlin bottom bar, Vue sidebar, and mobile layout

### Fixed
- Android `intent://` and `market://` URLs blocked in `shouldOverrideUrlLoading` — prevents "Page web non disponible" crash on Instagram/Threads "Open in app"
- Android webview bottom gap eliminated — `addContentView` content frame is already system-inset, removed duplicate `navBarHeight` offset
- Dark mode preference now persists to localStorage on toggle (was reading but never saving)

---

## [Unreleased] — 2026-03-11

### Added
- Mobile profile management bottom sheet — tap the profile card to open a slide-up panel with rename, avatar upload (photo from device), and delete actions
- Quick actions bar on mobile home screen — notification badge and friends-filter toggle pill
- Profile avatars — `avatar` field on profiles (base64 data URL), displayed in profile card and bottom sheet

### Changed
- Mobile network tiles redesigned as horizontal rows (icon + label left-aligned) — more readable at a glance
- CI workflows opt into Node.js 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) — eliminates deprecation warnings ahead of June 2026 deadline

### Fixed
- Android back button no longer loops through redirect history — `initialBackIndex` baseline records where the back stack stands after the initial page load, so tapping back on the social home page correctly returns to the dashboard instead of cycling through `x.com → x.com/home` redirects
- Android network switching via bottom bar icons now works — previous implementation called a `navigate_webview` IPC command that was never registered on Android; `switchTo()` now always closes the current webview and opens a fresh one
- Android edge-to-edge bottom — navigation bar is now fully transparent (`navigationBarColor = TRANSPARENT` + `LAYOUT_HIDE_NAVIGATION` on pre-API 30); the custom bottom bar no longer sits behind the system nav bar
- CI Android and Windows builds no longer fail with git exit code 128 — `git config --global --add safe.directory '*'` added before steps that run git internally

---

## [Unreleased] — 2026-03-10 (c)

### Fixed
- Android CI: declare `androidx.activity:activity-ktx` as an explicit dependency in the plugin `build.gradle.kts` — Gradle APK build was failing because `OnBackPressedCallback` / `ComponentActivity` are not transitively exposed by `tauri-android`

---

## [Unreleased] — 2026-03-10 (b)

### Added
- Edge-to-edge display mode — transparent status bar with floating time/battery icons, matching Instagram and TikTok behaviour
- `navigate_webview` Kotlin command — switches social network by loading a new URL in the existing WebView (no destroy/recreate, instant transition)
- Cookie consent improvements — Instagram and TikTok specific selectors, global button scan fallback, extended 5 s timeout for late-loading dialogs
- Home screen redesigned — profile card with large emoji avatar, networks as a vertical list of brand-colored cards
- Grayscale mode now also applies ColorMatrix to the native Android bottom bar

### Changed
- Back button fires Vue event first before tearing down the overlay — eliminates blank-page flash on return to home screen
- Vue mobile overlay bar removed — single native Kotlin bottom bar is the sole navigation surface
- `viewport-fit=cover` added — activates `env(safe-area-inset-top)` for correct Android safe-area padding
- Network button tags fixed so active network highlight updates correctly after switching

### Removed
- BuildFlowz web inspector script removed from `index.html`

---

## [Unreleased] — 2026-03-10

### Added
- Android native bottom bar: PrimeIcons font loaded as Android Typeface for consistent icons matching the Vue app
- Per-network brand colors on Android bar buttons (X black, Facebook blue, Instagram pink, LinkedIn blue, Discord purple, Reddit orange, etc.)
- Usage-based network sorting — most-used networks appear leftmost in the Android bar, sorted by open frequency via SharedPreferences
- Mute/unmute button in Android bottom bar with system-level WebView audio muting (API 26+)
- Grayscale focus mode button in Android bottom bar — toggles CSS `filter: grayscale(1)` on native WebView content
- Grayscale focus mode setting in Vue Settings dialog — syncs bidirectionally with Android native button via Tauri IPC
- Auto cookie consent — JS injected on every page load to accept cookie banners across all major CMPs (CookieBot, OneTrust, GDPR.eu, etc.) and text-pattern fallback
- Auto app-banner dismiss — JS injected to hide "download our app" / "open in app" prompts that block web usage

### Changed
- App renamed **SocialFlowz → SocialFlow** throughout: package name, Kotlin namespace, Tauri product identifier, folder paths, git remote, CI artifacts, tray tooltip
- Android overlay bar moved from top to bottom — consistent with native Android bottom bar placement
- Vue mobile overlay bar DOM order swapped: webview fills space, bar anchors to bottom with safe-area inset

### Fixed
- Network switch race condition on Android: `closeWebView` now uses `CountDownLatch` to block until UI thread completes before `openWebView` starts

---

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
