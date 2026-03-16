import sys
"""Hermes Quest Backend - FastAPI application."""
import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from config import PORT, HOST, QUESTS_PENDING_FILE, STATE_FILE, HUB_RECOMMENDATIONS_FILE, SKILLS_DIR, GAME_BALANCE, MODEL, PROXY_URL
from models import init_db, get_state, get_events, get_skills, get_quests, delete_skill, upsert_state, insert_event, upsert_quest
from watcher import QuestWatcher
from ws_manager import manager
import asyncio
_state_lock = asyncio.Lock()
_feedbacked_event_ids: set[str] = set()

from npc_chat import chat_with_npc, VALID_NPCS
from skill_classify import reclassify_skills_after_site_change

# --- API Key Authentication ---
import os
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

QUEST_API_KEY = os.getenv("QUEST_API_KEY", "")

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse as StarletteJSONResponse

class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)
        if request.url.path.startswith("/api/"):
            if QUEST_API_KEY:
                key = request.headers.get("X-API-Key", "")
                referer = request.headers.get("Referer", "")
                origin = request.headers.get("Origin", "")
                host = str(request.base_url).rstrip("/")
                is_same_origin = (referer and referer.startswith(host)) or (origin and origin.startswith(host))
                if key != QUEST_API_KEY and not is_same_origin:
                    return StarletteJSONResponse(status_code=401, content={"error": "unauthorized"})
        return await call_next(request)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

watcher = QuestWatcher()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await watcher.initial_sync()
    task = asyncio.create_task(watcher.run())
    logger.info("Hermes Quest backend started on %s:%d", HOST, PORT)
    yield
    task.cancel()


app = FastAPI(title="Hermes Quest", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(APIKeyMiddleware)


@app.get("/api/state")
async def api_state():
    state = await get_state()
    if not state:
        if STATE_FILE.exists():
            try:
                state = json.loads(STATE_FILE.read_text())
            except (json.JSONDecodeError, OSError):
                pass
    if not state:
        return {"error": "no state"}
    # MP decay: lose 2 MP per day of inactivity (after 1 day)
    last = state.get("last_interaction_at")
    if last:
        try:
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            days_since = (now - last_dt).total_seconds() / 86400
            if days_since > GAME_BALANCE["mp_decay_grace_days"]:
                decay = int(GAME_BALANCE["mp_decay_rate"] * int(days_since))
                new_mp = max(0, state.get("mp", 100) - decay)
                if new_mp != state.get("mp", 100):
                    state["mp"] = new_mp
                    # Persist decayed MP
                    state_path = Path.home() / ".hermes" / "quest" / "state.json"
                    try:
                        state_path.write_text(json.dumps(state, indent=2))
                    except OSError:
                        pass
        except Exception:
            pass
    # Daily login bonus: +100G if >24h since last grant
    last_gold_grant = state.get("last_gold_grant", "")
    now_utc = datetime.now(timezone.utc)
    grant_bonus = False
    if last_gold_grant:
        try:
            last_dt = datetime.fromisoformat(last_gold_grant.replace("Z", "+00:00"))
            if (now_utc - last_dt).total_seconds() > 86400:
                grant_bonus = True
        except Exception:
            pass
    else:
        grant_bonus = True
    if grant_bonus:
        state["gold"] = state.get("gold", 0) + 100
        state["last_gold_grant"] = now_utc.isoformat()
        state_path = Path.home() / ".hermes" / "quest" / "state.json"
        try:
            state_path.write_text(json.dumps(state, indent=2))
            await upsert_state(state)
        except Exception:
            pass
    return state


@app.get("/api/events")
async def api_events(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)):
    events = await get_events(limit, offset)
    # Dedup by ts + type + first 60 chars of data
    seen = set()
    unique_events = []
    for e in events:
        key = f"{e.get('ts')}-{e.get('type')}-{str(e.get('data',{}))[:60]}"
        if key not in seen:
            seen.add(key)
            unique_events.append(e)
    return unique_events


@app.get("/api/skills")
async def api_skills():
    return await get_skills()




@app.delete("/api/skills/{skill_name}")
async def api_delete_skill(skill_name: str):
    """Forget a skill: remove from DB and delete from filesystem."""
    import shutil
    # Find and delete from filesystem
    deleted_fs = False
    for skill_md in SKILLS_DIR.rglob("SKILL.md"):
        fm_text = skill_md.read_text(encoding="utf-8")
        import re as _re
        m = _re.match(r"^---\s*\n(.*?)\n---", fm_text, _re.DOTALL)
        if m:
            import yaml as _yaml
            try:
                fm = _yaml.safe_load(m.group(1))
                if fm and fm.get("name") == skill_name:
                    shutil.rmtree(skill_md.parent)
                    deleted_fs = True
                    break
            except Exception:
                pass
        if skill_md.parent.name == skill_name:
            shutil.rmtree(skill_md.parent)
            deleted_fs = True
            break
    # Delete from DB
    deleted_db = await delete_skill(skill_name)
    if deleted_fs or deleted_db:
        return {"status": "deleted", "name": skill_name}
    return {"status": "not_found", "name": skill_name}


@app.get("/api/hub/search")
async def api_hub_search(q: str = Query("", min_length=0)):
    """Search the Hermes Skills Hub (optional-skills + GitHub taps)."""
    import sys, importlib.util
    _agent_dir = str(Path.home() / ".hermes" / "hermes-agent")
    sys.path.insert(0, _agent_dir)
    # Add agent venv site-packages for httpx etc.
    import glob as _glob
    for _sp in _glob.glob(str(Path.home() / ".hermes" / "hermes-agent" / "venv" / "lib" / "python*" / "site-packages")):
        if _sp not in sys.path:
            sys.path.insert(0, _sp)
    try:
        guard_spec = importlib.util.spec_from_file_location("tools.skills_guard", f"{_agent_dir}/tools/skills_guard.py")
        guard_mod = importlib.util.module_from_spec(guard_spec)
        sys.modules["tools.skills_guard"] = guard_mod
        guard_spec.loader.exec_module(guard_mod)
        hub_spec = importlib.util.spec_from_file_location("tools.skills_hub", f"{_agent_dir}/tools/skills_hub.py")
        hub_mod = importlib.util.module_from_spec(hub_spec)
        sys.modules["tools.skills_hub"] = hub_mod
        hub_spec.loader.exec_module(hub_mod)
        create_source_router = hub_mod.create_source_router
        GitHubAuth = hub_mod.GitHubAuth
        auth = GitHubAuth()
        sources = create_source_router(auth)
        results = []
        query = q.strip() if q.strip() else ""
        for source in sources:
            try:
                hits = source.search(query, limit=20)
                for h in hits:
                    results.append({
                        "name": h.name,
                        "description": h.description,
                        "source": h.source,
                        "identifier": h.identifier,
                        "trust_level": h.trust_level,
                        "tags": h.tags,
                    })
            except Exception as e:
                logger.warning("Hub search error from %s: %s", source.source_id(), e)
        return results
    except Exception as e:
        logger.error("Hub search failed: %s", e)
        return []


