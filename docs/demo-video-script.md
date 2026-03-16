# Hermes Quest Demo Video Script

> 5 分钟以内 | 无配音，8-bit 音效 + 字幕文案 | Playwright 自动录制

---

## 音效清单（8-bit）

- `intro.wav` — 开场 chiptune 旋律（10秒）
- `click.wav` — 点击音效
- `whoosh.wav` — 场景切换
- `level-up.wav` — 升级/成就音效
- `typing.wav` — 打字音效（NPC对话）
- `confirm.wav` — 确认操作
- `ambient.wav` — 背景循环 chiptune BGM（低音量）

---

## 场景 1: Opening (0:00 - 0:15)

**画面**: 黑屏 → 渐入 Dashboard 全景
**字幕**:
```
"如果 AI Agent 是一个 RPG 冒险者..."
"...它的每次学习，都是一次成长。"
"Hermes Quest — 让 Agent 进化看得见。"
```
**音效**: intro.wav

---

## 场景 2: 角色面板 (0:15 - 0:35)

**画面**: 左侧角色面板特写，缓慢滚动
**操作**: 鼠标移到 HP bar、MP bar、XP bar 上
**字幕**:
```
"HP = 可靠性。用户满意就涨，犯错就掉。"
"MP = 士气。反馈驱动，实时变化。"
"XP = 经验。每次训练都在积累。"
```
**音效**: ambient.wav（低音量）

---

## 场景 3: 世界地图 (0:35 - 1:15)

**画面**: MAP tab，展示羊皮纸世界地图
**操作**:
1. 展示 4 个大陆（鼠标 hover 每个）
2. 展示 2 个迷雾区域
3. 展示道路连线

**字幕**:
```
"每个大陆 = Agent 的一个工作流领域"
"Software Engineering, Research, Automation, Creative Arts..."
"迷雾区域？那是 Agent 尚未探索的技能领域。"
"路径连接相关领域 — 知识是互通的。"
```
**音效**: whoosh.wav（切换到MAP时）

---

## 场景 4: 技能星座图 (1:15 - 1:50)

**画面**: 点击 Software Engineering 大陆 → 进入星座图
**操作**:
1. 展示星星在星空中漂浮
2. hover 几个技能节点，显示名字
3. 不同形状的星星（十字、五角、菱形）

**字幕**:
```
"点进大陆 → 技能星座图。"
"每颗星星 = 一个已学技能。"
"同色聚类，自动形成星座。"
"hover 查看：git, docker, javascript, python..."
```
**音效**: click.wav（点击大陆时）

---

## 场景 5: NPC 酒馆 (1:50 - 2:50)

**画面**: 切换到 TAVERN tab → 酒馆场景
**操作**:
1. 底部面板展示 5 个 NPC 画廊（头像 + 名字 + CHAT 按钮）
2. 点击 Gus 头像查看 bio card
3. 返回画廊，点 Gus 的 CHAT 按钮进入私聊
4. 发送消息："最近有啥 AI 传闻"
5. 等待回复（展示 loading 和回复）

**字幕**:
```
"酒馆里有 5 个 NPC，各司其职。"
"Gus 是酒保 — 他能搜 X/Twitter 的实时传闻。"
[用户输入]: "最近有啥 AI 传闻"
[Gus 回复出现]
"NPC 不是花瓶 — 每个都接入真实数据 + LLM。"
```
**音效**: typing.wav（输入时）, confirm.wav（发送时）

---

## 场景 6: 公会任务板 (2:50 - 3:30)

**画面**: 切换到 GUILD tab
**操作**:
1. 展示公会场景
2. 展示当前 Quest 列表
3. 在底部输入框输入新任务："学习 Rust 基础"
4. 点击 POST 创建
5. 展示任务出现在列表

**字幕**:
```
"公会任务板 — 你可以给 Agent 布置学习任务。"
[输入]: "学习 Rust 基础"
"任务创建！Agent 会在下个 cycle 开始学习。"
"你也可以查看推荐任务并接受。"
```
**音效**: click.wav, confirm.wav

---

## 场景 7: 反馈系统 (3:30 - 4:00)

**画面**: 右侧 Chronicle 面板
**操作**:
1. 滚动展示事件流
2. hover 一个 skill_drop 事件 → 显示 👍👎 按钮
3. 点击 👍
4. 展示 HP/MP bar 变化

**字幕**:
```
"冒险日志实时记录 Agent 的每个动作。"
"学到了新技能？给个 👍 — HP 恢复，士气提升。"
"觉得不行？👎 — Agent 收到信号，调整方向。"
"这就是人机协作的进化循环。"
```
**音效**: level-up.wav（点击👍时）

---

## 场景 8: 背包 + 商店 (4:00 - 4:25)

**画面**:
1. 右侧面板展示背包物品（文件图标列表）
2. 点击物品查看详情
3. 切换到 SHOP tab，展示社区技能商店（9 宫格货架）

**字幕**:
```
"背包里是 Agent 收集的产出物。"
"研究笔记、配置文件、训练报告..."
"技能商店 — 从社区安装新技能到 Agent。"
```
**音效**: whoosh.wav（切换时）

> 注: SHOP 展示的是 Hub 社区技能（可 ACQUIRE SKILL 安装），不是已学技能列表。

---

## 场景 9: Closing (4:25 - 4:50)

**画面**: 拉回全景 → 渐暗
**字幕**:
```
"Hermes Quest"
"让 AI Agent 的进化，成为一场看得见的冒险。"
""
"github.com/nemoverse/hermes-quest"
"Built with Claude Code + Gemini + Hermes Agent"
```
**音效**: intro.wav 变奏（结尾旋律）

---

## 技术录制方案

```bash
# 1. 录制（Playwright 自动操作 + 录屏）
cd demo/
npx tsx playwright-record.ts

# 2. 后期合成（字幕 + 音效 → 最终视频）
./merge.sh
# 或分步：
./post-process.sh   # 生成 TTS 旁白
./merge.sh          # 合并 video + srt + bgm + narration
```

录制脚本: `demo/playwright-record.ts`
字幕文件: `demo/subtitles.srt`
合成脚本: `demo/merge.sh`

后期：用 ffmpeg 合并视频 + 叠加字幕（.srt）+ 混入 8-bit 音效

## 变更记录
- SHOP 展示社区 Hub 技能（可安装），不是已学技能列表
- NPC 私聊通过底部面板 CHAT 按钮进入，不是场景区域
- 任务无手动 DONE 按钮，通过 Evolution Cycle 自动执行
- Telegram 通知场景建议用预截图覆盖（需要登录，不适合自动录制）
