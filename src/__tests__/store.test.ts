import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store'
import type { KnowledgeMap, Quest, BagItem } from '../types'

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

  it('AgentState maps stability/energy to hp/mp (v2 compat)', () => {
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
    // v2 compat: stability/energy are mapped to hp/mp and vice versa
    expect(s.stability).toBe(80)
    expect(s.energy).toBe(60)
    expect(s.hp).toBe(80)
    expect(s.hp_max).toBe(100)
    expect(s.mp).toBe(60)
    expect(s.mp_max).toBe(80)
    expect(s.gold).toBe(250)
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
      id: 'q1', title: 'Test', description: '',
      status: 'active', progress: 0, reward_xp: 100,
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
