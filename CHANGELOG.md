# Changelog

All notable changes to SocialFlow are documented here.

## [2026-05-02]

### Security
- **Native RustSec posture is explicit and gated** — patched the direct `rand` 0.8 line to `0.8.6`, documented the remaining Tauri/GTK/parser warnings as visible accepted upstream risk, and added `cargo audit` before Linux, Windows, and Android native artifact builds.

## [2026-04-28]

### Added
- **Critical auth/sync test coverage** — added Vitest coverage for Convex mutation invariants, cloud sync decisions, durable sync queue retries, Convex Auth token boundaries, and signup nudge timing; CI now runs tests, TypeScript checks, Convex typecheck, and non-mutating lint before Android debug builds.

### Changed
- **Cloud-backed Convex writes are stricter** — profiles, settings, custom links, friends filters, and social accounts now validate IDs, URL schemes, labels, profile ownership, active-account network matching, text zoom, language, avatar, and list bounds before persistence.
- **Contributor docs match the current stack** — README/CLAUDE command documentation now includes test commands and Convex typecheck, and README no longer references Clerk or Vite 5.

### Security
- **Cross-user active-account and profile/link writes are guarded server-side** — Convex mutations now reject foreign account pointers, wrong-network active account selections, unsafe custom link URLs, and missing or foreign profile references without partial writes.

## [2026-04-15]

### Changed
- **Convex sync is now durable instead of best-effort** — cloud writes for profiles, settings, links, friends filters, and social accounts are now persisted in a local retry queue, replayed automatically when the app regains focus/visibility/network, and flushed before cloud hydration so recent local edits are not silently lost
- **Default profile behavior is now account-safe** — the auto-created `Profile 1` fallback remains local-only until the user actually customizes it, so signing into an existing account no longer pollutes Convex with an unwanted placeholder profile

### Fixed
- **Android WebView dark mode reached only the native chrome** — the settings toggle now also pushes dark-mode hints down to the web content layer via Android WebView darkening APIs plus a `prefers-color-scheme`/`color-scheme` bridge, instead of recoloring only the bottom bar and status icons
- **Facebook mobile ignored dark mode despite the global bridge** — the Android plugin now aligns the host activity night mode, applies a Facebook-specific dark fallback from document start, cancels stale delayed reapplications across redirects, and includes targeted diagnostics so `m.facebook.com` now lands in dark mode instead of snapping back to light

## [2026-04-14]

### Added
- **Real multi-device Convex sync** — added cloud-backed sync for profiles, active profile, custom links, friends filter, SocialFlow accounts, and key preferences (`theme`, `language`, `grayscale`, `textZoom`, `haptic`, `tapSound`, onboarding state)

### Changed
- **Cloud sync bootstrap is now real instead of mostly aspirational** — the app now hydrates from Convex on sign-in/startup, uses a cloud-priority policy, and seeds the cloud when a signed-in user starts from a previously local-only device
- **Backup restore now re-seeds cloud state when signed in** — restoring a local encrypted backup while authenticated now republishes the restored configuration to Convex
- **Website messaging updated** — FR/EN `features`, `faq`, and `pricing` pages now explain exactly what is synced through the cloud and what remains local-only

### Fixed
- **Convex sync gap between UI promise and implementation** — profiles, friends filter, custom links, and most user preferences were still local-only despite account-sync messaging; the synchronized scope now matches the product copy much more closely
- **Accounts cloud reload never happened** — `accounts.loadFromCloud()` existed but was never triggered; auth bootstrap now performs actual cloud hydration
- **Cross-account leakage risk on shared devices** — signing out now resets the local synchronized state instead of leaving the previous account's cloud-backed config in place

## [2026-04-13]

### Added
- **Android WebView file chooser support** — implemented `WebChromeClient.onShowFileChooser` with an SAF-backed picker via `activityResultRegistry`, returning one or multiple `Uri`s to the page; unblocks photo/file selection flows for web composers such as Facebook post/message uploads
- **Targeted Android debug logs for Facebook upload/story analysis** — the native plugin now records navigation URL/scheme/host/path, page-finished UA mode, file chooser parameters (`accept`, `multiple`, `capture`) and picker results so copied debug logs are actionable for diagnosing WebView-only regressions
- **Bottom-bar quick controls in webviews** — the Android popup menu now includes a native dark-mode toggle and a text-zoom slider next to the profile switcher, so users can adjust readability without opening Settings

