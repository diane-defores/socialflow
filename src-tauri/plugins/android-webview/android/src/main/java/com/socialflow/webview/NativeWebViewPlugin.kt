package com.socialflow.webview

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.media.AudioAttributes
import android.media.SoundPool
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import android.view.MotionEvent
import androidx.activity.OnBackPressedCallback
import androidx.core.graphics.PathParser
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

private const val TAG = "SFZ"

@InvokeArg
class OpenWebViewArgs {
    var url: String = ""
    var accountId: String = ""
    var networkId: String = ""
}

@InvokeArg
class AccountArgs {
    var accountId: String = ""
}

@InvokeArg
class GrayscaleArgs {
    var enabled: Boolean = false
}

@InvokeArg
class DarkModeArgs {
    var enabled: Boolean = false
}

@InvokeArg
class TextZoomArgs {
    var level: Int = 100
}

@InvokeArg
class NavigateArgs {
    var url: String = ""
    var networkId: String = ""
}

@InvokeArg
class BarNetworksArgs {
    var networkIds: ArrayList<String> = arrayListOf()
}

@InvokeArg
class SetProfilesArgs {
    var profilesJson: String = "[]"
    var activeProfileId: String = ""
}

@InvokeArg
class SetLocaleArgs {
    var locale: String = "fr"
}

@InvokeArg
class DeleteSessionArgs {
    var profileId: String = ""
    var networkId: String = ""
}

@InvokeArg
class SaveBackupArgs {
    var base64Data: String = ""
    var fileName: String = ""
}

// Lightweight profile data for the popup menu
private data class ProfileMenuItem(val id: String, val name: String, val emoji: String)

// ── i18n ──────────────────────────────────────────────────────────────────────
private object Strings {
    private val translations = mapOf(
        // Popup menu
        "profiles" to mapOf("fr" to "Profils", "en" to "Profiles"),
        "mute_on" to mapOf("fr" to "Activer le son", "en" to "Sound on"),
        "mute_off" to mapOf("fr" to "Couper le son", "en" to "Mute"),
        "grayscale_on" to mapOf("fr" to "Désactiver niveaux de gris", "en" to "Disable grayscale"),
        "grayscale_off" to mapOf("fr" to "Niveaux de gris", "en" to "Grayscale"),
        "dark_mode_on" to mapOf("fr" to "Mode clair", "en" to "Light mode"),
        "dark_mode_off" to mapOf("fr" to "Mode sombre", "en" to "Dark mode"),
        // Blocked page
        "blocked_title" to mapOf("fr" to "Accès bloqué par", "en" to "Access blocked by"),
        "blocked_message" to mapOf(
            "fr" to "Ce site bloque les navigateurs intégrés. Vous pouvez effacer les cookies et réessayer, ou ouvrir le site dans votre navigateur.",
            "en" to "This site blocks embedded browsers. You can clear cookies and retry, or open the site in your browser."
        ),
        "blocked_clear_retry" to mapOf("fr" to "Effacer les cookies et réessayer", "en" to "Clear cookies and retry"),
        "blocked_back" to mapOf("fr" to "← Retour", "en" to "← Back"),
        "blocked_open_browser" to mapOf("fr" to "Ouvrir dans le navigateur", "en" to "Open in browser"),
    )

    var locale: String = "fr"

    fun t(key: String): String {
        return translations[key]?.get(locale) ?: translations[key]?.get("fr") ?: key
    }
}

// Network metadata for the bottom bar switcher
// iconChar: PrimeIcons codepoint (same font as the Vue app, loaded from assets/primeicons.ttf)
// color:    brand color shown as button background when active
private data class NetworkInfo(val id: String, val iconChar: String, val color: Int, val url: String)

private val NETWORKS = listOf(
    NetworkInfo("twitter",   "\ue9b6", Color.parseColor("#000000"), "https://x.com"),
    NetworkInfo("facebook",  "\ue9b4", Color.parseColor("#1877F2"), "https://facebook.com"),
    NetworkInfo("instagram", "\ue9cc", Color.parseColor("#E4405F"), "https://instagram.com"),
    NetworkInfo("linkedin",  "\ue9cb", Color.parseColor("#0A66C2"), "https://linkedin.com"),
    NetworkInfo("tiktok",    "\uea21", Color.parseColor("#010101"), "https://tiktok.com"),
    NetworkInfo("threads",   "\ue9d8", Color.parseColor("#000000"), "https://threads.net"),
    NetworkInfo("discord",   "\ue9c0", Color.parseColor("#5865F2"), "https://discord.com/app"),
    NetworkInfo("reddit",    "\ue9e8", Color.parseColor("#FF4500"), "https://reddit.com"),
    NetworkInfo("messenger", "\ue97e", Color.parseColor("#0099FF"), "https://www.facebook.com/messages"),
    NetworkInfo("snapchat",  "\ue96c", Color.parseColor("#FFFC00"), "https://www.snapchat.com/web/"),
    NetworkInfo("quora",     "\ue959", Color.parseColor("#A82400"), "https://www.quora.com"),
    NetworkInfo("pinterest", "\uea09", Color.parseColor("#E60023"), "https://www.pinterest.com"),
    // NetworkInfo("whatsapp",  "\ue9d0", Color.parseColor("#25D366"), "https://web.whatsapp.com"), // disabled 2026-04-12 — see docs/whatsapp-web-integration.md
    NetworkInfo("telegram",  "\ue9d3", Color.parseColor("#0088CC"), "https://web.telegram.org"),
    NetworkInfo("nextdoor",  "\ue968", Color.parseColor("#8ED500"), "https://nextdoor.com"),
)

// Official SVG path data from Simple Icons (24x24 viewBox) for networks without PrimeIcons glyphs
private val SVG_ICONS = mapOf(
    "threads" to "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z",
    "snapchat" to "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z",
    "messenger" to "M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13",
    "quora" to "M7.3799.9483A11.9628 11.9628 0 0 1 21.248 19.5397l2.4096 2.4225c.7322.7362.21 1.9905-.8272 1.9905l-10.7105.01a12.52 12.52 0 0 1-.304 0h-.02A11.9628 11.9628 0 0 1 7.3818.9503Zm7.3217 4.428a7.1717 7.1717 0 1 0-5.4873 13.2512 7.1717 7.1717 0 0 0 5.4883-13.2511Z",
)

// Anti-fingerprint JS — patches WebView detection vectors used by Akamai, PerimeterX, etc.
private val STEALTH_SCRIPT = """
(function(){
  if (window.__sfzStealth) return;
  window.__sfzStealth = true;
  // navigator.webdriver — automation/WebView flag
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  // window.chrome — real Chrome exposes this, WebViews don't
  if (!window.chrome) {
    window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){}, app: { isInstalled: false } };
  }
  // navigator.plugins — WebViews report empty
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      var arr = [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
      ];
      arr.item = function(i) { return arr[i] || null; };
      arr.namedItem = function(n) { return arr.find(function(p) { return p.name === n; }) || null; };
      arr.refresh = function() {};
      return arr;
    }
  });
  // navigator.languages
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  // permissions.query — Notification permission detection
  var origQuery = window.Permissions && Permissions.prototype.query;
  if (origQuery) {
    Permissions.prototype.query = function(params) {
      return params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : origQuery.call(this, params);
    };
  }

  // ── Desktop device spoofing (Snapchat, etc.) ──────────────────────────────
  // Sites like Snapchat Web check multiple JS signals beyond UA to detect mobile.
  // Only spoof when we're already sending a desktop UA (DESKTOP_UA_NETWORKS).
  if (/Windows NT 10\.0.*Chrome\/136/.test(navigator.userAgent)) {
    // Touch — desktop has no touchscreen
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
    delete window.ontouchstart;
    // Platform
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    // Screen dimensions — report standard desktop
    Object.defineProperty(window.screen, 'width', { get: () => 1920 });
    Object.defineProperty(window.screen, 'height', { get: () => 1080 });
    Object.defineProperty(window.screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(window.screen, 'availHeight', { get: () => 1040 });
    // User-Agent Client Hints JS API
    if (navigator.userAgentData) {
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({
          brands: [
            { brand: 'Chromium', version: '136' },
            { brand: 'Google Chrome', version: '136' },
            { brand: 'Not-A.Brand', version: '99' }
          ],
          mobile: false,
          platform: 'Windows',
          getHighEntropyValues: function() {
            return Promise.resolve({
              architecture: 'x86', bitness: '64', mobile: false,
              model: '', platform: 'Windows', platformVersion: '15.0.0',
              uaFullVersion: '136.0.0.0',
              brands: [{ brand: 'Chromium', version: '136.0.0.0' }, { brand: 'Google Chrome', version: '136.0.0.0' }],
              fullVersionList: [{ brand: 'Chromium', version: '136.0.0.0' }, { brand: 'Google Chrome', version: '136.0.0.0' }]
            });
          },
          toJSON: function() {
            return { brands: this.brands, mobile: false, platform: 'Windows' };
          }
        })
      });
    }
    // Media queries — pointer: fine (mouse), hover: hover
    var origMatchMedia = window.matchMedia;
    window.matchMedia = function(q) {
      if (q === '(pointer: coarse)') return Object.assign(origMatchMedia.call(this, q), { matches: false });
      if (q === '(pointer: fine)') return Object.assign(origMatchMedia.call(this, q), { matches: true });
      if (q === '(hover: hover)') return Object.assign(origMatchMedia.call(this, q), { matches: true });
      if (q === '(hover: none)') return Object.assign(origMatchMedia.call(this, q), { matches: false });
      return origMatchMedia.call(this, q);
    };
  }
})();
""".trimIndent()

// For desktop-UA networks: force a wide viewport so the desktop layout fits on a mobile screen.
// Without this, sites with <meta viewport width=device-width> render desktop CSS at phone width
// (~360px), making everything appear 3-4x zoomed in. Setting width=980 lets loadWithOverviewMode
// zoom out the page to fit. Messenger gets 500px for better readability.
private val DESKTOP_VIEWPORT_SCRIPT = """
(function(){
  if (!/Windows NT 10\.0.*Chrome\/136/.test(navigator.userAgent)) return;
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    (document.head || document.documentElement).appendChild(meta);
  }
  // Narrower viewport for Messenger — 500px makes text readable on mobile
  // instead of the default 980px which renders everything tiny
  var w = /facebook\.com\/messages/.test(window.location.href) ? 500 : 980;
  meta.setAttribute('content', 'width=' + w + ', shrink-to-fit=yes');
})();
""".trimIndent()

