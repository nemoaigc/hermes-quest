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
