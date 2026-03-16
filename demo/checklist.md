# Pre-Recording Checklist

> Last verified: 2026-03-16
> Tested against: http://118.196.105.22:8420

---

## Script Comparison: Flags & Discrepancies

Two demo scripts exist with overlapping but different scene structures:

- `demo/script.md` — 20 scenes, ~3 min, detailed操作+字幕
- `docs/demo-video-script.md` — 9 scenes, ~5 min, Playwright自动录制

### Flagged Issues

| Scene | Feature | Status | Notes |
|-------|---------|--------|-------|
| S08 (script.md) | "Click DONE to complete quest" | **NO DONE BUTTON** | Guild bottom panel only has EDIT and CANCEL buttons for active quests. There is no "DONE/COMPLETE" button in the UI. Quest completion happens through the backend API (`/api/quest/complete`), not through a user-facing button. **Must rewrite this scene.** |
| S05/Scene4 | "Click Software Engineering continent" | **CHANGED** | Map now uses Custom Sites system (hexagonal grid with user-defined sites), not fixed continent names. The site named "Software" exists but navigating to it shows a SubRegion star graph, not a "Software Engineering continent." Narration needs updating. |
| S09/Scene8 | "SHOP tab, source filter" | **WORKS but different** | Shop shows ALL + source-based category tabs (community, filesystem, training, etc.), not the "source filter" described. Functionally correct but narration should match actual UI labels. |
| S11 (script.md) | "Gus searches X/Twitter news" | **PARTIALLY CORRECT** | Gus NPC chat works via LLM but does NOT independently search X/Twitter. The RUMORS tab under TAVERN fetches X/Twitter posts via `/api/rumors/feed`. Gus can discuss the game state but won't proactively fetch news. Separate features. |
| S12 (script.md) | "RUMORS tab" | **WORKS** | Rumors is a sub-tab within TAVERN scene area (top bar: CHATTER / RUMORS), not a standalone tab. Narration should say "click RUMORS in the tavern" not "click RUMORS tab." |
| S15 (script.md) | "SHOW TO NPC" in inventory | **WORKS** | BagPanel has item detail view but SHOW TO NPC is wired via `window.__hermesShowToNpc` bridge. Verify the button actually appears in the detail view. |
| S16 (script.md) | "Thumbs up in Chronicle" | **WORKS** | Feedback sends to `/api/feedback`. HP/MP bar change depends on backend processing -- the visual effect may not be instant/dramatic enough for demo. |
| S17 (script.md) | "FORGET skill" | **WORKS** | SkillInventory has FORGET button with confirmation dialog. Works via DELETE `/api/skills/{name}`. **WARNING: actually deletes the skill from the filesystem.** Do NOT demo with a skill you want to keep. |
| S18 (script.md) | "CYCLE button on MAP" | **WORKS but hidden** | CYCLE button only appears when a continent/site is selected AND has a workflow_id. Must click a defined site with skills first. Returns "unauthorized" from bare curl but works from browser with Origin header. |
| S19 (script.md) | "Telegram notification" | **CANNOT VERIFY FROM UI** | Pre-screenshot required. Not testable in dashboard. |
| Scene5 (docs) | "5 NPC heads, click Gus" | **NPC ID mismatch in script** | Gus's ID is `bartender`, not `gus`. The UI shows 5 NPCs correctly: Lyra, Aldric, Kael, Gus, Orin. Clicking works. |
| Scene5 (docs) | "User input in group chat" | **NO USER INPUT IN CHATTER** | CHATTER mode shows ambient NPC group chat (read-only). User can only click NEW GOSSIP to regenerate. User messages go through NPC CHAT (private 1-on-1) in the bottom panel. Script needs correction. |
| Scene6 (docs) | "POST quest, see it appear" | **WORKS** | Quest creation via input + POST button works. Quest appears in ACTIVE tab. Costs 100G per creation. |
| Scene9 (docs) | "github.com/nemoverse/hermes-quest" | **CHECK URL** | Memory says repo is `github.com/nemoaigc/hermes-quest` (private). Script says `nemoverse`. Verify which is correct before recording. |

---

## Scene-by-Scene Checklist

### S01: Loading Screen (5s)
- [ ] Dashboard loads at http://118.196.105.22:8420
- [ ] Loading bar animation shows correctly
- **State needed:** None (fresh page load)