// JavaScript injected after every page load to dismiss "open in app" / "get the app" prompts.
// Strategy: inject persistent CSS to hide known banner elements, then click "Not now" buttons.
private val DISMISS_APP_BANNERS_SCRIPT = """
(function() {
  'use strict';
  if (window.__sfzAppBannerWatcher) return;
  window.__sfzAppBannerWatcher = true;

  // Persistent CSS — hides known app-banner elements even if re-inserted into the DOM
  var style = document.createElement('style');
  style.textContent =
    '#smart-banner, .smartbanner, .smart-banner, #smartbanner, .smartbanner-container,' +
    '[data-testid="BottomBar"],' +
    '#xpromo-banner, .xpromo, [data-testid="xpromo-interstitial"], #AppPromo, .AppPromo,' +
    '.IgCMI,' +
    '#app-download-guide,' +
    '[id*="app-banner" i], [id*="app-download" i], [id*="install-banner" i],' +
    '[class*="AppBanner"], [class*="app-install-prompt"],' +
    // Facebook / Instagram / Threads (Meta) — "Download" & "Open in app" banners
    '[data-sigil="mbasic_inline_feed_promo"], [data-sigil="app_banner"],' +
    '[id*="download-app" i], [class*="download-app" i],' +
    '[class*="MobileAppPromoBanner"], [class*="appBanner"],' +
    '#mobile-install-banner, [data-testid="mobile_app_banner"],' +
    '[class*="open-in-app" i], [class*="openInApp" i],' +
    '[data-testid*="open-in-app" i], [data-testid*="app_upsell" i]' +
    '{ display: none !important; }';
  (document.head || document.documentElement).appendChild(style);

  // Remove HTML smart-app-banner meta tags (prevents browser-native banners)
  function removeSmartBannerMeta() {
    document.querySelectorAll('meta[name="apple-itunes-app"], meta[name="google-play-app"]')
      .forEach(function(el) { el.parentNode && el.parentNode.removeChild(el); });
  }

  // Text patterns for "stay in browser / not now" dismiss buttons
  var DISMISS_RE = /^(not now|pas maintenant|no thanks|non merci|continue in browser|continuer dans le navigateur|stay in browser|rester sur le site|use web|utiliser le web|continue to site|maybe later|peut-être plus tard|dismiss|ignorer|skip|passer|×|✕|close|fermer|log in|se connecter)$/i;

  // Hide banners by text content (e.g. "Download Facebook for Android")
  var DOWNLOAD_RE = /t(é|e)l(é|e)charger.*(facebook|instagram|threads|android)|download.*(facebook|instagram|threads|android)|naviguer plus vite|browse faster|open in app|ouvrir.*(l.application|l.app)|get the app|installer l.app/i;
  function hideDownloadBanners() {
    var els = document.querySelectorAll('div, section, aside, header, [role="banner"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.children.length > 10 || el.offsetHeight > 120) continue;
      var txt = (el.textContent || '').trim();
      if (txt.length < 200 && DOWNLOAD_RE.test(txt)) {
        el.style.display = 'none';
      }
    }
  }

  function dismissAppPrompts() {
    removeSmartBannerMeta();
    hideDownloadBanners();

    var btns = document.querySelectorAll('button, a[role="button"], [role="button"], a');
    for (var i = 0; i < btns.length; i++) {
      var el = btns[i];
      if (!el.offsetParent) continue;
      var label = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
      if (!DISMISS_RE.test(label)) continue;
      // Only click if the button lives inside an app-promotion container
      var parent = el.closest(
        '[id*="app" i], [class*="app" i], [id*="banner" i], [class*="banner" i],' +
        '[id*="install" i], [class*="install" i], [id*="promo" i], [class*="promo" i]'
      );
      if (parent) { el.click(); return; }
    }
  }

  dismissAppPrompts();
  setTimeout(dismissAppPrompts, 800);
  setTimeout(dismissAppPrompts, 2500);

  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length) { setTimeout(dismissAppPrompts, 300); break; }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
""".trimIndent()

// Lightweight cookie-accept script injected via addDocumentStartJavaScript into ALL frames.
// Only runs inside iframes (skips main frame) — handles cross-origin CMP dialogs
// like Google Funding Choices (Quora) that render consent UI in an iframe.
private val COOKIE_IFRAME_SCRIPT = """
(function() {
  'use strict';
  if (window === window.top) return;
  if (window.__sfzCookieIframe) return;
  window.__sfzCookieIframe = true;

  var RE = /^(accept( all( cookies?)?)?|i accept|allow( all( cookies?)?)?|i agree|agree|tout accepter|accepter( tout(es)?)?|autoriser( tous?( les cookies?)?)?|j'accepte|confirm all)$/i;

  function clickEl(el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && !el.offsetParent) return false;
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    try {
      var opts = {bubbles:true, cancelable:true, clientX:x, clientY:y, pointerId:1, pointerType:'touch'};
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
    } catch(e) {}
    el.click();
    return true;
  }
  function tryClick() {
    // Buttons first, then divs/spans as fallback
    var selectors = ['button, a, [role="button"]', 'div, span, p'];
    for (var s = 0; s < selectors.length; s++) {
      var els = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < els.length; i++) {
        var label = (els[i].textContent || els[i].getAttribute('aria-label') || '').trim();
        if (RE.test(label) && clickEl(els[i])) return;
      }
    }
  }

  var attempts = 0;
  var interval = setInterval(function() {
    tryClick();
    if (++attempts >= 100) clearInterval(interval);
  }, 50);
  tryClick();
})();
""".trimIndent()

// JavaScript injected after every page load to auto-accept cookie consent dialogs.
// Uses MutationObserver so it also catches dialogs that appear after initial load.
private val COOKIE_ACCEPT_SCRIPT = """
(function() {
  'use strict';
  if (window.__sfzCookieWatcher) return; // already installed
  window.__sfzCookieWatcher = true;

  // Specific CMP selectors (OneTrust, CookieBot, Didomi, Axeptio, Quantcast, Meta/Instagram…)
  var SELECTORS = [
    '#onetrust-accept-btn-handler',
    '#accept-recommended-btn-handler',
    '.onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyButtonAccept',
    '#CybotCookiebotDialogBodyLevelButtonAccept',
    '#didomi-notice-agree-button',
    '#didomi-notice-learn-more-button ~ button',
    '[data-consent="accept"]',
    '[id="axeptio_btn_acceptAll"]',
    '.qc-cmp2-summary-buttons button[mode="primary"]',
    '.qc-cmp2-summary-buttons button:first-child',
    '.sp_choice_type_11',
    '[data-testid="GDPR-accept"]',
    '[data-testid="cookie-policy-manage-dialog-accept-button"]',
    '[data-cookiebanner="accept_button"]',
    '#L2AGLb',
    '.tOjcNe',
    '[aria-label="Accept all"]',
    '[aria-label="Tout accepter"]',
    '[aria-label="Allow all cookies"]',
    '[aria-label="Autoriser tous les cookies"]',
    // TikTok
    '[data-e2e="cookie-banner-accept"]',
    '.tiktok-cookie-banner button:last-child',
    '[class*="CookieBanner"] button:last-child',
    '[class*="cookie-banner"] button:last-child'
  ];

  // Text patterns matched case-insensitively against button innerText / aria-label
  var ACCEPT_RE = /^(accept( all( cookies?)?)?|accept cookies on this browser|accepter( tout(es)?( les cookies?)?)?|tout accepter|tout autoriser|autoriser( tous?( les cookies?)?)?|autoriser les cookies.*|allow( all( cookies?)?)?|allow.*cookies|i agree|j'accepte|ok|got it|i accept|confirm all|agree)$/i;

  // Robust click: dispatch pointer events (for React/Vue onPointerDown handlers)
  // then native click. Covers all frameworks.
  function robustClick(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && !el.offsetParent) return false;
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    try {
      var opts = {bubbles:true, cancelable:true, clientX:x, clientY:y, pointerId:1, pointerType:'touch'};
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
    } catch(e) {}
    el.click();
    return true;
  }

  // TikTok uses <tiktok-cookie-banner> custom element with Shadow DOM.
  // Normal selectors can't reach inside — we must access shadowRoot directly.
  function tryTikTokShadowBanner() {
    try {
      var banner = document.querySelector('tiktok-cookie-banner');
      if (!banner || !banner.shadowRoot) return false;
      var btns = banner.shadowRoot.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var label = (btns[i].textContent || '').trim();
        if (ACCEPT_RE.test(label)) { robustClick(btns[i]); return true; }
      }
      // Fallback: click the last button (typically "Allow all" / "Accept")
      if (btns.length > 0) { robustClick(btns[btns.length - 1]); return true; }
    } catch(e) {}
    return false;
  }

  // Diagnostic log — collected and sent to Kotlin debug logs after 6s
  var log = [];
  function L(msg) { log.push(msg); }

  function tryAccept() {
    // 0. TikTok shadow DOM banner (must be checked before normal selectors)
    if (tryTikTokShadowBanner()) { L('CLICKED via TikTok shadow DOM'); return true; }

    // 1. Try known CMP selectors — only click interactive elements
    //    (aria-label selectors can match container divs, not buttons)
    for (var i = 0; i < SELECTORS.length; i++) {
      try {
        var el = document.querySelector(SELECTORS[i]);
        if (!el) continue;
        var tag = el.tagName;
        if (tag !== 'BUTTON' && tag !== 'A' && !el.getAttribute('role')) {
          L('CMP skip non-interactive: ' + SELECTORS[i] + ' → <' + tag + '> "' + (el.textContent||'').trim().substring(0,40) + '"');
          continue;
        }
        if (robustClick(el)) { L('CLICKED via CMP selector: ' + SELECTORS[i]); return true; }
      } catch(e) {}
    }

    // 2. Scan elements in two passes: interactive first (button/a), then any element.
    //    This prevents clicking a parent <div> when the real <button> is inside it.
    function scanDoc(doc) {
      // Pass 1: buttons and links only (the actual clickable elements)
      var btns = doc.querySelectorAll('button, a, [role="button"]');
      for (var b = 0; b < btns.length; b++) {
        var label = (btns[b].textContent || btns[b].getAttribute('aria-label') || '').trim();
        if (ACCEPT_RE.test(label) && robustClick(btns[b])) {
          L('CLICKED via btn scan: <' + btns[b].tagName + '> "' + label + '"');
          return true;
        }
      }
      // Pass 2: any element (div, span, p) — fallback for non-standard CMPs
      var els = doc.querySelectorAll('div, span, p');
      for (var b = 0; b < els.length; b++) {
        var label = (els[b].textContent || els[b].getAttribute('aria-label') || '').trim();
        if (ACCEPT_RE.test(label) && robustClick(els[b])) {
          L('CLICKED via div scan: <' + els[b].tagName + '> "' + label + '"');
          return true;
        }
      }
      return false;
    }
    if (scanDoc(document)) return true;

    // 3. Scan same-origin iframes (some CMPs like Quantcast render in an iframe)
    var iframes = document.querySelectorAll('iframe');
    for (var f = 0; f < iframes.length; f++) {
      try {
        var doc = iframes[f].contentDocument;
        if (doc && scanDoc(doc)) { L('CLICKED via iframe #' + f); return true; }
      } catch(e) { L('iframe #' + f + ' cross-origin (skipped)'); }
    }
    return false;
  }

  // Retry every 50ms for 5 seconds, then stop.
  var clicked = false;
  var attempts = 0;
  var interval = setInterval(function() {
    if (!clicked) clicked = tryAccept();
    if (clicked || ++attempts >= 100) clearInterval(interval);
  }, 50);
  clicked = tryAccept();

  // After 6s, expose diagnostic log for Kotlin to retrieve
  setTimeout(function() {
    window.__sfzCookieLog = (clicked ? 'OK' : 'FAIL') + ' (' + attempts + ' attempts)\\n' + log.join('\\n');
  }, 6000);
})();
""".trimIndent()

@TauriPlugin
class NativeWebViewPlugin(private val activity: Activity) : Plugin(activity) {

    // Main Tauri WebView (the one running Vue) — used to dispatch CustomEvents to Vue
    // via evaluateJavascript(). This is the reliable Kotlin→Vue communication channel.
    // (Plugin trigger() + addPluginListener was unreliable in testing.)
    private var mainWebView: WebView? = null

    private var socialRoot: FrameLayout? = null
    private var socialWebView: WebView? = null
    private var prewarmedWebView: WebView? = null
    private var currentAccountId: String? = null
    private var currentNetworkId: String? = null

    // Back-stack baseline — set after the initial page+redirects settle.
    // canGoBack() returns true for redirect-created entries too, so we only treat
    // it as real navigable history if currentIndex > initialBackIndex.
    private var initialBackIndex = -1

    // Mute state — survives network switches within a session
    private var isMuted = false

    // Grayscale state — survives network switches within a session
    private var isGrayscale = false

    // Haptic feedback — controlled from Vue settings, defaults to on
    private var hapticEnabled = true

    // Tap sound — controlled from Vue settings, defaults to off.
    // We use SoundPool with a bundled click.wav rather than view.playSoundEffect()
    // because the latter respects the system "Touch sounds" setting, which is
    // off by default on most Android devices.
    private var tapSoundEnabled = false
    private var soundPool: SoundPool? = null
    private var clickSoundId: Int = 0
    private var clickSoundLoaded: Boolean = false

    // Text zoom level — percentage, 100 = default
    private var textZoomLevel: Int = 100

