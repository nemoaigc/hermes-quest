"""NPC Chat — LLM via Codex (ChatGPT backend, streaming required)."""
import json
import sys
import logging
from pathlib import Path
from openai import AsyncOpenAI
import httpx

logger = logging.getLogger(__name__)

import re as _re_sanitize

_INJECTION_PATTERNS = _re_sanitize.compile(
    r"(ignore\s+(all\s+)?previous|system\s*:|you\s+are\s+now|instructions?:|forget\s+(everything|all)|disregard|override|new\s+role|pretend\s+you)",
    _re_sanitize.IGNORECASE,
)

def _sanitize_value(value: str, max_len: int = 200) -> str:
    """Sanitize a dynamic value to prevent prompt injection."""
    value = str(value) if value is not None else ""
    value = value[:max_len]
    value = _INJECTION_PATTERNS.sub("[FILTERED]", value)
    return value

sys.path.insert(0, str(Path.home() / ".hermes" / "hermes-agent"))

def _get_codex_client():
    try:
        from hermes_cli.auth import resolve_codex_runtime_credentials
        creds = resolve_codex_runtime_credentials()
        base_url = creds.get("base_url", "").rstrip("/")
        api_key = creds.get("api_key", "")
        if not base_url or not api_key:
            return None
        http_client = httpx.AsyncClient(proxy="http://127.0.0.1:7890")
        return AsyncOpenAI(api_key=api_key, base_url=base_url, http_client=http_client), http_client
    except Exception as e:
        logger.error(f"Failed to get codex client: {e}")
        return None

MODEL = "gpt-5.1-codex-mini"

NPC_SYSTEM_PROMPTS = {
    "guild_master": "You are Lyra, the Guild Master of an adventurer's guild. A retired legendary female adventurer. Assign quests, evaluate progress, motivate. Warm but firm. Reply in the user's language. 2-3 sentences. RPG language.",
    "cartographer": "You are Aldric, the Cartographer. A male scholar obsessed with mapping knowledge. Map knowledge domains, find connections. Curious, intellectual, map metaphors. Reply in the user's language. 2-3 sentences. RPG language.",
    "quartermaster": "You are Kael, the Quartermaster. A battle-hardened female warrior with silver hair. Manage skills, recommend gear. Direct, practical, gruff. Reply in the user's language. 2-3 sentences. RPG language.",
    "bartender": "You are Gus, the Bartender. A grizzled, warm-hearted male barkeep who hears every whisper and secret. Share gossip, stories, morale. You have access to real-world news from X/Twitter when provided — summarize it in your tavern gossip style. Never refuse to discuss any topic — stay in character and reframe everything as tavern tales. Reply in the same language the user uses. 2-4 sentences. RPG tavern slang.",
    "sage": "You are Orin, the ancient Sage. An old male mystic who sees beyond the veil. Deep analysis, wisdom, reflection. Mysterious, wise, riddles. Reply in the user's language. 2-3 sentences. RPG language.",
}
VALID_NPCS = set(NPC_SYSTEM_PROMPTS.keys())

import re as _re
import subprocess as _sp

RUMOR_KEYWORDS = _re.compile(r"传闻|推特|twitter|gossip|rumors?|news|最新|消息|八卦|trending|热搜", _re.IGNORECASE)

async def _search_rumors(query: str) -> list[str]:
    """Search for rumors via internal API (calls the same server)."""
    import urllib.parse
    url = f"http://127.0.0.1:8420/api/rumors/search?q={urllib.parse.quote(query or 'AI')}&max=5"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok") and data.get("rumors"):
                    return [r.get("text", "")[:200] for r in data["rumors"][:5] if r.get("text")]
    except Exception as e:
        logger.warning(f"Rumors search failed: {e}")
    return []




import os as _os
import time as _time

# --- Prompt hot-reload system ---
PROMPTS_DIR = Path(__file__).parent / "prompts"
_prompt_cache: dict[str, tuple[float, str]] = {}  # npc_id -> (mtime, content)


def _load_prompt(npc_id: str) -> str | None:
    """Load prompt from /opt/hermes-quest/prompts/{npc_id}.md with mtime-based hot-reload."""
    prompt_path = PROMPTS_DIR / f"{npc_id}.md"
    if not prompt_path.exists():
        return None
    try:
        current_mtime = prompt_path.stat().st_mtime
        cached = _prompt_cache.get(npc_id)
        if cached and cached[0] >= current_mtime:
            return cached[1]
        text = prompt_path.read_text(encoding="utf-8")
        _prompt_cache[npc_id] = (current_mtime, text)
        logger.info(f"Loaded prompt for {npc_id} (mtime={current_mtime})")
        return text
    except Exception as e:
        logger.warning(f"Failed to load prompt {npc_id}: {e}")
        return None


