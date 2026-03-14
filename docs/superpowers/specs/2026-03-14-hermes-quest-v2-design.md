# Hermes Quest v2 — Dashboard Redesign Spec

## 核心理念

Dashboard 不是数据展示板，是 **AI agent 学习闭环的可视化控制面板**。帮助 C 端用户无需理解技术细节，就能看到 agent 在学什么、学得怎么样，并引导学习方向。

## 一句话定义

> 用户只关心一件事："我的 agent 是不是越来越好用了？"

---

## 布局结构

```
┌──────────────────────────────────────────────────────────┐
│ TopBar: Level / HP / MP / 理解度 / Class / Title         │
├──────────┬──────────────────────────────┬────────────────┤
│ LEFT     │ CENTER                       │ RIGHT          │
│ 240px    │                              │ 280px          │
│          │ [MAP] [GUILD] [SHOP] [TAVERN]│                │
│ 角色面板  │ ┌──────────────────────────┐ │ [冒险日志]     │
│          │ │ 场景容器 1024:572        │ │ [学习动态]     │
│ 技能/背包 │ │ 木框边框                  │ │  👍/👎 反馈   │
│          │ ├──────────────────────────┤ │                │
│          │ │ 底部栏（木板纹理底）      │ │                │
│          │ │ 各 tab 不同交互内容       │ │                │
│          │ └──────────────────────────┘ │                │
└──────────┴──────────────────────────────┴────────────────┘
```

---

## 4 个 Tab 定义

### MAP — 用户工作流地图

**场景容器：** 羊皮纸地图背景（map-bg.png），大陆 = 用户工作流（agent 自动从对话历史聚类发现）。点击大陆钻入知识图谱（纯节点+连线，无背景图）。

**工作流发现机制：** 每次 cycle 的 reflect 阶段末尾，LLM 分析 session 历史，识别用户的重复工作模式。同一话题出现 3 次以上才算工作流。输出写入 knowledge-map.json。LLM 每次看全量 workflows，自行判断合并或拆分。

**大陆命名：** agent 用 LLM 起奇幻名 + 小字标注真实含义。如 "Ironforge Citadel — 你的代码审查流程"。命名规则直接写在 reflect 逻辑里，不需要单独 md。

**底部栏：** 状态摘要 + 手动触发按钮
```
[🗺 3 workflows] [📊 avg 73%] [❓ 2 unexplored]     [▶ START CYCLE]
```

### GUILD — 双向学习任务板

**场景容器：** 公告板背景（bulletin-bg.png），6 格显示学习任务。

**任务来源：**
- Agent 推荐："我发现你常查 API 文档但我总找错版本" → 用户 ✓接受 / ✗拒绝 / ✏修改
- 用户发起：文本输入框 或 和 NPC (Lyra) 对话

**任务生命周期：** 推荐/发起 → 待接受 → 进行中（下次 cycle train 阶段执行）→ 完成（mastery↑ XP↑）或失败（HP↓）

**底部栏：** QuestTracker（活跃任务追踪，从场景 overlay 移出）

### SHOP — 智能推荐商店

**场景容器：** 道具店背景（shop-bg.png），货架展示推荐技能。

**推荐逻辑：** 根据工作流地图的空白区域精准推荐。"你经常处理 PDF 但没有 PDF 技能" → 一键安装。不是浏览列表。

**底部栏：** 搜索框 + 筛选按钮（从场景 overlay 移出）

### TAVERN — 轻松社交

**场景容器：** 热闹酒馆背景（npc-bg.png）+ HEAR RUMORS 按钮 → 浮动传闻卡片（X/Twitter，可滚轮，可点击跳转）

**底部栏：** 5 NPC 头像格子，点击 → RPG 对话框替换底部栏

---

## 数值系统

### 真实引擎

只有 1 个真实引擎：agent 的 reflect 阶段分析对话（v1 用关键词匹配，后续可升级 LLM），产出原始数据写入 state.json。所有展示数值从这些原始数据派生。

### 4 个展示数值

| 数值 | 含义 | 方向 | 变化规则 |
|------|------|------|---------|
| **Level** (XP) | 累计成长 | 只涨 | 升级阈值: level × 100 |
| **HP** | 客观可靠性 | 涨跌 | 只响应客观事件 |
| **MP** | 主观士气 | 涨跌 | 只响应主观信号 |
| **理解度** | 全局理解深度 | 涨跌 | 所有工作流 mastery 按交互次数加权平均 |