### Changed
- **Facebook reverted to mobile by default** — desktop UA is no longer forced globally; only story-like URLs can trigger a temporary desktop override, keeping the normal feed and composer in the mobile layout
- **Signup error UI in account surfaces** — settings drawer and signup nudge now render errors in a compact card with `Copy` / `Show more` controls instead of dumping the full raw message inline
- **Text zoom application is more aggressive on Android WebViews** — `set_text_zoom` now reapplies both native `WebSettings.textZoom` and a JS/CSS fallback (`-webkit-text-size-adjust`, plus a Facebook-specific font-size pass) to improve sites that ignore the native zoom setting

### Fixed
- **Convex Auth sign-in bootstrap on dev deployment** — the `users` schema is now compatible with `@convex-dev/auth` default writes (`createdAt` optional, auth verification fields/indexes added), the workspace is linked to a live Convex dev deployment, and missing auth signing secrets (`JWT_PRIVATE_KEY`, `JWKS`) were provisioned so password sign-in can mint session tokens instead of failing at startup
- **Account creation errors were hard to read/copy** — long backend/auth errors are truncated by default, can be expanded on demand, and the full raw message can be copied from both the drawer and the signup nudge
- **Android social WebView photo picker did nothing** — web `<input type="file">` requests now open the Android picker instead of failing silently
- **Facebook mobile story CTA no longer fails silently** — when the user taps `Créer une story` and Facebook only shows the mobile-app upsell, SocialFlow now explains that Stories are not available in Facebook mobile web instead of leaving the user with a disappearing prompt
- **Facebook UI diagnostics were noisy/broken** — `fb-ui` logs now flush correctly instead of throwing JSON parse errors, making copied logs readable for future debugging

## [2026-04-12]

### Removed
- **WhatsApp Web temporairement désactivé** — commenté dans `webviewState.ts`, `AppSidebar.vue`, `MobileLayout.vue`, `OnboardingFlow.vue`, et `NativeWebViewPlugin.kt` (liste `NETWORKS`). Symptôme : loader infini sur `web.whatsapp.com` après saisie du code de pairing à 8 chiffres, même avec un téléphone appairé. Cause principale : les clés Signal du protocole Noise sont stockées en IndexedDB, or notre isolation de profil ne persiste que les cookies — la session est donc vide à chaque ouverture et le handshake ne termine jamais. Cause secondaire : `navigator.userAgentData` non patché (UA Chrome 136 Windows mais `userAgentData.mobile = true` → mismatch détectable). Plan de réactivation complet et ordonné dans `docs/whatsapp-web-integration.md` (persister IDB par profil, patcher Client Hints, supprimer signaux touch, fallback UI sur timeout)

### Added
- **Backup coverage** — `useBackup.ts` now persists the `onboarding` store (completed flag), `sfz_text_zoom` (text zoom level), and `kanban-state` (board state) in addition to previously-covered stores and localStorage keys; closes gaps where restored devices lost zoom, kanban, and re-triggered the tutorial
- **Global haptic + tap sound on Vue buttons** — delegated `pointerdown` listener in `App.vue` matches `button`/`[role=button]`/`label[for]`/etc. and invokes `trigger_haptic` IPC, reusing the existing `hapticEnabled`/`tapSoundEnabled` gating; 50ms throttle prevents double-fire; opt-out via `data-no-haptic`
- **`set_tap_sound` + `trigger_haptic` Tauri commands** — new Kotlin commands registered in `build.rs` + capabilities; `haptic()` helper now also calls `view.playSoundEffect(CLICK)` when tap sound enabled

### Fixed
- **Android bottom bar showed all networks regardless of profile** — `syncBarNetworks()` lived in `NetworkWebviewHost.vue`, which only mounts when a webview is active, so from the dashboard Kotlin kept `visibleNetworkIds = null` and `sortedNetworks()` fell back to the full `NETWORKS` list; moved the sync into the persistent `App.vue` with a watcher on `activeProfile.id + hiddenNetworks` fingerprint (`immediate: true`) so the bar matches the dashboard on mount, profile switch, and visibility edits
- **Tap sound inaudible on device** — `view.playSoundEffect(CLICK)` respects the Android system "Touch sounds" setting (off by default on most devices), so the toggle silently did nothing; replaced with `SoundPool` loading a bundled 40 ms `assets/sounds/click.wav` (decayed 2 kHz sine) routed via `USAGE_MEDIA` so it plays on `STREAM_MUSIC` regardless of touch-sounds setting; init happens in plugin `load()`
- **Tap sound toggle was a dead switch** — setting was stored in localStorage but never read anywhere; now wired end-to-end from `MobileSettingsSheet` toggle → IPC → native plugin → `playSoundEffect` on button press
- **Haptic/tap-sound prefs not synced at boot** — Kotlin defaulted to `haptic=on`/`tapSound=off` on every cold start regardless of user setting; `App.vue` onMounted now pushes `sfz_haptic` + `sfz_tap_sound` from localStorage to the native plugin alongside `set_dark_mode` and `set_text_zoom`
- **Android backup restore fails after reinstall** — replaced MediaStore query (blocked by scoped storage ownership) with SAF file picker (`ACTION_OPEN_DOCUMENT`); user now selects the `.sfbak` file manually, works regardless of app reinstall
- **Backup error displayed as `[object Object]`** — Tauri plugin rejections are plain objects, not Error instances; error handler now extracts `.message` property

