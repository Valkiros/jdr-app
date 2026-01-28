use crate::db::AppState;
use crate::logic::{calculer_stats_finales, BaseStats, Equipement, Etats, FinalStats};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct RefEquipement {
    pub id: i64,
    pub category: String,
    pub nom: String,
    pub poids: f64,
    pub pi: i32,
    pub rupture: String, // New field
    pub esquive_bonus: i32,
    pub degats_pr: String,
    pub pr_mag: i32,       // New
    pub pr_spe: i32,       // New
    pub item_type: String, // New field
    pub description: String,
    pub details: serde_json::Value,
}

#[tauri::command]
pub fn get_ref_equipements(state: State<AppState>) -> Result<Vec<RefEquipement>, String> {
    let db = state.db.lock().map_err(|_| "Failed to acquire lock")?;

    let mut stmt = db
        .prepare("SELECT id, category, nom, poids, pi, rupture, esquive_bonus, degats_pr, pr_mag, pr_spe, item_type, description FROM ref_equipements ORDER BY category, nom")
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([], |row| {
            Ok(RefEquipement {
                id: row.get(0)?,
                category: row.get(1)?,
                nom: row.get(2)?,
                poids: row.get(3)?,
                pi: row.get(4)?,
                rupture: row.get(5)?,
                esquive_bonus: row.get(6)?,
                degats_pr: row.get(7)?,
                pr_mag: row.get(8)?,
                pr_spe: row.get(9)?,
                item_type: row.get(10)?,
                description: row.get(11)?,
                details: serde_json::Value::Null,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub fn compute_stats(base: BaseStats, equipements: Vec<Equipement>, etats: Etats) -> FinalStats {
    calculer_stats_finales(base, equipements, etats)
}

#[derive(Serialize)]
pub struct CharacterSummary {
    pub id: String,
    pub name: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn get_all_personnages(state: State<AppState>) -> Result<Vec<CharacterSummary>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .prepare("SELECT id, name, updated_at FROM personnages ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let personnages = stmt
        .query_map([], |row| {
            Ok(CharacterSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(personnages)
}

#[tauri::command]
pub fn get_personnage(id: String, state: State<AppState>) -> Result<crate::db::Personnage, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db
        .prepare("SELECT id, name, data, updated_at FROM personnages WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let personnage = stmt
        .query_row(params![id], |row| {
            let data_str: String = row.get(2)?;
            let data: serde_json::Value =
                serde_json::from_str(&data_str).unwrap_or(serde_json::Value::Null);

            Ok(crate::db::Personnage {
                id: row.get(0)?,
                name: row.get(1)?,
                data,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(personnage)
}

#[tauri::command]
pub fn create_personnage(name: String, state: State<AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Default empty data structure
    let default_data = serde_json::json!({
        "identity": {
            "nom": name,
            "avatar_url": "",
            "sexe": "",
            "origine": "",
            "metier": "",
            "specialisation": "",
            "sous_specialisation": ""
        },
        "vitals": {
            "pv": { "current": 10, "max": 10, "temp": 0 },
            "pm": { "current": 0, "max": 0, "temp": 0 },
            "corruption": { "current": 0, "max": 100, "daily": 0 }
        },
        "general": {
            "niveau": 1,
            "experience": 0,
            "points_destin": 0,
            "malus_tete": 0
        },
        "defenses": {
            "naturelle": { "base": 0, "temp": 0 },
            "solide": { "base": 0, "temp": 0 },
            "speciale": { "base": 0, "temp": 0 },
            "magique": { "base": 0, "temp": 0 },
            "bouclier_actif": false
        },
        "movement": {
            "marche": { "base": 4, "temp": 0 },
            "course": { "base": 10, "temp": 0 }
        },
        "magic": {
            "magie_physique": { "base": 0, "temp": 0 },
            "magie_psychique": { "base": 0, "temp": 0 },
            "resistance_magique": { "base": 0, "temp": 0 },
            "discretion": { "base": 0, "temp": 0 }
        },
        "characteristics": {
            "courage": { "t1": 0, "t2": 0, "t3": 0 },
            "intelligence": { "t1": 0, "t2": 0, "t3": 0 },
            "charisme": { "t1": 0, "t2": 0, "t3": 0 },
            "adresse": { "t1": 0, "t2": 0, "t3": 0 },
            "force": { "t1": 0, "t2": 0, "t3": 0 },
            "perception": { "t1": 0, "t2": 0, "t3": 0 },
            "esquive": { "t1": 0, "t2": 0, "t3": 0 },
            "attaque": { "t1": 0, "t2": 0, "t3": 0 },
            "parade": { "t1": 0, "t2": 0, "t3": 0 },
            "degats": { "t1": 0, "t2": 0, "t3": 0 }
        },
        "temp_modifiers": {
            "mod1": "",
            "mod2": "",
            "mod3": ""
        },
        "inventory": []
    });

    db.execute(
        "INSERT INTO personnages (id, name, data, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, default_data.to_string(), now],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn delete_personnage(id: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.execute("DELETE FROM personnages WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