**理解度 vs mastery：** mastery 是每个工作流的掌握度（存 knowledge-map.json），理解度是全局聚合指标（显示在 TopBar）。公式：`理解度 = Σ(workflow.mastery × workflow.interaction_count) / Σ(workflow.interaction_count)`

### XP 来源

| 事件 | XP | 备注 |
|------|-----|------|
| 完成任务未纠正 | +100 | |
| 正向信号 | +10 | **每天**上限 3 次（+30），非每 cycle |
| 发现新工作流 | +300 | |
| 改进技能 | +50 | |
| 被纠正后修正 | +50 | |
| 连续 3 次成功 cycle | +10 | 从 MP 移到 XP |

### HP 规则

- HP_max = 50 + level × 10
- **HP 触发器（仅客观事件）：**
  - 被纠正: **-15**（确保反思信可触发：2 次纠正 -30 > 1 次成功 +10）
  - 任务失败: -20
  - 成功 cycle: +10
  - 用户👍: +10（**立刻生效**，不等 cycle）
- HP clamp 到 [0, HP_max]，不能变负数
- 归零 → 跳过训练 → agent 写反思信（羊皮纸弹窗）→ 用户关闭后恢复至 20%

### MP 规则

- MP_max = 100（固定，不随 level 变）
- **MP 触发器（仅用户动作，不含系统事件）：**
  - 用户👍: +15（**立刻生效**，不等 cycle）
  - 用户👎: -15（**立刻生效**）
  - 长期不互动: -2/天
- MP clamp 到 [0, 100]
- MP 不硬限制 agent，软影响行为（system prompt 注入）
- **MP=0 行为：** agent 消极怠工——不探索新工作流，不推荐任务，只维护已有。用户给👍可拉回。
- **与 HP=0 区分：** HP=0 = 停机写反思信，MP=0 = 还在跑但不积极

### Mastery 公式（per-workflow）

```
mastery = 完成率×0.4 + (1-纠正率)×0.3 + 满意度×0.2 + 时效性×0.1
```

- 满意度从隐性信号推断（用户采纳结果=正向，修改结果=负向）
- 交互 < 10 次：显示 "校准中..."
- 7 天无互动某工作流开始衰减 -2%/天，**下限 20%**，用户回来互动后停止衰减

### 纠正/失败处理

不回滚任何东西。HP 扣（短期信号）+ mastery 公式自然反映（长期信号）。两套系统各管各的。

### 2 个身份标签

| 标签 | 来源 |
|------|------|
| **Class** | 工作流分类中 mastery 加权最高的类别。**惯性规则：** 新类别必须连续 3 个 cycle 超过当前类别 15% 以上才会切换，防止频繁摇摆。|
| **Title** | Level 决定：1-2 Novice, 3-5 Apprentice, 6-8 Journeyman, 9-12 Adept, 13+ Archmage |

### 去掉的

- **Gold** — 无实际意义，XP 已满足累积感
- **独立 XP 条** — 合并为 Level 进度条

---

## Data Schema

### state.json

```json
{
  "version": 2,
  "name": "Hermes",
  "level": 5,
  "xp": 320,
  "xp_to_next": 500,
  "hp": 80,
  "hp_max": 100,
  "mp": 75,
  "mp_max": 100,
  "understanding": 0.73,
  "class": "artificer",
  "title": "Apprentice",
  "total_cycles": 28,
  "total_corrections": 12,
  "total_positive_signals": 45,
  "workflows_discovered": 3,
  "skills_count": 15,
  "skill_distribution": {
    "coding": 8,
    "research": 3,
    "automation": 3,
    "creative": 1
  },
  "inventory": [
    {
      "id": "report-20260314",
      "type": "research_note",
      "name": "AI Agent 调研报告",
      "workflow_id": "code-review-flow",
      "file_path": "~/.hermes/quest/completions/report-20260314.md",
      "created_at": "2026-03-14T...",
      "source": "cycle",
      "rarity": "rare"
    }
  ],
  "started_at": "2026-03-13T...",
  "last_cycle_at": "2026-03-14T...",
  "last_interaction_at": "2026-03-14T...",
  "reflection_letter_pending": false
}
```

