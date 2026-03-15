import type { NpcId } from '../types'

export interface NpcData {
  id: NpcId
  name: string
  title: string
  img: string
}

export const NPCS: NpcData[] = [
  { id: 'guild_master', name: 'Lyra', title: 'Guild Master', img: '/npc/guild-master.png' },
  { id: 'cartographer', name: 'Aldric', title: 'Cartographer', img: '/npc/cartographer.png' },
  { id: 'quartermaster', name: 'Kael', title: 'Quartermaster', img: '/npc/quartermaster.png' },
  { id: 'bartender' as NpcId, name: 'Gus', title: 'Bartender', img: '/npc/bartender.png' },
  { id: 'sage' as NpcId, name: 'Orin', title: 'Sage', img: '/npc/sage.png' },
]

export const NPC_BIOS: Record<string, { lore: string; trait: string }> = {
  guild_master: {
    lore: 'Once a legendary adventurer herself, Lyra retired to manage the guild after a fateful expedition. She has an eye for potential and knows exactly which quest will push you to grow.',
    trait: 'Assigns quests \u00B7 Evaluates progress',
  },
  cartographer: {
    lore: 'Aldric has mapped every corner of the known world and several that shouldn\'t exist. His spectacles see not just places, but the connections between all things.',
    trait: 'Maps knowledge \u00B7 Finds weak spots',
  },
  quartermaster: {
    lore: 'Kael earned her silver hair in battle, not from age. She knows every weapon, tool, and skill in the armory \u2014 and exactly which one you need.',
    trait: 'Manages skills \u00B7 Recommends gear',
  },
  bartender: {
    lore: 'Gus hears everything. Every boast, every whisper, every secret spilled over a drink. He remembers it all and shares only what matters.',
    trait: 'Shares gossip \u00B7 Tells stories',
  },
  sage: {
    lore: 'No one knows how old Orin truly is. Some say he\'s read every book ever written. When the world feels too complex, his wisdom cuts through the fog.',
    trait: 'Deep analysis \u00B7 Reflection',
  },
}

export function npcGreeting(npc: NpcData): string {
  const greetings: Record<string, string> = {
    guild_master: "Welcome, adventurer~ Looking for a quest? I've got some interesting ones today...",
    cartographer: "Ah, a fellow seeker of knowledge. What domain shall we explore?",
    quartermaster: "Need gear? I've got the best equipment this side of the realm.",
    bartender: "What'll it be? Pull up a stool and tell me what's on your mind.",
    sage: "I sense you seek wisdom... Ask, and I shall peer into the depths of knowledge.",
  }
  return greetings[npc.id] || `${npc.name} nods at you.`
}

export function npcSuggestions(npc: NpcData): string[] {
  const suggestions: Record<string, string[]> = {
    guild_master: ["What quests are available?", "How's my progress?", "Any urgent tasks?"],
    cartographer: ["Show me unexplored regions", "What should I learn next?", "Map my skills"],
    quartermaster: ["What skills should I acquire?", "Evaluate my inventory", "Best gear for me?"],
    bartender: ["Tell me a story", "Any gossip today?", "What's happening in the realm?"],
    sage: ["Analyze my growth", "Deep research on AI", "What's my weakness?"],
  }
  return suggestions[npc.id] || ["Hello", "Tell me more"]
}