## [2026-04-11]

### Fixed
- **Android backup "command not found"** — registered `save_backup_to_downloads`, `load_backup_from_downloads`, `set_haptic` in plugin `build.rs` COMMANDS array; added `android-webview:default` to Tauri capabilities; fixed JS command names from camelCase to snake_case

## [Unreleased] — 2026-04-07

### Changed
- **Removed all "open source" claims** — 15 files (FR+EN): index, pricing, download, technology, FAQ, and 5 vs-* comparison pages; replaced with "privacy-focused" / "données locales" messaging
- **Comparison tables** — "Open source" row replaced with "Privacy (local data)" / "Vie privée (données locales)" across pricing and vs-* pages
- **Free tier description** — "Community edition (open source)" → "Free edition (2 profiles, 5 networks)" in all vs-* pricing tables

### Added
- **Lifetime Deal card** — pricing pages (FR+EN): 159$ barré → 99$ launch price, Pro features + lifetime updates, badge "Offre limitée" / "Limited offer"

### Refactored
- **Store deduplication** — consolidated 4 duplicate Pinia stores from `src/ui/.../stores/` into `src/stores/`; promoted rich implementations (KanbanService, GmailService, Microlink cache TTL) over stubs; moved services to `src/services/` and config to `src/config/`; updated 13 imports across 7 components; deleted 4 redundant store files (-549 lines)

### Fixed
- **XSS in SocialPost.vue** — `formatText()` now escapes HTML before injecting via `v-html`, preventing script injection through post content
- **IDOR in socialAccounts upsert** — Convex mutation now verifies `userId` ownership before patching an existing account record
- **Auth token types** — `convexAuth.ts` results typed with `AuthResult` interface instead of `any`; empty catches now log warnings instead of silently swallowing errors
- **Event listener leak in App.vue** — 5 Kotlin custom event handlers (`sfz-webview-back`, `sfz-grayscale-changed`, etc.) now properly removed on `onUnmounted`
- **Gravatar hash** — `gmailService.ts` broken `md5()` replaced with `crypto.subtle.digest('SHA-256')` for correct avatar URLs

### Changed
- **MobileLayout split** — extracted `MobileProfileSheet.vue` (profile management) and `MobileSettingsSheet.vue` (settings bottom sheet) from `MobileLayout.vue` (1972→956 lines)
- **Router cleanup** — removed dead `networkAccessGuard` and `roles` meta from all routes
- **Kanban i18n** — hardcoded French column names replaced with i18n keys (`kanban.todo`, `kanban.in_progress`, `kanban.done`)
- **`@vueuse/core`** — deduplicated version conflict, pinned to `^12.3.0` in deps only

### Security
- Removed dead Supabase client (`supabase-client.ts` + `supabase.d.ts`) — was creating live connections to a stale backend after Convex migration

### Added
- `.env.example` — documents required env vars (`VITE_CONVEX_URL`, `VITE_GMAIL_CLIENT_ID`, `VITE_GMAIL_API_KEY`)

## [Unreleased] — 2026-04-06