    // SAF file picker — pending invoke for backup restore
    private var pendingBackupInvoke: Invoke? = null
    private var pickBackupLauncher: androidx.activity.result.ActivityResultLauncher<android.content.Intent>? = null
    private var pendingFilePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>? = null
    private var pickFileLauncher: androidx.activity.result.ActivityResultLauncher<android.content.Intent>? = null

    private fun haptic(view: View, type: Int = HapticFeedbackConstants.KEYBOARD_TAP) {
        if (hapticEnabled) view.performHapticFeedback(type)
        if (tapSoundEnabled) playClickSound()
    }

    private fun playClickSound() {
        val pool = soundPool ?: return
        if (!clickSoundLoaded) return
        pool.play(clickSoundId, 1.0f, 1.0f, 1, 0, 1.0f)
    }

    private fun initSoundPool() {
        if (soundPool != null) return
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val pool = SoundPool.Builder()
            .setMaxStreams(2)
            .setAudioAttributes(attrs)
            .build()
        pool.setOnLoadCompleteListener { _, _, status ->
            clickSoundLoaded = (status == 0)
            if (status != 0) Log.w(TAG, "click.wav failed to load (status=$status)")
        }
        try {
            val afd = activity.assets.openFd("sounds/click.wav")
            clickSoundId = pool.load(afd, 1)
            afd.close()
        } catch (e: Exception) {
            Log.w(TAG, "Could not load click.wav from assets", e)
        }
        soundPool = pool
    }
    private var bottomBarView: LinearLayout? = null

    // Dark mode state — synced from Vue settings toggle
    private var isDarkMode = false

    // Cookie consent: only inject when not logged in.
    // Detected by checking for auth cookies specific to each network.
    // pagesSinceOpen ensures the first 3 pages always get the script
    // (consent can appear after redirects, not just on page 1).
    private var isLoggedIn = false
    private var pagesSinceOpen = 0

    // Auth cookie names per network — these cookies only exist when logged in.
    private val AUTH_COOKIES = mapOf(
        "instagram" to listOf("sessionid", "ds_user_id"),
        "facebook"  to listOf("c_user"),
        "messenger" to listOf("c_user"),
        "twitter"   to listOf("auth_token", "ct0"),
        "tiktok"    to listOf("sessionid", "sid_tt"),
        "pinterest"  to listOf("_auth", "_pinterest_sess"),
        "linkedin"  to listOf("li_at"),
        "reddit"    to listOf("reddit_session", "token_v2"),
        "threads"   to listOf("sessionid", "ds_user_id"),
        "discord"   to listOf("__dcfduid", "__sdcfduid"),
        "snapchat"  to listOf("sc-a-session"),
        "quora"     to listOf("m-login"),  // m-b is set for all visitors, m-login only after auth
        "whatsapp"  to listOf("wa_lang_pref"),  // minimal signal — WhatsApp Web is auth-gated
        "telegram"  to listOf("stel_ssid"),
        "nextdoor"  to listOf("ndsid"),
    )

    /** Check if the current network has auth cookies → user is logged in. */
    private fun checkLoggedIn(): Boolean {
        val networkId = currentNetworkId ?: return false
        val authNames = AUTH_COOKIES[networkId] ?: return false
        val cm = CookieManager.getInstance()
        val net = NETWORKS.find { it.id == networkId } ?: return false
        val cookies = cm.getCookie(net.url) ?: return false
        return authNames.any { name -> cookies.contains("$name=") }
    }


    // Visible network IDs — synced from Vue profile visibility (null = show all)
    private var visibleNetworkIds: Set<String>? = null

    // Profile list for the popup menu — synced from Vue whenever profiles change
    private var menuProfiles: List<ProfileMenuItem> = emptyList()
    private var activeProfileId: String = ""

    // Hardware back button intercept — registered when webview opens, removed when closed
    private var backCallback: OnBackPressedCallback? = null

    // PrimeIcons typeface — loaded once from assets/primeicons.ttf
    private val primeIconsTypeface: Typeface by lazy {
        Typeface.createFromAsset(activity.assets, "primeicons.ttf")
    }

    init {
        Log.i(TAG, "NativeWebViewPlugin instantiated")
    }

    /**
     * Walk the view hierarchy to find the FIRST WebView that is NOT our social webview.
     * This is the Tauri/WRY main WebView running the Vue app.
     */
    private fun findMainWebViewInHierarchy(): WebView? {
        val root = activity.window?.decorView as? ViewGroup ?: return null
        return findWebViewRecursive(root)
    }

    private fun findWebViewRecursive(parent: ViewGroup): WebView? {
        for (i in 0 until parent.childCount) {
            val child = parent.getChildAt(i)
            if (child is WebView && child !== socialWebView) {
                return child
            }
            if (child is ViewGroup) {
                val found = findWebViewRecursive(child)
                if (found != null) return found
            }
        }
        return null
    }

    /**
     * Get the main Tauri WebView — uses load() reference, with view-hierarchy fallback.
     */
    private fun getMainWebView(): WebView? {
        mainWebView?.let { return it }
        // Fallback: walk the view hierarchy
        val found = findMainWebViewInHierarchy()
        if (found != null) {
            mainWebView = found
            Log.i(TAG, "mainWebView found via view hierarchy fallback: ${found.hashCode()}")
        } else {
            Log.e(TAG, "mainWebView not found — load() was not called and hierarchy search failed")
        }
        return found
    }

