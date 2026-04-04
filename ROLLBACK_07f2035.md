# Rollback Plan From `07f2035`

Working baseline selected by user: `07f2035`

## Commits Added After Baseline

1. `909f2d1`:
   Android `NativeWebViewPlugin.kt` changes only.
   Main additions: Android WebView redirect/interception logic adjustments.

2. `d346b59`:
   Web/SEO/config reshaping.
   Main additions: `vite.web.config.ts`, `vercel.json`, `index.html`, README/TASKS rewrites, package/config updates.

3. `6a72c57`:
   Large marketing/landing rollout.
   Main additions: English/French static pages, `demo.html`, SEO injection script, landing CSS, web placeholder changes.

4. `c1769f3`:
   Android `NativeWebViewPlugin.kt` changes only.
   Main additions: more Android WebView login / redirect / in-app navigation handling.

5. `2524379`:
   First high-risk Android/UI/settings batch.
   Main additions:
   - Android native dark mode + text zoom hooks in `NativeWebViewPlugin.kt`
   - `src/stores/theme.ts`: `textZoom`
   - `src/ui/setup/pages/SocialFlow/App.vue`: `set_text_zoom`
   - `src/ui/setup/pages/SocialFlow/components/MobileLayout.vue`: text zoom UI
   - `404.html`, `public/robots.txt`, `scripts/generate-sitemap.mjs`

6. `9b89e6c`:
   UI settings expansion.
   Main additions: text zoom UI in `AppSettings.vue`, more MobileLayout changes, one Android plugin tweak.

7. `e3262cf`:
   Android bridge expansion.
   Main additions:
   - `src-tauri/plugins/android-webview/src/mobile.rs`
   - `src-tauri/src/lib.rs`
   - IPC bridge for `set_text_zoom`

8. `191dd10`:
   Small follow-up UI edits.
   Main additions: small `AppSettings.vue` / `MobileLayout.vue` adjustments.

9. `f96cc06`:
   Large marketing + build batch.
   Main additions:
   - comparison pages `en/vs-*`, `fr/vs-*`
   - pricing page rewrites
   - workflow changes
   - `src-tauri/Cargo.toml` edits
   - more `AppSettings.vue` / `MobileLayout.vue` edits

10. `2168c02`:
    Android + MobileLayout follow-up.
    Main additions: small Android plugin changes and extra MobileLayout logic.

11. `c677ba6`:
    Debug/rollback attempt batch.
    Main additions:
    - experimental Android WebView toggle
    - startup error screen / boot logs
    - diagnostic panel in MobileLayout
    - more Android plugin bridge code

## Files Changed Since Baseline

- Android native/plugin:
  - `src-tauri/plugins/android-webview/android/src/main/java/com/socialflow/webview/NativeWebViewPlugin.kt`
  - `src-tauri/plugins/android-webview/src/mobile.rs`
  - `src-tauri/src/lib.rs`
  - `src-tauri/Cargo.toml`

- Mobile app UI/state:
  - `src/stores/theme.ts`
  - `src/ui/setup/pages/SocialFlow/App.vue`
  - `src/ui/setup/pages/SocialFlow/main.ts`
  - `src/ui/setup/pages/SocialFlow/components/AppSettings.vue`
  - `src/ui/setup/pages/SocialFlow/components/MobileLayout.vue`
  - `src/ui/setup/pages/SocialFlow/components/NetworkWebviewHost.vue`

- Web / SEO / landing:
  - `404.html`
  - `demo.html`
  - `public/robots.txt`
  - `scripts/generate-sitemap.mjs`
  - `scripts/inject-seo.mjs`
  - `src/landing/main.css`
  - `vite.web.config.ts`
  - `vercel.json`
  - `en/*`
  - `fr/*`

- Project/config/docs:
  - `.claude/settings.json`
  - `.github/workflows/build.yml`
  - `.github/workflows/dev-builds.yml`
  - `README.md`
  - `TASKS.md`
  - `ecosystem.config.cjs`
  - `index.html`
  - `package.json`
  - `tailwind.config.cjs`
  - `src/locales/en.json`
  - `src/locales/fr.json`
  - `src/ui/setup/pages/SocialFlow/types/components.d.ts`

## Re-implementation Order After Rollback

1. Confirm Android launches from pure `07f2035` baseline.
2. Re-introduce Android native plugin changes in isolation.
3. Re-introduce `theme.ts` / text zoom store changes without Android bridge.
4. Re-introduce mobile settings UI with feature flags.
5. Re-introduce web/SEO/landing changes separately from Android work.

## Goal

Stop debugging a broken mixed state.
Return to the last known-good Android baseline, then re-apply changes in small reversible slices.
