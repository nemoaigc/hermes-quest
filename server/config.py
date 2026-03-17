"""Paths and constants for Hermes Quest backend."""
from pathlib import Path
import os
import shutil

HERMES_HOME = Path.home() / ".hermes"
QUEST_DIR = HERMES_HOME / "quest"
EVENTS_FILE = QUEST_DIR / "events.jsonl"
STATE_FILE = QUEST_DIR / "state.json"
MAP_FILE = QUEST_DIR / "knowledge-map.json"
QUESTS_V2_FILE = QUEST_DIR / "quests.json"
QUESTS_PENDING_FILE = QUEST_DIR / "quests-pending.json"
HUB_RECOMMENDATIONS_FILE = QUEST_DIR / "hub-recommendations.json"
COMPLETIONS_DIR = QUEST_DIR / "completions"
ACCEPTED_REC_IDS_FILE = QUEST_DIR / "accepted_rec_ids.json"
BAG_FILE = QUEST_DIR / "bag.json"
CYCLE_LOCK_FILE = QUEST_DIR / "cycle.lock"
REFLECTION_LETTER_FILE = QUEST_DIR / "reflection-letter.md"
TAVERN_CACHE_FILE = QUEST_DIR / "tavern-ambient.json"
SITES_FILE = QUEST_DIR / "sites.json"
FEEDBACK_DIGEST_FILE = QUEST_DIR / "feedback-digest.json"
QUEST_SKILL_DIR = HERMES_HOME / "skills" / "quest"
SKILLS_DIR = HERMES_HOME / "skills"
DB_PATH = QUEST_DIR / "quest.db"
HERMES_AGENT_DIR = Path(
    os.environ.get("QUEST_HERMES_AGENT_DIR", str(HERMES_HOME / "hermes-agent"))
).expanduser()
HERMES_AGENT_PYTHON = Path(
    os.environ.get("QUEST_HERMES_PYTHON", str(HERMES_AGENT_DIR / "venv" / "bin" / "python"))
).expanduser()
HERMES_AGENT_SITE_PACKAGES_GLOB = str(HERMES_AGENT_DIR / "venv" / "lib" / "python*" / "site-packages")
TWITTER_CLI = os.environ.get("QUEST_TWITTER_CLI") or shutil.which("twitter") or ""
QUEST_CYCLE_PROMPT = os.environ.get("QUEST_CYCLE_PROMPT", "Run quest evolution cycle")

PORT = int(os.environ.get("QUEST_PORT", "8420"))
HOST = os.environ.get("QUEST_HOST", "0.0.0.0")
INTERNAL_API_ORIGIN = os.environ.get("QUEST_INTERNAL_API_ORIGIN", f"http://127.0.0.1:{PORT}")

GAME_BALANCE = {
    "hp_potion_cost": 200,
    "hp_potion_heal": 20,
    "mp_potion_cost": 150,
    "mp_potion_heal": 20,
    "refresh_cost": 50,
    "quest_create_cost": 0,
    "quest_retry_cost": 50,
    "skill_install_cost": 300,
    "feedback_mp_delta": 15,
    "xp_per_level": 100,
    "hp_base": 50,
    "hp_per_level": 10,
    "mp_max": 100,
    "levelup_mp_restore": 30,
    "mp_decay_rate": 2,
    "mp_decay_grace_days": 1,
    "reward_C": {"gold_base": 100, "gold_per_level": 15, "xp_base": 100, "xp_per_level": 25},
    "reward_B": {"gold_base": 150, "gold_per_level": 20, "xp_base": 150, "xp_per_level": 30},
    "reward_A": {"gold_base": 200, "gold_per_level": 30, "xp_base": 200, "xp_per_level": 50},
    "default_reward_xp": 100,
    "default_reward_gold": 50,
    "default_create_reward_xp": 300,
    "default_create_reward_gold": 200,
    "reflection_hp_recovery_ratio": 0.2,
    "cycle_lock_timeout": 1800,
    "tavern_gen_timeout": 60,
    "fail_hp_penalty": 15,
    "fail_mp_penalty": 10,
    "weak_mastery_threshold": 0.5,
    "rank_c_mastery_threshold": 15,
}

MODEL = os.environ.get("QUEST_MODEL", "gpt-5.4")
NPC_MODEL = os.environ.get("QUEST_NPC_MODEL", "gpt-5.1-codex-mini")
PROXY_URL = (
    os.environ.get("QUEST_PROXY_URL")
    or os.environ.get("HTTP_PROXY")
    or os.environ.get("HTTPS_PROXY")
    or "http://127.0.0.1:7890"
)
