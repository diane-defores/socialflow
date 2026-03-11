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
class NavigateArgs {
    var url: String = ""
    var networkId: String = ""
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
)

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
    private var currentAccountId: String? = null
    private var currentNetworkId: String? = null

    // Back-stack baseline — set after the initial page+redirects settle.
    // canGoBack() returns true for redirect-created entries too, so we only treat
    // it as real navigable history if currentIndex > initialBackIndex.
    private var initialBackIndex = -1

    // Mute state — survives network switches within a session
    private var isMuted = false
    private var muteBtn: TextView? = null

    // Grayscale state — survives network switches within a session
    private var isGrayscale = false
    private var grayscaleBtn: TextView? = null
    private var bottomBarView: LinearLayout? = null

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
        cm.flush()

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

    /** Returns NETWORKS sorted by usage count descending (most used → first). */
    private fun sortedNetworks(): List<NetworkInfo> =
        NETWORKS.sortedByDescending { prefs.getInt(it.id, 0) }

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

        // White (light) icons — readable on dark or colorful content
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0, // 0 = light icons (white)
                android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            )
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = window.decorView.systemUiVisibility and
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
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
                socialWebView?.loadUrl(args.url)
                currentAccountId = args.accountId
                currentNetworkId = args.networkId
                updateBottomBarActiveNetwork(args.networkId)
                showSocialView()
                invoke.resolve(JSObject())
                return@runOnUiThread
            }

            val density = activity.resources.displayMetrics.density
            val barHeight = (52 * density).toInt()

            // ── Root container ───────────────────────────────────────────────
            // addContentView puts us inside the already-inset content frame,
            // so we do NOT add system bar offsets ourselves.
            val root = FrameLayout(activity)

            // ── WebView (full screen minus our bottom bar) ───────────────────
            val webView = createWebView()
            val wvParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            wvParams.bottomMargin = barHeight
            webView.layoutParams = wvParams

            // ── Bottom overlay bar ───────────────────────────────────────────
            val bottomBar = buildBottomBar(density, 0, args.networkId, sortedNetworks())
            bottomBarView = bottomBar
            val bottomBarParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                barHeight
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
            grayscaleBtn?.let { updateGrayscaleButtonIcon(it) }
        }
        invoke.resolve(JSObject())
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
        bar.setBackgroundColor(Color.parseColor("#1C1C2E"))
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

        // ← Back button
        val backBtn = buildBackButton(density)
        innerRow.addView(backBtn)

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

        // Thin divider before mute
        innerRow.addView(buildDivider(density))

        // 🔊 Mute / unmute button
        val mute = buildMuteButton(density)
        muteBtn = mute
        innerRow.addView(mute)

        // 🎨 Grayscale toggle button (far right)
        val gray = buildGrayscaleButton(density)
        grayscaleBtn = gray
        innerRow.addView(gray)

        bar.addView(innerRow)
        return bar
    }

    private fun buildDivider(density: Float): View {
        val divider = View(activity)
        divider.setBackgroundColor(Color.parseColor("#3D3D5C"))
        val params = LinearLayout.LayoutParams((1 * density).toInt(), (24 * density).toInt())
        params.setMargins((4 * density).toInt(), 0, (4 * density).toInt(), 0)
        divider.layoutParams = params
        return divider
    }

    private fun buildBackButton(density: Float): ImageButton {
        val btn = ImageButton(activity)
        btn.setImageResource(android.R.drawable.ic_menu_revert)
        btn.setColorFilter(Color.parseColor("#E0E0E0"))
        btn.background = null
        val size = (48 * density).toInt()
        btn.layoutParams = LinearLayout.LayoutParams(size, size)
        btn.setOnClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            navigateBackOrClose()
        }
        return btn
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
            hideSocialView()
            // Tell Vue to clear its store state — this triggers close_webview IPC for proper cleanup
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

    private fun buildMuteButton(density: Float): TextView {
        val btn = TextView(activity)
        btn.typeface = primeIconsTypeface
        btn.textSize = 18f
        btn.gravity = Gravity.CENTER
        btn.setTextColor(Color.parseColor("#E0E0E0"))
        btn.background = null
        val size = (48 * density).toInt()
        btn.layoutParams = LinearLayout.LayoutParams(size, size)
        updateMuteButtonIcon(btn)
        btn.isClickable = true
        btn.isFocusable = true
        btn.setOnClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            isMuted = !isMuted
            applyMuteToWebView(socialWebView)
            updateMuteButtonIcon(btn)
        }
        return btn
    }

    private fun applyMuteToWebView(webView: WebView?) {
        val js = "document.querySelectorAll('video,audio').forEach(function(el){el.muted=${isMuted};});"
        webView?.evaluateJavascript(js, null)
    }

    private fun updateMuteButtonIcon(btn: TextView) {
        // \ue977 = pi-volume-up (sound on), \ue978 = pi-volume-off (muted)
        btn.text = if (isMuted) "\ue978" else "\ue977"
        btn.alpha = if (isMuted) 0.45f else 1.0f
    }

    private fun buildGrayscaleButton(density: Float): TextView {
        val btn = TextView(activity)
        btn.typeface = primeIconsTypeface
        btn.textSize = 18f
        btn.gravity = Gravity.CENTER
        btn.background = null
        val size = (48 * density).toInt()
        btn.layoutParams = LinearLayout.LayoutParams(size, size)
        updateGrayscaleButtonIcon(btn)
        btn.isClickable = true
        btn.isFocusable = true
        btn.setOnClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            isGrayscale = !isGrayscale
            applyGrayscaleToWebView(socialWebView)
            applyGrayscaleToBottomBar(bottomBarView)
            updateGrayscaleButtonIcon(btn)
            // Notify Vue so it applies grayscale to the app UI and syncs the settings toggle
            dispatchToVue("sfz-grayscale-changed", """{"enabled": $isGrayscale}""")
        }
        return btn
    }

    private fun updateGrayscaleButtonIcon(btn: TextView) {
        // \ue9dd = pi-palette — full color when active (grayscale ON = palette "disabled")
        btn.text = "\ue9dd"
        btn.setTextColor(if (isGrayscale) Color.parseColor("#9A9AB0") else Color.parseColor("#E0E0E0"))
        btn.alpha = if (isGrayscale) 0.45f else 1.0f
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

    private fun buildNetworkButton(density: Float, net: NetworkInfo, isActive: Boolean): TextView {
        val btn = TextView(activity)
        btn.text = net.iconChar
        btn.typeface = primeIconsTypeface
        btn.textSize = 18f
        btn.gravity = Gravity.CENTER
        btn.setTextColor(Color.WHITE)

        val size = (44 * density).toInt()
        val margin = (3 * density).toInt()
        val params = LinearLayout.LayoutParams(size, size)
        params.setMargins(margin, margin, margin, margin)
        btn.layoutParams = params

        applyNetworkButtonBackground(btn, net, isActive, size)
        btn.tag = net.id  // used by updateBottomBarActiveNetwork

        btn.isClickable = true
        btn.isFocusable = true
        btn.setOnClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
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
                socialWebView?.loadUrl(net.url)
                currentNetworkId = net.id
                incrementUsage(net.id)
                updateBottomBarActiveNetwork(net.id)
            }
        }

        return btn
    }

    private fun applyNetworkButtonBackground(btn: TextView, net: NetworkInfo, isActive: Boolean, size: Int) {
        val bg = GradientDrawable()
        bg.shape = GradientDrawable.RECTANGLE
        bg.cornerRadius = size / 2f  // fully circular
        if (isActive) {
            bg.setColor(net.color)
        } else {
            val r = ((Color.red(net.color) * 0.25f) + (0x1C * 0.75f)).toInt()
            val g = ((Color.green(net.color) * 0.25f) + (0x1C * 0.75f)).toInt()
            val b = ((Color.blue(net.color) * 0.25f) + (0x2E * 0.75f)).toInt()
            bg.setColor(Color.rgb(r, g, b))
        }
        btn.background = bg
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
            val btn = networkRow.getChildAt(i) as? TextView ?: continue
            val netId = btn.tag as? String ?: continue
            val net = NETWORKS.find { it.id == netId } ?: continue
            applyNetworkButtonBackground(btn, net, netId == activeNetworkId, btn.layoutParams.width)
        }
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
        // Remove "wv" marker so social sites don't block us
        settings.userAgentString = settings.userAgentString.replace("; wv", "")

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Auto-accept cookie dialogs + dismiss app-download prompts + restore grayscale
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                val url = request.url.toString()
                // Block intent:// and market:// URLs — these crash the WebView
                // (e.g. Instagram "Open in app" triggers intent://instagram.com/...)
                if (url.startsWith("intent:") || url.startsWith("market:")) {
                    return true  // consume — don't navigate
                }
                return false
            }
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                view.evaluateJavascript(COOKIE_ACCEPT_SCRIPT, null)
                view.evaluateJavascript(DISMISS_APP_BANNERS_SCRIPT, null)
                if (isGrayscale) applyGrayscaleToWebView(view)
                if (isMuted) applyMuteToWebView(view)
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

        backCallback?.remove()
        backCallback = null
        socialWebView?.destroy()
        socialRoot?.let { (it.parent as? ViewGroup)?.removeView(it) }
        socialWebView = null
        socialRoot = null
        muteBtn = null
        grayscaleBtn = null
        bottomBarView = null
        currentAccountId = null
        currentNetworkId = null
    }
}
