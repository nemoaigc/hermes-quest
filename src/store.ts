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
