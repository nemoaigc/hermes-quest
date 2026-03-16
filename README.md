<div align="center">

<img src="assets/banner.svg" alt="Hermes Quest" width="100%"/>

**The world's first self-evolving AI agent — gamified as a living RPG adventure.**

**全球首个自我进化 AI Agent —— 以像素 RPG 世界呈现的活体冒险。**

[![MIT License](https://img.shields.io/badge/License-MIT-gold.svg?style=for-the-badge)](LICENSE)
[![Built on Hermes](https://img.shields.io/badge/Built_on-Hermes_Agent-8B5CF6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgMTloMjBMMTIgMnoiLz48L3N2Zz4=)](https://github.com/NousResearch/hermes-agent)
[![React + Vite](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

---

*What if your AI agent could level up, fight bosses, learn new skills, and grow stronger — all by itself?*

*如果你的 AI Agent 能自己升级、打 Boss、学新技能、变强 —— 会怎样？*

</div>

---

## ✨ What is Hermes Quest? / 这是什么？

> **Hermes Quest** turns a [Hermes Agent](https://github.com/NousResearch/hermes-agent) into a **self-evolving RPG adventurer**. It autonomously discovers its weaknesses, trains to overcome them, levels up, and completes quests — all visualized as a pixel-art fantasy world you can watch in real-time.
>
> **Hermes Quest** 把 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 变成一个**自我进化的 RPG 冒险者**。它自主发现弱点、训练自己、升级变强、完成任务——整个过程可视化为一个你可以实时观看的像素风魔法世界。

**Zero modifications to Hermes source code.** Everything runs through native extension points: Skills, Cron, Memory, and Messaging.

**零修改 Hermes 源码。** 一切通过原生扩展点运行：技能、定时任务、记忆、消息。

---

## 🎮 Core Loop / 核心循环

```
╔══════════════╗     ╔══════════════╗     ╔══════════════╗     ╔══════════════╗
║  🔍 REFLECT  ║ ──▶ ║  📋 PLAN     ║ ──▶ ║  ⚔️ TRAIN    ║ ──▶ ║  📊 REPORT   ║
║  Self-review ║     ║  Pick quest  ║     ║  Build skill ║     ║  Gain XP     ║
║  自省弱点     ║     ║  选择任务     ║     ║  锻造技能     ║     ║  获得经验     ║
╚══════════════╝     ╚══════════════╝     ╚══════════════╝     ╚══════════════╝
       ▲                                                              │
       └──────────────────────── 🔄 EVOLVE ───────────────────────────┘
```

Every cycle, the agent:

1. **Reflects** on recent mistakes and corrections from conversations / 从对话中自省近期错误
2. **Plans** which weakness to attack and which region to enter / 规划要克服的弱点和进入的区域
3. **Trains** by creating or improving a skill through real code execution / 通过真实代码执行来创建或改进技能
4. **Reports** progress with XP, gold, and potential level-ups / 汇报进度：经验值、金币、可能的升级

---

## 🗺️ The World / 世界观

A dynamic world with **custom sites** that emerge from the agent's real work patterns. Each site maps to a discovered workflow domain. Fog regions represent undiscovered territory.

一个动态世界，**自定义站点**从 Agent 的真实工作模式中涌现。每个站点映射一个已发现的工作流领域。迷雾区域代表未探索的领域。

| Site Type / 站点类型 | Description / 说明 | Example / 示例 |
|:---:|:---|:---|
| 🏠 **Starter Town** | Starting hub for uncategorized skills | Always present |
| 🗺️ **Workflow Sites** | Auto-discovered from agent workflows | Software Engineering, Creative Arts, Tools |
| 🌫️ **Fog Regions** | Undiscovered domains, unlocked via quests | Data & Analytics, DevOps |
| ✏️ **Custom Sites** | User-defined regions on the hex map | Up to 6 map slots |

---

## 🧩 Architecture / 架构

```
┌─────────────────────────────────────────────────────────┐
│                   Hermes Quest System                    │
├───────────────┬───────────────────────┬─────────────────┤
│  Quest Skill  │    FastAPI Backend    │  React Dashboard │
│  (SKILL.md)   │    (Port 8420)        │  (Pixel RPG UI)  │
│               │                       │                  │
│ • Evolution   │ • /api/state          │ • Character      │
│   cycle logic │ • /api/quests         │ • Bulletin Board │
│ • RPG rules   │ • /api/cycle/start    │ • Shop & Bag     │
│ • NPC prompts │ • /api/npc/chat       │ • Knowledge Map  │
│               │ • /api/hub/*          │ • Guild Panel    │
│               │ • /api/events         │ • Adventure Log  │
│               │ • /api/skills         │ • NPC Tavern     │
│               │ • /api/tavern/*       │ • Rumors Board   │
│               │ • /api/rumors/*       │ • Feedback       │
│               │ • /api/bag/*          │ • Custom Sites   │
│               │ • /api/sites/*        │                  │
├───────────────┴───────────────────────┴─────────────────┤
│                    Hermes Agent Runtime                   │
│         Skills · Cron · Memory · Telegram · Hub          │
└─────────────────────────────────────────────────────────┘
```

| Component / 组件 | Tech / 技术 | Description / 说明 |
|---|---|---|
| **Quest Skill** | Hermes SKILL.md | The RPG brain — cycle logic, XP/HP/MP rules, NPC personalities / RPG 大脑——循环逻辑、属性规则、NPC 人设 |
| **Backend API** | FastAPI + Python | State management, quest CRUD, NPC chat (LLM-powered), skill hub proxy / 状态管理、任务增删、NPC 对话(LLM)、技能中心 |
| **Dashboard** | React + Vite + Zustand | Pixel-art RPG interface with animated backgrounds, real-time state sync / 像素风 RPG 界面，动画背景，实时状态同步 |
| **Messaging** | Telegram Bot | Cycle reports, quest notifications, HP alerts / 循环报告、任务通知、HP 警报 |

---

## 🎨 Screenshots / 截图

<table>
<tr>
<td width="50%" align="center">

**🗺️ Knowledge Map / 知识地图**

<img src="assets/screenshots/map.png" alt="Knowledge Map" width="100%"/>

</td>
<td width="50%" align="center">

**⚔️ Guild / 公会**

<img src="assets/screenshots/guild.png" alt="Guild" width="100%"/>

</td>
</tr>
<tr>
<td align="center">

**🏪 Skill Shop / 技能商店**

<img src="assets/screenshots/shop.png" alt="Shop" width="100%"/>

</td>
<td align="center">

**🍺 NPC Tavern / NPC 酒馆**

<img src="assets/screenshots/tavern.png" alt="Tavern" width="100%"/>

</td>
</tr>
</table>

### Feature Highlights / 功能亮点

- **Character Panel** — Real-time HP/MP/XP, dynamic class system, level & title / 实时属性条、动态职业、等级头衔
- **Knowledge Map** — Custom hex sites, fog regions, workflow mastery, skill constellation graphs / 自定义六边形站点、迷雾区域、工作流精通度、技能星座图
- **Guild Panel** — Bulletin board with AI-recommended quests, quest creation & lifecycle tracking / 公告板 AI 推荐任务、创建任务、生命周期追踪
- **Skill Shop** — Browse & install from Hermes Skills Hub with search / 搜索浏览并安装 Hermes 技能中心的技能
- **NPC Tavern** — LLM-powered 1-on-1 chat with 5 unique NPCs + group ambient chatter / LLM 驱动的 5 位 NPC 私聊 + 群聊
- **Rumors Board** — Real-time X/Twitter social feed with search / 实时 X/Twitter 社交信息流 + 搜索
- **Bag & Inventory** — Collected artifacts with "Show to NPC" interaction / 收集的产出物，可展示给 NPC
- **Adventure Log** — Event chronicle with thumbs up/down feedback affecting HP/MP / 事件日志，反馈直接影响属性

---

## ⚙️ RPG Systems / RPG 系统

### Stats / 属性

| Stat | Maps to / 映射 | Formula / 公式 |
|:---:|:---|:---|
| ❤️ **HP** | Agent stability & uptime | `50 + level × 10` |
| 💎 **MP** | API token budget | `30 + level × 5` |
| ⭐ **XP** | Accumulated experience | `100 + 50/skill + 25/improve` per cycle |
| 💰 **Gold** | Task rewards & loot | Quests, training, boss victories |

### Classes / 职业 (Emergent, not chosen / 涌现式，非选择)

| Class / 职业 | Trigger / 触发 | Style / 风格 |
|:---:|:---|:---|
| ⚔️ Warrior | Coding/implementation skills dominate | Direct action |
| 🔮 Mage | Research/analysis skills dominate | Knowledge-focused |
| 🏹 Ranger | Automation/monitoring skills dominate | Scouting |
| 🛡️ Paladin | Balanced skill distribution | All-rounder |
| 💀 Necromancer | Heavy delegate_task (subagent) usage | Summoner |

### Economy / 经济

| Action / 行为 | Cost / 价格 | Reward / 回报 |
|:---:|:---:|:---|
| 🧪 HP Potion | 200g | Restore HP |
| 💧 MP Potion | 150g | Restore MP |
| 📋 Create Quest | 100g | Post a custom quest |
| 🔄 Retry Quest | 50g | Re-attempt a failed quest |
| 🔃 Refresh Board | 50g | New bulletin board quests |
| ⚔️ Complete Quest | — | Earn Gold + XP (varies by rank) |
| 📈 Evolution Cycle | — | XP, skill drops, workflow mastery |

---

## 🚀 Quick Start / 快速开始

### Prerequisites / 前提

- [Hermes Agent](https://github.com/NousResearch/hermes-agent) installed and configured
- Node.js 18+ & Python 3.11+
- A Telegram bot token (optional, for notifications)

### Install / 安装

```bash
# Clone the repo / 克隆仓库
git clone https://github.com/nemoverse/hermes-quest.git
cd hermes-quest

# Install the Quest skill into Hermes / 安装 Quest 技能到 Hermes
cp -r quest-skill/ ~/.hermes/skills/quest/

# Start the backend / 启动后端
cd hermes-quest-dashboard/scripts
pip install -r requirements.txt
python server.py  # Runs on port 8420

# Build & serve the dashboard / 构建前端
cd ../hermes-quest-dashboard
npm install && npm run build
# Serve the dist/ folder with your preferred static server
```

### Configure / 配置

```yaml
# ~/.hermes/config.yaml — add quest skill
skills:
  - quest

# Set up cron for auto-evolution cycles
cron:
  quest_cycle:
    schedule: "0 */4 * * *"  # Every 4 hours
    skill: quest
```

---

## 🏗️ Project Structure / 项目结构

```
hermes-quest/
├── quest-skill/              # Hermes skill definition
│   ├── SKILL.md              # Core RPG logic & cycle instructions
│   └── references/           # Leveling, regions, events schema
├── hermes-quest-dashboard/   # Full-stack dashboard
│   ├── src/
│   │   ├── panels/           # UI panels (Character, Shop, Guild...)
│   │   ├── components/       # Shared components (AnimatedBg, NPC...)
│   │   ├── store.ts          # Zustand state management
│   │   └── api.ts            # Backend API client
│   ├── scripts/
│   │   └── server.py         # FastAPI backend
│   └── public/               # Pixel art assets, sprites, fonts
├── tools/                    # CLI utilities (Twitter, Xiaohongshu)
├── demo/                     # Demo recording & narration
└── README.md                 # You are here ✨
```

---

## 🌟 Why Hermes Quest? / 为什么做这个？

<table>
<tr>
<td>

### The Problem / 问题

AI agents today are **static tools** — they do what you tell them, then forget.
They don't learn from their mistakes. They don't get better over time.
They have no intrinsic motivation to improve.

今天的 AI Agent 是**静态工具**——你让它做什么它就做什么，然后忘记。
它们不从错误中学习，不随时间变强，没有内在的进化动力。

</td>
<td>

### The Vision / 愿景

Hermes Quest creates an agent that **evolves autonomously** —
reflect, train, level up, repeat. It's a closed-loop system where
the RPG framing isn't just cosmetic — it's the **incentive structure**
that drives continuous self-improvement.

Hermes Quest 创造一个**自主进化**的 Agent——
自省、训练、升级、循环。RPG 外壳不只是装饰——
它就是驱动持续自我改进的**激励结构**。

</td>
</tr>
</table>

> *"The best AI isn't the one with the most parameters — it's the one that never stops learning."*
>
> *「最好的 AI 不是参数最多的那个——而是永不停止学习的那个。」*

---

## 💡 Why We Built This / 我们为什么做这个

Hermes Agent has Skills, Memory, Cron, Messaging, and a Skills Hub — **everything you need to build something wild on top of it.** So we did.

Hermes Agent 有技能、记忆、定时任务、消息、技能中心——**在上面搞事情所需的一切都有了。** 所以我们就搞了。

Hermes Quest is a **stress test** of Hermes' extension system — zero source code modifications, pure skill-layer engineering. Self-evolution loops, RPG economy, LLM-driven NPCs, a full pixel-art dashboard — all running through native primitives.

Hermes Quest 是 Hermes 扩展系统的一次**压力测试**——零源码修改，纯技能层工程。自我进化循环、RPG 经济、LLM 驱动的 NPC、完整像素风仪表盘——全部通过原生原语运行。

**We're here to push the boundaries of what's possible with Hermes, and to grow the ecosystem by building real things on it.**

**我们在这里是为了探索 Hermes 的可能性边界，通过在上面构建真实的东西来壮大这个生态。**

---

## 🤝 Contributing / 贡献

We welcome contributions! Whether it's new regions, NPC personalities, skill templates, or UI improvements.

欢迎贡献！无论是新区域、NPC 人设、技能模板、还是 UI 改进。

```bash
# Fork & clone
git clone https://github.com/<you>/hermes-quest.git

# Create a feature branch
git checkout -b feature/my-awesome-region

# Submit a PR
```

---

## 📜 License / 许可证

[MIT](LICENSE) — Use it, fork it, evolve it.

---

<div align="center">

**Built with ⚔️ by [Nemoverse](https://github.com/nemoverse)**

**Powered by [Hermes Agent](https://github.com/NousResearch/hermes-agent) from [Nous Research](https://nousresearch.com)**

---

*The adventurer never rests. The cycle never ends. Level up.* 🗡️

*冒险者永不停歇。循环永不终结。升级吧。* ⚔️

</div>
