mod db;
mod sync;
mod logic;
mod seeds;
mod commands;

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
        .invoke_handler(tauri::generate_handler![
            greet, 
            sync::sync_personnages,
            commands::get_ref_equipements,
            commands::compute_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
