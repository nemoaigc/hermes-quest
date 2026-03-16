"""File watcher: monitors events.jsonl and state.json, syncs to SQLite, broadcasts via WebSocket."""
import asyncio
import json
import logging
import re
from datetime import datetime, timezone

import yaml

from config import EVENTS_FILE, STATE_FILE, SKILLS_DIR
from pathlib import Path as _Path

MAP_FILE = _Path.home() / ".hermes" / "quest" / "knowledge-map.json"
QUESTS_V2_FILE = _Path.home() / ".hermes" / "quest" / "quests.json"

from models import insert_event, upsert_state, upsert_skill, upsert_quest
from ws_manager import manager

logger = logging.getLogger(__name__)

# Category mapping: tag keywords -> category
_CATEGORY_TAGS = {
    "coding": ("programming", "coding", "development", "debugging", "code-review",
               "programming-fundamentals", "test-driven", "software"),
    "research": ("research", "knowledge", "learning", "papers", "academic",
                 "science", "arxiv", "domain-intel"),
    "automation": ("automation", "tool", "mcp", "tools", "integrations"),
}


def _infer_category(tags: list[str], dir_name: str) -> str:
    """Infer a category from tags or the parent directory name."""
    tag_lower = {t.lower() for t in tags}
    for category, keywords in _CATEGORY_TAGS.items():
        if tag_lower & set(keywords):
            return category
    # Fall back to well-known directory names
    dir_map = {
        "software-development": "coding",
        "research": "research",
        "mcp": "automation",
        "autonomous-ai-agents": "automation",
        "productivity": "automation",
        "gaming": "gaming",
        "creative": "creative",
        "media": "media",
        "apple": "automation",
        "smart-home": "automation",
        "email": "automation",
        "note-taking": "automation",
        "github": "coding",
    }
    return dir_map.get(dir_name, dir_name)


