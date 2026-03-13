import { create } from 'zustand'

export interface AgentState {
  version: number
  name: string
  level: number
  class: string
  title: string
  xp: number
  xp_to_next: number
  hp: number
  hp_max: number
  mp: number
  mp_max: number
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
  total_boss_kills: number
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

export interface Region {
  id: string
  name: string
  domain: string
  boss: string | null
  unlocked: boolean
  cleared: boolean
  current: boolean
}

interface Store {
  state: AgentState | null
  events: GameEvent[]
  skills: Skill[]
  regions: Region[]
  connected: boolean
  setState: (s: AgentState) => void
  addEvent: (e: GameEvent) => void
  setEvents: (e: GameEvent[]) => void
  setSkills: (s: Skill[]) => void
  setRegions: (r: Region[]) => void
  setConnected: (c: boolean) => void
}

export const useStore = create<Store>((set) => ({
  state: null,
  events: [],
  skills: [],
  regions: [],
  connected: false,
  setState: (s) => set({ state: s }),
  addEvent: (e) => set((prev) => {
    // Deduplicate by ts+type
    const key = `${e.ts}-${e.type}`
    if (prev.events.some((x) => `${x.ts}-${x.type}` === key)) return prev
    return { events: [e, ...prev.events].slice(0, 200) }
  }),
  setEvents: (e) => set({ events: e }),
  setSkills: (s) => set({ skills: s }),
  setRegions: (r) => set({ regions: r }),
  setConnected: (c) => set({ connected: c }),
}))
