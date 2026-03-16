# Hermes Quest Demo Video Script

> 4-5 分钟 | 无配音，8-bit 音效 + 字幕文案 | Playwright 自动录制
> 提交: Nous Research x Hermes Hackathon

---

## 音效清单 (8-bit)

| 文件 | 用途 |
|------|------|
| `intro.wav` | 开场 chiptune 旋律 (10s) |
| `click.wav` | 点击 |
| `whoosh.wav` | 场景切换 |
| `level-up.wav` | 升级/成就 |
| `typing.wav` | 打字 (NPC 对话) |
| `confirm.wav` | 确认操作 |
| `ambient.wav` | 背景循环 BGM (低音量) |

---

## 场景 1: Hook (0:00-0:05)

**画面**: 纯黑屏，白色像素字逐字浮现
**字幕**:
```
"你的 AI 每天帮你干活...但你知道它在变强吗？"
```
**音效**: 安静，chiptune 前奏轻微渐入
**设计意图**: 反问句开场，10 秒内建立共鸣。不要铺垫太久。

---

## 场景 2: 破题 (0:05-0:15)

**画面**: 黑屏渐明 → Dashboard 全景浮现，像素暖光
**字幕**:
```
"Hermes Quest — 把 Agent 的进化，变成一场看得见的 RPG 冒险。"
```
**音效**: intro.wav 旋律起

---

## 场景 3: 角色面板 (0:15-0:30)

**画面**: 左侧角色面板特写
**操作**: 鼠标移到 HP bar → MP bar → XP bar
**字幕**:
```
"HP = 可靠性。任务成功就涨，犯错就掉。"
"MP = 士气。你的反馈直接驱动。"
"XP = 经验。每次进化周期都在积累。"
```
**音效**: ambient.wav (低音量)

---

## 场景 4: 世界地图 (0:30-0:45)

**画面**: MAP tab，羊皮纸世界地图
**操作**: 缓慢 hover 大陆 sprite + 道路连线 + 迷雾区域
**字幕**:
```
"世界地图 — 每个大陆是 Agent 的一个工作流领域"
"迷雾区域？尚未命名的新大陆。"
```
**音效**: whoosh.wav

---

## 场景 5: 命名新大陆 (0:45-1:00)

**画面**: 点击迷雾 "???" → "NAME THIS REGION" 对话框
**操作**:
1. 点击迷雾 sprite
2. 弹出命名对话框
3. 输入 "Machine Learning"
4. 点 DEFINE → 大陆出现 (分配随机 sprite)

**字幕**:
```
"点击迷雾 → 为 Agent 的新领域命名"
"大陆由你定义 — 这是你的世界。"
```
**音效**: click.wav → confirm.wav
**注**: 已有大陆可右键 RENAME / DELETE。

---

## 场景 6: 星座技能图 (1:00-1:10)

**画面**: 点击大陆 → 底部出现 SubRegion 星座图
**操作**: hover 技能节点，显示名字
**字幕**:
```
"点进大陆 → 技能星座图"
"每颗星 = 一个已学技能。git, docker, python..."
```
**音效**: click.wav

---

## 场景 7: 酒馆群聊 (1:10-1:35)

**画面**: TAVERN tab → 场景区域 CHATTER
**操作**:
1. 观看 NPC 自动群聊
2. 输入 "你们觉得我该学什么新技能"
3. 等待多个 NPC 回复

**字幕**:
```
"酒馆 — 五个 NPC 在讨论你的近况"
[输入]: "你们觉得我该学什么新技能"
"不是预设台词 — 每个 NPC 都接入真实数据 + LLM。"
```
**音效**: typing.wav

---

## 场景 8: NPC 私聊 — Gus (1:35-2:00)

**画面**: 底部 NPC 画廊 → 点 Gus → CHAT → 私聊对话
**操作**:
1. 点 Gus 头像进入 bio card
2. 点 CHAT 进入私聊
3. 输入 "AI 最近有什么新闻"
4. 等回复 (酒馆八卦风实时新闻)

**字幕**:
```
"酒保 Gus — 能搜索 X/Twitter 实时传闻"
[Gus 回复出现]
"NPC 即工具。对话就是交互界面。"
```
**音效**: typing.wav → confirm.wav

---

## 场景 9: NPC 私聊 — Orin (2:00-2:15)

**画面**: 返回画廊 → 点 Orin → CHAT
**操作**: 输入 "分析下我的成长" → 等深度分析回复
**字幕**:
```
"贤者 Orin — 读的是 Agent 的真实游戏数据，不是幻觉"
```
**音效**: typing.wav

---