### Added
- Convex Auth — replaced Clerk with `@convex-dev/auth` (Anonymous + Password providers); auto-anonymous login on first launch, optional email/password upgrade
- Signup nudge system — soft conversion prompt, once per calendar day, max 5 then 10-day cooldown; bottom sheet on mobile, PrimeVue Dialog on desktop; promo offer text; stops permanently when account created
- Account section in Settings drawer — email/password signup form (anonymous users) or email display + sign out (registered users)
- `useSignupNudge` composable — localStorage-based timing logic with calendar-day checks
- `SignupNudge.vue` component — responsive (mobile bottom sheet / desktop dialog), email+password form with toast feedback
- `users.hasEmail` Convex query — checks authAccounts table for password provider
- Snapchat Web support — desktop UA + full device spoofing (maxTouchPoints, screen dimensions, navigator.platform, userAgentData, matchMedia pointer/hover) bypasses Snapchat's multi-layer mobile detection
- reCAPTCHA support in WebView — `WebChromeClient.onCreateWindow` + `setSupportMultipleWindows` + `javaScriptCanOpenWindowsAutomatically` enable reCAPTCHA verification popups that require child windows
- Haptic feedback setting — toggle in Settings drawer, persisted to localStorage, synced to Kotlin via `setHaptic` IPC; all `performHapticFeedback` calls gated by preference
- Tap sound setting — toggle in Settings drawer (UI ready, sound playback to be wired)
- Dashboard official SVG icons — `MessengerIcon.vue` and `QuoraIcon.vue` replace generic PrimeIcons (`pi-comments`, `pi-question-circle`) with Simple Icons logos
- Webview pooling — `hide_webview`/`show_webview` Rust IPC commands; switching networks hides the old webview off-screen instead of destroying it, preserving page state, scroll position, and cookies for instant re-show
- Webview preloading — top 3 visible networks preloaded off-screen at app startup so even the first click is instant
- Text zoom slider — `settings.textZoom` API (75-200%, step 25%), slider in Settings (mobile + desktop), persisted to localStorage, synced to Kotlin via `set_text_zoom` IPC; default 100% = no change
- Onboarding flow — 4-step first-launch guide (welcome, profile setup with emoji picker, network selection with brand-colored chips, feature tour); fullscreen, responsive, i18n (fr + en)
- Onboarding network customization tip — explains long-press to show/hide networks per profile in the feature tour step
- Replay onboarding — "Revoir le tutoriel" button in Settings (desktop dialog + mobile bottom sheet); resets onboarding store to re-show flow
- `onboarding` Pinia store — persisted `completed` boolean; gates onboarding display in `App.vue`
- DNS prefetch — `<link rel="dns-prefetch">` for 12 social network domains in `index.html`
- Service Worker (web build) — `vite-plugin-pwa` precaches 73 static assets + runtime cache for Microlink logos; instant reload on repeat visits

### Fixed
- Cookie consent auto-accept rewrite — auth-cookie detection (`isLoggedIn` flag per network); universal element scan (button, div, span, a, p); Quantcast CMP selector fixed; 30s MutationObserver auto-disconnect
- Cookie consent `robustClick()` — dispatches `pointerdown`+`pointerup`+`click` with real coordinates; fixes React/Meta apps (Instagram) where `.click()` alone doesn't trigger `onPointerDown` handlers
- Cookie consent cross-origin iframe script — `COOKIE_IFRAME_SCRIPT` injected via `addDocumentStartJavaScript` into all frames; handles Google Funding Choices CMP (Quora) rendered in cross-origin iframes
- Cookie consent now works on Pinterest, Reddit, and Instagram — previous version only found buttons inside specific containers and used basic `.click()`
- Stale auth cookies no longer block cookie consent — script injects on first page then checks auth, instead of checking first (expired cookies caused permanent skip)
- `__Host-` cookie restore — cookies with `__Host-` prefix now restored without `Domain=` attribute (RFC 6265bis spec); fixes Snapchat `__Host-sc-a-auth-session` silently rejected by CookieManager
- Persistent mute — `applyMuteToWebView` now uses MutationObserver to catch dynamically created `<video>`/`<audio>` + overrides `AudioContext` to silence Web Audio API; previously only muted elements present at call time
- Kotlin mute label — "Son activé" → "Activer le son" (action label when sound is muted)
- Settings drawer account section — styled signup form with gradient CTA, red sign-out button, proper spacing (was unstyled raw HTML)
- Android backup export was writing to private app sandbox (invisible to user) — now saves to `Download/SocialFlow/` via MediaStore; import loads the latest `.sfbak` from the same folder

### Improved
- Bottom bar icon opacity — smooth fade animations (600ms in, 800ms out) on touch instead of instant alpha change; removed 500ms postDelayed on release for immediate response

