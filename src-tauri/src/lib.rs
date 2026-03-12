use tauri::{AppHandle, Manager};

mod backup;

/// Chrome-on-Windows User-Agent — most common browser fingerprint, least suspicious.
const CHROME_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/// Anti-fingerprint JS injected before every page load.
/// Patches the most common WebView detection vectors used by Akamai, PerimeterX, etc.
#[cfg(not(target_os = "android"))]
const STEALTH_SCRIPT: &str = r#"
(function(){
  // 1. navigator.webdriver — WebView/automation flag
  Object.defineProperty(navigator, 'webdriver', { get: () => false });

  // 2. window.chrome — real Chrome exposes this, WebViews don't
  if (!window.chrome) {
    window.chrome = {
      runtime: {},
      loadTimes: function(){},
      csi: function(){},
      app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, getDetails: function(){}, getIsInstalled: function(){}, runningState: function(){ return 'cannot_run'; } },
    };
  }

  // 3. navigator.plugins — WebViews report empty, Chrome has defaults
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const arr = [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
      ];
      arr.item = (i) => arr[i] || null;
      arr.namedItem = (n) => arr.find(p => p.name === n) || null;
      arr.refresh = () => {};
      return arr;
    }
  });

  // 4. navigator.languages — must match UA locale
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

  // 5. permissions.query — Notification permission detection
  const origQuery = window.Permissions && Permissions.prototype.query;
  if (origQuery) {
    Permissions.prototype.query = function(params) {
      return params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : origQuery.call(this, params);
    };
  }

  // 6. WebGL vendor/renderer — avoid "Google SwiftShader" (headless signal)
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    if (param === 37445) return 'Google Inc. (NVIDIA)';       // UNMASKED_VENDOR_WEBGL
    if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650, OpenGL 4.5)'; // UNMASKED_RENDERER_WEBGL
    return getParameter.call(this, param);
  };
  if (typeof WebGL2RenderingContext !== 'undefined') {
    const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return 'Google Inc. (NVIDIA)';
      if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650, OpenGL 4.5)';
      return getParameter2.call(this, param);
    };
  }
})();
"#;

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

/// Unique label per (profile, network) pair — ensures isolated webviews.
#[cfg(not(target_os = "android"))]
fn webview_label(profile_id: &str, network_id: &str) -> String {
    format!("social-{}-{}", profile_id, network_id)
}

// ─── Tray setup (desktop only) ───────────────────────────────────────────────

