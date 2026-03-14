// --- Knowledge Map v2 ---

export interface SubNode {
  id: string
  name: string
  mastery: number // 0.0–1.0
}

export interface Workflow {
  id: string
  name: string // fantasy name
  description: string // real description
  category: 'coding' | 'research' | 'automation' | 'creative'
  color?: string // hex, for v1 compat
  size?: number // for v1 compat
  position: { x: number; y: number } // normalized 0–1
  discovered_at: string
  last_active: string
  interaction_count: number
  correction_count: number
  mastery: number // 0.0–1.0
  skills_involved: string[]
  sub_nodes: SubNode[]
  // v1 compat
  sub_regions?: SubNode[]
}

export type ConnectionType = 'workflow' | 'complementary' | 'prerequisite'

export interface Connection {
  from: string
  to: string
  type?: ConnectionType
  strength: number // 0–1
}

export interface FogRegion {
  id: string
  hint: string
  position?: { x: number; y: number }
  discovery_condition?: string
  first_seen?: string
  last_seen?: string
  occurrence_count?: number
}

export interface KnowledgeMap {
  version: number
  generated_at: string
  workflows: Workflow[]
  connections: Connection[]
  fog_regions: FogRegion[]
  // v1 compat alias (set by store)
  continents?: Workflow[]
  recommended_quests?: Quest[]
}

// v1 compat aliases (for components not yet migrated)
export type Continent = Workflow
export type SubRegion = SubNode
export type RecommendedQuest = Quest

// --- Quests / Learning Tasks ---

export type QuestStatus = 'pending' | 'accepted' | 'active' | 'in_progress' | 'completed' | 'failed'
export type QuestSource = 'user' | 'agent' | 'bulletin_board' | 'npc_dialog' | 'map_exploration'

export interface Quest {
  id: string
  title: string
  description: string
  workflow_id?: string | null
  status: QuestStatus
  progress: number // 0.0–1.0
  reward_xp: number
  reward_gold?: number
  rank?: string
  region?: string
  related_skills: string[]
  accepted_at: string
  completed_at: string | null
  source: QuestSource
}

// --- Bag Items ---

export type BagItemType = 'research_note' | 'training_report' | 'code_snippet' | 'map_fragment' | 'reflection_letter'
export type BagItemIcon = 'scroll' | 'book' | 'code' | 'map'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface BagItem {
  id: string
  type: BagItemType
  name: string
  description: string
  workflow_id?: string | null
  source_quest: string | null
  created_at: string
  file_path: string
  icon: BagItemIcon
  rarity: Rarity
}

// --- NPC Dialog ---

export type NpcId = 'guild_master' | 'cartographer' | 'quartermaster' | 'bartender' | 'sage'
export type NpcMood = 'friendly' | 'serious' | 'excited'
export type TabId = 'map' | 'guild' | 'shop' | 'npc'

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
  quest: Quest
}

export interface NpcChatResponse {
  reply: string
  actions: NpcAction[]
  npc_mood: NpcMood
}

// --- Learning Feed ---

export interface LearningEvent {
  id: string
  type: 'workflow_discover' | 'skill_drop' | 'reflect' | 'correction_signal' | 'positive_signal'
  ts: string
  data: Record<string, unknown>
  feedback?: 'up' | 'down' | null
}