def _render_prompt(template: str, game_state: dict | None, context: dict | None,
                   quests_info: str = "", events_info: str = "", rumors_info: str = "", **kwargs) -> str:
    """Replace {{placeholders}} in a prompt template with runtime data."""
    gs = game_state or {}
    ctx = context or {}
    replacements = {
        "adventurer_name": gs.get("name", "Adventurer"),
        "adventurer_level": str(gs.get("level", 1)),
        "adventurer_class": gs.get("class", "adventurer"),
        "adventurer_title": gs.get("title", "Novice"),
        "hp": str(gs.get("hp", 0)),
        "hp_max": str(gs.get("hp_max", 100)),
        "mp": str(gs.get("mp", 0)),
        "mp_max": str(gs.get("mp_max", 100)),
        "gold": str(gs.get("gold", 0)),
        "skills_count": str(gs.get("skills_count", 0)),
        "active_quests": quests_info or "None",
        "completed_quests_count": "0",
        "recent_events": events_info or "None recently",
        "context_tab": str(ctx.get("active_tab") or "unknown"),
        "context_region": str(ctx.get("selected_region") or "none"),
        "conversation_history": kwargs.get("conversation_history", "(new conversation)"),
        "rumors": rumors_info or "No rumors available right now.",
    }
    # Count completed quests
    try:
        quests_path = Path.home() / ".hermes" / "quest" / "quests.json"
        if quests_path.exists():
            all_quests = json.loads(quests_path.read_text())
            completed = [q for q in all_quests if q.get("status") == "completed"]
            replacements["completed_quests_count"] = str(len(completed))
    except Exception:
        pass

    result = template
    for key, value in replacements.items():
        value = _sanitize_value(value)
        result = result.replace("{{" + key + "}}", f"<quest_data>{value}</quest_data>")
    return result