@app.post("/api/hub/install")
async def api_hub_install(body: dict):
    """Install a skill from the hub by identifier."""
    import sys, importlib.util, shutil, tempfile
    _agent_dir = str(Path.home() / ".hermes" / "hermes-agent")
    sys.path.insert(0, _agent_dir)
    identifier = body.get("identifier", "")
    if not identifier:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Missing identifier"})
    # Skill install costs gold
    skill_cost = GAME_BALANCE.get("skill_install_cost", 300)
    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    try:
        _st = json.loads(state_path.read_text())
    except Exception:
        _st = {}
    if _st.get("gold", 0) < skill_cost:
        return JSONResponse(status_code=400, content={"status": "error", "message": f"Not enough gold (need {skill_cost}G)"})
    _st["gold"] = _st.get("gold", 0) - skill_cost
    state_path.write_text(json.dumps(_st, indent=2))
    try:
        # Load hub module (needs httpx in agent venv, so we add it)
        agent_venv_site = str(Path.home() / ".hermes" / "hermes-agent" / "venv" / "lib")
        import glob as _glob
        for sp in _glob.glob(f"{agent_venv_site}/python*/site-packages"):
            if sp not in sys.path:
                sys.path.insert(0, sp)

        guard_spec = importlib.util.spec_from_file_location("tools.skills_guard", f"{_agent_dir}/tools/skills_guard.py")
        guard_mod = importlib.util.module_from_spec(guard_spec)
        sys.modules["tools.skills_guard"] = guard_mod
        guard_spec.loader.exec_module(guard_mod)
        hub_spec = importlib.util.spec_from_file_location("tools.skills_hub", f"{_agent_dir}/tools/skills_hub.py")
        hub_mod = importlib.util.module_from_spec(hub_spec)
        sys.modules["tools.skills_hub"] = hub_mod
        hub_spec.loader.exec_module(hub_mod)
        create_source_router = hub_mod.create_source_router
        GitHubAuth = hub_mod.GitHubAuth
        auth = GitHubAuth()
        sources = create_source_router(auth)
        for source in sources:
            bundle = source.fetch(identifier)
            if bundle:
                # Simple install: write bundle files to skills dir
                skill_name = bundle.name or identifier.split("/")[-1]
                install_dir = SKILLS_DIR / skill_name
                install_dir.mkdir(parents=True, exist_ok=True)
                for fname, fcontent in bundle.files.items():
                    fpath = install_dir / fname
                    fpath.parent.mkdir(parents=True, exist_ok=True)
                    if isinstance(fcontent, bytes):
                        fpath.write_bytes(fcontent)
                    else:
                        fpath.write_text(str(fcontent))
                # Re-sync skills
                await watcher._sync_filesystem_skills()
                return {"status": "installed", "name": skill_name, "message": f"Installed {skill_name} from {bundle.source}"}
        return JSONResponse(status_code=404, content={"status": "error", "message": f"Skill not found: {identifier}"})
    except Exception as e:
        logger.error("Hub install failed: %s", e)
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/api/regions")
async def api_regions():
    state = await get_state()
    if not state:
        return []
    regions = [
        {"id": "emerald_forest", "name": "Emerald Forest", "domain": "Basic programming", "boss": "Syntax Serpent"},
        {"id": "shadow_cavern", "name": "Shadow Cavern", "domain": "Debugging", "boss": "Memory Leak Ghost"},
        {"id": "iron_forge", "name": "Iron Forge Castle", "domain": "Architecture", "boss": "Monolith Colossus"},
        {"id": "flame_peaks", "name": "Flame Peaks", "domain": "Performance", "boss": "Deadlock Demon"},
        {"id": "starlight_academy", "name": "Starlight Academy", "domain": "AI/ML", "boss": "Overfitting Lich"},
        {"id": "abyssal_rift", "name": "Abyssal Rift", "domain": "Advanced", "boss": "???"},
        {"id": "guild", "name": "Adventurer's Guild", "domain": "Quests", "boss": None},
    ]
    unlocked = set(state.get("regions_unlocked", []))
    cleared = set(state.get("regions_cleared", []))
    current = state.get("current_region", "")
    for r in regions:
        r["unlocked"] = r["id"] in unlocked
        r["cleared"] = r["id"] in cleared
        r["current"] = r["id"] == current
    return regions


@app.get("/api/quests")
async def api_quests(status: str = None):
    quests = _read_quests_v2()
    if status:
        quests = [q for q in quests if q.get("status") == status]
    return quests


class QuestCreate(BaseModel):
    title: str
    description: str = ""
    rank: str = "C"
    reward_gold: int = GAME_BALANCE["default_create_reward_gold"]
    reward_xp: int = GAME_BALANCE["default_create_reward_xp"]


