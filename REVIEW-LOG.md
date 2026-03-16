# Hermes Quest Dashboard — Review Log

## Session 5 — 2026-03-16 Continuous Review

### Round 1 (3 fixes)
| Expert | Issue | Fix |
|--------|-------|-----|
| Agent Dev | CenterTabs used `useStore.getState()` in render path for sites — not reactive | Extracted `MapBottomContent` component using `useStore()` hook |
| Agent Dev | NPC chat didn't send `game_state` from frontend | Added game_state (name/level/class/HP/MP/gold) to NPC chat request body |
| Algorithm | `understanding_update` formatter multiplied 0-100 value by 100 again (1880%) | Fixed to detect 0-100 vs 0-1 range |

Also fixed: `skills_count` in server state updated from 3 to 4 (actual filesystem count).

### Round 2 (1 fix)
| Expert | Issue | Fix |
|--------|-------|-----|
| Product | Completed quests (10) invisible — no DONE tab in guild ledger | Added DONE tab between ACTIVE and CANCELED with cyan accent, completed_at date |

### Round 3 (1 fix)
| Expert | Issue | Fix |
|--------|-------|-----|
| Test Dev | Failing test: `AgentState uses stability/energy instead of hp/mp` | Updated test to expect v2 compat hp/mp fields from stability/energy mapping |

All 14 tests pass. TypeScript: 0 errors.

### Round 4 (2 fixes)
| Expert | Issue | Fix |
|--------|-------|-----|
| Agent Dev | WebSocket didn't handle `skills_reclassified` broadcast from backend | Added handler to refresh skills + sites on reclassification |
| Agent Dev | Sites only fetched when MAP tab mounted — empty on other tabs | Added sites to `fetchInitialData()` for eager loading |

### Round 5 (1 CRITICAL fix)
| Expert | Issue | Fix |
|--------|-------|-----|
| Agent Dev | **CRITICAL**: ReflectionLetter `handleAcknowledge()` called `setState({reflection_letter_pending: false})` which REPLACED the entire agent state (HP/MP/gold/level all wiped to undefined) | Spread `currentState` before overriding the pending flag |

### Round 6 (1 fix)
| Expert | Issue | Fix |
|--------|-------|-----|
| Test Dev | 10 event types had no pixel art icons — silently fell back to cycle_start | Added unique SVG icons for user_feedback, positive/correction signals, understanding, reflection, workflow_discover, mp_change, fog events |

### Round 7 (2 fixes)
| Expert | Issue | Fix |
|--------|-------|-----|
| Agent Dev | Font preload `<link>` was in `<body>` instead of `<head>` | Moved to `<head>` for faster font loading |
| Product | Skill FORGET silently failed with no user feedback | Added RPG-themed error message: "The skill resists being forgotten..." |

### Round 8 (4 fixes)
| Expert | Issue | Fix |
|--------|-------|-----|
| Agent Dev | `usePotion()` function name triggered ESLint react-hooks/rules-of-hooks | Renamed to `drinkPotion()` — it's an API call, not a React hook |
| Agent Dev | Unused `CAT_TO_CONTINENT` constant in icon-registry | Removed dead code |
| Agent Dev | Unused `state` subscription in App.tsx and MapBottomInfo.tsx | Removed — saves unnecessary Zustand re-renders |
| Agent Dev | Unused `category` parameter in `getSkillIconPath` | Prefixed with underscore |

ESLint errors: 36 -> 32 (remaining are intentional patterns: refs-in-render, no-explicit-any).

---

# Session 4 Review Log (historical)

> 2026-03-16 00:30 — 09:50 (9+ hours, 52 commits)

---

## Session Overview

Session 4 was the most productive single session in the project. Starting from the tavern redesign and ending with a fully polished, deployed dashboard with custom Site system, skill classification, and 8+ rounds of expert review fixes.

**Total commits this session:** 52
**Total project commits:** 85
**Time span:** ~9 hours continuous

---

## Commit Timeline

### Phase 1: Tavern & NPC Overhaul (22:00 — 01:44)

| Commit | Time | Description |
|--------|------|-------------|
| `b234e78` | 22:00 | Full system overhaul — session 3 merge |
| `e428da7` | 23:20 | Tavern redesign — scene area chatter/rumors + bottom NPC gallery |
| `91e253d` | 00:35 | NPC dialogue system — 16 issues from 8-angle review |
| `d68fce2` | 00:47 | Avatar + tavern reply + understanding fix |
| `a06b11b` | 01:19 | UI review — 9 issues + remove hardcoded NPC ID |
| `2164b9f` | 01:44 | NML prompt system + P0/P1 fixes + bulletin board + Telegram |

