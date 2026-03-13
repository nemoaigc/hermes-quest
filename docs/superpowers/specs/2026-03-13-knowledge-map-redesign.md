# Hermes Quest v2 — Knowledge Map & AI-Driven Architecture Redesign

## Goal

Redesign Hermes Quest from a static RPG dashboard into an AI-driven, dynamically growing knowledge visualization system. Every UI element maps to real AI self-evolution — no decorative RPG cosplay.

## Core Principles

1. **Icon > Text** — All UI elements prioritize pixel art icons, text is supplementary
2. **Data-driven, not preset** — Map, regions, quests all generated from real skill data
3. **First principles** — Every element must map to real AI capability
4. **No emoji** — Pixel art SVG icons only

---

## Architecture Overview

### Two AI Sub-Agents

**Map Agent (Knowledge Cartographer)**
- Analyzes all installed skills → generates/updates knowledge map data
- Clusters skills into regions (continents) and sub-regions
- Determines skill-to-skill relationships
- Discovers blank areas → generates exploration suggestions
- Trigger: end of each Hermes cycle (Knowledge Cartography phase, after Quest Check)
- Output: `~/.hermes/quest/knowledge-map.json`

**Quest Agent (Task Officer)**
- Validates user input (is this a real task or chat?)
- Routes: valid task → quest system, chat → NPC dialog
- Generates recommended quests (based on Map Agent's blank areas)
- Evaluates quest completion quality
- Trigger: user input submission + cycle quest-check phase

### Data Flow

```
User input → Quest Agent (validate/route)
                ↓
Hermes cycle → pick quest → execute → produce skill
                ↓
Cycle end → Map Agent → update knowledge-map.json
                ↓
Map Agent finds gaps → Quest Agent generates recommendations
                ↓
Recommendations appear on Guild bulletin board
                ↓
User accepts from bulletin / map / NPC dialog → new quest
```

### Quest-Skill Bidirectional Relationship

- Quests can produce skills (complete "Learn TDD" → gain `test-driven-development` skill)
- Skills can unlock new quests (gain `code-review` skill → "Explore CI/CD integration" quest appears)
- AI maintains this relationship network in `knowledge-map.json`

### Quest Sources (users never "submit" quests)

1. **Bulletin board** — Map Agent's exploration suggestions, posted as available quests
2. **NPC dialog** — NPC recommends a quest during conversation, user accepts
3. **Map exploration** — Click unknown region/fog area → generates exploration quest

---

## Data Model

### knowledge-map.json

```json
{
  "version": 1,
  "generated_at": "2026-03-13T12:00:00Z",
  "continents": [
    {
      "id": "software-engineering",
      "name": "Software Engineering",
      "description": "Code creation, review, and quality",
      "color": "#66BB6A",
      "position": { "x": 0.25, "y": 0.4 },
      "size": 0.8,
      "sub_regions": [
        {
          "id": "programming",
          "name": "Programming",
          "skills": ["basic-programming", "codex"],
          "mastery": 0.4
        },
        {
          "id": "code-quality",
          "name": "Code Quality",
          "skills": ["code-review", "github-pr-workflow", "requesting-code-review"],
          "mastery": 0.6
        }
      ]
    },
    {
      "id": "research",
      "name": "Research & Knowledge",
      "description": "Information gathering and analysis",
      "color": "#CE93D8",
      "position": { "x": 0.7, "y": 0.3 },
      "size": 0.5,
      "sub_regions": [...]
    }
  ],
  "connections": [
    {
      "from": "code-review",
      "to": "github-pr-workflow",
      "type": "workflow",
      "strength": 0.9
    }
  ],
  "fog_regions": [
    {
      "id": "fog-1",
      "hint": "Testing & QA",
      "position": { "x": 0.4, "y": 0.2 },
      "discovery_condition": "Acquire a testing-related skill"
    }
  ],
  "recommended_quests": [
    {
      "id": "rec-quest-explore-testing",
      "title": "Explore the Testing domain",
      "description": "Your code quality skills are strong but you lack testing capabilities",
      "region": "software-engineering",
      "rank": "B",
      "reward_gold": 150,
      "reward_xp": 200,
      "related_skills": ["test-driven-development"]
    }
  ]
}
```

**Connections:** Reference skill IDs (not continent/region IDs). At continent level, if two continents contain skills that are connected, a hand-drawn path renders between the continents. At sub-region level, connections render as ink lines between skill landmarks. Connection types: `workflow` (sequential dependency), `complementary` (enhances each other), `prerequisite` (must learn A before B).

**Continent `size`:** Relative scale factor (0.0–1.0) representing the continent's visual radius in normalized coordinate space. A continent with `size: 0.8` appears larger than `size: 0.5`. The Map Agent sets this based on skill count within the continent.

### Quest Lifecycle

```json
{
  "id": "quest-2026-03-13-abc123",
  "title": "Explore the Testing domain",
  "description": "Your code quality skills are strong but you lack testing capabilities",
  "region": "software-engineering",
  "rank": "B",
  "status": "active",
  "progress": 0.0,
  "reward_gold": 150,
  "reward_xp": 200,
  "related_skills": ["test-driven-development"],
  "accepted_at": "2026-03-13T14:00:00Z",
  "completed_at": null,
  "source": "bulletin_board"
}
```

**Status values:** `active` → `in_progress` → `completed` | `failed`
- `active`: Quest accepted, not yet started by Hermes cycle
- `in_progress`: Hermes cycle is currently working on this quest
- `completed`: Quest finished, rewards granted, skills may be produced
- `failed`: Quest abandoned or timed out

**Progress** (0.0–1.0): Updated by the Quest Agent during cycle execution. For multi-step quests, each sub-task completion increments progress. Single-step quests go directly from 0.0 to 1.0.

**Source values:** `bulletin_board` | `npc_dialog` | `map_exploration`

Quests are stored in `~/.hermes/quest/quests.json` as an array.

### Bag Item Data Model

```json
{
  "id": "completion-2026-03-13-abc123",
  "type": "research_note",
  "name": "TDD Research Notes",
  "description": "Findings from exploring test-driven development",
  "source_quest": "quest-explore-testing",
  "created_at": "2026-03-13T14:30:00Z",
  "file_path": "~/.hermes/quest/completions/2026-03-13-abc123.md",
  "icon": "scroll",
  "rarity": "common"
}
```

**Type values:** `research_note` | `training_report` | `code_snippet` | `map_fragment`
**Icon values:** `scroll` | `book` | `code` | `map` (maps 1:1 to type)
**Rarity values:** `common` | `rare` | `epic` | `legendary`

Items are discovered by scanning `~/.hermes/quest/completions/` and cycle output directories. The Map Agent tags items with type and rarity based on content analysis.

### Backend API

**`GET /api/map`**
- Returns: full `knowledge-map.json` contents
- 200: `{ "version": 1, "generated_at": "...", "continents": [...], ... }`
- 404: `{ "error": "no_map_data" }` (first run, map not yet generated)

**`POST /api/npc/chat`**
- Body:
  ```json
  {
    "npc": "guild_master | cartographer | quartermaster",
    "message": "user's message text",
    "context": {
      "active_tab": "map | guild | shop",
      "selected_bag_items": ["item-id-1"],
      "selected_region": "software-engineering"
    }
  }
  ```
- Response (200):
  ```json
  {
    "reply": "NPC dialog text...",
    "actions": [
      {
        "type": "suggest_quest",
        "quest": {
          "id": "rec-quest-suggested-123",
          "title": "...",
          "description": "...",
          "region": "software-engineering",
          "rank": "B",
          "reward_gold": 150,
          "reward_xp": 200,
          "related_skills": ["test-driven-development"]
        }
      }
    ],
    "npc_mood": "friendly"
  }
  ```
- `npc_mood` values: `friendly` | `serious` | `excited` — controls NPC portrait expression variant in frontend
- Errors: 400 `{ "error": "invalid_npc" }`, 503 `{ "error": "ai_unavailable" }`
- Quest Agent classification happens server-side: if the message looks like a task request, the response includes a `suggest_quest` action automatically.

**`POST /api/quest/accept`**
- Body: `{ "quest_id": "rec-quest-explore-testing" }` (for bulletin board / NPC suggested quests with existing ID)
- Response (200): `{ "quest_id": "quest-2026-03-13-abc123", "status": "active" }`
- Errors: 404 `{ "error": "quest_not_found" }`, 409 `{ "error": "quest_already_accepted" }`
- For map exploration quests (no existing ID): `POST /api/quest/accept` with `{ "fog_region_id": "fog-1" }` — server generates quest from fog region data.

**`GET /api/quest/active`**
- Returns: `{ "quests": [{ "id": "...", "title": "...", "status": "active", "progress": 0.5, "accepted_at": "..." }] }`

**`GET /api/bag/items`**
- Returns: `{ "items": [{ ...bag_item }] }`
- Scans completions directory and returns tagged items.

**WebSocket message types:**

```json
// map update (when knowledge-map.json changes)
{ "type": "map", "data": { "version": 1, "continents": [...], "connections": [...], "fog_regions": [...], "recommended_quests": [...] } }

// quest status change
{ "type": "quest", "data": { "quest_id": "quest-123", "status": "completed", "progress": 1.0, "reward_granted": { "gold": 150, "xp": 200, "skills": ["test-driven-development"] } } }

// new bag item
{ "type": "bag", "data": { "action": "new_item", "item": { ...bag_item_object } } }
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HERMES QUEST        Lv.2 Artificer — Novice       250G ONLINE │
├───────────┬─────────────────────────────────┬───────────────┤
│           │  [MAP]  [GUILD]  [SHOP]         │               │
│ CHARACTER │                                 │ ADVENTURE LOG │
│           │                                 │               │
│  Avatar   │    Main Content Area            │  Event 1      │
│  Stats    │    (tab-dependent)              │  Event 2      │
│  Bars     │                                 │  Event 3      │
│           │                                 │  Event 4      │
│───────────│                                 │  ...          │
│ SKILLS    │                                 │               │
│  /BAG     │─────────────────────────────────│               │
│ (sub-tab) │  [NPC Dialog Bar - fixed]       │               │
│           │  [portrait] [dialog] [input]    │               │
├───────────┴─────────────────────────────────┴───────────────┤
│  (no bottom bar)                                            │
└─────────────────────────────────────────────────────────────┘
```

### Left Panel (fixed, ~240px)

**Top: Character Status**
- Class icon (pixel art, AI-meaningful: Artificer/Scholar/Automancer/Polymath/Hivemind)
- Name, level, class, title
- STABILITY bar (was HP — agent reliability)
- ENERGY bar (was MP — API/compute budget)
- XP bar
- Stats grid: Cycles, Skills, Quests completed, Domains mastered

**Bottom: Sub-tab SKILLS / BAG**

SKILLS tab:
- Slot grid (like equipment slots), each skill is a pixel identicon
- Click to see detail (name, rarity, version, description)
- Rarity border colors: common/rare/epic/legendary

BAG tab:
- Contains real Hermes outputs: research notes, training reports, code snippets, map fragments
- Items sourced from `~/.hermes/quest/completions/` and cycle outputs
- Click item → auto-references it in NPC dialog input (not drag-and-drop)
- Click again to deselect

### Center Panel — Tab Content

**MAP tab: Knowledge Atlas**

Visual style: Parchment/aged paper (Stoneshard reference)
- Warm parchment gradient background (`#2a1f14` to `#1a140c`)
- Noise/grain texture overlay
- Vignette (dark edges)
- Compass rose decoration

Continent layer (static layout):
- Continents rendered as irregular blob shapes, size reflects skill count
- Unlocked continents: full color with domain-colored stroke
- Fog of war: dark overlay with "?" for undiscovered areas
- Hermes character sprite on current region (idle bounce animation)
- Hand-drawn style paths between connected continents (SVG bezier curves, brown stroke)
- Click continent → drill into sub-region graph view

Sub-region graph view (within a continent):
- Parchment background continues
- Skills rendered as map landmarks (small pixel art icons: towers, camps, ruins)
- Connections as ink-drawn paths between related skills
- Unknown skills shown as "?" with dashed circle
- Click skill landmark → show detail panel
- Back button to return to continent view

**GUILD tab: Adventurer's Guild**

Top section — Bulletin Board:
- Wooden board visual style
- Pinned quest cards (from Map Agent recommendations + milestones)
- Each card: pixel icon + title + rank + reward preview
- Click card → accept quest (or "Tell me more" via NPC)
- Achievement badges displayed here too (level ups, domain discoveries)

Middle section — Active Quest Tracker:
- List of currently active quests with progress indicators
- Quest history (completed/failed) in collapsible section

Bottom section — NPC dialog bar (see below, this is shared across all tabs)

**SHOP tab: Skill Tavern**

Keep current tavern design (already well-designed):
- Shopkeeper NPC pixel art
- Source filter tabs (official/github/clawhub/lobehub)
- Skill grid with identicon icons
- Click to select → detail panel → ACQUIRE SKILL
- Warm tavern color scheme

### Center Panel — NPC Dialog Bar (fixed at bottom, shared across all tabs)

Persistent RPG dialog box at the bottom of the center area:
- Left: NPC portrait selection (3 pixel art portraits side by side)
- Center: Dialog text area with typewriter effect
- Right/below: Choice buttons when applicable
- Bottom: Text input field + SEND button

**Three NPCs:**

| NPC | Name | Role | Visual |
|-----|------|------|--------|
| Guild Master | Guild Master | General chat, advice, quest recommendations | Warm colors, authority figure |
| Cartographer | Cartographer | Map/region info, exploration suggestions | Map tools, scholarly look |
| Quartermaster | Quartermaster | Skill info, shop recommendations | Apron, merchant look |

Auto-switch NPC based on context:
- On MAP tab → Cartographer speaks
- On SHOP tab → Quartermaster speaks
- On GUILD tab → Guild Master speaks
- User can manually click portrait to switch anytime

NPC dialog is AI-powered (realtime, not waiting for cycle):
- Lightweight API call to generate response
- NPC personality injected via system prompt
- Can suggest quests (appear as choice buttons: "Accept Quest" / "Tell me more")
- Can reference bag items when user clicks an item before chatting

### Right Panel (fixed, ~280px)

**Adventure Log**
- Realtime event stream (all cycle events)
- Each event: pixel icon + narrative text + timestamp
- Milestone events highlighted (level up, new domain, quest complete)
- Reflect events expandable to show weakness analysis
- Auto-scrolls on new events

---

## Quest Skill Modifications

### New Phase: Knowledge Cartography

Added to the Quest Skill SKILL.md cycle, after Quest Check and before Report (as the second-to-last phase before cycle_end):

```
Phase: Knowledge Cartography

1. Read all installed skills: list ~/.hermes/skills/*/SKILL.md
2. Read current knowledge-map.json (if exists)
3. Call AI to analyze and generate/update map:
   - Input: all skill names, descriptions, tags, categories
   - Input: current map state (for incremental update)
   - Output: updated continents, sub-regions, connections, fog regions, recommended quests
4. Write updated knowledge-map.json
5. If new continents/sub-regions discovered:
   - Write region_unlock event
   - Add recommended quests to bulletin board
6. Write map_update event:
   {"ts":"...", "type":"map_update", "region":"...", "data":{"new_regions":[], "new_connections":[]}}
```

**Map Agent AI Prompt Strategy:**

The Map Agent receives a system prompt instructing it to act as a Knowledge Cartographer. Key elements:
- **Input**: JSON array of all installed skill metadata (name, description, tags, category from each SKILL.md)
- **Existing map**: Current `knowledge-map.json` (or empty state for first run)
- **Instructions**: Cluster skills into logical domains (continents), identify sub-groups within domains (sub-regions), detect relationships between skills (connections), identify knowledge gaps (fog regions), and suggest quests to fill gaps (recommended quests)
- **Constraints**: Incremental updates only (don't reorganize existing continents unless skills are removed), continent positions use normalized 0-1 coordinates, skill IDs must match installed skill directory names
- **Model**: Uses the Hermes agent's configured model (currently gpt-5.4 via OpenRouter or Codex)

### Quest Gatekeeper Integration

Modify `/api/npc/chat` endpoint:
- When user sends a message, Quest Agent first classifies: task or chat?
- If task: validate, create quest, NPC announces it ("I've posted your request on the bulletin board")
- If chat: route to NPC AI for conversational response

**Quest Agent AI Prompt Strategy:**

The Quest Agent receives a two-step system prompt:
1. **Classification step**: Given the user message and context (active tab, selected items), classify as `task` or `chat`. Simple heuristic examples: "help me learn X" = task, "what's that region?" = chat, "hello" = chat, "I want to build a REST API" = task.
2. **Response step**:
   - If `task`: Generate a quest object (title, description, rank, estimated rewards, related skills) and wrap the NPC response with a quest suggestion action.
   - If `chat`: Generate an in-character NPC response based on the NPC's personality profile.

**NPC Personality Profiles** (injected as system prompt):
- **Guild Master**: Warm, encouraging, speaks like a veteran adventurer. Focuses on motivation and big-picture guidance.
- **Cartographer**: Scholarly, precise, speaks in geographical metaphors. Focuses on knowledge domains and exploration.
- **Quartermaster**: Practical, merchant-like, speaks about tools and equipment. Focuses on skill acquisition and utility.

---

## Server Changes

### New files
- `~/.hermes/quest/knowledge-map.json` — Map Agent output
- Backend: add NPC chat endpoint, map API endpoint

### Modified files
- Quest Skill `SKILL.md` — add Knowledge Cartography phase
- `main.py` — add `/api/map`, `/api/npc/chat`, `/api/quest/accept`, `/api/quest/active`, `/api/bag/items` endpoints
- `watcher.py` — watch `knowledge-map.json` for changes, push via WebSocket
- `ws_manager.py` — add `'map'`, `'quest'`, `'bag'` message types

### state.json changes
- Class names: warrior→artificer, etc. (done in leveling.md, frontend display mapping exists but store.ts still uses old field names internally)
- Remove: `total_boss_kills` from store.ts (replaced by domains mastered = regions_cleared.length)
- Rename in store.ts: `hp`/`hp_max` → `stability`/`stability_max`, `mp`/`mp_max` → `energy`/`energy_max`
- Replace store.ts `Region` interface with new continent/sub-region model matching knowledge-map.json
- Titles: Novice/Apprentice/Specialist/Expert/Grandmaster (done in leveling.md)

---

## Frontend Changes

### New components
- `KnowledgeMap.tsx` — Parchment continent map (replaces WorldMap.tsx)
- `SubRegionGraph.tsx` — Drill-down graph view within a continent
- `NPCDialogBar.tsx` — Fixed dialog bar with 3 NPC portraits
- `BulletinBoard.tsx` — Quest recommendation cards in Guild
- `QuestTracker.tsx` — Active/history quest list in Guild
- `BagPanel.tsx` — Bag sub-tab showing real outputs

### Modified components
- `CenterTabs.tsx` — 3 tabs (MAP/GUILD/SHOP) + fixed NPC bar at bottom
- `CharacterPanel.tsx` — already updated (Stability/Energy/Mastered)
- `SkillInventory.tsx` — rename to skill slot style, move to left panel sub-tab
- `TopBar.tsx` — already updated (Artificer class name)
- `Shop.tsx` — keep current tavern design, minor tweaks
- `store.ts` — add map state, NPC chat state

### Removed components
- `WorldMap.tsx` — replaced by KnowledgeMap
- `ReflectionBar.tsx` — reflection integrated into adventure log
- `QuestBoard.tsx` — replaced by BulletinBoard + QuestTracker in Guild

---

## Visual Style

**Overall: Dark fantasy parchment pixel art**
- Background: warm dark tones (`#1a140c`, `#0d0a08`)
- Borders: wood/leather (`#5c3a1e`, `#3a2a1a`)
- Text: parchment gold (`#f0e68c`, `#c8a87a`)
- Pixel font for headers, monospace for body
- All icons: 16x16 pixel art SVG, `imageRendering: pixelated`

**Map specific:**
- Parchment gradient with noise texture
- Dark vignette edges
- Hand-drawn style bezier paths
- Fog of war: dark semi-transparent overlay
- Compass rose decoration
- Stoneshard-inspired tile aesthetic

**NPC Dialog:**
- Wood-framed dialog box
- Typewriter text effect (existing DialogBox component)
- Pixel art NPC portraits (32x32)
- Choice buttons with hover glow

---

## Empty & Degraded States

- **No map data yet** (first run, `/api/map` returns 404): KnowledgeMap shows blank parchment with compass rose and a "Begin Your Journey" prompt. Guild bulletin board shows a single starter quest.
- **Backend unreachable**: All panels show last cached state. NPC dialog shows "The guild is quiet..." with a retry button. Adventure log shows a "connection lost" event.
- **No quests active**: Quest tracker section in Guild shows "No active quests. Visit the bulletin board."
- **No bag items**: Bag tab shows empty slots with "Complete quests to discover items."
- **All endpoints are localhost-only** (dashboard served from the Hermes Quest backend on the same server). No authentication required.

## Implementation Priority

> **Note:** Priority 1 requires changes to the Hermes agent's Quest Skill (`~/.hermes/skills/quest/SKILL.md`), which is a separate codebase from this dashboard. All other priorities are within the dashboard project.

1. Knowledge map data model + Map Agent integration (Quest Skill Knowledge Cartography phase)
2. Backend APIs (`/api/map`, `/api/npc/chat`, `/api/quest/*`, `/api/bag/*`)
3. Frontend: store.ts migration (rename hp/mp fields, replace Region interface, add map/npc/quest state)
4. Frontend: KnowledgeMap parchment continent view
5. Frontend: NPCDialogBar with 3 NPCs
6. Frontend: Guild tab (BulletinBoard + QuestTracker)
7. Frontend: SubRegionGraph drill-down
8. Frontend: BagPanel
9. Polish: animations, transitions, hover effects
