use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value; // Keep generic JSON for flexibility
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Debug)]
pub struct Personnage {
    pub id: String,
    pub name: String,
    pub data: Value, // Complete sheet data
    pub updated_at: String, // ISO timestamp for sync
}

pub struct AppState {
    pub db: Mutex<Connection>,
}

pub fn init_db() -> Result<Connection> {
    let conn = Connection::open("local.db")?;

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
        "CREATE TABLE IF NOT EXISTS ref_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            ref_id INTEGER NOT NULL,
            nom TEXT NOT NULL,
            data TEXT NOT NULL -- Store JSONB equivalent as TEXT in SQLite
        )",
        [],
    )?;

    Ok(conn)
}
