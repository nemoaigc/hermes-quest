# Hermes Quest — 持续审查修复日志

> 自动化 5 专家闭环审查，每轮并行执行，修复后 commit

---

## Round 1 (2026-03-16 ~05:30)

| 专家 | 发现问题 | 修复 |
|------|---------|------|
| PM (产品经理) | 27 issues (4 high, 12 med, 11 low) | 6 fixed |
| Agent Dev (开发) | 15 issues (3 crit, 3 high, 5 med, 4 low) | 7 fixed |
| Context Eng (上下文) | 16 issues (3 high, 6 med, 7 low) | 4 fixed |
| QA (测试) | 41 tests, 4 FAIL, 5 WARN | 2 fixed |
| Algorithm (算法) | 17 issues (2 crit, 5 high, 5 med, 5 low) | 5 fixed |

### Fixes Applied (Round 1)

**Frontend (commit a20abdb):**
1. `CenterTabs.tsx`: Missing `API_URL` on `/api/cycle/start` (2 locations) — critical
2. `Shop.tsx`: Install doesn't check `res.ok` + stale closure on `allSkills` — high
3. `BagPanel.tsx`: Discard removes item on API error + selection not cleared — high
4. `BulletinBoard.tsx`: `reward_gold`/`reward_xp` undefined fallback — low
5. `CenterTabs.tsx`: `allQuests` infinite re-fetch (was dep on `quests` array ref) — medium
6. `CenterTabs.tsx`: Prefill message race condition — medium
7. `store.ts`: `setKnowledgeMap` mutates passed object — medium
8. `store.ts`: `understanding` type doc corrected (0-100 not 0-1) — medium
9. `AdventureLog.tsx`: Timestamp font 4px → clamp(5-7px) — low

**Server (applied via SSH):**
10. `/api/feedback`: Removed HP changes (spec: HP = objective only) — high
11. Quest rewards: Scale with level (C/B/A rank formulas) — high
12. `npc_chat.py`: Removed duplicate `conversation_history` key — medium
13. `npc_chat.py`: Fixed path traversal, `PROMPTS_DIR` → `prompts/` — high
14. Tavern: Wrapped `state_block`/`events_block` in `<quest_data>` safety tags — high
15. Map: Clamp mastery to [0.0, 1.0] — medium
16. `xp_to_next`: Fixed fallback to `level*100` — critical

### Known Issues Deferred to Round 2
- Hub install backend completely broken (`install_skill_bundle` missing)
- Quest history endpoint returns 200 with error body instead of 404
- Duplicate events in event log
- Duplicate active quests (semantic dedup needed)
- Feedback state lost on refresh (no persistence)
- Adventure log clear only client-side
- No global error boundary
- WebSocket reconnect: no exponential backoff
- Connection status not shown to user
- Gold economy: no sinks (spec says removed from v2)
- Bulletin board: deterministic quest gen, board goes permanently empty after accepting all
- Cross-process race condition on state.json
- NPC prompts: no explicit role-play instruction in .md files

---

