# Hermes Quest Demo 录制脚本

> 目标: 4-5 分钟 | 字幕 + 8-bit BGM | Playwright 自动录制
> 核心叙事线: "你的 AI 不只是工具 — 它是一个会成长的冒险者，而你能亲眼看到"

---

## 叙事节奏

| 阶段 | 时间 | 作用 |
|------|------|------|
| Hook | 0:00-0:10 | 问题共鸣，10秒内抓住观众 |
| 破题 | 0:10-0:15 | 一句话说清产品 |
| 角色 | 0:15-0:30 | 建立 RPG 代入感 |
| 世界 | 0:30-1:10 | 视觉冲击 — 地图+命名+星座 |
| 社交 | 1:10-2:15 | 深度功能 — NPC 不是花瓶 |
| 任务 | 2:15-3:00 | 交互核心 — 任务+商店+药水 |
| 反馈 | 3:00-3:30 | 闭环 — 日志+反馈+标记失败 |
| 高潮 | 3:30-3:55 | 进化周期 — 全系统联动 |
| 收尾 | 3:55-4:30 | 价值主张 + Credits |

---

## S01: Hook (0:00-0:05)
**画面**: 纯黑屏，像素字逐字浮现
**字幕**: "你的 AI 每天帮你干活...但你知道它在变强吗？"
**音效**: 安静，轻微 chiptune 前奏渐入

## S02: 破题 (0:05-0:15)
**画面**: 黑屏渐明 → Dashboard 全景浮现
**字幕**: "Hermes Quest — 把 Agent 的进化，变成一场看得见的 RPG 冒险。"
**音效**: intro.wav 旋律起

## S03: 角色面板 (0:15-0:30)
**操作**: hover 左侧角色面板 HP → MP → XP bar
**字幕**:
- "HP = 可靠性。任务成功就涨，犯错就掉。"
- "MP = 士气。你的反馈直接驱动。"
- "XP = 经验。每次进化周期都在积累。"
**音效**: ambient.wav

## S04: 世界地图 (0:30-0:45)
**操作**: MAP tab，缓慢 hover 各大陆 sprite + 道路连线 + 迷雾
**字幕**:
- "世界地图 — 每个大陆是 Agent 的一个工作流领域"
- "迷雾区域？尚未命名的新大陆。"
**音效**: whoosh.wav

## S05: 命名大陆 (0:45-1:00)
**操作**: 点击迷雾 "???" → "NAME THIS REGION" 对话框 → 输入 "Machine Learning" → 点 DEFINE → 大陆出现
**字幕**:
- "点击迷雾 → 为 Agent 的新领域命名"
- "大陆由你定义 — 这是你的世界。"
**音效**: click.wav → confirm.wav
> 展示 Custom Site 系统。右键已有大陆可 RENAME/DELETE。

## S06: 星座技能图 (1:00-1:10)
**操作**: 点击一个大陆 → 底部 SubRegion 星座图 → hover 技能节点
**字幕**:
- "点进大陆 → 技能星座图"
- "每颗星 = 一个已学技能。git, docker, python..."
**音效**: click.wav

## S07: 酒馆群聊 (1:10-1:35)
**操作**: TAVERN tab → 场景区域 CHATTER → 观看 NPC 自动聊天 → 输入参与
**字幕**:
- "酒馆 — 五个 NPC 在讨论你的近况"
- [输入] "你们觉得我该学什么新技能"
- "不是预设台词 — 每个 NPC 都接入真实数据 + LLM。"
**音效**: typing.wav

## S08: NPC 私聊 — Gus 搜新闻 (1:35-2:00)
**操作**: 底部 NPC 画廊点 Gus → CHAT → 输入 "AI 最近有什么新闻" → 等回复
**字幕**:
- "酒保 Gus 能搜索 X/Twitter 实时新闻"
- [回复出现 — 酒馆八卦风转述]
- "NPC 即工具。对话就是交互界面。"
**音效**: typing.wav → confirm.wav

