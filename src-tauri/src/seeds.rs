use rusqlite::{params, Connection, Transaction};
use serde::Deserialize;
use std::fs;
use std::path::Path;
use tauri::AppHandle; // Import AppHandle to access app-specific paths if needed

#[derive(Deserialize, Debug)]
struct SourceItem {
    nom: String,
    poids: String, // Parsing needed
    esquive: Option<String>,
    degats: Option<String>,
    #[serde(alias = "pr_sol")]
    pr: Option<String>,
    description: Option<String>, // Maybe map 'effet' here
    effet: Option<String>,
}

pub fn seed_reference_data(conn: &mut Connection, _app_handle: AppHandle) -> Result<(), String> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM ref_equipements", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    if count > 0 {
        return Ok(()); // Already seeded
    }

    // Path resolution: We need to find the 'data/items' folder.
    // In dev: src-tauri/data/items. In prod: resource folder.
    // For now, let's assume relative path works in dev or hardcode for this explicit task request.
    // The user said: "d:\Application JDR\src-tauri\data\items"
    
    // Better: use the specific path we found earlier.
    let base_path = Path::new("data/items"); 
    
    let categories = vec![
        ("Mains_nues.json", "Main nue"),
        ("Armes.json", "Armes"),
        ("Protections.json", "Protections"),
        ("Accessoires.json", "Accessoires"),
        // Add others if needed
        ("Sacs.json", "Sacs"),
    ];

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for (filename, category) in categories {
        let file_path = base_path.join(filename);
        if !file_path.exists() {
            println!("Warning: Seed file not found: {:?}", file_path);
            continue;
        }

        let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        let items: Vec<SourceItem> = serde_json::from_str(&content).map_err(|e| e.to_string())?;

        for item in items {
            let poids_grammes: f32 = item.poids.parse().unwrap_or(0.0);
            let poids_kg = poids_grammes / 1000.0;
            
            let esquive_bonus: i32 = item.esquive
                .as_deref()
                .unwrap_or("0")
                .trim()
                .parse()
                .unwrap_or(0);

            let degats_pr = item.degats.or(item.pr).unwrap_or_default();
            let description = item.effet.unwrap_or_default();

            tx.execute(
                "INSERT INTO ref_equipements (category, nom, poids, esquive_bonus, degats_pr, description)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![category, item.nom, poids_kg, esquive_bonus, degats_pr, description],
            ).map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
