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
  quest: RecommendedQuest
}

export interface NpcChatResponse {
  reply: string
  actions: NpcAction[]
  npc_mood: NpcMood
}