### Changed
- Cookie restore now sets domain-wide cookies — `baseDomainOf()` extracts `.example.com` from URLs and restores with `Domain=` attribute so API subdomains keep the session (fixes Snapchat and improves all networks)
- Cookie clear race condition fixed — `removeAllCookies` now uses callback to ensure async clear completes before restore begins (was fire-and-forget with `null` callback)
- Snapchat URL changed from `web.snapchat.com` (301 redirect) to `www.snapchat.com/web/` (direct) — prevents cookie domain mismatch after redirect
- Snapchat cookie domains added — `www.snapchat.com` + `accounts.snapchat.com` in COOKIE_URLS for complete session persistence
- Auth migrated from Clerk to Convex Auth — removed `@clerk/vue` + `svix`, added `@convex-dev/auth` + `@auth/core`; `convex/schema.ts` uses `authTables` (no more `clerkId`); `convex/http.ts` uses Convex Auth routes (no more Clerk webhook); Vue router uses hash history (`createWebHashHistory`) for Tauri Android compatibility
- Convex client upgraded from `ConvexHttpClient` (REST polling every 30s) to `ConvexClient` (WebSocket real-time subscriptions); auth wired globally via `setupConvexAuth()` — stores no longer need per-call token setup
- Routes lazy-loaded — all 10 network views use dynamic `() => import()` instead of static imports; enables Vite code splitting
- PrimeVue tree-shaking — 15 global `app.component()` registrations replaced by `PrimeVueResolver` auto-import; components loaded on demand
- Vendor chunk splitting — `manualChunks` separates vue/pinia (107KB) and primevue (373KB) into stable cached chunks; app code reduced from 764KB → 163KB
- `logoCache` store now persists to localStorage (`persist: true`)

---

## [Unreleased] — 2026-04-05

### Added
- Backup error copy button — "Copier" button in error dialogs copies raw error text to clipboard (fallback `execCommand` for WebView)
- FS capabilities — `allow-read-file`, `allow-mkdir`, `allow-read-dir`, `scope-appdata-recursive` for backup operations

### Fixed
- Backup export on Android — bypasses native SAF file picker (was blocking behind settings overlay); saves directly to `AppData/backups/` with timestamped filename
- Backup import on Android — reads most recent `.sfbak` from `AppData/backups/` without file picker

---

## [Unreleased] — 2026-03-15

### Added
- Kotlin i18n system — `Strings` object with FR/EN translations, `setLocale` IPC synced from Vue locale watcher; popup menu + blocked page fully translated
- Blocked page detection — HTTP 403 + Akamai "Access Denied" content check → user-friendly error page with clear cookies & retry, back, open in browser
- `clearCookiesAndRetry()` helper — wipes persisted Akamai tracking cookies and reloads

### Changed
- WebView UA uses `WebSettings.getDefaultUserAgent(context)` minus `; wv` token (was hardcoded Chrome 131 — caused fingerprint mismatch)
- Desktop UA bumped to Chrome 136

### Fixed
- French accents — 60+ strings in `fr.json` corrected (è/é/ê/à/û), "Français" in settings dropdown
- Text selection disabled app-wide via `user-select: none` in App.vue (was in never-imported `main.css`)
- Backup export hides Android `content://` URI — shows "Fichier sauvegardé dans Téléchargements" instead

---

## [Unreleased] — 2026-03-14

### Added
- Full i18n system — `vue-i18n` v11 with French and English locales (148 keys); language selector in Settings; all 15+ Vue components use `$t()` translation keys instead of hardcoded strings
- Backup UX redesign — step-based dialog flow: password entry → success screen (file path, 3-step import guide, security tip) or error screen (friendly messages, troubleshooting checklist, try-again button); import success shows countdown before auto-reload
- All user preferences now included in backup export/import: dark mode, grayscale, language (`user-locale`), custom links

### Changed
- `useBackup.ts` — `collectStoreData()` and `applyStoreData()` now handle `customLinks` store + 5 localStorage keys (`sfz_username`, `sfz_email`, `user-locale`, `theme`, `grayscale`)
- `i18n.ts` refactored for Tauri — reads saved locale from localStorage (was Chrome extension storage); exposes `setLocale()` helper for runtime language switching

### Removed
- Deleted unused `zh.json` Chinese locale file

---

## [Unreleased] — 2026-03-13 (c)

### Added
- Info banner in backup settings explaining why cloud sync cannot handle cookies (browser security restriction) and why encrypted export/import is the only safe transfer method

