package com.socialflowz.webview

import android.app.Activity
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

@TauriPlugin
class NativeWebViewPlugin(private val activity: Activity) : Plugin(activity) {

    private var socialRoot: FrameLayout? = null
    private var socialWebView: WebView? = null
    private var currentAccountId: String? = null
    private var currentNetworkId: String? = null

    // PrimeIcons typeface — loaded once from assets/primeicons.ttf
    private val primeIconsTypeface: Typeface by lazy {
        Typeface.createFromAsset(activity.assets, "primeicons.ttf")
    }

    // ── Open / navigate ──────────────────────────────────────────────────────

    @Command
    fun openWebView(invoke: Invoke) {
        val args = invoke.parseArgs(OpenWebViewArgs::class.java)

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
            val bottomBar = buildBottomBar(density, navBarHeight, args.networkId)
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

    // ── Build bottom bar ─────────────────────────────────────────────────────

    private fun buildBottomBar(density: Float, navBarHeight: Int, activeNetworkId: String): LinearLayout {
        val bar = LinearLayout(activity)
        bar.orientation = LinearLayout.HORIZONTAL
        bar.gravity = Gravity.TOP or Gravity.CENTER_VERTICAL
        bar.setBackgroundColor(Color.parseColor("#1C1C2E"))
        bar.setPadding(0, 0, (8 * density).toInt(), navBarHeight)

        // Inner row sits at the top of the bar (nav bar padding is below)
        val innerRow = LinearLayout(activity)
        innerRow.orientation = LinearLayout.HORIZONTAL
        innerRow.gravity = Gravity.CENTER_VERTICAL
        val innerHeight = (52 * density).toInt()
        innerRow.layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            innerHeight
        )

        // Back / close button
        val backBtn = buildBackButton(density)
        innerRow.addView(backBtn)

        // Thin divider
        val divider = View(activity)
        divider.setBackgroundColor(Color.parseColor("#3D3D5C"))
        val dvParams = LinearLayout.LayoutParams(
            (1 * density).toInt(),
            (24 * density).toInt()
        )
        dvParams.setMargins((4 * density).toInt(), 0, (8 * density).toInt(), 0)
        divider.layoutParams = dvParams
        innerRow.addView(divider)

        // Scrollable network switcher — explicitly allows click pass-through
        val scrollView = HorizontalScrollView(activity)
        scrollView.isHorizontalScrollBarEnabled = false
        scrollView.isSmoothScrollingEnabled = true
        scrollView.layoutParams = LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.MATCH_PARENT,
            1f
        )

        val networkRow = LinearLayout(activity)
        networkRow.orientation = LinearLayout.HORIZONTAL
        networkRow.gravity = Gravity.CENTER_VERTICAL

        for (net in NETWORKS) {
            val btn = buildNetworkButton(density, net, net.id == activeNetworkId)
            btn.tag = net.id
            networkRow.addView(btn)
        }

        scrollView.addView(networkRow)
        innerRow.addView(scrollView)
        bar.addView(innerRow)

        return bar
    }

    private fun buildBackButton(density: Float): ImageButton {
        val btn = ImageButton(activity)
        // Use system back arrow drawable
        btn.setImageResource(android.R.drawable.ic_menu_revert)
        btn.setColorFilter(Color.parseColor("#E0E0E0"))
        btn.background = null
        val size = (48 * density).toInt()
        btn.layoutParams = LinearLayout.LayoutParams(size, size)
        btn.setOnClickListener {
            btn.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            destroySocialView()
            // Tell Vue to clear the active network → shows mobile dashboard
            trigger("webview-back", JSObject())
        }
        return btn
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

        val bg = GradientDrawable()
        bg.shape = GradientDrawable.RECTANGLE
        bg.cornerRadius = size / 2f  // fully circular
        if (isActive) {
            bg.setColor(net.color)
        } else {
            // Muted: blend brand color at 25% opacity over dark base
            val r = ((Color.red(net.color) * 0.25f) + (0x1C * 0.75f)).toInt()
            val g = ((Color.green(net.color) * 0.25f) + (0x1C * 0.75f)).toInt()
            val b = ((Color.blue(net.color) * 0.25f) + (0x2E * 0.75f)).toInt()
            bg.setColor(Color.rgb(r, g, b))
        }
        btn.background = bg

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

    private fun updateBottomBarActiveNetwork(activeNetworkId: String) {
        val root = socialRoot ?: return
        val density = activity.resources.displayMetrics.density
        // bottom bar is child 1 of root → inner row is child 0 → scrollView is child 2 → networkRow is child 0
        val bottomBar = root.getChildAt(1) as? LinearLayout ?: return
        val innerRow = bottomBar.getChildAt(0) as? LinearLayout ?: return
        val scrollView = innerRow.getChildAt(2) as? HorizontalScrollView ?: return
        val networkRow = scrollView.getChildAt(0) as? LinearLayout ?: return

        for (i in 0 until networkRow.childCount) {
            val btn = networkRow.getChildAt(i) as? TextView ?: continue
            val netId = btn.tag as? String ?: continue
            val net = NETWORKS.find { it.id == netId } ?: continue
            val isActive = netId == activeNetworkId
            val bg = GradientDrawable()
            val size = btn.layoutParams.width
            bg.shape = GradientDrawable.RECTANGLE
            bg.cornerRadius = size / 2f
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
    }

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

        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        return webView
    }

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
        currentAccountId = null
        currentNetworkId = null
    }
}
