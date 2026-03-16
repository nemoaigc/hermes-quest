# Knowledge Map & AI-Driven Architecture Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Hermes Quest from a static RPG dashboard into an AI-driven, dynamically growing knowledge visualization system with parchment-style map, NPC dialog, and quest management.

**Architecture:** Two-layer approach — backend adds new API endpoints (`/api/map`, `/api/npc/chat`, `/api/quest/*`, `/api/bag/*`) and WebSocket message types; frontend replaces WorldMap with parchment KnowledgeMap, adds NPCDialogBar with 3 AI-powered NPCs, replaces QuestBoard with Guild (BulletinBoard + QuestTracker), adds BagPanel, and removes ReflectionBar. Store migrates field names (hp→stability, mp→energy) and adds new state slices for map, NPC, and quest data.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Zustand 5, Vitest (new), FastAPI (backend on server), SVG pixel art

**Spec:** `docs/superpowers/specs/2026-03-13-knowledge-map-redesign.md`

---

## Chunk 1: Store & Types Foundation

### Task 1: Add Vitest and Testing Infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test-utils.ts`

- [ ] **Step 1: Install vitest and dependencies**

```bash
cd /Users/nemo/Documents/project/hermes/hermes-quest-dashboard
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils.ts'],
  },
})
```

- [ ] **Step 3: Create test utils**

Create `src/test-utils.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify vitest runs (no tests yet, should exit clean)**

Run: `npm test`
Expected: "No test files found" or similar clean exit.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test-utils.ts package.json package-lock.json
git commit -m "chore: add vitest testing infrastructure"
```

---

### Task 2: Define New TypeScript Interfaces

**Files:**
- Create: `src/types.ts`
- Test: `src/__tests__/types.test.ts`

- [ ] **Step 1: Write type validation test**

Create `src/__tests__/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import type {
  Continent, SubRegion, Connection, FogRegion,
  RecommendedQuest, KnowledgeMap,
  Quest, QuestStatus, QuestSource,
  BagItem, BagItemType,
  NpcId, NpcMood, NpcChatRequest, NpcChatResponse, NpcAction,
} from '../types'

describe('types', () => {
  it('KnowledgeMap structure is valid', () => {
    const map: KnowledgeMap = {
      version: 1,
      generated_at: '2026-03-13T12:00:00Z',
      continents: [{
        id: 'software-engineering',
        name: 'Software Engineering',
        description: 'Code creation',
        color: '#66BB6A',
        position: { x: 0.25, y: 0.4 },
        size: 0.8,
        sub_regions: [{
          id: 'programming',
          name: 'Programming',
          skills: ['basic-programming'],
          mastery: 0.4,
        }],
      }],
      connections: [{
        from: 'code-review',
        to: 'github-pr-workflow',
        type: 'workflow',
        strength: 0.9,
      }],
      fog_regions: [{
        id: 'fog-1',
        hint: 'Testing & QA',
        position: { x: 0.4, y: 0.2 },
        discovery_condition: 'Acquire a testing-related skill',
      }],
      recommended_quests: [{
        id: 'rec-quest-1',
        title: 'Explore Testing',
        description: 'Learn testing',
        region: 'software-engineering',
        rank: 'B',
        reward_gold: 150,
        reward_xp: 200,
        related_skills: ['tdd'],
      }],
    }
    expect(map.version).toBe(1)
    expect(map.continents).toHaveLength(1)
    expect(map.continents[0].sub_regions[0].mastery).toBe(0.4)
  })

  it('Quest lifecycle statuses are valid', () => {
    const quest: Quest = {
      id: 'quest-1',
      title: 'Test Quest',
      description: 'A test',
      region: 'software-engineering',
      rank: 'B',
      status: 'active',
      progress: 0.0,
      reward_gold: 100,
      reward_xp: 150,
      related_skills: [],
      accepted_at: '2026-03-13T14:00:00Z',
      completed_at: null,
      source: 'bulletin_board',
    }
    expect(quest.status).toBe('active')
    const statuses: QuestStatus[] = ['active', 'in_progress', 'completed', 'failed']
    expect(statuses).toContain(quest.status)
  })

  it('BagItem types are valid', () => {
    const item: BagItem = {
      id: 'completion-1',
      type: 'research_note',
      name: 'TDD Notes',
      description: 'Findings',
      source_quest: 'quest-1',
      created_at: '2026-03-13T14:30:00Z',
      file_path: '~/.hermes/quest/completions/1.md',
      icon: 'scroll',
      rarity: 'common',
    }
    expect(item.type).toBe('research_note')
    const types: BagItemType[] = ['research_note', 'training_report', 'code_snippet', 'map_fragment']
    expect(types).toContain(item.type)
  })

  it('NPC chat request/response shapes are valid', () => {
    const req: NpcChatRequest = {
      npc: 'guild_master',
      message: 'Hello',
      context: {
        active_tab: 'guild',
        selected_bag_items: [],
        selected_region: null,
      },
    }
    expect(req.npc).toBe('guild_master')

    const res: NpcChatResponse = {
      reply: 'Welcome!',
      actions: [{
        type: 'suggest_quest',
        quest: {
          id: 'rec-1', title: 'Test', description: 'desc',
          region: 'se', rank: 'B', reward_gold: 100, reward_xp: 100,
          related_skills: [],
        },
      }],
      npc_mood: 'friendly',
    }
    expect(res.actions).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/types.test.ts`
Expected: FAIL — cannot find module `../types`

- [ ] **Step 3: Create types file**

Create `src/types.ts`:
```ts
// --- Knowledge Map ---

export interface SubRegion {
  id: string
  name: string
  skills: string[]
  mastery: number // 0.0–1.0
}

export interface Continent {
  id: string
  name: string
  description: string
  color: string // hex
  position: { x: number; y: number } // normalized 0–1
  size: number // relative scale 0–1
  sub_regions: SubRegion[]
}

export type ConnectionType = 'workflow' | 'complementary' | 'prerequisite'

export interface Connection {
  from: string // skill ID
  to: string // skill ID
  type: ConnectionType
  strength: number // 0–1
}

export interface FogRegion {
  id: string
  hint: string
  position: { x: number; y: number }
  discovery_condition: string
}

export interface RecommendedQuest {
  id: string
  title: string
  description: string
  region: string
  rank: string // S/A/B/C/D
  reward_gold: number
  reward_xp: number
  related_skills: string[]
}

export interface KnowledgeMap {
  version: number
  generated_at: string
  continents: Continent[]
  connections: Connection[]
  fog_regions: FogRegion[]
  recommended_quests: RecommendedQuest[]
}

// --- Quests ---

export type QuestStatus = 'active' | 'in_progress' | 'completed' | 'failed'
export type QuestSource = 'bulletin_board' | 'npc_dialog' | 'map_exploration'

export interface Quest {
  id: string
  title: string
  description: string
  region: string
  rank: string
  status: QuestStatus
  progress: number // 0.0–1.0
  reward_gold: number
  reward_xp: number
  related_skills: string[]
  accepted_at: string
  completed_at: string | null
  source: QuestSource
}

// --- Bag Items ---

export type BagItemType = 'research_note' | 'training_report' | 'code_snippet' | 'map_fragment'
export type BagItemIcon = 'scroll' | 'book' | 'code' | 'map'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface BagItem {
  id: string
  type: BagItemType
  name: string
  description: string
  source_quest: string | null
  created_at: string
  file_path: string
  icon: BagItemIcon
  rarity: Rarity
}

// --- NPC Dialog ---

export type NpcId = 'guild_master' | 'cartographer' | 'quartermaster'
export type NpcMood = 'friendly' | 'serious' | 'excited'
export type TabId = 'map' | 'guild' | 'shop'

export interface NpcChatRequest {
  npc: NpcId
  message: string
  context: {
    active_tab: TabId
    selected_bag_items: string[]
    selected_region: string | null
  }
}

export interface NpcAction {
  type: 'suggest_quest'
  quest: RecommendedQuest
}

export interface NpcChatResponse {
  reply: string
  actions: NpcAction[]
  npc_mood: NpcMood
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/types.test.ts`
Expected: PASS — all 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/__tests__/types.test.ts
git commit -m "feat: add TypeScript interfaces for knowledge map, quests, bag items, NPC dialog"
```

---

### Task 3: Migrate Store — Rename Fields & Add New State Slices

**Files:**
- Modify: `src/store.ts`
- Test: `src/__tests__/store.test.ts`

- [ ] **Step 1: Write store migration tests**

Create `src/__tests__/store.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store'
import type { KnowledgeMap, Quest, BagItem, NpcChatResponse } from '../types'

