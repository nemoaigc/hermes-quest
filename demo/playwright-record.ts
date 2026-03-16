/**
 * Hermes Quest Demo -- Playwright Automation Script
 *
 * Records a ~5 minute walkthrough of all 9 major scenes.
 * Follows docs/demo-video-script.md scene by scene.
 *
 * Layout reference (1280x720):
 *   Left column  (0-240px):  CharacterPanel (top) + Chronicle/AdventureLog (bottom)
 *   Center       (242-998px): CenterTabs (tab bar + scene + bottom info)
 *   Right column (1000-1280px): SkillPanel (top) + Inventory (bottom)
 *
 * Tab bar buttons: MAP | GUILD | SHOP | TAVERN
 * Tavern scene sub-tabs: CHATTER | RUMORS
 * NPC gallery: 5 NPCs (Lyra, Aldric, Kael, Gus, Orin) with CHAT buttons
 * Guild bottom: quest list + input "Write a new quest..." + POST button
 *
 * Usage:
 *   npx tsx playwright-record.ts
 *
 * Output:
 *   recordings/*.webm  -- raw video
 *   subtitles.srt      -- auto-generated subtitle file
 *   narration.json     -- timestamp data for post-processing
 */

import { chromium, type Page, type BrowserContext } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

// --- Config ---
const BASE_URL = process.env.QUEST_BASE_URL || 'http://localhost:8420'
const DEMO_DIR = '/Users/nemo/Documents/project/hermes/demo'
const VIDEO_DIR = path.join(DEMO_DIR, 'recordings')
const SRT_PATH = path.join(DEMO_DIR, 'subtitles.srt')
const NARRATION_PATH = path.join(DEMO_DIR, 'narration.json')

const WIDTH = 1280
const HEIGHT = 720

// --- Types ---
interface SubtitleEntry {
  id: string
  subtitle: string
  narration: string
}

interface Timestamp extends SubtitleEntry {
  start: number
  end: number
}

interface Scene {
  id: string
  subtitle: string
  narration?: string
  action: (page: Page) => Promise<void>
}

// --- State ---
const timestamps: Timestamp[] = []
let t0 = 0

// =============================================================================
//  HELPERS
// =============================================================================

async function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

/** Smooth cubic-ease mouse movement */
async function smoothMove(
  page: Page,
  x1: number, y1: number,
  x2: number, y2: number,
  steps = 15, totalMs = 400,
) {
  const stepDelay = totalMs / steps
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    const x = x1 + (x2 - x1) * ease
    const y = y1 + (y2 - y1) * ease
    await page.mouse.move(x, y)
    await wait(stepDelay)
  }
}

/** Click a tab button by exact text */
async function clickTab(page: Page, label: string, timeout = 5000) {
  const btn = page.locator(`button`).filter({ hasText: new RegExp(`^${label}$`) }).first()
  try {
    await btn.waitFor({ state: 'visible', timeout })
    await btn.click()
    return true
  } catch {
    console.warn(`  [warn] Tab "${label}" not found, trying broader match`)
    const fallback = page.locator(`button:has-text("${label}")`).first()
    try {
      await fallback.waitFor({ state: 'visible', timeout: 2000 })
      await fallback.click()
      return true
    } catch {
      console.warn(`  [warn] Tab "${label}" not clickable`)
      return false
    }
  }
}

/** Click an RpgButton by text */
async function clickRpgButton(page: Page, text: string, timeout = 3000) {
  const btn = page.locator(`button:has-text("${text}")`).first()
  try {
    await btn.waitFor({ state: 'visible', timeout })
    await btn.click()
    return true
  } catch {
    console.warn(`  [warn] Button "${text}" not found`)
    return false
  }
}

/** Type text character-by-character for visual effect */
async function slowType(page: Page, selector: string, text: string, charDelay = 80) {
  const el = page.locator(selector).first()
  try {
    await el.waitFor({ state: 'visible', timeout: 3000 })
    await el.click()
    for (const ch of text) {
      await el.pressSequentially(ch, { delay: charDelay })
    }
  } catch {
    console.warn(`  [warn] Could not type into "${selector}"`)
  }
}