#[cfg(not(target_os = "android"))]
fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show SocialFlow", true, None::<&str>)?;
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
        .tooltip("SocialFlow")
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
    profile_id: String,
    network_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = webview_label(&profile_id, &network_id);
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

    // Session data isolated per (profile, network) — cookies/localStorage/IndexedDB
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&profile_id)
        .join(&network_id);

    let window = app
        .get_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    window
        .add_child(
            WebviewBuilder::new(&label, WebviewUrl::External(parsed))
                .user_agent(CHROME_UA)
                .initialization_script(STEALTH_SCRIPT)
                .data_directory(data_dir),
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
    profile_id: String,
    network_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = webview_label(&profile_id, &network_id);
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
fn close_webview(app: AppHandle, profile_id: String, network_id: String) -> Result<(), String> {
    let label = webview_label(&profile_id, &network_id);
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
    profile_id: String,
    network_id: String,
    _x: f64,
    _y: f64,
    _width: f64,
    _height: f64,
) -> Result<(), String> {
    // Use "profileId-networkId" as the session key for Android
    let session_key = format!("{}-{}", profile_id, network_id);
    app.android_webview()
        .open(&url, &session_key, &network_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn resize_webview(
    _app: AppHandle,
    _profile_id: String,
    _network_id: String,
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
fn close_webview(app: AppHandle, profile_id: String, network_id: String) -> Result<(), String> {
    let session_key = format!("{}-{}", profile_id, network_id);
    app.android_webview()
        .close(&session_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn set_grayscale(app: AppHandle, enabled: bool) -> Result<(), String> {
    app.android_webview()
        .set_grayscale(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_grayscale(_app: AppHandle, _enabled: bool) -> Result<(), String> {
    Ok(()) // no-op on desktop — Vue applies the CSS filter directly
}

#[tauri::command]
#[cfg(target_os = "android")]
fn set_dark_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    app.android_webview()
        .set_dark_mode(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_dark_mode(_app: AppHandle, _enabled: bool) -> Result<(), String> {
    Ok(()) // no-op on desktop — Vue applies the CSS class directly
}

/// Injects a JavaScript string into a running social webview.
/// Used by the friends filter to hide posts from non-friends.
#[tauri::command]
#[cfg(not(target_os = "android"))]
fn inject_script(
    app: AppHandle,
    profile_id: String,
    network_id: String,
    script: String,
) -> Result<(), String> {
    let label = webview_label(&profile_id, &network_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.eval(&script).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn inject_script(
    _app: AppHandle,
    _profile_id: String,
    _network_id: String,
    _script: String,
) -> Result<(), String> {
    // Android: script injection via Kotlin plugin not yet implemented
    Ok(())
}

// ── Cross-platform ───────────────────────────────────────────────────────────

/// Wipe all session data for a profile (all networks).
#[tauri::command]
fn delete_profile_session(app: AppHandle, profile_id: String) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&profile_id);

    if data_dir.exists() {
        std::fs::remove_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Wipe session data for a single (profile, network) pair.
#[tauri::command]
fn delete_network_session(
    app: AppHandle,
    profile_id: String,
    network_id: String,
) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&profile_id)
        .join(&network_id);

    if data_dir.exists() {
        std::fs::remove_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── Backup / Restore ────────────────────────────────────────────────────────

#[tauri::command]
fn export_backup(
    app: AppHandle,
    store_data: String,
    password: String,
) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let sessions_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions");

    // Create zip + encrypt
    let zip_bytes = backup::create_backup_archive(&sessions_dir, &store_data)?;
    let blob = backup::encrypt_archive(&zip_bytes, &password)?;

    // Show native save dialog (blocking via channel)
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .set_file_name("socialflow-backup.sfbak")
        .add_filter("SocialFlow Backup", &["sfbak"])
        .save_file(move |path| {
            let _ = tx.send(path);
        });

    let file_path = rx.recv().map_err(|_| "Dialog cancelled".to_string())?;
    let file_path = file_path.ok_or_else(|| "No file selected".to_string())?;
    let path = file_path.into_path().map_err(|e| format!("Invalid path: {e}"))?;

    std::fs::write(&path, &blob).map_err(|e| format!("Write failed: {e}"))?;
    Ok(path.display().to_string())
}

#[tauri::command]
fn import_backup(app: AppHandle, password: String) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    // Show native open dialog (blocking via channel)
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .add_filter("SocialFlow Backup", &["sfbak"])
        .pick_file(move |path| {
            let _ = tx.send(path);
        });

    let file_path = rx.recv().map_err(|_| "Dialog cancelled".to_string())?;
    let file_path = file_path.ok_or_else(|| "No file selected".to_string())?;
    let path = file_path.into_path().map_err(|e| format!("Invalid path: {e}"))?;

    let sessions_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions");

    // Read + decrypt + extract
    let blob = std::fs::read(&path).map_err(|e| format!("Read failed: {e}"))?;
    let zip_bytes = backup::decrypt_archive(&blob, &password)?;
    let store_data = backup::extract_backup_archive(&zip_bytes, &sessions_dir)?;

    Ok(store_data)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_android_webview::init())
        .plugin(tauri_plugin_dialog::init())
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
            set_grayscale,
            set_dark_mode,
            inject_script,
            delete_profile_session,
            delete_network_session,
            export_backup,
            import_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
