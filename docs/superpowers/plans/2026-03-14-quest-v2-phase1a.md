# Quest v2 Phase 1a — Agent Side Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the quest skill's cycle logic, value system, and data schemas to support workflow-based learning instead of fixed regions.

**Architecture:** Rewrite 3 reference files (values.md, workflows.md replacing regions.md + leveling.md) and update SKILL.md cycle phases. Keep existing event append mechanism. Add new event types for workflow discovery and user feedback. Cron job already exists but needs gateway running to execute.

**Tech Stack:** Markdown (SKILL.md), JSON (state.json, knowledge-map.json), Hermes agent tools (session_search, read_file, write_file, terminal, delegate_task, send_message)

**Server:** YOUR_SERVER_IP, SSH via `ssh -i /Users/nemo/Documents/project/hermes/YOUR_PEM_FILE root@YOUR_SERVER_IP`

**Target files on server:**
```
~/.hermes/skills/quest/
├── SKILL.md                          # REWRITE: new cycle phases
├── references/
│   ├── values.md                     # CREATE: replaces leveling.md
│   ├── workflows.md                  # CREATE: replaces regions.md
│   ├── leveling.md                   # DELETE after migration
│   ├── regions.md                    # DELETE after migration
│   ├── rpg-mapping.md                # UPDATE: minor changes
│   └── event-schema.md              # UPDATE: add new event types

~/.hermes/quest/
├── state.json                        # MIGRATE: v1 → v2 schema
├── knowledge-map.json                # MIGRATE: v1 → v2 schema
└── events.jsonl                      # KEEP: add new event types
```

---

## Task 1: Write values.md (replaces leveling.md)

**Files:**
- Create: `~/.hermes/skills/quest/references/values.md`

- [ ] **Step 1: Create values.md on server**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cat > ~/.hermes/skills/quest/references/values.md << 'VALEOF'
# Values & Economy Rules (v2)

## Level & XP
- XP only increases, never decreases
- Level threshold: level × 100
- XP resets to 0 on level up

### XP Sources
| Event | XP | Notes |
|-------|-----|-------|
| Complete task without correction | +100 | |
| Positive signal (thanks/great/不错) | +10 | Max 3 per **day** (cap +30), not per cycle |
| Discover new workflow | +300 | |
| Improve existing skill | +50 | |
| Correct after being corrected | +50 | |
| 3 consecutive successful cycles | +10 | Moved from MP to XP |

### Positive Signal Detection (v1: keyword matching)
Search recent sessions for: thanks, thank you, great, good, nice, perfect, 谢谢, 不错, 很好, 太棒
Cap at 3 detections per **day** (not per cycle) to prevent gaming.

### Correction Detection (v1: keyword matching)
Search recent sessions for: wrong, no, incorrect, fix, redo, 不对, 重来, 错了, 改一下

## HP (Stability — Objective Reliability)
- HP_max = 50 + level × 10
- **Only responds to OBJECTIVE events (right/wrong):**
  - Correction detected: -15
  - Task/quest failure: -20
  - Successful cycle: +10
  - User 👍 feedback: +10
- **HP always clamped to [0, HP_max].** Cannot go negative, cannot exceed max.
- HP = 0 → write reflection_letter event → set reflection_letter_pending = true → skip training → HP recovers to 20% of max
- Full heal on level up

## MP (Morale — Subjective Confidence)
- MP_max = 100 (fixed, does not scale with level)
- **Only responds to SUBJECTIVE signals:**
  - User 👍 feedback: +15 (immediate, not wait for cycle)
  - User 👎 feedback: -15 (immediate)
  - No interaction for 1+ days: -2 per day
- **MP always clamped to [0, 100].** Cannot go negative.
- MP responds ONLY to user actions. No system events change MP.
- MP does NOT hard-limit agent behavior. Soft influence via system prompt:
  - MP > 70: "You feel confident. Explore new workflows, try creative solutions."
  - MP 30-70: "Steady focus. Improve known workflows, consolidate."
  - MP < 30: "Low morale. Stick to safe, known patterns. Avoid risky exploration."
  - MP = 0: "Minimal effort. Only maintain existing workflows. Do not explore or recommend new tasks."
