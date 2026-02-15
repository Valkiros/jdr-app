use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value; // Keep generic JSON for flexibility
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Debug)]
pub struct Personnage {
    pub id: String,
    pub name: String,
    pub data: Value,        // Complete sheet data
    pub updated_at: String, // ISO timestamp for sync
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefEquipement {
    pub id: i64,
    pub category: String,
    pub ref_id: i32,
    pub nom: String,
    pub degats: serde_json::Value,           // JSON: { pi, degats }
    pub caracteristiques: serde_json::Value, // JSON: { courage, intelligence, ... }
    pub protections: serde_json::Value,      // JSON: { pr_sol, pr_spe, pr_mag, ... }
    pub prix_info: serde_json::Value,        // JSON: { prix, monnaie }
    pub craft: serde_json::Value,            // JSON: { composants, outils, ... }
    pub details: serde_json::Value,          // JSON: { aura, type, effet, poids, ... }
}

pub struct AppState {
    pub db: Mutex<Connection>,
}

pub fn init_db() -> Result<Connection> {
    let conn = Connection::open("../game_data_v2.db")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS personnages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Updated Table Schema to match Supabase
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ref_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            ref_id INTEGER DEFAULT 0,
            nom TEXT NOT NULL,
            degats TEXT DEFAULT '{}',
            caracteristiques TEXT DEFAULT '{}',
            protections TEXT DEFAULT '{}',
            prix_info TEXT DEFAULT '{}',
            craft TEXT DEFAULT '{}',
            details TEXT DEFAULT '{}'
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS personnages_versions (
            version_id INTEGER PRIMARY KEY AUTOINCREMENT,
            personnage_id TEXT NOT NULL,
            data TEXT NOT NULL,
            saved_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS db_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}