### Fixed
- Backup export crash on Android — `Read-only file system (os error 30)` when saving to Downloads; root cause: Rust `std::fs::write` cannot handle `content://` URIs returned by Android's SAF file dialog; fix: moved file I/O from Rust to JS via `@tauri-apps/plugin-fs` which handles content URIs transparently; Rust now only does encryption (returns base64), JS handles dialog + write

### Changed
- Backup architecture refactored: `export_backup`/`import_backup` Rust commands replaced with `create_backup`/`restore_backup` (crypto-only); added `tauri-plugin-fs` + `base64` crates; `fs:default` + `fs:allow-write-file` capabilities

---

## [Unreleased] — 2026-03-13 (b)

### Changed
- Mobile dashboard layout — profile card, quick actions, and notifications are now sticky (top); settings button sticky (bottom); only the network grid scrolls

---

## [Unreleased] — 2026-03-13

### Added
- Inline profile switching in Android popup menu — profiles listed with emoji + name, active profile highlighted, instant network reload on switch
- `set_profiles` IPC command (Rust + Kotlin) syncs profile list from Vue to Android popup
- Snapchat and Nextdoor custom SVG icons

### Changed
- Android popup menu: "Changer de profil" replaced with full inline profile list + section label + divider
- Profile switch from popup reloads current network with new profile's session data

---

## [Unreleased] — 2026-03-12 (c)

### Added
- 5 new social networks — Quora, Pinterest, WhatsApp, Telegram, Nextdoor added to webview store, sidebar, mobile layout, Kotlin bottom bar, system tray, and FriendsPanel
- Custom links per profile — users can add arbitrary URLs as webview tiles; `customLinks` Pinia store with UUID-based IDs; add/remove via long-press edit mode on mobile and "Liens personnalisés" section in desktop sidebar; routes through `selectCustom()` in webviewStore
- Kotlin bottom bar profile sync — `set_bar_networks` IPC command + `rebuildBottomBar()` in Kotlin; bar icons now reflect which networks are visible for the active profile

### Changed
- Friends filter toggle simplified — single global boolean instead of per-network map; toggle on dashboard or sidebar enables/disables for all networks at once

---

## [Unreleased] — 2026-03-12 (b)

### Added
- Anti-fingerprint stealth for native webviews — Chrome-on-Windows User-Agent (desktop) and Samsung Chrome Mobile UA (Android); `initialization_script` (desktop) and `onPageFinished` (Android) inject JS patches: `navigator.webdriver=false`, fake `window.chrome` object, default Chrome plugins array, `navigator.languages`, permissions.query fix, WebGL vendor/renderer spoofing (NVIDIA GTX 1650)
- Clear cookies per network — eraser icon button on each profile in the profile sheet; expands to 2-column grid of all 9 webview networks; tapping a network closes its webview + wipes session data (cookies, localStorage, IndexedDB) via `delete_network_session` IPC; green checkmark confirms completion; other networks remain untouched

### Fixed
- AppSidebar.vue syntax error — stray `}` after `setFilterEnabled` arrow function removed (was blocking Vite build)

---

## [Unreleased] — 2026-03-12

### Added
- Friends filter plugin — inject JS into native webviews to hide posts from non-friends using semantic DOM selectors (ARIA roles, `data-testid`, custom elements); MutationObserver for infinite scroll; `history.pushState` interception for SPA navigation; per-network friends list + toggle in sidebar and mobile layout
- Backup/restore — encrypted `.sfbak` archives using AES-256-GCM + Argon2 key derivation; native OS save/open file dialogs via `tauri-plugin-dialog`; exports sessions directory + Pinia stores; password-protected import/export from Settings
- `inject_script` Rust IPC command — evaluates arbitrary JS in a running social webview, identified by (profileId, networkId) pair

### Changed
- Dark mode CSS overhauled — `html.dark` selector replaces `.dark` for higher specificity over PrimeVue defaults; added full surface scale (21 CSS variables), focus ring, highlight colors, and `color-scheme: dark`
- Android bottom bar dark mode sync — `applyDarkModeToBottomBar()` updates divider colors, icon tints, and network button backgrounds without rebuilding the bar

---

## [Unreleased] — 2026-03-11 (d)

### Fixed
- Android network flash on open — `goHome()` and `navigateBackOrClose()` now call `destroySocialView()` instead of `hideSocialView()`, preventing stale content (e.g. Facebook) from flashing when opening a different network (e.g. Twitter) from the dashboard
- Redundant double `open_webview` IPC removed — `NetworkWebviewHost` `onMounted` duplicated the `watch({ immediate: true })` initial open, causing unnecessary webview reload

---

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