## 场景 10: 公会任务板 (2:15-2:35)

**画面**: GUILD tab → 公告板
**操作**: 展示推荐任务卡 → hover → 点 ACCEPT
**字幕**:
```
"公会任务板 — Agent 分析弱项，自动推荐学习任务"
"ACCEPT → Agent 在下次进化周期执行"
```
**音效**: click.wav → confirm.wav

---

## 场景 11: 创建任务 (2:35-2:50)

**画面**: GUILD 底部输入框
**操作**: 输入 "学习 Docker 容器化" → POST → 任务出现在 ACTIVE 列表
**字幕**:
```
[输入]: "学习 Docker 容器化"
"你也可以给 Agent 布置自定义任务。"
```
**音效**: typing.wav → confirm.wav
**注**: 无 DONE 按钮。任务由 Evolution Cycle 自动执行。可 EDIT / CANCEL。

---

## 场景 12: 技能商店 + 药水 (2:50-3:10)

**画面**: SHOP tab → 9 宫格货架 (Hub 社区技能)
**操作**:
1. 浏览货架上的技能
2. 点一个技能 → 查看详情 → ACQUIRE SKILL
3. 底部 POTIONS 栏 → 点 HP POTION

**字幕**:
```
"技能商店 — 从 Hermes Hub 浏览社区技能，一键安装"
"药水栏 — 花金币给 Agent 回血回蓝"
```
**音效**: click.wav → level-up.wav
**注**: SHOP 展示可安装的 Hub 社区技能，不是已学技能列表。底部有 HP Potion (200G) / MP Potion (150G)。

---

## 场景 13: 冒险日志 + 反馈 + 标记失败 (3:10-3:30)

**画面**: 右侧 CHRONICLE 面板
**操作**:
1. hover 事件 → 显示 thumbs up / thumbs down
2. 点 thumbs up → HP/MP 立即变化
3. 对 quest 相关事件点 thumbs down → "Mark quest as failed?" 弹窗 → AYE

**字幕**:
```
"冒险日志记录 Agent 的每个动作。"
"竖个大拇指 — HP 恢复，士气提升。"
"摇摇头 — 还能直接标记任务失败。"
"人机协作的进化闭环。"
```
**音效**: level-up.wav (thumbs up)
**注**: thumbs down 在 quest_complete / train_start 事件上触发失败确认。

---

## 场景 14: 进化周期 (3:30-3:55)

**画面**: MAP tab → 底部栏 START CYCLE 按钮
**操作**: 点击 START CYCLE → 观察状态变化
**字幕**:
```
"触发进化周期 —"
"Agent 自主分析对话 → 发现工作模式 → 训练新技能 → 升级"
"每两小时自动运行，也可手动触发。"
```
**音效**: level-up.wav 渐强

---

## 场景 15: 收尾 (3:55-4:10)

**画面**: Dashboard 全景 → 缓慢渐暗
**字幕**:
```
"Hermes Quest"
"让 AI Agent 的进化，成为一场看得见的冒险。"
```

---

## 场景 16: Credits (4:10-4:30)

**画面**: 黑屏 + 像素字居中
**字幕**:
```
"Built for Nous Research x Hermes Hackathon"
"Powered by Claude Code + Gemini + Hermes Agent"
"github.com/nemoaigc/hermes-quest"
```
**音效**: intro.wav 变奏收尾

---

## 技术录制方案

```bash
# 1. 录制 (Playwright 自动操作 + 录屏)
cd demo/
npx tsx playwright-record.ts

# 2. 后期合成 (字幕 + 音效 → 最终视频)
./merge.sh
```

录制脚本: `demo/record.ts`
字幕文件: `demo/subtitles.srt`
合成脚本: `demo/merge.sh`

后期: ffmpeg 合并视频 + 叠加字幕 (.srt) + 混入 8-bit 音效

---

## 变更记录 (2026-03-16)
1. **Hook 重写** — 从陈述改为反问，10 秒内抓住观众
2. **删除 DONE 按钮** — 任务由 Cycle 自动完成，无手动完成
3. **SHOP = Hub 安装** — 展示社区可安装技能 + ACQUIRE SKILL，不是已学技能浏览
4. **新增 S05 命名大陆** — Custom Site 系统（迷雾→命名→大陆），重要新特性
5. **药水在 SHOP 底部** — HP Potion 200G / MP Potion 150G
6. **FAIL 在 Chronicle** — thumbs down 触发 "Mark quest as failed?" 确认
7. **收尾加黑客松语境** — Nous Research, Hermes Hackathon, Claude Code, Gemini
8. **删除 Telegram 场景** — 需登录，不适合自动录制
