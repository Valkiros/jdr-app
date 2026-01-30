use crate::db::{AppState, Personnage};
use reqwest::blocking::Client;
use tauri::State;

#[tauri::command]
pub fn sync_personnages(
    token: String,
    supabase_url: String,
    supabase_key: String,
    state: State<AppState>,
) -> Result<String, String> {
    let client = Client::new();
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // 1. Fetch Local Data
    let mut stmt = db
        .prepare("SELECT id, name, data, updated_at FROM personnages")
        .map_err(|e| e.to_string())?;

    let local_personnages = stmt
        .query_map([], |row| {
            let data_str: String = row.get(2)?;
            let data: serde_json::Value =
                serde_json::from_str(&data_str).unwrap_or(serde_json::Value::Null);

            Ok(Personnage {
                id: row.get(0)?,
                name: row.get(1)?,
                data,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // 2. Push to Supabase (Upsert)
    // Using Supabase REST API: POST /personnages with Prefer: resolution=merge-duplicates
    let url = format!("{}/rest/v1/personnages", supabase_url);

    let response = client
        .post(&url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .header("Prefer", "resolution=merge-duplicates")
        .json(&local_personnages)
        .send()
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Sync failed: {}",
            response.text().unwrap_or_default()
        ));
    }

    Ok(format!(
        "Synced {} characters to cloud.",
        local_personnages.len()
    ))
}
