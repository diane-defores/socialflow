const COMMANDS: &[&str] = &[
    "save_backup_to_downloads",
    "load_backup_from_downloads",
    "export_cookies_for_backup",
    "import_cookies_from_backup",
    "set_haptic",
    "set_tap_sound",
    "set_tap_sound_variant",
    "preview_tap_sound",
    "trigger_haptic",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