### Phase 2: Shop & Guild Polish (02:37 — 04:41)

| Commit | Time | Description |
|--------|------|-------------|
| `6f12a40` | 02:37 | SHOP pagination + GUILD lifecycle + NPC language (10 issues) |
| `2594380` | 03:15 | SHOP dedup + bigger fonts + GUILD quest tabs WIP |
| `61e90f9` | 03:34 | NML prompts v3 + inline quest edit + chronicle clear |
| `3bb425b` | 03:42 | Bulletin board titles + quest accept 500 + Gus search context |
| `edbe878` | 04:24 | NPC 500 error + GUILD interactions + bulletin board + SHOP dedup |
| `5f7e6be` | 04:41 | Accept removes from board + cancel stats + chat persistence + failed quests |

### Phase 3: 8 Rounds of Expert Review (05:45 — 07:07)

| Round | Commit(s) | Key Changes |
|-------|-----------|-------------|
| R1 | `a20abdb` | 15 fixes: API_URL, shop install, bag discard, feedback HP, rewards scaling |
| R2 | `c63c48a` | 18 fixes: hub install, event dedup, gold sinks, connection indicator, NPC chat clear |
| R3 | `9b4ac13` | 14 fixes: all silent catches converted to RPG-themed error messages |
| R4 | `469524c` `597cd82` | ErrorBoundary, WS exponential backoff, quest gen randomization, gold cost display |
| R5 | `9f6835e` | HP/MP potion system with pixel art icons (gold sink mechanic) |
| R6 | `0e29aa2` | Constants extraction — theme.ts, api.ts, storage.ts, npc.ts |
| R7 | `1774f44` | CenterTabs split: 1318 to 224 lines (83% reduction, 10 components extracted) |
| R8 | `54438cb` `cff7184` | Potions moved to Shop, name editing, spacing, tab colors, RETRY, cleanup |

**README:** Bilingual (EN/CN) rewrite with SVG banner, warm tavern aesthetic (`03be809` `f4043ef` `e1de7de`)

### Phase 4: Design & Features (07:15 — 08:16)

| Commit | Time | Description |
|--------|------|-------------|
| `b02986f` | 07:15 | Guild ledger tabs + NPC gallery redesign |
| `3faf5e5` | 07:26 | Bag item file viewer + API consolidation |
| `7588d9f` | 07:33 | Hotfix: acceptError scope crash + map layout 6 sites |
| `116a5ea` | 07:38 | Revert NPC gallery to original + map honeycomb layout |
| `153cbc7` | 07:41 | NPC name/title spacing + map sites shift right |
| `f307671` | 07:45 | Fog sites show ??? + character panel title line |
| `2948792` | 07:51 | Loading screen consistency + fog crash + guild tabs + cancel |
| `e6ada98` | 07:53 | Map sites shifted down 5% |
| `e44192f` | 07:56 | Guild panel refined + npc-bg compressed 6.5MB to 1MB |
| `d99cc10` | 08:05 | Shop sources add ALL option + quest accept persist fix |
| `e8c6309` | 08:06 | Shop shelf grid — equal column/row spacing |
| `1f171e4` | 08:10 | ALL source count matches deduped total |
| `7d94fd9` | 08:16 | Custom Site system — 6 slots with define/rename/delete |

### Phase 5: Site System & Sprites (08:28 — 09:48)