@app.get("/api/hub-recommendations")
async def api_hub_recommendations():
    if HUB_RECOMMENDATIONS_FILE.exists():
        try:
            return json.loads(HUB_RECOMMENDATIONS_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return []


@app.post("/api/quests")
async def create_quest(quest: QuestCreate):
    quest_id = f"q-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    new_quest = {
        "id": quest_id,
        "title": quest.title,
        "description": quest.description,
        "rank": quest.rank,
        "reward_gold": quest.reward_gold,
        "reward_xp": quest.reward_xp,
        "created_at": now,
    }
    pending = []
    if QUESTS_PENDING_FILE.exists():
        try:
            pending = json.loads(QUESTS_PENDING_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pending = []
    pending.append(new_quest)
    QUESTS_PENDING_FILE.write_text(json.dumps(pending, indent=2))
    return {"id": quest_id, "status": "active"}




# === Knowledge Map v2 API Endpoints ===

MAP_FILE = Path.home() / ".hermes" / "quest" / "knowledge-map.json"
QUESTS_V2_FILE = Path.home() / ".hermes" / "quest" / "quests.json"
COMPLETIONS_DIR = Path.home() / ".hermes" / "quest" / "completions"
ACCEPTED_REC_IDS_FILE = Path.home() / ".hermes" / "quest" / "accepted_rec_ids.json"


def _read_accepted_rec_ids() -> set:
    if ACCEPTED_REC_IDS_FILE.exists():
        try:
            return set(json.loads(ACCEPTED_REC_IDS_FILE.read_text()))
        except (json.JSONDecodeError, OSError):
            pass
    return set()


def _save_accepted_rec_id(rec_id: str):
    ids = _read_accepted_rec_ids()
    ids.add(rec_id)
    ACCEPTED_REC_IDS_FILE.parent.mkdir(parents=True, exist_ok=True)
    ACCEPTED_REC_IDS_FILE.write_text(json.dumps(list(ids)))


def _read_quests_v2():
    quests = []
    if QUESTS_V2_FILE.exists():
        try:
            quests = json.loads(QUESTS_V2_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    # Merge legacy quests-pending.json (v1)
    if QUESTS_PENDING_FILE.exists():
        try:
            pending = json.loads(QUESTS_PENDING_FILE.read_text())
            existing_ids = {q.get("id") for q in quests}
            for pq in pending:
                if pq.get("id") not in existing_ids:
                    if "status" not in pq:
                        pq["status"] = "active"
                    quests.append(pq)
        except (json.JSONDecodeError, OSError):
            pass
    return quests


def _write_quests_v2(quests):
    QUESTS_V2_FILE.parent.mkdir(parents=True, exist_ok=True)
    QUESTS_V2_FILE.write_text(json.dumps(quests, indent=2))


def _generate_recommended_quests(map_data):
    """Generate 3-5 recommended quests. Randomized + deduped against active quests."""
    import random
    try:
        _state = json.loads((Path.home() / ".hermes" / "quest" / "state.json").read_text())
        level = _state.get("level", 1)
    except Exception:
        level = 1
    active_titles = set()
    try:
        qs = json.loads((Path.home() / ".hermes" / "quest" / "quests.json").read_text())
        for q in qs:
            if q.get("status") in ("active", "in_progress", "pending"):
                active_titles.add(q.get("title", "").lower())
    except Exception:
        pass
    candidates = []
    qid = 0
    workflows = map_data.get("workflows", [])
    weak_pool = [w for w in workflows if w.get("mastery", 0) < GAME_BALANCE["weak_mastery_threshold"]]
    random.shuffle(weak_pool)
    for wf in weak_pool[:3]:
        subs = list(wf.get("sub_nodes", []))
        random.shuffle(subs)
        t = subs[0] if subs else None
        tn = t["name"] if t else wf["name"]
        mp = int((t or wf).get("mastery", 0) * 100)
        wf_id = wf["id"]
        wf_name = wf["name"]
        qid += 1
        rank = "C" if mp < GAME_BALANCE["rank_c_mastery_threshold"] else "B"
        candidates.append({
            "id": f"rec-weak-{wf_id}-{qid}-{random.randint(1000,9999)}",
            "title": f"Train: {tn}",
            "description": f"Your {tn} mastery is only {mp}%. Practice in {wf_name}.",
            "rank": rank,
            "reward_gold": (GAME_BALANCE["reward_C"]["gold_base"]+level*GAME_BALANCE["reward_C"]["gold_per_level"]) if rank=="C" else (GAME_BALANCE["reward_B"]["gold_base"]+level*GAME_BALANCE["reward_B"]["gold_per_level"]),
            "reward_xp": (GAME_BALANCE["reward_C"]["xp_base"]+level*GAME_BALANCE["reward_C"]["xp_per_level"]) if rank=="C" else (GAME_BALANCE["reward_B"]["xp_base"]+level*GAME_BALANCE["reward_B"]["xp_per_level"]),
            "source": "workflow_weakness",
            "related_workflow": wf_id,
        })
    fog = list(map_data.get("fog_regions", []))
    random.shuffle(fog)
    for fg in fog[:2]:
        qid += 1
        h = fg.get("hint", "Unknown Territory")
        fog_id = fg["id"]
        candidates.append({
            "id": f"rec-fog-{fog_id}-{qid}-{random.randint(1000,9999)}",
            "title": f"Explore: {h}",
            "description": f"Venture into {h} to expand your map.",
            "rank": "B",
            "reward_gold": GAME_BALANCE["reward_B"]["gold_base"]+level*GAME_BALANCE["reward_B"]["gold_per_level"],
            "reward_xp": GAME_BALANCE["reward_B"]["xp_base"]+level*GAME_BALANCE["reward_B"]["xp_per_level"],
            "source": "fog_exploration",
            "fog_region_id": fog_id,
        })
    if workflows:
        top = sorted(workflows, key=lambda w: w.get("mastery",0), reverse=True)[:3]
        random.shuffle(top)
        b = top[0]
        bp = int(b.get("mastery",0)*100)
        qid += 1
        b_id = b["id"]
        b_name = b["name"]
        candidates.append({
            "id": f"rec-master-{b_id}-{qid}-{random.randint(1000,9999)}",
            "title": f"Master: {b_name}",
            "description": f"Push {b_name} ({bp}%) to the next level.",
            "rank": "A",
            "reward_gold": GAME_BALANCE["reward_A"]["gold_base"]+level*GAME_BALANCE["reward_A"]["gold_per_level"],
            "reward_xp": GAME_BALANCE["reward_A"]["xp_base"]+level*GAME_BALANCE["reward_A"]["xp_per_level"],
            "source": "mastery_push",
            "related_workflow": b_id,
        })
    filtered = [q for q in candidates if q["title"].lower() not in active_titles]
    accepted_ids = _read_accepted_rec_ids()
    filtered = [q for q in filtered if q["id"] not in accepted_ids]
    random.shuffle(filtered)
    return filtered[:5]


@app.get("/api/map")
async def get_knowledge_map(refresh: bool = Query(False)):
    if refresh:
        # Bulletin board refresh costs 50 gold
        state_path = Path.home() / ".hermes" / "quest" / "state.json"
        async with _state_lock:
            try:
                state = json.loads(state_path.read_text())
            except Exception:
                state = {}
            if state.get("gold", 0) < GAME_BALANCE["refresh_cost"]:
                return JSONResponse(status_code=400, content={"error": f"Not enough gold (need {GAME_BALANCE['refresh_cost']}G)"})
            state["gold"] -= GAME_BALANCE["refresh_cost"]
            # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))
        await upsert_state(state)
        # Clear accepted rec IDs to regenerate fresh recommendations
        if ACCEPTED_REC_IDS_FILE.exists():
            ACCEPTED_REC_IDS_FILE.write_text("[]")
    if not MAP_FILE.exists():
        return JSONResponse(status_code=404, content={"error": "no_map_data"})
    try:
        data = json.loads(MAP_FILE.read_text())
    except (json.JSONDecodeError, OSError):
        return JSONResponse(status_code=500, content={"error": "invalid_map_data"})
    # Clamp workflow mastery values to [0.0, 1.0]
    for wf in data.get("workflows", []):
        wf["mastery"] = min(1.0, max(0.0, wf.get("mastery", 0)))
        for sn in wf.get("sub_nodes", []):
            sn["mastery"] = min(1.0, max(0.0, sn.get("mastery", 0)))
    # Generate recommended_quests dynamically
    if refresh or "recommended_quests" not in data or not data["recommended_quests"]:
        data["recommended_quests"] = _generate_recommended_quests(data)
        # Persist recommendations so accept can find them by ID
        try:
            raw = json.loads(MAP_FILE.read_text())
            raw["recommended_quests"] = data["recommended_quests"]
            MAP_FILE.write_text(json.dumps(raw, indent=2))
        except Exception:
            pass
    return data


@app.get("/api/quest/active")
async def get_active_quests():
    quests = _read_quests_v2()
    active = [q for q in quests if q.get("status") in ("active", "in_progress", "pending")]
    completed_count = sum(1 for q in quests if q.get("status") == "completed")
    return {"quests": active, "completed_count": completed_count}


@app.post("/api/quest/accept")
async def accept_quest_v2(body: dict):
    quests = _read_quests_v2()
    quest_id = body.get("quest_id")

    if quest_id:
        # Check if this quest_id already exists as an active quest (by title, not ID)
        # task-* IDs are user-created quests already in the list, so ID match would always block them
        existing = next((q for q in quests if q["id"] == quest_id), None)
        if existing and existing.get("status") in ("active", "in_progress", "pending"):
            return JSONResponse(status_code=409, content={"error": "quest_already_accepted"})
        if MAP_FILE.exists():
            try:
                map_data = json.loads(MAP_FILE.read_text())
                # Generate recommendations if not persisted (same as /api/map)
                recs = map_data.get("recommended_quests", [])
                if not recs and hasattr(sys.modules[__name__], '_generate_recommended_quests'):
                    recs = _generate_recommended_quests(map_data)
                rec = next((q for q in recs if q["id"] == quest_id), None)
                if rec:
                    # Check for duplicate active quest with same title
                    rec_title = rec.get("title", "")
                    if any(q.get("title") == rec_title and q.get("status") in ("active", "in_progress", "pending") for q in quests):
                        return JSONResponse(status_code=409, content={"error": "duplicate_active_quest", "message": f"An active quest with title '{rec_title}' already exists"})
                    new_quest = {
                        **rec,
                        "id": f"quest-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}",
                        "status": "active",
                        "progress": 0.0,
                        "accepted_at": datetime.now(timezone.utc).isoformat(),
                        "completed_at": None,
                        "source": "bulletin_board",
                    }
                    quests.append(new_quest)
                    _write_quests_v2(quests)
                    _save_accepted_rec_id(quest_id)
                    return {"quest_id": new_quest["id"], "status": "active"}
            except (json.JSONDecodeError, OSError):
                pass
        return JSONResponse(status_code=404, content={"error": "quest_not_found"})

    fog_region_id = body.get("fog_region_id")
    if fog_region_id:
        if MAP_FILE.exists():
            try:
                map_data = json.loads(MAP_FILE.read_text())
                fog = next((f for f in map_data.get("fog_regions", []) if f["id"] == fog_region_id), None)
                if fog:
                    new_quest = {
                        "id": f"quest-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}",
                        "title": f"Explore: {fog[chr(104) + chr(105) + chr(110) + chr(116)]}",
                        "description": fog.get("discovery_condition", "Explore this unknown region"),
                        "region": "unknown",
                        "rank": "B",
                        "status": "active",
                        "progress": 0.0,
                        "reward_gold": 200,
                        "reward_xp": 250,
                        "related_skills": [],
                        "accepted_at": datetime.now(timezone.utc).isoformat(),
                        "completed_at": None,
                        "source": "map_exploration",
                    }
                    quests.append(new_quest)
                    _write_quests_v2(quests)
                    return {"quest_id": new_quest["id"], "status": "active"}
            except (json.JSONDecodeError, OSError):
                pass
        return JSONResponse(status_code=404, content={"error": "fog_region_not_found"})
    return JSONResponse(status_code=400, content={"error": "missing_quest_id_or_fog_region_id"})


@app.get("/api/bag/items")
async def get_bag_items():
    items = []
    # Read from bag.json first
    bag_json = Path.home() / ".hermes" / "quest" / "bag.json"
    if bag_json.exists():
        try:
            bag_items = json.loads(bag_json.read_text())
            for item in bag_items:
                if "id" not in item:
                    item["id"] = f"bag-{item.get('name', 'unknown')}"
                items.append(item)
        except (json.JSONDecodeError, OSError):
            pass
    if COMPLETIONS_DIR.exists():
        for f in sorted(COMPLETIONS_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if f.suffix == ".md":
                try:
                    items.append({
                        "id": f"completion-{f.stem}",
                        "type": "research_note",
                        "name": f.stem.replace("-", " ").title(),
                        "description": f.read_text()[:200] if f.stat().st_size > 0 else "",
                        "source_quest": None,
                        "created_at": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
                        "file_path": str(f),
                        "icon": "scroll",
                        "rarity": "common",
                    })
                except OSError:
                    pass
    return {"items": items[:50]}


@app.post("/api/npc/chat")
async def npc_chat(body: dict):
    npc = body.get("npc", "guild_master")
    message = body.get("message", "")[:500]
    context = body.get("context", {})
    if npc not in VALID_NPCS:
        return JSONResponse(status_code=400, content={"error": "invalid_npc"})

    game_state = await get_state()
    history = body.get("history", [])
    result = await chat_with_npc(npc, message, context, game_state, history=history)
    return result

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    state = await get_state()
    if state:
        await ws.send_text(json.dumps({"type": "state", "data": state}))
    events = await get_events(limit=20)
    for event in reversed(events):
        await ws.send_text(json.dumps({"type": "event", "data": event}))
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)



# === Cycle Management ===

@app.post("/api/cycle/start")
async def cycle_start():
    """Manually trigger a quest evolution cycle."""
    import subprocess, os
    lock_path = os.path.expanduser("~/.hermes/quest/cycle.lock")
    
    # Check lock
    if os.path.exists(lock_path):
        try:
            with open(lock_path) as f:
                ts = int(f.read().strip())
            import time
            if time.time() - ts < GAME_BALANCE["cycle_lock_timeout"]:  # 30 min
                return {"status": "already_running"}
        except (ValueError, OSError):
            pass
    
    # Trigger via cron tick (non-blocking)
    env = os.environ.copy()
    subprocess.Popen(
        ["/root/.hermes/hermes-agent/venv/bin/python", "-m", "hermes_cli.main", "cron", "tick"],
        env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    return {"status": "started"}


@app.get("/api/cycle/status")
async def cycle_status():
    """Check if a cycle is currently running."""
    import os, time
    lock_path = os.path.expanduser("~/.hermes/quest/cycle.lock")
    if os.path.exists(lock_path):
        try:
            with open(lock_path) as f:
                ts = int(f.read().strip())
            if time.time() - ts < GAME_BALANCE["cycle_lock_timeout"]:
                return {"status": "running", "started_at": ts}
        except (ValueError, OSError):
            pass
    return {"status": "idle"}


@app.post("/api/quest/create")
async def quest_create(body: dict):
    """User-initiated learning task. Costs 100 gold."""
    import uuid
    from datetime import datetime, timezone
    import re as _re_create
    raw_title = body.get("title", "").strip()[:200]
    title = _re_create.sub(r"<[^>]+>", "", raw_title).strip()
    if not title or len(title) < 1:
        return JSONResponse(status_code=400, content={"error": "Title is required (1-200 chars, no HTML)"})

    # Gold sink: user-created quests are FREE (retry still costs gold)
    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    is_retry = body.get("retry", False)
    if is_retry:
        async with _state_lock:
            try:
                _st = json.loads(state_path.read_text())
            except Exception:
                _st = {}
            cost = GAME_BALANCE["quest_retry_cost"]
            if _st.get("gold", 0) < cost:
                return JSONResponse(status_code=400, content={"error": f"Not enough gold (need {cost}G)"})
            _st["gold"] -= cost
            state_path.write_text(json.dumps(_st, indent=2))
        await upsert_state(_st)
    
    task = {
        "id": f"task-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}",
        "title": title,
        "description": body.get("description", ""),
        "source": body.get("source", "user"),
        "workflow_id": body.get("workflow_id"),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "accepted_at": None,
        "completed_at": None,
    }
    
    quests = _read_quests_v2()
    quests.append(task)
    _write_quests_v2(quests)
    # Broadcast quest update via WebSocket
    await manager.broadcast({"type": "quest", "data": {"quests": [q for q in quests if q.get("status") in ("active", "in_progress")]}})
    return {"status": "created", "task": task}





@app.post("/api/quest/edit")
async def quest_edit(body: dict):
    quest_id = body.get("quest_id", "")
    title = body.get("title", "").strip()[:200]
    if not quest_id or not title:
        return JSONResponse(status_code=400, content={"error": "missing quest_id or title"})
    async with _state_lock:
        quests = _read_quests_v2()
        found = False
        for q in quests:
            if q["id"] == quest_id:
                q["title"] = title
                found = True
                break
        if not found:
            return JSONResponse(status_code=404, content={"error": "quest not found"})
        _write_quests_v2(quests)
    return {"status": "updated", "quest_id": quest_id, "title": title}

@app.post("/api/quest/cancel")
async def quest_cancel(body: dict):
    quest_id = body.get("quest_id", "")
    if not quest_id:
        return JSONResponse(status_code=400, content={"error": "missing quest_id"})
    async with _state_lock:
        quests = _read_quests_v2()
        found = False
        for q in quests:
            if q["id"] == quest_id and q.get("status") in ("active", "in_progress", "pending"):
                q["status"] = "cancelled"
                found = True
                break
        if not found:
            return JSONResponse(status_code=404, content={"error": "quest not found"})
        _write_quests_v2(quests)
        # Also update SQLite DB so /api/quests reflects the cancel
        await upsert_quest({"id": quest_id, "title": "", "status": "cancelled", "completed_at": None})
    return {"status": "cancelled", "quest_id": quest_id}

@app.post("/api/quest/fail")
async def quest_fail(body: dict):
    """Mark a quest as failed. Penalties: HP, MP."""
    quest_id = body.get("quest_id", "")
    if not quest_id:
        return JSONResponse(status_code=400, content={"error": "quest_id required"})
    async with _state_lock:
        quests = _read_quests_v2()
        found = None
        for q in quests:
            if q["id"] == quest_id and q.get("status") in ("active", "in_progress", "pending"):
                q["status"] = "failed"
                q["completed_at"] = datetime.now(timezone.utc).isoformat()
                found = q
                break
        if not found:
            return JSONResponse(status_code=404, content={"error": "quest not found or not active"})
        _write_quests_v2(quests)
        await upsert_quest({"id": quest_id, "title": found.get("title", ""), "status": "failed", "completed_at": found["completed_at"]})

        state_path = Path.home() / ".hermes" / "quest" / "state.json"
        try:
            state = json.loads(state_path.read_text())
        except Exception:
            state = {}
        hp_penalty = GAME_BALANCE["fail_hp_penalty"]
        mp_penalty = GAME_BALANCE["fail_mp_penalty"]
        state["hp"] = max(0, state.get("hp", 100) - hp_penalty)
        state["mp"] = max(0, state.get("mp", 100) - mp_penalty)
        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))

    await upsert_state(state)
    await manager.broadcast({"type": "state", "data": state})

    return {"ok": True, "quest_id": quest_id, "hp_penalty": hp_penalty, "mp_penalty": mp_penalty}


@app.post("/api/quest/complete")
async def quest_complete(body: dict):
    """Mark a quest as completed. Awards XP and gold."""
    quest_id = body.get("quest_id", "")
    if not quest_id:
        return JSONResponse(status_code=400, content={"error": "missing quest_id"})
    
    quests = _read_quests_v2()
    found = False
    for q in quests:
        if q["id"] == quest_id and q.get("status") in ("active", "in_progress"):
            q["status"] = "completed"
            from datetime import datetime, timezone
            q["completed_at"] = datetime.now(timezone.utc).isoformat()
            found = True
            break
    
    if not found:
        return JSONResponse(status_code=404, content={"error": "quest not found or already completed"})
    
    _write_quests_v2(quests)
    
    # Award XP and gold
    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    async with _state_lock:
        try:
            state = json.loads(state_path.read_text())
        except Exception:
            state = {}
        
        # Use quest-specific rewards if available
        completed_quest = next((qq for qq in quests if qq.get('id') == quest_id), {})
        xp_reward = completed_quest.get('reward_xp', GAME_BALANCE["default_reward_xp"])
        gold_reward = completed_quest.get('reward_gold', GAME_BALANCE["default_reward_gold"])
        state["xp"] = state.get("xp", 0) + xp_reward
        state["gold"] = (state.get("gold") or 0) + gold_reward
        
        # Check level up
        leveled_up = False
        while state["xp"] >= state.get("xp_to_next", state.get("level", 1) * GAME_BALANCE["xp_per_level"]):
            state["xp"] -= state["xp_to_next"]
            state["level"] = state.get("level", 1) + 1
            state["xp_to_next"] = state["level"] * GAME_BALANCE["xp_per_level"]
            state["hp_max"] = GAME_BALANCE["hp_base"] + state["level"] * GAME_BALANCE["hp_per_level"]
            state["hp"] = state["hp_max"]
            leveled_up = True
        # Level-up restores 30 MP
        if leveled_up:
            state["mp"] = min(state.get("mp", 0) + GAME_BALANCE["levelup_mp_restore"], state.get("mp_max", GAME_BALANCE["mp_max"]))
        
        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))
    await upsert_state(state)
    
    # Log event
    from datetime import datetime, timezone
    events_path = Path.home() / ".hermes" / "quest" / "events.jsonl"
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "type": "quest_complete",
        "region": None,
        "data": {"quest_id": quest_id, "reward_xp": xp_reward, "reward_gold": gold_reward}
    }
    with open(events_path, "a") as f:
        f.write(json.dumps(event) + "\n")
    
    # Broadcast updates
    await manager.broadcast({"type": "state", "data": state})
    await manager.broadcast({"type": "event", "data": event})
    active = [q for q in quests if q.get("status") in ("active", "in_progress", "pending")]
    await manager.broadcast({"type": "quest", "data": {"quests": active}})
    
    return {"status": "completed", "xp_reward": xp_reward, "gold_reward": gold_reward, "quest_id": quest_id}