/** Wait for NPC chat response -- poll for loading indicator to disappear */
async function waitForNpcReply(page: Page, maxWait = 20000) {
  const start = Date.now()
  await wait(1500)
  while (Date.now() - start < maxWait) {
    // The loading state shows "..." with font-style: italic
    const loadingDots = page.locator('div').filter({ hasText: /^\.\.\.$/ }).first()
    const isLoading = await loadingDots.isVisible().catch(() => false)
    if (!isLoading) {
      // Check that at least one NPC message beyond the greeting exists
      const npcMsgs = await page.locator('div').filter({ hasText: /^GUS/ }).count().catch(() => 0)
      if (npcMsgs >= 2) break
    }
    await wait(800)
  }
  await wait(2000) // extra buffer for visual effect
}

/** Record a scene: log timing, execute action, save timestamp */
async function scene(page: Page, s: Scene) {
  const start = Date.now() - t0
  console.log(`\n[${(start / 1000).toFixed(1)}s] === ${s.id} ===`)
  console.log(`  Subtitle: ${s.subtitle}`)
  await s.action(page)
  const end = Date.now() - t0
  timestamps.push({
    id: s.id,
    start,
    end,
    subtitle: s.subtitle,
    narration: s.narration || s.subtitle,
  })
  console.log(`  Duration: ${((end - start) / 1000).toFixed(1)}s`)
}

// --- Layout coordinates (1280x720) ---
// Left panel: x=0..240
// Center panel: x=242..998 (tab bar at top ~y=30, scene ~y=40..400, bottom info ~y=402..720)
// Right panel: x=1000..1280

// Character panel items (left column):
const CHAR = {
  avatar: { x: 80, y: 115 },
  name: { x: 180, y: 95 },
  hpBar: { x: 120, y: 195 },
  mpBar: { x: 120, y: 222 },
  xpBar: { x: 120, y: 250 },
  understanding: { x: 120, y: 280 },
  stats: { x: 120, y: 320 },
}

// Center tab bar (y ~ 32):
const TABS = {
  map: { x: 400, y: 32 },
  guild: { x: 520, y: 32 },
  shop: { x: 640, y: 32 },
  tavern: { x: 760, y: 32 },
}

// Center scene area (x=242..998, y=55..385):
const SCENE = {
  center: { x: 620, y: 220 },
  topLeft: { x: 350, y: 130 },
  topRight: { x: 820, y: 130 },
  botLeft: { x: 350, y: 320 },
  botRight: { x: 820, y: 320 },
}

// Bottom info area (x=242..998, y=402..720):
const BOTTOM = {
  center: { x: 620, y: 560 },
  left: { x: 350, y: 560 },
  right: { x: 820, y: 560 },
}

// Chronicle panel (left, below character, y~380..680):
const CHRONICLE = {
  title: { x: 120, y: 385 },
  event1: { x: 120, y: 420 },
  event2: { x: 120, y: 455 },
  event3: { x: 120, y: 490 },
  thumbsUp: { x: 225, y: 420 }, // feedback buttons appear at right edge
}

// Right panel (skill/bag):
const RIGHT = {
  skills: { x: 1140, y: 200 },
  inventory: { x: 1140, y: 520 },
}

