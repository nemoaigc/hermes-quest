import { create } from 'zustand'
import type {
  KnowledgeMap, Quest, BagItem, TabId, Workflow,
} from './types'

export interface AgentState {
  version: number
  name: string
  level: number
  class: string
  title: string
  xp: number
  xp_to_next: number
  // v2: HP = stability (objective reliability)
  hp: number
  hp_max: number
  // v2: MP = morale (subjective confidence)
  mp: number
  mp_max: number
  // v2: global understanding
  understanding: number // 0-100 (percentage), -1 = calibrating
  skills_count: number
  skill_distribution: Record<string, number>
  inventory: Array<Record<string, unknown>>
  total_cycles: number
  total_corrections: number
  total_positive_signals: number
  workflows_discovered: number
  started_at: string | null
  last_cycle_at: string | null
  last_interaction_at: string | null
  reflection_letter_pending: boolean
  // v1 compat (mapped from v2 fields)
  stability: number
  stability_max: number
  energy: number
  energy_max: number
  gold: number
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

  // Shop: shared hub skills + filter (shared between Shop scene + bottom bar)
  hubSkills: HubSkill[]
  setHubSkills: (s: HubSkill[]) => void
  shopFilter: string
  shopSourceFilter: string | null
  shopPage: number
  setShopFilter: (f: string) => void
  setShopSourceFilter: (s: string | null) => void
  setShopPage: (p: number) => void

  // Existing actions
  setState: (s: AgentState) => void
  addEvent: (e: GameEvent) => void
  setEvents: (e: GameEvent[]) => void
  setSkills: (s: Skill[]) => void
  setConnected: (c: boolean) => void

  // New actions
  setKnowledgeMap: (m: KnowledgeMap | null | Record<string, unknown>) => void
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
  hubSkills: [],
  setHubSkills: (s) => set({ hubSkills: s }),
  shopFilter: '',
  shopSourceFilter: null,
  shopPage: 0,
  setShopFilter: (f) => set({ shopFilter: f, shopPage: 0 }),
  setShopSourceFilter: (s) => set({ shopSourceFilter: s, shopPage: 0 }),
  setShopPage: (p) => set({ shopPage: p }),

  setState: (s) => {
    // v2→v1 compat: map new field names to old ones for components not yet migrated
    const compat = {
      ...s,
      stability: s.hp ?? s.stability ?? 0,
      stability_max: s.hp_max ?? s.stability_max ?? 100,
      energy: s.mp ?? s.energy ?? 0,
      energy_max: s.mp_max ?? s.energy_max ?? 100,
      gold: s.gold ?? 0,
      hp: s.hp ?? s.stability ?? 0,
      hp_max: s.hp_max ?? s.stability_max ?? 100,
      mp: s.mp ?? s.energy ?? 0,
      mp_max: s.mp_max ?? s.energy_max ?? 100,
      understanding: s.understanding ?? 0,
    }
    set({ state: compat })
  },
  addEvent: (e) => set((prev) => {
    const dataFp = e.data ? JSON.stringify(e.data).slice(0, 60) : ''
    const key = `${e.ts}-${e.type}-${dataFp}`
    if (prev.events.some((x) => `${x.ts}-${x.type}-${(x.data ? JSON.stringify(x.data).slice(0, 60) : '')}` === key)) return prev
    return { events: [e, ...prev.events].slice(0, 200) }
  }),
  setEvents: (e) => set({ events: e }),
  setSkills: (s) => set({ skills: s }),
  setConnected: (c) => set({ connected: c }),

  setKnowledgeMap: (m) => {
    if (!m) { set({ knowledgeMap: null }); return }
    // v2 compat: map 'workflows' to 'continents' alias for components using old field
    const raw = m as KnowledgeMap & { continents?: Workflow[] }
    const km = { ...raw }
    if (km.workflows && !km.continents) {
      km.continents = km.workflows
    }
    set({ knowledgeMap: km as KnowledgeMap })
  },
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
