"""SQLite schema initialization and CRUD queries."""
import json
import aiosqlite
from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    type TEXT NOT NULL,
    region TEXT,
    data TEXT
);

CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    name TEXT PRIMARY KEY,
    rarity TEXT DEFAULT 'common',
    category TEXT,
    description TEXT DEFAULT '',
    version INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    source TEXT
);

CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    rank TEXT DEFAULT 'C',
    status TEXT DEFAULT 'active',
    reward_gold INTEGER,
    reward_xp INTEGER,
    created_at TEXT,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
"""


async def init_db():
    """Initialize DB. Drops events table to avoid duplicates on restart."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DROP TABLE IF EXISTS events")
        await db.executescript(SCHEMA)
        await db.commit()


async def insert_event(event: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        ts = event.get("ts") or event.get("timestamp", "")
        etype = event.get("type") or event.get("event", "")
        await db.execute(
            "INSERT INTO events (ts, type, region, data) VALUES (?, ?, ?, ?)",
            (ts, etype, event.get("region"), json.dumps(event.get("data", {}))),
        )
        await db.commit()


async def upsert_state(state: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
            (json.dumps(state),),
        )
        await db.commit()


async def upsert_skill(skill: dict):
    # Guard: never insert empty skill names
    name = skill.get("name", "")
    if not name or not name.strip():
        return
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO skills (name, rarity, category, version, description, created_at, updated_at, source)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(name) DO UPDATE SET
                 rarity = excluded.rarity,
                 category = excluded.category,
                 version = excluded.version,
                 description = CASE WHEN excluded.description != '' THEN excluded.description ELSE skills.description END,
                 updated_at = excluded.updated_at,
                 source = excluded.source""",
            (skill["name"], skill.get("rarity", "common"), skill.get("category"),
             skill.get("version", 1), skill.get("description", ""),
             skill.get("created_at"), skill.get("updated_at"),
             skill.get("source")),
        )
        await db.commit()


async def upsert_quest(quest: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO quests (id, title, description, rank, status, reward_gold, reward_xp, created_at, completed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 status = excluded.status,
                 completed_at = excluded.completed_at""",
            (quest["id"], quest["title"], quest.get("description"), quest.get("rank", "C"),
             quest.get("status", "active"), quest.get("reward_gold"), quest.get("reward_xp"),
             quest.get("created_at"), quest.get("completed_at")),
        )
        await db.commit()


async def get_state() -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        row = await db.execute_fetchall("SELECT data FROM state WHERE id = 1")
        if row:
            return json.loads(row[0][0])
    return None


async def get_events(limit: int = 50, offset: int = 0) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        rows = await db.execute_fetchall(
            "SELECT ts, type, region, data FROM events ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        return [{"ts": r[0], "type": r[1], "region": r[2], "data": json.loads(r[3]) if r[3] else {}} for r in rows]


async def has_feedback_for_event(event_id: str) -> bool:
    """Return True if a feedback event for this event_id already exists in the persisted event log."""
    if not event_id:
        return False

    pattern = f'%\\"event_id\\": "{event_id}"%'
    async with aiosqlite.connect(DB_PATH) as db:
        rows = await db.execute_fetchall(
            "SELECT 1 FROM events WHERE type = ? AND data LIKE ? LIMIT 1",
            ("user_feedback", pattern),
        )
        return bool(rows)


async def get_skills() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        rows = await db.execute_fetchall(
            "SELECT name, rarity, category, version, description, created_at, updated_at, source FROM skills WHERE TRIM(name) != '' AND name IS NOT NULL ORDER BY name"
        )
        return [{"name": r[0], "rarity": r[1], "category": r[2], "version": r[3],
                 "description": r[4] or "", "created_at": r[5], "updated_at": r[6], "source": r[7]} for r in rows]


async def get_quests(status: str = None) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        if status:
            rows = await db.execute_fetchall(
                "SELECT id, title, description, rank, status, reward_gold, reward_xp, created_at, completed_at FROM quests WHERE status = ? ORDER BY created_at DESC",
                (status,),
            )
        else:
            rows = await db.execute_fetchall(
                "SELECT id, title, description, rank, status, reward_gold, reward_xp, created_at, completed_at FROM quests ORDER BY created_at DESC"
            )
        return [{"id": r[0], "title": r[1], "description": r[2], "rank": r[3], "status": r[4],
                 "reward_gold": r[5], "reward_xp": r[6], "created_at": r[7], "completed_at": r[8]} for r in rows]


async def delete_skill(name: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM skills WHERE name = ?", (name,))
        await db.commit()
        return cursor.rowcount > 0