// =============================================================================
//  MAIN
// =============================================================================
async function main() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true })
  // Clean old recordings
  for (const f of fs.readdirSync(VIDEO_DIR)) {
    if (f.endsWith('.webm')) fs.unlinkSync(path.join(VIDEO_DIR, f))
  }

  console.log('Launching browser (headless, 1280x720)...')
  const browser = await chromium.launch({ headless: true })
  const context: BrowserContext = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: VIDEO_DIR, size: { width: WIDTH, height: HEIGHT } },
  })
  const page = await context.newPage()
  t0 = Date.now()

  // ==========================================================================
  // SCENE 1: Opening -- Black screen -> Dashboard loads (0:00 - 0:15)
  // SUBTITLE: "如果 AI Agent 是一个 RPG 冒险者..."
  // SUBTITLE: "...它的每次学习，都是一次成长。"
  // SUBTITLE: "Hermes Quest -- 让 Agent 进化看得见。"
  // AUDIO: intro.wav
  // ==========================================================================

  await scene(page, {
    id: 'S01-opening',
    subtitle: '如果 AI Agent 是一个 RPG 冒险者...',
    narration: '如果 AI Agent 是一个 RPG 冒险者，它的每次学习，都是一次成长。',
    async action(p) {
      // Navigate -- will show loading screen first, then dashboard
      await p.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      // Wait for loading screen to finish -> dashboard-grid appears
      await p.waitForSelector('.dashboard-grid', { timeout: 30000 }).catch(() => {
        console.warn('  [warn] dashboard-grid not found, proceeding...')
      })
      // Let the full UI render + animated backgrounds initialize
      await wait(5000)
    },
  })

  // --- SUBTITLE MARKER: 0:05 "...它的每次学习，都是一次成长。" ---
  await scene(page, {
    id: 'S01-tagline',
    subtitle: 'Hermes Quest -- 让 Agent 进化看得见。',
    narration: 'Hermes Quest -- 让 Agent 进化看得见。',
    async action(p) {
      // Slow pan across dashboard overview
      await smoothMove(p, 640, 360, 300, 200, 20, 800)
      await wait(2000)
      await smoothMove(p, 300, 200, 900, 400, 25, 1200)
      await wait(2000)
      await smoothMove(p, 900, 400, 640, 360, 15, 600)
      await wait(1500)
    },
  })

  // ==========================================================================
  // SCENE 2: Character Panel (0:15 - 0:35)
  // Focus on HP/MP/XP bars in the left panel
  // SUBTITLE: "HP = 可靠性 / MP = 士气 / XP = 经验"
  // AUDIO: ambient.wav (low volume)
  // ==========================================================================

  // --- SUBTITLE MARKER: "HP = 可靠性。用户满意就涨，犯错就掉。" ---
  await scene(page, {
    id: 'S02-hp',
    subtitle: 'HP = 可靠性。用户满意就涨，犯错就掉。',
    narration: 'HP 代表可靠性。用户满意就涨，犯错就掉。',
    async action(p) {
      // Move to CHARACTER panel title
      await smoothMove(p, 640, 360, 120, 65, 20, 600)
      await wait(1000)
      // Hover the avatar
      await smoothMove(p, 120, 65, CHAR.avatar.x, CHAR.avatar.y, 12, 400)
      await wait(1500)
      // Hover the HP bar
      await smoothMove(p, CHAR.avatar.x, CHAR.avatar.y, CHAR.hpBar.x, CHAR.hpBar.y, 12, 400)
      await wait(2500)
    },
  })

  // --- SUBTITLE MARKER: "MP = 士气。反馈驱动，实时变化。" ---
  await scene(page, {
    id: 'S02-mp',
    subtitle: 'MP = 士气。反馈驱动，实时变化。',
    narration: 'MP 代表士气。反馈驱动，实时变化。',
    async action(p) {
      await smoothMove(p, CHAR.hpBar.x, CHAR.hpBar.y, CHAR.mpBar.x, CHAR.mpBar.y, 10, 300)
      await wait(2500)
    },
  })

  // --- SUBTITLE MARKER: "XP = 经验。每次训练都在积累。" ---
  await scene(page, {
    id: 'S02-xp',
    subtitle: 'XP = 经验。每次训练都在积累。',
    narration: 'XP 代表经验。每次训练都在积累。',
    async action(p) {
      await smoothMove(p, CHAR.mpBar.x, CHAR.mpBar.y, CHAR.xpBar.x, CHAR.xpBar.y, 10, 300)
      await wait(2000)
      // Pan down to understanding + stats
      await smoothMove(p, CHAR.xpBar.x, CHAR.xpBar.y, CHAR.stats.x, CHAR.stats.y, 10, 400)
      await wait(2000)
    },
  })

  // ==========================================================================
  // SCENE 3: World Map (0:35 - 1:15)
  // MAP tab, hover continents, hover fog, trace paths
  // SUBTITLE: "每个大陆 = Agent 的一个工作流领域"
  // AUDIO: whoosh.wav (on tab switch)
  // ==========================================================================

  // --- SUBTITLE MARKER: "每个大陆 = Agent 的一个工作流领域" ---
  await scene(page, {
    id: 'S03-map-overview',
    subtitle: '每个大陆 = Agent 的一个工作流领域',
    narration: '世界地图展示 Agent 的知识版图。每个大陆是一个工作流领域。',
    async action(p) {
      // MAP tab should already be active (default), click to ensure
      await clickTab(p, 'MAP')
      await wait(2500)

      // Move cursor to center of map scene area
      await smoothMove(p, CHAR.stats.x, CHAR.stats.y, SCENE.center.x, SCENE.center.y, 20, 600)
      await wait(2000)
    },
  })

  // --- SUBTITLE MARKER: "Software, Research, Automation, Creative Arts..." ---
  await scene(page, {
    id: 'S03-map-continents',
    subtitle: 'Software Engineering, Research, Automation, Creative Arts...',
    narration: 'Software Engineering, Research, Automation, Creative Arts...',
    async action(p) {
      // Hover each continent sprite in map
      // Map layout: starter-town center, site-1 top-left, site-2 top-right,
      //             site-3 bot-left, site-4 bot-right, site-5 top-center
      // Parchment area approx x=350..850, y=80..380 within scene area (offset by scene top ~y=55)

      // Hover site-1 (top-left area)
      await smoothMove(p, SCENE.center.x, SCENE.center.y, 400, 140, 15, 500)
      await wait(2000)
      // Hover site-5 (top-center)
      await smoothMove(p, 400, 140, 600, 140, 15, 500)
      await wait(2000)
      // Hover site-2 (top-right)
      await smoothMove(p, 600, 140, 810, 140, 15, 500)
      await wait(2000)
      // Hover starter-town (center)
      await smoothMove(p, 810, 140, 620, 250, 15, 500)
      await wait(2000)
    },
  })

  // --- SUBTITLE MARKER: "迷雾区域？那是 Agent 尚未探索的技能领域。" ---
  await scene(page, {
    id: 'S03-map-fog',
    subtitle: '迷雾区域？那是 Agent 尚未探索的技能领域。',
    narration: '迷雾区域代表 Agent 尚未探索的技能领域。',
    async action(p) {
      // Hover bottom-left and bottom-right fog/continent areas
      await smoothMove(p, 620, 250, 400, 340, 15, 500)
      await wait(2500)
      await smoothMove(p, 400, 340, 810, 340, 15, 500)
      await wait(2500)
    },
  })

  // --- SUBTITLE MARKER: "路径连接相关领域 -- 知识是互通的。" ---
  await scene(page, {
    id: 'S03-map-paths',
    subtitle: '路径连接相关领域 -- 知识是互通的。',
    narration: '路径连接相关领域。知识是互通的。',
    async action(p) {
      // Trace a path between continents
      await smoothMove(p, 810, 340, 400, 140, 25, 1000)
      await wait(2000)
      await smoothMove(p, 400, 140, 620, 250, 15, 600)
      await wait(2000)
    },
  })

  // ==========================================================================
  // SCENE 4: Constellation Skill Graph (1:15 - 1:50)
  // Click a continent -> SubRegionGraph (star constellation in bottom panel)
  // SUBTITLE: "点进大陆 -> 技能星座图"
  // AUDIO: click.wav
  // ==========================================================================

  // --- SUBTITLE MARKER: "点进大陆 -> 技能星座图" ---
  await scene(page, {
    id: 'S04-constellation',
    subtitle: '点进大陆 -> 技能星座图。',
    narration: '点击大陆进入技能星座图。每颗星星是一个已学技能。',
    async action(p) {
      // Click on a continent sprite -- find any img in the map scene that has 'continent' in src
      const continentImg = p.locator('img[src*="continent"]').first()
      if (await continentImg.isVisible().catch(() => false)) {
        await continentImg.click()
      } else {
        // Fallback: click in the top-left site area
        await p.mouse.click(400, 140)
      }
      await wait(3000)
    },
  })

  // --- SUBTITLE MARKER: "每颗星星 = 一个已学技能。同色聚类，形成星座。" ---
  await scene(page, {
    id: 'S04-skill-stars',
    subtitle: '每颗星星 = 一个已学技能。同色聚类，形成星座。',
    narration: '每颗星星代表一个已学技能。同色聚类，自动形成星座。',
    async action(p) {
      // The SubRegionGraph appears in the bottom panel (y~402..700)
      // It has a canvas element -- hover over it to trigger star labels
      // Bottom info area center approx x=620, y=500..650

      // Hover across the constellation canvas
      await smoothMove(p, 620, 420, 450, 500, 12, 400)
      await wait(1500)
      await smoothMove(p, 450, 500, 550, 550, 10, 300)
      await wait(1500)
      await smoothMove(p, 550, 550, 700, 520, 10, 300)
      await wait(1500)
      await smoothMove(p, 700, 520, 620, 600, 10, 300)
      await wait(1500)
      await smoothMove(p, 620, 600, 500, 580, 10, 300)
      await wait(1500)
      await smoothMove(p, 500, 580, 750, 530, 10, 300)
      await wait(1500)
    },
  })

  // --- SUBTITLE MARKER: "hover 查看：git, docker, javascript, python..." ---
  await scene(page, {
    id: 'S04-hover-skills',
    subtitle: 'hover 查看：git, docker, javascript, python...',
    narration: 'Hover 查看每个技能：git, docker, javascript, python...',
    async action(p) {
      // Continue hovering to show more tooltip labels
      await smoothMove(p, 750, 530, 480, 480, 8, 250)
      await wait(2000)
      await smoothMove(p, 480, 480, 650, 560, 8, 250)
      await wait(2000)
      await smoothMove(p, 650, 560, 580, 640, 8, 250)
      await wait(2000)
    },
  })

  // ==========================================================================
  // SCENE 5: NPC Tavern (1:50 - 2:50)
  // Switch to TAVERN tab, click CHATTER, then gallery, click Gus's CHAT, send msg
  // SUBTITLE: "酒馆里有 5 个 NPC，各司其职。"
  // AUDIO: whoosh.wav, typing.wav, confirm.wav
  // ==========================================================================

  // --- SUBTITLE MARKER: "酒馆里有 5 个 NPC，各司其职。" ---
  await scene(page, {
    id: 'S05-tavern-enter',
    subtitle: '酒馆里有 5 个 NPC，各司其职。',
    narration: '酒馆里有 5 个 NPC，每个都有独特人设和专长。',
    async action(p) {
      await clickTab(p, 'TAVERN')
      await wait(3000)

      // The scene area now shows tavern background with CHATTER / RUMORS sub-tabs
      // Bottom panel shows NPC gallery with 5 NPCs
      // Hover each NPC portrait in the bottom panel
      // 5 NPCs evenly spaced across bottom: approx x=340,440,540,640,740 at y~610
      const npcXPositions = [370, 470, 570, 670, 770]
      const npcY = 610
      for (const x of npcXPositions) {
        await smoothMove(p, x - 80, npcY, x, npcY, 10, 300)
        await wait(1200)
      }
    },
  })

  // --- SUBTITLE MARKER: "Gus 是酒保 -- 他能搜 X/Twitter 的实时传闻。" ---
  await scene(page, {
    id: 'S05-gus-intro',
    subtitle: 'Gus 是酒保 -- 他能搜 X/Twitter 的实时传闻。',
    narration: 'Gus 是酒保，他能搜索 X/Twitter 的实时传闻。',
    async action(p) {
      // Click on Gus's portrait (4th NPC) to show bio card
      const gusImg = p.locator('img[alt="Gus"]').first()
      if (await gusImg.isVisible().catch(() => false)) {
        await gusImg.click()
        await wait(3000)
      } else {
        // Fallback: click 4th NPC position
        await p.mouse.click(670, 610)
        await wait(3000)
      }
    },
  })

  // --- SUBTITLE MARKER: [用户输入]: "最近有啥 AI 传闻" ---
  await scene(page, {
    id: 'S05-gus-chat',
    subtitle: '最近有啥 AI 传闻',
    narration: '和酒保聊天。Gus 能搜索 X/Twitter 的实时新闻。',
    async action(p) {
      // Click Gus's CHAT button (4th NPC)
      // First, the gallery might have CHAT buttons -- find them
      const chatBtns = p.locator('button:has-text("CHAT")')
      const count = await chatBtns.count()
      if (count >= 4) {
        // Gus is the 4th NPC (index 3)
        await chatBtns.nth(3).click()
      } else if (count > 0) {
        // Any CHAT button
        await chatBtns.last().click()
      }
      await wait(2000)

      // Type the message in the chat input
      // RpgDialogInline has input with placeholder "Talk to Gus..."
      const chatInput = p.locator('input[placeholder*="Talk to"]').first()
      if (await chatInput.isVisible().catch(() => false)) {
        await chatInput.click()
        await wait(500)
        const msg = '最近有啥 AI 传闻'
        for (const ch of msg) {
          await chatInput.pressSequentially(ch, { delay: 70 })
        }
        await wait(1000)

        // Click SEND button
        await clickRpgButton(p, 'SEND')
        await wait(1500)

        // Wait for NPC response (LLM call, may take 10-15s)
        console.log('  Waiting for NPC response...')
        await waitForNpcReply(p, 20000)
      }
    },
  })

  // --- SUBTITLE MARKER: "NPC 不是花瓶 -- 每个都接入真实数据 + LLM。" ---
  await scene(page, {
    id: 'S05-gus-reply',
    subtitle: 'NPC 不是花瓶 -- 每个都接入真实数据 + LLM。',
    narration: 'NPC 不是花瓶。每个都接入真实数据和 LLM。',
    async action(p) {
      // Let the reply soak in -- scroll to see it
      await wait(3000)
      // Slowly hover over the response text area
      await smoothMove(p, 620, 560, 620, 500, 10, 300)
      await wait(2000)
    },
  })

  // ==========================================================================
  // SCENE 5b: Rumors tab (brief)
  // SUBTITLE: (part of tavern exploration)
  // ==========================================================================

  await scene(page, {
    id: 'S05-rumors',
    subtitle: 'RUMORS -- 来自 X/Twitter 的实时情报。',
    narration: 'Rumors 面板展示来自 X/Twitter 的实时 AI 情报。',
    async action(p) {
      // Go back from chat to tavern gallery
      await clickRpgButton(p, 'BACK').catch(() => {})
      await wait(500)

      // Click RUMORS sub-tab in the tavern scene area (top of scene)
      await clickTab(p, 'RUMORS')
      await wait(4000)

      // Scroll through rumors
      await smoothMove(p, 620, 200, 620, 280, 10, 300)
      await wait(2000)
      await p.mouse.wheel(0, 150)
      await wait(2000)
      await p.mouse.wheel(0, -150)
      await wait(1500)
    },
  })

  // ==========================================================================
  // SCENE 6: Guild Quest Board (2:50 - 3:30)
  // GUILD tab, bulletin board, create quest "学习 Rust 基础"
  // SUBTITLE: "公会任务板 -- 你可以给 Agent 布置学习任务。"
  // AUDIO: click.wav, confirm.wav
  // ==========================================================================

  // --- SUBTITLE MARKER: "公会任务板 -- 推荐任务和自定义任务" ---
  await scene(page, {
    id: 'S06-guild-enter',
    subtitle: '公会任务板 -- 推荐任务和自定义任务',
    narration: '公会任务板会根据 Agent 的弱项推荐学习任务。',
    async action(p) {
      await clickTab(p, 'GUILD')
      await wait(3000)

      // The bulletin board shows quest parchments at fixed positions
      // Hover the quest parchments (3x2 grid in the scene area)
      // Row 1: ~y=180, Row 2: ~y=300
      // Col 1: ~x=430, Col 2: ~x=560, Col 3: ~x=700
      await smoothMove(p, 620, 360, 430, 180, 12, 400)
      await wait(1500)
      await smoothMove(p, 430, 180, 560, 180, 10, 300)
      await wait(1500)
      await smoothMove(p, 560, 180, 700, 180, 10, 300)
      await wait(1500)
      // Row 2
      await smoothMove(p, 700, 180, 430, 300, 10, 400)
      await wait(1500)
      await smoothMove(p, 430, 300, 560, 300, 10, 300)
      await wait(1500)
    },
  })

  // --- SUBTITLE MARKER: "学习 Rust 基础" ---
  await scene(page, {
    id: 'S06-create-quest',
    subtitle: '学习 Rust 基础',
    narration: '你也可以给 Agent 布置自定义学习任务。',
    async action(p) {
      // Quest creation input in bottom panel: placeholder "Write a new quest..."
      const questInput = p.locator('input[placeholder*="quest"]').first()
      if (await questInput.isVisible().catch(() => false)) {
        await questInput.click()
        await wait(500)
        const text = '学习 Rust 基础'
        for (const ch of text) {
          await questInput.pressSequentially(ch, { delay: 100 })
        }
        await wait(1500)

        // Click POST button
        await clickRpgButton(p, 'POST')
        await wait(3000)
      } else {
        console.warn('  [warn] Quest input not found')
        await wait(2000)
      }
    },
  })

  // --- SUBTITLE MARKER: "任务创建！Agent 会在下个 cycle 开始学习。" ---
  await scene(page, {
    id: 'S06-quest-created',
    subtitle: '任务创建！Agent 会在下个 cycle 开始学习。',
    narration: '任务创建成功！Agent 会在下个进化周期开始学习。',
    async action(p) {
      // Show the quest in the active list
      await wait(3000)

      // Clean up: cancel the test quest
      const cancelBtn = p.locator('button:has-text("CANCEL")').first()
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click()
        await wait(2000)
      }
    },
  })

  // ==========================================================================
  // SCENE 7: Feedback System / Chronicle (3:30 - 4:00)
  // Right-side Chronicle panel, hover events, click thumbs up
  // SUBTITLE: "冒险日志实时记录 Agent 的每个动作。"
  // AUDIO: level-up.wav (on thumbs up)
  // ==========================================================================

  // --- SUBTITLE MARKER: "冒险日志实时记录 Agent 的每个动作。" ---
  await scene(page, {
    id: 'S07-chronicle',
    subtitle: '冒险日志实时记录 Agent 的每个动作。',
    narration: '冒险日志记录 Agent 的每个动作。给反馈直接影响 HP 和 MP。',
    async action(p) {
      // Move to the Chronicle panel (left panel, below character)
      // Chronicle title "CHRONICLE" at approx y=385
      await smoothMove(p, 620, 560, CHRONICLE.title.x, CHRONICLE.title.y, 18, 600)
      await wait(2000)

      // Hover individual events
      await smoothMove(p, CHRONICLE.title.x, CHRONICLE.title.y, CHRONICLE.event1.x, CHRONICLE.event1.y, 10, 300)
      await wait(2000)
      await smoothMove(p, CHRONICLE.event1.x, CHRONICLE.event1.y, CHRONICLE.event2.x, CHRONICLE.event2.y, 8, 250)
      await wait(2000)
      await smoothMove(p, CHRONICLE.event2.x, CHRONICLE.event2.y, CHRONICLE.event3.x, CHRONICLE.event3.y, 8, 250)
      await wait(2000)
    },
  })

  // --- SUBTITLE MARKER: "觉得不错？给个正向反馈 -- HP 恢复，士气提升。" ---
  await scene(page, {
    id: 'S07-feedback',
    subtitle: '学到了新技能？给个正向反馈 -- HP 恢复，士气提升。',
    narration: '学到了新技能？给个正向反馈。觉得不行？Agent 收到信号，调整方向。',
    async action(p) {
      // Hover back to first event to make feedback buttons visible
      await smoothMove(p, CHRONICLE.event3.x, CHRONICLE.event3.y, CHRONICLE.event1.x, CHRONICLE.event1.y, 8, 200)
      await wait(1500)

      // Try to click the thumbs-up button (emoji button with title "Good outcome")
      const thumbUp = p.locator('button[title="Good outcome"]').first()
      if (await thumbUp.isVisible().catch(() => false)) {
        await thumbUp.click()
        await wait(3000)
      } else {
        // Try to find any thumbs-up button
        const thumbBtn = p.locator('button').filter({ hasText: /^...$/ }).first()
        if (await thumbBtn.isVisible().catch(() => false)) {
          await thumbBtn.click()
          await wait(2000)
        }
        await wait(2000)
      }
      await wait(2000)
    },
  })

  // ==========================================================================
  // SCENE 8: Bag + Shop (4:00 - 4:25)
  // Right panel inventory, then SHOP tab
  // SUBTITLE: "背包里是 Agent 收集的产出物。"
  // AUDIO: whoosh.wav
  // ==========================================================================

  // --- SUBTITLE MARKER: "背包里是 Agent 收集的产出物。" ---
  await scene(page, {
    id: 'S08-bag',
    subtitle: '背包里是 Agent 收集的产出物。',
    narration: '背包里是 Agent 在进化过程中收集的配置文件、研究笔记、训练报告。',
    async action(p) {
      // Hover the right panel inventory area
      await smoothMove(p, 120, 420, RIGHT.inventory.x, RIGHT.inventory.y, 18, 600)
      await wait(2000)

      // Click on some inventory items
      await smoothMove(p, RIGHT.inventory.x, RIGHT.inventory.y, 1140, 480, 8, 200)
      await wait(1500)
      await p.mouse.click(1140, 480)
      await wait(2000)
      await smoothMove(p, 1140, 480, 1140, 540, 8, 200)
      await wait(1500)
      await p.mouse.click(1140, 540)
      await wait(2000)
    },
  })

  // --- SUBTITLE MARKER: "技能商店 -- 从社区安装新技能。" ---
  await scene(page, {
    id: 'S08-shop',
    subtitle: '技能商店 -- 从社区安装新技能。',
    narration: '商店里是社区技能库，可以一键安装到 Agent。',
    async action(p) {
      await clickTab(p, 'SHOP')
      await wait(3000)

      // Hover the shop shelf items (3x3 grid)
      // Row 1: ~y=200, Row 2: ~y=310, Row 3: ~y=430
      // Col 1: ~x=430, Col 2: ~x=560, Col 3: ~x=700
      await smoothMove(p, 1140, 540, 430, 200, 18, 600)
      await wait(1500)
      await smoothMove(p, 430, 200, 560, 200, 10, 300)
      await wait(1500)
      await smoothMove(p, 560, 200, 700, 200, 10, 300)
      await wait(1500)
      // Row 2
      await smoothMove(p, 700, 200, 430, 310, 10, 300)
      await wait(1500)
      await smoothMove(p, 430, 310, 560, 310, 10, 300)
      await wait(1500)
      // Scroll down
      await p.mouse.move(620, 300)
      await p.mouse.wheel(0, 200)
      await wait(2000)
      await p.mouse.wheel(0, -200)
      await wait(1500)
    },
  })

  // ==========================================================================
  // SCENE 9: Closing (4:25 - 4:50)
  // Return to MAP, overview, fade out
  // SUBTITLE: "Hermes Quest -- 让 AI Agent 的进化，成为一场看得见的冒险。"
  // AUDIO: intro.wav variant (closing melody)
  // ==========================================================================

  // --- SUBTITLE MARKER: "进化周期 -- Agent 自主分析弱点、训练技能、升级" ---
  await scene(page, {
    id: 'S09-back-to-map',
    subtitle: '进化周期 -- Agent 自主分析弱点、训练技能、升级',
    narration: '每两小时自动触发一次进化周期。Agent 分析对话历史、发现工作模式、训练新技能。',
    async action(p) {
      await clickTab(p, 'MAP')
      await wait(3000)

      // Click a continent to show the CYCLE button in bottom panel
      const continentImg = p.locator('img[src*="continent"]').first()
      if (await continentImg.isVisible().catch(() => false)) {
        await continentImg.click()
        await wait(2000)
      }

      // Hover the CYCLE button
      const cycleBtn = p.locator('button:has-text("CYCLE")').first()
      if (await cycleBtn.isVisible().catch(() => false)) {
        const box = await cycleBtn.boundingBox()
        if (box) {
          await smoothMove(p, 620, 300, box.x + box.width / 2, box.y + box.height / 2, 12, 400)
          await wait(2500)
        }
      }
      await wait(2000)
    },
  })

  // --- SUBTITLE MARKER: "Hermes Quest" ---
  await scene(page, {
    id: 'S09-closing-title',
    subtitle: 'Hermes Quest',
    narration: 'Hermes Quest.',
    async action(p) {
      // Pull back to full dashboard overview
      await smoothMove(p, 620, 500, 640, 360, 20, 800)
      await wait(4000)
    },
  })

  // --- SUBTITLE MARKER: "让 AI Agent 的进化，成为一场看得见的冒险。" ---
  await scene(page, {
    id: 'S09-closing-tagline',
    subtitle: '让 AI Agent 的进化，成为一场看得见的冒险。',
    narration: '让 AI Agent 的进化，成为一场看得见的冒险。',
    async action(p) {
      await wait(4000)
    },
  })

  // --- SUBTITLE MARKER: credits ---
  await scene(page, {
    id: 'S09-credits',
    subtitle: 'Built with Claude Code + Gemini + Hermes Agent',
    narration: 'github.com/nemoverse/hermes-quest. Built with Claude Code, Gemini, and Hermes Agent.',
    async action(p) {
      await wait(5000)
    },
  })

  // ==========================================================================
  //  SAVE & CLEANUP
  // ==========================================================================
  console.log('\nClosing context (saving video)...')
  await context.close()
  await browser.close()

  // --- Generate SRT subtitle file ---
  let srt = ''
  timestamps.forEach((t, i) => {
    srt += `${i + 1}\n${fmtSrt(t.start)} --> ${fmtSrt(t.end)}\n${t.subtitle}\n\n`
  })
  fs.writeFileSync(SRT_PATH, srt, 'utf-8')

  // --- Generate narration.json ---
  fs.writeFileSync(NARRATION_PATH, JSON.stringify(timestamps, null, 2), 'utf-8')

  // --- Summary ---
  const totalMs = timestamps[timestamps.length - 1]?.end || 0
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Recording complete!`)
  console.log(`${'='.repeat(50)}`)
  console.log(`  Scenes:    ${timestamps.length}`)
  console.log(`  Duration:  ${(totalMs / 1000).toFixed(0)}s (~${(totalMs / 60000).toFixed(1)} min)`)
  console.log(`  Video:     ${VIDEO_DIR}/`)
  console.log(`  SRT:       ${SRT_PATH}`)
  console.log(`  Narration: ${NARRATION_PATH}`)
  console.log(``)
  console.log(`Next: run ./merge.sh to add audio + subtitles`)
}

// --- SRT timestamp formatter (HH:MM:SS,mmm) ---
function fmtSrt(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const ml = ms % 1000
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ml).padStart(3, '0')}`
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
