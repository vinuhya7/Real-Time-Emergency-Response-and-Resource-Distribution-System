import sqlite3
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).resolve().parent.parent / "emergency_system.db"

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    with connect() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            incident_type TEXT NOT NULL,
            location TEXT NOT NULL,
            severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 5),
            status TEXT NOT NULL DEFAULT 'Open',
            created_at TEXT NOT NULL,
            assigned_resource_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            location TEXT NOT NULL,
            available INTEGER NOT NULL DEFAULT 1
        );
        """)
        conn.commit()

def now_iso():
    return datetime.now(timezone.utc).isoformat()