describe('store', () => {
  beforeEach(() => {
    useStore.setState({
      state: null,
      events: [],
      skills: [],
      connected: false,
      knowledgeMap: null,
      quests: [],
      bagItems: [],
      npcChat: { messages: [], loading: false },
      activeTab: 'map',
      selectedBagItems: [],
      selectedRegion: null,
    })
  })

  it('AgentState uses stability/energy instead of hp/mp', () => {
    useStore.getState().setState({
      version: 1, name: 'Hermes', level: 2, class: 'artificer', title: 'Novice',
      xp: 50, xp_to_next: 200,
      stability: 80, stability_max: 100,
      energy: 60, energy_max: 80,
      gold: 250, current_region: 'software-engineering',
      regions_unlocked: [], regions_cleared: [],
      skills_count: 5, skill_distribution: {},
      inventory: [], active_quests: [],
      completed_quests: 3, total_cycles: 10,
      started_at: null, last_cycle_at: null,
    })
    const s = useStore.getState().state!
    expect(s.stability).toBe(80)
    expect(s.energy).toBe(60)
    expect(s).not.toHaveProperty('hp')
    expect(s).not.toHaveProperty('mp')
    expect(s).not.toHaveProperty('total_boss_kills')
  })

  it('sets and retrieves knowledge map', () => {
    const map: KnowledgeMap = {
      version: 1, generated_at: '2026-03-13T12:00:00Z',
      continents: [], connections: [], fog_regions: [], recommended_quests: [],
    }
    useStore.getState().setKnowledgeMap(map)
    expect(useStore.getState().knowledgeMap).toEqual(map)
  })

  it('manages quests', () => {
    const quest: Quest = {
      id: 'q1', title: 'Test', description: '', region: '', rank: 'C',
      status: 'active', progress: 0, reward_gold: 100, reward_xp: 100,
      related_skills: [], accepted_at: '', completed_at: null, source: 'bulletin_board',
    }
    useStore.getState().setQuests([quest])
    expect(useStore.getState().quests).toHaveLength(1)
  })

  it('manages bag items', () => {
    const item: BagItem = {
      id: 'b1', type: 'research_note', name: 'Notes', description: '',
      source_quest: null, created_at: '', file_path: '', icon: 'scroll', rarity: 'common',
    }
    useStore.getState().setBagItems([item])
    expect(useStore.getState().bagItems).toHaveLength(1)
  })

  it('manages active tab for NPC context', () => {
    useStore.getState().setActiveTab('guild')
    expect(useStore.getState().activeTab).toBe('guild')
  })

  it('toggles selected bag items', () => {
    useStore.getState().toggleBagItem('item-1')
    expect(useStore.getState().selectedBagItems).toEqual(['item-1'])
    useStore.getState().toggleBagItem('item-1')
    expect(useStore.getState().selectedBagItems).toEqual([])
  })

  it('adds NPC message and sets loading', () => {
    useStore.getState().addNpcMessage('user', 'Hello')
    expect(useStore.getState().npcChat.messages).toHaveLength(1)
    expect(useStore.getState().npcChat.messages[0]).toEqual({ role: 'user', content: 'Hello' })
    useStore.getState().setNpcLoading(true)
    expect(useStore.getState().npcChat.loading).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/store.test.ts`
Expected: FAIL — store doesn't have new fields/actions

- [ ] **Step 3: Rewrite store.ts with migrated fields and new slices**

Replace `src/store.ts` entirely:
```ts
import { create } from 'zustand'
import type {
  KnowledgeMap, Quest, BagItem, TabId,
} from './types'

export interface AgentState {
  version: number
  name: string
  level: number
  class: string
  title: string
  xp: number
  xp_to_next: number
  stability: number
  stability_max: number
  energy: number
  energy_max: number
  gold: number
  current_region: string
  regions_unlocked: string[]
  regions_cleared: string[]
  skills_count: number
  skill_distribution: Record<string, number>
  inventory: Array<{ item: string; count: number }>
  active_quests: Array<{ id: string; title: string; reward_gold: number; reward_xp: number }>
  completed_quests: number
  total_cycles: number
  started_at: string | null
  last_cycle_at: string | null
}

export interface GameEvent {
  ts: string
  type: string
  region: string | null
  data: Record<string, unknown>
}

export interface Skill {
  name: string
  rarity: string
  category: string | null
  version: number
  description: string
  created_at: string | null
  updated_at: string | null
  source: string | null
}

export interface HubSkill {
  name: string
  description: string
  source: string
  identifier: string
  trust_level: string
  tags: string[]
}

export interface HubSkill {
  name: string
  description: string
  source: string
  identifier: string
  trust_level: string
  tags: string[]
}

export interface NpcMessage {
  role: 'user' | 'npc'
  content: string
  actions?: Array<{ type: string; quest?: unknown }>
}

interface Store {
  // Existing state
  state: AgentState | null
  events: GameEvent[]
  skills: Skill[]
  connected: boolean

  // New: knowledge map
  knowledgeMap: KnowledgeMap | null

  // New: quests
  quests: Quest[]

  // New: bag
  bagItems: BagItem[]

  // New: NPC chat
  npcChat: { messages: NpcMessage[]; loading: boolean }

  // New: UI state for NPC context
  activeTab: TabId
  selectedBagItems: string[]
  selectedRegion: string | null

  // Existing actions
  setState: (s: AgentState) => void
  addEvent: (e: GameEvent) => void
  setEvents: (e: GameEvent[]) => void
  setSkills: (s: Skill[]) => void
  setConnected: (c: boolean) => void

  // New actions
  setKnowledgeMap: (m: KnowledgeMap | null) => void
  setQuests: (q: Quest[]) => void
  setBagItems: (b: BagItem[]) => void
  setActiveTab: (t: TabId) => void
  toggleBagItem: (id: string) => void
  setSelectedRegion: (r: string | null) => void
  addNpcMessage: (role: 'user' | 'npc', content: string, actions?: NpcMessage['actions']) => void
  setNpcLoading: (loading: boolean) => void
  clearNpcChat: () => void
}

export const useStore = create<Store>((set) => ({
  state: null,
  events: [],
  skills: [],
  connected: false,
  knowledgeMap: null,
  quests: [],
  bagItems: [],
  npcChat: { messages: [], loading: false },
  activeTab: 'map',
  selectedBagItems: [],
  selectedRegion: null,

  setState: (s) => set({ state: s }),
  addEvent: (e) => set((prev) => {
    const key = `${e.ts}-${e.type}`
    if (prev.events.some((x) => `${x.ts}-${x.type}` === key)) return prev
    return { events: [e, ...prev.events].slice(0, 200) }
  }),
  setEvents: (e) => set({ events: e }),
  setSkills: (s) => set({ skills: s }),
  setConnected: (c) => set({ connected: c }),

  setKnowledgeMap: (m) => set({ knowledgeMap: m }),
  setQuests: (q) => set({ quests: q }),
  setBagItems: (b) => set({ bagItems: b }),
  setActiveTab: (t) => set({ activeTab: t }),
  toggleBagItem: (id) => set((prev) => ({
    selectedBagItems: prev.selectedBagItems.includes(id)
      ? prev.selectedBagItems.filter((x) => x !== id)
      : [...prev.selectedBagItems, id],
  })),
  setSelectedRegion: (r) => set({ selectedRegion: r }),
  addNpcMessage: (role, content, actions) => set((prev) => ({
    npcChat: {
      ...prev.npcChat,
      messages: [...prev.npcChat.messages, { role, content, actions }],
    },
  })),
  setNpcLoading: (loading) => set((prev) => ({
    npcChat: { ...prev.npcChat, loading },
  })),
  clearNpcChat: () => set({ npcChat: { messages: [], loading: false } }),
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/store.test.ts`
Expected: PASS — all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/store.ts src/__tests__/store.test.ts
git commit -m "feat: migrate store — rename hp/mp to stability/energy, add map/quest/bag/npc state slices"
```

---

### Task 4: Update Components That Reference Old Store Fields

**Files:**
- Modify: `src/panels/CharacterPanel.tsx` — change `hp`/`mp` references to `stability`/`energy`
- Modify: `src/panels/TopBar.tsx` — no field changes needed (uses `level`, `class`, `gold`)
- Modify: `src/panels/SkillInventory.tsx` — no field changes needed
- Modify: `src/panels/AdventureLog.tsx` — no field changes needed
- Modify: `src/websocket.ts` — remove `setRegions` / `regions` handling (old Region interface removed), add map/quest/bag fetch and WS handlers
- Modify: `src/theme.css` — rename `.stat-bar-fill.hp` to `.stat-bar-fill.stability`, `.mp` to `.energy`

- [ ] **Step 1: Update CharacterPanel.tsx**

In `src/panels/CharacterPanel.tsx`, find any references to `state.hp`, `state.hp_max`, `state.mp`, `state.mp_max` and replace with `state.stability`, `state.stability_max`, `state.energy`, `state.energy_max`. The display labels "STABILITY" and "ENERGY" should already be in place from previous work.

Also find any reference to `state.total_boss_kills` and replace with `state.regions_cleared.length`. The label "Mastered" should already be in place.

Also update the stat bar CSS classes from `hp` to `stability` and `mp` to `energy`.

- [ ] **Step 2: Update theme.css**

In `src/theme.css`, rename:
```css
/* old */
.stat-bar-fill.hp { background: var(--red); }
.stat-bar-fill.mp { background: var(--cyan); }

/* new */
.stat-bar-fill.stability { background: var(--red); }
.stat-bar-fill.energy { background: var(--cyan); }
```

- [ ] **Step 3: Update websocket.ts — add new fetch calls and WS handlers**

Replace `src/websocket.ts` entirely:
```ts
import { useEffect, useRef } from 'react'
import { useStore } from './store'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.host}`

function fetchInitialData() {
  const { setState, setSkills, setEvents, setKnowledgeMap, setQuests, setBagItems } = useStore.getState()
  fetch(`${API_URL}/api/state`).then(r => r.json()).then(setState).catch(() => {})
  fetch(`${API_URL}/api/skills`).then(r => r.json()).then(setSkills).catch(() => {})
  fetch(`${API_URL}/api/events`).then(r => r.json()).then(setEvents).catch(() => {})
  fetch(`${API_URL}/api/map`).then(r => {
    if (r.ok) return r.json()
    return null
  }).then(data => { if (data) setKnowledgeMap(data) }).catch(() => {})
  fetch(`${API_URL}/api/quest/active`).then(r => r.json()).then(d => setQuests(d.quests || [])).catch(() => {})
  fetch(`${API_URL}/api/bag/items`).then(r => r.json()).then(d => setBagItems(d.items || [])).catch(() => {})
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchInitialData()

    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        useStore.getState().setConnected(true)
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          const store = useStore.getState()
          if (msg.type === 'state') {
            store.setState(msg.data)
          } else if (msg.type === 'event') {
            store.addEvent(msg.data)
            if (['skill_drop', 'hub_acquire'].includes(msg.data.type)) {
              fetch(`${API_URL}/api/skills`).then(r => r.json()).then(store.setSkills).catch(() => {})
            }
          } else if (msg.type === 'map') {
            store.setKnowledgeMap(msg.data)
          } else if (msg.type === 'quest') {
            fetch(`${API_URL}/api/quest/active`).then(r => r.json()).then(d => store.setQuests(d.quests || [])).catch(() => {})
          } else if (msg.type === 'bag') {
            fetch(`${API_URL}/api/bag/items`).then(r => r.json()).then(d => store.setBagItems(d.items || [])).catch(() => {})
          }
        } catch {}
      }

      ws.onclose = () => {
        useStore.getState().setConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])
}

export { API_URL }
```

- [ ] **Step 4: Verify the app still compiles**

Run: `cd /Users/nemo/Documents/project/hermes/hermes-quest-dashboard && npx tsc -b --noEmit`
Expected: No type errors (or only pre-existing ones from components not yet updated)

- [ ] **Step 5: Commit**

```bash
git add src/panels/CharacterPanel.tsx src/theme.css src/websocket.ts
git commit -m "feat: update components for store migration — stability/energy fields, new WS handlers"
```

---

### Task 5: Add NPC Chat API Helper

**Files:**
- Create: `src/api.ts`
- Test: `src/__tests__/api.test.ts`

- [ ] **Step 1: Write API helper test**

Create `src/__tests__/api.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendNpcChat, acceptQuest } from '../api'

describe('api helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sendNpcChat sends correct request shape', async () => {
    const mockResponse = {
      reply: 'Welcome!',
      actions: [],
      npc_mood: 'friendly' as const,
    }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await sendNpcChat({
      npc: 'guild_master',
      message: 'Hello',
      context: { active_tab: 'guild', selected_bag_items: [], selected_region: null },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/npc/chat'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('acceptQuest sends quest_id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quest_id: 'q-1', status: 'active' }),
    })

    const result = await acceptQuest('rec-quest-1')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/quest/accept'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.quest_id).toBe('q-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/api.test.ts`
Expected: FAIL — cannot find module `../api`

- [ ] **Step 3: Create API helper**

Create `src/api.ts`:
```ts
import type { NpcChatRequest, NpcChatResponse } from './types'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.host}`

export async function sendNpcChat(req: NpcChatRequest): Promise<NpcChatResponse> {
  const res = await fetch(`${API_URL}/api/npc/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`NPC chat failed: ${res.status}`)
  return res.json()
}

