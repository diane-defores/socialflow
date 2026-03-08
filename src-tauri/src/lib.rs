use tauri::{AppHandle, Manager};

// ── Desktop-only imports ─────────────────────────────────────────────────────
#[cfg(not(target_os = "android"))]
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, WebviewBuilder, WebviewUrl,
};

#[cfg(target_os = "android")]
use tauri_plugin_android_webview::AndroidWebviewExt;

// ─── Helpers ────────────────────────────────────────────────────────────────

#[cfg(not(target_os = "android"))]
fn webview_label(account_id: &str) -> String {
    format!("social-{}", account_id)
}

// ─── Tray setup (desktop only) ───────────────────────────────────────────────

#[cfg(not(target_os = "android"))]
fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show SocialFlowz", true, None::<&str>)?;
    let separator = MenuItem::with_id(app, "sep", "──────────────", false, None::<&str>)?;
    let twitter = MenuItem::with_id(app, "tray:twitter", "Twitter / X", true, None::<&str>)?;
    let instagram = MenuItem::with_id(app, "tray:instagram", "Instagram", true, None::<&str>)?;
    let linkedin = MenuItem::with_id(app, "tray:linkedin", "LinkedIn", true, None::<&str>)?;
    let facebook = MenuItem::with_id(app, "tray:facebook", "Facebook", true, None::<&str>)?;
    let tiktok = MenuItem::with_id(app, "tray:tiktok", "TikTok", true, None::<&str>)?;
    let threads = MenuItem::with_id(app, "tray:threads", "Threads", true, None::<&str>)?;
    let discord = MenuItem::with_id(app, "tray:discord", "Discord", true, None::<&str>)?;
    let reddit = MenuItem::with_id(app, "tray:reddit", "Reddit", true, None::<&str>)?;
    let sep2 = MenuItem::with_id(app, "sep2", "──────────────", false, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show, &separator, &twitter, &instagram, &linkedin, &facebook, &tiktok, &threads,
            &discord, &reddit, &sep2, &quit,
        ],
    )?;

    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png")).ok();

    let mut tray_builder = TrayIconBuilder::new();
    if let Some(icon) = icon {
        tray_builder = tray_builder.icon(icon);
    }

    tray_builder
        .tooltip("SocialFlowz")
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => show_window(app),
            "quit" => app.exit(0),
            id if id.starts_with("tray:") => {
                let network = id.trim_start_matches("tray:");
                show_window(app);
                let _ = app.emit("tray:open-network", network.to_string());
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                toggle_window(app);
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg(not(target_os = "android"))]
fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.unminimize();
    }
}

#[cfg(not(target_os = "android"))]
fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

// ─── IPC commands ────────────────────────────────────────────────────────────

// ── Desktop: native child webviews via add_child ─────────────────────────────

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn open_webview(
    app: AppHandle,
    url: String,
    account_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = webview_label(&account_id);
    let parsed: url::Url = url.parse().map_err(|e: url::ParseError| e.to_string())?;

    if let Some(wv) = app.get_webview(&label) {
        wv.navigate(parsed).map_err(|e| e.to_string())?;
        wv.set_bounds(tauri::Rect {
            position: tauri::Position::Logical(tauri::LogicalPosition::new(x, y)),
            size: tauri::Size::Logical(tauri::LogicalSize::new(width, height)),
        })
        .map_err(|e| e.to_string())?;
        return Ok(());
    }

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&account_id);

    let window = app
        .get_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    window
        .add_child(
            WebviewBuilder::new(&label, WebviewUrl::External(parsed)).data_directory(data_dir),
            tauri::LogicalPosition::new(x, y),
            tauri::LogicalSize::new(width, height),
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn resize_webview(
    app: AppHandle,
    account_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = webview_label(&account_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.set_bounds(tauri::Rect {
            position: tauri::Position::Logical(tauri::LogicalPosition::new(x, y)),
            size: tauri::Size::Logical(tauri::LogicalSize::new(width, height)),
        })
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn close_webview(app: AppHandle, account_id: String) -> Result<(), String> {
    let label = webview_label(&account_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ── Android: delegate to Kotlin plugin ───────────────────────────────────────

#[tauri::command]
#[cfg(target_os = "android")]
fn open_webview(
    app: AppHandle,
    url: String,
    account_id: String,
    _x: f64,
    _y: f64,
    _width: f64,
    _height: f64,
) -> Result<(), String> {
    app.android_webview()
        .open(&url, &account_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn resize_webview(
    _app: AppHandle,
    _account_id: String,
    _x: f64,
    _y: f64,
    _width: f64,
    _height: f64,
) -> Result<(), String> {
    // On Android the social webview is always full-screen; resize is a no-op
    Ok(())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn close_webview(app: AppHandle, account_id: String) -> Result<(), String> {
    app.android_webview()
        .close(&account_id)
        .map_err(|e| e.to_string())
}

// ── Cross-platform ───────────────────────────────────────────────────────────

/// Wipe the session data directory for an account.
#[tauri::command]
fn delete_account_session(app: AppHandle, account_id: String) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&account_id);

    if data_dir.exists() {
        std::fs::remove_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── Entry point ─────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_android_webview::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(not(target_os = "android"))]
            if let Err(err) = build_tray(app.handle()) {
                eprintln!("tray initialization failed: {err}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_webview,
            resize_webview,
            close_webview,
            delete_account_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
