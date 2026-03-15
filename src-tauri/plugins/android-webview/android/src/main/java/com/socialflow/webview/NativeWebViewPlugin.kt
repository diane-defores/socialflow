package com.socialflow.webview

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.Log
import android.view.Gravity
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
import androidx.activity.OnBackPressedCallback
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

// Lightweight profile data for the popup menu
private data class ProfileMenuItem(val id: String, val name: String, val emoji: String)

// ── i18n ──────────────────────────────────────────────────────────────────────
private object Strings {
    private val translations = mapOf(
        // Popup menu
        "profiles" to mapOf("fr" to "Profils", "en" to "Profiles"),
        "mute_on" to mapOf("fr" to "Son activé", "en" to "Sound on"),
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
    NetworkInfo("messenger", "\ue97e", Color.parseColor("#0084FF"), "https://www.messenger.com"),
    NetworkInfo("snapchat",  "\ue96c", Color.parseColor("#FFFC00"), "https://web.snapchat.com"),
    NetworkInfo("quora",     "\ue959", Color.parseColor("#B92B27"), "https://www.quora.com"),
    NetworkInfo("pinterest", "\uea09", Color.parseColor("#E60023"), "https://www.pinterest.com"),
    NetworkInfo("whatsapp",  "\ue9d0", Color.parseColor("#25D366"), "https://web.whatsapp.com"),
    NetworkInfo("telegram",  "\ue9d3", Color.parseColor("#0088CC"), "https://web.telegram.org"),
    NetworkInfo("nextdoor",  "\ue968", Color.parseColor("#8ED500"), "https://nextdoor.com"),
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
        '[id*="install" i], [class*="install" i], [id*="promo" i], [class*="promo" i],' +
        '[role="dialog"], [role="alertdialog"]'
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
    '.qc-cmp2-summary-buttons button:last-child',
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
  var ACCEPT_RE = /^(accept( all( cookies?)?)?|accept cookies on this browser|accepter( tout(es)?( les cookies?)?)?|tout accepter|tout autoriser|autoriser( tous?( les cookies?)?)?|allow( all( cookies?)?)?|i agree|j'accepte|ok|got it|i accept|confirm all|agree)$/i;

  function clickIfVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
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
        if (ACCEPT_RE.test(label)) { btns[i].click(); return true; }
      }
      // Fallback: click the last button (typically "Allow all" / "Accept")
      if (btns.length > 0) { btns[btns.length - 1].click(); return true; }
    } catch(e) {}
    return false;
  }

  function tryAccept() {
    // 0. TikTok shadow DOM banner (must be checked before normal selectors)
    if (tryTikTokShadowBanner()) return;

    // 1. Try known CMP selectors
    for (var i = 0; i < SELECTORS.length; i++) {
      try {
        var el = document.querySelector(SELECTORS[i]);
        if (clickIfVisible(el)) return;
      } catch(e) {}
    }

    // 2. Text-match buttons/links inside any cookie/consent/GDPR container
    var containers = document.querySelectorAll(
      '[id*="cookie" i], [id*="consent" i], [id*="gdpr" i], [id*="privacy" i], [id*="cmp" i],' +
      '[class*="cookie" i], [class*="consent" i], [class*="gdpr" i], [class*="cmp" i],' +
      '[role="dialog"], [role="alertdialog"]'
    );
    for (var c = 0; c < containers.length; c++) {
      var btns = containers[c].querySelectorAll('button, a[role="button"], [role="button"]');
      for (var b = 0; b < btns.length; b++) {
        var label = (btns[b].textContent || btns[b].getAttribute('aria-label') || '').trim();
        if (ACCEPT_RE.test(label) && clickIfVisible(btns[b])) return;
      }
    }

    // 3. Fallback: scan ALL visible buttons on the page (catches Meta/Instagram dialogs
    //    that use no cookie-related class names on their container)
    var allBtns = document.querySelectorAll('button, [role="button"]');
    for (var i = 0; i < allBtns.length; i++) {
      var label = (allBtns[i].textContent || allBtns[i].getAttribute('aria-label') || '').trim();
      if (ACCEPT_RE.test(label) && clickIfVisible(allBtns[i])) return;
    }
  }

  // Run immediately, then after common CMP lazy-load delays
  tryAccept();
  setTimeout(tryAccept, 800);
  setTimeout(tryAccept, 2500);
  setTimeout(tryAccept, 5000);

  // Watch for dialogs injected into the DOM after initial load
  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length) { setTimeout(tryAccept, 300); break; }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
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
    private var bottomBarView: LinearLayout? = null

    // Dark mode state — synced from Vue settings toggle
    private var isDarkMode = false

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
        "https://www.linkedin.com", "https://www.messenger.com",
    )

    /** Save all cookies for the current profile session key. */
    private fun saveCookiesForSession(sessionKey: String) {
        val cm = CookieManager.getInstance()
        val editor = cookiePrefs.edit()
        for (url in COOKIE_URLS) {
            val cookies = cm.getCookie(url)
            if (cookies != null) {
                editor.putString("$sessionKey|$url", cookies)
            } else {
                editor.remove("$sessionKey|$url")
            }
        }
        editor.apply()
        Log.i(TAG, "Cookies saved for session: $sessionKey")
    }

    /** Clear all cookies, then restore saved cookies for the target session. */
    private fun restoreCookiesForSession(sessionKey: String) {
        val cm = CookieManager.getInstance()
        // Clear everything first
        cm.removeAllCookies(null)

        // Restore saved cookies for this session
        var restored = 0
        for (url in COOKIE_URLS) {
            val cookies = cookiePrefs.getString("$sessionKey|$url", null) ?: continue
            // setCookie expects one cookie at a time; the stored string may have multiple
            for (cookie in cookies.split(";")) {
                val trimmed = cookie.trim()
                if (trimmed.isNotEmpty()) {
                    cm.setCookie(url, trimmed)
                }
            }
            restored++
        }
        cm.flush()
        Log.i(TAG, "Cookies restored for session: $sessionKey ($restored URLs)")
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

        activity.runOnUiThread {
            if (socialWebView != null) {
                // Save cookies for the old session before switching
                currentAccountId?.let { saveCookiesForSession(it) }
                // Restore cookies for the new session
                restoreCookiesForSession(args.accountId)
                // Reuse existing webview — just navigate and update active highlight
                initialBackIndex = -1  // Reset baseline for new network URL
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
        val scrollView = HorizontalScrollView(activity)
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
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            togglePopupMenu(density)
        }

        // Long press → go home (dashboard)
        btn.setOnLongClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
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
            it.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
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
                editor.remove("${key}_$url")
            }
            editor.apply()
        }
        // Clear all in-memory cookies and reload
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
        val js = "document.querySelectorAll('video,audio').forEach(function(el){el.muted=${isMuted};});"
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
        if (net.id == "threads") return buildThreadsButton(density, net, isActive)

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
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            dismissPopupMenu()
            if (net.id != currentNetworkId) {
                // Save cookies for old network, restore for new (same profile)
                currentAccountId?.let { oldKey ->
                    saveCookiesForSession(oldKey)
                    val profilePrefix = oldKey.substringBeforeLast("-")
                    val newKey = "$profilePrefix-${net.id}"
                    restoreCookiesForSession(newKey)
                    currentAccountId = newKey
                }
                initialBackIndex = -1
                applyUaForNetwork(net.id)
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
    }

    /** Build a button with the real Threads logo (SVG path drawn on Canvas). */
    private fun buildThreadsButton(density: Float, net: NetworkInfo, isActive: Boolean): View {
        val size = (36 * density).toInt()
        val margin = (2 * density).toInt()

        val iconView = object : View(activity) {
            private val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
            private val path = android.graphics.Path()
            override fun onDraw(canvas: android.graphics.Canvas) {
                super.onDraw(canvas)
                initPath(
                    (width - paddingLeft - paddingRight).toFloat(),
                    (height - paddingTop - paddingBottom).toFloat()
                )

                // Color can be updated via tag from applyNetworkButtonBackground
                val color = (tag as? Int) ?: if (isDarkMode) Color.WHITE else Color.parseColor("#495057")
                paint.color = color
                paint.style = android.graphics.Paint.Style.FILL

                canvas.save()
                canvas.translate(paddingLeft.toFloat(), paddingTop.toFloat())
                canvas.drawPath(path, paint)
                canvas.restore()
            }

            private fun initPath(w: Float, h: Float) {
                path.reset()
                // Threads logo path, scaled from 192x192 viewBox to actual view size
                val sx = w / 192f
                val sy = h / 192f
                val m = android.graphics.Matrix()
                m.setScale(sx, sy)

                val original = android.graphics.Path()
                // Outer shape
                original.moveTo(141.537f, 88.988f)
                original.cubicTo(141.537f, 88.988f, 140.148f, 88.36f, 139.019f, 87.845f)
                original.cubicTo(137.537f, 60.538f, 122.616f, 44.905f, 97.562f, 44.745f)
                original.lineTo(97.164f, 44.745f)
                original.cubicTo(82.194f, 44.825f, 69.998f, 50.945f, 62.827f, 61.988f)
                original.lineTo(76.071f, 71.076f)
                original.cubicTo(81.418f, 62.969f, 89.763f, 58.873f, 100.993f, 58.873f)
                original.lineTo(101.215f, 58.873f)
                original.cubicTo(110.853f, 58.933f, 118.115f, 61.731f, 122.799f, 67.19f)
                original.cubicTo(126.215f, 71.172f, 128.492f, 76.671f, 129.642f, 83.662f)
                original.cubicTo(125.142f, 82.955f, 120.442f, 82.355f, 115.445f, 82.155f) // approximate
                original.cubicTo(109.945f, 81.905f, 104.745f, 81.905f, 99.945f, 81.905f)
                original.cubicTo(79.811f, 81.93f, 66.862f, 90.61f, 64.498f, 105.66f)
                original.cubicTo(63.281f, 113.402f, 65.248f, 120.69f, 70.038f, 126.176f)
                original.cubicTo(75.103f, 131.978f, 82.393f, 135.03f, 91.154f, 135.03f)
                original.cubicTo(102.699f, 135.03f, 111.766f, 130.1f, 118.1f, 120.37f)
                original.cubicTo(122.922f, 112.97f, 125.876f, 103.287f, 126.997f, 91.152f)
                original.cubicTo(132.321f, 94.352f, 136.287f, 98.631f, 138.597f, 103.78f)
                original.cubicTo(142.527f, 112.548f, 142.757f, 126.934f, 135.132f, 134.56f)
                original.cubicTo(128.399f, 141.293f, 120.307f, 144.197f, 104.459f, 144.309f)
                original.cubicTo(86.905f, 144.185f, 73.621f, 138.547f, 64.981f, 127.554f)
                original.cubicTo(56.842f, 118.79f, 52.267f, 104.12f, 52.143f, 86.2f) // approximate midpoint
                original.cubicTo(52.267f, 68.28f, 56.843f, 53.61f, 65.743f, 42.645f)
                original.cubicTo(76.093f, 29.902f, 91.437f, 23.353f, 111.347f, 23.175f)
                original.lineTo(111.569f, 23.175f)
                original.cubicTo(131.501f, 23.353f, 147.039f, 29.995f, 157.769f, 42.923f)
                original.cubicTo(162.933f, 49.135f, 166.904f, 56.753f, 169.625f, 65.508f)
                original.lineTo(184.765f, 61.438f)
                original.cubicTo(181.585f, 51.034f, 176.825f, 41.978f, 170.535f, 34.408f)
                original.cubicTo(157.012f, 18.676f, 138.419f, 10.4f, 115.787f, 10.2f)
                original.lineTo(115.519f, 10.2f)
                original.cubicTo(92.957f, 10.4f, 74.629f, 18.838f, 61.647f, 35.2f)
                original.cubicTo(50.185f, 49.552f, 44.209f, 68.734f, 44.057f, 92f)
                original.lineTo(44.055f, 92.6f)
                original.lineTo(44.057f, 93.2f)
                original.cubicTo(44.209f, 116.466f, 50.185f, 135.648f, 61.647f, 150f)
                original.cubicTo(74.629f, 166.244f, 92.957f, 174.704f, 116.147f, 174.9f)
                original.lineTo(116.415f, 174.9f)
                original.cubicTo(135.467f, 174.768f, 146.589f, 170.502f, 155.993f, 161.098f)
                original.cubicTo(168.635f, 148.456f, 168.095f, 127.356f, 162.585f, 115.074f)
                original.cubicTo(158.627f, 106.248f, 151.399f, 99.279f, 141.373f, 94.496f)
                original.close()
                // Inner cutout (the hole in the @ shape)
                original.moveTo(110.85f, 126.12f)
                original.cubicTo(106.632f, 126.072f, 103.27f, 124.75f, 101.148f, 122.318f)
                original.cubicTo(98.316f, 119.072f, 98.14f, 114.346f, 98.658f, 111.051f)
                original.cubicTo(100.056f, 102.156f, 108.796f, 96.589f, 122.758f, 96.589f)
                original.cubicTo(128.438f, 96.589f, 133.793f, 97.129f, 138.73f, 98.189f)
                original.cubicTo(137.93f, 115.971f, 128.078f, 126.119f, 110.85f, 126.119f)
                original.close()

                path.addPath(original, m)
            }
        }

        val wrapper = FrameLayout(activity)
        val wrapperParams = LinearLayout.LayoutParams(size, size)
        wrapperParams.setMargins(margin, margin, margin, margin)
        wrapper.layoutParams = wrapperParams

        val iconPad = (size * 0.22f).toInt() // padding so logo doesn't fill the entire button
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
            wrapper.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            dismissPopupMenu()
            if (net.id != currentNetworkId) {
                currentAccountId?.let { oldKey ->
                    saveCookiesForSession(oldKey)
                    val profilePrefix = oldKey.substringBeforeLast("-")
                    val newKey = "$profilePrefix-${net.id}"
                    restoreCookiesForSession(newKey)
                    currentAccountId = newKey
                }
                initialBackIndex = -1
                applyUaForNetwork(net.id)
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

        // Networks that require a desktop UA (their web app blocks mobile browsers)
    private val DESKTOP_UA_NETWORKS = setOf("whatsapp", "telegram", "discord", "messenger")
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
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
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
            WebViewCompat.addDocumentStartJavaScript(webView, COOKIE_ACCEPT_SCRIPT, setOf("*"))
            WebViewCompat.addDocumentStartJavaScript(webView, DISMISS_APP_BANNERS_SCRIPT, setOf("*"))
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                val url = request.url.toString()
                // Block intent:// and market:// URLs — these crash the WebView
                // (e.g. Instagram "Open in app" triggers intent://instagram.com/...)
                if (url.startsWith("intent:") || url.startsWith("market:")) {
                    return true  // consume — don't navigate
                }
                // Handle "clear cookies and retry" action from the blocked page
                if (url.startsWith("sfz://clear-cookies")) {
                    val retryUrl = android.net.Uri.parse(url).getQueryParameter("retry") ?: return true
                    clearCookiesAndRetry(view, retryUrl)
                    return true
                }
                return false
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
                // Fallback: inject scripts here only if addDocumentStartJavaScript wasn't available
                if (!useDocStart) {
                    view.evaluateJavascript(STEALTH_SCRIPT, null)
                    view.evaluateJavascript(COOKIE_ACCEPT_SCRIPT, null)
                    view.evaluateJavascript(DISMISS_APP_BANNERS_SCRIPT, null)
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
        webView.webChromeClient = WebChromeClient()
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