export async function acceptQuest(questId: string): Promise<{ quest_id: string; status: string }> {
  const res = await fetch(`${API_URL}/api/quest/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quest_id: questId }),
  })
  if (!res.ok) throw new Error(`Accept quest failed: ${res.status}`)
  return res.json()
}

export async function acceptFogQuest(fogRegionId: string): Promise<{ quest_id: string; status: string }> {
  const res = await fetch(`${API_URL}/api/quest/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fog_region_id: fogRegionId }),
  })
  if (!res.ok) throw new Error(`Accept fog quest failed: ${res.status}`)
  return res.json()
}

export { API_URL }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/api.test.ts`
Expected: PASS

- [ ] **Step 5: Update websocket.ts to import API_URL from api.ts instead of defining it locally**

In `src/websocket.ts`, change:
```ts
// old
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.host}`
// ...
export { API_URL }
```
to:
```ts
import { API_URL } from './api'
// remove the local API_URL const and the export
```

Also update any other file that imports `API_URL` from `./websocket` to import from `./api` instead:
- `src/panels/QuestBoard.tsx` (will be replaced later, but update for now)
- `src/panels/Shop.tsx`
- `src/panels/ReflectionBar.tsx` (will be removed later, but update for now)
- `src/panels/SkillInventory.tsx`

- [ ] **Step 6: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: Clean or only pre-existing issues

- [ ] **Step 7: Commit**

```bash
git add src/api.ts src/__tests__/api.test.ts src/websocket.ts src/panels/QuestBoard.tsx src/panels/Shop.tsx src/panels/ReflectionBar.tsx src/panels/SkillInventory.tsx
git commit -m "feat: add API helpers for NPC chat and quest acceptance, centralize API_URL"
```

---

## Chunk 2: Layout & Core UI Shell

### Task 6: Restructure App Layout — Remove ReflectionBar, Add NPC Dialog Space

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/panels/CenterTabs.tsx`

Per spec: ReflectionBar is removed (reflection integrated into adventure log). The layout changes from 3 rows (TopBar, Content, ReflectionBar) to 2 rows (TopBar, Content). The center panel now includes the NPC dialog bar at the bottom.

- [ ] **Step 1: Update App.tsx — remove ReflectionBar**

Replace `src/App.tsx`:
```tsx
import { useWebSocket } from './websocket'
import TopBar from './panels/TopBar'
import CharacterPanel from './panels/CharacterPanel'
import SkillPanel from './panels/SkillPanel'
import CenterTabs from './panels/CenterTabs'
import AdventureLog from './panels/AdventureLog'

export default function App() {
  useWebSocket()

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      gap: '2px',
      padding: '2px',
    }}>
      <TopBar />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 280px',
        gap: '2px',
        minHeight: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <CharacterPanel />
          <SkillPanel />
        </div>
        <CenterTabs />
        <AdventureLog />
      </div>
    </div>
  )
}
```

Note: `SkillPanel` is the new name for the left panel bottom section that has SKILLS/BAG sub-tabs. We'll create it in a later task — for now, keep using `SkillInventory` and rename the import:

Actually, to avoid breaking the app while we build incrementally, keep `SkillInventory` for now:

```tsx
import { useWebSocket } from './websocket'
import TopBar from './panels/TopBar'
import CharacterPanel from './panels/CharacterPanel'
import SkillInventory from './panels/SkillInventory'
import CenterTabs from './panels/CenterTabs'
import AdventureLog from './panels/AdventureLog'

export default function App() {
  useWebSocket()

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      gap: '2px',
      padding: '2px',
    }}>
      <TopBar />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 280px',
        gap: '2px',
        minHeight: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <CharacterPanel />
          <SkillInventory />
        </div>
        <CenterTabs />
        <AdventureLog />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update CenterTabs.tsx — change tabs to MAP/GUILD/SHOP, add NPC dialog placeholder at bottom**

Replace `src/panels/CenterTabs.tsx`:
```tsx
import { useEffect } from 'react'
import { useStore } from '../store'
import WorldMap from './WorldMap'
import QuestBoard from './QuestBoard'
import Shop from './Shop'
import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'map', label: 'MAP' },
  { id: 'guild', label: 'GUILD' },
  { id: 'shop', label: 'SHOP' },
]

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pixel-panel" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'map' && <WorldMap />}
        {activeTab === 'guild' && <QuestBoard />}
        {activeTab === 'shop' && <Shop />}
      </div>
      {/* NPCDialogBar will be inserted here in Task 9 */}
    </div>
  )
}
```

Note: We keep `WorldMap` and `QuestBoard` as placeholders. They'll be replaced by `KnowledgeMap` and `GuildPanel` in later tasks.

- [ ] **Step 3: Verify the app still compiles and renders**

Run: `npx tsc -b --noEmit`
Expected: Clean (ReflectionBar import removed, CenterTabs uses store tab)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/panels/CenterTabs.tsx
git commit -m "feat: restructure layout — remove ReflectionBar, use store-driven tabs (MAP/GUILD/SHOP)"
```

---

### Task 7: Create NPC Pixel Art Portraits

**Files:**
- Create: `src/utils/npc-portraits.tsx`

- [ ] **Step 1: Create NPC portrait components**

Create `src/utils/npc-portraits.tsx` with 3 pixel art NPC portraits (32x32 SVG, same style as existing `Shopkeeper` in Shop.tsx):

```tsx
/** Pixel art NPC portraits — 32x32 rendered from 16x16 grid */

interface PortraitProps {
  size?: number
}

/** Guild Master — authority figure, warm gold/brown tones */
export function GuildMasterPortrait({ size = 32 }: PortraitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* crown */}
      <rect x="5" y="0" width="1" height="1" fill="#ffd700" />
      <rect x="7" y="0" width="2" height="1" fill="#ffd700" />
      <rect x="10" y="0" width="1" height="1" fill="#ffd700" />
      <rect x="4" y="1" width="8" height="1" fill="#daa520" />
      <rect x="4" y="2" width="8" height="1" fill="#b8860b" />
      {/* face */}
      <rect x="5" y="3" width="6" height="5" fill="#deb887" />
      <rect x="6" y="4" width="1" height="1" fill="#222" />
      <rect x="9" y="4" width="1" height="1" fill="#222" />
      <rect x="6" y="6" width="4" height="1" fill="#a0522d" /> {/* mustache */}
      <rect x="7" y="7" width="2" height="1" fill="#c87050" />
      {/* body — armor */}
      <rect x="3" y="8" width="10" height="1" fill="#8b7355" />
      <rect x="3" y="9" width="10" height="4" fill="#6b5b3a" />
      <rect x="7" y="9" width="2" height="3" fill="#daa520" /> {/* medal */}
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#deb887" />
      <rect x="13" y="9" width="1" height="3" fill="#deb887" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="9" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="4" y="15" width="3" height="1" fill="#3a2a1a" />
      <rect x="9" y="15" width="3" height="1" fill="#3a2a1a" />
    </svg>
  )
}