### knowledge-map.json (v2)

```json
{
  "version": 2,
  "generated_at": "2026-03-14T...",
  "workflows": [
    {
      "id": "code-review-flow",
      "name": "Ironforge Citadel",
      "description": "代码审查流程",
      "category": "coding",
      "position": { "x": 0.35, "y": 0.4 },
      "discovered_at": "2026-03-14T...",
      "last_active": "2026-03-14T...",
      "interaction_count": 15,
      "correction_count": 2,
      "mastery": 0.73,
      "skills_involved": ["code-review", "github-pr-workflow"],
      "sub_nodes": [
        { "id": "pr-review", "name": "PR Review", "mastery": 0.8 },
        { "id": "style-check", "name": "Style Check", "mastery": 0.6 }
      ]
    }
  ],
  "connections": [
    { "from": "code-review-flow", "to": "debugging-flow", "strength": 0.5 }
  ],
  "fog_regions": [
    { "id": "fog-1", "hint": "You mentioned 'deployment' 2 times but no workflow yet" }
  ]
}
```

---

## API Endpoints

### 保留（更新）
- `GET /api/state` — 返回 v2 state.json
- `GET /api/map` — 返回 v2 knowledge-map.json
- `GET /api/events` — 保留
- `GET /api/skills` — 保留
- `GET /api/quest/active` — 保留
- `POST /api/quest/accept` — 保留
- `POST /api/npc/chat` — 保留，后端改 system prompt 注入 NPC 数据
- `GET /api/rumors/feed` — 保留
- `GET /api/rumors/search` — 保留

### 新增
- `POST /api/feedback` — 👍👎反馈，body: `{event_id, type: "up"|"down"}`。**立刻更新** state.json（HP +10/MP +15 或 MP -15），不等 cycle。事件同时写入 events.jsonl 供 reflect 阶段读取。
- `POST /api/cycle/start` — 手动触发 cycle，返回 `{status: "started"|"already_running"}`。**使用 lock file 防并发**（`~/.hermes/quest/cycle.lock`），cron 和手动触发互斥。lock 超过 30 分钟自动过期。
- `GET /api/cycle/status` — 当前 cycle 状态（running/idle），检查 lock file
- `GET /api/learning-feed` — 学习动态，从 events.jsonl 过滤 skill_drop/workflow_discover/reflect 类型事件
- `POST /api/quest/create` — 用户发起学习任务，body: `{title, source: "user"}`

---

## NPC 系统

### 5 个 NPC

NPC = 对话分析器的 RPG 界面。不是花瓶，每个都接入真实数据。

| NPC | 角色 | 数据源 | 职责 |
|-----|------|--------|------|
| Lyra | Guild Master | quests.json + events.jsonl | 推荐任务、评估完成质量 |
| Aldric | Cartographer | knowledge-map.json + mastery | 分析工作流覆盖、找薄弱区域 |
| Kael | Quartermaster | skills 目录 + hub 数据 | 评估技能搭配、推荐安装/卸载 |
| Rosa | Bartender | events.jsonl + session 历史 | 闲聊、趣事、轻松对话（需要 prompt 将事件数据转化为叙事） |
| Orin | Sage | session 历史 + memories | 深度分析、反思报告（HP=0 反思信由 Orin 执笔） |

**NPC 协作链：** Aldric 发现薄弱区域 → Lyra 据此推荐学习任务 → Kael 据此推荐技能安装。各自独立分析但数据上游有关联。

### NPC 对话方式

RPG 对话框（底部栏内），不是弹窗。左侧头像 + 右侧对话 + 推荐问题 + 输入框。

### 文件结构（MECE）

```
quest/
├── SKILL.md                    # 管什么：cycle 流程（4 phases）
├── references/
│   ├── values.md               # 管什么：所有数值规则（Level/HP/MP/理解度/Mastery/Class/Title）
│   ├── workflows.md            # 管什么：工作流发现 + 命名 + 任务生命周期
│   └── npcs/
│       ├── lyra.md             # 管什么：Guild Master 人设 + 数据源 + 回答风格 + 示例
│       ├── aldric.md           # Cartographer
│       ├── kael.md             # Quartermaster
│       ├── rosa.md             # Bartender
│       └── orin.md             # Sage
```

互不重叠：SKILL.md 管流程，values.md 管数值，workflows.md 管工作流，npcs/ 管人设。

