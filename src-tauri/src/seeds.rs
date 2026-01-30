use rusqlite::{params, Connection};
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
    pi: Option<String>,
    rupture: Option<String>,
    #[serde(alias = "pr_sol")]
    pr: Option<String>,
    pr_mag: Option<String>, // ADD THIS
    pr_spe: Option<String>, // ADD THIS
    #[serde(alias = "type")]
    item_type: Option<String>, // Captures "type" from JSON
    description: Option<String>,
    effet: Option<String>,
    caracteristiques: Option<serde_json::Value>, // Support generic characteristics from JSON object

    // Individual characteristics fields found in flat JSON
    courage: Option<String>,
    intelligence: Option<String>,
    charisme: Option<String>,
    adresse: Option<String>,
    force: Option<String>,
    perception: Option<String>,
    attaque: Option<String>,
    parade: Option<String>,
}

pub fn seed_reference_data(conn: &mut Connection, _app_handle: AppHandle) -> Result<(), String> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM ref_equipements", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    if count > 0 {
        return Ok(()); // Already seeded
    }

    let base_path = Path::new("data/items");

    let categories = vec![
        ("Mains_nues.json", "Main nue"),
        ("Armes.json", "Armes"),
        ("Protections.json", "Protections"),
        ("Accessoires.json", "Accessoires"),
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

            let esquive_bonus: i32 = item
                .esquive
                .as_deref()
                .unwrap_or("0")
                .trim()
                .parse()
                .unwrap_or(0);

            let pi_value: i32 = item
                .pi
                .as_deref()
                .unwrap_or("0")
                .trim()
                .parse()
                .unwrap_or(0);

            let rupture = item.rupture.unwrap_or_default();

            let pr_mag: i32 = item
                .pr_mag
                .as_deref()
                .unwrap_or("0")
                .trim()
                .parse()
                .unwrap_or(0);

            let pr_spe: i32 = item
                .pr_spe
                .as_deref()
                .unwrap_or("0")
                .trim()
                .parse()
                .unwrap_or(0);

            let degats_pr = item.degats.or(item.pr).unwrap_or_default();
            let description = item.effet.unwrap_or_default();
            let item_type = item.item_type.unwrap_or_default();

            // Construct characteristics JSON from individual fields
            let mut caracs_map = serde_json::Map::new();

            let char_fields = [
                ("courage", &item.courage),
                ("intelligence", &item.intelligence),
                ("charisme", &item.charisme),
                ("adresse", &item.adresse),
                ("force", &item.force),
                ("perception", &item.perception),
                ("attaque", &item.attaque),
                ("parade", &item.parade),
            ];

            for (key, val_opt) in char_fields {
                if let Some(val_str) = val_opt {
                    if let Ok(val) = val_str.trim().parse::<i32>() {
                        if val != 0 {
                            caracs_map
                                .insert(key.to_string(), serde_json::Value::Number(val.into()));
                        }
                    }
                }
            }

            // Merge with existing 'caracteristiques' object if present
            if let Some(serde_json::Value::Object(obj)) = &item.caracteristiques {
                for (k, v) in obj {
                    caracs_map.insert(k.clone(), v.clone());
                }
            }

            let caracs_json = serde_json::Value::Object(caracs_map);
            let caracs_str = caracs_json.to_string();

            tx.execute(
                "INSERT INTO ref_equipements (category, nom, poids, pi, rupture, esquive_bonus, degats_pr, pr_mag, pr_spe, item_type, description, caracteristiques)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                params![category, item.nom, poids_kg, pi_value, rupture, esquive_bonus, degats_pr, pr_mag, pr_spe, item_type, description, caracs_str],
            ).map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