def _parse_skill_md(path) -> dict | None:
    """Parse YAML frontmatter from a SKILL.md file."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return None
    try:
        return yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None


class QuestWatcher:
    def __init__(self):
        self._events_pos = 0
        self._state_mtime = 0.0
        self._map_mtime = 0.0
        self._quests_mtime = 0.0

    async def initial_sync(self):
        # --- Scan filesystem skills ---
        await self._sync_filesystem_skills()

        # --- Replay events ---
        if EVENTS_FILE.exists():
            with open(EVENTS_FILE, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                        await insert_event(event)
                        await self._handle_event_side_effects(event)
                    except json.JSONDecodeError:
                        logger.warning("Skipping malformed event line")
                self._events_pos = f.tell()

        if STATE_FILE.exists():
            try:
                state = json.loads(STATE_FILE.read_text())
                await upsert_state(state)
                self._state_mtime = STATE_FILE.stat().st_mtime
            except (json.JSONDecodeError, OSError):
                pass

    async def _sync_filesystem_skills(self):
        """Scan ~/.hermes/skills/ for SKILL.md files and upsert into DB."""
        if not SKILLS_DIR.exists():
            logger.info("Skills directory not found: %s", SKILLS_DIR)
            return

        now = datetime.now(timezone.utc).isoformat()
        count = 0

        for skill_md in SKILLS_DIR.rglob("SKILL.md"):
            fm = _parse_skill_md(skill_md)
            if not fm:
                continue

            name = fm.get("name", skill_md.parent.name)
            description = fm.get("description", "")
            version_raw = fm.get("version", "1.0.0")
            # Convert semver string to int (major version) for the DB
            try:
                version = int(str(version_raw).split(".")[0])
            except (ValueError, IndexError):
                version = 1

            # Extract tags from metadata.hermes.tags
            hermes_meta = (fm.get("metadata") or {}).get("hermes") or {}
            tags = hermes_meta.get("tags") or []

            # Category: prefer explicit metadata, then infer
            category = hermes_meta.get("category")
            if not category:
                # Parent dir relative to SKILLS_DIR gives the category group
                rel = skill_md.parent.relative_to(SKILLS_DIR)
                parent_dir = rel.parts[0] if len(rel.parts) > 1 else rel.parts[0]
                category = _infer_category(tags, parent_dir)

            # Rarity: local skills = common, hub-sourced = epic
            source = fm.get("author", "")
            is_hub = "hub" in source.lower() if source else False
            rarity = "epic" if is_hub else "common"

            await upsert_skill({
                "name": name,
                "rarity": rarity,
                "category": category,
                "version": version,
                "description": description,
                "created_at": now,
                "updated_at": now,
                "source": "filesystem",
            })
            count += 1

        logger.info("Filesystem skill sync complete: %d skills loaded", count)

    async def poll_once(self):
        if EVENTS_FILE.exists():
            current_size = EVENTS_FILE.stat().st_size
            if current_size < self._events_pos:
                self._events_pos = 0
            if current_size > self._events_pos:
                with open(EVENTS_FILE, "r") as f:
                    f.seek(self._events_pos)
                    new_lines = f.readlines()
                    self._events_pos = f.tell()

                for line in new_lines:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                        await insert_event(event)
                        await self._handle_event_side_effects(event)
                        await manager.broadcast({"type": "event", "data": event})
                    except json.JSONDecodeError:
                        logger.warning("Skipping malformed event line")

        if STATE_FILE.exists():
            try:
                mtime = STATE_FILE.stat().st_mtime
                if mtime > self._state_mtime:
                    self._state_mtime = mtime
                    state = json.loads(STATE_FILE.read_text())
                    await upsert_state(state)
                    await manager.broadcast({"type": "state", "data": state})
            except (json.JSONDecodeError, OSError):
                pass

        # Watch knowledge-map.json
        if MAP_FILE.exists():
            try:
                mtime = MAP_FILE.stat().st_mtime
                if mtime > self._map_mtime:
                    self._map_mtime = mtime
                    map_data = json.loads(MAP_FILE.read_text())
                    await manager.broadcast({"type": "map", "data": map_data})
            except (json.JSONDecodeError, OSError):
                pass

        # Watch quests.json
        if QUESTS_V2_FILE.exists():
            try:
                mtime = QUESTS_V2_FILE.stat().st_mtime
                if mtime > self._quests_mtime:
                    self._quests_mtime = mtime
                    quests = json.loads(QUESTS_V2_FILE.read_text())
                    await manager.broadcast({"type": "quest", "data": {"quests": quests}})
            except (json.JSONDecodeError, OSError):
                pass

    async def _handle_event_side_effects(self, event: dict):
        etype = event.get("type")
        data = event.get("data", {})

        if etype == "skill_drop":
            _skill_name = data.get("skill", "")
            if not _skill_name or not _skill_name.strip():
                return  # Skip empty skill names
            await upsert_skill({
                "name": _skill_name,
                "rarity": data.get("rarity", "common"),
                "category": data.get("category"),
                "version": data.get("version", 1),
                "created_at": event.get("ts"),
                "updated_at": event.get("ts"),
                "source": "training",
            })
        elif etype == "hub_acquire":
            _skill_name = data.get("skill", "")
            if not _skill_name or not _skill_name.strip():
                return  # Skip empty skill names
            await upsert_skill({
                "name": _skill_name,
                "rarity": "epic",
                "category": None,
                "version": 1,
                "created_at": event.get("ts"),
                "updated_at": event.get("ts"),
                "source": data.get("source", "hub"),
            })
        elif etype == "quest_accept":
            await upsert_quest({
                "id": data.get("quest_id", ""),
                "title": data.get("title", ""),
                "description": "",
                "rank": "C",
                "status": "active",
                "reward_gold": data.get("reward_gold"),
                "reward_xp": data.get("reward_xp"),
                "created_at": event.get("ts"),
                "completed_at": None,
            })
        elif etype in ("quest_complete", "quest_fail"):
            status = "completed" if etype == "quest_complete" else "failed"
            await upsert_quest({
                "id": data.get("quest_id", ""),
                "title": "",
                "status": status,
                "completed_at": event.get("ts"),
            })
            # Also update quests.json so /api/quest/active reflects the change
            quest_id = data.get("quest_id", "")
            if quest_id and QUESTS_V2_FILE.exists():
                try:
                    qs = json.loads(QUESTS_V2_FILE.read_text())
                    for q in qs:
                        if q["id"] == quest_id:
                            q["status"] = status
                            q["completed_at"] = event.get("ts")
                            break
                    QUESTS_V2_FILE.write_text(json.dumps(qs, indent=2))
                except (json.JSONDecodeError, OSError):
                    pass

    async def run(self, interval: float = 2.0):
        logger.info("Watcher started (polling every %.1fs)", interval)
        while True:
            try:
                await self.poll_once()
            except Exception as e:
                logger.error("Watcher error: %s", e)
            await asyncio.sleep(interval)
