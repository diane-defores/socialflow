package com.socialflowz.webview

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
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
}

@InvokeArg
class AccountArgs {
    var accountId: String = ""
}

@TauriPlugin
class NativeWebViewPlugin(private val activity: Activity) : Plugin(activity) {

    private var socialContainer: FrameLayout? = null
    private var socialWebView: WebView? = null
    private var fab: ImageButton? = null
    private var currentAccountId: String? = null
    private var isDashboardVisible: Boolean = true

    // ── Open / navigate ──────────────────────────────────────────────────────

    @Command
    fun openWebView(invoke: Invoke) {
        val args = invoke.parseArgs(OpenWebViewArgs::class.java)

        activity.runOnUiThread {
            if (socialWebView != null) {
                // Reuse existing webview — just navigate
                socialWebView?.loadUrl(args.url)
                currentAccountId = args.accountId
                showSocialView()
                invoke.resolve(JSObject())
                return@runOnUiThread
            }

            // ── Create the social network container ──────────────────────────
            val container = FrameLayout(activity)
            container.layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            // ── Create the WebView ───────────────────────────────────────────
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

            // Cookies
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)
            cookieManager.setAcceptThirdPartyCookies(webView, true)

            webView.webViewClient = WebViewClient()
            webView.webChromeClient = WebChromeClient()
            webView.layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            container.addView(webView)

            // ── Add container ON TOP of the Tauri WebView ────────────────────
            activity.addContentView(
                container,
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            )

            socialContainer = container
            socialWebView = webView
            currentAccountId = args.accountId

            webView.loadUrl(args.url)

            // ── Create FAB on top of everything ──────────────────────────────
            createFab()

            isDashboardVisible = false
            invoke.resolve(JSObject())
        }
    }

    // ── Close (destroy) ──────────────────────────────────────────────────────

    @Command
    fun closeWebView(invoke: Invoke) {
        activity.runOnUiThread {
            destroySocialView()
        }
        invoke.resolve(JSObject())
    }

    // ── Show social webview (hide dashboard) ─────────────────────────────────

    @Command
    fun showWebView(invoke: Invoke) {
        activity.runOnUiThread {
            showSocialView()
        }
        invoke.resolve(JSObject())
    }

    // ── Hide social webview (show dashboard) ─────────────────────────────────

    @Command
    fun hideWebView(invoke: Invoke) {
        activity.runOnUiThread {
            hideSocialView()
        }
        invoke.resolve(JSObject())
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private fun showSocialView() {
        socialContainer?.visibility = View.VISIBLE
        fab?.visibility = View.VISIBLE
        isDashboardVisible = false
    }

    private fun hideSocialView() {
        socialContainer?.visibility = View.GONE
        // FAB stays visible so user can toggle back to social view
        isDashboardVisible = true
        // Tell Vue the dashboard is now visible
        val event = JSObject()
        event.put("visible", true)
        trigger("dashboard-toggled", event)
    }

    private fun destroySocialView() {
        socialWebView?.destroy()
        socialContainer?.let { (it.parent as? ViewGroup)?.removeView(it) }
        fab?.let { (it.parent as? ViewGroup)?.removeView(it) }
        socialWebView = null
        socialContainer = null
        fab = null
        currentAccountId = null
        isDashboardVisible = true
    }

    private fun createFab() {
        // Remove old FAB if any
        fab?.let { (it.parent as? ViewGroup)?.removeView(it) }

        val density = activity.resources.displayMetrics.density
        val size = (56 * density).toInt()
        val margin = (20 * density).toInt()

        val button = ImageButton(activity)

        // Circular background
        val bg = GradientDrawable()
        bg.shape = GradientDrawable.OVAL
        bg.setColor(Color.parseColor("#6366F1")) // indigo-500
        button.background = bg

        // Menu icon (three horizontal lines)
        button.setImageResource(android.R.drawable.ic_menu_sort_by_size)
        button.setColorFilter(Color.WHITE)
        button.scaleType = android.widget.ImageView.ScaleType.CENTER_INSIDE
        button.elevation = 8 * density

        val params = FrameLayout.LayoutParams(size, size)
        params.gravity = Gravity.BOTTOM or Gravity.END
        params.marginEnd = margin
        params.bottomMargin = margin
        button.layoutParams = params

        button.setOnClickListener {
            if (isDashboardVisible) {
                showSocialView()
            } else {
                hideSocialView()
            }
        }

        // Add FAB on top of everything
        activity.addContentView(
            button,
            FrameLayout.LayoutParams(size, size).apply {
                gravity = Gravity.BOTTOM or Gravity.END
                marginEnd = margin
                bottomMargin = margin
            }
        )

        fab = button
    }
}
