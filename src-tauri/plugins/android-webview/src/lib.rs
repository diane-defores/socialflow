use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(mobile)]
use tauri::Manager;

mod error;

#[cfg(mobile)]
mod mobile;

pub use error::{Error, Result};

#[cfg(mobile)]
pub use mobile::AndroidWebview;

/// Extension trait to access the plugin from any Tauri manager.
#[cfg(mobile)]
pub trait AndroidWebviewExt<R: Runtime> {
    fn android_webview(&self) -> &AndroidWebview<R>;
}

#[cfg(mobile)]
impl<R: Runtime, T: Manager<R>> AndroidWebviewExt<R> for T {
    fn android_webview(&self) -> &AndroidWebview<R> {
        self.state::<AndroidWebview<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("android-webview")
        .setup(|app, api| {
            #[cfg(mobile)]
            {
                let handle = api.register_android_plugin(
                    "com.socialflowz.webview",
                    "NativeWebViewPlugin",
                )?;
                app.manage(AndroidWebview(handle));
            }
            let _ = (app, api);
            Ok(())
        })
        .build()
}
