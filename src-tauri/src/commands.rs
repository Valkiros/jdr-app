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
    pub esquive_bonus: i32,
    pub degats_pr: String,
    pub description: String,
    pub details: serde_json::Value, // Flexible JSON field
}

#[tauri::command]
pub fn get_ref_equipements(
    _category: Option<String>,
    _state: State<AppState>,
) -> Result<Vec<RefEquipement>, String> {
    // Dummy implementation for debug with mocked data
    Ok(vec![
        RefEquipement {
            id: 1,
            category: "Armes".to_string(),
            nom: "Epée courte".to_string(),
            poids: 1.5,
            esquive_bonus: 0,
            degats_pr: "1D6".to_string(),
            description: "Une épée standard".to_string(),
            details: serde_json::json!({ "rupture": "1à6", "mains": 1 }),
        },
        RefEquipement {
            id: 2,
            category: "Protections".to_string(),
            nom: "Bouclier".to_string(),
            poids: 3.0,
            esquive_bonus: 2,
            degats_pr: "0".to_string(),
            description: "+2 Parade".to_string(),
            details: serde_json::json!({ "parade": 2 }),
        },
        RefEquipement {
            id: 3,
            category: "Accessoires".to_string(),
            nom: "Sac à dos".to_string(),
            poids: 0.5,
            esquive_bonus: 0,
            degats_pr: "".to_string(),
            description: "Pour porter des choses".to_string(),
            details: serde_json::json!({ "contenance": 50 }),
        }
    ])
}

#[tauri::command]
pub fn compute_stats(
    base: BaseStats,
    equipements: Vec<Equipement>,
    etats: Etats,
) -> FinalStats {
    calculer_stats_finales(base, equipements, etats)
}