### S02: Full Dashboard (5s)
- [ ] All panels visible: Character (left), Center tabs (MAP/GUILD/SHOP/TAVERN), Adventure Log (right), Skills/Bag (right)
- [ ] No error states, connection indicator green
- **State needed:** Websocket connected, data loaded

### S03: Character Panel (8s)
- [ ] HP bar shows (current: 140/140)
- [ ] MP bar shows (current: 100/100)
- [ ] XP bar shows (current: 180/900 to next level)
- [ ] Gold displays (current: ~1400G)
- [ ] Level shows (current: 9 Adept)
- [ ] Class shows (current: coding)
- **State needed:** Normal HP/MP/XP values. Avoid 0 HP state.

### S04: World Map (10s)
- [ ] MAP tab active
- [ ] Hexagonal site layout renders (Starter Town + 5 custom sites)
- [ ] Fog regions visible (Data & Analytics, DevOps & Infrastructure)
- [ ] Road connections between sites render
- [ ] Hover on sites shows labels
- **State needed:** At least 3-4 defined sites with recognizable names
- **Pre-seed:** Current sites are: Starter Town, Test Science Lab, mail, Tools, Arts, Software. Consider renaming "Test Science Lab" and "mail" to something presentable before recording.

### S05: Skill Constellation (10s)
- [ ] Click on a site with skills (e.g. "Software" or "Tools")
- [ ] SubRegion star graph appears in bottom panel
- [ ] Stars float with animation
- [ ] Hover shows skill names
- **State needed:** Site with multiple skills. "Software" site has 19 skills -- best choice.

### S06: Guild Bulletin Board (10s)
- [ ] GUILD tab shows bulletin board with parchment slots
- [ ] Up to 6 recommended quests displayed on parchments
- [ ] Click a parchment shows quest detail
- [ ] ACCEPT button works
- **State needed:** Map should have recommended quests. Current API returns 5 recommendations.
- **Pre-seed:** Ensure `/api/map` has fresh `recommended_quests`. Refresh map if needed.

### S07: Create Custom Quest (8s)
- [ ] Bottom input "Write a new quest..." visible
- [ ] Type "Learn Docker containerization" (demo/script.md) or "Learn Rust basics" (docs script)
- [ ] Click POST
- [ ] Quest appears in ACTIVE tab
- **State needed:** At least 100G for quest creation cost
- **IMPORTANT:** Current gold is ~1400G. Each creation costs 100G.

### S08: Complete Quest -- SCRIPT NEEDS REWRITE
- ~~[ ] Click DONE to complete~~ **NO DONE BUTTON EXISTS**
- **Alternative options:**
  1. Show quest getting completed via evolution cycle (takes time)
  2. Show the quest in COMPLETED tab and explain the flow verbally
  3. Skip this scene entirely
- **Recommendation:** Change scene to show the quest lifecycle: ACTIVE -> (agent completes it during cycle) -> appears in DONE tab. Show the DONE tab with previously completed quests and their XP/Gold rewards.

### S09: Skill Shop (8s)
- [ ] SHOP tab loads
- [ ] Skills list renders with categories
- [ ] Source tabs work (ALL, community, filesystem, etc.)
- [ ] Search bar works
- **State needed:** Hub search works (`/api/hub/search`). Tested OK.

### S10: Tavern Group Chat (10s)
- [ ] TAVERN tab loads
- [ ] Click CHATTER sub-tab at top
- [ ] Ambient NPC messages display
- [ ] NEW GOSSIP button regenerates conversation
- **State needed:** Tavern ambient loaded. `/api/tavern/ambient` returns cached messages.

### S11: Talk to Gus -- SCRIPT PARTIALLY INCORRECT
- [ ] This is NOT group chat input -- it's NPC private chat
- [ ] From NPC gallery, click Gus's CHAT button
- [ ] Type message in private chat dialog
- [ ] Gus replies via LLM
- **Correction:** Gus does not "search X/Twitter" in chat. He answers in character using LLM + game state context. For real X/Twitter data, use the RUMORS tab instead.
- **State needed:** NPC chat endpoint working (verified OK)

### S12: Rumors (8s)
- [ ] In TAVERN scene area, click RUMORS sub-tab (top bar)
- [ ] X/Twitter posts load from `/api/rumors/feed`
- [ ] Posts show author, text, likes
- [ ] Search bar filters results
- **State needed:** Rumors endpoint working (verified OK, returns real X/Twitter posts about Hermes Agent)

