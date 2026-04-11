const COMMANDS: &[&str] = &[
    "save_backup_to_downloads",
    "load_backup_from_downloads",
    "set_haptic",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
