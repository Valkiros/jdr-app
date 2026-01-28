use rusqlite::{params, Connection, Result};
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

pub struct AppState {
    pub db: Mutex<Connection>,
}

pub fn init_db() -> Result<Connection> {
    let conn = Connection::open("../game_data_v5.db")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS personnages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ref_equipements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            nom TEXT NOT NULL,
            poids REAL NOT NULL,
            pi INTEGER DEFAULT 0,
            rupture TEXT DEFAULT '',
            esquive_bonus INTEGER NOT NULL,
            degats_pr TEXT NOT NULL,
            pr_mag INTEGER DEFAULT 0,
            pr_spe INTEGER DEFAULT 0,
            item_type TEXT DEFAULT '',
            description TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}