---

## 右侧面板

两个 tab：**[冒险日志] [学习动态]**

### 冒险日志（保留）

现有事件流，时间排序。

### 学习动态（新增）

**数据源：** events.jsonl 中 type 为 skill_drop / workflow_discover / reflect 的事件。

每条 = agent 的一个学习成果：
```
🔮 发现了你的"代码审查"工作流
   3月14日 | mastery 35%
   [👍] [👎]

📖 学会了帮你查 arXiv 论文
   3月13日 | 用了2次没被纠正
   [👍] [👎]
```

👍 = 认可（HP +10, MP +15），👎 = 否定（MP -15）。
反馈写入 events.jsonl（type: "user_feedback"），reflect 阶段读取。
emoji 图标用 Gemini 网格生成像素版。

---

## 对话分析

不是独立组件。两层已有机制覆盖：

- **自动化层：** quest skill reflect 阶段 session_search 检测纠正/正向信号，量化写入 state.json
- **交互层：** NPC 对话，用户主动询问，LLM 读 session 历史后回答

v1 用关键词匹配（"不对/重来/谢谢/不错"），接受误判。后续可升级 LLM 判断。

---

## Agent Cycle 触发

- **Cron 自动：** 配 cron 定时触发（如每 6 小时）
- **手动：** MAP 底部栏 START CYCLE 按钮 → POST /api/cycle/start
- **防重复：** GET /api/cycle/status 检查，按钮在 running 时禁用
- **两者共存**

---

## 冷启动

新用户 0 对话：
- 理解度显示 "Hermes is getting to know you — keep chatting and check back soon."
- MAP 显示空白羊皮纸 + NPC 问候（Rosa/Lyra 脚本化欢迎语）
- GUILD 显示空公告板
- HP/MP 满值
- Level 1 Novice
- **迷雾门槛：1 次对话**即出现迷雾区域（不是 3 次），加速首次 aha moment
- 首个工作流发现时发送特殊 Telegram 通知

---

## HP 归零 — 反思信

- **触发：** HP = 0
- **行为：** 跳过训练 → Orin (Sage) 写"我最近为什么错这么多"的深度分析 → 存入 inventory（type: reflection_letter, rarity: epic）
- **展示：** 用户打开 dashboard 时弹出羊皮纸覆盖层（parchment.png），读完关闭后 HP 恢复至 20%
- **state.json：** reflection_letter_pending = true 触发弹窗

---

## 视觉资产

### 已有（复用）
- 4 张场景背景（map/guild/shop/tavern）
- 5 NPC 头像（Gemini 网格生成）
- 100 技能图标 + 100 物品图标
- parchment.png（羊皮纸弹窗）
- 暖色主题 + 木框容器

### 需要新增
- 1 张木板纹理横条（底部栏通用背景，1024×150）
- 👍👎 像素图标（Gemini 网格生成）
- 大陆 sprites 重新生成（羊皮纸手绘风，匹配 map-bg）
- 所有 emoji 替换为像素风图标

---

## 实施分阶段

### Phase 1a：Agent 侧
- 更新 quest SKILL.md（cycle 流程加工作流发现）
- 写 values.md（新数值规则）
- 写 workflows.md（工作流发现 + 命名 + 任务生命周期）
- reflect 阶段加关键词匹配 v1
- 配 cron 跑 cycle
- 更新 state.json / knowledge-map.json schema

### Phase 1b：Dashboard 侧
- MAP 改成工作流地图
- 右侧面板加学习动态 tab
- 新 API endpoints（feedback, cycle/start, cycle/status, learning-feed, quest/create）
- 底部栏木板纹理 + 交互内容
- 生成👍👎像素图标 + 底部栏纹理

### Phase 2：GUILD + SHOP
- 双向学习任务板
- 智能推荐商店
- QuestTracker 移到底部栏
- 搜索/筛选移到底部栏

### Phase 3：NPC + TAVERN + 反思信
- 5 个 NPC md 编写
- NPC 对话接 LLM
- 传闻 UI 优化
- HP=0 反思信功能（Orin 执笔 + 羊皮纸弹窗）

### Phase 4：打磨
- 坐标微调
- 动画优化
- 知识图谱视觉专业化（力导向布局、贝塞尔连线、mastery 渐变色）