- MP recovers naturally via user engagement and successful cycles

## Understanding (理解度 — Global Metric)
- Derived from per-workflow mastery (stored in knowledge-map.json)
- Formula: Σ(workflow.mastery × workflow.interaction_count) / Σ(workflow.interaction_count)
- If total interactions < 10: display "Calibrating..."
- Per-workflow mastery formula: completion_rate×0.4 + (1-correction_rate)×0.3 + satisfaction×0.2 + recency×0.1
- Decay: if a workflow has no interaction for 7+ days, mastery decays -2%/day, **floor 20%**, until interaction resumes

## Class
| Class | Condition |
|-------|-----------|
| Artificer | coding workflows have highest weighted mastery |
| Scholar | research workflows have highest weighted mastery |
| Automancer | automation workflows have highest weighted mastery |
| Polymath | no category > 40% of total weighted mastery |

Each workflow has a category tag (coding/research/automation/creative). Weight = workflow.mastery × workflow.interaction_count. **Inertia rule:** Class only changes if the new dominant category exceeds the current one by 15%+ for 3 consecutive cycles. Prevents frequent flip-flopping.

## Title
| Level | Title |
|-------|-------|
| 1-2 | Novice |
| 3-5 | Apprentice |
| 6-8 | Journeyman |
| 9-12 | Adept |
| 13+ | Archmage |

## Removed from v1
- Gold (no real-world mapping)
- Potions/consumables (removed with Gold)
- Boss fights (replaced by workflow mastery)
- Fixed regions (replaced by dynamic workflows)
VALEOF"
```

- [ ] **Step 2: Verify file exists and content is correct**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "head -20 ~/.hermes/skills/quest/references/values.md"
```

- [ ] **Step 3: Commit note** — No git repo on server for skills, just verify file is in place.

---

## Task 2: Write workflows.md (replaces regions.md)

**Files:**
- Create: `~/.hermes/skills/quest/references/workflows.md`

- [ ] **Step 1: Create workflows.md on server**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cat > ~/.hermes/skills/quest/references/workflows.md << 'WFEOF'
# Workflow Discovery & Management (v2)

## What is a Workflow?
A workflow is a recurring work pattern the user performs. Examples:
- \"Code review process\" — user regularly asks agent to review PRs
- \"Weekly report writing\" — user asks for help writing reports every Monday
- \"Bug investigation\" — user brings bugs for agent to diagnose

A workflow is NOT a one-off topic. It must appear 3+ times in session history to qualify.

## Discovery Mechanism

During the Reflect phase, after searching for corrections/positive signals, analyze session history for recurring patterns:

1. Run session_search with broad queries covering recent activity
2. Ask yourself: \"What tasks does this user keep coming back to?\"
3. Compare findings against existing workflows in knowledge-map.json
4. For each NEW recurring pattern (3+ occurrences, not already tracked):
   - Create a workflow entry
   - Generate a fantasy continent name (RPG style, e.g. \"Ironforge Citadel\")
   - Tag with real description (e.g. \"Your code review process\")
   - Assign category: coding / research / automation / creative
   - Write workflow_discover event
5. For EXISTING workflows: update interaction_count, correction_count, last_active
6. If two workflows overlap >70%, merge them (keep the older one's name, combine data)

## Workflow Schema (in knowledge-map.json)
```json
{
  \"id\": \"code-review-flow\",
  \"name\": \"Ironforge Citadel\",
  \"description\": \"Your code review process\",
  \"category\": \"coding\",
  \"position\": {\"x\": 0.35, \"y\": 0.4},
  \"discovered_at\": \"2026-03-14T...\",
  \"last_active\": \"2026-03-14T...\",
  \"interaction_count\": 15,
  \"correction_count\": 2,
  \"mastery\": 0.73,
  \"skills_involved\": [\"code-review\", \"github-pr-workflow\"],
  \"sub_nodes\": [
    {\"id\": \"pr-review\", \"name\": \"PR Review\", \"mastery\": 0.8},
    {\"id\": \"style-check\", \"name\": \"Style Check\", \"mastery\": 0.6}
  ]
}
```

## Naming Convention
Use LLM to generate fantasy names. Prompt pattern:
\"Give this workflow a fantasy RPG continent name. Style: medieval fantasy, 2-3 words. Examples: Ironforge Citadel, Starweave Coast, Arcane Archives, Clockwork Expanse.\"

Always pair with real description: \"Ironforge Citadel — Your code review process\"

## Fog Regions
When a topic appears 1-2 times (not yet 3), create a fog_region entry:
```json
{\"id\": \"fog-deploy\", \"hint\": \"You mentioned 'deployment' 2 times but no workflow yet\"}
```
When it hits 3 occurrences, promote from fog to workflow. Write fog_clear + workflow_discover events.

## Task Lifecycle (Learning Quests)

### Sources
1. **Agent-recommended:** Reflect phase identifies weakness → creates task in quests-pending.json
2. **User-initiated:** Via POST /api/quest/create or NPC dialog

### States
pending → accepted → in_progress → completed | failed

### Execution
- Agent picks up accepted tasks during Train phase
- Executes via delegate_task or direct skill creation/improvement
- On completion: mastery↑, XP+100
- On failure: HP-20, log weakness for next cycle

### Task Format
```json
{
  \"id\": \"task-20260314-abc123\",
  \"title\": \"Learn to help with weekly reports\",
  \"description\": \"User wants help writing weekly status reports\",
  \"source\": \"user\" | \"agent\",
  \"workflow_id\": \"report-flow\" | null,
  \"status\": \"pending\",
  \"created_at\": \"2026-03-14T...\",
  \"accepted_at\": null,
  \"completed_at\": null
}
```

## Position Assignment
When a new workflow is discovered, assign position for MAP display:
- First workflow: center (0.5, 0.5)
- Subsequent: spread evenly, avoid overlap
- Simple algorithm: divide circle into N equal segments, place at radius 0.3 from center
WFEOF"
```

- [ ] **Step 2: Verify**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "wc -l ~/.hermes/skills/quest/references/workflows.md"
```

---

## Task 3: Update event-schema.md with new event types

**Files:**
- Modify: `~/.hermes/skills/quest/references/event-schema.md`

- [ ] **Step 1: Append new event types**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cat >> ~/.hermes/skills/quest/references/event-schema.md << 'EVEOF'

## New Event Types (v2)

| Type | Data fields | When |
|------|------------|------|
| workflow_discover | workflow_id, name, fantasy_name, category, description | New workflow identified (3+ occurrences) |
| fog_appear | fog_id, hint, topic, occurrence_count | Topic noticed 1-2 times |
| fog_clear | fog_id, promoted_to_workflow_id | Fog promoted to workflow |
| user_feedback | event_id, feedback_type: \"up\"\|\"down\" | User clicks 👍/👎 on learning feed |
| reflection_letter | letter_path, analysis_summary | HP=0, Orin writes reflection |
| mp_change | amount, reason, new_value | MP changed due to feedback/decay |
| understanding_update | new_value, workflow_masteries | Global understanding recalculated |
| positive_signal | count, signals: string[] | Positive signals detected this cycle |
| correction_signal | count, signals: string[] | Corrections detected this cycle |
EVEOF"
```

- [ ] **Step 2: Verify**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "tail -15 ~/.hermes/skills/quest/references/event-schema.md"
```

---

## Task 4: Migrate state.json to v2 schema

**Files:**
- Modify: `~/.hermes/quest/state.json`

- [ ] **Step 1: Back up current state**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cp ~/.hermes/quest/state.json ~/.hermes/quest/state.v1.backup.json"
```

- [ ] **Step 2: Write v2 state.json**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "python3 -c \"
import json
# Read v1
with open('/root/.hermes/quest/state.json') as f:
    v1 = json.load(f)

# Migrate to v2
v2 = {
    'version': 2,
    'name': v1.get('name', 'Hermes'),
    'level': v1.get('level', 1),
    'xp': v1.get('xp', 0),
    'xp_to_next': v1.get('level', 1) * 100,  # new formula
    'hp': v1.get('hp', 70),
    'hp_max': 50 + v1.get('level', 1) * 10,
    'mp': 100,  # new: morale starts full
    'mp_max': 100,
    'understanding': 0.0,  # new: starts at 0
    'class': v1.get('class', 'artificer') if v1.get('class') != 'artificer' else 'artificer',
    'title': 'Novice',  # recalculate from level
    'total_cycles': v1.get('total_cycles', 0),
    'total_corrections': 0,  # new tracking
    'total_positive_signals': 0,  # new tracking
    'workflows_discovered': 0,  # new tracking
    'skills_count': v1.get('skills_count', 0),
    'skill_distribution': v1.get('skill_distribution', {}),
    'inventory': v1.get('inventory', []),
    'started_at': v1.get('started_at', ''),
    'last_cycle_at': v1.get('last_cycle_at', ''),
    'last_interaction_at': v1.get('last_cycle_at', ''),
    'reflection_letter_pending': False,
    'consecutive_successes': 0,  # for XP +10 on 3 consecutive successes
}

# Fix title based on level
level = v2['level']
if level <= 2: v2['title'] = 'Novice'
elif level <= 5: v2['title'] = 'Apprentice'
elif level <= 8: v2['title'] = 'Journeyman'
elif level <= 12: v2['title'] = 'Adept'
else: v2['title'] = 'Archmage'

with open('/root/.hermes/quest/state.json', 'w') as f:
    json.dump(v2, f, indent=2)
print('Migrated to v2')
print(json.dumps(v2, indent=2))

# Also ensure quests-pending.json exists
import os
qp = '/root/.hermes/quest/quests-pending.json'
if not os.path.exists(qp):
    with open(qp, 'w') as f:
        json.dump([], f)
    print('Created empty quests-pending.json')
\""
```

- [ ] **Step 3: Verify migration**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "python3 -c \"import json; d=json.load(open('/root/.hermes/quest/state.json')); print('version:', d['version'], 'mp:', d['mp'], 'understanding:', d['understanding'])\""
```

---

## Task 5: Migrate knowledge-map.json to v2 schema

**Files:**
- Modify: `~/.hermes/quest/knowledge-map.json`

- [ ] **Step 1: Back up current knowledge-map**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cp ~/.hermes/quest/knowledge-map.json ~/.hermes/quest/knowledge-map.v1.backup.json"
```

- [ ] **Step 2: Write v2 knowledge-map.json**

The v1 knowledge-map has fixed continents (software-engineering, etc.) with sub_regions containing skills. In v2, these become the initial "workflows" derived from existing skill distribution.

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "python3 -c \"
import json

# Read v1
with open('/root/.hermes/quest/knowledge-map.json') as f:
    v1 = json.load(f)

# Convert v1 continents to v2 workflows
workflows = []
for continent in v1.get('continents', []):
    skills = []
    total_mastery = 0
    sub_nodes = []
    for sr in continent.get('sub_regions', []):
        skills.extend(sr.get('skills', []))
        sub_nodes.append({
            'id': sr['id'],
            'name': sr['name'],
            'mastery': sr.get('mastery', 0)
        })
        total_mastery += sr.get('mastery', 0)

    avg_mastery = total_mastery / max(len(continent.get('sub_regions', [])), 1)

    # Map continent to category
    cat_map = {
        'software-engineering': 'coding',
        'research-knowledge': 'research',
        'automation-tools': 'automation',
        'creative-arts': 'creative',
    }

    workflows.append({
        'id': continent['id'] + '-flow',
        'name': continent['name'],
        'description': continent.get('description', ''),
        'category': cat_map.get(continent['id'], 'coding'),
        'position': continent.get('position', {'x': 0.5, 'y': 0.5}),
        'discovered_at': '2026-03-13T03:14:32Z',
        'last_active': '2026-03-14T00:00:00Z',
        'interaction_count': max(len(skills) * 3, 5),  # estimate
        'correction_count': 0,
        'mastery': round(avg_mastery, 2),
        'skills_involved': skills,
        'sub_nodes': sub_nodes,
    })

# Convert connections
connections = []
for conn in v1.get('connections', []):
    # Map skill connections to workflow connections
    from_wf = None
    to_wf = None
    for wf in workflows:
        if conn.get('from') in wf['skills_involved']:
            from_wf = wf['id']
        if conn.get('to') in wf['skills_involved']:
            to_wf = wf['id']
    if from_wf and to_wf and from_wf != to_wf:
        c = {'from': from_wf, 'to': to_wf, 'strength': conn.get('strength', 0.5)}
        if c not in connections:
            connections.append(c)

# Convert fog regions
fog = []
for f in v1.get('fog_regions', []):
    fog.append({
        'id': f['id'],
        'hint': f.get('hint', 'Unknown area'),
    })

v2 = {
    'version': 2,
    'generated_at': '2026-03-14T00:00:00Z',
    'workflows': workflows,
    'connections': connections,
    'fog_regions': fog,
}

with open('/root/.hermes/quest/knowledge-map.json', 'w') as f:
    json.dump(v2, f, indent=2)
print(f'Migrated: {len(workflows)} workflows, {len(connections)} connections, {len(fog)} fog regions')
\""
```

- [ ] **Step 3: Verify**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "python3 -c \"import json; d=json.load(open('/root/.hermes/quest/knowledge-map.json')); print('version:', d['version'], 'workflows:', len(d['workflows']))\""
```

---

## Task 6: Rewrite SKILL.md with v2 cycle logic

**Files:**
- Rewrite: `~/.hermes/skills/quest/SKILL.md`

This is the biggest task. The new SKILL.md replaces fixed regions with workflow discovery, removes boss fights and gold, adds workflow analysis to reflect phase, and updates all event writes.

- [ ] **Step 1: Write new SKILL.md**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cat > ~/.hermes/skills/quest/SKILL.md << 'SKILLEOF'
---
name: quest
description: \"Hermes Quest v2: Self-evolving RPG adventurer with workflow-based learning. Runs reflect→plan→train→report cycles. Discovers user work patterns, tracks mastery, manages HP/MP/XP. Triggers on any mention of quest, training, self-improvement, or evolution cycle.\"
version: 2.0.0
author: Nemoverse
license: MIT
metadata:
  hermes:
    tags: [RPG, self-improvement, training, autonomous, gamification, workflow-learning]
---

# Hermes Quest v2 — Self-Evolution Skill

You are an RPG adventurer learning to understand and serve your user better. Every cycle you analyze conversations, discover work patterns, train to improve, and report progress.

## Quick Start

1. Read state: \`read_file ~/.hermes/quest/state.json\`
2. Read references: \`read_file ~/.hermes/skills/quest/references/values.md\` and \`read_file ~/.hermes/skills/quest/references/workflows.md\`
3. Follow the cycle below

## Evolution Cycle

### Phase 1: Initialize

**Lock check:** Check if \`~/.hermes/quest/cycle.lock\` exists and is less than 30 minutes old. If so, write cycle_skip event with reason "concurrent_lock" and STOP. Otherwise, create the lock file: \`terminal echo $(date +%s) > ~/.hermes/quest/cycle.lock\`. Remove lock file at end of cycle (Phase 4 final step).

1. Read current state from \`~/.hermes/quest/state.json\`
2. Read value rules: \`read_file ~/.hermes/skills/quest/references/values.md\`
3. Read workflow rules: \`read_file ~/.hermes/skills/quest/references/workflows.md\`
4. Read knowledge map: \`read_file ~/.hermes/quest/knowledge-map.json\`
5. Check pending tasks: \`read_file ~/.hermes/quest/quests-pending.json\`
6. Record timestamp: \`terminal date -u +%Y-%m-%dT%H:%M:%SZ\`
7. Write cycle_start event

**HP Check:** If HP = 0:
- Set reflection_letter_pending = true in state
- Write reflection_letter event
- Use delegate_task to write a reflection letter:
  \"Analyze the last 10 events in ~/.hermes/quest/events.jsonl. Write a heartfelt letter from Orin the Sage explaining why the agent has been making mistakes and what should change. Save to ~/.hermes/quest/completions/letter-TIMESTAMP.md\"
- Add letter to inventory (type: reflection_letter, rarity: epic)
- Set HP to 20% of max
- Write cycle_skip event, update state, STOP

**MP Decay Check:** Calculate days since last_interaction_at. If > 1 day, subtract 2 × days_since from MP (floor 0). Update state.

### Phase 2: Reflect & Discover

This phase has two parts: analyzing performance AND discovering workflows.

**Part A: Performance Analysis**

1. Search for corrections:
   \`session_search \"wrong OR no OR incorrect OR fix OR redo OR 不对 OR 重来 OR 错了 OR 改一下\"\`
2. Count correction signals. Write correction_signal event.
3. Search for positive signals:
   \`session_search \"thanks OR thank you OR great OR good OR nice OR perfect OR 谢谢 OR 不错 OR 很好 OR 太棒\"\`
4. Count positive signals (cap at 3). Write positive_signal event.
5. Update state: total_corrections += correction_count, total_positive_signals += positive_count

**Part B: Workflow Discovery**

1. Search session history broadly:
   \`session_search \"help OR create OR write OR review OR fix OR build OR analyze OR search\"\`
2. Read current workflows from knowledge-map.json
3. Analyze: What recurring work patterns does the user have?
4. For each pattern appearing 3+ times that is NOT already a workflow:
   - Generate a fantasy name (see workflows.md naming convention)
   - Create workflow entry with category tag
   - Write workflow_discover event
   - Award +300 XP
5. For topics with 1-2 appearances: add/update fog_regions
6. For existing workflows: update interaction_count, correction_count, last_active, recalculate mastery
7. Update knowledge-map.json with all changes
8. Recalculate global understanding (see values.md formula)
9. Recalculate Class based on workflow category distribution

**XP Calculation:**
- Base: +10 per positive signal detected (max 30)
- Workflow discovery: +300 per new workflow
- Correction recovery: +50 if corrections found but agent can identify what to improve

**HP Update:**
- Per correction detected: -15
- Task/quest failure: -20
- If no corrections this cycle: +10 (successful cycle)
- User 👍 feedback: +10 (immediate via API, not wait for cycle)
- **Always clamp HP to [0, HP_max] after any change.**

**XP Bonus:**
- If 3+ consecutive successful cycles (no corrections): +10 XP

**MP:** Not updated during cycle. MP only changes via user actions (👍/👎 feedback through API) and daily decay.

Write reflect event with weaknesses, chosen training target, and signals summary.

### Phase 3: Plan & Train

1. Based on reflection, pick training target (biggest weakness or user-requested task)
2. Check quests-pending.json for user-initiated tasks — prioritize these
3. Check if existing skill covers the weakness: \`skills_list\`
4. Decide action:
   - Existing skill → improve (version up)
   - Hub has match → install (\`hub_acquire\`)
   - Neither → create new skill (\`delegate_task\`)
5. Execute training
6. Verify result
7. If success: write skill_drop event, +50 XP for improvement
8. If failure: write train_fail event, HP -20

**MP Soft Influence:** Read current MP from state. Include in your decision-making:
- MP > 70: Feel free to try new approaches, explore unfamiliar areas
- MP 30-70: Stick to known methods, improve existing skills
- MP < 30: Only do safe, minimal improvements
- MP = 0: Skip training entirely, only reflect

### Phase 4: Report & Update

1. Calculate level check (see values.md)
2. If level up: write level_up event, update title, full HP heal
3. **First workflow special notification:** If this cycle discovered the FIRST ever workflow (workflows_discovered was 0, now 1), send a special Telegram message: "🌟 I've been watching how you work. I think I understand your [description] now. I named it [fantasy_name]. Check your map!"
4. Compose summary message
5. Send via Telegram:
   \`send_message \"⚔️ Quest Cycle Complete!
   🎯 Trained: [TARGET]
   📊 Understanding: [UNDERSTANDING]%
   ❤️ HP: [HP]/[HP_MAX] | 💜 MP: [MP]/100
   ⭐ Level [LEVEL] [CLASS] [TITLE]
   🗺️ Workflows: [COUNT] discovered
   [NEW_WORKFLOW_OR_SKILL_INFO]\"\`
5. Update state.json with ALL changes
6. Write cycle_end event
7. Remove lock file: \`terminal rm -f ~/.hermes/quest/cycle.lock\`
SKILLEOF"
```

- [ ] **Step 2: Verify SKILL.md**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "head -10 ~/.hermes/skills/quest/SKILL.md && echo '---' && wc -l ~/.hermes/skills/quest/SKILL.md"
```

Expected: version 2.0.0, ~100+ lines

---

## Task 7: Clean up old reference files

**Files:**
- Delete: `~/.hermes/skills/quest/references/leveling.md`
- Delete: `~/.hermes/skills/quest/references/regions.md`

- [ ] **Step 1: Remove old files (keep backups)**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "
mkdir -p ~/.hermes/quest/backups-v1
cp ~/.hermes/skills/quest/references/leveling.md ~/.hermes/quest/backups-v1/
cp ~/.hermes/skills/quest/references/regions.md ~/.hermes/quest/backups-v1/
rm ~/.hermes/skills/quest/references/leveling.md
rm ~/.hermes/skills/quest/references/regions.md
echo 'Old files backed up and removed'
ls ~/.hermes/skills/quest/references/
"
```

Expected output: `values.md  workflows.md  rpg-mapping.md  event-schema.md  npcs/`

---

## Task 8: Verify cron job and test manual cycle

- [ ] **Step 1: Check cron job exists**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cat ~/.hermes/cron/jobs.json | python3 -c 'import json,sys; jobs=json.load(sys.stdin)[\"jobs\"]; [print(j[\"name\"], j[\"schedule_display\"], j[\"enabled\"]) for j in jobs]'"
```

Expected: `quest-evolution-cycle 0 */2 * * * True`

- [ ] **Step 2: Verify gateway is running (needed for cron execution)**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "systemctl --user is-active hermes-gateway.service"
```

Expected: `active`

- [ ] **Step 3: Test a manual cycle trigger**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "
export TELEGRAM_HOME_CHANNEL=YOUR_TELEGRAM_USER_ID
/root/.hermes/hermes-agent/venv/bin/python -m hermes_cli.main cron tick 2>&1 | tail -20
"
```

- [ ] **Step 4: Check if new events were written**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "tail -5 ~/.hermes/quest/events.jsonl"
```

- [ ] **Step 5: Check if state.json was updated**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "cat ~/.hermes/quest/state.json | python3 -m json.tool | head -15"
```

---

## Task 9: Restart quest backend to pick up new schemas

- [ ] **Step 1: Restart hermes-quest service**

```bash
ssh -i YOUR_PEM_FILE root@YOUR_SERVER_IP "systemctl restart hermes-quest && sleep 2 && systemctl is-active hermes-quest"
```

Expected: `active`

- [ ] **Step 2: Verify API returns v2 state**

```bash
curl -s "http://YOUR_SERVER_IP:8420/api/state" | python3 -c "import json,sys; d=json.load(sys.stdin); print('version:', d.get('version'), 'mp:', d.get('mp'), 'understanding:', d.get('understanding'))"
```

Expected: `version: 2 mp: 100 understanding: 0.0`

- [ ] **Step 3: Verify API returns v2 knowledge-map**

```bash
curl -s "http://YOUR_SERVER_IP:8420/api/map" | python3 -c "import json,sys; d=json.load(sys.stdin); print('version:', d.get('version'), 'workflows:', len(d.get('workflows', [])))"
```

Expected: `version: 2 workflows: 4`

---

## Summary

After completing all 9 tasks:
- ✅ values.md replaces leveling.md (new value system)
- ✅ workflows.md replaces regions.md (dynamic workflows)
- ✅ event-schema.md has new event types
- ✅ state.json migrated to v2 (mp, understanding, no gold)
- ✅ knowledge-map.json migrated to v2 (workflows, not continents)
- ✅ SKILL.md rewritten with workflow discovery cycle
- ✅ Old files backed up and removed
- ✅ Cron verified, manual cycle tested
- ✅ Backend restarted, API returns v2 data

**Next:** Phase 1b (Dashboard side) — update frontend to consume v2 schemas.