@app.post("/api/feedback")
async def user_feedback(body: dict):
    """User thumbs up/down on a learning event. Immediately updates MP."""
    event_id = body.get("event_id", "")
    feedback_type = body.get("type", "")  # "positive" or "negative" (also accepts "up"/"down")
    detail = body.get("detail", "")
    event_type = body.get("event_type", "")

    # Dedup: reject if this event_id was already feedback'd
    if event_id and event_id in _feedbacked_event_ids:
        return JSONResponse(status_code=409, content={"error": "already_feedbacked"})

    if feedback_type not in ("up", "down", "positive", "negative"):
        return JSONResponse(status_code=400, content={"error": "type must be positive or negative"})

    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    events_path = Path.home() / ".hermes" / "quest" / "events.jsonl"

    async with _state_lock:
        try:
            state = json.loads(state_path.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return JSONResponse(status_code=500, content={"error": "no state"})

        if feedback_type in ("up", "positive"):
            state["mp"] = min(state.get("mp", 0) + GAME_BALANCE["feedback_mp_delta"], state.get("mp_max", GAME_BALANCE["mp_max"]))
        else:
            state["mp"] = max(state.get("mp", 0) - GAME_BALANCE["feedback_mp_delta"], 0)

        # Record feedback to prevent duplicates
        if event_id:
            _feedbacked_event_ids.add(event_id)

        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True

        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))

    # Log event with full context
    from datetime import datetime, timezone
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "type": "user_feedback",
        "region": None,
        "data": {
            "event_id": event_id,
            "feedback_type": feedback_type,
            "reason": detail,
            "event_type": event_type,
        }
    }
    with open(events_path, "a") as f:
        f.write(json.dumps(event) + "\n")

    # Sync state to DB immediately
    await upsert_state(state)

    # Broadcast state and event via WebSocket
    await manager.broadcast({"type": "state", "data": state})
    await manager.broadcast({"type": "event", "data": event})

    return {"status": "ok", "hp": state["hp"], "mp": state["mp"]}




