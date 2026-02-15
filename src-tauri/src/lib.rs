mod commands;
mod db;
mod logic;
mod seeds;
mod sync;

use db::AppState;
use std::sync::Mutex;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let mut conn = db::init_db().expect("failed to initialize sqlite");

            // Run seeds
            if let Err(e) = seeds::seed_reference_data(&mut conn, app.handle().clone()) {
                eprintln!("Failed to seed data: {}", e);
            }

            app.manage(AppState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            sync::sync_personnages,
            sync::sync_ref_items,
            sync::check_remote_db_version,
            commands::get_local_db_version,
            commands::update_local_db_version,
            commands::get_local_items_count,
            commands::get_ref_items,
            commands::compute_stats,
            commands::get_all_personnages,
            commands::get_personnage,
            commands::create_personnage,
            commands::delete_personnage,
            commands::import_personnage,
            commands::save_personnage_local,
            commands::get_personnage_versions,
            commands::restore_personnage_version,
            commands::get_game_rules,
            commands::get_competences,
            commands::create_ref_equipement,
            commands::update_ref_equipement,
            commands::delete_ref_equipement
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
