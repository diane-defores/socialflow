package com.socialflow.webview

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
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
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

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

// Network metadata for the bottom bar switcher
// iconChar: PrimeIcons codepoint (same font as the Vue app, loaded from assets/primeicons.ttf)
// color:    brand color shown as button background when active
private data class NetworkInfo(val id: String, val iconChar: String, val color: Int)

private val NETWORKS = listOf(
    NetworkInfo("twitter",   "\ue9b6", Color.parseColor("#000000")),
    NetworkInfo("facebook",  "\ue9b4", Color.parseColor("#1877F2")),
    NetworkInfo("instagram", "\ue9cc", Color.parseColor("#E4405F")),
    NetworkInfo("linkedin",  "\ue9cb", Color.parseColor("#0A66C2")),
    NetworkInfo("tiktok",    "\ue962", Color.parseColor("#010101")),
    NetworkInfo("threads",   "\ue9d8", Color.parseColor("#000000")),
    NetworkInfo("discord",   "\ue9c0", Color.parseColor("#5865F2")),
    NetworkInfo("reddit",    "\ue9e8", Color.parseColor("#FF4500")),
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
    '[class*="AppBanner"], [class*="app-install-prompt"]' +
    '{ display: none !important; }';
  (document.head || document.documentElement).appendChild(style);

  // Remove HTML smart-app-banner meta tags (prevents browser-native banners)
  function removeSmartBannerMeta() {
    document.querySelectorAll('meta[name="apple-itunes-app"], meta[name="google-play-app"]')
      .forEach(function(el) { el.parentNode && el.parentNode.removeChild(el); });
  }

  // Text patterns for "stay in browser / not now" dismiss buttons
  var DISMISS_RE = /^(not now|pas maintenant|no thanks|non merci|continue in browser|continuer dans le navigateur|stay in browser|rester sur le site|use web|utiliser le web|continue to site|maybe later|peut-être plus tard|dismiss|ignorer|skip|passer|×|✕|close|fermer)$/i;

  function dismissAppPrompts() {
    removeSmartBannerMeta();

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

  // Specific CMP selectors (OneTrust, CookieBot, Didomi, Axeptio, Quantcast…)
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
    '[data-cookiebanner="accept_button"]',
    '#L2AGLb',
    '.tOjcNe',
    '[aria-label="Accept all"]',
    '[aria-label="Tout accepter"]'
  ];

  // Text patterns matched case-insensitively against button innerText / aria-label
  var ACCEPT_RE = /^(accept( all( cookies?)?)?|accepter( tout( les cookies?)?)?|tout accepter|autoriser( tout)?|allow( all)?|i agree|j'accepte|ok|got it|i accept|confirm all|agree)$/i;

  function clickIfVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    el.click();
    return true;
  }

  function tryAccept() {
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
  }

  // Run immediately, then after common CMP lazy-load delays
  tryAccept();
  setTimeout(tryAccept, 800);
  setTimeout(tryAccept, 2500);

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

    private var socialRoot: FrameLayout? = null
    private var socialWebView: WebView? = null
    private var currentAccountId: String? = null
    private var currentNetworkId: String? = null

    // Mute state — survives network switches within a session
    private var isMuted = false
    private var muteBtn: TextView? = null

    // Grayscale state — survives network switches within a session
    private var isGrayscale = false
    private var grayscaleBtn: TextView? = null

    // PrimeIcons typeface — loaded once from assets/primeicons.ttf
    private val primeIconsTypeface: Typeface by lazy {
        Typeface.createFromAsset(activity.assets, "primeicons.ttf")
    }

    // Usage counters — persisted across app restarts via SharedPreferences
    private val prefs by lazy {
        activity.getSharedPreferences("sfz_network_usage", Context.MODE_PRIVATE)
    }

    private fun incrementUsage(networkId: String) {
        val count = prefs.getInt(networkId, 0)
        prefs.edit().putInt(networkId, count + 1).apply()
    }

    /** Returns NETWORKS sorted by usage count descending (most used → first). */
    private fun sortedNetworks(): List<NetworkInfo> =
        NETWORKS.sortedByDescending { prefs.getInt(it.id, 0) }

    // ── Open / navigate ──────────────────────────────────────────────────────

    @Command
    fun openWebView(invoke: Invoke) {
        val args = invoke.parseArgs(OpenWebViewArgs::class.java)

        incrementUsage(args.networkId)

        activity.runOnUiThread {
            if (socialWebView != null) {
                // Reuse existing webview — just navigate and update active highlight
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

            // ── WebView (full screen minus bottom bar + nav bar) ─────────────
            val webView = createWebView()
            val wvParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            wvParams.topMargin = statusBarHeight
            wvParams.bottomMargin = navBarHeight + barHeight
            webView.layoutParams = wvParams

            // ── Bottom overlay bar (above nav bar) ───────────────────────────
            val bottomBar = buildBottomBar(density, navBarHeight, args.networkId, sortedNetworks())
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

            // Apply persisted mute state to the new webview
            webView.setAudioMuted(isMuted)

            webView.loadUrl(args.url)
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
            destroySocialView()
            trigger("webview-back", JSObject())
        }
        return btn
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
            socialWebView?.setAudioMuted(isMuted)
            updateMuteButtonIcon(btn)
        }
        return btn
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
            updateGrayscaleButtonIcon(btn)
            // Notify Vue so it applies grayscale to the app UI and syncs the settings toggle
            val event = JSObject()
            event.put("enabled", isGrayscale)
            trigger("grayscale-changed", event)
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

        btn.isClickable = true
        btn.isFocusable = true
        btn.setOnClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            val event = JSObject()
            event.put("networkId", net.id)
            trigger("webview-switch-network", event)
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
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                view.evaluateJavascript(COOKIE_ACCEPT_SCRIPT, null)
                view.evaluateJavascript(DISMISS_APP_BANNERS_SCRIPT, null)
                if (isGrayscale) applyGrayscaleToWebView(view)
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
        socialWebView?.destroy()
        socialRoot?.let { (it.parent as? ViewGroup)?.removeView(it) }
        socialWebView = null
        socialRoot = null
        muteBtn = null
        grayscaleBtn = null
        currentAccountId = null
        currentNetworkId = null
    }
}
