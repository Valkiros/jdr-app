use crate::db::{AppState, RefEquipement};
use crate::logic::{calculer_stats_finales, BaseStats, Equipement, Etats, FinalStats};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub fn get_ref_items(state: State<AppState>) -> Result<Vec<RefEquipement>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, category, ref_id, nom, degats, caracteristiques, protections, prix_info, craft, details FROM ref_items")
        .map_err(|e| e.to_string())?;

    let items_iter = stmt
        .query_map([], |row| {
            Ok(RefEquipement {
                id: row.get(0)?,
                category: row.get(1)?,
                ref_id: row.get(2)?,
                nom: row.get(3)?,
                degats: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
                caracteristiques: serde_json::from_str(&row.get::<_, String>(5)?)
                    .unwrap_or_default(),
                protections: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
                prix_info: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                craft: serde_json::from_str(&row.get::<_, String>(8)?).unwrap_or_default(),
                details: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for item in items_iter {
        items.push(item.map_err(|e| e.to_string())?);
    }

    Ok(items)
}

#[tauri::command]
pub fn create_ref_equipement(
    category: String,
    ref_id: i32,
    nom: String,
    degats: serde_json::Value,
    caracteristiques: serde_json::Value,
    protections: serde_json::Value,
    prix_info: serde_json::Value,
    craft: serde_json::Value,
    details: serde_json::Value,
    state: State<AppState>,
) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.execute(
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
    )
    .map_err(|e| e.to_string())?;

    Ok(db.last_insert_rowid())
}

#[tauri::command]
pub fn update_ref_equipement(
    id: i64,
    category: String,
    ref_id: i32,
    nom: String,
    degats: serde_json::Value,
    caracteristiques: serde_json::Value,
    protections: serde_json::Value,
    prix_info: serde_json::Value,
    craft: serde_json::Value,
    details: serde_json::Value,
    state: State<AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.execute(
        "UPDATE ref_items SET 
            category = ?1, ref_id = ?2, nom = ?3, degats = ?4, caracteristiques = ?5, 
            protections = ?6, prix_info = ?7, craft = ?8, details = ?9
         WHERE id = ?10",
        params![
            category,
            ref_id,
            nom,
            degats.to_string(),
            caracteristiques.to_string(),
            protections.to_string(),
            prix_info.to_string(),
            craft.to_string(),
            details.to_string(),
            id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_ref_equipement(id: i64, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM ref_items WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
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

#[tauri::command]
pub fn import_personnage(
    id: String,
    name: String,
    data: String, // JSON string
    updated_at: String,
    state: State<AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.execute(
        "INSERT OR REPLACE INTO personnages (id, name, data, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, data, updated_at],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
#[derive(Debug, Serialize, Deserialize)]
pub struct Requirements {
    #[serde(rename = "COU")]
    pub cour: Option<i32>,
    #[serde(rename = "INT")]
    pub int: Option<i32>,
    #[serde(rename = "CHA")]
    pub cha: Option<i32>,
    #[serde(rename = "AD")]
    pub ad: Option<i32>,
    #[serde(rename = "FO")]
    pub fo: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Origine {
    #[serde(alias = "ID")]
    pub id: i32,
    #[serde(alias = "Name_M")]
    pub name_m: String,
    #[serde(alias = "Name_F")]
    pub name_f: String,
    #[serde(alias = "Min")]
    pub min: Requirements,
    #[serde(alias = "Max")]
    pub max: Requirements,
    #[serde(alias = "Vitesse")]
    pub vitesse: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Metier {
    #[serde(alias = "ID")]
    pub id: i32,
    #[serde(alias = "Name_M")]
    pub name_m: String,
    #[serde(alias = "Name_F")]
    pub name_f: String,
    #[serde(alias = "Min")]
    pub min: Requirements,
    #[serde(alias = "Max")]
    pub max: Requirements,
    #[serde(alias = "Specialisations", default)]
    pub specialisations: Option<Vec<Specialisation>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Specialisation {
    #[serde(alias = "ID")]
    pub id: String,
    #[serde(alias = "Name_M")]
    pub name_m: String,
    #[serde(alias = "Name_F")]
    pub name_f: String,
    #[serde(alias = "Necessite_competence", default)]
    pub necessite_competence: Vec<String>,
    #[serde(alias = "Attributs_automatisables")]
    pub attributs_automatisables: serde_json::Value,
    #[serde(alias = "Attributs_specifiques")]
    pub attributs_specifiques: serde_json::Value,
    #[serde(alias = "Competences", default)]
    pub competences: Option<Vec<String>>,
    #[serde(alias = "SousSpecialisations", default)]
    pub sous_specialisations: Option<Vec<SousSpecialisation>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SousSpecialisation {
    #[serde(alias = "ID")]
    pub id: String,
    #[serde(alias = "Name_M")]
    pub name_m: String,
    #[serde(alias = "Name_F")]
    pub name_f: String,
    #[serde(alias = "Necessite_competence", default)]
    pub necessite_competence: Vec<String>,
    #[serde(alias = "Attributs_automatisables")]
    pub attributs_automatisables: serde_json::Value,
    #[serde(alias = "Attributs_specifiques")]
    pub attributs_specifiques: serde_json::Value,
    #[serde(alias = "Competences_obligatoires", default)]
    pub competences_obligatoires: Option<Vec<String>>,
    #[serde(alias = "Nombre_competences_choix", default)]
    pub nombre_competences_choix: Option<i32>,
    #[serde(alias = "Competences_choix", default)]
    pub competences_choix: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CorruptionOrigineRef {
    #[serde(rename = "Masculin")]
    pub masculin: String,
    #[serde(rename = "Féminin")]
    pub feminin: String,
    #[serde(rename = "Effets")]
    pub effets: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CorruptionPalierRef {
    #[serde(rename = "Paliers")]
    pub paliers: i32,
    #[serde(rename = "Aura chaotique (arme)")]
    pub aura_chaotique_arme: i32,
    #[serde(rename = "Aura divine (arme)")]
    pub aura_divine_arme: i32,
    #[serde(rename = "Aura chaotique (protection)")]
    pub aura_chaotique_protection: i32,
    #[serde(rename = "Aura divine (protection)")]
    pub aura_divine_protection: i32,
    #[serde(rename = "Résistance magique (RM)")]
    pub rm: i32,
    #[serde(rename = "Force (FO)")]
    pub fo: i32,
    #[serde(rename = "Intelligence (INT)")]
    pub int: i32,
    #[serde(rename = "Charisme (CHA)")]
    pub cha: i32,
    #[serde(rename = "Effets")]
    pub effets: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameRules {
    pub origines: Vec<Origine>,
    pub metiers: Vec<Metier>,
    pub corruption_origine: Vec<CorruptionOrigineRef>,
    pub corruption_palier: Vec<CorruptionPalierRef>,
}

#[tauri::command]
pub fn get_game_rules() -> Result<GameRules, String> {
    let origines_json = include_str!("../data/config/origines.json");
    let metiers_json = include_str!("../data/config/metiers.json");
    let corruption_origine_json = include_str!("../data/config/corruption_origine.json");
    let corruption_palier_json = include_str!("../data/config/corruption_palier.json");

    let origines: Vec<Origine> = serde_json::from_str(origines_json)
        .map_err(|e| format!("Failed to parse origines.json: {}", e))?;
    let metiers: Vec<Metier> = serde_json::from_str(metiers_json)
        .map_err(|e| format!("Failed to parse metiers.json: {}", e))?;
    let corruption_origine: Vec<CorruptionOrigineRef> =
        serde_json::from_str(corruption_origine_json)
            .map_err(|e| format!("Failed to parse corruption_origine.json: {}", e))?;
    let corruption_palier: Vec<CorruptionPalierRef> = serde_json::from_str(corruption_palier_json)
        .map_err(|e| format!("Failed to parse corruption_palier.json: {}", e))?;

    Ok(GameRules {
        origines,
        metiers,
        corruption_origine,
        corruption_palier,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionSummary {
    version_id: i64,
    saved_at: String,
}

#[tauri::command]
pub fn get_personnage_versions(
    id: String,
    state: State<AppState>,
) -> Result<Vec<VersionSummary>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT version_id, saved_at FROM personnages_versions WHERE personnage_id = ?1 ORDER BY saved_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![id], |row| {
            Ok(VersionSummary {
                version_id: row.get(0)?,
                saved_at: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut versions = Vec::new();
    for row in rows {
        versions.push(row.map_err(|e| e.to_string())?);
    }
    Ok(versions)
}

#[tauri::command]
pub fn restore_personnage_version(
    id: String,
    version_id: i64,
    state: State<AppState>,
) -> Result<(), String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    {
        // 1. Get version data
        let (data, saved_at): (String, String) = tx.query_row(
            "SELECT data, saved_at FROM personnages_versions WHERE version_id = ?1 AND personnage_id = ?2",
            params![version_id, id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("Version introuvable: {}", e.to_string()))?;

        // 2. Restore to main table
        tx.execute(
            "UPDATE personnages SET data = ?1, updated_at = ?2 WHERE id = ?3",
            params![data, saved_at, id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_personnage_local(
    id: String,
    name: String,
    data: String,
    updated_at: String,
    state: State<AppState>,
) -> Result<(), String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    // 1. Get current data to backup
    let result: Result<Option<(String, String)>, rusqlite::Error> = tx
        .query_row(
            "SELECT data, updated_at FROM personnages WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional();
    // Note: If new char, result is None, nothing to backup.

    if let Ok(Some((old_data, old_updated_at))) = result {
        tx.execute(
            "INSERT INTO personnages_versions (personnage_id, data, saved_at) VALUES (?1, ?2, ?3)",
            params![id, old_data, old_updated_at],
        )
        .map_err(|e| e.to_string())?;
    }

    // 2. Prune old versions (Keep 3)
    tx.execute(
        "DELETE FROM personnages_versions 
         WHERE personnage_id = ?1 
         AND version_id NOT IN (
            SELECT version_id FROM personnages_versions 
            WHERE personnage_id = ?1 
            ORDER BY saved_at DESC 
            LIMIT 3
         )",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    // 3. Update Current
    tx.execute(
        "UPDATE personnages SET name = ?1, data = ?2, updated_at = ?3 WHERE id = ?4",
        params![name, data, updated_at, id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Competence {
    #[serde(alias = "Competence")]
    pub nom: String,
    #[serde(alias = "Description")]
    pub description: String,
    #[serde(alias = "Tableau")]
    pub tableau: Option<String>,
}

#[tauri::command]
pub fn get_competences() -> Result<Vec<Competence>, String> {
    let json_content = include_str!("../data/config/competences.json");
    let competences: Vec<Competence> = serde_json::from_str(json_content)
        .map_err(|e| format!("Failed to parse competences.json: {}", e))?;
    Ok(competences)
}
