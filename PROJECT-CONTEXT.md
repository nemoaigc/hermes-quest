# Hermes Quest — Project Context

## What is this?

A self-evolving RPG system built on [Hermes Agent](https://github.com/NousResearch/hermes-agent). The AI agent learns skills, completes quests, and levels up — visualized as a pixel-art RPG dashboard. User feedback flows back to the agent to guide future learning direction.

## Architecture

```
Frontend (React + Vite)     →  Backend (FastAPI :8420)  →  Hermes Agent Runtime
src/panels/*.tsx                server/main.py              ~/.hermes/skills/quest/SKILL.md
src/store.ts (Zustand)          server/npc_chat.py          ~/.hermes/quest/*.json
src/websocket.ts                server/skill_classify.py    Cron: every 4h evolution cycle
                                server/watcher.py           ~/.hermes/quest/feedback-digest.json
```

### Feedback Loop (NEW)

```
User 👍/👎  →  /api/feedback  →  MP ±15  +  events.jsonl  +  feedback-digest.json
                                                                     ↓
Agent cycle  →  SKILL.md reads feedback-digest  →  adjusts training direction
       ↓
  Writes cycle_phase events (reflect/plan/execute/report)
       ↓
  watcher.py detects  →  WS broadcast cycle_progress  →  Frontend progress indicator
```

### Key Files (Agent Integration)

| File | Location | Purpose |
|------|----------|---------|
| `state.json` | `~/.hermes/quest/` | Character stats (HP/MP/XP/Gold/Level) |
| `events.jsonl` | `~/.hermes/quest/` | Event stream (agent appends, dashboard watches) |
| `knowledge-map.json` | `~/.hermes/quest/` | Workflows, mastery, skill assignments |
| `quests.json` | `~/.hermes/quest/` | Quest tracking |
| `feedback-digest.json` | `~/.hermes/quest/` | Aggregated user feedback for agent consumption |
| `SKILL.md` | `~/.hermes/skills/quest/` | Quest skill prompt (sync via `POST /api/skill/quest/sync`) |
| `templates/quest-skill.md` | project repo | SKILL.md source template |

## Live Server

- Dashboard: http://118.196.105.22:8420
- API: http://118.196.105.22:8420/api/state
- SSH: `ssh -i nemo.pem root@118.196.105.22`

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/state | Character stats (HP/MP/XP/Gold/Level) |
| GET | /api/sites | 6 map sites (user-definable domains) |
| GET | /api/map | Knowledge map with workflows + recommended quests |
| GET | /api/skills | All installed skills (44+) |
| GET | /api/quest/active | Active quests |
| GET | /api/quests | All quests (active/completed/cancelled/failed) |
| GET | /api/events | Chronicle event log |
| GET | /api/bag/items | Inventory items |
| GET | /api/tavern/ambient | NPC group chat messages |
| GET | /api/rumors/feed | X/Twitter rumors feed |
| GET | /api/hub/search?q= | Hub skills for install |
| GET | /api/cycle/status | Cycle running status |
| GET | /api/feedback/digest | Feedback digest (aggregated user feedback) |
| POST | /api/npc/chat | NPC dialogue (npc: guild_master/cartographer/quartermaster/bartender/sage) |
| POST | /api/quest/create | Create quest (FREE) |
| POST | /api/quest/accept | Accept recommended quest |
| POST | /api/quest/cancel | Cancel quest |
| POST | /api/quest/fail | Fail quest (HP-15, MP-10) |
| POST | /api/hub/install | Install skill (300G) |
| POST | /api/potion/use | Use potion (hp_potion:200G, mp_potion:150G) |
| POST | /api/sites/define | Define a fog site |
| POST | /api/sites/rename | Rename a site |
| POST | /api/sites/delete | Delete a site |
| POST | /api/feedback | Thumbs up/down on events (updates digest + MP) |
| POST | /api/cycle/start | Trigger evolution cycle |
| POST | /api/state/update | Update character name |
| POST | /api/skill/quest/sync | Sync SKILL.md template to Hermes |

Auth: POST requests need `-H 'Referer: http://118.196.105.22:8420/'` for same-origin bypass.

## Frontend Structure

```
src/
├── panels/          # 18 panel components (split from monolithic CenterTabs)
├── components/      # 7 shared components (RpgButton, ErrorBoundary, etc.)
├── constants/       # theme.ts, api.ts, storage.ts, npc.ts
├── store.ts         # Zustand state management (+ feedbackDigest, cycleProgress)
├── websocket.ts     # WS connection with exponential backoff + cycle_progress handler
├── api.ts           # 20+ API functions
└── types.ts         # TypeScript types (+ FeedbackDigest, CyclePhase, CycleProgress)
```

## Key Features

1. **Custom Sites**: Click fog "?" → name it → workflow created → skills classified by LLM
2. **NPC Chat**: 5 NPCs (Lyra/Aldric/Kael/Gus/Orin), LLM-powered, multi-turn, Gus searches X
3. **Quest System**: Accept from bulletin / create custom / cancel / fail (from chronicle 👎)
4. **Skill Shop**: Browse hub → install (300G) → appears in SKILLS panel
5. **Potions**: HP (200G) / MP (150G) in SHOP bottom
6. **Evolution Cycle**: MAP → START CYCLE → agent trains autonomously (4-phase progress visible)
7. **Chronicle Feedback**: 👍/👎 updates MP + aggregates to feedback-digest.json → guides next cycle
8. **Bag/Inventory**: View file contents of collected items
9. **Cycle Observability**: Real-time phase progress (REFLECT → PLAN → EXECUTE → REPORT) in MAP panel
10. **Feedback Digest**: Structured agent guidance based on accumulated user preferences

## Game Balance (config.py GAME_BALANCE)

- HP: 50 + level×10, fail penalty: -15
- MP: 100 fixed, feedback: ±15, decay: -2/day after 1 day idle
- XP: level×100 to next level
- Gold: quest create FREE, retry 50G, refresh 50G, potion 150-200G, skill 300G
- Daily bonus: +100G every 24h

## Known Working State

- Level 10, 49+ skills, 6 sites, 12 completed quests
- All 40+ API endpoints return correct responses
- NPC chat works with real LLM (gpt-5.4)
- TypeScript: 0 errors, Vite build: clean
- Zero Hermes source modifications
- Feedback digest aggregation active
- Cycle phase progress tracking active