/** Cartographer — scholarly look, map tools, blue/brown */
export function CartographerPortrait({ size = 32 }: PortraitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* beret */}
      <rect x="5" y="0" width="7" height="1" fill="#4a6fa5" />
      <rect x="4" y="1" width="8" height="2" fill="#3a5a8a" />
      {/* face — older, spectacles */}
      <rect x="5" y="3" width="6" height="5" fill="#d2b48c" />
      <rect x="5" y="4" width="3" height="2" fill="none" stroke="#8b7355" strokeWidth="0.3" /> {/* left lens */}
      <rect x="8" y="4" width="3" height="2" fill="none" stroke="#8b7355" strokeWidth="0.3" /> {/* right lens */}
      <rect x="6" y="5" width="1" height="1" fill="#222" />
      <rect x="9" y="5" width="1" height="1" fill="#222" />
      <rect x="7" y="7" width="2" height="1" fill="#b87050" />
      {/* body — scholarly robe */}
      <rect x="3" y="8" width="10" height="1" fill="#2a4a6a" />
      <rect x="3" y="9" width="10" height="4" fill="#1a3a5a" />
      <rect x="7" y="10" width="2" height="2" fill="#c8a87a" /> {/* scroll */}
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#d2b48c" />
      <rect x="13" y="9" width="1" height="3" fill="#d2b48c" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#2a3a4a" />
      <rect x="9" y="13" width="2" height="2" fill="#2a3a4a" />
      <rect x="4" y="15" width="3" height="1" fill="#1a2a3a" />
      <rect x="9" y="15" width="3" height="1" fill="#1a2a3a" />
    </svg>
  )
}

/** Quartermaster — merchant, apron, practical look */
export function QuartermasterPortrait({ size = 32 }: PortraitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* hat */}
      <rect x="5" y="0" width="6" height="1" fill="#8b4513" />
      <rect x="3" y="1" width="10" height="1" fill="#8b4513" />
      <rect x="4" y="2" width="8" height="2" fill="#a0522d" />
      {/* face */}
      <rect x="5" y="4" width="6" height="4" fill="#deb887" />
      <rect x="6" y="5" width="1" height="1" fill="#222" />
      <rect x="9" y="5" width="1" height="1" fill="#222" />
      <rect x="7" y="7" width="2" height="1" fill="#c87050" />
      {/* body — apron */}
      <rect x="4" y="8" width="8" height="1" fill="#556b2f" />
      <rect x="3" y="9" width="10" height="4" fill="#f5f5dc" />
      <rect x="6" y="9" width="4" height="4" fill="#f0e68c" />
      <rect x="7" y="10" width="2" height="1" fill="#daa520" />
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#deb887" />
      <rect x="13" y="9" width="1" height="3" fill="#deb887" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="9" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="4" y="15" width="3" height="1" fill="#3a2a1a" />
      <rect x="9" y="15" width="3" height="1" fill="#3a2a1a" />
    </svg>
  )
}

export const NPC_PORTRAITS = {
  guild_master: GuildMasterPortrait,
  cartographer: CartographerPortrait,
  quartermaster: QuartermasterPortrait,
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/npc-portraits.tsx
git commit -m "feat: add pixel art NPC portraits — Guild Master, Cartographer, Quartermaster"
```

---

### Task 8: Create NPCDialogBar Component

**Files:**
- Create: `src/panels/NPCDialogBar.tsx`
- Modify: `src/panels/CenterTabs.tsx` — add NPCDialogBar at bottom

- [ ] **Step 1: Create NPCDialogBar component**

Create `src/panels/NPCDialogBar.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { sendNpcChat } from '../api'
import { NPC_PORTRAITS } from '../utils/npc-portraits'
import type { NpcId, TabId } from '../types'

const TAB_TO_NPC: Record<TabId, NpcId> = {
  map: 'cartographer',
  guild: 'guild_master',
  shop: 'quartermaster',
}

const NPC_NAMES: Record<NpcId, string> = {
  guild_master: 'Guild Master',
  cartographer: 'Cartographer',
  quartermaster: 'Quartermaster',
}

const NPC_IDS: NpcId[] = ['guild_master', 'cartographer', 'quartermaster']

export default function NPCDialogBar() {
  const activeTab = useStore((s) => s.activeTab)
  const npcChat = useStore((s) => s.npcChat)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const selectedRegion = useStore((s) => s.selectedRegion)
  const addNpcMessage = useStore((s) => s.addNpcMessage)
  const setNpcLoading = useStore((s) => s.setNpcLoading)

  const [activeNpc, setActiveNpc] = useState<NpcId>(TAB_TO_NPC[activeTab])
  const [input, setInput] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  // Auto-switch NPC when tab changes
  useEffect(() => {
    setActiveNpc(TAB_TO_NPC[activeTab])
  }, [activeTab])

  // Auto-scroll dialog
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.scrollTop = dialogRef.current.scrollHeight
    }
  }, [npcChat.messages])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || npcChat.loading) return
    setInput('')
    addNpcMessage('user', msg)
    setNpcLoading(true)

    try {
      const res = await sendNpcChat({
        npc: activeNpc,
        message: msg,
        context: {
          active_tab: activeTab,
          selected_bag_items: selectedBagItems,
          selected_region: selectedRegion,
        },
      })
      addNpcMessage('npc', res.reply, res.actions)
    } catch {
      addNpcMessage('npc', 'The guild is quiet... (connection lost)')
    }
    setNpcLoading(false)
  }

  const Portrait = NPC_PORTRAITS[activeNpc]

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a140c 0%, #0d0a08 100%)',
      border: '2px solid #5c3a1e',
      borderTop: '3px solid #8b5e3c',
      padding: '6px',
    }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        {/* NPC portrait selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NPC_IDS.map((id) => {
            const P = NPC_PORTRAITS[id]
            const isActive = id === activeNpc
            return (
              <div
                key={id}
                onClick={() => setActiveNpc(id)}
                title={NPC_NAMES[id]}
                style={{
                  cursor: 'pointer',
                  padding: '2px',
                  border: `2px solid ${isActive ? '#f0e68c' : '#3a2a1a'}`,
                  background: isActive ? 'rgba(240,230,140,0.1)' : 'transparent',
                }}
              >
                <P size={24} />
              </div>
            )
          })}
        </div>

        {/* Dialog area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* NPC name */}
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: '7px',
            color: '#f0e68c', letterSpacing: '1px',
          }}>
            {NPC_NAMES[activeNpc]}
          </div>

          {/* Message history */}
          <div
            ref={dialogRef}
            style={{
              maxHeight: '80px', overflow: 'auto',
              background: '#0a0804', border: '1px solid #3a2a1a',
              padding: '4px', fontSize: '10px', lineHeight: '1.4',
            }}
          >
            {npcChat.messages.length === 0 ? (
              <div style={{ color: '#7a6a5a', fontStyle: 'italic' }}>
                Click to speak with {NPC_NAMES[activeNpc]}...
              </div>
            ) : (
              npcChat.messages.map((msg, i) => (
                <div key={i} style={{
                  marginBottom: '3px',
                  color: msg.role === 'user' ? '#c8a87a' : '#e8e6f0',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '6px',
                    color: msg.role === 'user' ? '#8a889a' : '#f0e68c',
                    marginRight: '4px',
                  }}>
                    {msg.role === 'user' ? 'YOU' : NPC_NAMES[activeNpc].toUpperCase()}:
                  </span>
                  {msg.content}
                </div>
              ))
            )}
            {npcChat.loading && (
              <div style={{ color: '#7a6a5a', fontStyle: 'italic' }}>...</div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Speak to ${NPC_NAMES[activeNpc]}...`}
              disabled={npcChat.loading}
              style={{
                flex: 1, padding: '4px 6px',
                background: '#0a0804', border: '1px solid #3a2a1a',
                color: '#c8a87a', fontFamily: 'var(--font-mono)', fontSize: '10px',
              }}
            />
            <button
              className="pixel-btn"
              onClick={handleSend}
              disabled={npcChat.loading || !input.trim()}
              style={{
                fontSize: '7px', borderColor: '#5c3a1e',
                color: '#f0e68c', padding: '4px 8px',
                background: 'rgba(90,60,20,0.4)',
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add NPCDialogBar to CenterTabs**

In `src/panels/CenterTabs.tsx`, add import and render:
```tsx
import { useStore } from '../store'
import WorldMap from './WorldMap'
import QuestBoard from './QuestBoard'
import Shop from './Shop'
import NPCDialogBar from './NPCDialogBar'
import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'map', label: 'MAP' },
  { id: 'guild', label: 'GUILD' },
  { id: 'shop', label: 'SHOP' },
]

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pixel-panel" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'map' && <WorldMap />}
        {activeTab === 'guild' && <QuestBoard />}
        {activeTab === 'shop' && <Shop />}
      </div>
      <NPCDialogBar />
    </div>
  )
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add src/panels/NPCDialogBar.tsx src/panels/CenterTabs.tsx
git commit -m "feat: add NPCDialogBar with 3 NPC portraits, auto-switch by tab, AI chat integration"
```

---

## Chunk 3: Knowledge Map (Parchment Continent View)

### Task 9: Create KnowledgeMap Component — Parchment Background + Continents

**Files:**
- Create: `src/panels/KnowledgeMap.tsx`
- Modify: `src/panels/CenterTabs.tsx` — swap WorldMap for KnowledgeMap

This is the largest visual component. It renders:
- Parchment gradient background with noise texture and vignette
- Continent blobs positioned by normalized coordinates
- Fog of war regions
- Connections between continents (hand-drawn style bezier paths)
- Compass rose decoration
- Click continent → drill into sub-region view (Task 10)

- [ ] **Step 1: Create KnowledgeMap component**

Create `src/panels/KnowledgeMap.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Continent, FogRegion, KnowledgeMap as KnowledgeMapData } from '../types'
import SubRegionGraph from './SubRegionGraph'