### S13: NPC Bio Card (8s)
- [ ] Click NPC portrait (e.g. Lyra)
- [ ] Bio card shows: portrait, name, title, trait, lore text
- [ ] BACK button returns to gallery
- **State needed:** NPC images loaded at `/npc/*.png`

### S14: NPC Private Chat (12s)
- [ ] From gallery, click CHAT on Orin (the Sage)
- [ ] Type "What should I focus on next?"
- [ ] Orin replies in character with game-state-aware advice
- **State needed:** NPC chat LLM working. Uses Codex OAuth + Clash proxy.
- **Risk:** If Codex auth expires or proxy is down, NPC chat fails. Test immediately before recording.

### S15: Inventory / Bag (10s)
- [ ] Right side panel, BAG tab
- [ ] 7 items currently in bag (config, map, gossip, cycle-log, quest-skill, rust-skill, state-snapshot)
- [ ] Click item shows detail (name, rarity, description)
- [ ] SHOW TO NPC button visible on item detail
- **State needed:** Bag items exist. Current API returns 7 items.

### S16: Chronicle Feedback (10s)
- [ ] Adventure Log (right side) shows event timeline
- [ ] Hover event shows thumbs up/down buttons
- [ ] Only certain event types are feedbackable: skill_drop, cycle_end, quest_complete, train_start
- [ ] Click thumbs up sends positive feedback
- **State needed:** Recent events in timeline. Currently 45+ events available.
- **NOTE:** HP/MP bar change after feedback may not be visually dramatic. Consider pointing this out verbally.

### S17: Forget Skill (8s)
- [ ] SKILLS panel (right side)
- [ ] Click a skill to see detail
- [ ] FORGET button with confirmation
- **WARNING:** This ACTUALLY DELETES the skill from filesystem and DB.
- **Pre-seed:** If you want to demo this, pick a disposable skill (e.g. "onchain" or "find-nearby"). Or skip this scene.

### S18: Evolution Cycle (15s)
- [ ] MAP tab, click a defined site (e.g. "Software")
- [ ] In SubRegion bottom panel, click CYCLE button
- [ ] Loading state shows
- [ ] Cycle starts (returns to idle after a while)
- **State needed:** No cycle currently running (status: idle -- verified OK)
- **Risk:** Cycle execution takes real time (64-410 seconds based on history). Consider starting it and cutting to the result.

### S19: Telegram Notification (8s)
- [ ] Pre-capture a screenshot of Telegram showing cycle notification
- **State needed:** Screenshot already taken or take one after a test cycle

### S20: Closing (8s)
- [ ] Return to full dashboard view
- [ ] Fade to black
- **State needed:** None

---

## Pre-Recording Data Seeding Checklist

### Must Do Before Recording

- [ ] **Clean up test quests:** Cancel or delete junk quests (AAAA..., `<script>alert(1)</script>`, test quests). Many cancelled/failed test quests pollute the DONE/FAILED/CANCELED tabs.
- [ ] **Rename ugly sites:** "Test Science Lab" -> something like "Research" or "Laboratory"; "mail" -> "Communications" or just delete it
- [ ] **Verify gold >= 500G:** Need enough for quest creation (100G) + potentially retry (50G) + potions demo if needed. Current: ~1400G, sufficient.
- [ ] **Verify HP/MP not at 0:** Current HP=140/140, MP=100/100. Good.
- [ ] **Test NPC chat once:** Send a test message to verify Codex auth + Clash proxy still works
- [ ] **Test rumors feed:** Verify X/Twitter API still returning results
- [ ] **Load the page once:** Warm up all API calls, check no console errors
- [ ] **Check all animated backgrounds load:** map-bg, guild-bg (bulletin), npc-bg (tavern), shop-bg

### Nice to Have

- [ ] **Run one cycle before recording:** Ensures fresh events in Chronicle
- [ ] **Have at least 1 active quest:** For demo of quest lifecycle. Current: 2 active quests + 1 test quest.
- [ ] **Screenshot Telegram notification:** For S19
- [ ] **Decide on GitHub URL:** Memory says `nemoaigc/hermes-quest`, script.md says `nemoverse/hermes-quest`. Pick one.

---

## Recording Environment

- **URL:** http://118.196.105.22:8420
- **Resolution:** 1280x720 (per Playwright config in docs script)
- **Browser:** Chromium via Playwright
- **Audio:** 8-bit sound effects (pre-prepared in `demo/audio/`)
- **Post-processing:** ffmpeg merge + SRT subtitles (`demo/subtitles.srt`)