# === Reflection Letter ===

@app.get("/api/reflection/latest")
async def reflection_latest():
    """Get the latest reflection letter."""
    letter_path = Path.home() / ".hermes" / "quest" / "reflection-letter.md"
    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    try:
        _st = json.loads(state_path.read_text())
    except Exception:
        _st = {}
    pending = _st.get("reflection_letter_pending", False)
    if letter_path.exists():
        return {"letter": letter_path.read_text(), "pending": pending}
    if pending:
        # Generate reflection letter using LLM
        try:
            from npc_chat import _get_codex_client
            prompt_path = Path(__file__).parent / "prompts" / "reflection" / "letter.md"
            if prompt_path.exists():
                template = prompt_path.read_text()
                template = template.replace("{{name}}", _st.get("name", "Adventurer"))
                template = template.replace("{{level}}", str(_st.get("level", 1)))
                template = template.replace("{{class}}", _st.get("class", "unknown"))
                # Gather recent events
                try:
                    recent = await get_events(limit=10)
                    recent_text = "; ".join([e.get("title", e.get("text", ""))[:80] for e in recent]) if recent else "(no recent events)"
                except Exception:
                    recent_text = "(unavailable)"
                template = template.replace("{{recent_events}}", recent_text)
                # Gather active quests
                try:
                    all_q = await get_quests()
                    active_q = [q["title"] for q in all_q if q.get("status") in ("active", "in_progress", "pending")]
                    quests_text = "; ".join(active_q) if active_q else "(no active quests)"
                except Exception:
                    quests_text = "(unavailable)"
                template = template.replace("{{active_quests}}", quests_text)
                template = template.replace("{{total_cycles}}", str(_st.get("total_cycles", 0)))

                result = _get_codex_client()
                if result:
                    client, http = result
                    try:
                        response = await client.responses.create(
                            model=MODEL, input=template, store=False
                        )
                        letter = response.output_text
                        letter_path.write_text(letter)
                        return {"letter": letter, "pending": True}
                    finally:
                        await http.aclose()
        except Exception as e:
            logger.error(f"Failed to generate reflection letter: {e}")
        return {"letter": "Your stability has reached zero. Take a moment to reflect on your journey. What went wrong? What can you learn?", "pending": True}
    return {"letter": "No reflection letter yet.", "pending": False}
@app.post("/api/reflection/acknowledge")
async def reflection_acknowledge():
    """User acknowledges reading the reflection letter. HP recovers to 20%."""
    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    async with _state_lock:
        try:
            state = json.loads(state_path.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return {"error": "no state"}
        
        hp_max = state.get("hp_max", 100)
        state["hp"] = max(state.get("hp", 0), int(hp_max * GAME_BALANCE["reflection_hp_recovery_ratio"]))
        state["reflection_letter_pending"] = False
        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))
    
    await manager.broadcast({"type": "state", "data": state})
    return {"ok": True, "hp": state["hp"]}



# === Tavern Ambient Chat ===

TAVERN_CACHE_FILE = Path.home() / ".hermes" / "quest" / "tavern-ambient.json"
_tavern_generating = False

@app.get("/api/tavern/ambient")
async def tavern_ambient():
    """Get the NPC group chat. Cached, regenerated after each cycle or on demand."""
    if TAVERN_CACHE_FILE.exists():
        try:
            data = json.loads(TAVERN_CACHE_FILE.read_text())
            return data
        except Exception:
            pass
    return {"messages": [], "generated_at": None}