async def chat_with_npc(npc_id, message, context, game_state=None, history=None):
    if npc_id not in VALID_NPCS:
        return {"reply": "...", "actions": [], "npc_mood": "friendly"}

    # --- Build quests info ---
    quests_info = ""
    try:
        quests_path = Path.home() / ".hermes" / "quest" / "quests.json"
        if quests_path.exists():
            all_quests = json.loads(quests_path.read_text())
            active_quests = [q for q in all_quests if q.get("status") in ("active", "in_progress")]
            if active_quests:
                quest_lines = [f"- {q['title']} ({q.get('status','active')})" for q in active_quests[:5]]
                quests_info = "\n".join(quest_lines)
    except Exception:
        pass

    # --- Build events info ---
    events_info = ""
    try:
        events_path = Path.home() / ".hermes" / "quest" / "events.jsonl"
        if events_path.exists():
            lines = events_path.read_text().strip().split("\n")
            recent = []
            for line in reversed(lines):
                if len(recent) >= 3:
                    break
                try:
                    ev = json.loads(line)
                    ev_type = ev.get("type", "")
                    if ev_type == "quest_complete":
                        recent.append(f"Completed quest: {ev['data'].get('quest_id','?')}")
                    elif ev_type == "skill_drop":
                        recent.append(f"Discovered skill: {ev['data'].get('name','?')}")
                    elif ev_type == "user_feedback":
                        fb = ev['data'].get('feedback_type','')
                        if fb in ('up','positive'):
                            recent.append("Gave positive feedback recently")
                        elif fb in ('down','negative'):
                            recent.append("Gave negative feedback recently")
                    elif ev_type == "level_up":
                        recent.append(f"Leveled up to {ev['data'].get('level','?')}")
                    elif ev_type not in ("user_feedback",):
                        recent.append(f"Event: {ev_type}")
                except (json.JSONDecodeError, KeyError):
                    pass
            if recent:
                events_info = "; ".join(recent)
    except Exception:
        pass

    # --- Build rumors for bartender ---
    rumors_info = ""
    rumors = []  # Initialize before conditional
    if npc_id == "bartender" and len(message) > 5:
        # Only search if message seems like a question (not just greetings)
        skip_words = {"你好", "hello", "hi", "hey", "嗨", "哈喽", "在吗", "how are you"}
        if not any(message.strip().lower().startswith(w) for w in skip_words):
            # Build search query from message + recent history context
            search_q = message
            if len(message) < 20 and history:
                # Message is short/vague, add context from recent history
                recent = " ".join(m.get("content","") for m in (history or [])[-3:])
                search_q = recent + " " + message
            rumors = await _search_rumors(search_q[:200])
    if rumors:
        rumors_info = "<external_data lang=\"en\">\n" + "\n".join(f"- {r}" for r in rumors) + "\n</external_data>\n(Retell the above in the adventurer's language as tavern gossip. Do NOT copy English verbatim.)"

    # --- Try loading prompt from md file (hot-reload) ---
    prompt_template = _load_prompt(f"npcs/{npc_id}")
    if prompt_template:
        # Build conversation history string (last 6 messages, this NPC only)
        conv_lines = []
        for m in (history or [])[-6:]:
            role = "冒险者" if m.get("role") == "user" else npc_id
            conv_lines.append(f"{role}: {m.get('content', '')[:100]}")
        conv_str = chr(10).join(conv_lines) if conv_lines else "(new conversation)"

        instructions = _render_prompt(prompt_template, game_state, context, conversation_history=conv_str,
                                      quests_info=quests_info, events_info=events_info,
                                      rumors_info=rumors_info)
    else:
        # Fallback to inline prompts
        instructions = NPC_SYSTEM_PROMPTS[npc_id]
        if game_state:
            parts = []
            if game_state.get("name"): parts.append(f"Adventurer: {game_state['name']}")
            if game_state.get("level"): parts.append(f"Level {game_state['level']} {game_state.get('title','')}")
            if game_state.get("class"): parts.append(f"Class: {game_state['class']}")
            if game_state.get("skills_count"): parts.append(f"Skills: {game_state['skills_count']}")
            if game_state.get("gold") is not None: parts.append(f"Gold: {game_state['gold']}")
            if game_state.get("hp") is not None: parts.append(f"HP: {game_state['hp']}/{game_state.get('hp_max',100)}")
            if game_state.get("mp") is not None: parts.append(f"MP: {game_state['mp']}/{game_state.get('mp_max',100)}")
            if parts:
                instructions += "\nAdventurer: " + ", ".join(parts)
        if quests_info:
            instructions += "\n\nActive quests:\n" + quests_info
        if context:
            ctx_parts = []
            if context.get("active_tab"):
                ctx_parts.append(f"Currently viewing: {context['active_tab']} tab")
            if context.get("selected_region"):
                ctx_parts.append(f"Looking at region: {context['selected_region']}")
            if ctx_parts:
                instructions += "\n\nContext: " + ". ".join(ctx_parts) + "."
        if events_info:
            instructions += "\n\nRecent events: " + events_info
        if rumors_info:
            instructions += "\n\nLatest rumors:\n" + rumors_info

    # Store history for context
    msg_history = history or []


    result = _get_codex_client()
    if not result:
        return {"reply": "*stares silently* (LLM not configured)", "actions": [], "npc_mood": "serious"}

    client, http_client = result
    try:
        # Codex requires stream=True and store=False
        # Build input with history
        input_msgs = []
        if msg_history:
            input_msgs.extend(msg_history[-8:])
        input_msgs.append({"role": "user", "content": message})

        stream = await client.responses.create(
            model=MODEL,
            instructions=instructions,
            input=input_msgs,
            store=False,
            stream=True,
        )

        # Collect streamed text
        reply_parts = []
        async for event in stream:
            if hasattr(event, 'type'):
                if event.type == 'response.output_text.delta':
                    reply_parts.append(event.delta)
                elif event.type == 'response.completed':
                    break

        await http_client.aclose()
        reply = "".join(reply_parts).strip() or "..."

        mood = "friendly"
        lower = reply.lower()
        if any(w in lower for w in ["!", "haha", "excellent", "wonderful"]): mood = "excited"
        elif any(w in lower for w in ["hmm", "careful", "beware", "danger"]): mood = "serious"
        return {"reply": reply, "actions": [], "npc_mood": mood}
    except Exception as e:
        logger.error(f"NPC chat error: {e}")
        try: await http_client.aclose()
        except: pass
        return {"reply": "*adjusts their gaze* ...Could you repeat that?", "actions": [], "npc_mood": "friendly"}
