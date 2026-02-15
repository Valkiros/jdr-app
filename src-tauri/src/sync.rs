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

#[tauri::command]
pub fn sync_ref_items(
    token: String,
    supabase_url: String,
    supabase_key: String,
    state: State<AppState>,
) -> Result<String, String> {
    let client = Client::new();
    let batch_size = 1000;
    let mut offset = 0;
    let mut all_remote_items: Vec<serde_json::Value> = Vec::new();

    loop {
        let url = format!("{}/rest/v1/ref_items?select=*", supabase_url);
        let end_range = offset + batch_size - 1;

        let response = client
            .get(&url)
            .header("apikey", &supabase_key)
            .header("Authorization", format!("Bearer {}", token))
            .header("Range", format!("{}-{}", offset, end_range))
            .send()
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Fetch failed at offset {}: {}",
                offset,
                response.text().unwrap_or_default()
            ));
        }

        let items: Vec<serde_json::Value> = response.json().map_err(|e| e.to_string())?;
        let items_count = items.len();
        all_remote_items.extend(items);

        if items_count < batch_size {
            break;
        }
        offset += batch_size;
    }

    let count = all_remote_items.len();

    // 2. Overwrite Local DB
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    {
        // Clear table
        tx.execute("DELETE FROM ref_items", [])
            .map_err(|e| e.to_string())?;

        let mut stmt = tx
            .prepare(
                "INSERT INTO ref_items (
                id, category, ref_id, nom, degats, caracteristiques, protections, prix_info, craft, details
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            )
            .map_err(|e| e.to_string())?;

        for item in all_remote_items {
            let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
            let category = item
                .get("category")
                .and_then(|v| v.as_str())
                .unwrap_or("Autre");
            let ref_id = item.get("ref_id").and_then(|v| v.as_i64()).unwrap_or(0);
            let nom = item
                .get("nom")
                .and_then(|v| v.as_str())
                .unwrap_or("Inconnu");

            // Helper to stringify JSON fields, defaulting to "{}" if missing or null
            let json_str = |field: &str| -> String {
                match item.get(field) {
                    Some(serde_json::Value::String(s)) => s.clone(), // Returns raw string content (e.g. "{\"pi\":2}")
                    Some(v) => v.to_string(), // Serializes object/number/etc. to string
                    None => "{}".to_string(),
                }
            };

            let degats = json_str("degats");
            let caracteristiques = json_str("caracteristiques");
            let protections = json_str("protections");
            let prix_info = json_str("prix_info");
            let craft = json_str("craft");
            let details = json_str("details");

            stmt.execute(rusqlite::params![
                id,
                category,
                ref_id,
                nom,
                degats,
                caracteristiques,
                protections,
                prix_info,
                craft,
                details
            ])
            .map_err(|e| format!("Insert error for {}: {}", nom, e))?;
        }
    }

    // NEW: Update local version after successful sync
    // We try to fetch the remote version to store it locally
    // If not found, we use a timestamp or "1" to just mark it as synced.
    // Ideally, we reuse the check logic, but here inside the command it is easier to just update if we have the info.
    // For now, let's just mark it as "synced" with a timestamp or if we can fetch the remote db_meta first.
    // Simpler: Just set a "Synced at X" or similar?
    // BETTER: The user wants proper versioning.
    // Let's make a quick fetch to db_meta on remote to get the REAL version to store.

    // ... Actually, the robust way is: check_remote gave us a version. We should probably pass it here?
    // Or we fetch it again. Fetching again is safer.

    // But we are inside a transaction. Network calls inside transaction are bad practice but here it's fine for a small app.
    // However, to keep it simple, let's just do a separate query or assume the caller passed the version.
    // Changing the signature breaks frontend? Yes.
    // Let's just fetch db_meta here if possible.

    // Actually, `check_remote_db_version` is what the frontend calls.
    // `sync_ref_items` is what updates.
    // So `sync_ref_items` should fetch the remote version and store it.

    // fetching remote version...
    let version_url = format!(
        "{}/rest/v1/db_meta?key=eq.ref_version&select=value",
        supabase_url
    );
    let v_res = client
        .get(&version_url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", token))
        .send();

    let mut new_version = "1".to_string(); // Default fallback
    if let Ok(resp) = v_res {
        if resp.status().is_success() {
            let rows: Vec<serde_json::Value> = resp.json().unwrap_or_default();
            if let Some(first) = rows.first() {
                if let Some(val) = first.get("value").and_then(|v| v.as_str()) {
                    new_version = val.to_string();
                }
            }
        }
    }

    tx.execute(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES ('ref_version', ?1)",
        [new_version],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(format!("Successfully synced {} equipements.", count))
}

#[tauri::command]
pub fn check_remote_db_version(
    token: String,
    supabase_url: String,
    supabase_key: String,
) -> Result<String, String> {
    let client = Client::new();

    // 1. Try to get explicit version from db_meta
    let version_url = format!(
        "{}/rest/v1/db_meta?key=eq.ref_version&select=value",
        supabase_url
    );
    let response = client
        .get(&version_url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let rows: Vec<serde_json::Value> = response.json().map_err(|e| e.to_string())?;
        if let Some(first) = rows.first() {
            if let Some(val) = first.get("value").and_then(|v| v.as_str()) {
                return Ok(val.to_string());
            }
        }
    }

    // 2. Fallback: Return a hash-like or count if db_meta missing
    // We just return "unknown" or logic to force update?
    // Let's return "COUNT:X"
    let count_url = format!("{}/rest/v1/ref_items?select=id&limit=1", supabase_url);
    let count_res = client
        .get(&count_url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", token))
        .header("Prefer", "count=exact")
        .send()
        .map_err(|e| e.to_string())?;

    // Extract Content-Range: 0-0/TOTAL
    if let Some(range) = count_res.headers().get("Content-Range") {
        if let Ok(s) = range.to_str() {
            if let Some(total) = s.split('/').last() {
                return Ok(format!("COUNT:{}", total));
            }
        }
    }

    Ok("0".to_string())
}