| Commit | Time | Description |
|--------|------|-------------|
| `49891c1` | 08:28 | Map site-to-workflow lookup + rumors search + test fixes |
| `bdfb23a` | 08:32 | Starter town unique sprite + Nous Research credit |
| `0d008df` | 08:34 | Nous Research in cyan (#00d4ff) |
| `9e59777` | 08:36 | Starter town sprite to creative-arts |
| `55e2d58` | 08:53 | Starter town to data-analytics sprite, Nous #5271FF |
| `d8d61bd` | 09:15 | Unique sprites per site — no duplicates, NML prompt wrapper |
| `7819b7e` | 09:21 | Unique star graph per site — no fallback to first workflow |
| `3de9092` | 09:28 | Site rename/delete via right-click + skill count + tab colors |
| `d778dea` | 09:31 | CANCELLED to CANCELED spelling |
| `71a1efc` | 09:32 | Character panel shows actual skills/workflows count from store |
| `2a33d1d` | 09:35 | Remove QUESTS label, keep ACTIVE without D |
| `a186d6e` | 09:41 | Batch — FAIL removed from guild, reflection LLM, UI polish |
| `aaf6aa1` | 09:48 | Full redeploy + SubRegionGraph fallback fix |

---

## Features Added This Session

### Major Features
- **Custom Site System**: 6 map slots users can define, rename (double-click), and delete (right-click). Each site gets a unique sprite and star graph. Persisted to backend.
- **NML Prompt System**: Natural Model Language prompts for all NPC interactions — v1 through v3 iterations.
- **HP/MP Potion System**: Gold-sink mechanic. HP potion 200G, MP potion 150G, with pixel art icons.
- **Quest FAIL Button**: Explicit quest failure with HP -15, MP -10 penalties.
- **Quest RETRY**: Failed quests can be retried for 50G.
- **Bag Item File Viewer**: Click bag items to view file contents inline.
- **Tavern Redesign**: Scene area with ambient chatter/rumors + bottom NPC gallery with chat/bio modes.
- **Bulletin Board**: Quest recommendations with randomization and active quest dedup.
- **Reflection Letter**: HP=0 triggers reflection letter mechanic.
- **Thumbs Feedback**: Chronicle events can be rated, affecting HP/MP.

### UI/UX Improvements
- Character name editing (inline)
- Connection status indicator (WebSocket)
- Loading screen consistency across all panels
- Fog-of-war sites show "???" instead of names
- Tab colors differentiate active panel
- Guild ledger tabs (ACTIVE/COMPLETED/FAILED)
- Shop sources with ALL option + deduped counts
- NPC gallery with 5-slot embedded panel, CHAT and bio card modes
- Map honeycomb layout with sites shifted for visual balance
- NPC background image compressed from 6.5MB to 1MB

---

## Architecture Improvements

### Code Organization
- **CenterTabs.tsx split**: 1318 lines reduced to 224 lines (83% reduction). 10 components extracted into `src/panels/`.
- **Constants extraction**: `src/constants/` with theme.ts (colors, fonts, sizes), api.ts (endpoints), storage.ts (localStorage keys), npc.ts (NPC definitions).
- **Reusable components**: BackButton, PanelCard, RpgButton, ErrorBoundary, AnimatedBg.

### Error Handling
- All silent `catch {}` blocks replaced with RPG-themed user-visible error messages.
- ErrorBoundary component wraps entire app.
- WebSocket reconnection with exponential backoff.

### Backend
- API consolidation — cleaner endpoint structure.
- GAME_BALANCE config dict with 40+ tunable values.
- Gold economy: refresh 50G, create 100G, retry 50G, potions 150-200G.
- NPC chat via Codex LLM with full conversation history.
- Reflection letter LLM generation.

### Panel Structure (final)
```
src/panels/
  AdventureLog.tsx      BagPanel.tsx          BulletinBoard.tsx
  CenterTabs.tsx        CharacterPanel.tsx    GuildBottomInfo.tsx
  GuildPanel.tsx        KnowledgeMap.tsx       MapBottomInfo.tsx
  RpgDialogInline.tsx   Shop.tsx              ShopBottomInfo.tsx
  SkillInventory.tsx    SkillPanel.tsx        SubRegionGraph.tsx
  TavernNpcPanel.tsx    TavernSceneArea.tsx   TopBar.tsx

src/components/
  AnimatedBg.tsx    BackButton.tsx     ErrorBoundary.tsx
  PanelCard.tsx     ReflectionLetter.tsx  RpgButton.tsx
  TavernAmbientChat.tsx

src/constants/
  api.ts    npc.ts    storage.ts    theme.ts
```

---

## Bugs Fixed (100+ total)

Key categories:
- NPC dialogue: 16 issues from 8-angle review, 500 errors, hardcoded IDs, language switching
- Shop: pagination, dedup, source counts, grid spacing, install actions
- Guild: quest lifecycle (accept/cancel/fail/complete), tab state, ledger display
- Map: site positioning, fog-of-war crashes, honeycomb layout, sprite uniqueness
- Character: HP bar clamping, skill/workflow counts, name display
- WebSocket: reconnection backoff, connection indicator
- General: localStorage persistence, error boundaries, scope crashes

---

## Skill Classification System

Sites on the map represent workflow categories. Each site:
- Has a unique AI-generated sprite (no duplicates across sites)
- Has its own star graph showing skills within that workflow
- Can be user-defined (6 slots), renamed, or deleted
- Maps to backend workflow data for skill tracking
- Starter town always present as the first site

---

## Deployment

Final deploy at `aaf6aa1` — full redeploy to server with SubRegionGraph fallback fix.