/** Generate SVG noise texture as data URL */
function useNoiseTexture() {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(200, 200)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 30
      imageData.data[i] = v
      imageData.data[i + 1] = v
      imageData.data[i + 2] = v
      imageData.data[i + 3] = 15
    }
    ctx.putImageData(imageData, 0, 0)
    setUrl(canvas.toDataURL())
  }, [])
  return url
}

/** Compass rose SVG */
function CompassRose() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.3 }}>
      <line x1="20" y1="2" x2="20" y2="38" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="2" y1="20" x2="38" y2="20" stroke="#8b7355" strokeWidth="0.5" />
      <polygon points="20,4 18,16 22,16" fill="#c8a87a" />
      <polygon points="20,36 18,24 22,24" fill="#6b5b3a" />
      <polygon points="4,20 16,18 16,22" fill="#6b5b3a" />
      <polygon points="36,20 24,18 24,22" fill="#6b5b3a" />
      <text x="20" y="3" textAnchor="middle" fontSize="4" fill="#c8a87a" fontFamily="var(--font-pixel)">N</text>
    </svg>
  )
}

/** Render an irregular blob shape for a continent */
function ContinentBlob({ continent, onClick, isActive }: {
  continent: Continent
  onClick: () => void
  isActive: boolean
}) {
  // Generate a deterministic blob path from continent id
  const seed = continent.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const r = continent.size * 60 // radius in px
  const points: string[] = []
  const n = 8
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2
    const jitter = ((seed * (i + 1) * 7) % 20 - 10) / 10 // -1 to 1
    const radius = r + jitter * r * 0.3
    points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`)
  }

  const avgMastery = continent.sub_regions.length > 0
    ? continent.sub_regions.reduce((a, s) => a + s.mastery, 0) / continent.sub_regions.length
    : 0

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <polygon
        points={points.join(' ')}
        fill={continent.color}
        fillOpacity={0.25}
        stroke={continent.color}
        strokeWidth={isActive ? 2.5 : 1.5}
        strokeOpacity={0.7}
      />
      {/* Continent label */}
      <text
        y={-r * 0.1}
        textAnchor="middle"
        fontFamily="var(--font-pixel)"
        fontSize="5"
        fill="#f0e68c"
        style={{ pointerEvents: 'none' }}
      >
        {continent.name}
      </text>
      {/* Mastery indicator */}
      <text
        y={r * 0.3}
        textAnchor="middle"
        fontFamily="var(--font-pixel)"
        fontSize="4"
        fill="#c8a87a"
        style={{ pointerEvents: 'none' }}
      >
        {Math.round(avgMastery * 100)}%
      </text>
      {/* Skill count */}
      <text
        y={r * 0.55}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="3.5"
        fill="#8a889a"
        style={{ pointerEvents: 'none' }}
      >
        {continent.sub_regions.reduce((a, s) => a + s.skills.length, 0)} skills
      </text>
    </g>
  )
}

/** Fog of war region */
function FogBlob({ fog }: { fog: FogRegion }) {
  return (
    <g>
      <circle r="30" fill="rgba(10,8,4,0.7)" stroke="#3a2a1a" strokeWidth="1" strokeDasharray="4 2" />
      <text y="-4" textAnchor="middle" fontFamily="var(--font-pixel)" fontSize="8" fill="#5c5040">?</text>
      <text y="8" textAnchor="middle" fontFamily="var(--font-pixel)" fontSize="3" fill="#5c5040">{fog.hint}</text>
    </g>
  )
}

export default function KnowledgeMap() {
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)
  const setSelectedRegion = useStore((s) => s.setSelectedRegion)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })
  const noiseUrl = useNoiseTexture()

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  function handleContinentClick(id: string) {
    setSelectedContinent(id)
    setSelectedRegion(id)
  }

  // Drill-down view
  if (selectedContinent && knowledgeMap) {
    const continent = knowledgeMap.continents.find((c) => c.id === selectedContinent)
    if (continent) {
      return (
        <SubRegionGraph
          continent={continent}
          connections={knowledgeMap.connections}
          onBack={() => { setSelectedContinent(null); setSelectedRegion(null) }}
        />
      )
    }
  }

  // Empty state
  if (!knowledgeMap || knowledgeMap.continents.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {noiseUrl && <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
          opacity: 0.5, pointerEvents: 'none',
        }} />}
        <div style={{ position: 'absolute', top: 8, right: 8 }}><CompassRose /></div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#f0e68c', marginBottom: '8px' }}>
          KNOWLEDGE ATLAS
        </div>
        <div style={{ fontSize: '11px', color: '#8b7355', textAlign: 'center', maxWidth: '300px' }}>
          Begin your journey. Complete a Hermes cycle to discover your first knowledge domain.
        </div>
      </div>
    )
  }

  // Continent view
  const { w, h } = size

  // Find connections between continents (any skill in continent A connected to any skill in continent B)
  const continentConnections: Array<{ from: Continent; to: Continent }> = []
  if (knowledgeMap) {
    for (const conn of knowledgeMap.connections) {
      let fromContinent: Continent | undefined
      let toContinent: Continent | undefined
      for (const c of knowledgeMap.continents) {
        const skills = c.sub_regions.flatMap((s) => s.skills)
        if (skills.includes(conn.from)) fromContinent = c
        if (skills.includes(conn.to)) toContinent = c
      }
      if (fromContinent && toContinent && fromContinent.id !== toContinent.id) {
        if (!continentConnections.some((cc) =>
          (cc.from.id === fromContinent!.id && cc.to.id === toContinent!.id) ||
          (cc.from.id === toContinent!.id && cc.to.id === fromContinent!.id)
        )) {
          continentConnections.push({ from: fromContinent, to: toContinent })
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Noise texture */}
      {noiseUrl && <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: 'repeat',
        opacity: 0.5, pointerEvents: 'none',
      }} />}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)',
      }} />

      {/* Compass rose */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}><CompassRose /></div>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 8, left: 12, zIndex: 2,
        fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#c8a87a',
        letterSpacing: '2px',
      }}>
        KNOWLEDGE ATLAS
      </div>

      {/* SVG layer */}
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
        {/* Connections between continents — hand-drawn bezier */}
        {continentConnections.map((cc, i) => {
          const x1 = cc.from.position.x * w
          const y1 = cc.from.position.y * h
          const x2 = cc.to.position.x * w
          const y2 = cc.to.position.y * h
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2 - 20
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke="#5c4a2a"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.5"
            />
          )
        })}

        {/* Fog regions */}
        {knowledgeMap.fog_regions.map((fog) => (
          <g key={fog.id} transform={`translate(${fog.position.x * w}, ${fog.position.y * h})`}>
            <FogBlob fog={fog} />
          </g>
        ))}

        {/* Continents */}
        {knowledgeMap.continents.map((c) => (
          <g key={c.id} transform={`translate(${c.position.x * w}, ${c.position.y * h})`}>
            <ContinentBlob
              continent={c}
              onClick={() => handleContinentClick(c.id)}
              isActive={selectedContinent === c.id}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Create SubRegionGraph placeholder**

Create `src/panels/SubRegionGraph.tsx` (minimal placeholder — full implementation in Task 10):
```tsx
import type { Continent, Connection } from '../types'

interface Props {
  continent: Continent
  connections: Connection[]
  onBack: () => void
}

export default function SubRegionGraph({ continent, onBack }: Props) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
      padding: '12px',
    }}>
      <button
        className="pixel-btn"
        onClick={onBack}
        style={{ fontSize: '7px', borderColor: '#5c3a1e', color: '#f0e68c', marginBottom: '8px' }}
      >
        BACK TO ATLAS
      </button>
      <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: '#f0e68c', marginBottom: '12px' }}>
        {continent.name}
      </div>
      <div style={{ fontSize: '10px', color: '#c8a87a' }}>
        {continent.description}
      </div>
      <div style={{ marginTop: '12px' }}>
        {continent.sub_regions.map((sr) => (
          <div key={sr.id} style={{
            padding: '6px', marginBottom: '4px',
            border: '1px solid #3a2a1a', background: 'rgba(10,8,4,0.5)',
          }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#c8a87a' }}>
              {sr.name} — {Math.round(sr.mastery * 100)}%
            </div>
            <div style={{ fontSize: '9px', color: '#8a889a', marginTop: '4px' }}>
              Skills: {sr.skills.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Swap WorldMap for KnowledgeMap in CenterTabs**

In `src/panels/CenterTabs.tsx`, change:
```tsx
// old
import WorldMap from './WorldMap'
// ...
{activeTab === 'map' && <WorldMap />}

// new
import KnowledgeMap from './KnowledgeMap'
// ...
{activeTab === 'map' && <KnowledgeMap />}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: Clean

- [ ] **Step 5: Commit**

```bash
git add src/panels/KnowledgeMap.tsx src/panels/SubRegionGraph.tsx src/panels/CenterTabs.tsx
git commit -m "feat: add KnowledgeMap parchment continent view with fog of war, replace WorldMap"
```

---

## Chunk 4: Guild Tab & Sub-Region Graph

### Task 10: Create BulletinBoard Component

**Files:**
- Create: `src/panels/BulletinBoard.tsx`

- [ ] **Step 1: Create BulletinBoard**

Create `src/panels/BulletinBoard.tsx`:
```tsx
import { useState } from 'react'
import { useStore } from '../store'
import { acceptQuest } from '../api'

export default function BulletinBoard() {
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const events = useStore((s) => s.events)
  const [accepting, setAccepting] = useState<string | null>(null)

  const recommendations = knowledgeMap?.recommended_quests || []

  // Achievement events (level ups, domain discoveries)
  const achievements = events.filter((e) =>
    ['level_up', 'region_unlock', 'quest_complete'].includes(e.type)
  ).slice(0, 5)

  async function handleAccept(questId: string) {
    setAccepting(questId)
    try {
      await acceptQuest(questId)
    } catch (e) {
      console.error('Failed to accept quest', e)
    }
    setAccepting(null)
  }

  const RANK_COLOR: Record<string, string> = {
    S: 'var(--gold)',
    A: 'var(--purple)',
    B: 'var(--cyan)',
    C: 'var(--green)',
    D: 'var(--text-dim)',
  }

  return (
    <div>
      {/* Wooden board header */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#f0e68c',
        background: 'linear-gradient(180deg, #5c3a1e 0%, #4a2e14 100%)',
        border: '1px solid #8b5e3c', padding: '4px 8px',
        textAlign: 'center', marginBottom: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        letterSpacing: '1px',
      }}>
        BULLETIN BOARD
      </div>

      {/* Quest cards */}
      {recommendations.length === 0 ? (
        <div style={{ fontSize: '10px', color: '#7a6a5a', textAlign: 'center', padding: '12px' }}>
          No quests available. Complete a cycle to discover new opportunities.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          {recommendations.map((q) => (
            <div key={q.id} style={{
              padding: '6px 8px',
              background: 'linear-gradient(135deg, #1a140c 0%, #231a10 100%)',
              border: '1px solid #3a2a1a',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`quest-rank ${q.rank}`} style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '10px',
                    color: RANK_COLOR[q.rank] || 'var(--text)',
                  }}>
                    {q.rank}
                  </span>
                  <span style={{ fontSize: '10px', color: '#e8e6f0' }}>{q.title}</span>
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--gold)' }}>{q.reward_gold}G</span>
                  {' '}
                  <span style={{ color: 'var(--green)' }}>{q.reward_xp}XP</span>
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#8b7355', marginTop: '3px' }}>
                {q.description}
              </div>
              <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                <button
                  className="pixel-btn"
                  onClick={() => handleAccept(q.id)}
                  disabled={accepting === q.id}
                  style={{
                    fontSize: '6px', padding: '2px 6px',
                    borderColor: '#5c3a1e', color: '#f0e68c',
                    background: 'rgba(90,60,20,0.4)',
                  }}
                >
                  {accepting === q.id ? '...' : 'ACCEPT'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievement badges */}
      {achievements.length > 0 && (
        <>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#8b7355',
            marginBottom: '4px', letterSpacing: '1px',
          }}>
            RECENT ACHIEVEMENTS
          </div>
          {achievements.map((e, i) => (
            <div key={`${e.ts}-${i}`} style={{
              fontSize: '9px', color: '#c8a87a',
              padding: '2px 0', borderBottom: '1px solid #1a140c',
            }}>
              {e.type === 'level_up' && `Level Up! → Lv.${(e.data as Record<string, unknown>).new_level}`}
              {e.type === 'region_unlock' && `New domain: ${(e.data as Record<string, unknown>).region}`}
              {e.type === 'quest_complete' && `Quest conquered: ${(e.data as Record<string, unknown>).title}`}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/panels/BulletinBoard.tsx
git commit -m "feat: add BulletinBoard component with quest recommendation cards and achievements"
```

---

### Task 11: Create QuestTracker Component

**Files:**
- Create: `src/panels/QuestTracker.tsx`

- [ ] **Step 1: Create QuestTracker**

Create `src/panels/QuestTracker.tsx`:
```tsx
import { useState } from 'react'
import { useStore } from '../store'

export default function QuestTracker() {
  const quests = useStore((s) => s.quests)
  const events = useStore((s) => s.events)
  const [showHistory, setShowHistory] = useState(false)

  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'in_progress')
  const completedEvents = events.filter((e) =>
    ['quest_complete', 'quest_fail'].includes(e.type)
  ).slice(0, 10)

  const STATUS_COLOR: Record<string, string> = {
    active: 'var(--cyan)',
    in_progress: 'var(--gold)',
    completed: 'var(--green)',
    failed: 'var(--red)',
  }

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#c8a87a',
        marginBottom: '6px', letterSpacing: '1px',
      }}>
        ACTIVE QUESTS
      </div>

      {activeQuests.length === 0 ? (
        <div style={{ fontSize: '10px', color: '#7a6a5a', padding: '8px 0' }}>
          No active quests. Visit the bulletin board.
        </div>
      ) : (
        activeQuests.map((q) => (
          <div key={q.id} style={{
            padding: '6px', marginBottom: '4px',
            border: '1px solid #3a2a1a', background: 'rgba(10,8,4,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#e8e6f0' }}>{q.title}</span>
              <span style={{
                fontFamily: 'var(--font-pixel)', fontSize: '6px',
                color: STATUS_COLOR[q.status] || 'var(--text-dim)',
              }}>
                {q.status.toUpperCase()}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{
              height: '6px', background: '#0a0804', border: '1px solid #3a2a1a',
              marginTop: '4px',
            }}>
              <div style={{
                height: '100%', width: `${q.progress * 100}%`,
                background: 'var(--cyan)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginTop: '2px' }}>
              <span style={{ color: 'var(--gold)' }}>{q.reward_gold}G</span>
              {' + '}
              <span style={{ color: 'var(--green)' }}>{q.reward_xp}XP</span>
            </div>
          </div>
        ))
      )}

      {/* Quest history */}
      {completedEvents.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div
            onClick={() => setShowHistory(!showHistory)}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#8b7355',
              cursor: 'pointer', letterSpacing: '1px',
            }}
          >
            HISTORY {showHistory ? '▼' : '▶'}
          </div>
          {showHistory && completedEvents.map((e, i) => (
            <div key={`${e.ts}-${i}`} style={{
              fontSize: '9px', padding: '2px 0',
              color: e.type === 'quest_complete' ? 'var(--green)' : 'var(--red)',
              borderBottom: '1px solid #1a140c',
            }}>
              {(e.data as Record<string, string>).title || (e.data as Record<string, string>).quest_id}
              {e.type === 'quest_complete' ? ' — COMPLETED' : ' — FAILED'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/panels/QuestTracker.tsx
git commit -m "feat: add QuestTracker component with active quests, progress bars, and history"
```

---

### Task 12: Create GuildPanel and Replace QuestBoard

**Files:**
- Create: `src/panels/GuildPanel.tsx`
- Modify: `src/panels/CenterTabs.tsx`

- [ ] **Step 1: Create GuildPanel combining BulletinBoard + QuestTracker**

Create `src/panels/GuildPanel.tsx`:
```tsx
import BulletinBoard from './BulletinBoard'
import QuestTracker from './QuestTracker'

export default function GuildPanel() {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #0d0a08 0%, #1a120a 30%, #0d0a08 100%)',
      border: '1px solid #3a2a1a',
      padding: '6px',
      minHeight: '100%',
    }}>
      <BulletinBoard />
      <div style={{
        height: '3px', margin: '10px 0',
        background: 'linear-gradient(180deg, #5c3a1e 0%, #8b5e3c 40%, #5c3a1e 100%)',
        borderTop: '1px solid #a0764a',
        borderBottom: '1px solid #3a2210',
      }} />
      <QuestTracker />
    </div>
  )
}
```

- [ ] **Step 2: Update CenterTabs to use GuildPanel**

In `src/panels/CenterTabs.tsx`, change:
```tsx
// old
import QuestBoard from './QuestBoard'
// ...
{activeTab === 'guild' && <QuestBoard />}

// new
import GuildPanel from './GuildPanel'
// ...
{activeTab === 'guild' && <GuildPanel />}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add src/panels/GuildPanel.tsx src/panels/CenterTabs.tsx
git commit -m "feat: add GuildPanel (BulletinBoard + QuestTracker), replace QuestBoard in GUILD tab"
```

---

### Task 13: Full SubRegionGraph Implementation

**Files:**
- Modify: `src/panels/SubRegionGraph.tsx`

Replace the placeholder with the full implementation showing skills as landmarks with ink-drawn connections.

- [ ] **Step 1: Implement full SubRegionGraph**

Replace `src/panels/SubRegionGraph.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react'
import { SkillIcon } from '../utils/icons'
import type { Continent, Connection, SubRegion } from '../types'

interface Props {
  continent: Continent
  connections: Connection[]
  onBack: () => void
}

export default function SubRegionGraph({ continent, connections, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Collect all skills with positions
  const allSkills = continent.sub_regions.flatMap((sr) => sr.skills)
  const skillPositions = new Map<string, { x: number; y: number; subRegion: SubRegion }>()

  // Layout skills in a force-directed-ish pattern
  const padding = 60
  const centerX = size.w / 2
  const centerY = size.h / 2

  continent.sub_regions.forEach((sr, srIdx) => {
    const angle = (srIdx / continent.sub_regions.length) * Math.PI * 2
    const regionR = Math.min(size.w, size.h) * 0.28
    const regionCx = centerX + Math.cos(angle) * regionR
    const regionCy = centerY + Math.sin(angle) * regionR

    sr.skills.forEach((skill, skIdx) => {
      const skAngle = angle + ((skIdx - (sr.skills.length - 1) / 2) * 0.4)
      const skR = 30 + skIdx * 15
      skillPositions.set(skill, {
        x: regionCx + Math.cos(skAngle) * skR,
        y: regionCy + Math.sin(skAngle) * skR,
        subRegion: sr,
      })
    })
  })

  // Filter connections to those within this continent
  const localConnections = connections.filter(
    (c) => allSkills.includes(c.from) && allSkills.includes(c.to)
  )

  const selectedInfo = selectedSkill
    ? { skill: selectedSkill, ...skillPositions.get(selectedSkill)! }
    : null

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 2,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <button
          className="pixel-btn"
          onClick={onBack}
          style={{ fontSize: '6px', borderColor: '#5c3a1e', color: '#f0e68c', padding: '3px 6px' }}
        >
          BACK
        </button>
        <span style={{
          fontFamily: 'var(--font-pixel)', fontSize: '8px',
          color: continent.color, letterSpacing: '1px',
        }}>
          {continent.name}
        </span>
      </div>

      {/* SVG layer */}
      <svg width={size.w} height={size.h} style={{ position: 'absolute', inset: 0 }}>
        {/* Sub-region labels */}
        {continent.sub_regions.map((sr, srIdx) => {
          const angle = (srIdx / continent.sub_regions.length) * Math.PI * 2
          const regionR = Math.min(size.w, size.h) * 0.28
          const rx = centerX + Math.cos(angle) * regionR
          const ry = centerY + Math.sin(angle) * regionR - 25
          return (
            <text
              key={sr.id}
              x={rx} y={ry}
              textAnchor="middle"
              fontFamily="var(--font-pixel)"
              fontSize="5"
              fill="#8b7355"
              opacity="0.7"
            >
              {sr.name} ({Math.round(sr.mastery * 100)}%)
            </text>
          )
        })}

        {/* Connections — ink-drawn paths */}
        {localConnections.map((c, i) => {
          const from = skillPositions.get(c.from)
          const to = skillPositions.get(c.to)
          if (!from || !to) return null
          const mx = (from.x + to.x) / 2
          const my = (from.y + to.y) / 2 - 15
          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
              fill="none"
              stroke="#5c4a2a"
              strokeWidth="1"
              strokeDasharray={c.type === 'prerequisite' ? '4 2' : 'none'}
              opacity="0.6"
            />
          )
        })}

        {/* Skill landmarks */}
        {Array.from(skillPositions.entries()).map(([skill, pos]) => {
          const isSelected = selectedSkill === skill
          return (
            <g
              key={skill}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => setSelectedSkill(isSelected ? null : skill)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow for selected */}
              {isSelected && (
                <circle r="18" fill="none" stroke="#f0e68c" strokeWidth="1" opacity="0.5" />
              )}
              {/* Icon background */}
              <rect x="-10" y="-10" width="20" height="20" rx="2"
                fill="#1a140c" stroke={isSelected ? '#f0e68c' : '#3a2a1a'} strokeWidth="1" />
              {/* Skill identicon */}
              <foreignObject x="-8" y="-8" width="16" height="16">
                <SkillIcon name={skill} category={pos.subRegion.id} size={16} />
              </foreignObject>
              {/* Skill name below */}
              <text
                y="16" textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize="3.5" fill="#c8a87a"
              >
                {skill.replace(/-/g, ' ')}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Detail panel */}
      {selectedInfo && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          background: 'rgba(26,20,12,0.95)', border: '1px solid #5c3a1e',
          padding: '8px', zIndex: 3,
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#f0e68c' }}>
            {selectedInfo.skill.replace(/-/g, ' ')}
          </div>
          <div style={{ fontSize: '9px', color: '#8b7355', marginTop: '4px' }}>
            Region: {selectedInfo.subRegion.name} — Mastery: {Math.round(selectedInfo.subRegion.mastery * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: Clean

- [ ] **Step 3: Commit**

```bash
git add src/panels/SubRegionGraph.tsx
git commit -m "feat: implement SubRegionGraph with skill landmarks, ink-drawn connections, detail panel"
```

---

## Chunk 5: Bag Panel & Left Panel Restructure

### Task 14: Create BagPanel Component

**Files:**
- Create: `src/panels/BagPanel.tsx`

- [ ] **Step 1: Create BagPanel**

Create `src/panels/BagPanel.tsx`:
```tsx
import { useStore } from '../store'
import type { BagItem } from '../types'

const RARITY_COLOR: Record<string, string> = {
  common: '#6b7280',
  rare: 'var(--cyan)',
  epic: 'var(--purple)',
  legendary: 'var(--gold)',
}

/** Pixel art bag item icon */
function BagItemIcon({ type, size = 16 }: { type: string; size?: number }) {
  const s = size
  const v = s / 16 // scale factor
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {type === 'research_note' && <>
        <rect x="3" y="1" width="10" height="14" fill="#f5f5dc" />
        <rect x="3" y="1" width="10" height="2" fill="#daa520" />
        <rect x="5" y="5" width="6" height="1" fill="#8b7355" />
        <rect x="5" y="7" width="6" height="1" fill="#8b7355" />
        <rect x="5" y="9" width="4" height="1" fill="#8b7355" />
      </>}
      {type === 'training_report' && <>
        <rect x="2" y="2" width="12" height="12" fill="#2a4a6a" />
        <rect x="3" y="3" width="10" height="10" fill="#1a3a5a" />
        <rect x="5" y="5" width="2" height="5" fill="#4ecdc4" />
        <rect x="8" y="3" width="2" height="7" fill="#00ff88" />
        <rect x="11" y="6" width="2" height="4" fill="#ffe66d" />
      </>}
      {type === 'code_snippet' && <>
        <rect x="2" y="2" width="12" height="12" fill="#1a1a2e" />
        <rect x="3" y="4" width="3" height="1" fill="#a855f7" />
        <rect x="5" y="6" width="5" height="1" fill="#00ff88" />
        <rect x="4" y="8" width="4" height="1" fill="#4ecdc4" />
        <rect x="3" y="10" width="6" height="1" fill="#ff6b6b" />
      </>}
      {type === 'map_fragment' && <>
        <rect x="2" y="2" width="12" height="12" fill="#2a1f14" rx="1" />
        <rect x="4" y="4" width="3" height="3" fill="#5c3a1e" />
        <rect x="9" y="5" width="2" height="4" fill="#4a6fa5" />
        <line x1="5" y1="10" x2="10" y2="8" stroke="#8b7355" strokeWidth="0.8" />
      </>}
    </svg>
  )
}

export default function BagPanel() {
  const bagItems = useStore((s) => s.bagItems)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const toggleBagItem = useStore((s) => s.toggleBagItem)

  return (
    <div>
      {bagItems.length === 0 ? (
        <div style={{ fontSize: '9px', color: '#7a6a5a', textAlign: 'center', padding: '12px' }}>
          Complete quests to discover items.
        </div>
      ) : (
        <div className="skill-grid">
          {bagItems.map((item) => {
            const isSelected = selectedBagItems.includes(item.id)
            return (
              <div
                key={item.id}
                className={`skill-slot rarity-${item.rarity}`}
                title={`${item.name}\n${item.description}`}
                onClick={() => toggleBagItem(item.id)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(78,205,196,0.15)' : '#0a0a12',
                  borderColor: isSelected ? 'var(--cyan)' : RARITY_COLOR[item.rarity] || '#3a3850',
                  boxShadow: isSelected ? '0 0 8px rgba(78,205,196,0.3)' : undefined,
                }}
              >
                <BagItemIcon type={item.type} size={18} />
              </div>
            )
          })}
        </div>
      )}

      {/* Selected item hint */}
      {selectedBagItems.length > 0 && (
        <div style={{
          fontSize: '8px', color: 'var(--cyan)', marginTop: '4px',
          fontFamily: 'var(--font-pixel)',
        }}>
          {selectedBagItems.length} item(s) selected — mention in NPC chat
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/panels/BagPanel.tsx
git commit -m "feat: add BagPanel with item icons, selection for NPC context, rarity borders"
```

---

### Task 15: Create SkillPanel with SKILLS/BAG Sub-tabs

**Files:**
- Create: `src/panels/SkillPanel.tsx`
- Modify: `src/App.tsx` — swap SkillInventory for SkillPanel

- [ ] **Step 1: Create SkillPanel combining SkillInventory + BagPanel**

Create `src/panels/SkillPanel.tsx`:
```tsx
import { useState } from 'react'
import SkillInventory from './SkillInventory'
import BagPanel from './BagPanel'

type SubTab = 'skills' | 'bag'

export default function SkillPanel() {
  const [tab, setTab] = useState<SubTab>('skills')

  return (
    <div className="pixel-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
        <button
          className="pixel-btn"
          onClick={() => setTab('skills')}
          style={{
            fontSize: '6px', padding: '3px 8px', flex: 1,
            borderColor: tab === 'skills' ? 'var(--gold)' : 'var(--border)',
            color: tab === 'skills' ? 'var(--gold)' : 'var(--text-dim)',
            background: tab === 'skills' ? 'var(--highlight)' : undefined,
          }}
        >
          SKILLS
        </button>
        <button
          className="pixel-btn"
          onClick={() => setTab('bag')}
          style={{
            fontSize: '6px', padding: '3px 8px', flex: 1,
            borderColor: tab === 'bag' ? 'var(--gold)' : 'var(--border)',
            color: tab === 'bag' ? 'var(--gold)' : 'var(--text-dim)',
            background: tab === 'bag' ? 'var(--highlight)' : undefined,
          }}
        >
          BAG
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'skills' ? <SkillInventory /> : <BagPanel />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update App.tsx to use SkillPanel**

In `src/App.tsx`, change:
```tsx
// old
import SkillInventory from './panels/SkillInventory'
// ...
<SkillInventory />

// new
import SkillPanel from './panels/SkillPanel'
// ...
<SkillPanel />
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc -b --noEmit`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add src/panels/SkillPanel.tsx src/App.tsx
git commit -m "feat: add SkillPanel with SKILLS/BAG sub-tabs, replace SkillInventory in layout"
```

---

## Chunk 6: Backend API Endpoints (Server-Side)

### Task 16: Add Backend API Endpoints

**Files (on server via SSH):**
- Modify: `/opt/hermes-quest/main.py`
- Modify: `/opt/hermes-quest/watcher.py`
- Modify: `/opt/hermes-quest/ws_manager.py`

> **Note:** These changes are on the remote server (YOUR_SERVER_IP). Execute via SSH.
> SSH: `ssh -i YOUR_PEM_PATH root@YOUR_SERVER_IP`

- [ ] **Step 1: Read current main.py to understand existing structure**

```bash
ssh -i YOUR_PEM_PATH root@YOUR_SERVER_IP "cat /opt/hermes-quest/main.py"
```

- [ ] **Step 2: Add `/api/map` endpoint**

Add to `main.py` (top-level imports):
```python
import json
import uuid
import datetime
from pathlib import Path

MAP_FILE = Path.home() / ".hermes" / "quest" / "knowledge-map.json"

@app.get("/api/map")
async def get_map():
    if not MAP_FILE.exists():
        return JSONResponse(status_code=404, content={"error": "no_map_data"})
    return json.loads(MAP_FILE.read_text())
```

- [ ] **Step 3: Add `/api/quest/accept` and `/api/quest/active` endpoints**

Add to `main.py`:
```python
QUESTS_FILE = Path.home() / ".hermes" / "quest" / "quests.json"

def read_quests():
    if QUESTS_FILE.exists():
        return json.loads(QUESTS_FILE.read_text())
    return []

def write_quests(quests):
    QUESTS_FILE.write_text(json.dumps(quests, indent=2))

@app.get("/api/quest/active")
async def get_active_quests():
    quests = read_quests()
    active = [q for q in quests if q.get("status") in ("active", "in_progress")]
    return {"quests": active}

@app.post("/api/quest/accept")
async def accept_quest(body: dict):
    quests = read_quests()
    quest_id = body.get("quest_id")

    if quest_id:
        # Check if already accepted
        if any(q["id"] == quest_id for q in quests):
            return JSONResponse(status_code=409, content={"error": "quest_already_accepted"})
        # Find in recommended quests from map
        if MAP_FILE.exists():
            map_data = json.loads(MAP_FILE.read_text())
            rec = next((q for q in map_data.get("recommended_quests", []) if q["id"] == quest_id), None)
            if rec:
                new_quest = {
                    **rec,
                    "id": f"quest-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}",
                    "status": "active",
                    "progress": 0.0,
                    "accepted_at": datetime.datetime.now().isoformat(),
                    "completed_at": None,
                    "source": "bulletin_board",
                }
                quests.append(new_quest)
                write_quests(quests)
                return {"quest_id": new_quest["id"], "status": "active"}
        return JSONResponse(status_code=404, content={"error": "quest_not_found"})

    fog_region_id = body.get("fog_region_id")
    if fog_region_id:
        # Generate quest from fog region
        if MAP_FILE.exists():
            map_data = json.loads(MAP_FILE.read_text())
            fog = next((f for f in map_data.get("fog_regions", []) if f["id"] == fog_region_id), None)
            if fog:
                new_quest = {
                    "id": f"quest-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}",
                    "title": f"Explore: {fog['hint']}",
                    "description": fog.get("discovery_condition", "Explore this unknown region"),
                    "region": "unknown",
                    "rank": "B",
                    "status": "active",
                    "progress": 0.0,
                    "reward_gold": 200,
                    "reward_xp": 250,
                    "related_skills": [],
                    "accepted_at": datetime.datetime.now().isoformat(),
                    "completed_at": None,
                    "source": "map_exploration",
                }
                quests.append(new_quest)
                write_quests(quests)
                return {"quest_id": new_quest["id"], "status": "active"}
        return JSONResponse(status_code=404, content={"error": "fog_region_not_found"})

    return JSONResponse(status_code=400, content={"error": "missing_quest_id_or_fog_region_id"})
```

- [ ] **Step 4: Add `/api/bag/items` endpoint**

Add to `main.py`:
```python
COMPLETIONS_DIR = Path.home() / ".hermes" / "quest" / "completions"

@app.get("/api/bag/items")
async def get_bag_items():
    items = []
    if COMPLETIONS_DIR.exists():
        for f in sorted(COMPLETIONS_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if f.suffix == ".md":
                items.append({
                    "id": f"completion-{f.stem}",
                    "type": "research_note",
                    "name": f.stem.replace("-", " ").title(),
                    "description": f.read_text()[:200] if f.stat().st_size > 0 else "",
                    "source_quest": None,
                    "created_at": datetime.datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
                    "file_path": str(f),
                    "icon": "scroll",
                    "rarity": "common",
                })
    return {"items": items[:50]}
```

- [ ] **Step 5: Add `/api/npc/chat` placeholder endpoint**

Add to `main.py` (full AI integration will be implemented when Map Agent is ready):
```python
@app.post("/api/npc/chat")
async def npc_chat(body: dict):
    npc = body.get("npc", "guild_master")
    message = body.get("message", "")

    valid_npcs = ["guild_master", "cartographer", "quartermaster"]
    if npc not in valid_npcs:
        return JSONResponse(status_code=400, content={"error": "invalid_npc"})

    # Placeholder responses until AI integration
    npc_greetings = {
        "guild_master": "Welcome, adventurer. The guild stands ready to assist you.",
        "cartographer": "Ah, a fellow seeker of knowledge. What domain intrigues you?",
        "quartermaster": "Looking for supplies? I've got everything an adventurer needs.",
    }

    return {
        "reply": npc_greetings.get(npc, "..."),
        "actions": [],
        "npc_mood": "friendly",
    }
```

- [ ] **Step 6: Read current watcher.py and ws_manager.py**

```bash
ssh -i YOUR_PEM_PATH root@YOUR_SERVER_IP "cat /opt/hermes-quest/watcher.py"
ssh -i YOUR_PEM_PATH root@YOUR_SERVER_IP "cat /opt/hermes-quest/ws_manager.py"
```

Then update watcher.py to also watch `~/.hermes/quest/knowledge-map.json` and `~/.hermes/quest/quests.json`. When these files change, read them and broadcast:
- For `knowledge-map.json`: broadcast `{"type": "map", "data": <file contents>}`
- For `quests.json`: broadcast `{"type": "quest", "data": {"changed": true}}`

- [ ] **Step 7: Update ws_manager.py if needed**

The ws_manager should already support broadcasting arbitrary JSON messages. Verify the `broadcast` function accepts any dict. If it filters by message type, add `'map'`, `'quest'`, and `'bag'` to allowed types.

- [ ] **Step 8: Restart the backend service**

```bash
ssh -i YOUR_PEM_PATH root@YOUR_SERVER_IP "systemctl restart hermes-quest"
```

- [ ] **Step 9: Test endpoints**

```bash
# Test map endpoint (404 expected if no map yet)
curl http://YOUR_SERVER_IP:8000/api/map

# Test NPC chat
curl -X POST http://YOUR_SERVER_IP:8000/api/npc/chat \
  -H "Content-Type: application/json" \
  -d '{"npc":"guild_master","message":"hello","context":{"active_tab":"guild","selected_bag_items":[],"selected_region":null}}'

# Test quest active
curl http://YOUR_SERVER_IP:8000/api/quest/active

# Test bag items
curl http://YOUR_SERVER_IP:8000/api/bag/items
```

- [ ] **Step 10: Commit backend changes**

```bash
ssh -i YOUR_PEM_PATH root@YOUR_SERVER_IP "cd /opt/hermes-quest && git add -A && git commit -m 'feat: add map, quest, bag, npc API endpoints'"
```

---

## Chunk 7: Cleanup & Build Verification

### Task 17: Remove Unused Components and Clean Up Imports

**Files:**
- Delete: `src/panels/ReflectionBar.tsx` (no longer imported)
- Delete: `src/panels/WorldMap.tsx` (replaced by KnowledgeMap)
- Delete: `src/panels/QuestBoard.tsx` (replaced by GuildPanel)
- Verify all imports are clean

- [ ] **Step 1: Verify ReflectionBar is no longer imported anywhere**

```bash
cd /Users/nemo/Documents/project/hermes/hermes-quest-dashboard
grep -r "ReflectionBar" src/
```
Expected: No results (already removed from App.tsx in Task 6)

- [ ] **Step 2: Verify WorldMap is no longer imported (replaced by KnowledgeMap)**

```bash
grep -r "WorldMap" src/
```
Expected: No results. If none found, delete `src/panels/WorldMap.tsx`.

- [ ] **Step 3: Verify QuestBoard is no longer imported (replaced by GuildPanel)**

```bash
grep -r "QuestBoard" src/
```
Expected: No results. If none found, delete `src/panels/QuestBoard.tsx`.

- [ ] **Step 4: Run full type check**

Run: `npx tsc -b --noEmit`
Expected: Clean

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 6: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 7: Commit cleanup**

```bash
git add -A
git commit -m "chore: verify clean build — all components wired, types pass, tests pass"
```

---

### Task 18: Deploy and Visual Verification

- [ ] **Step 1: Build the production bundle**

```bash
cd /Users/nemo/Documents/project/hermes/hermes-quest-dashboard
npm run build
```

- [ ] **Step 2: Deploy to server**

```bash
scp -i YOUR_PEM_PATH -r dist/* root@YOUR_SERVER_IP:/opt/hermes-quest/static/
```

- [ ] **Step 3: Verify in browser**

Open the dashboard URL. Check:
- [ ] MAP tab shows parchment background (empty state if no map data yet)
- [ ] GUILD tab shows bulletin board + quest tracker
- [ ] SHOP tab shows skill tavern (unchanged)
- [ ] NPC dialog bar at bottom of center with 3 portraits
- [ ] Left panel: Character stats show STABILITY/ENERGY labels
- [ ] Left panel: SKILLS/BAG sub-tabs work
- [ ] Right panel: Adventure log works as before
- [ ] No ReflectionBar at bottom

- [ ] **Step 4: Final commit with any fixes**

```bash
git add -A
git commit -m "feat: complete Knowledge Map v2 initial implementation"
```
