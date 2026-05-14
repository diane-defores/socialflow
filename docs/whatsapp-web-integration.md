# WhatsApp Web — Integration Notes

**Status:** Disabled (2026-04-12). Code commented out, not deleted, in 5 files (see "Re-enable" below).

## Why it's disabled

User reported an infinite loader on `web.whatsapp.com` after entering the phone number + 8-digit linking code, even with a paired phone on the other side. Testing on Android WebView with our current desktop UA spoofing (`DESKTOP_UA_NETWORKS` in `NativeWebViewPlugin.kt`) does not complete the Signal/Noise pairing handshake.

## Why it fails (hypotheses, ordered by likelihood)

1. **IndexedDB not persisted per profile.** WhatsApp Web stores the Signal protocol identity keys + session state in IndexedDB (`wawc`, `wawc_db`, `model-storage`). Our profile isolation only saves/restores **cookies** (`saveCookiesForSession` / `restoreCookiesForSession`). On every switch, IDB is effectively reset → pairing can't complete or is instantly lost. This is almost certainly the primary cause.

2. **Client Hints / `userAgentData` mismatch.** `STEALTH_SCRIPT` sets a Chrome 136 Windows UA string but does **not** patch `navigator.userAgentData` (brands, mobile=false, platform="Windows"). WhatsApp's client reads both and the mismatch is a hard signal for "fake desktop". This alone can stall the handshake silently.

3. **WebSocket pairing endpoint checks.** WhatsApp Web talks to `web.whatsapp.com/ws/chat` via a Noise-protocol WebSocket. The server may reject/delay handshake frames when TLS fingerprint + Client Hints + `Sec-CH-UA-*` headers don't match a real Chrome desktop. WebView cannot fake TLS fingerprints.

4. **Touch + screen signals.** Even with desktop UA, `window.ontouchstart`, `navigator.maxTouchPoints > 0`, and `(pointer: coarse)` still leak the Android origin. `STEALTH_SCRIPT` may not cover all of these for WhatsApp specifically.

5. **Service Worker lifecycle.** WhatsApp Web registers a SW that manages the connection. WebView SW support is limited and the SW may get killed between backgrounding events, causing the loader to hang on reconnect.

## What needs to be built to re-enable

Ordered from essential to nice-to-have:

- [ ] **Per-profile IndexedDB persistence.** Add a `saveIdbForSession` / `restoreIdbForSession` pair alongside the cookie helpers. Implementation options:
  - (a) `webview.evaluateJavascript` dump: iterate `indexedDB.databases()` → open each → cursor through object stores → serialize to JSON → store in `SharedPreferences` or a file under `sessions/{profileId}/{networkId}/idb.json`. Restore does the inverse. Fragile but pure JS.
  - (b) Copy the WebView's on-disk IDB directory (`/data/data/<pkg>/app_webview/Default/IndexedDB/`) between profile folders. Requires the WebView to be fully closed during copy. Faster and lossless.
  - Approach (b) is preferred — also solves localStorage, Cache API, and Service Worker registrations in one shot.

- [ ] **Patch `navigator.userAgentData`** in `STEALTH_SCRIPT` for `DESKTOP_UA_NETWORKS`:
  ```js
  Object.defineProperty(navigator, 'userAgentData', { get: () => ({
    brands: [{brand:'Chromium',version:'136'},{brand:'Google Chrome',version:'136'},{brand:'Not.A/Brand',version:'99'}],
    mobile: false,
    platform: 'Windows',
    getHighEntropyValues: async () => ({ platform:'Windows', platformVersion:'10.0.0', architecture:'x86', bitness:'64', model:'', uaFullVersion:'136.0.0.0' })
  })})
  ```

- [ ] **Suppress touch signals** when `currentNetworkId === "whatsapp"`:
  ```js
  Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 })
  delete window.ontouchstart
  // matchMedia('(pointer: coarse)') already patched for Snapchat — extend to WA
  ```

- [ ] **Test pairing flow end-to-end** with a real paired phone. Success = chat list loads within 30s after entering the code. Then background the app for 2 min and re-open; session must still be live.

- [ ] **Fallback UI** if pairing fails: show "WhatsApp Web requires a paired phone with WhatsApp installed — make sure your phone is online and try again" instead of letting the loader spin forever. Detect via timeout on the `_wawc_auth` cookie or an `isLoggedIn` check after 60s.

## Non-starters

- **"Login with email/password"** — does not exist. WhatsApp has no web login, only device pairing.
- **Native WhatsApp deep link** (`whatsapp://`) — already blocked in `shouldOverrideUrlLoading` and would open the native app, defeating the point.
- **Reverse-engineer the Noise protocol directly** — possible (see `whatsmeow`, `Baileys`) but means shipping a full WA client, not a WebView. Out of scope for SocialGlowz.

## Re-enable checklist

When the work above is done, uncomment WhatsApp in:

1. `src/stores/webviewState.ts` — `WEBVIEW_URLS.whatsapp`
2. `src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue` — menu item id 13
3. `src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue` — menu item id 13
4. `src/ui/setup/pages/SocialGlowz/components/OnboardingFlow.vue` — `NETWORKS` array
5. `src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt` — `NetworkInfo("whatsapp", ...)` in the NETWORKS list (around line 152)

`DESKTOP_UA_NETWORKS` (line ~2121) still contains `"whatsapp"` — leave it, it's harmless while disabled and needed when re-enabled.