    // ── Debug log buffer — last 200 lines, copyable from popup menu ─────────
    private val debugLog = mutableListOf<String>()
    private fun dbg(msg: String) {
        val ts = java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.US).format(java.util.Date())
        val line = "$ts $msg"
        Log.i(TAG, msg)
        synchronized(debugLog) {
            debugLog.add(line)
            if (debugLog.size > 200) debugLog.removeAt(0)
        }
    }

    // Usage counters — persisted across app restarts via SharedPreferences
    private val prefs by lazy {
        activity.getSharedPreferences("sfz_network_usage", Context.MODE_PRIVATE)
    }

    // Cookie isolation — save/restore cookies per (profile, network) pair.
    // Android CookieManager is a singleton shared by all WebViews, so we manually
    // save cookies before closing and restore them before opening.
    private val cookiePrefs by lazy {
        activity.getSharedPreferences("sfz_cookies", Context.MODE_PRIVATE)
    }

    // All base URLs we need to save/restore cookies for
    private val COOKIE_URLS = NETWORKS.map { it.url } + listOf(
        "https://www.facebook.com", "https://m.facebook.com",
        "https://www.instagram.com", "https://m.instagram.com",
        "https://www.threads.net", "https://mobile.twitter.com",
        "https://www.tiktok.com", "https://www.reddit.com",
        "https://www.linkedin.com",
        "https://www.snapchat.com",
        "https://accounts.snapchat.com",
    )

    /** Save all cookies for the current profile session key. */
    private fun saveCookiesForSession(sessionKey: String) {
        dbg("── SAVE cookies for: $sessionKey ──")
        val cm = CookieManager.getInstance()
        val editor = cookiePrefs.edit()
        var totalSaved = 0
        for (url in COOKIE_URLS) {
            val cookies = cm.getCookie(url)
            if (cookies != null) {
                val names = cookies.split(";").map { it.trim().substringBefore("=") }
                editor.putString("$sessionKey|$url", cookies)
                // Detailed log for Snapchat domains
                if (url.contains("snapchat")) {
                    dbg("  SAVE $url → ${names.size} cookies: ${names.joinToString(", ")}")
                    dbg("  RAW: ${cookies.take(300)}")
                }
                totalSaved += names.size
            } else {
                editor.remove("$sessionKey|$url")
                if (url.contains("snapchat")) {
                    dbg("  SAVE $url → null (no cookies)")
                }
            }
        }
        editor.apply()
        dbg("── SAVE done: $totalSaved total cookies saved ──")
    }

    /** Clear all cookies, then restore saved cookies for the target session. */
    /** Extract base domain from URL host (e.g. www.snapchat.com → .snapchat.com).
     *  Restored cookies are set as domain-wide so all subdomains can access them.
     *  Without this, cookies originally set on .snapchat.com get restored only for
     *  www.snapchat.com, and API subdomains lose the session. */
    private fun baseDomainOf(url: String): String? {
        val host = android.net.Uri.parse(url).host ?: return null
        val parts = host.split(".")
        return if (parts.size >= 2) ".${parts.takeLast(2).joinToString(".")}" else null
    }

    private fun restoreCookiesForSession(sessionKey: String) {
        dbg("── RESTORE cookies for: $sessionKey ──")
        val cm = CookieManager.getInstance()
        dbg("  removeAllCookies → starting async clear...")
        // removeAllCookies is ASYNC — restore only after it completes,
        // otherwise the pending removal can wipe freshly-restored cookies.
        cm.removeAllCookies { cleared ->
            dbg("  removeAllCookies callback → cleared=$cleared")
            var restoredUrls = 0
            var restoredCookies = 0
            for (url in COOKIE_URLS) {
                val cookies = cookiePrefs.getString("$sessionKey|$url", null) ?: continue
                val domain = baseDomainOf(url)
                val parts = cookies.split(";")
                // setCookie expects one cookie at a time; the stored string may have multiple
                for (cookie in parts) {
                    val trimmed = cookie.trim()
                    if (trimmed.isNotEmpty()) {
                        // __Host- cookies MUST NOT have a Domain attribute (RFC 6265bis).
                        // Setting Domain= on them causes silent rejection by the browser.
                        val name = trimmed.substringBefore("=")
                        val cookieWithAttrs = if (name.startsWith("__Host-")) {
                            "$trimmed; Path=/; Secure"
                        } else if (domain != null) {
                            "$trimmed; Domain=$domain; Path=/; Secure"
                        } else {
                            trimmed
                        }
                        cm.setCookie(url, cookieWithAttrs)
                        restoredCookies++
                    }
                }
                // Detailed log for Snapchat domains
                if (url.contains("snapchat")) {
                    val names = parts.map { it.trim().substringBefore("=") }
                    dbg("  RESTORE $url (domain=$domain) → ${names.size} cookies: ${names.joinToString(", ")}")
                }
                restoredUrls++
            }
            cm.flush()
            dbg("── RESTORE done: $restoredCookies cookies across $restoredUrls URLs ──")
            // Verify: read back Snapchat cookies to confirm they're set
            val snapVerify = cm.getCookie("https://www.snapchat.com")
            val snapAccVerify = cm.getCookie("https://accounts.snapchat.com")
            val snapNames = snapVerify?.split(";")?.map { it.trim().substringBefore("=") }
            val snapAccNames = snapAccVerify?.split(";")?.map { it.trim().substringBefore("=") }
            dbg("  VERIFY www.snapchat.com → ${snapNames?.size ?: 0} cookies: ${snapNames?.joinToString(", ") ?: "null"}")
            dbg("  VERIFY accounts.snapchat.com → ${snapAccNames?.size ?: 0} cookies: ${snapAccNames?.joinToString(", ") ?: "null"}")
        }
    }

    /** Capture the main Tauri WebView on plugin load — this is the Vue app webview. */
    override fun load(webView: WebView) {
        mainWebView = webView
        Log.i(TAG, "load() called — mainWebView captured: ${webView.hashCode()}")
        // Pre-warm a WebView so the first network open is instant (~200ms saved)
        activity.runOnUiThread {
            prewarmedWebView = createWebView()
            Log.i(TAG, "WebView pre-warmed")
        }
        // Init SoundPool for tap sound (uses bundled asset, independent of system "Touch sounds" setting)
        initSoundPool()
        // Register SAF file pickers using activityResultRegistry directly
        // (works regardless of lifecycle state, unlike registerForActivityResult on ComponentActivity)
        try {
            (activity as? androidx.activity.ComponentActivity)?.let { componentActivity ->
                pickBackupLauncher = componentActivity.activityResultRegistry.register(
                    "sfz_backup_picker",
                    androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
                ) { result ->
                    val invoke = pendingBackupInvoke ?: return@register
                    pendingBackupInvoke = null

                    if (result.resultCode != Activity.RESULT_OK || result.data?.data == null) {
                        invoke.reject("Aucun fichier sélectionné")
                        return@register
                    }

                    try {
                        val uri = result.data!!.data!!
                        val bytes = activity.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                            ?: throw Exception("Could not read backup file")
                        val b64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
                        val jsResult = JSObject()
                        jsResult.put("base64", b64)
                        invoke.resolve(jsResult)
                    } catch (e: Exception) {
                        invoke.reject(e.message ?: "Load backup failed")
                    }
                }
                Log.i(TAG, "Backup file picker registered via activityResultRegistry")

                pickFileLauncher = componentActivity.activityResultRegistry.register(
                    "sfz_web_file_picker",
                    androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
                ) { result ->
                    val callback = pendingFilePathCallback ?: return@register
                    pendingFilePathCallback = null
                    dbg("[file] picker resultCode=${result.resultCode}")

                    if (result.resultCode != Activity.RESULT_OK) {
                        dbg("[file] picker cancelled")
                        callback.onReceiveValue(null)
                        return@register
                    }

                    val intent = result.data
                    val uris = mutableListOf<android.net.Uri>()

                    try {
                        val clipData = intent?.clipData
                        if (clipData != null) {
                            for (i in 0 until clipData.itemCount) {
                                clipData.getItemAt(i)?.uri?.let { uri ->
                                    try {
                                        activity.contentResolver.takePersistableUriPermission(
                                            uri,
                                            android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
                                        )
                                    } catch (_: Exception) {}
                                    uris.add(uri)
                                }
                            }
                        }

                        intent?.data?.let { uri ->
                            try {
                                activity.contentResolver.takePersistableUriPermission(
                                    uri,
                                    android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
                                )
                            } catch (_: Exception) {}
                            if (!uris.contains(uri)) uris.add(uri)
                        }

                        callback.onReceiveValue(
                            if (uris.isEmpty()) null else uris.toTypedArray()
                        )
                        dbg("[file] picker returned ${uris.size} uri(s): ${uris.joinToString(", ")}")
                    } catch (e: Exception) {
                        Log.w(TAG, "Web file picker result handling failed: ${e.message}")
                        dbg("[file] picker handling failed: ${e.message}")
                        callback.onReceiveValue(null)
                    }
                }
                Log.i(TAG, "Web file picker registered via activityResultRegistry")
            } ?: Log.w(TAG, "Activity is not a ComponentActivity — file picker unavailable")
        } catch (e: Exception) {
            Log.w(TAG, "Could not register file pickers: ${e.message}")
        }
    }

    /**
     * Dispatch a CustomEvent on the main Tauri WebView (the Vue app).
     * This is the reliable Kotlin→Vue communication channel — same mechanism
     * as evaluateJavascript() used for grayscale/mute on the social webview.
     */
    private fun dispatchToVue(eventName: String, detailJson: String = "{}") {
        val wv = getMainWebView() ?: return
        val js = "window.dispatchEvent(new CustomEvent('$eventName', { detail: $detailJson }))"
        wv.evaluateJavascript(js, null)
    }

    private fun incrementUsage(networkId: String) {
        val count = prefs.getInt(networkId, 0)
        prefs.edit().putInt(networkId, count + 1).apply()
    }

    /** Returns NETWORKS sorted by usage count descending (most used → first),
     *  filtered by the visible set from the active profile. */
    private fun sortedNetworks(): List<NetworkInfo> {
        val visible = visibleNetworkIds
        val base = if (visible != null) NETWORKS.filter { it.id in visible } else NETWORKS
        return base.sortedByDescending { prefs.getInt(it.id, 0) }
    }

    // ── Display setup (edge-to-edge) ─────────────────────────────────────────

    @Command
    fun setupDisplay(invoke: Invoke) {
        activity.runOnUiThread { setupEdgeToEdge() }
        invoke.resolve(JSObject())
    }

    /**
     * Edge-to-edge mode: content extends behind the status bar.
     * The status bar becomes a transparent overlay showing only time & battery icons.
     * Matches what Instagram, TikTok, and other social apps do.
     */
    private fun setupEdgeToEdge() {
        val window = activity.window

        // Allow app content to draw behind the status bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }

        // Transparent status + nav bars — content draws behind both
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        applyStatusBarIconColor()
    }

    /** Light mode → dark status bar icons; dark mode → white status bar icons. */
    private fun applyStatusBarIconColor() {
        val window = activity.window
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val flag = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            if (isDarkMode) {
                // White icons for dark backgrounds
                window.insetsController?.setSystemBarsAppearance(0, flag)
            } else {
                // Dark icons for light backgrounds
                window.insetsController?.setSystemBarsAppearance(flag, flag)
            }
        } else {
            @Suppress("DEPRECATION")
            if (isDarkMode) {
                window.decorView.systemUiVisibility = window.decorView.systemUiVisibility and
                    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
            } else {
                window.decorView.systemUiVisibility = window.decorView.systemUiVisibility or
                    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            }
        }
    }

    // ── Open / navigate ──────────────────────────────────────────────────────

    @Command
    fun openWebView(invoke: Invoke) {
        val args = invoke.parseArgs(OpenWebViewArgs::class.java)
        incrementUsage(args.networkId)
        dbg("▶ OPEN webview: network=${args.networkId} account=${args.accountId} url=${args.url}")

        activity.runOnUiThread {
            if (socialWebView != null) {
                dbg("  reuse existing webview (switch)")
                // Save cookies for the old session before switching
                currentAccountId?.let { saveCookiesForSession(it) }
                // Restore cookies for the new session
                restoreCookiesForSession(args.accountId)
                // Reuse existing webview — just navigate and update active highlight
                initialBackIndex = -1  // Reset baseline for new network URL
                isLoggedIn = false; pagesSinceOpen = 0  // Re-check auth on new network
                applyUaForNetwork(args.networkId)
                socialWebView?.loadUrl(args.url)
                currentAccountId = args.accountId
                currentNetworkId = args.networkId
                updateBottomBarActiveNetwork(args.networkId)
                showSocialView()
                invoke.resolve(JSObject())
                return@runOnUiThread
            }

            val density = activity.resources.displayMetrics.density

            // System window insets (status bar top, nav bar bottom)
            val windowInsets = activity.window.decorView.rootWindowInsets
            val statusBarHeight = windowInsets?.systemWindowInsetTop ?: 0
            val navBarHeight   = windowInsets?.systemWindowInsetBottom ?: 0

            val barHeight = (52 * density).toInt()

            // ── Root container ───────────────────────────────────────────────
            val root = FrameLayout(activity)

            // ── WebView (below status bar, above our bar + nav bar) ──────────
            val webView = prewarmedWebView?.also { prewarmedWebView = null } ?: createWebView()
            val wvParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            wvParams.topMargin = statusBarHeight
            wvParams.bottomMargin = navBarHeight + barHeight
            webView.layoutParams = wvParams

            // Consume window insets so the web content doesn't see safe-area-inset-bottom.
            // Without this, sites like Instagram/Threads double-account the nav bar height:
            // once via our bottomMargin, once via CSS env(safe-area-inset-bottom).
            webView.setOnApplyWindowInsetsListener { v, insets ->
                // Return zero insets — the WebView is already positioned correctly via margins
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    android.view.WindowInsets.CONSUMED
                } else {
                    @Suppress("DEPRECATION")
                    insets.replaceSystemWindowInsets(0, 0, 0, 0)
                }
            }

            // ── Bottom overlay bar (above nav bar) ───────────────────────────
            val bottomBar = buildBottomBar(density, navBarHeight, args.networkId, sortedNetworks())
            bottomBarView = bottomBar
            val bottomBarParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                barHeight + navBarHeight
            )
            bottomBarParams.gravity = Gravity.BOTTOM
            bottomBar.layoutParams = bottomBarParams

            root.addView(webView)
            root.addView(bottomBar)  // drawn on top of webview

            activity.addContentView(
                root,
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            )

            socialRoot = root
            socialWebView = webView
            currentAccountId = args.accountId
            currentNetworkId = args.networkId

            // Intercept the Android hardware back button while the social webview is visible.
            // Priority: go back in webview history → if no history, signal Vue to close overlay.
            registerBackCallback()

            // Restore cookies for this profile session before loading
            restoreCookiesForSession(args.accountId)
            isLoggedIn = false; pagesSinceOpen = 0  // Re-check auth on new network

            // Apply persisted mute state to the new webview via JS
            applyMuteToWebView(webView)

            applyUaForNetwork(args.networkId)
            webView.loadUrl(args.url)
            invoke.resolve(JSObject())
        }
    }

    // ── Navigate (reuse existing webview, no destroy/recreate) ───────────────

    @Command
    fun navigateWebView(invoke: Invoke) {
        val args = invoke.parseArgs(NavigateArgs::class.java)
        activity.runOnUiThread {
            initialBackIndex = -1  // Reset baseline for new network URL
            isLoggedIn = false; pagesSinceOpen = 0
            applyUaForNetwork(args.networkId)
            socialWebView?.loadUrl(args.url)
            currentNetworkId = args.networkId
            updateBottomBarActiveNetwork(args.networkId)
            invoke.resolve(JSObject())
        }
    }

    // ── Close (destroy) — blocks until UI thread completes ───────────────────

    @Command
    fun closeWebView(invoke: Invoke) {
        val latch = java.util.concurrent.CountDownLatch(1)
        activity.runOnUiThread {
            destroySocialView()
            latch.countDown()
        }
        latch.await()
        invoke.resolve(JSObject())
    }

    // ── Show ─────────────────────────────────────────────────────────────────

    @Command
    fun showWebView(invoke: Invoke) {
        activity.runOnUiThread { showSocialView() }
        invoke.resolve(JSObject())
    }

    // ── Hide ─────────────────────────────────────────────────────────────────

    @Command
    fun hideWebView(invoke: Invoke) {
        activity.runOnUiThread { hideSocialView() }
        invoke.resolve(JSObject())
    }

    // ── Set grayscale (called from Vue settings toggle) ───────────────────────

    @Command
    fun setGrayscale(invoke: Invoke) {
        val args = invoke.parseArgs(GrayscaleArgs::class.java)
        activity.runOnUiThread {
            isGrayscale = args.enabled
            applyGrayscaleToWebView(socialWebView)
            applyGrayscaleToBottomBar(bottomBarView)
        }
        invoke.resolve(JSObject())
    }

    // ── Set dark mode (called from Vue settings toggle) ────────────────────

    @Command
    fun setDarkMode(invoke: Invoke) {
        val args = invoke.parseArgs(DarkModeArgs::class.java)
        activity.runOnUiThread {
            isDarkMode = args.enabled
            applyDarkModeToBottomBar(bottomBarView)
            applyStatusBarIconColor()
        }
        invoke.resolve(JSObject())
    }

    // ── Set locale (called from Vue when language changes) ─────────────────

    @Command
    fun setLocale(invoke: Invoke) {
        val args = invoke.parseArgs(SetLocaleArgs::class.java)
        Strings.locale = args.locale
        invoke.resolve(JSObject())
    }

    // ── Set haptic feedback preference ────────────────────────────────────────

    @Command
    fun setHaptic(invoke: Invoke) {
        val args = invoke.parseArgs(GrayscaleArgs::class.java) // reuse — same shape { enabled: bool }
        hapticEnabled = args.enabled
        invoke.resolve(JSObject())
    }

    @Command
    fun setTapSound(invoke: Invoke) {
        val args = invoke.parseArgs(GrayscaleArgs::class.java) // reuse — same shape { enabled: bool }
        tapSoundEnabled = args.enabled
        invoke.resolve(JSObject())
    }

    // Trigger haptic + tap sound from Vue-side buttons.
    // Gating respects the same hapticEnabled / tapSoundEnabled flags as the native bottom bar.
    @Command
    fun triggerHaptic(invoke: Invoke) {
        activity.runOnUiThread {
            val view = bottomBarView ?: socialWebView ?: activity.window.decorView
            haptic(view)
        }
        invoke.resolve(JSObject())
    }

    @Command
    fun setTextZoom(invoke: Invoke) {
        val args = invoke.parseArgs(TextZoomArgs::class.java)
        activity.runOnUiThread {
            textZoomLevel = args.level
            socialWebView?.settings?.textZoom = textZoomLevel
        }
        invoke.resolve(JSObject())
    }

    // ── Backup: save/load to Downloads via MediaStore ────────────────────────

    @Command
    fun saveBackupToDownloads(invoke: Invoke) {
        val args = invoke.parseArgs(SaveBackupArgs::class.java)
        try {
            val bytes = android.util.Base64.decode(args.base64Data, android.util.Base64.DEFAULT)
            val resolver = activity.contentResolver
            val values = android.content.ContentValues().apply {
                put(android.provider.MediaStore.Downloads.DISPLAY_NAME, args.fileName)
                put(android.provider.MediaStore.Downloads.MIME_TYPE, "application/octet-stream")
                put(android.provider.MediaStore.Downloads.RELATIVE_PATH, "Download/SocialFlow")
                put(android.provider.MediaStore.Downloads.IS_PENDING, 1)
            }
            val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw Exception("MediaStore insert failed")
            resolver.openOutputStream(uri)?.use { it.write(bytes) }
                ?: throw Exception("Could not open output stream")
            values.clear()
            values.put(android.provider.MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            val result = JSObject()
            result.put("path", "Download/SocialFlow/${args.fileName}")
            invoke.resolve(result)
        } catch (e: Exception) {
            invoke.reject("Backup save failed: ${e.message}")
        }
    }

    @Command
    fun loadBackupFromDownloads(invoke: Invoke) {
        try {
            val launcher = pickBackupLauncher
                ?: throw Exception("File picker not available")
            // Use SAF file picker — works even after uninstall/reinstall
            // (MediaStore scoped storage hides files from reinstalled apps)
            pendingBackupInvoke = invoke
            val intent = android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(android.content.Intent.CATEGORY_OPENABLE)
                type = "*/*"
            }
            launcher.launch(intent)
        } catch (e: Exception) {
            pendingBackupInvoke = null
            invoke.reject(e.message ?: "Load backup failed")
        }
    }

    /** Update which networks appear in the bottom bar (synced from per-profile visibility). */
    @Command
    fun setBarNetworks(invoke: Invoke) {
        val args = invoke.parseArgs(BarNetworksArgs::class.java)
        activity.runOnUiThread {
            visibleNetworkIds = if (args.networkIds.isEmpty()) null else args.networkIds.toSet()
            rebuildBottomBar()
        }
        invoke.resolve(JSObject())
    }

    @Command
    fun setProfiles(invoke: Invoke) {
        val args = invoke.parseArgs(SetProfilesArgs::class.java)
        try {
            val arr = org.json.JSONArray(args.profilesJson)
            val list = mutableListOf<ProfileMenuItem>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(ProfileMenuItem(
                    id = obj.getString("id"),
                    name = obj.getString("name"),
                    emoji = obj.optString("emoji", "")
                ))
            }
            activity.runOnUiThread {
                menuProfiles = list
                activeProfileId = args.activeProfileId
            }
        } catch (e: Exception) {
            Log.e(TAG, "setProfiles parse error: ${e.message}")
        }
        invoke.resolve(JSObject())
    }

    // ── Delete session cookies (called from Vue profile management) ─────────

    @Command
    fun deleteNetworkSession(invoke: Invoke) {
        val args = invoke.parseArgs(DeleteSessionArgs::class.java)
        val sessionKey = "${args.profileId}-${args.networkId}"
        val editor = cookiePrefs.edit()
        for (url in COOKIE_URLS) {
            editor.remove("$sessionKey|$url")
        }
        editor.apply()
        // Re-arm cookie consent if deleting the currently active session
        if (currentAccountId == sessionKey) { isLoggedIn = false; pagesSinceOpen = 0 }
        Log.i(TAG, "Cookies deleted for session: $sessionKey")
        invoke.resolve(JSObject())
    }

    @Command
    fun deleteProfileSession(invoke: Invoke) {
        val args = invoke.parseArgs(DeleteSessionArgs::class.java)
        val editor = cookiePrefs.edit()
        // Remove cookies for all networks under this profile
        val allPrefs = cookiePrefs.all
        for (key in allPrefs.keys) {
            if (key.startsWith("${args.profileId}-")) {
                editor.remove(key)
            }
        }
        editor.apply()
        // Re-arm cookie consent if deleting the currently active profile
        if (currentAccountId?.startsWith("${args.profileId}-") == true) { isLoggedIn = false; pagesSinceOpen = 0 }
        Log.i(TAG, "All cookies deleted for profile: ${args.profileId}")
        invoke.resolve(JSObject())
    }

    /** Tear down and rebuild the bottom bar with the current filtered/sorted networks. */
    private fun rebuildBottomBar() {
        val root = socialRoot ?: return
        val oldBar = bottomBarView ?: return
        root.removeView(oldBar)

        val density = activity.resources.displayMetrics.density
        val windowInsets = root.rootWindowInsets
        val navBarHeight = windowInsets?.systemWindowInsetBottom ?: 0
        val activeId = currentNetworkId ?: ""

        val newBar = buildBottomBar(density, navBarHeight, activeId, sortedNetworks())
        bottomBarView = newBar

        val barHeight = (52 * density).toInt()
        val params = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            barHeight + navBarHeight
        )
        params.gravity = Gravity.BOTTOM
        newBar.layoutParams = params
        root.addView(newBar)

        if (isGrayscale) applyGrayscaleToBottomBar(newBar)
    }

    // ── Build bottom bar ─────────────────────────────────────────────────────

    private fun buildBottomBar(
        density: Float,
        navBarHeight: Int,
        activeNetworkId: String,
        networks: List<NetworkInfo> = NETWORKS,
    ): LinearLayout {
        val bar = LinearLayout(activity)
        bar.orientation = LinearLayout.HORIZONTAL
        bar.gravity = Gravity.TOP or Gravity.CENTER_VERTICAL
        bar.setBackgroundColor(if (isDarkMode) Color.parseColor("#09090B") else Color.parseColor("#FFFFFF"))
        bar.setPadding(0, 0, 0, navBarHeight)

        // Inner row sits at the top of the bar (nav bar padding is below)
        val innerRow = LinearLayout(activity)
        innerRow.orientation = LinearLayout.HORIZONTAL
        innerRow.gravity = Gravity.CENTER_VERTICAL
        val innerHeight = (52 * density).toInt()
        innerRow.layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            innerHeight
        )

        // 🏠 Home button — returns to dashboard
        val homeBtn = buildHomeButton(density)
        innerRow.addView(homeBtn)

        // Thin divider
        innerRow.addView(buildDivider(density))

        // Scrollable network switcher (takes all remaining space)
        // Override dispatchTouchEvent to see ALL touch events, even those going to child buttons.
        var isTouching = false
        val scrollView = object : HorizontalScrollView(activity) {
            override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
                when (ev.action) {
                    MotionEvent.ACTION_DOWN -> {
                        isTouching = true
                        val row = getChildAt(0) as? LinearLayout ?: return super.dispatchTouchEvent(ev)
                        for (i in 0 until row.childCount) {
                            val child = row.getChildAt(i)
                            child.animate().cancel()
                            child.animate().alpha(1f).setDuration(600).start()
                        }
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        isTouching = false
                        val row = getChildAt(0) as? LinearLayout ?: return super.dispatchTouchEvent(ev)
                        for (i in 0 until row.childCount) {
                            val child = row.getChildAt(i)
                            val netId = child.tag as? String
                            if (netId != null) {
                                val targetAlpha = if (netId == currentNetworkId) 1f else 0.45f
                                child.animate().cancel()
                                child.animate().alpha(targetAlpha).setDuration(800).start()
                            }
                        }
                    }
                }
                return super.dispatchTouchEvent(ev)
            }
        }
        scrollView.isHorizontalScrollBarEnabled = false
        scrollView.isSmoothScrollingEnabled = true
        scrollView.layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)

        val networkRow = LinearLayout(activity)
        networkRow.orientation = LinearLayout.HORIZONTAL
        networkRow.gravity = Gravity.CENTER_VERTICAL

        for (net in networks) {
            val btn = buildNetworkButton(density, net, net.id == activeNetworkId)
            btn.tag = net.id
            networkRow.addView(btn)
        }

        scrollView.addView(networkRow)

        innerRow.addView(scrollView)

        // (mute + grayscale are now in the home button popup menu)

        bar.addView(innerRow)
        return bar
    }

    private fun buildDivider(density: Float): View {
        val divider = View(activity)
        divider.setBackgroundColor(if (isDarkMode) Color.parseColor("#27272A") else Color.parseColor("#DEE2E6"))
        val params = LinearLayout.LayoutParams((1 * density).toInt(), (24 * density).toInt())
        params.setMargins((4 * density).toInt(), 0, (4 * density).toInt(), 0)
        divider.layoutParams = params
        return divider
    }

    private var popupMenuView: LinearLayout? = null

    private fun buildHomeButton(density: Float): TextView {
        val btn = TextView(activity)
        btn.text = "\ue941"  // pi-home — PrimeIcons home icon
        btn.typeface = primeIconsTypeface
        btn.textSize = 18f
        btn.gravity = Gravity.CENTER
        btn.setTextColor(if (isDarkMode) Color.parseColor("#E0E0E0") else Color.parseColor("#495057"))
        btn.background = null
        val size = (48 * density).toInt()
        btn.layoutParams = LinearLayout.LayoutParams(size, size)
        btn.isClickable = true
        btn.isFocusable = true
        btn.isLongClickable = true

        // Single tap → show/hide popup menu
        btn.setOnClickListener {
            haptic(btn)
            togglePopupMenu(density)
        }

        // Long press → go home (dashboard)
        btn.setOnLongClickListener {
            haptic(btn, HapticFeedbackConstants.LONG_PRESS)
            dismissPopupMenu()
            goHome()
            true
        }

        return btn
    }

    private fun togglePopupMenu(density: Float) {
        if (popupMenuView != null) {
            dismissPopupMenu()
            return
        }
        showPopupMenu(density)
    }

    private fun dismissPopupMenu() {
        popupMenuView?.let { menu ->
            (menu.parent as? ViewGroup)?.removeView(menu)
        }
        popupMenuView = null
    }

    private fun showPopupMenu(density: Float) {
        val root = socialRoot ?: return
        val bar = bottomBarView ?: return

        val menu = LinearLayout(activity)
        menu.orientation = LinearLayout.VERTICAL
        val bgColor = if (isDarkMode) Color.parseColor("#1C1C1E") else Color.parseColor("#FFFFFF")
        val menuBg = GradientDrawable()
        menuBg.setColor(bgColor)
        menuBg.cornerRadius = 16 * density
        menu.background = menuBg
        menu.elevation = 8 * density
        val pad = (8 * density).toInt()
        menu.setPadding(pad, pad, pad, pad)

        val menuWidth = (220 * density).toInt()
        val menuParams = FrameLayout.LayoutParams(menuWidth, ViewGroup.LayoutParams.WRAP_CONTENT)
        menuParams.gravity = Gravity.BOTTOM or Gravity.START
        menuParams.leftMargin = (8 * density).toInt()
        menuParams.bottomMargin = bar.layoutParams.height + (8 * density).toInt()
        menu.layoutParams = menuParams

        // ── Menu items ──

        // 1. Profile list — inline switcher
        if (menuProfiles.isNotEmpty()) {
            val sectionColor = if (isDarkMode) Color.parseColor("#9A9AB0") else Color.parseColor("#ADB5BD")
            val sectionLabel = TextView(activity)
            sectionLabel.text = Strings.t("profiles")
            sectionLabel.textSize = 11f
            sectionLabel.setTextColor(sectionColor)
            sectionLabel.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            val slPad = (12 * density).toInt()
            sectionLabel.setPadding(slPad, (4 * density).toInt(), slPad, (2 * density).toInt())
            menu.addView(sectionLabel)

            for (profile in menuProfiles) {
                val isActive = profile.id == activeProfileId
                val label = "${profile.emoji}  ${profile.name}"
                menu.addView(buildPopupMenuItem(density, "\ue939", label, dimmed = !isActive) {
                    dismissPopupMenu()
                    dispatchToVue("sfz-switch-profile", """{"profileId": "${profile.id}"}""")
                })
            }

            // Divider
            val divider = View(activity)
            val divColor = if (isDarkMode) Color.parseColor("#2C2C2E") else Color.parseColor("#E5E5EA")
            divider.setBackgroundColor(divColor)
            val divParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (1 * density).toInt())
            val divMargin = (8 * density).toInt()
            divParams.setMargins(divMargin, (4 * density).toInt(), divMargin, (4 * density).toInt())
            divider.layoutParams = divParams
            menu.addView(divider)
        }

        // 2. Mute toggle
        val muteLabel = if (isMuted) Strings.t("mute_on") else Strings.t("mute_off")
        val muteIcon = if (isMuted) "\ue978" else "\ue977"
        menu.addView(buildPopupMenuItem(density, muteIcon, muteLabel) {
            isMuted = !isMuted
            applyMuteToWebView(socialWebView)
            dismissPopupMenu()
        })

        // 3. Grayscale toggle
        val grayLabel = if (isGrayscale) Strings.t("grayscale_on") else Strings.t("grayscale_off")
        menu.addView(buildPopupMenuItem(density, "\ue9dd", grayLabel, dimmed = isGrayscale) {
            isGrayscale = !isGrayscale
            applyGrayscaleToWebView(socialWebView)
            applyGrayscaleToBottomBar(bottomBarView)
            dispatchToVue("sfz-grayscale-changed", """{"enabled": $isGrayscale}""")
            dismissPopupMenu()
        })

        // 4. Dark mode toggle
        val darkLabel = if (isDarkMode) Strings.t("dark_mode_on") else Strings.t("dark_mode_off")
        val darkIcon = if (isDarkMode) "\ue9c8" else "\ue9c7"  // pi-sun / pi-moon
        menu.addView(buildPopupMenuItem(density, darkIcon, darkLabel) {
            dismissPopupMenu()
            dispatchToVue("sfz-toggle-dark-mode")
        })

        // 5. Copy debug logs
        menu.addView(buildPopupMenuItem(density, "\ue957", "Copy debug logs") {  // pi-copy
            val logText = synchronized(debugLog) { debugLog.joinToString("\n") }
            val clipboard = activity.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("SFZ Debug Logs", logText))
            dbg("Logs copied to clipboard (${debugLog.size} lines)")
            dismissPopupMenu()
        })

        root.addView(menu)
        popupMenuView = menu
    }

    private fun buildPopupMenuItem(
        density: Float,
        iconChar: String,
        label: String,
        dimmed: Boolean = false,
        onClick: () -> Unit
    ): LinearLayout {
        val row = LinearLayout(activity)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER_VERTICAL
        val rowPadH = (12 * density).toInt()
        val rowPadV = (11 * density).toInt()
        row.setPadding(rowPadH, rowPadV, rowPadH, rowPadV)
        row.isClickable = true
        row.isFocusable = true

        // Rounded hover/press background
        val rippleBg = GradientDrawable()
        rippleBg.cornerRadius = 10 * density
        rippleBg.setColor(Color.TRANSPARENT)
        row.background = rippleBg
        row.setOnTouchListener { v, event ->
            when (event.action) {
                android.view.MotionEvent.ACTION_DOWN -> {
                    rippleBg.setColor(if (isDarkMode) Color.parseColor("#2C2C2E") else Color.parseColor("#F2F2F7"))
                    v.invalidate()
                }
                android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL -> {
                    rippleBg.setColor(Color.TRANSPARENT)
                    v.invalidate()
                }
            }
            false
        }

        val textColor = if (isDarkMode) Color.parseColor("#E0E0E0") else Color.parseColor("#1C1C1E")
        val dimColor = if (isDarkMode) Color.parseColor("#9A9AB0") else Color.parseColor("#ADB5BD")

        // Icon
        val icon = TextView(activity)
        icon.text = iconChar
        icon.typeface = primeIconsTypeface
        icon.textSize = 16f
        icon.gravity = Gravity.CENTER
        icon.setTextColor(if (dimmed) dimColor else textColor)
        val iconSize = (28 * density).toInt()
        icon.layoutParams = LinearLayout.LayoutParams(iconSize, iconSize)
        row.addView(icon)

        // Spacing
        val spacer = View(activity)
        spacer.layoutParams = LinearLayout.LayoutParams((10 * density).toInt(), 1)
        row.addView(spacer)

        // Label
        val text = TextView(activity)
        text.text = label
        text.textSize = 14f
        text.setTextColor(if (dimmed) dimColor else textColor)
        text.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        text.layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        row.addView(text)

        row.setOnClickListener {
            haptic(it)
            onClick()
        }

        return row
    }

    /**
     * Show a user-friendly error page when a site blocks WebView access (Akamai, etc.).
     * Replaces the blank/cryptic "Access Denied" page with an actionable message.
     */
    private fun showBlockedPage(view: WebView, blockedUrl: String) {
        val siteName = try { android.net.Uri.parse(blockedUrl).host?.removePrefix("www.") ?: blockedUrl } catch (_: Exception) { blockedUrl }
        val encodedUrl = android.net.Uri.encode(blockedUrl)
        val html = """
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: #f8f9fa; color: #333; }
                    .card { text-align: center; max-width: 360px; }
                    .icon { font-size: 3.5rem; margin-bottom: 1rem; }
                    h1 { font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: 600; }
                    p { font-size: 0.9rem; color: #666; line-height: 1.5; margin-bottom: 1.25rem; }
                    .actions { display: flex; flex-direction: column; gap: 0.6rem; align-items: center; }
                    .btn { display: inline-block; padding: 0.6rem 1.5rem; border-radius: 8px; background: #3b82f6; color: #fff; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
                    .btn.outline { background: none; border: 1px solid #3b82f6; color: #3b82f6; }
                    .btn.ghost { background: none; color: #3b82f6; font-size: 0.8rem; padding: 0.4rem 1rem; }
                    @media (prefers-color-scheme: dark) {
                        body { background: #09090b; color: #e4e4e7; }
                        p { color: #a1a1aa; }
                        .btn.outline { border-color: #5BA8F5; color: #5BA8F5; }
                        .btn.ghost { color: #5BA8F5; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">🚫</div>
                    <h1>${Strings.t("blocked_title")} $siteName</h1>
                    <p>${Strings.t("blocked_message")}</p>
                    <div class="actions">
                        <a class="btn" href="sfz://clear-cookies?retry=$encodedUrl">${Strings.t("blocked_clear_retry")}</a>
                        <a class="btn outline" href="javascript:history.back()">${Strings.t("blocked_back")}</a>
                        <a class="btn ghost" href="$blockedUrl" target="_blank">${Strings.t("blocked_open_browser")}</a>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
        view.loadDataWithBaseURL(blockedUrl, html, "text/html", "UTF-8", blockedUrl)
    }

    /**
     * Clear all cookies for the current session and reload the URL.
     * Used from the blocked page to give the user a fresh start.
     */
    private fun clearCookiesAndRetry(view: WebView, retryUrl: String) {
        val cm = CookieManager.getInstance()
        // Wipe the saved cookie data for this session key so stale Akamai cookies don't persist
        currentAccountId?.let { key ->
            val editor = cookiePrefs.edit()
            for (url in COOKIE_URLS) {
                editor.remove("${key}|$url")
            }
            editor.apply()
        }
        // Clear all in-memory cookies and reload
        isLoggedIn = false; pagesSinceOpen = 0
        cm.removeAllCookies {
            view.post { view.loadUrl(retryUrl) }
        }
        cm.flush()
    }

    /** Destroy the social webview and return to the Vue dashboard. */
    private fun goHome() {
        destroySocialView()
        dispatchToVue("sfz-webview-back")
    }

    /**
     * Shared back navigation logic used by both the UI back button and the hardware back button.
     * - If the webview has history → go back one page.
     * - Otherwise → hide overlay immediately + tell Vue to clear store (which triggers close_webview IPC).
     */
    private fun navigateBackOrClose() {
        val list = socialWebView?.copyBackForwardList()
        val currentIndex = list?.currentIndex ?: 0
        val baseline = initialBackIndex.coerceAtLeast(0)
        if (currentIndex > baseline) {
            socialWebView?.goBack()
        } else {
            destroySocialView()
            // Tell Vue to clear its store state (close_webview IPC will be a no-op since already destroyed)
            dispatchToVue("sfz-webview-back")
        }
    }

    /**
     * Register an Android back-press callback so the hardware back button is intercepted
     * while the social webview is visible. Removes itself when the webview is destroyed.
     */
    private fun registerBackCallback() {
        backCallback?.remove()
        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                navigateBackOrClose()
            }
        }
        (activity as? androidx.activity.ComponentActivity)
            ?.onBackPressedDispatcher
            ?.addCallback(callback)
        backCallback = callback
    }

    private fun applyMuteToWebView(webView: WebView?) {
        val js = """
        (function(){
          var muted = $isMuted;
          // Mute all existing media
          document.querySelectorAll('video,audio').forEach(function(el){ el.muted = muted; });
          // Persistent: watch for new media elements via MutationObserver
          if (muted && !window.__sfzMuteObserver) {
            window.__sfzMuteObserver = new MutationObserver(function(mutations) {
              for (var i = 0; i < mutations.length; i++) {
                var nodes = mutations[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                  var n = nodes[j];
                  if (n.tagName === 'VIDEO' || n.tagName === 'AUDIO') n.muted = true;
                  if (n.querySelectorAll) n.querySelectorAll('video,audio').forEach(function(el){ el.muted = true; });
                }
              }
            });
            window.__sfzMuteObserver.observe(document.documentElement, { childList: true, subtree: true });
            // Override AudioContext to silence Web Audio API
            if (!window.__sfzOrigAudioCtx) {
              window.__sfzOrigAudioCtx = window.AudioContext;
              window.__sfzOrigWebkitCtx = window.webkitAudioContext;
              var SilentCtx = function() {
                var ctx = new window.__sfzOrigAudioCtx();
                ctx.suspend();
                return ctx;
              };
              SilentCtx.prototype = (window.__sfzOrigAudioCtx || function(){}).prototype;
              window.AudioContext = SilentCtx;
              if (window.webkitAudioContext) window.webkitAudioContext = SilentCtx;
            }
          }
          // Unmute: disconnect observer and restore AudioContext
          if (!muted && window.__sfzMuteObserver) {
            window.__sfzMuteObserver.disconnect();
            delete window.__sfzMuteObserver;
            if (window.__sfzOrigAudioCtx) {
              window.AudioContext = window.__sfzOrigAudioCtx;
              delete window.__sfzOrigAudioCtx;
              if (window.__sfzOrigWebkitCtx) { window.webkitAudioContext = window.__sfzOrigWebkitCtx; delete window.__sfzOrigWebkitCtx; }
            }
          }
        })();
        """.trimIndent()
        webView?.evaluateJavascript(js, null)
    }

    private fun applyGrayscaleToWebView(view: WebView?) {
        val js = if (isGrayscale)
            "document.documentElement.style.filter='grayscale(1)';"
        else
            "document.documentElement.style.filter='';"
        view?.evaluateJavascript(js, null)
    }

    private fun applyGrayscaleToBottomBar(bar: LinearLayout?) {
        bar ?: return
        if (isGrayscale) {
            val cm = android.graphics.ColorMatrix()
            cm.setSaturation(0f)
            val paint = android.graphics.Paint()
            paint.colorFilter = android.graphics.ColorMatrixColorFilter(cm)
            bar.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, paint)
        } else {
            bar.setLayerType(android.view.View.LAYER_TYPE_NONE, null)
        }
    }

    /** Re-apply dark/light colors to an existing bottom bar without rebuilding it. */
    private fun applyDarkModeToBottomBar(bar: LinearLayout?) {
        bar ?: return
        bar.setBackgroundColor(if (isDarkMode) Color.parseColor("#09090B") else Color.parseColor("#FFFFFF"))
        val iconColor = if (isDarkMode) Color.parseColor("#E0E0E0") else Color.parseColor("#495057")
        // Walk the inner row and update dividers + utility button colors
        val innerRow = bar.getChildAt(0) as? LinearLayout ?: return
        for (i in 0 until innerRow.childCount) {
            val child = innerRow.getChildAt(i)
            // Dividers are plain Views (not TextView, not ImageButton, not HorizontalScrollView)
            if (child is View && child !is ViewGroup && child !is TextView && child !is ImageButton) {
                child.setBackgroundColor(if (isDarkMode) Color.parseColor("#27272A") else Color.parseColor("#DEE2E6"))
            }
        }
        // Update home button (first TextView in inner row, before the scroll view)
        (innerRow.getChildAt(0) as? TextView)?.setTextColor(iconColor)
        // Re-apply network button backgrounds (blend base changes between dark/light)
        updateBottomBarActiveNetwork(currentNetworkId ?: "")
    }

    private fun buildNetworkButton(density: Float, net: NetworkInfo, isActive: Boolean): View {
        SVG_ICONS[net.id]?.let { return buildSvgButton(density, net, isActive, it) }

        val btn = TextView(activity)
        btn.text = net.iconChar
        btn.typeface = primeIconsTypeface
        btn.textSize = 15f
        btn.gravity = Gravity.CENTER
        btn.setTextColor(Color.WHITE)

        val size = (36 * density).toInt()
        val margin = (2 * density).toInt()
        val params = LinearLayout.LayoutParams(size, size)
        params.setMargins(margin, margin, margin, margin)
        btn.layoutParams = params

        applyNetworkButtonBackground(btn, net, isActive, size)
        btn.tag = net.id  // used by updateBottomBarActiveNetwork

        btn.isClickable = true
        btn.isFocusable = true
        btn.setOnClickListener {
            haptic(btn)
            dismissPopupMenu()
            if (net.id != currentNetworkId) {
                dbg("⇄ SWITCH ${currentNetworkId} → ${net.id}")
                // Save cookies for old network, restore for new (same profile)
                currentAccountId?.let { oldKey ->
                    dbg("  oldKey=$oldKey")
                    saveCookiesForSession(oldKey)
                    val profilePrefix = oldKey.substringBeforeLast("-")
                    val newKey = "$profilePrefix-${net.id}"
                    dbg("  newKey=$newKey")
                    restoreCookiesForSession(newKey)
                    currentAccountId = newKey
                }
                initialBackIndex = -1
                isLoggedIn = false; pagesSinceOpen = 0
                applyUaForNetwork(net.id)
                dbg("  loadUrl: ${net.url}")
                socialWebView?.loadUrl(net.url)
                currentNetworkId = net.id
                incrementUsage(net.id)
                updateBottomBarActiveNetwork(net.id)
            }
        }

        return btn
    }

    private fun applyNetworkButtonBackground(btn: View, net: NetworkInfo, isActive: Boolean, size: Int) {
        val bg = GradientDrawable()
        bg.shape = GradientDrawable.RECTANGLE
        bg.cornerRadius = size / 2f  // fully circular
        if (isActive) {
            bg.setColor(net.color)
        } else {
            // Blend brand color with bar background — different base for light vs dark
            val baseR = if (isDarkMode) 0x09 else 0xE8
            val baseG = if (isDarkMode) 0x09 else 0xE8
            val baseB = if (isDarkMode) 0x0B else 0xF0
            val brandWeight = if (isDarkMode) 0.25f else 0.3f
            val baseWeight = 1f - brandWeight
            val r = ((Color.red(net.color) * brandWeight) + (baseR * baseWeight)).toInt()
            val g = ((Color.green(net.color) * brandWeight) + (baseG * baseWeight)).toInt()
            val b = ((Color.blue(net.color) * brandWeight) + (baseB * baseWeight)).toInt()
            bg.setColor(Color.rgb(r, g, b))
        }
        btn.background = bg
        // Icon color: white on dark, darker on light (for inactive with light bg)
        val iconColor = if (isActive || isDarkMode) Color.WHITE else Color.parseColor("#495057")
        if (btn is TextView) {
            btn.setTextColor(iconColor)
        } else if (btn is FrameLayout && btn.childCount > 0) {
            // Threads custom icon — pass color via tag and redraw
            val child = btn.getChildAt(0)
            child.tag = iconColor
            child.invalidate()
        }

        // Active icon: full opacity + slight scale-up; inactive: dimmed — smooth transition
        val targetAlpha = if (isActive) 1f else 0.45f
        val targetScale = if (isActive) 1.12f else 1f
        btn.animate().cancel()
        btn.animate()
            .alpha(targetAlpha)
            .scaleX(targetScale)
            .scaleY(targetScale)
            .setDuration(300)
            .start()
    }

    /** Build a button using official SVG path data (from Simple Icons, 24x24 viewBox). */
    private fun buildSvgButton(
        density: Float,
        net: NetworkInfo,
        isActive: Boolean,
        svgPathData: String,
    ): View {
        val size = (36 * density).toInt()
        val margin = (2 * density).toInt()
        val hasStroke = net.id == "snapchat"

        val iconView = object : View(activity) {
            private val fillPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
            private val strokePaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                style = android.graphics.Paint.Style.STROKE
                color = Color.BLACK
                strokeWidth = 2.5f * density
                strokeJoin = android.graphics.Paint.Join.ROUND
            }
            override fun onDraw(canvas: android.graphics.Canvas) {
                super.onDraw(canvas)
                val w = (width - paddingLeft - paddingRight).toFloat()
                val h = (height - paddingTop - paddingBottom).toFloat()

                val srcPath = PathParser.createPathFromPathData(svgPathData)
                val scaled = android.graphics.Path()
                val m = android.graphics.Matrix()
                m.setScale(w / 24f, h / 24f)
                srcPath.transform(m, scaled)

                val color = (tag as? Int) ?: if (isDarkMode) Color.WHITE else Color.parseColor("#495057")
                fillPaint.color = color
                fillPaint.style = android.graphics.Paint.Style.FILL

                canvas.save()
                canvas.translate(paddingLeft.toFloat(), paddingTop.toFloat())
                if (hasStroke) canvas.drawPath(scaled, strokePaint)
                canvas.drawPath(scaled, fillPaint)
                canvas.restore()
            }
        }

        val wrapper = FrameLayout(activity)
        val wrapperParams = LinearLayout.LayoutParams(size, size)
        wrapperParams.setMargins(margin, margin, margin, margin)
        wrapper.layoutParams = wrapperParams

        val iconPad = (size * 0.22f).toInt()
        val iconParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        iconView.layoutParams = iconParams
        iconView.setPadding(iconPad, iconPad, iconPad, iconPad)

        wrapper.addView(iconView)
        applyNetworkButtonBackground(wrapper, net, isActive, size)
        wrapper.tag = net.id
        wrapper.isClickable = true
        wrapper.isFocusable = true
        wrapper.setOnClickListener {
            haptic(wrapper)
            dismissPopupMenu()
            if (net.id != currentNetworkId) {
                dbg("⇄ SWITCH ${currentNetworkId} → ${net.id} (threads btn)")
                currentAccountId?.let { oldKey ->
                    dbg("  oldKey=$oldKey")
                    saveCookiesForSession(oldKey)
                    val profilePrefix = oldKey.substringBeforeLast("-")
                    val newKey = "$profilePrefix-${net.id}"
                    dbg("  newKey=$newKey")
                    restoreCookiesForSession(newKey)
                    currentAccountId = newKey
                }
                initialBackIndex = -1
                isLoggedIn = false; pagesSinceOpen = 0
                applyUaForNetwork(net.id)
                dbg("  loadUrl: ${net.url}")
                socialWebView?.loadUrl(net.url)
                currentNetworkId = net.id
                incrementUsage(net.id)
                updateBottomBarActiveNetwork(net.id)
            }
        }

        return wrapper
    }

    private fun updateBottomBarActiveNetwork(activeNetworkId: String) {
        val root = socialRoot ?: return
        val density = activity.resources.displayMetrics.density
        // root → child 1 = bottomBar → child 0 = innerRow → child 2 = scrollView → child 0 = networkRow
        val bottomBar = root.getChildAt(1) as? LinearLayout ?: return
        val innerRow = bottomBar.getChildAt(0) as? LinearLayout ?: return
        val scrollView = innerRow.getChildAt(2) as? HorizontalScrollView ?: return
        val networkRow = scrollView.getChildAt(0) as? LinearLayout ?: return

        for (i in 0 until networkRow.childCount) {
            val btn = networkRow.getChildAt(i)
            val netId = btn.tag as? String ?: continue
            val net = NETWORKS.find { it.id == netId } ?: continue
            applyNetworkButtonBackground(btn, net, netId == activeNetworkId, btn.layoutParams.width)
        }
    }

    // Web login URLs for networks that redirect to app stores instead of showing a login page.
    private val NETWORK_LOGIN_URLS = mapOf(
        "tiktok" to "https://www.tiktok.com/login",
        "instagram" to "https://www.instagram.com/accounts/login/",
        "twitter" to "https://x.com/i/flow/login",
        "facebook" to "https://www.facebook.com/login",
        "snapchat" to "https://accounts.snapchat.com/accounts/v2/login",
        "discord" to "https://discord.com/login",
        "reddit" to "https://www.reddit.com/login/",
        "pinterest" to "https://www.pinterest.com/login/",
    )

    /**
     * Switch the current webview from Facebook to the Messenger tab.
     * Handles cookie isolation, UA switch (desktop for Messenger), and bottom bar update.
     */
    private fun switchToMessenger(view: WebView) {
        val messengerUrl = NETWORKS.find { it.id == "messenger" }?.url ?: "https://www.facebook.com/messages"
        currentAccountId?.let { oldKey ->
            saveCookiesForSession(oldKey)
            val profilePrefix = oldKey.substringBeforeLast("-")
            val newKey = "$profilePrefix-messenger"
            restoreCookiesForSession(newKey)
            currentAccountId = newKey
        }
        initialBackIndex = -1
        isLoggedIn = false; pagesSinceOpen = 0
        applyUaForNetwork("messenger")
        view.loadUrl(messengerUrl)
        currentNetworkId = "messenger"
        incrementUsage("messenger")
        updateBottomBarActiveNetwork("messenger")
    }

    /**
     * Switch the current webview from Messenger back to the Facebook tab.
     * Mirror of switchToMessenger — handles cookies, UA, and bottom bar.
     */
    private fun switchToFacebook(view: WebView) {
        val facebookUrl = NETWORKS.find { it.id == "facebook" }?.url ?: "https://facebook.com"
        currentAccountId?.let { oldKey ->
            saveCookiesForSession(oldKey)
            val profilePrefix = oldKey.substringBeforeLast("-")
            val newKey = "$profilePrefix-facebook"
            restoreCookiesForSession(newKey)
            currentAccountId = newKey
        }
        initialBackIndex = -1
        isLoggedIn = false; pagesSinceOpen = 0
        applyUaForNetwork("facebook")
        view.loadUrl(facebookUrl)
        currentNetworkId = "facebook"
        incrementUsage("facebook")
        updateBottomBarActiveNetwork("facebook")
    }

    // Networks that require a desktop UA (their web app blocks mobile browsers
    // or gates key actions such as upload/story creation behind the native app).
    private val DESKTOP_UA_NETWORKS = setOf("facebook", "whatsapp", "telegram", "discord", "messenger", "snapchat")
    private val DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    private lateinit var mobileUa: String

    /** Set the appropriate UA before loading a URL — desktop for WhatsApp/Telegram/Discord, mobile for everything else. */
    private fun applyUaForNetwork(networkId: String?) {
        val wv = socialWebView ?: return
        wv.settings.userAgentString = if (networkId in DESKTOP_UA_NETWORKS) DESKTOP_UA else mobileUa
    }

    // ── WebView factory ───────────────────────────────────────────────────────

    private fun createWebView(): WebView {
        val webView = WebView(activity)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.setSupportMultipleWindows(true)
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.textZoom = textZoomLevel
        // Use the real WebView UA but strip the "; wv" token that flags us as a WebView.
        // This keeps the Chrome version in sync with the actual engine (no fingerprint mismatch).
        val defaultUa = WebSettings.getDefaultUserAgent(activity)
        mobileUa = defaultUa.replace("; wv", "")
        settings.userAgentString = mobileUa

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Inject stealth/cookie/banner scripts at document start (before page JS runs).
        // This is critical for anti-bot bypass — onPageFinished is too late.
        val useDocStart = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)
        if (useDocStart) {
            WebViewCompat.addDocumentStartJavaScript(webView, STEALTH_SCRIPT, setOf("*"))
            WebViewCompat.addDocumentStartJavaScript(webView, DESKTOP_VIEWPORT_SCRIPT, setOf("*"))
            // COOKIE_ACCEPT_SCRIPT is injected conditionally in onPageFinished (main frame).
            // COOKIE_IFRAME_SCRIPT runs in ALL frames but skips main frame — handles
            // cross-origin CMP iframes (Google Funding Choices, etc.).
            WebViewCompat.addDocumentStartJavaScript(webView, COOKIE_IFRAME_SCRIPT, setOf("*"))
            WebViewCompat.addDocumentStartJavaScript(webView, DISMISS_APP_BANNERS_SCRIPT, setOf("*"))
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                val url = request.url.toString()
                val scheme = request.url.scheme ?: ""
                val host = request.url.host ?: ""
                val path = request.url.path ?: ""
                dbg("[nav] net=${currentNetworkId ?: "?"} scheme=$scheme host=$host path=$path url=$url")

                // Allow normal web navigation — but intercept app store redirects
                if (scheme == "http" || scheme == "https") {
                    // Intercept Play Store / App Store redirects → send to web login instead
                    if (host.contains("play.google.com") || host.contains("apps.apple.com") || host.contains("itunes.apple.com")) {
                        val loginUrl = NETWORK_LOGIN_URLS[currentNetworkId]
                        if (loginUrl != null) {
                            Log.i(TAG, "App store redirect intercepted ($host) → $loginUrl")
                            dbg("[nav] app-store redirect blocked → $loginUrl")
                            view.loadUrl(loginUrl)
                            return true
                        }
                        dbg("[nav] app-store redirect blocked with no fallback")
                        return true  // block even if no login URL known
                    }
                    // Facebook tab → messages: switch to Messenger tab instead of loading
                    // in-webview (mobile UA shows "Download Messenger" loop)
                    if (currentNetworkId == "facebook") {
                        if ((host.contains("facebook.com") && path.startsWith("/messages")) || host.contains("messenger.com")) {
                            Log.i(TAG, "Facebook→Messenger redirect intercepted → switching to Messenger tab")
                            dbg("[nav] facebook→messenger intercepted")
                            switchToMessenger(view)
                            return true
                        }
                    }
                    // Messenger tab → Facebook feed: switch to Facebook tab
                    if (currentNetworkId == "messenger" && host.contains("facebook.com")) {
                        if (!path.startsWith("/messages")) {
                            Log.i(TAG, "Messenger→Facebook redirect intercepted → switching to Facebook tab")
                            dbg("[nav] messenger→facebook intercepted")
                            switchToFacebook(view)
                            return true
                        }
                    }
                    return false
                }

                // Handle our custom "clear cookies and retry" action from the blocked page
                if (url.startsWith("sfz://clear-cookies")) {
                    val retryUrl = android.net.Uri.parse(url).getQueryParameter("retry") ?: return true
                    dbg("[nav] clear-cookies action retry=$retryUrl")
                    clearCookiesAndRetry(view, retryUrl)
                    return true
                }

                // fb-messenger:// deep link → switch to Messenger tab (desktop UA)
                if (scheme == "fb-messenger") {
                    dbg("[nav] fb-messenger deep link intercepted")
                    switchToMessenger(view)
                    return true
                }

                // Block all other custom URL schemes (intent://, market://, fb://,
                // instagram://, twitter://, whatsapp://, tg://, etc.)
                val loginUrl = NETWORK_LOGIN_URLS[currentNetworkId]
                if (loginUrl != null) {
                    Log.i(TAG, "Blocked custom scheme ($scheme) → redirecting to $loginUrl")
                    dbg("[nav] custom scheme blocked ($scheme) → $loginUrl")
                    view.loadUrl(loginUrl)
                } else {
                    Log.i(TAG, "Blocked custom scheme: $url")
                    dbg("[nav] custom scheme blocked without fallback: $url")
                }
                return true
            }
            override fun onReceivedHttpError(view: WebView, request: android.webkit.WebResourceRequest, errorResponse: android.webkit.WebResourceResponse) {
                super.onReceivedHttpError(view, request, errorResponse)
                // Only handle main frame navigation (not sub-resources like images/scripts)
                if (request.isForMainFrame && errorResponse.statusCode == 403) {
                    showBlockedPage(view, request.url.toString())
                }
            }
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                dbg("[page] finished net=${currentNetworkId ?: "?"} ua=${if (currentNetworkId in DESKTOP_UA_NETWORKS) "desktop" else "mobile"} url=$url")
                // Fallback: inject scripts here only if addDocumentStartJavaScript wasn't available
                if (!useDocStart) {
                    view.evaluateJavascript(STEALTH_SCRIPT, null)
                    view.evaluateJavascript(DISMISS_APP_BANNERS_SCRIPT, null)
                }
                // Cookie consent: always inject for the first 3 pages after opening
                // a network (consent can appear after redirects). After that, check
                // auth cookies and stop injecting once logged in.
                if (!isLoggedIn) {
                    pagesSinceOpen++
                    view.evaluateJavascript(COOKIE_ACCEPT_SCRIPT, null)
                    // Retrieve cookie consent diagnostic log after 7s
                    val netId = currentNetworkId ?: "?"
                    view.postDelayed({
                        view.evaluateJavascript("window.__sfzCookieLog || ''") { result ->
                            val log = result?.trim('"') ?: ""
                            if (log.isNotEmpty()) {
                                for (line in log.split("\\n")) {
                                    dbg("[cookie:$netId] $line")
                                }
                            }
                        }
                    }, 7000)
                    if (pagesSinceOpen > 3 && checkLoggedIn()) {
                        isLoggedIn = true
                        dbg("[cookie:$netId] Auth cookies detected — disabled")
                    }
                }
                // Always re-inject desktop viewport override in onPageFinished (backup —
                // the page may have set its own viewport meta after our document-start script)
                if (currentNetworkId in DESKTOP_UA_NETWORKS) {
                    view.evaluateJavascript(DESKTOP_VIEWPORT_SCRIPT, null)
                }
                if (isGrayscale) applyGrayscaleToWebView(view)
                if (isMuted) applyMuteToWebView(view)
                // Detect Akamai/CDN block pages that return 200 but show "Access Denied"
                view.evaluateJavascript("""
                    (function() {
                        var body = document.body ? document.body.innerText : '';
                        if (body.length < 500 && /access\s*denied/i.test(body) && /reference\s*#/i.test(body)) {
                            return 'blocked';
                        }
                        return 'ok';
                    })();
                """.trimIndent()) { result ->
                    if (result?.contains("blocked") == true) {
                        showBlockedPage(view, url)
                    }
                }
                // Record back-stack depth after the initial page+redirects settle.
                // We only consider deeper entries as real user navigation.
                if (initialBackIndex < 0) {
                    initialBackIndex = view.copyBackForwardList().currentIndex
                }
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                val launcher = pickFileLauncher
                if (launcher == null || filePathCallback == null) {
                    dbg("[file] chooser unavailable launcher=${launcher != null} callback=${filePathCallback != null}")
                    filePathCallback?.onReceiveValue(null)
                    return false
                }

                pendingFilePathCallback?.onReceiveValue(null)
                pendingFilePathCallback = filePathCallback

                return try {
                    val rawAcceptTypes = (fileChooserParams?.acceptTypes ?: emptyArray())
                        .mapNotNull { it?.trim() }
                        .filter { it.isNotEmpty() }
                        .flatMap { value -> value.split(",").map(String::trim) }
                        .filter { it.isNotEmpty() }
                        .distinct()

                    val allowMultiple =
                        fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE
                    val filenameHint = fileChooserParams?.filenameHint ?: ""
                    val title = fileChooserParams?.title ?: ""
                    val isCaptureEnabled = fileChooserParams?.isCaptureEnabled ?: false
                    dbg(
                        "[file] chooser opened net=${currentNetworkId ?: "?"} " +
                            "accept=${if (rawAcceptTypes.isEmpty()) "*/*" else rawAcceptTypes.joinToString("|")} " +
                            "multiple=$allowMultiple capture=$isCaptureEnabled title=$title hint=$filenameHint"
                    )

                    val intent = android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(android.content.Intent.CATEGORY_OPENABLE)
                        addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(android.content.Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
                        putExtra(android.content.Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple)

                        if (rawAcceptTypes.size == 1) {
                            type = rawAcceptTypes.first()
                        } else {
                            type = "*/*"
                            if (rawAcceptTypes.isNotEmpty()) {
                                putExtra(android.content.Intent.EXTRA_MIME_TYPES, rawAcceptTypes.toTypedArray())
                            }
                        }
                    }

                    launcher.launch(intent)
                    true
                } catch (e: Exception) {
                    Log.w(TAG, "Could not open web file picker: ${e.message}")
                    dbg("[file] chooser launch failed: ${e.message}")
                    pendingFilePathCallback = null
                    filePathCallback.onReceiveValue(null)
                    false
                }
            }

            // reCAPTCHA (and other verification services) open a hidden child window
            // to communicate with Google's servers. Without this, reCAPTCHA fails with
            // "impossible d'établir une connexion avec le service Recaptcha".
            override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message): Boolean {
                val childWebView = WebView(activity)
                childWebView.settings.javaScriptEnabled = true
                childWebView.settings.domStorageEnabled = true
                childWebView.settings.userAgentString = view.settings.userAgentString
                CookieManager.getInstance().setAcceptThirdPartyCookies(childWebView, true)
                childWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(v: WebView, request: android.webkit.WebResourceRequest): Boolean {
                        // reCAPTCHA callback — load result in the parent WebView
                        val url = request.url.toString()
                        view.loadUrl(url)
                        return true
                    }
                }
                childWebView.webChromeClient = object : WebChromeClient() {
                    override fun onCloseWindow(window: WebView) {
                        (window.parent as? ViewGroup)?.removeView(window)
                        window.destroy()
                    }
                }
                val transport = resultMsg.obj as android.webkit.WebView.WebViewTransport
                transport.webView = childWebView
                resultMsg.sendToTarget()
                return true
            }

            override fun onCloseWindow(window: WebView) {
                (window.parent as? ViewGroup)?.removeView(window)
                window.destroy()
            }
        }
        return webView
    }

    // ── Visibility helpers ────────────────────────────────────────────────────

    private fun showSocialView() {
        socialRoot?.visibility = View.VISIBLE
    }

    private fun hideSocialView() {
        socialRoot?.visibility = View.GONE
    }

    private fun destroySocialView() {
        // Save cookies for the current session before destroying
        currentAccountId?.let { saveCookiesForSession(it) }

        dismissPopupMenu()
        backCallback?.remove()
        backCallback = null
        socialWebView?.destroy()
        socialRoot?.let { (it.parent as? ViewGroup)?.removeView(it) }
        socialWebView = null
        socialRoot = null
        bottomBarView = null
        currentAccountId = null
        currentNetworkId = null
    }
}
