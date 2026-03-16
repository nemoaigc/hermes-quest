<div align="center">

<img src="assets/banner.svg" alt="Hermes Quest" width="100%"/>

**A self-evolving RPG system built on Hermes Agent — where AI learns, grows, and levels up like a real adventurer.**

**基于 Hermes Agent 构建的自我进化 RPG 系统 — AI 像真正的冒险者一样学习、成长、升级。**

[![MIT License](https://img.shields.io/badge/License-MIT-gold.svg?style=for-the-badge)](LICENSE)
[![Built on Hermes](https://img.shields.io/badge/Built_on-Hermes_Agent-8B5CF6?style=for-the-badge)](https://github.com/NousResearch/hermes-agent)
[![React + Vite](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

</div>

---

## What is Hermes Quest?

Hermes Quest is a **self-evolving RPG system** built on [Hermes Agent](https://github.com/NousResearch/hermes-agent). The agent autonomously discovers knowledge domains, trains skills, completes quests, and levels up — all driven by Hermes's native evolution cycle. **You define the world, the agent conquers it.**

The key innovation: **user-defined learning domains**. Name a continent "Music" or "Machine Learning" — the agent starts learning skills in that area. Skills are auto-classified by LLM, visualized as star constellations, and tracked through an RPG progression system. Five LLM-powered NPCs serve as intelligent interfaces — the bartender searches X/Twitter, the sage analyzes your stats, the guild master recommends quests. **Zero modifications to Hermes source code** — everything runs through native extension points (Skills + Cron + Memory).

**The complete loop**: Define a learning domain (e.g. "Music") → Agent discovers and learns relevant skills → Skills auto-classified by LLM → Guild recommends targeted quests → Agent trains autonomously → Levels up → Repeat. All visualized in real-time.

**完整闭环**：定义学习方向（如"音乐"）→ Agent 自动发现并学习相关技能 → LLM 自动分类 → 公会推荐针对性任务 → Agent 自主训练 → 升级 → 循环。全程实时可视化。

Hermes Quest 是基于 Hermes Agent 构建的**自我进化 RPG 系统**。Agent 自主发现知识领域、训练技能、完成任务、升级。**你定义世界，Agent 去征服它。**

核心创新：**用户自定义学习领域**。给大陆命名"音乐"或"机器学习"— Agent 就开始自学。技能由 LLM 自动分类、以星座图可视化、通过 RPG 进度系统追踪。五个 LLM 驱动的 NPC 是智能交互界面 — 酒保搜 X 新闻，贤者分析数据，公会推荐任务。

---

## Screenshots

<table>
<tr>
<td width="50%" align="center">
<strong>Knowledge Map / 知识地图</strong><br/>
<img src="assets/screenshots/map.png" alt="Knowledge Map" width="100%"/>
</td>
<td width="50%" align="center">
<strong>Guild / 公会</strong><br/>
<img src="assets/screenshots/guild.png" alt="Guild" width="100%"/>
</td>
</tr>
<tr>
<td align="center">
<strong>Skill Shop / 技能商店</strong><br/>
<img src="assets/screenshots/shop.png" alt="Shop" width="100%"/>
</td>
<td align="center">
<strong>NPC Tavern / NPC 酒馆</strong><br/>
<img src="assets/screenshots/tavern.png" alt="Tavern" width="100%"/>
</td>
</tr>
</table>

---

## Core Loop / 核心循环

```
  REFLECT -----> PLAN -----> EXECUTE -----> REPORT
  (read feedback) (pick target) (train skill)  (summarize)
       ^                                         |
       +--- user 👍/👎 --- feedback-digest.json --+
```

Every **evolution cycle**, the agent reads user feedback, reflects on weak areas, picks a training target, executes autonomously, and reports outcomes. **Each phase is visible in real-time** via the dashboard progress indicator. User feedback (thumbs up/down) flows into `feedback-digest.json`, which the agent reads at the start of each cycle to adjust its learning direction.

每个**进化周期**：Agent 读取用户反馈 → 反思弱点 → 选择训练目标 → 自主执行 → 报告成果。**每个阶段实时可见**。用户的 👍/👎 反馈会聚合到 `feedback-digest.json`，Agent 在下个周期开始时读取并据此调整学习方向。

---

## What Makes It Special / 核心亮点

### 🗺️ Define Your Own World
Click the fog → name a new continent → the agent starts learning that domain. **Music? Cooking? Quantum Physics?** You decide what your AI studies. Skills are automatically classified by LLM into the domains you define. Delete a domain, and skills redistribute. Your world, your rules.

点击迷雾 → 命名新大陆 → Agent 开始自学该领域。**音乐？烹饪？量子物理？** 你来决定。技能由 LLM 自动分类到你定义的领域。

### 🍺 NPCs That Actually Do Things
5 NPCs powered by real LLM — not scripted dialogue trees. **Gus the bartender searches X/Twitter for real-time news** and retells it as tavern gossip. **Orin the sage analyzes your actual game stats** and gives strategic advice. Ask Gus if he has a crush on Lyra — he'll blush. They have group conversations too.

5 个 NPC 由真实 LLM 驱动 — 酒保能搜 X 新闻，贤者能分析你的真实数据，还有群聊模式。

### ⚔️ Multi-Agent Group Chat
The tavern CHATTER mode lets 5 NPCs discuss your adventures among themselves. You can jump in and steer the conversation. Each NPC has distinct personality, speech patterns, secrets, and cross-NPC relationships.

酒馆群聊：5 个 NPC 自由讨论，你也能参与。每个 NPC 有独特人格、语言风格和秘密。

### 🎯 Smart Quest System
The guild board **analyzes your weaknesses** and recommends targeted training quests. Accept one, and the agent trains autonomously in the next evolution cycle. You can also post custom quests. Quests scale rewards with your level.

公会任务板**分析你的弱点**，推荐针对性训练任务。任务奖励随等级缩放。

---

## All Features / 全部功能

| Feature | Description |
|---------|-------------|
| **🧙 Character Panel** | HP (stability), MP (morale), XP, Gold, Level, Class, Title — all real-time |
| **🗺️ Custom World Map** | 6 user-definable sites, fog-of-war, skill constellation star graphs |
| **⚔️ Guild Quest Board** | AI-recommended quests, custom creation, ACCEPT/EDIT/CANCEL lifecycle |
| **🏪 Skill Shop** | Browse 80+ community skills from Hermes Hub, one-click install (300G) |
| **🧪 Potion Shop** | HP Potion (200G) and MP Potion (150G) — gold sink economy |
| **🍺 NPC Tavern** | 5 LLM-powered NPCs: Lyra, Aldric, Kael, Gus, Orin — each with unique personality |
| **💬 Group Chat** | Multi-agent tavern chatter — NPCs discuss your adventures autonomously |
| **📰 Rumors Board** | Real-time X/Twitter feed + search — "What's trending in AI?" |
| **🎒 Inventory** | Bag items with file viewer — VIEW actual config files, training reports |
| **📜 Adventure Chronicle** | Event timeline with 👍/👎 feedback → affects HP/MP, can mark quests failed |
| **🔄 Evolution Cycle** | One-click autonomous training → 4-phase progress visible in real-time |
| **🧠 Skill Classification** | LLM-powered: rename a domain → all 44+ skills auto-reclassified |
| **🔁 Feedback Loop** | User 👍/👎 → feedback-digest.json → agent reads next cycle → adjusts direction |
| **📊 Cycle Observability** | REFLECT → PLAN → EXECUTE → REPORT — watch the agent think in real-time |
| **🔍 Skill Forget** | Remove unwanted skills — a true warrior knows when to let go |

---

## Architecture / 架构

```
+-------------------+---------------------+-------------------+
|   Quest Skill     |   FastAPI Backend    |  React Dashboard  |
|   (SKILL.md)      |   (Port 8420)       |  (Pixel RPG UI)   |
|                   |                     |                   |
| - 4-phase cycle   | - 40+ API endpoints | - Zustand store   |
| - Reads digest    | - feedback-digest   | - WebSocket sync  |
| - RPG rules       | - /api/npc/chat     | - Animated BGs    |
| - XP/HP formulas  | - /api/cycle/start  | - 18+ panels      |
|                   | - skill_classify    | - cycle_progress  |
+-------------------+---------------------+-------------------+
|               Hermes Agent Runtime                          |
|          Skills - Cron - Memory - Telegram - Hub            |
+-------------------------------------------------------------+
```

### Feedback Closed Loop / 反馈闭环

```
User 👍/👎 → /api/feedback → MP ±15 + events.jsonl + feedback-digest.json
                                                            ↓
Agent cycle → SKILL.md reads digest → adjusts training direction
      ↓
 Writes cycle_phase events → watcher detects → WS broadcast → UI progress bar
```

---

## Quick Start / 快速开始

### Prerequisites

- [Hermes Agent](https://github.com/NousResearch/hermes-agent) installed
- Node.js 18+ and Python 3.11+
- Telegram bot token (optional, for notifications)

### Setup

```bash
# Clone
git clone https://github.com/nemoverse/hermes-quest.git
cd hermes-quest/hermes-quest-dashboard

# Configure environment
cp .env.example .env
# Edit .env with your values

# Install frontend
npm install

# Install backend dependencies
cd server
pip install -r requirements.txt
cd ..

# Start backend
python server/main.py  # Runs on port 8420

# Start frontend dev server (in another terminal)
npm run dev
```

### Production Build

```bash
npm run build
# Serve dist/ with your preferred static server, or
# the FastAPI backend serves it automatically at port 8420
```

### Deploy Quest Skill / 部署 Quest 技能

```bash
# Sync SKILL.md template to Hermes (via API)
curl -X POST http://localhost:8420/api/skill/quest/sync

# Or manually
cp templates/quest-skill.md ~/.hermes/skills/quest/SKILL.md

# Add to ~/.hermes/config.yaml:
# cron:
#   quest_cycle:
#     schedule: "0 */4 * * *"
#     skill: quest
```

---

## Project Structure / 项目结构

```
hermes-quest-dashboard/
+-- src/
|   +-- panels/           # 18 UI panels (Map, Guild, Shop, Tavern...)
|   +-- components/       # Shared (AnimatedBg, RpgButton, ErrorBoundary...)
|   +-- constants/        # Theme, API endpoints, NPC definitions
|   +-- store.ts          # Zustand state (+ feedbackDigest, cycleProgress)
|   +-- websocket.ts      # WS client + cycle_progress handler
|   +-- api.ts            # 20+ API client functions
|   +-- types.ts          # TypeScript interfaces
+-- server/               # FastAPI backend
|   +-- main.py           # 40+ endpoints, feedback digest, cycle management
|   +-- watcher.py        # File watcher + cycle_phase broadcast
|   +-- npc_chat.py       # LLM-powered NPC responses
|   +-- skill_classify.py # LLM skill-to-domain classification
+-- templates/
|   +-- quest-skill.md    # SKILL.md template (feedback + 4-phase cycle)
+-- public/               # Pixel art assets, sprites, fonts
+-- demo/                 # Playwright test/demo scripts
```

---

## RPG Systems / RPG 系统

| Stat | Meaning | Formula |
|:---:|:---|:---|
| HP | Stability (reliability) | `50 + level * 10`, fail penalty: -15 |
| MP | Morale (confidence) | 100 max, feedback: ±15, decay: -2/day |
| XP | Experience | `level * 100` to next level |
| Gold | Currency | Quest rewards: 100-230G scaled by level |

**Classes** emerge from skill distribution: Warrior (coding), Mage (research), Ranger (automation), Paladin (balanced), Necromancer (delegation).

**Economy**: Create quest FREE, retry 50G, HP potion 200G, MP potion 150G, skill install 300G.

---

## Roadmap / 路线图

### P0 — Core Loop Completion / 核心闭环
- [x] Feedback digest pipeline (user 👍/👎 → `feedback-digest.json` → agent behavior)
- [x] Cycle observability (4-phase progress: REFLECT → PLAN → EXECUTE → REPORT)
- [ ] End-to-end validation: deploy SKILL.md, run real cycle, verify agent reads digest
- [ ] MP influences agent via SKILL.md prompt (low MP → safer quest choices)

### P1 — Game Mechanics / 游戏机制
- [ ] Achievement system — milestone, collection, hidden achievements with gold/title rewards
- [ ] Gold sinks — skill rarity upgrade (common → uncommon → rare → epic → legendary)
- [ ] NPC affinity — daily chat rewards (25G + 10XP), relationship unlocks exclusive quests
- [ ] MP-at-zero "burnout" event — triggers recovery quest like HP's reflection letter
- [ ] Feedback sentiment → quest recommendations (deprioritize negatively-rated domains)

### P2 — Experience Polish / 体验优化
- [ ] Manual skill classification correction (override LLM assignments)
- [ ] Skill search/filter in SkillPanel (by category, rarity, source)
- [ ] NPC quest chains (multi-step quests with narrative branching)
- [ ] New player tutorial (guided first steps for the knowledge map)
- [ ] Understanding stat transparency (tooltip explaining calculation)

### P3 — Long-term Vision / 远期规划
- [ ] Skill synergy/fusion ("Frontend + Data Science" → "Data Visualization")
- [ ] Seasonal events (limited-time regions, temporary skills, special NPCs)
- [ ] Agent hypothesis generation (analyze why failures happen, not just log them)
- [ ] Knowledge representation upgrade (forgetting curves, confidence intervals)
- [ ] Multi-agent / leaderboard support

---

## License

[MIT](LICENSE) -- Use it, fork it, evolve it.

<div align="center">

**Built by [Nemoverse](https://github.com/nemoverse) | Powered by [Hermes Agent](https://github.com/NousResearch/hermes-agent)**

*The adventurer never rests. The cycle never ends.*

</div>