## S09: NPC 私聊 — Orin 深度分析 (2:00-2:15)
**操作**: 返回 → 点 Orin → CHAT → "分析下我的成长" → 等回复
**字幕**:
- "贤者 Orin — 读的是 Agent 的真实游戏数据，不是幻觉"
**音效**: typing.wav

## S10: 公会任务板 (2:15-2:35)
**操作**: GUILD tab → 展示公告板推荐任务卡 → hover → 点 ACCEPT
**字幕**:
- "公会任务板 — Agent 分析弱项，自动推荐学习任务"
- "点击 ACCEPT → Agent 在下次进化周期执行"
**音效**: click.wav → confirm.wav

## S11: 创建自定义任务 (2:35-2:50)
**操作**: 底部输入 "学习 Docker 容器化" → POST → 任务出现在 ACTIVE 列表
**字幕**:
- [输入] "学习 Docker 容器化"
- "你也可以给 Agent 布置自定义任务"
**音效**: typing.wav → confirm.wav
> 任务由 Cycle 自动执行。可 EDIT/CANCEL，无手动完成按钮。

## S12: 技能商店 + 药水 (2:50-3:10)
**操作**: SHOP tab → 货架展示 Hub 技能 → 点一个 → ACQUIRE SKILL → 底部 POTIONS 栏 → 点 HP POTION
**字幕**:
- "技能商店 — 从 Hermes Hub 浏览社区技能，一键安装"
- "药水栏 — 花金币给 Agent 回血回蓝"
**音效**: click.wav → level-up.wav
> SHOP 展示可安装的 Hub 社区技能，不是已学技能。底部有 HP Potion (200G) / MP Potion (150G)。

## S13: 冒险日志 + 反馈 + 标记失败 (3:10-3:30)
**操作**: 右侧 CHRONICLE → hover 事件 → 点 thumbs up → HP/MP 变化 → 对 quest 事件点 thumbs down → "Mark quest as failed?" → AYE
**字幕**:
- "冒险日志记录 Agent 的每个动作"
- "竖个大拇指 — HP 恢复，士气提升"
- "摇摇头 — 还能直接标记任务失败"
- "人机协作的进化闭环。"
**音效**: level-up.wav
> thumbs down 在 quest 类事件上会触发 "Mark quest as failed?" 确认弹窗。

## S14: 触发进化周期 (3:30-3:55)
**操作**: MAP tab → 底部栏 START CYCLE → 等待状态变化
**字幕**:
- "触发进化周期 —"
- "Agent 自主分析对话 → 发现工作模式 → 训练新技能 → 升级"
- "每两小时自动运行，也可手动触发。"
**音效**: level-up.wav 渐强

## S15: 收尾 (3:55-4:10)
**画面**: Dashboard 全景 → 缓慢渐暗
**字幕**:
- "Hermes Quest"
- "让 AI Agent 的进化，成为一场看得见的冒险。"

## S16: Credits (4:10-4:30)
**画面**: 黑屏 + 像素字居中
**字幕**:
- "Built for Nous Research x Hermes Hackathon"
- "Powered by Claude Code + Gemini + Hermes Agent"
- "github.com/nemoaigc/hermes-quest"
**音效**: intro.wav 变奏收尾

---

## 总时长: ~4 分 30 秒

## 与旧版脚本的关键差异
1. **Hook 重写** — 开场从陈述句改为反问句，10 秒内建立共鸣
2. **删除 DONE 按钮** — 任务由 Agent 在 Cycle 中自动完成，无手动完成
3. **SHOP = Hub 技能安装** — 货架展示可安装的社区技能 + ACQUIRE SKILL，不是已学技能浏览
4. **新增 S05 命名大陆** — 展示 Custom Site 系统（迷雾→命名→大陆出现）
5. **药水在 SHOP 底部栏** — HP Potion 200G / MP Potion 150G
6. **FAIL 在 Chronicle** — thumbs down 对 quest 事件触发 "Mark quest as failed?" 弹窗
7. **收尾强化** — 明确提及 Nous Research, Hermes Hackathon, Claude Code, Gemini
8. **删除 Telegram 场景** — 需登录，不适合自动录制