@app.post("/api/tavern/generate")
async def tavern_generate():
    """Generate a new NPC group conversation based on current game state."""
    global _tavern_generating, _tavern_gen_time
    import time as _time
    # Auto-reset stuck lock after 60 seconds
    if _tavern_generating:
        if hasattr(tavern_generate, '_gen_start') and _time.time() - tavern_generate._gen_start > GAME_BALANCE["tavern_gen_timeout"]:
            _tavern_generating = False  # Reset stuck lock
        else:
            return {"status": "already_generating"}
    _tavern_generating = True
    tavern_generate._gen_start = _time.time()
    
    try:
        # Gather context
        state_path = Path.home() / ".hermes" / "quest" / "state.json"
        events_path = Path.home() / ".hermes" / "quest" / "events.jsonl"
        
        state = {}
        if state_path.exists():
            try: state = json.loads(state_path.read_text())
            except Exception: pass
        
        recent_events = []
        if events_path.exists():
            lines = events_path.read_text().strip().split("\n")
            for line in lines[-10:]:
                try: recent_events.append(json.loads(line))
                except Exception: pass
        
        # Build context for LLM
        ctx_parts = [
            f"Hermes is Level {state.get('level', 1)} {state.get('class', 'adventurer')} ({state.get('title', 'Novice')})",
            f"HP: {state.get('hp', 0)}/{state.get('hp_max', 100)}, MP: {state.get('mp', 0)}/100",
            f"Understanding: {state.get('understanding', 0)}%, Gold: {state.get('gold', 0)}",
            f"Total cycles: {state.get('total_cycles', 0)}, Skills: {state.get('skills_count', 0)}",
        ]
        if recent_events:
            evt_summaries = []
            for e in recent_events[-5:]:
                etype = e.get("type", "")
                edata = e.get("data", {})
                if etype == "skill_drop":
                    evt_summaries.append(f"learned skill: {edata.get('skill_name', '?')}")
                elif etype == "quest_complete":
                    evt_summaries.append(f"completed quest, earned {edata.get('reward_xp', 0)} XP")
                elif etype == "level_up":
                    evt_summaries.append(f"leveled up to {edata.get('to', '?')}")
                elif etype == "user_feedback":
                    evt_summaries.append(f"user gave {edata.get('feedback_type', '?')} feedback")
            if evt_summaries:
                ctx_parts.append("Recent events: " + "; ".join(evt_summaries))
        
        context = "\n".join(ctx_parts)
        
        # --- Load tavern-chat.md prompt (hot-reload) ---
        from npc_chat import _load_prompt, _render_prompt
        tavern_template = _load_prompt("tavern/group-chat")
        if tavern_template:
            # Build state_block and events_block for tavern template
            state_block = context
            events_block = ""
            if recent_events:
                evt_lines = []
                for e in recent_events[-5:]:
                    etype = e.get("type", "")
                    edata = e.get("data", {})
                    if etype == "skill_drop":
                        evt_lines.append(f"- Learned skill: {edata.get('skill_name', '?')}")
                    elif etype == "quest_complete":
                        evt_lines.append(f"- Completed quest, earned {edata.get('reward_xp', 0)} XP")
                    elif etype == "level_up":
                        evt_lines.append(f"- Leveled up to {edata.get('to', '?')}")
                    elif etype == "user_feedback":
                        evt_lines.append(f"- User gave {edata.get('feedback_type', '?')} feedback")
                    else:
                        evt_lines.append(f"- {etype}")
                events_block = "\n".join(evt_lines)

            prompt = _render_prompt(tavern_template, state, {},
                                    quests_info="", events_info="",
                                    rumors_info="")
            # Also replace state_block and events_block
            prompt = prompt.replace("{{state_block}}", f"<quest_data>{state_block}</quest_data>")
            prompt = prompt.replace("{{events_block}}", f"<quest_data>{events_block or 'No recent events.'}</quest_data>")
        else:
            # Fallback to inline prompt
            prompt = f"""You are writing a short tavern conversation between 5 RPG NPCs discussing their adventurer.
Write exactly 8-12 lines of dialogue. Each line format: "NPC_ID: dialogue text"
NPC IDs: lyra (Guild Master, female), aldric (Cartographer, male), kael (Quartermaster, female), gus (Bartender, male), orin (Sage, male)

Current state:
{context}

Rules:
- Each NPC speaks in character
- They discuss recent progress, give opinions, maybe disagree
- Keep it short and fun, 1-2 sentences per line
- Include at least one joke or banter between NPCs
- End with someone raising a toast or making a prediction"""

        from npc_chat import _get_codex_client
        result = _get_codex_client()
        if not result:
            _tavern_generating = False
            return {"status": "llm_unavailable"}
        
        client, http_client = result
        try:
            stream = await client.responses.create(
                model=MODEL,
                instructions="You generate NPC tavern dialogue.",
                input=[{"role": "user", "content": prompt}],
                store=False,
                stream=True,
            )
            
            parts = []
            async for event in stream:
                if hasattr(event, 'type'):
                    if event.type == 'response.output_text.delta':
                        parts.append(event.delta)
                    elif event.type == 'response.completed':
                        break
            
            await http_client.aclose()
            raw = "".join(parts).strip()
            
            # Parse into structured messages
            messages = []
            npc_names = {"lyra": "Lyra", "aldric": "Aldric", "kael": "Kael", "gus": "Gus", "orin": "Orin"}
            import re as _re_parser
            for line in raw.split("\n"):
                line = line.strip()
                if not line:
                    continue
                # Strip leading bullets/asterisks/dashes
                line = _re_parser.sub(r"^[\*\-\u2022\s]+", "", line).strip()
                if not line:
                    continue
                matched = False
                for npc_id, npc_display in npc_names.items():
                    # Handle: lyra:, Lyra:, LYRA:, **Lyra**:, *Lyra*:
                    pattern = _re_parser.compile(
                        r"^[\*_]*" + _re_parser.escape(npc_id) + r"[\*_]*\s*:",
                        _re_parser.IGNORECASE,
                    )
                    m = pattern.match(line)
                    if m:
                        text = line[m.end():].strip()
                        if text.startswith("\"") and text.endswith("\""):
                            text = text[1:-1]
                        messages.append({"npc": npc_id, "name": npc_display, "text": text})
                        matched = True
                        break
            # Fallback: if no messages parsed, return raw text as Gus
            if not messages and raw.strip():
                messages.append({"npc": "gus", "name": "Gus", "text": raw.strip()[:500]})
            from datetime import datetime, timezone
            result_data = {
                "messages": messages,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
            TAVERN_CACHE_FILE.write_text(json.dumps(result_data, indent=2, ensure_ascii=False))
            
            _tavern_generating = False
            return result_data
        except Exception as e:
            try: await http_client.aclose()
            except Exception: pass
            _tavern_generating = False
            return {"status": "error", "detail": str(e)}
    except Exception as e:
        _tavern_generating = False
        return {"status": "error", "detail": str(e)}


@app.post("/api/tavern/reply")
async def tavern_reply(body: dict):
    """User speaks in tavern - 1-N NPCs respond."""
    message = body.get("message", "").strip()[:500]
    history = body.get("history", [])  # [{npc, name, text}]
    if not message:
        return {"messages": []}

    # Gather game state
    state_path = Path.home() / ".hermes" / "quest" / "state.json"
    state = {}
    if state_path.exists():
        try:
            state = json.loads(state_path.read_text())
        except Exception:
            pass

    # Load NPC personalities from tavern-chat.md
    from npc_chat import _load_prompt, _get_codex_client
    npc_personalities = _load_prompt("tavern/group-chat") or ""
    # Extract just the Cast section for reference
    cast_section = ""
    if "## Cast" in npc_personalities:
        start = npc_personalities.index("## Cast")
        end_markers = ["## Current State", "## Recent Events", "## Dramatic Structure"]
        end = len(npc_personalities)
        for em in end_markers:
            if em in npc_personalities[start:]:
                end = start + npc_personalities[start:].index(em)
                break
        cast_section = npc_personalities[start:end].strip()

    # Format recent history
    history_lines = []
    for h in (history or [])[-10:]:
        name = h.get("name", "???")
        text = h.get("text", "")
        if h.get("npc") == "you":
            history_lines.append(f"Adventurer: {text}")
        else:
            history_lines.append(f"{name}: {text}")
    history_block = "\n".join(history_lines) if history_lines else "(conversation just started)"

    prompt = f"""{cast_section}

## Task

The adventurer just spoke in the tavern: "{message}"

Recent tavern conversation:
{history_block}

Adventurer status: Level {state.get('level', 1)} {state.get('class', 'adventurer')}, HP {state.get('hp', 0)}/{state.get('hp_max', 100)}

Write 2-4 NPC reactions. Multiple NPCs should respond, not just one. Rules:
- The NPC most relevant to the topic speaks FIRST
- At least 2 NPCs MUST respond. 3-4 is ideal. Only skip NPCs who truly have nothing to say.
- If the adventurer asked a question, ONE NPC answers, others comment/react/disagree
- If the adventurer said something funny, someone laughs and someone else adds to it
- Keep each response 1-2 sentences, in character
- Match the adventurer's language (if Chinese, reply in Chinese)
- Format: npc_id: dialogue text
- Valid npc_ids: lyra, aldric, kael, gus, orin
- Do NOT include the adventurer's line in your output
- IMPORTANT: Generate responses for MULTIPLE different NPCs, not just one
"""

    result = _get_codex_client()
    if not result:
        return {"messages": [{"npc": "gus", "name": "Gus", "text": "*wipes the counter silently*"}]}

    client, http_client = result
    try:
        stream = await client.responses.create(
            model=MODEL,
            instructions="You generate NPC tavern dialogue reactions to the adventurer speaking.",
            input=[{"role": "user", "content": prompt}],
            store=False,
            stream=True,
        )

        parts = []
        async for event in stream:
            if hasattr(event, 'type'):
                if event.type == 'response.output_text.delta':
                    parts.append(event.delta)
                elif event.type == 'response.completed':
                    break

        await http_client.aclose()
        raw = "".join(parts).strip()

        # Parse npc_id: text lines (same logic as tavern_generate)
        messages = []
        npc_names = {"lyra": "Lyra", "aldric": "Aldric", "kael": "Kael", "gus": "Gus", "orin": "Orin"}
        import re as _re_reply
        for line in raw.split("\n"):
            line = line.strip()
            if not line:
                continue
            line = _re_reply.sub(r"^[\*\-\u2022\s]+", "", line).strip()
            if not line:
                continue
            for npc_id, npc_display in npc_names.items():
                pattern = _re_reply.compile(
                    r"^[\*_]*" + _re_reply.escape(npc_id) + r"[\*_]*\s*:",
                    _re_reply.IGNORECASE,
                )
                m = pattern.match(line)
                if m:
                    text = line[m.end():].strip()
                    if text.startswith('"') and text.endswith('"'):
                        text = text[1:-1]
                    messages.append({"npc": npc_id, "name": npc_display, "text": text})
                    break

        if not messages and raw.strip():
            messages.append({"npc": "gus", "name": "Gus", "text": raw.strip()[:500]})

        return {"messages": messages}
    except Exception as e:
        logger.error(f"Tavern reply error: {e}")
        try:
            await http_client.aclose()
        except Exception:
            pass
        return {"messages": [{"npc": "gus", "name": "Gus", "text": "*wipes the counter silently*"}]}

# === Rumors (Twitter/X Integration) ===

@app.get("/api/rumors/search")
async def rumors_search(q: str = Query("AI", min_length=1), max: int = Query(10, ge=1, le=50)):
    """Search X/Twitter for rumors via twitter-cli."""
    import subprocess, os
    env = os.environ.copy()
    env["TWITTER_AUTH_TOKEN"] = os.getenv("TWITTER_AUTH_TOKEN", "")
    env["TWITTER_CT0"] = os.getenv("TWITTER_CT0", "")
    env["https_proxy"] = PROXY_URL
    env["http_proxy"] = PROXY_URL
    try:
        result = subprocess.run(
            ["/root/.local/bin/twitter", "search", q, "--max", str(max), "--json"],
            capture_output=True, text=True, timeout=30, env=env,
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if data.get("ok"):
                tweets = data.get("data", [])
                rumors = []
                for t in tweets:
                    rumors.append({
                        "id": t.get("id"),
                        "text": t.get("text", ""),
                        "author": t.get("author", {}).get("name", "Unknown"),
                        "handle": t.get("author", {}).get("screenName", ""),
                        "avatar": t.get("author", {}).get("profileImageUrl", ""),
                        "likes": t.get("metrics", {}).get("likes", 0),
                        "retweets": t.get("metrics", {}).get("retweets", 0),
                        "time": t.get("createdAt", ""),
                    })
                return {"ok": True, "rumors": rumors}
            return {"ok": False, "error": data.get("error", {}).get("message", "unknown")}
        return {"ok": False, "error": result.stderr[:200]}
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "timeout"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/api/rumors/feed")
async def rumors_feed(max: int = Query(10, ge=1, le=50)):
    """Get home timeline as rumors."""
    import subprocess, os
    env = os.environ.copy()
    env["TWITTER_AUTH_TOKEN"] = os.getenv("TWITTER_AUTH_TOKEN", "")
    env["TWITTER_CT0"] = os.getenv("TWITTER_CT0", "")
    env["https_proxy"] = PROXY_URL
    env["http_proxy"] = PROXY_URL
    try:
        result = subprocess.run(
            ["/root/.local/bin/twitter", "feed", "--max", str(max), "--json"],
            capture_output=True, text=True, timeout=30, env=env,
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if data.get("ok"):
                tweets = data.get("data", [])
                rumors = []
                for t in tweets:
                    rumors.append({
                        "id": t.get("id"),
                        "text": t.get("text", ""),
                        "author": t.get("author", {}).get("name", "Unknown"),
                        "handle": t.get("author", {}).get("screenName", ""),
                        "avatar": t.get("author", {}).get("profileImageUrl", ""),
                        "likes": t.get("metrics", {}).get("likes", 0),
                        "retweets": t.get("metrics", {}).get("retweets", 0),
                        "time": t.get("createdAt", ""),
                    })
                return {"ok": True, "rumors": rumors}
            return {"ok": False, "error": data.get("error", {}).get("message", "unknown")}
        return {"ok": False, "error": result.stderr[:200]}
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "timeout"}
    except Exception as e:
        return {"ok": False, "error": str(e)}




@app.get("/api/bag/item/{item_id}/content")
async def bag_item_content(item_id: str):
    """Return the text content of a bag item's file."""
    # Find item in bag.json
    bag_path = Path.home() / ".hermes" / "quest" / "bag.json"
    bag_items = json.loads(bag_path.read_text()) if bag_path.exists() else []

    # Also check completions
    item = next((i for i in bag_items if i.get("id") == item_id), None)

    # Check completion items too
    if not item and COMPLETIONS_DIR.exists():
        for f in COMPLETIONS_DIR.iterdir():
            if f.suffix == ".md" and f"completion-{f.stem}" == item_id:
                item = {"id": item_id, "name": f.name, "file_path": str(f)}
                break

    if not item:
        return JSONResponse(status_code=404, content={"error": "item not found"})

    # Try to resolve file path
    fp = item.get("file_path", "")
    if not fp:
        # Try common locations by item name
        name = item.get("name", "")
        stem = Path(name).stem if name else ""
        search_dirs = [
            Path.home() / ".hermes" / "quest",
            Path.home() / ".hermes",
            Path.home() / ".hermes" / "skills",
        ]
        for d in search_dirs:
            # Exact match first
            candidate = d / name
            if candidate.exists() and candidate.is_file():
                fp = str(candidate)
                break
        if not fp and stem:
            # Broader search: glob for files matching the stem
            hermes_root = Path.home() / ".hermes"
            for match in hermes_root.rglob(f"*{stem}*"):
                if match.is_file() and "venv" not in str(match) and "__pycache__" not in str(match):
                    fp = str(match)
                    break

    if not fp:
        return JSONResponse(status_code=400, content={"error": "no file_path and could not resolve file"})

    full_path = Path(fp).expanduser()
    if not full_path.exists():
        return JSONResponse(status_code=404, content={"error": "file not found"})

    try:
        text = full_path.read_text()[:5000]
        return {"content": text, "path": str(full_path)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})




# --- Sites endpoints ---
SITES_FILE = Path.home() / ".hermes" / "quest" / "sites.json"
import threading
_sites_file_lock = threading.Lock()

def _read_sites():
    with _sites_file_lock:
        if SITES_FILE.exists():
            return json.loads(SITES_FILE.read_text())
        return []

def _write_sites(sites):
    with _sites_file_lock:
        SITES_FILE.write_text(json.dumps(sites, indent=2))

@app.get("/api/sites")
async def get_sites():
    return _read_sites()

@app.post("/api/sites/define")
async def define_site(body: dict):
    site_id = body.get("site_id")
    name = body.get("name", "").strip()
    if not site_id or not name or len(name) > 40:
        return JSONResponse(status_code=400, content={"error": "Invalid site_id or name (1-40 chars)"})
    
    sites = _read_sites()
    site = next((s for s in sites if s["id"] == site_id), None)
    if not site:
        return JSONResponse(status_code=404, content={"error": "site_not_found"})
    if site.get("is_default"):
        return JSONResponse(status_code=400, content={"error": "cannot_modify_default"})
    
    site["name"] = name
    site["defined"] = True
    site["domain"] = body.get("domain", name.lower())
    
    # Auto-create workflow for this site
    wf_id = f"{site_id}-workflow"
    site["workflow_id"] = wf_id
    site["sprite"] = None  # will use fallback sprite
    _write_sites(sites)
    
    # Add workflow to knowledge-map.json
    try:
        km = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {"version": 2, "workflows": [], "connections": [], "fog_regions": []}
        if not any(w["id"] == wf_id for w in km["workflows"]):
            from datetime import datetime, timezone
            km["workflows"].append({
                "id": wf_id,
                "name": name,
                "description": f"Skills related to {name}",
                "category": site["domain"] or "general",
                "position": {"x": 0.5, "y": 0.5},
                "discovered_at": datetime.now(timezone.utc).isoformat(),
                "last_active": datetime.now(timezone.utc).isoformat(),
                "interaction_count": 0, "correction_count": 0,
                "mastery": 0, "skills_involved": [], "sub_nodes": []
            })
            MAP_FILE.write_text(json.dumps(km, indent=2))
    except Exception as e:
        logger.error(f"Failed to create workflow for site: {e}")
    # Trigger LLM skill reclassification in background
    asyncio.create_task(reclassify_skills_after_site_change(sites, MODEL, manager.broadcast))
    return {"ok": True, "site": site}

@app.post("/api/sites/rename")  
async def rename_site(body: dict):
    site_id = body.get("site_id")
    name = body.get("name", "").strip()
    if not site_id or not name or len(name) > 40:
        return JSONResponse(status_code=400, content={"error": "Invalid site_id or name"})
    
    sites = _read_sites()
    site = next((s for s in sites if s["id"] == site_id), None)
    if not site:
        return JSONResponse(status_code=404, content={"error": "site_not_found"})
    if site.get("is_default"):
        return JSONResponse(status_code=400, content={"error": "cannot_modify_default"})
    
    site["name"] = name
    site["domain"] = body.get("domain", name.lower())
    _write_sites(sites)
    
    # Update workflow name in knowledge-map
    wf_id = site.get("workflow_id")
    if wf_id:
        try:
            km = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {"workflows": []}
            for w in km.get("workflows", []):
                if w["id"] == wf_id:
                    w["name"] = name
                    w["category"] = site["domain"] or "general"
                    break
            MAP_FILE.write_text(json.dumps(km, indent=2))
        except Exception as e:
            logger.error(f"Failed to update workflow name: {e}")
    asyncio.create_task(reclassify_skills_after_site_change(sites, MODEL, manager.broadcast))
    return {"ok": True, "site": site}

@app.post("/api/sites/delete")
async def delete_site(body: dict):
    site_id = body.get("site_id")
    if not site_id:
        return JSONResponse(status_code=400, content={"error": "site_id required"})
    
    sites = _read_sites()
    site = next((s for s in sites if s["id"] == site_id), None)
    if not site:
        return JSONResponse(status_code=404, content={"error": "site_not_found"})
    if site.get("is_default"):
        return JSONResponse(status_code=400, content={"error": "cannot_delete_default"})
    
    old_workflow_id = site.get("workflow_id")
    
    site["name"] = None
    site["defined"] = False
    site["domain"] = None
    site["workflow_id"] = None
    site["sprite"] = None
    _write_sites(sites)
    
    # Remove the deleted site's workflow from knowledge-map
    # Skills will be redistributed by reclassification
    if old_workflow_id:
        try:
            km = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {"workflows": []}
            km["workflows"] = [w for w in km["workflows"] if w["id"] != old_workflow_id]
            MAP_FILE.write_text(json.dumps(km, indent=2))
        except Exception as e:
            logger.error(f"Failed to remove workflow: {e}")
    
    # Trigger LLM skill reclassification in background
    asyncio.create_task(reclassify_skills_after_site_change(sites, MODEL, manager.broadcast))
    return {"ok": True, "deleted_workflow": old_workflow_id}


STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "ws":
            return JSONResponse(status_code=404, content={"error": "not found"})
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")




@app.post("/api/bag/discard")
async def bag_discard(body: dict):
    item_id = body.get("item_id")
    if not item_id:
        return JSONResponse(status_code=400, content={"error": "item_id required"})
    
    bag_json = Path.home() / ".hermes" / "quest" / "bag.json"
    if not bag_json.exists():
        return JSONResponse(status_code=404, content={"error": "bag not found"})
    
    try:
        bag_items = json.loads(bag_json.read_text())
        original_len = len(bag_items)
        bag_items = [i for i in bag_items if i.get("id") != item_id and f"bag-{i.get('name', 'unknown')}" != item_id]
        if len(bag_items) == original_len:
            return JSONResponse(status_code=404, content={"error": "item not found"})
        bag_json.write_text(json.dumps(bag_items, indent=2, ensure_ascii=False))
        return {"ok": True, "remaining": len(bag_items)}
    except (json.JSONDecodeError, OSError) as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/potion/use")
async def use_potion(body: dict):
    """Use a potion. Types: hp_potion (200G, +20 HP), mp_potion (150G, +20 MP)"""
    potion_type = body.get("type", "")
    POTIONS = {
        "hp_potion": {"cost": GAME_BALANCE["hp_potion_cost"], "stat": "hp", "max_stat": "hp_max", "amount": GAME_BALANCE["hp_potion_heal"], "name": "HP Potion"},
        "mp_potion": {"cost": GAME_BALANCE["mp_potion_cost"], "stat": "mp", "max_stat": "mp_max", "amount": GAME_BALANCE["mp_potion_heal"], "name": "MP Potion"},
    }
    if potion_type not in POTIONS:
        return JSONResponse(status_code=400, content={"error": "invalid_potion_type"})

    p = POTIONS[potion_type]
    async with _state_lock:
        state = json.loads((Path.home() / ".hermes" / "quest" / "state.json").read_text())
        if state.get("gold", 0) < p["cost"]:
            cost = p["cost"]
            return JSONResponse(status_code=400, content={"error": f"Not enough gold (need {cost}G)"})

        current = state.get(p["stat"], 0)
        max_val = state.get(p["max_stat"], 100)
        if current >= max_val:
            stat_upper = p["stat"].upper()
            return JSONResponse(status_code=400, content={"error": f"{stat_upper} already full"})

        state["gold"] -= p["cost"]
        state[p["stat"]] = min(current + p["amount"], max_val)
        state_path = Path.home() / ".hermes" / "quest" / "state.json"
        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))

    await upsert_state(state)
    await manager.broadcast({"type": "state", "data": state})

    return {
        "ok": True,
        "potion": potion_type,
        "cost": p["cost"],
        "healed": p["amount"],
        "new_value": state[p["stat"]],
        "gold_remaining": state["gold"],
    }


@app.post("/api/state/update")
async def update_state_field(body: dict):
    """Update specific state fields (name only for now)."""
    allowed = {"name"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        return JSONResponse(status_code=400, content={"error": "no valid fields"})
    name = updates.get("name", "")
    if name and (len(name) < 1 or len(name) > 30):
        return JSONResponse(status_code=400, content={"error": "name must be 1-30 chars"})

    async with _state_lock:
        state_path = Path.home() / ".hermes" / "quest" / "state.json"
        state = json.loads(state_path.read_text())
        state.update(updates)
        # Check if HP reached 0 -> trigger reflection letter
        if state.get("hp", 0) <= 0:
            state["reflection_letter_pending"] = True
        state_path.write_text(json.dumps(state, indent=2))
    await upsert_state(state)
    await manager.broadcast({"type": "state", "data": state})
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)

