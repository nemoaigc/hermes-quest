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

The key innovation: **user-defined learning domains**. Name a continent "Music" or "Machine Learning" — the agent starts learning skills in that area. Skills are auto-classified by LLM, visualized as star constellations, and tracked through an RPG progression system. Five LLM-powered NPCs serve as intelligent interfaces — the bartender searches X/Twitter, the sage analyzes your stats, the guild master recommends quests.

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
  REFLECT -----> PLAN -----> TRAIN -----> REPORT
  (self-review)  (pick quest) (build skill) (gain XP)
       ^                                      |
       +------------- EVOLVE -----------------+
```

Every **evolution cycle**, the agent reflects on mistakes, picks the weakest area, trains by writing real code, and earns XP/gold/skill drops. The dashboard shows it all live.

每个**进化周期**：自省错误 -> 选择最弱领域 -> 通过编写真实代码训练 -> 获得经验/金币/技能掉落。仪表盘全程实时展示。

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
| **🔄 Evolution Cycle** | One-click autonomous training → Telegram notification on completion |
| **🧠 Skill Classification** | LLM-powered: rename a domain → all 44+ skills auto-reclassified |
| **📊 NPC Persona Cards** | Click any NPC → detailed bio, personality traits, lore |
| **🔍 Skill Forget** | Remove unwanted skills — a true warrior knows when to let go |

---

## Architecture / 架构

```
+-------------------+---------------------+-------------------+
|   Quest Skill     |   FastAPI Backend    |  React Dashboard  |
|   (SKILL.md)      |   (Port 8420)       |  (Pixel RPG UI)   |
|                   |                     |                   |
| - Evolution cycle | - /api/state        | - Zustand store   |
| - RPG rules       | - /api/quests       | - WebSocket sync  |
| - NPC prompts     | - /api/npc/chat     | - Animated BGs    |
| - XP/HP formulas  | - /api/hub/*        | - 18+ panels      |
|                   | - /api/cycle/start  |                   |
+-------------------+---------------------+-------------------+
|               Hermes Agent Runtime                          |
|          Skills - Cron - Memory - Telegram - Hub            |
+-------------------------------------------------------------+
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

### Install Quest Skill (on Hermes server)

```bash
cp -r quest-skill/ ~/.hermes/skills/quest/

# Add to ~/.hermes/config.yaml:
# skills:
#   - quest
# cron:
#   quest_cycle:
#     schedule: "0 */4 * * *"
#     skill: quest
```

---

## Project Structure / 项目结构

```
hermes-quest/
+-- quest-skill/              # Hermes skill definition (SKILL.md + references)
+-- hermes-quest-dashboard/
|   +-- src/
|   |   +-- panels/           # 18 UI panels (Map, Guild, Shop, Tavern...)
|   |   +-- components/       # Shared (AnimatedBg, RpgButton, ErrorBoundary...)
|   |   +-- constants/        # Theme, API endpoints, NPC definitions
|   |   +-- store.ts          # Zustand state management
|   |   +-- api.ts            # Backend API client
|   +-- server/               # FastAPI backend (main.py, models, watcher, WS)
|   +-- public/               # Pixel art assets, sprites, fonts
|   +-- demo/                 # Demo recording scripts (Playwright)
+-- tools/                    # CLI utilities
```

---

## RPG Systems / RPG 系统

| Stat | Meaning | Formula |
|:---:|:---|:---|
| HP | Agent reliability | `50 + level * 10` |
| MP | API token budget | `30 + level * 5` |
| XP | Experience | Earned per cycle, quest, skill |
| Gold | Currency | Quests, training, loot |

**Classes** emerge from skill distribution: Warrior (coding), Mage (research), Ranger (automation), Paladin (balanced), Necromancer (delegation).

**Economy**: Create quest 100g, retry 50g, HP potion 200g, MP potion 150g, refresh board 50g.

---

## License

[MIT](LICENSE) -- Use it, fork it, evolve it.

<div align="center">

**Built by [Nemoverse](https://github.com/nemoverse) | Powered by [Hermes Agent](https://github.com/NousResearch/hermes-agent)**

*The adventurer never rests. The cycle never ends.*

</div>
