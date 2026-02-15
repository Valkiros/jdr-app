use rusqlite::{params, Connection};
use serde::Deserialize;
use std::fs;
use std::path::Path;
use tauri::AppHandle; // Import AppHandle to access app-specific paths if needed

#[derive(Deserialize, Debug)]
struct SourceItem {
    id: String, // Add ID field
    nom: String,
    poids: String, // Parsing needed
    esquive: Option<String>,
    degats: Option<String>,
    pi: Option<String>,
    aura: Option<String>, // Added
    rupture: Option<String>,
    #[serde(alias = "pr_sol")]
    pr: Option<String>,
    pr_mag: Option<String>, // ADD THIS
    pr_spe: Option<String>, // ADD THIS
    #[serde(alias = "type")]
    item_type: Option<String>, // Captures "type" from JSON
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
        .query_row("SELECT COUNT(*) FROM ref_items", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    if count > 0 {
        return Ok(()); // Already seeded
    }

    let base_path = Path::new("data/items");

    let categories = vec![
        ("Mains_nues.json", "Mains_nues"), // Fixed category name
        ("Armes.json", "Armes"),
        ("Protections.json", "Protections"),
        ("Accessoires.json", "Accessoires"),
        ("Sacs.json", "Sacs"),
        ("Sacoches.json", "Sacoches"),
        ("Potions.json", "Potions"),
        ("Outils.json", "Outils"),
        ("Munitions.json", "Munitions"),
        ("Armes_de_jet.json", "Armes_de_jet"),
        ("Pieges.json", "Pieges"),
        ("Objets_magiques.json", "Objets_magiques"),
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
            let ref_id: i32 = item.id.trim().parse().unwrap_or(0);
            let nom = item.nom;
            
            // Map legacy fields to new JSON structure
            let degats = serde_json::json!({
                "degats": item.degats.unwrap_or_default(),
                "pi": item.pi.unwrap_or("0".to_string()).trim().parse::<i32>().unwrap_or(0)
            });

            // Characteristics
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
                            caracs_map.insert(key.to_string(), serde_json::Value::Number(val.into()));
                        }
                    }
                }
            }
             if let Some(serde_json::Value::Object(obj)) = &item.caracteristiques {
                for (k, v) in obj {
                    caracs_map.insert(k.clone(), v.clone());
                }
            }
            let caracteristiques = serde_json::Value::Object(caracs_map);

            // Protections
            let protections = serde_json::json!({
                "pr_sol": item.pr.unwrap_or("0".to_string()), // item.pr maps to pr_sol
                "pr_mag": item.pr_mag.unwrap_or("0".to_string()),
                "pr_spe": item.pr_spe.unwrap_or("0".to_string())
            });

            // Details (poids, aura, effet/description, rupture, esquive)
            let details = serde_json::json!({
                "poids": item.poids,
                "aura": item.aura.unwrap_or_default(),
                "effet": item.effet.unwrap_or_default(),
                "type": item.item_type.unwrap_or_default(),
                "rupture": item.rupture.unwrap_or_default(),
                "esquive_bonus": item.esquive.unwrap_or("0".to_string())
            });

            let prix_info = serde_json::json!({}); // Empty for now
            let craft = serde_json::json!({}); // Empty for now

            tx.execute(
                "INSERT INTO ref_items (category, ref_id, nom, degats, caracteristiques, protections, prix_info, craft, details)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    category, 
                    ref_id, 
                    nom, 
                    degats.to_string(), 
                    caracteristiques.to_string(), 
                    protections.to_string(), 
                    prix_info.to_string(), 
                    craft.to_string(), 
                    details.to_string()
                ],
            ).map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
